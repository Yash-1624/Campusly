const express = require("express");
const router = express.Router();

const {
    createRegistration,
    getMyRegistrations,
    getRegistrationById,
    getAllRegistrations,
    adminAddRegistration
} = require("../controllers/registrationController");

const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");


// ===============================
// STUDENT ROUTES
// ===============================

// Create registration
router.post("/", protect, createRegistration);

// My registrations
router.get("/my", protect, getMyRegistrations);


// ===============================
// ADMIN ROUTES
// ===============================

// Get all registrations
router.post(
    "/admin/add",
    protect,
    adminOnly,
    adminAddRegistration
);

router.get(
    "/admin/all",
    protect,
    adminOnly,
    getAllRegistrations
);


// ===============================
// SINGLE REGISTRATION
// ===============================

// Get registration by ID
router.get("/:id", protect, getRegistrationById);


module.exports = router;