const mongoose = require("mongoose");

const Registration = require("../models/Registration");
const Payment = require("../models/Payment");

const {
    createRazorpayOrder,
    verifyRazorpayPayment
} = require("../services/paymentService");

const {
    createTicketForRegistration
} = require("../services/ticketService");


// =====================================================
// CREATE PAYMENT
// =====================================================
const createPayment = async (req, res) => {
    try {
        const { registrationId } = req.body;

        console.log("CREATE PAYMENT REQUEST:", {
            registrationId,
            userId: req.user?._id
        });

        if (!registrationId) {
            return res.status(400).json({
                success: false,
                message: "Registration ID is required"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(registrationId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid registration ID"
            });
        }

        const registration = await Registration.findById(
            registrationId
        ).populate("event");

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: "Registration not found"
            });
        }

        // Make sure the logged-in student owns this registration
        if (
            registration.student.toString() !==
            req.user._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to pay for this registration"
            });
        }

        if (!registration.event) {
            return res.status(400).json({
                success: false,
                message: "Event not found for this registration"
            });
        }

        const amount = Number(registration.event.fee || 0);

        console.log("Event:", registration.event.name);
        console.log("Event fee:", amount);

        // -------------------------------------------------
        // FREE EVENT
        // -------------------------------------------------
        if (amount <= 0) {
            registration.registrationStatus = "Confirmed";
            registration.payment.status = "Successful";

            await registration.save();

            const ticket = await createTicketForRegistration(
                registration._id
            );

            return res.status(200).json({
                success: true,
                message: "Registration confirmed successfully",
                freeEvent: true,
                ticket
            });
        }

        // -------------------------------------------------
        // CHECK EXISTING PAYMENT
        // -------------------------------------------------
        let payment = await Payment.findOne({
            registration: registration._id
        });

        if (
            payment &&
            payment.status === "Successful"
        ) {
            return res.status(400).json({
                success: false,
                message: "Payment has already been completed"
            });
        }

        // -------------------------------------------------
        // CREATE PAYMENT DOCUMENT
        // -------------------------------------------------
        if (!payment) {
            payment = await Payment.create({
                registration: registration._id,
                student: registration.student,
                event: registration.event._id,
                amount,
                currency: "INR",
                status: "Pending"
            });
        } else {
            payment.amount = amount;
            payment.status = "Pending";
            await payment.save();
        }

        // -------------------------------------------------
        // CREATE RAZORPAY ORDER
        // -------------------------------------------------
        const order = await createRazorpayOrder({
            amount,
            receipt: registration.registrationId,
            notes: {
                registrationId: registration._id.toString(),
                studentId: registration.student.toString(),
                eventId: registration.event._id.toString()
            }
        });

        console.log("RAZORPAY ORDER CREATED:", order.id);

        payment.orderId = order.id;
        await payment.save();

        registration.payment = {
            status: "Pending",
            paymentId: payment._id
        };

        await registration.save();

        return res.status(200).json({
            success: true,
            message: "Payment order created",
            key: process.env.RAZORPAY_KEY_ID,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            registrationId: registration._id
        });

    } catch (error) {
        console.error("========================================");
        console.error("CREATE RAZORPAY PAYMENT ERROR");
        console.error("Message:", error.message);
        console.error("Stack:", error.stack);
        console.error("Full Error:", error);
        console.error("========================================");

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to create payment order"
        });
    }
};


// =====================================================
// VERIFY PAYMENT
// =====================================================
const verifyPayment = async (req, res) => {
    try {
        const {
            registrationId,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        if (
            !registrationId ||
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {
            return res.status(400).json({
                success: false,
                message: "Payment verification data is incomplete"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(registrationId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid registration ID"
            });
        }

        const registration = await Registration.findById(
            registrationId
        ).populate("event");

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: "Registration not found"
            });
        }

        if (
            registration.student.toString() !==
            req.user._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to verify this payment"
            });
        }

        const payment = await Payment.findOne({
            registration: registration._id
        });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment record not found"
            });
        }

        if (payment.orderId !== razorpay_order_id) {
            return res.status(400).json({
                success: false,
                message: "Payment order ID does not match"
            });
        }

        const isValid = verifyRazorpayPayment({
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            signature: razorpay_signature
        });

        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment signature"
            });
        }

        payment.paymentId = razorpay_payment_id;
        payment.signature = razorpay_signature;
        payment.status = "Successful";

        await payment.save();

        registration.payment = {
            status: "Successful",
            paymentId: payment._id
        };

        registration.registrationStatus = "Confirmed";

        await registration.save();

        // -------------------------------------------------
        // CREATE EVENT ENTRY TICKET
        // -------------------------------------------------
        const ticket = await createTicketForRegistration(
            registration._id
        );

        return res.status(200).json({
            success: true,
            message: "Payment verified successfully",
            ticket
        });

    } catch (error) {
        console.error("========================================");
        console.error("VERIFY RAZORPAY PAYMENT ERROR");
        console.error("Message:", error.message);
        console.error("Stack:", error.stack);
        console.error("========================================");

        return res.status(500).json({
            success: false,
            message: error.message || "Payment verification failed"
        });
    }
};


module.exports = {
    createPayment,
    verifyPayment
};