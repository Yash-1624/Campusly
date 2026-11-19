const Registration =
    require("../models/Registration");

const Event =
    require("../models/Event");

const generateRegistrationId =
    require("../utils/generateRegistrationId");


// =====================================================
// CHECK WHETHER REGISTRATION IS OPEN
// =====================================================

const isRegistrationOpen = (event) => {

    const now = new Date();

    return (
        ["Published", "Registration Open"].includes(
            event.status
        ) &&
        now >= new Date(event.registrationStartDate) &&
        now <= new Date(event.registrationEndDate)
    );

};


// =====================================================
// CREATE REGISTRATION
// =====================================================

exports.createRegistration = async (
    req,
    res,
    next
) => {

    try {

        const {
            eventId,
            participationType,
            teamName,
            numberOfMembers,
            informationCorrect,
            agreedToRules
        } = req.body;


        // -------------------------------------------------
        // BASIC VALIDATION
        // -------------------------------------------------

        if (!eventId || !participationType) {

            return res.status(400).json({

                message:
                    "Event and participation type are required."

            });

        }


        // -------------------------------------------------
        // CONFIRMATION VALIDATION
        // -------------------------------------------------

        if (
            !informationCorrect ||
            !agreedToRules
        ) {

            return res.status(400).json({

                message:
                    "Both confirmation checkboxes are required."

            });

        }


        // -------------------------------------------------
        // EMAIL VERIFICATION
        // -------------------------------------------------

        if (!req.user.isEmailVerified) {

            return res.status(403).json({

                message:
                    "Verify your email before registering."

            });

        }


        // -------------------------------------------------
        // COLLEGE PID VALIDATION
        // -------------------------------------------------

        if (!req.user.collegePid) {

            return res.status(400).json({

                message:
                    "Please add your College PID to your profile before registering for an event."

            });

        }


        // -------------------------------------------------
        // FIND EVENT
        // -------------------------------------------------

        const event =
            await Event.findById(eventId);


        if (!event) {

            return res.status(404).json({

                message:
                    "Event not found."

            });

        }


        // -------------------------------------------------
        // CHECK REGISTRATION WINDOW
        // -------------------------------------------------

        if (!isRegistrationOpen(event)) {

            return res.status(400).json({

                message:
                    "Registration is not currently open."

            });

        }


        // -------------------------------------------------
        // CHECK DUPLICATE REGISTRATION
        // -------------------------------------------------

        const existing =
            await Registration.findOne({

                student:
                    req.user._id,

                event:
                    event._id

            });


        if (existing) {

            /*
             * If the student already started registration
             * but has not paid yet, allow them to continue
             * to the payment page instead of returning 409.
             */

            if (
                existing.registrationStatus ===
                "Pending Payment"
            ) {

                return res.status(200).json({

                    message:
                        "Registration already exists. Continue to payment.",

                    registration:
                        existing,

                    alreadyPending:
                        true

                });

            }


            /*
             * If registration is already confirmed,
             * don't create another registration.
             */

            return res.status(409).json({

                message:
                    "You are already registered for this event.",

                registrationId:
                    existing.registrationId

            });

        }


        // -------------------------------------------------
        // PARTICIPATION VALIDATION
        // -------------------------------------------------

        if (
            participationType ===
            "Individual"
        ) {

            if (
                !event.participationType ||
                !event.participationType.individual
            ) {

                return res.status(400).json({

                    message:
                        "Individual participation is not allowed."

                });

            }

        }

        else if (
            participationType ===
            "Team"
        ) {

            if (
                !event.participationType ||
                !event.participationType.team
            ) {

                return res.status(400).json({

                    message:
                        "Team participation is not allowed."

                });

            }


            const count =
                Number(numberOfMembers);


            if (
                !teamName ||
                !teamName.trim()
            ) {

                return res.status(400).json({

                    message:
                        "Team name is required."

                });

            }


            if (
                count <
                event.teamSettings.minMembers ||

                count >
                event.teamSettings.maxMembers
            ) {

                return res.status(400).json({

                    message:
                        `Team members must be between ${event.teamSettings.minMembers} and ${event.teamSettings.maxMembers}.`

                });

            }

        }

        else {

            return res.status(400).json({

                message:
                    "Invalid participation type."

            });

        }


        // =================================================
        // CREATE REGISTRATION
        //
        // Student information comes from authenticated user.
        // We do NOT trust profile information from frontend.
        // =================================================

        const registration =
            await Registration.create({

                registrationId:
                    generateRegistrationId(),

                student:
                    req.user._id,

                event:
                    event._id,


                studentInformation: {

                    fullName:
                        req.user.fullName,

                    collegePid:
                        req.user.collegePid,

                    collegeName:
                        req.user.collegeName,

                    yearSemester:
                        req.user.yearSemester

                },


                contactInformation: {

                    mobileNumber:
                        req.user.mobileNumber,

                    email:
                        req.user.email

                },


                participation: {

                    type:
                        participationType,

                    teamName:
                        participationType ===
                            "Team"
                            ? teamName.trim()
                            : "",

                    numberOfMembers:
                        participationType ===
                            "Team"
                            ? Number(numberOfMembers)
                            : 1

                },


                confirmations: {

                    informationCorrect:
                        true,

                    agreedToRules:
                        true

                },


                /*
                 * Payment has NOT happened yet.
                 */

                payment: {

                    status:
                        "Pending",

                    paymentId:
                        null

                },


                registrationStatus:
                    "Pending Payment"

            });


        // =================================================
        // RESPONSE
        //
        // DO NOT CREATE PAYMENT HERE.
        //
        // Razorpay payment will be created by:
        // POST /api/payments/create
        // =================================================

        res.status(201).json({

            message:
                "Registration created. Continue to payment.",

            registration

        });


    } catch (error) {

        console.error(
            "Create Registration Error:",
            error
        );


        // -------------------------------------------------
        // DUPLICATE KEY
        // -------------------------------------------------

        if (
            error.code === 11000
        ) {

            return res.status(409).json({

                message:
                    "You are already registered for this event."

            });

        }


        next(error);

    }

};


// =====================================================
// GET MY REGISTRATIONS
// =====================================================

exports.getMyRegistrations = async (
    req,
    res,
    next
) => {

    try {

        const registrations =
            await Registration.find({

                student:
                    req.user._id

            })

                .populate(
                    "event",
                    "name category date location fee"
                )

                .populate(
                    "payment.paymentId",
                    "transactionId amount status paymentMethod gateway createdAt"
                )

                .sort({
                    createdAt: -1
                });


        res.json({

            registrations

        });

    } catch (error) {

        next(error);

    }

};


// =====================================================
// GET SINGLE REGISTRATION
// =====================================================

exports.getRegistrationById = async (
    req,
    res,
    next
) => {

    try {

        const registration =
            await Registration.findOne({

                _id:
                    req.params.id,

                student:
                    req.user._id

            })

                .populate("event")

                .populate("payment.paymentId");


        if (!registration) {

            return res.status(404).json({

                message:
                    "Registration not found."

            });

        }


        res.json({

            registration,

            payment:
                registration.payment?.paymentId ||
                null

        });


    } catch (error) {

        next(error);

    }

};


// =====================================================
// ADMIN - GET ALL REGISTRATIONS
// =====================================================

exports.getAllRegistrations = async (
    req,
    res,
    next
) => {

    try {

        const registrations =
            await Registration.find()

                .populate(
                    "student",
                    "fullName email mobileNumber collegeName yearSemester collegePid isEmailVerified"
                )

                .populate(
                    "event",
                    "name category date location"
                )

                .populate(
                    "payment.paymentId",
                    "transactionId amount status paymentMethod gateway createdAt"
                )

                .sort({
                    createdAt: -1
                });


        res.json({

            registrations

        });


    } catch (error) {

        next(error);

    }

};


/**
 * ADMIN: Add an existing student to an event.
 * Payment stays pending; this function does not mark
 * payment as successful or create a paid ticket.
 */
exports.adminAddRegistration = async (req, res, next) => {
    try {
        const mongoose = require("mongoose");
        const User = require("../models/User");

        const {
            studentId,
            eventId,
            participationType = "Individual",
            teamName = "",
            numberOfMembers = 1
        } = req.body;

        // Validate IDs
        if (
            !mongoose.Types.ObjectId.isValid(studentId) ||
            !mongoose.Types.ObjectId.isValid(eventId)
        ) {
            return res.status(400).json({
                message: "Select a valid student and event."
            });
        }

        // Find student and event
        const [student, event] = await Promise.all([
            User.findOne({
                _id: studentId,
                role: "student"
            }),
            Event.findById(eventId)
        ]);

        if (!student) {
            return res.status(404).json({
                message: "Student not found."
            });
        }

        if (!event) {
            return res.status(404).json({
                message: "Event not found."
            });
        }

        if (!student.collegePid) {
            return res.status(400).json({
                message:
                    "Add a College PID to this student's profile before registering."
            });
        }

        // Prevent duplicate registrations
        const duplicate = await Registration.findOne({
            student: student._id,
            event: event._id
        });

        if (duplicate) {
            return res.status(409).json({
                message:
                    "This student is already registered for this event.",
                registrationId: duplicate.registrationId
            });
        }

        // Validate participation type
        if (!["Individual", "Team"].includes(participationType)) {
            return res.status(400).json({
                message: "Invalid participation type."
            });
        }

        const memberCount = Number(numberOfMembers);

        if (participationType === "Team") {
            if (
                !event.participationType?.team ||
                !String(teamName).trim()
            ) {
                return res.status(400).json({
                    message:
                        "Team participation must be enabled and a team name is required."
                });
            }

            if (
                !Number.isInteger(memberCount) ||
                memberCount < event.teamSettings.minMembers ||
                memberCount > event.teamSettings.maxMembers
            ) {
                return res.status(400).json({
                    message:
                        `Team members must be between ${event.teamSettings.minMembers} and ${event.teamSettings.maxMembers}.`
                });
            }
        } else if (!event.participationType?.individual) {
            return res.status(400).json({
                message: "Individual participation is not allowed."
            });
        }

        // Create registration using database profile details
        const registration = await Registration.create({
            registrationId: generateRegistrationId(),

            student: student._id,
            event: event._id,

            studentInformation: {
                fullName: student.fullName,
                collegePid: student.collegePid,
                collegeName: student.collegeName,
                yearSemester: student.yearSemester
            },

            contactInformation: {
                mobileNumber: student.mobileNumber,
                email: student.email
            },

            participation: {
                type: participationType,
                teamName:
                    participationType === "Team"
                        ? String(teamName).trim()
                        : "",
                numberOfMembers:
                    participationType === "Team"
                        ? memberCount
                        : 1
            },

            confirmations: {
                informationCorrect: true,
                agreedToRules: true
            },

            payment: {
                status: "Pending",
                paymentId: null
            },

            registrationStatus: "Pending Payment"
        });

        return res.status(201).json({
            success: true,
            message:
                "Student added to the event. Payment is pending.",
            registration
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message:
                    "This student is already registered for this event."
            });
        }

        next(error);
    }
};
