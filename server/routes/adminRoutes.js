const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");

const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

router.get("/students", protect, adminOnly, adminController.getStudents);
router.get("/volunteers", protect, adminOnly, adminController.getVolunteers);
router.post("/volunteers", protect, adminOnly, adminController.createVolunteer);
router.patch("/volunteers/:id", protect, adminOnly, adminController.updateVolunteer);
router.get("/entries", protect, adminOnly, adminController.getEntryLog);
router.get("/students/:id", protect, adminOnly, adminController.getStudentById);
router.post("/students", protect, adminOnly, adminController.createStudent);
router.patch("/students/:id", protect, adminOnly, adminController.updateStudent);
router.patch("/tickets/:ticketId", protect, adminOnly, adminController.updateTicket);

router.get("/stats", protect, adminOnly, adminController.getStats);

router.get("/payments", protect, adminOnly, adminController.getPayments);

module.exports = router;