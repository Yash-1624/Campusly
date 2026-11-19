const express = require("express");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

const {
    signup,
    verifyEmail,
    resendVerificationOTP,
    login,
    getCurrentUser,
    forgotPassword,
    resetPassword
} = require("../controllers/authController");


// =====================================================
// SIGNUP
// =====================================================

router.post(
    "/signup",
    signup
);


// =====================================================
// VERIFY EMAIL
// =====================================================

router.post(
    "/verify-email",
    verifyEmail
);


// =====================================================
// RESEND VERIFICATION OTP
// =====================================================

router.post(
    "/resend-verification-otp",
    resendVerificationOTP
);


// =====================================================
// LOGIN
// =====================================================

router.post(
    "/login",
    login
);

router.get(
    "/me",
    protect,
    getCurrentUser
);


// =====================================================
// FORGOT PASSWORD
// =====================================================

router.post(
    "/forgot-password",
    forgotPassword
);


// =====================================================
// RESET PASSWORD
// =====================================================

router.post(
    "/reset-password",
    resetPassword
);


module.exports = router;
