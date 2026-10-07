const User = require("../models/User");
const Event = require("../models/Event");
const Registration = require("../models/Registration");
const Payment = require("../models/Payment");


/*
|--------------------------------------------------------------------------
| GET ALL STUDENTS
|--------------------------------------------------------------------------
| GET /api/admin/students
|--------------------------------------------------------------------------
*/

exports.getStudents = async (req, res, next) => {
    try {
        const students = await User.find({
            role: "student"
        })
            .select("-password -otp -otpExpiresAt")
            .sort({
                createdAt: -1
            });

        res.json({
            success: true,
            students
        });

    } catch (error) {
        next(error);
    }
};


/*
|--------------------------------------------------------------------------
| GET STUDENT BY ID
|--------------------------------------------------------------------------
| GET /api/admin/students/:id
|--------------------------------------------------------------------------
*/

exports.getStudentById = async (req, res, next) => {
    try {
        const student = await User.findOne({
            _id: req.params.id,
            role: "student"
        })
            .select("-password -otp -otpExpiresAt");

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found."
            });
        }

        const registrations = await Registration.find({
            student: student._id
        })
            .populate(
                "event",
                "name category date location fee"
            )
            .populate(
                "payment",
                "status transactionId amount razorpayOrderId razorpayPaymentId"
            );

        res.json({
            success: true,
            student,
            registrations
        });

    } catch (error) {
        next(error);
    }
};


/*
|--------------------------------------------------------------------------
| GET ADMIN STATISTICS
|--------------------------------------------------------------------------
| GET /api/admin/stats
|--------------------------------------------------------------------------
*/

exports.getStats = async (req, res, next) => {
    try {
        const [
            totalStudents,
            totalEvents,
            activeEvents,
            totalRegistrations,
            successfulPayments,
            pendingPayments,
            upcomingEvents
        ] = await Promise.all([

            User.countDocuments({
                role: "student"
            }),

            Event.countDocuments(),

            Event.countDocuments({
                status: {
                    $in: [
                        "Published",
                        "Registration Open"
                    ]
                }
            }),

            Registration.countDocuments(),

            Payment.countDocuments({
                status: "Successful"
            }),

            Payment.countDocuments({
                status: "Pending"
            }),

            Event.countDocuments({
                date: {
                    $gte: new Date()
                },
                status: {
                    $nin: [
                        "Cancelled",
                        "Completed"
                    ]
                }
            })
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
                upcomingEvents
            }
        });

    } catch (error) {
        console.error("Get admin statistics error:", error);
        next(error);
    }
};


/*
|--------------------------------------------------------------------------
| GET ALL PAYMENTS
|--------------------------------------------------------------------------
| GET /api/admin/payments
|--------------------------------------------------------------------------
*/

const getPayments = async (req, res) => {
    try {
        console.log("========== GET PAYMENTS ==========");

        const payments = await Payment.find()
            .populate(
                "student",
                "fullName email mobileNumber collegePid collegeName yearSemester"
            )
            .sort({ createdAt: -1 })
            .lean();

        const result = await Promise.all(
            payments.map(async (payment) => {
                let registration = null;
                let event = null;

                // Get Registration
                if (payment.registration) {
                    registration = await Registration.findById(
                        payment.registration
                    ).lean();
                }

                // Get Event through Registration
                if (registration && registration.event) {
                    event = await Event.findById(
                        registration.event
                    )
                        .select("name category date location fee")
                        .lean();
                }

                return {
                    ...payment,
                    registration,
                    event
                };
            })
        );

        console.log("Payments found:", result.length);

        return res.status(200).json({
            success: true,
            payments: result
        });

    } catch (error) {
        console.error("========== GET PAYMENTS ERROR ==========");
        console.error(error);
        console.error("Message:", error.message);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports.getPayments = getPayments;