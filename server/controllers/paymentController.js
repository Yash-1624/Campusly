const mongoose = require("mongoose");
const Registration = require("../models/Registration");
const Payment = require("../models/Payment");

const {
    createRazorpayOrder,
    verifyRazorpayPayment,
} = require("../services/paymentService");

const {
    createTicketForRegistration,
} = require("../services/ticketService");
const { sendRegistrationConfirmationEmail } = require("../services/emailService");

const sendRegistrationConfirmation = async ({ registration, payment, ticket }) => {
    const student = registration.student;
    const event = registration.event;
    const email = registration.contactInformation?.email || student?.email;
    if (!email) return;

    try {
        await sendRegistrationConfirmationEmail({ email, student, event, registration, payment, ticket });
    } catch (emailError) {
        // Payment and ticket status stay valid when the mail provider is unavailable.
        console.error("REGISTRATION CONFIRMATION EMAIL ERROR:", emailError.message);
    }
};

// ========================================
// CREATE PAYMENT ORDER
// ========================================
const createPayment = async (req, res) => {
    try {
        const { registrationId } = req.body;

        if (!registrationId || !mongoose.Types.ObjectId.isValid(registrationId)) {
            return res.status(400).json({
                success: false,
                message: "A valid registration ID is required.",
            });
        }

        const registration = await Registration.findById(registrationId)
            .populate("event")
            .populate("student");

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: "Registration not found.",
            });
        }

        // Authorization check
        if (
            registration.student._id.toString() !== req.user._id.toString() &&
            req.user.role !== "admin"
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to pay for this registration.",
            });
        }

        if (!registration.event) {
            return res.status(404).json({
                success: false,
                message: "Event not found for this registration.",
            });
        }

        const amount = Number(registration.event.fee || 0);

        if (!Number.isFinite(amount) || amount < 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid event fee.",
            });
        }

        const student = registration.student;
        const registrationStudent = registration.studentInformation || {};
        const registrationContact = registration.contactInformation || {};

        const studentName =
            registrationStudent.fullName || student.fullName || "";
        const studentEmail =
            registrationContact.email || student.email || "";

        // ========================================
        // FREE EVENT
        // ========================================
        if (amount === 0) {
            registration.registrationStatus = "Confirmed";
            registration.payment = {
                ...(registration.payment?.toObject?.() || registration.payment || {}),
                status: "Successful",
            };

            await registration.save();

            let ticket = null;

            try {
                ticket = await createTicketForRegistration(registration._id);
            } catch (ticketError) {
                console.error("FREE EVENT TICKET ERROR:", ticketError);
            }

            await sendRegistrationConfirmation({
                registration,
                payment: { status: "Successful", amount: 0, transactionId: "FREE" },
                ticket,
            });

            return res.status(200).json({
                success: true,
                freeEvent: true,
                message: "Free event registration confirmed.",
                registrationId: registration._id,
                registration,
                ticket,
            });
        }

        // ========================================
        // FIND OR CREATE PAYMENT RECORD
        // ========================================
        let payment = await Payment.findOne({
            registration: registration._id,
        });

        if (payment?.status === "Successful") {
            return res.status(400).json({
                success: false,
                message: "This registration has already been paid for.",
            });
        }

        if (!payment) {
            try {
                payment = await Payment.create({
                    registration: registration._id,
                    student: student._id,
                    amount,
                    currency: "INR",
                    paymentMethod: "RAZORPAY",
                    gateway: "RAZORPAY",
                    status: "Pending",
                });
            } catch (createError) {
                // Handle concurrent requests for the same registration
                if (createError.code !== 11000) {
                    throw createError;
                }

                payment = await Payment.findOne({
                    registration: registration._id,
                });

                if (!payment) {
                    throw createError;
                }
            }
        }

        // Double-check after possible concurrent creation
        if (payment.status === "Successful") {
            return res.status(400).json({
                success: false,
                message: "This registration has already been paid for.",
            });
        }

        // Reset / update payment record
        payment.amount = amount;
        payment.currency = "INR";
        payment.status = "Pending";
        await payment.save();

        // ========================================
        // CREATE RAZORPAY ORDER
        // ========================================
        const order = await createRazorpayOrder({
            amount,
            receipt: String(registration.registrationId || registration._id),
            notes: {
                registrationId: registration._id.toString(),
                studentId: student._id.toString(),
                eventId: registration.event._id.toString(),
            },
        });

        if (!order?.id) {
            throw new Error("Razorpay did not return an order ID.");
        }

        payment.razorpayOrderId = order.id;
        await payment.save();

        // Update registration payment status
        registration.payment = {
            ...(registration.payment?.toObject?.() || registration.payment || {}),
            status: "Pending",
            paymentId: payment._id,
        };
        await registration.save();

        // ========================================
        // RESPONSE EXPECTED BY Payment.jsx
        // ========================================
        return res.status(200).json({
            success: true,
            freeEvent: false,
            message: "Payment order created successfully.",

            registration: {
                _id: registration._id,
                registrationId: registration.registrationId,

                event: {
                    _id: registration.event._id,
                    name: registration.event.name,
                    fee: registration.event.fee,
                },

                studentInformation: {
                    fullName: studentName,
                    collegePid:
                        registrationStudent.collegePid || student.collegePid || "",
                },

                contactInformation: {
                    email: studentEmail,
                },
            },

            payment: {
                _id: payment._id,
                amount: payment.amount,
                currency: payment.currency,
                status: payment.status,
            },

            razorpay: {
                keyId: process.env.RAZORPAY_KEY_ID,
                orderId: order.id,
                amount: order.amount,
                currency: order.currency || "INR",
            },
        });
    } catch (error) {
        console.error("CREATE PAYMENT ERROR:", error);

        const gatewayMessage =
            error?.error?.description ||
            error?.description ||
            error?.message;

        return res.status(502).json({
            success: false,
            message: gatewayMessage
                ? `Could not start checkout: ${gatewayMessage}`
                : "Could not start checkout. Please try again.",
        });
    }
};

// ========================================
// VERIFY PAYMENT
// ========================================
const verifyPayment = async (req, res) => {
    try {
        const {
            registrationId,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = req.body;

        if (
            !registrationId ||
            !mongoose.Types.ObjectId.isValid(registrationId) ||
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {
            return res.status(400).json({
                success: false,
                message: "Required payment verification details are missing.",
            });
        }

        const registration = await Registration.findById(registrationId)
            .populate("event")
            .populate("student");

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: "Registration not found.",
            });
        }

        // Authorization check
        if (
            registration.student._id.toString() !== req.user._id.toString() &&
            req.user.role !== "admin"
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to verify this payment.",
            });
        }

        const payment = await Payment.findOne({
            registration: registration._id,
        }).select("+razorpaySignature");

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment record not found.",
            });
        }

        // Already verified
        if (payment.status === "Successful") {
            return res.status(200).json({
                success: true,
                message: "Payment has already been verified.",
                registrationId: registration._id,
            });
        }

        // Order ID mismatch
        if (payment.razorpayOrderId !== razorpay_order_id) {
            return res.status(400).json({
                success: false,
                message: "Razorpay order ID does not match.",
            });
        }

        // Signature verification
        const isValid = verifyRazorpayPayment({
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        });

        if (!isValid) {
            payment.status = "Failed";
            await payment.save();

            return res.status(400).json({
                success: false,
                message: "Payment signature verification failed.",
            });
        }

        // Mark payment as successful
        payment.razorpayPaymentId = razorpay_payment_id;
        payment.razorpaySignature = razorpay_signature;
        payment.transactionId = razorpay_payment_id;
        payment.status = "Successful";
        await payment.save();

        // Update registration
        registration.registrationStatus = "Confirmed";
        registration.payment = {
            ...(registration.payment?.toObject?.() || registration.payment || {}),
            status: "Successful",
            paymentId: payment._id,
        };
        await registration.save();

        // Create ticket
        let ticket = null;

        try {
            ticket = await createTicketForRegistration(registration._id);
        } catch (ticketError) {
            console.error("TICKET CREATION ERROR:", ticketError);
        }

        await sendRegistrationConfirmation({ registration, payment, ticket });

        return res.status(200).json({
            success: true,
            message: "Payment verified successfully.",
            payment,
            registration,
            ticket,
        });
    } catch (error) {
        console.error("VERIFY PAYMENT ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to verify payment.",
            error: error.message,
        });
    }
};

module.exports = {
    createPayment,
    verifyPayment,
};
