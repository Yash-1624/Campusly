const AnalyticsEvent = require("../models/AnalyticsEvent");

const validVisitorId = (id) => typeof id === "string" && /^[a-f\d-]{32,36}$/i.test(id);

exports.collect = async (req, res, next) => {
    try {
        const { visitorId, type } = req.body || {};
        if (!validVisitorId(visitorId) || !["page_view", "location"].includes(type)) {
            return res.status(400).json({ message: "Invalid analytics event." });
        }

        const event = { visitorId, type };
        if (type === "page_view") {
            const path = typeof req.body.path === "string" ? req.body.path : "";
            if (!path.startsWith("/") || path.length > 180 || path.includes("?")) {
                return res.status(400).json({ message: "Invalid page path." });
            }
            event.path = path;
        } else {
            const latitude = Number(req.body.latitude);
            const longitude = Number(req.body.longitude);
            if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
                return res.status(400).json({ message: "Invalid approximate location." });
            }
            event.approximateLocation = { latitude, longitude };
        }

        await AnalyticsEvent.create(event);
        return res.status(202).json({ success: true });
    } catch (error) { return next(error); }
};

exports.summary = async (req, res, next) => {
    try {
        const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const [totals, pages, recent, locationRows] = await Promise.all([
            AnalyticsEvent.aggregate([{ $match: { type: "page_view", createdAt: { $gte: since } } }, { $group: { _id: null, views: { $sum: 1 }, visitors: { $addToSet: "$visitorId" } } }]),
            AnalyticsEvent.aggregate([{ $match: { type: "page_view", createdAt: { $gte: since } } }, { $group: { _id: "$path", views: { $sum: 1 }, visitors: { $addToSet: "$visitorId" } } }, { $project: { path: "$_id", views: 1, visitors: { $size: "$visitors" } } }, { $sort: { views: -1 } }, { $limit: 12 }]),
            AnalyticsEvent.find({ type: "page_view", createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(500).select("visitorId path createdAt -_id").lean(),
            AnalyticsEvent.find({ type: "location", createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(100).select("visitorId approximateLocation createdAt -_id").lean(),
        ]);

        const journeys = new Map();
        for (const row of recent) {
            if (!journeys.has(row.visitorId)) journeys.set(row.visitorId, { visitor: `Visitor ${journeys.size + 1}`, lastSeen: row.createdAt, pages: [] });
            const journey = journeys.get(row.visitorId);
            if (journey.pages.length < 12) journey.pages.push({ path: row.path, at: row.createdAt });
        }
        const locations = locationRows.map(({ approximateLocation, createdAt }, index) => ({ area: `Approximate area ${index + 1}`, ...approximateLocation, at: createdAt }));
        const total = totals[0] || { views: 0, visitors: [] };
        return res.json({ success: true, periodDays: 30, pageViews: total.views, uniqueVisitors: total.visitors.length, popularPages: pages, journeys: [...journeys.values()].slice(0, 30), locations });
    } catch (error) { return next(error); }
};
