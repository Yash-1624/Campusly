const express = require("express");

const router = express.Router();

const {
    signup,
    verifyEmail,
    resendVerificationOTP,
    login,
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