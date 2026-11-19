const router = require("express").Router();
const analyticsController = require("../controllers/analyticsController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

router.post("/collect", analyticsController.collect);
router.get("/summary", protect, adminOnly, analyticsController.summary);

module.exports = router;
