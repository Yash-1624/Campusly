const Event = require("../models/Event");

const closeExpiredRegistrations = async (now = new Date()) => {
    const result = await Event.updateMany(
        {
            status: { $in: ["Published", "Registration Open"] },
            registrationEndDate: { $lte: now },
        },
        {
            $set: { status: "Registration Closed" },
        }
    );

    return result.modifiedCount || 0;
};

module.exports = { closeExpiredRegistrations };
