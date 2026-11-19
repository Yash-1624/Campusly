const mongoose = require("mongoose");

const Ticket = require("../models/Ticket");
const Registration = require("../models/Registration");
const Event = require("../models/Event");
const { createTicket } = require("../services/ticketService");

exports.getMyTickets = async (req, res, next) => {
    try {
        const confirmedRegistrations = await Registration.find({
            student: req.user._id,
            registrationStatus: "Confirmed",
        }).select("_id");

        // Backfill tickets for older confirmed registrations that never received one.
        await Promise.all(confirmedRegistrations.map(async ({ _id }) => {
            try {
                await createTicket({ registrationId: _id });
            } catch (ticketError) {
                console.error("TICKET BACKFILL ERROR:", ticketError.message);
            }
        }));

        const tickets = await Ticket.find({ student: req.user._id })
            .populate("event", "name category date location")
            .populate("registration", "registrationId registrationStatus")
            .sort({ createdAt: -1 });

        return res.json({ tickets });
    } catch (error) {
        return next(error);
    }
};


// =========================================================
// GET MY TICKET
// =========================================================
// GET /api/tickets/registration/:registrationId
//
// Student can use this to see their QR ticket.
// =========================================================

exports.getMyTicket = async (
    req,
    res,
    next
) => {

    try {

        const {
            registrationId
        } = req.params;


        if (
            !mongoose.Types.ObjectId.isValid(
                registrationId
            )
        ) {
            return res.status(400).json({
                message:
                    "Invalid registration ID."
            });
        }


        // -------------------------------------------------
        // Make sure registration belongs to logged-in user
        // -------------------------------------------------

        const registration =
            await Registration.findOne({

                _id:
                    registrationId,

                student:
                    req.user._id

            });


        if (!registration) {

            return res.status(404).json({
                message:
                    "Registration not found."
            });
        }


        // -------------------------------------------------
        // Ticket
        // -------------------------------------------------

        const ticket =
            await Ticket.findOne({

                registration:
                    registration._id

            })
                .populate(
                    "student",
                    "fullName collegePid email mobileNumber collegeName yearSemester"
                )
                .populate(
                    "event",
                    "name category date location"
                );


        if (!ticket) {

            return res.status(404).json({
                message:
                    "QR ticket has not been generated yet. Please complete payment first."
            });
        }


        res.json({

            ticket

        });

    } catch (error) {

        next(error);
    }
};



// =========================================================
// GET TICKET BY ID
// =========================================================
// Optional endpoint for admin/student ticket lookup.
// =========================================================

exports.getTicketById = async (
    req,
    res,
    next
) => {

    try {

        const {
            ticketId
        } = req.params;


        const ticket =
            await Ticket.findOne({
                ticketId
            })
                .populate(
                    "student",
                    "fullName collegePid email mobileNumber collegeName yearSemester"
                )
                .populate(
                    "event",
                    "name category date location"
                )
                .populate(
                    "registration",
                    "registrationId registrationStatus payment"
                );


        if (!ticket) {

            return res.status(404).json({
                message:
                    "Ticket not found."
            });
        }


        // -------------------------------------------------
        // Student authorization
        // -------------------------------------------------

        const isOwner =
            String(ticket.student?._id) ===
            String(req.user._id);


        const isAdmin =
            req.user.role === "admin";


        const isVolunteer =
            req.user.role === "volunteer";


        if (
            !isOwner &&
            !isAdmin &&
            !isVolunteer
        ) {

            return res.status(403).json({
                message:
                    "You are not authorized to view this ticket."
            });
        }


        res.json({

            ticket

        });

    } catch (error) {

        next(error);
    }
};



// =========================================================
// SCAN TICKET
// =========================================================
// POST /api/tickets/scan
//
// Body:
//
// {
//     ticketId: "...",
//     eventId: "..."
// }
//
// Only Admin / Volunteer should be allowed to scan.
//
// The important part is the atomic:
//
// findOneAndUpdate()
//
// with:
//
// entryStatus: "Not Entered"
//
// This prevents two scanners from accepting the same
// student at exactly the same time.
// =========================================================

exports.scanTicket = async (
    req,
    res,
    next
) => {

    try {

        let { ticketId, eventId, qrPayload } = req.body;

        // QR images contain a JSON payload with ticketId and display details.
        if (!ticketId && qrPayload) {
            try {
                const decoded = typeof qrPayload === "string" ? JSON.parse(qrPayload) : qrPayload;
                ticketId = decoded.ticketId;
                eventId = eventId || decoded.eventId;
            } catch {
                // Allow legacy QR codes that contain the ticket ID as plain text.
                ticketId = String(qrPayload).trim();
            }
        }


        // -------------------------------------------------
        // Validate Ticket ID
        // -------------------------------------------------

        if (
            !ticketId ||
            !ticketId.trim()
        ) {

            return res.status(400).json({
                message:
                    "Ticket ID is required."
            });
        }


        // -------------------------------------------------
        // Validate Event ID
        // -------------------------------------------------

        if (
            eventId &&
            !mongoose.Types.ObjectId.isValid(
                eventId
            )
        ) {

            return res.status(400).json({
                message:
                    "Invalid event ID."
            });
        }



        // =================================================
        // FIRST CHECK
        // =================================================
        // Find the ticket normally so that we can provide
        // a useful response for invalid/already-entered
        // tickets.
        // =================================================

        const existingTicket =
            await Ticket.findOne({

                ticketId:
                    ticketId.trim()

            });


        if (!existingTicket) {

            return res.status(404).json({
                message:
                    "Invalid QR ticket. Ticket not found."
            });
        }



        // Volunteers can scan only tickets for their assigned event(s).
        if (req.user.role === "volunteer") {
            const assignedEvents = (req.user.assignedEvents || []).map((id) => String(id._id || id));
            if (!assignedEvents.includes(String(existingTicket.event))) {
                return res.status(403).json({ message: "This volunteer is not assigned to the event for this ticket." });
            }
        }

        // =================================================
        // EVENT VALIDATION
        // =================================================

        if (
            eventId &&
            String(existingTicket.event) !==
            String(eventId)
        ) {

            return res.status(400).json({

                message:
                    "This QR ticket belongs to a different event.",

                ticket: existingTicket
            });
        }



        // =================================================
        // ALREADY ENTERED
        // =================================================

        if (
            existingTicket.entryStatus ===
            "Entered"
        ) {

            return res.status(409).json({

                message:
                    "This ticket has already been used for entry.",

                ticket:
                    existingTicket
            });
        }



        // =================================================
        // ATOMIC ENTRY UPDATE
        // =================================================
        //
        // This is extremely important.
        //
        // Suppose:
        //
        // Scanner 1 scans QR
        // Scanner 2 scans same QR at same time
        //
        // Only ONE request will be able to change:
        //
        // Not Entered → Entered
        //
        // Therefore duplicate entry is prevented.
        // =================================================

        const scannedTicket =
            await Ticket.findOneAndUpdate(

                {
                    ticketId:
                        ticketId.trim(),

                    entryStatus:
                        "Not Entered"
                },

                {
                    $set: {

                        entryStatus:
                            "Entered",

                        enteredAt:
                            new Date(),

                        scannedBy:
                            req.user._id
                    }
                },

                {
                    new:
                        true,

                    runValidators:
                        true
                }
            )
                .populate(
                    "student",
                    "fullName collegePid email mobileNumber collegeName yearSemester"
                )
                .populate(
                    "event",
                    "name category date location"
                )
                .populate(
                    "registration",
                    "registrationId registrationStatus"
                )
                .populate(
                    "scannedBy",
                    "fullName loginId collegePid departmentName role"
                );



        // =================================================
        // ANOTHER SCANNER GOT THERE FIRST
        // =================================================

        if (!scannedTicket) {

            const alreadyEnteredTicket =
                await Ticket.findOne({
                    ticketId:
                        ticketId.trim()
                })
                    .populate(
                        "student",
                        "fullName collegePid email mobileNumber collegeName yearSemester"
                    )
                    .populate(
                        "event",
                        "name category date location"
                    )
                    .populate(
                        "registration",
                        "registrationId registrationStatus"
                    );


            return res.status(409).json({

                message:
                    "This ticket has already been used for entry.",

                ticket:
                    alreadyEnteredTicket
            });
        }



        // =================================================
        // SUCCESS
        // =================================================

        return res.json({

            message:
                "Student entry recorded successfully.",

            ticket:
                scannedTicket,

            entry: {

                status:
                    "Entered",

                enteredAt:
                    scannedTicket.enteredAt,

                scannedBy:
                    scannedTicket.scannedBy
            }
        });

    } catch (error) {

        next(error);
    }
};



// =========================================================
// RESET TICKET ENTRY
// =========================================================
// Optional admin-only utility.
//
// Useful during development/testing if you scan a test
// student accidentally and want to test the scanner again.
//
// IMPORTANT:
// Do not expose this to students.
// =========================================================

exports.resetTicketEntry = async (
    req,
    res,
    next
) => {

    try {

        const {
            ticketId
        } = req.params;


        if (
            !ticketId ||
            !ticketId.trim()
        ) {

            return res.status(400).json({
                message:
                    "Ticket ID is required."
            });
        }


        const ticket =
            await Ticket.findOneAndUpdate(

                {
                    ticketId:
                        ticketId.trim()
                },

                {
                    $set: {

                        entryStatus:
                            "Not Entered",

                        enteredAt:
                            null,

                        scannedBy:
                            null
                    }
                },

                {
                    new:
                        true
                }
            );


        if (!ticket) {

            return res.status(404).json({
                message:
                    "Ticket not found."
            });
        }


        res.json({

            message:
                "Ticket entry status reset successfully.",

            ticket

        });

    } catch (error) {

        next(error);
    }
};



module.exports = {
    getMyTickets: exports.getMyTickets,
    getMyTicket: exports.getMyTicket,
    getTicketById: exports.getTicketById,
    scanTicket: exports.scanTicket,
    resetTicketEntry: exports.resetTicketEntry
};
