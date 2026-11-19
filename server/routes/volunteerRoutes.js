const router = require("express").Router();
const { protect } = require("../middleware/authMiddleware");
const { getAssignedEvents } = require("../controllers/volunteerController");
router.get("/events", protect, getAssignedEvents);
module.exports = router;
