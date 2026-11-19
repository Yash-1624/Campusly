const Event = require("../models/Event");
exports.getAssignedEvents = async (req, res, next) => {
    try {
        if (req.user.role !== "volunteer") return res.status(403).json({ success: false, message: "Volunteer access required." });
        const events = await Event.find({ _id: { $in: req.user.assignedEvents || [] } }).select("name category description date location status fee").sort({ date: 1 });
        return res.json({ success: true, events });
    } catch (error) { next(error); }
};
