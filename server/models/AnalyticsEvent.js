const mongoose = require("mongoose");

const analyticsEventSchema = new mongoose.Schema({
    visitorId: { type: String, required: true, index: true, maxlength: 64 },
    type: { type: String, enum: ["page_view", "location"], required: true },
    path: { type: String, maxlength: 180, default: "" },
    approximateLocation: {
        latitude: { type: Number, min: -90, max: 90 },
        longitude: { type: Number, min: -180, max: 180 },
    },
    createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 90 },
}, { versionKey: false });

module.exports = mongoose.model("AnalyticsEvent", analyticsEventSchema);
