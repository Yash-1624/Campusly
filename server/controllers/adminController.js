const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const QRCode = require("qrcode");

const User = require("../models/User");
const Event = require("../models/Event");
const Registration = require("../models/Registration");
const Payment = require("../models/Payment");
const Ticket = require("../models/Ticket");
const { sendVolunteerCredentialsEmail, sendVolunteerEventAllocationEmail } = require("../services/emailService");

const studentFields = [
    "fullName",
    "collegePid",
    "email",
    "mobileNumber",
    "collegeName",
    "yearSemester",
];

// ========================================
// GET ALL STUDENTS
// GET /api/admin/students
// ========================================
exports.getStudents = async (req, res, next) => {
    try {
        const students = await User.find({ role: "student" })
            .select("-password -otp -otpExpiresAt")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            students,
        });
    } catch (error) {
        next(error);
    }
};

// ========================================
// GET STUDENT BY ID
// GET /api/admin/students/:id
// ========================================
exports.getStudentById = async (req, res, next) => {
    try {
        const student = await User.findOne({
            _id: req.params.id,
            role: "student",
        }).select("-password -otp -otpExpiresAt");

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found.",
            });
        }

        const registrations = await Registration.find({
            student: student._id,
        })
            .populate("event", "name category date location fee")
            .populate(
                "payment.paymentId",
                "status transactionId amount razorpayOrderId razorpayPaymentId"
            );

        const tickets = await Ticket.find({ student: student._id })
            .populate("event", "name category date location")
            .populate("registration", "registrationId registrationStatus payment")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            student,
            registrations,
            tickets,
        });
    } catch (error) {
        next(error);
    }
};

// ========================================
// VOLUNTEER MANAGEMENT
// ========================================
exports.getVolunteers = async (req, res, next) => {
    try {
        const volunteers = await User.find({ role: "volunteer" })
            .select("-password -otp -otpExpiresAt")
            .populate("assignedEvents", "name date location status")
            .sort({ createdAt: -1 });
        return res.json({ success: true, volunteers });
    } catch (error) { next(error); }
};

exports.createVolunteer = async (req, res, next) => {
    try {
        const fullName = String(req.body.fullName || "").trim();
        const departmentName = String(req.body.departmentName || "").trim();
        const mobileNumber = String(req.body.mobileNumber || "").replace(/\D/g, "");
        const studentId = String(req.body.studentId || "").trim().toUpperCase();
        const email = String(req.body.email || "").trim().toLowerCase();
        const eventIds = [...new Set((Array.isArray(req.body.eventIds) ? req.body.eventIds : [req.body.eventId]).filter(Boolean).map(String))];

        if (!fullName || !departmentName || !mobileNumber || !studentId || !email || !eventIds.length) {
            return res.status(400).json({ success: false, message: "Name, department, mobile number, student ID, email and at least one assigned event are required." });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, message: "Enter a valid volunteer email address." });
        }
        if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
            return res.status(400).json({ success: false, message: "Enter a valid 10-digit Indian mobile number." });
        }
        const mongoose = require("mongoose");
        if (eventIds.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
            return res.status(400).json({ success: false, message: "Choose valid events." });
        }
        const events = await Event.find({ _id: { $in: eventIds } }).sort({ date: 1 });
        if (events.length !== eventIds.length) return res.status(404).json({ success: false, message: "One or more selected events were not found." });

        const duplicate = await User.findOne({ $or: [{ collegePid: studentId }, { mobileNumber }, { email }] });
        if (duplicate) return res.status(409).json({ success: false, message: "Student ID, mobile number or email is already registered in the system." });

        let loginId = `VOL-${studentId.replace(/[^A-Z0-9]/g, "").slice(-10)}`;
        if (await User.exists({ loginId })) loginId = `VOL-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
        const temporaryPassword = crypto.randomBytes(6).toString("base64url") + "A9!";
        const hashedPassword = await bcrypt.hash(temporaryPassword, 12);

        const volunteer = await User.create({
            fullName, collegePid: studentId, loginId, email, mobileNumber, departmentName,
            collegeName: "Volunteer", yearSemester: "Volunteer", password: hashedPassword,
            role: "volunteer", isEmailVerified: true, assignedEvents: events.map((event) => event._id)
        });

        try {
            // Login credentials are delivered in one separate account email.
            await sendVolunteerCredentialsEmail({ email, name: fullName, loginId, password: temporaryPassword, eventName: events.map((event) => event.name).join(", ") });
        } catch (mailError) {
            await User.findByIdAndDelete(volunteer._id);
            console.error("VOLUNTEER CREDENTIAL EMAIL ERROR:", mailError.message);
            return res.status(502).json({ success: false, message: "Volunteer account was not created because the credential email could not be sent. Check SMTP settings and try again." });
        }

        // Send a distinct allocation email for every assigned event. Keep the account if
        // an individual allocation notice fails, and report exactly how many succeeded.
        const failedAllocationEmails = [];
        for (const event of events) {
            try {
                await sendVolunteerEventAllocationEmail({ email, name: fullName, event });
            } catch (mailError) {
                failedAllocationEmails.push(event.name);
                console.error(`VOLUNTEER EVENT EMAIL ERROR (${event.name}):`, mailError.message);
            }
        }

        const safeVolunteer = await User.findById(volunteer._id)
            .select("-password -otp -otpExpiresAt")
            .populate("assignedEvents", "name category date location status fee description");

        return res.status(201).json({
            success: true,
            message: failedAllocationEmails.length
                ? `Volunteer created and login credentials emailed. ${events.length - failedAllocationEmails.length} of ${events.length} event allocation emails sent; failed: ${failedAllocationEmails.join(", ")}.`
                : `Volunteer created. Login credentials and ${events.length} separate event allocation email(s) were sent to ${email}.`,
            volunteer: safeVolunteer,
            credentialsSent: true,
            allocationEmailsSent: events.length - failedAllocationEmails.length,
            failedAllocationEmails,
            credentials: { loginId }
        });
    } catch (error) {
        if (error.code === 11000) return res.status(409).json({ success: false, message: "Student ID, mobile number or email already exists." });
        next(error);
    }
};

exports.updateVolunteer = async (req, res, next) => {
    try {
        const volunteer = await User.findOne({ _id: req.params.id, role: "volunteer" });
        if (!volunteer) return res.status(404).json({ success: false, message: "Volunteer not found." });
        const { fullName, departmentName, mobileNumber, studentId, eventId, eventIds, active } = req.body;
        if (fullName !== undefined) volunteer.fullName = String(fullName).trim();
        if (departmentName !== undefined) volunteer.departmentName = String(departmentName).trim();
        if (mobileNumber !== undefined) volunteer.mobileNumber = String(mobileNumber).replace(/\D/g, "");
        if (studentId !== undefined) volunteer.collegePid = String(studentId).trim().toUpperCase();
        if (eventIds !== undefined || eventId !== undefined) {
            const ids = [...new Set((Array.isArray(eventIds) ? eventIds : [eventId]).filter(Boolean).map(String))];
            if (!ids.length) return res.status(400).json({ success: false, message: "Assign at least one event." });
            const mongoose = require("mongoose");
            if (ids.some((id) => !mongoose.Types.ObjectId.isValid(id))) return res.status(400).json({ success: false, message: "Choose valid events." });
            const events = await Event.find({ _id: { $in: ids } });
            if (events.length !== ids.length) return res.status(404).json({ success: false, message: "One or more assigned events were not found." });
            volunteer.assignedEvents = events.map((event) => event._id);
        }
        if (active !== undefined) volunteer.isEmailVerified = Boolean(active);
        if (req.body.password) {
            if (String(req.body.password).length < 8) return res.status(400).json({ success: false, message: "Password must contain at least 8 characters." });
            volunteer.password = await bcrypt.hash(String(req.body.password), 12);
        }
        await volunteer.save();
        const safeVolunteer = await User.findById(volunteer._id).select("-password -otp -otpExpiresAt").populate("assignedEvents", "name category date location status fee description");
        return res.json({ success: true, message: "Volunteer updated successfully.", volunteer: safeVolunteer });
    } catch (error) {
        if (error.code === 11000) return res.status(409).json({ success: false, message: "Student ID or mobile number already exists." });
        next(error);
    }
};

exports.getEntryLog = async (req, res, next) => {
    try {
        const entries = await Ticket.find({ entryStatus: "Entered", enteredAt: { $ne: null } })
            .populate("student", "fullName collegePid mobileNumber")
            .populate("event", "name date location")
            .populate("scannedBy", "fullName loginId collegePid departmentName role")
            .sort({ enteredAt: -1 })
            .limit(1000);
        return res.json({ success: true, entries });
    } catch (error) { next(error); }
};

// ========================================
// GET ADMIN STATISTICS
// GET /api/admin/stats
// ========================================
exports.getStats = async (req, res, next) => {
    try {
        const [
            totalStudents,
            totalEvents,
            activeEvents,
            totalRegistrations,
            successfulPayments,
            pendingPayments,
            upcomingEvents,
        ] = await Promise.all([
            User.countDocuments({ role: "student" }),
            Event.countDocuments(),
            Event.countDocuments({
                status: { $in: ["Published", "Registration Open"] },
            }),
            Registration.countDocuments(),
            Payment.countDocuments({ status: "Successful" }),
            Payment.countDocuments({ status: "Pending" }),
            Event.countDocuments({
                date: { $gte: new Date() },
                status: { $nin: ["Cancelled", "Completed"] },
            }),
        ]);

        res.json({
            success: true,
            stats: {
                totalStudents,
                totalEvents,
                activeEvents,
                totalRegistrations,
                successfulPayments,
                pendingPayments,
                upcomingEvents,
            },
        });
    } catch (error) {
        console.error("Get admin statistics error:", error);
        next(error);
    }
};

// ========================================
// CREATE STUDENT
// POST /api/admin/students
// ========================================
exports.createStudent = async (req, res, next) => {
    try {
        const values = {};

        for (const field of studentFields) {
            values[field] = String(req.body[field] || "").trim();
        }

        const password = String(req.body.password || "");

        if (
            studentFields.some((field) => !values[field]) ||
            password.length < 8
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Complete all student fields and provide a temporary password of at least 8 characters.",
            });
        }

        values.email = values.email.toLowerCase();
        values.collegePid = values.collegePid.toUpperCase();

        const duplicate = await User.findOne({
            $or: [
                { email: values.email },
                { collegePid: values.collegePid },
                { mobileNumber: values.mobileNumber },
            ],
        });

        if (duplicate) {
            return res.status(409).json({
                success: false,
                message: "Email, College PID, or mobile number is already registered.",
            });
        }

        const student = await User.create({
            ...values,
            password: await bcrypt.hash(password, 12),
            role: "student",
            isEmailVerified: false,
        });

        const publicStudent = student.toObject();
        delete publicStudent.password;
        delete publicStudent.otp;
        delete publicStudent.otpExpiresAt;

        return res.status(201).json({
            success: true,
            message:
                "Student account created. The student can sign in after completing the normal email verification process.",
            student: publicStudent,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Email, College PID, or mobile number is already registered.",
            });
        }
        next(error);
    }
};

// ========================================
// UPDATE STUDENT
// PATCH /api/admin/students/:id
// ========================================
exports.updateStudent = async (req, res, next) => {
    try {
        const student = await User.findOne({
            _id: req.params.id,
            role: "student",
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found.",
            });
        }

        const allowed = [
            "fullName",
            "collegePid",
            "email",
            "mobileNumber",
            "collegeName",
            "yearSemester",
        ];

        for (const field of allowed) {
            if (req.body[field] !== undefined) {
                const value = String(req.body[field]).trim();

                if (!value) {
                    return res.status(400).json({
                        success: false,
                        message: `${field} cannot be empty.`,
                    });
                }

                if (field === "email") {
                    student[field] = value.toLowerCase();
                } else if (field === "collegePid") {
                    student[field] = value.toUpperCase();
                } else {
                    student[field] = value;
                }
            }
        }

        if (req.body.isEmailVerified !== undefined) {
            student.isEmailVerified = Boolean(req.body.isEmailVerified);
        }

        if (req.body.password) {
            if (String(req.body.password).length < 8) {
                return res.status(400).json({
                    success: false,
                    message: "Password must contain at least 8 characters.",
                });
            }

            student.password = await bcrypt.hash(String(req.body.password), 12);
        }

        await student.save();

        const result = student.toObject();
        delete result.password;
        delete result.otp;
        delete result.otpExpiresAt;

        return res.json({
            success: true,
            message: "Student updated successfully.",
            student: result,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message:
                    "Email, College PID, or mobile number is already used by another account.",
            });
        }
        next(error);
    }
};

// ========================================
// UPDATE TICKET
// PATCH /api/admin/tickets/:ticketId
// ========================================
exports.updateTicket = async (req, res, next) => {
    try {
        const ticket = await Ticket.findOne({
            ticketId: req.params.ticketId,
        });

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found.",
            });
        }

        const { collegePid, studentName, eventName } = req.body;

        if (
            ![collegePid, studentName, eventName].every(
                (v) => typeof v === "string" && v.trim()
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "College PID, student name, and event name are required.",
            });
        }

        ticket.collegePid = collegePid.trim().toUpperCase();
        ticket.studentName = studentName.trim();
        ticket.eventName = eventName.trim();

        ticket.qrPayload = JSON.stringify({
            ticketId: ticket.ticketId,
            collegePid: ticket.collegePid,
            studentName: ticket.studentName,
            eventName: ticket.eventName,
        });

        ticket.qrCode = await QRCode.toDataURL(ticket.qrPayload);

        await ticket.save();

        return res.json({
            success: true,
            message: "Ticket details and QR code updated.",
            ticket,
        });
    } catch (error) {
        next(error);
    }
};

// ========================================
// GET ALL PAYMENTS
// GET /api/admin/payments
// ========================================
exports.getPayments = async (req, res) => {
    try {
        const payments = await Payment.find()
            .populate(
                "student",
                "fullName email mobileNumber collegePid collegeName yearSemester"
            )
            .sort({ createdAt: -1 })
            .lean();

        const paymentsWithDetails = await Promise.all(
            payments.map(async (payment) => {
                let registration = null;
                let event = null;

                if (payment.registration) {
                    registration = await Registration.findById(
                        payment.registration
                    ).lean();

                    if (registration?.event) {
                        event = await Event.findById(registration.event)
                            .select("name category date location fee")
                            .lean();
                    }
                }

                return {
                    ...payment,
                    registration,
                    event,
                };
            })
        );

        return res.status(200).json({
            success: true,
            count: paymentsWithDetails.length,
            payments: paymentsWithDetails,
        });
    } catch (error) {
        console.error("GET ADMIN PAYMENTS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch payments.",
            error: error.message,
        });
    }
};
