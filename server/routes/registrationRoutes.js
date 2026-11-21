const express = require("express");
const router = express.Router();

const {
    createRegistration,
    getMyRegistrations,
    getRegistrationById,
    getAllRegistrations,
    adminAddRegistration,
    updateRegistration
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
    adminAddRegistration,
    updateRegistration
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

// Get and update a registration
router.get("/:id", protect, getRegistrationById);
router.patch("/:id", protect, updateRegistration);


module.exports = router;