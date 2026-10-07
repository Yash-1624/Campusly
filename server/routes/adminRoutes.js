const express = require("express");
const router = express.Router();

const controller = require("../controllers/adminController");

const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

router.get("/students", protect, adminOnly, controller.getStudents);
router.get("/students/:id", protect, adminOnly, controller.getStudentById);

router.get("/stats", protect, adminOnly, controller.getStats);

router.get("/payments", protect, adminOnly, controller.getPayments);

module.exports = router;