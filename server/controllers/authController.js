const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const generateOTP = require("../utils/generateOTP");

const {
    sendVerificationOTP,
    sendPasswordResetOTP
} = require("../services/emailService");


// =====================================================
// CREATE JWT
// =====================================================

const createToken = (user) => {
    const sessionLength = {
        student: "1h",
        admin: "2h",
        volunteer: "3h"
    }[user.role] || "1h";

    return jwt.sign(
        {
            id: user._id,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: sessionLength
        }
    );
};


// =====================================================
// PUBLIC USER DATA
// =====================================================

const publicUser = (user) => {
    return {
        id: user._id,
        fullName: user.fullName,
        loginId: user.loginId || "",
        departmentName: user.departmentName || "",
        assignedEvents: user.assignedEvents || [],
        collegePid: user.collegePid,
        email: user.email,
        mobileNumber: user.mobileNumber,
        collegeName: user.collegeName,
        yearSemester: user.yearSemester,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt
    };
};


// =====================================================
// NORMALIZE MOBILE NUMBER
// =====================================================

const normalizeMobileNumber = (mobileNumber) => {

    let mobile = String(mobileNumber || "")
        .replace(/\D/g, "");

    // If user enters Indian country code:
    // 919876543210
    // convert it to:
    // 9876543210

    if (
        mobile.length === 12 &&
        mobile.startsWith("91")
    ) {
        mobile = mobile.substring(2);
    }

    return mobile;
};


// =====================================================
// SIGNUP
// =====================================================

exports.signup = async (req, res) => {

    try {

        const {
            fullName,
            collegePid,
            collegeName,
            yearSemester,
            mobileNumber,
            email,
            password,
            confirmPassword
        } = req.body;


        // -------------------------------------------------
        // REQUIRED FIELDS
        // -------------------------------------------------

        if (
            !fullName ||
            !collegePid ||
            !collegeName ||
            !yearSemester ||
            !mobileNumber ||
            !email ||
            !password ||
            !confirmPassword
        ) {

            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });

        }


        // -------------------------------------------------
        // NORMALIZE DATA
        // -------------------------------------------------

        const normalizedEmail =
            String(email)
                .trim()
                .toLowerCase();


        const normalizedPid =
            String(collegePid)
                .trim()
                .toUpperCase();


        const normalizedMobile =
            normalizeMobileNumber(
                mobileNumber
            );


        // -------------------------------------------------
        // VALIDATE MOBILE
        // -------------------------------------------------

        if (
            !/^[6-9]\d{9}$/.test(
                normalizedMobile
            )
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Please enter a valid 10-digit Indian mobile number."
            });

        }


        // -------------------------------------------------
        // VALIDATE EMAIL
        // -------------------------------------------------

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


        if (
            !emailRegex.test(
                normalizedEmail
            )
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Please enter a valid email address."
            });

        }


        // -------------------------------------------------
        // PASSWORD MATCH
        // -------------------------------------------------

        if (
            password !==
            confirmPassword
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Passwords do not match."
            });

        }


        // -------------------------------------------------
        // PASSWORD LENGTH
        // -------------------------------------------------

        if (
            password.length < 6
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Password must be at least 6 characters long."
            });

        }


        // -------------------------------------------------
        // CHECK EMAIL
        // -------------------------------------------------

        const existingEmail =
            await User.findOne({
                email: normalizedEmail
            });

        if (existingEmail) {

            return res.status(409).json({
                success: false,
                field: "email",
                message:
                    "This email address is already registered."
            });

        }


        // -------------------------------------------------
        // CHECK COLLEGE PID
        // -------------------------------------------------

        const existingPid =
            await User.findOne({
                collegePid: normalizedPid
            });

        if (existingPid) {

            return res.status(409).json({
                success: false,
                field: "collegePid",
                message:
                    "This College PID is already registered."
            });

        }


        // -------------------------------------------------
        // CHECK MOBILE NUMBER
        // -------------------------------------------------

        const existingMobile =
            await User.findOne({
                mobileNumber:
                    normalizedMobile
            });

        if (existingMobile) {

            return res.status(409).json({
                success: false,
                field: "mobileNumber",
                message:
                    "This mobile number is already registered."
            });

        }


        // -------------------------------------------------
        // HASH PASSWORD
        // -------------------------------------------------

        const hashedPassword =
            await bcrypt.hash(
                password,
                12
            );


        // -------------------------------------------------
        // GENERATE OTP
        // -------------------------------------------------

        const otp =
            generateOTP();


        const otpExpiresAt =
            new Date(
                Date.now() +
                10 * 60 * 1000
            );


        // -------------------------------------------------
        // CREATE USER
        // -------------------------------------------------

        const user =
            await User.create({

                fullName:
                    String(fullName).trim(),

                collegePid:
                    normalizedPid,

                collegeName:
                    String(collegeName).trim(),

                yearSemester:
                    String(yearSemester).trim(),

                mobileNumber:
                    normalizedMobile,

                email:
                    normalizedEmail,

                password:
                    hashedPassword,

                role:
                    "student",

                isEmailVerified:
                    false,

                otp,

                otpExpiresAt

            });


        // -------------------------------------------------
        // SEND VERIFICATION OTP
        // -------------------------------------------------

        try {

            await sendVerificationOTP(
                normalizedEmail,
                otp
            );

        } catch (emailError) {

            console.error(
                "Verification email error:",
                emailError
            );

            await User.findByIdAndDelete(user._id);

            return res.status(500).json({
                success: false,
                message:
                    "Unable to send verification email. Please try again."
            });

        }


        return res.status(201).json({

            success: true,

            message:
                "Account created successfully. Please verify your email using the OTP sent to your email address.",

            user: publicUser(user)

        });


    } catch (error) {

        console.error(
            "SIGNUP ERROR:",
            error
        );


        // -------------------------------------------------
        // MONGODB DUPLICATE KEY ERROR
        // -------------------------------------------------

        if (
            error.code === 11000
        ) {

            const duplicateField =
                Object.keys(
                    error.keyPattern || {}
                )[0];


            if (
                duplicateField ===
                "email"
            ) {

                return res.status(409).json({
                    success: false,
                    field: "email",
                    message:
                        "This email address is already registered."
                });

            }


            if (
                duplicateField ===
                "collegePid"
            ) {

                return res.status(409).json({
                    success: false,
                    field: "collegePid",
                    message:
                        "This College PID is already registered."
                });

            }


            if (
                duplicateField ===
                "mobileNumber"
            ) {

                return res.status(409).json({
                    success: false,
                    field: "mobileNumber",
                    message:
                        "This mobile number is already registered."
                });

            }


            return res.status(409).json({
                success: false,
                message:
                    "A user with the same information already exists."
            });

        }


        return res.status(500).json({
            success: false,
            message:
                "Unable to create account. Please try again."
        });

    }

};


// =====================================================
// VERIFY EMAIL
// =====================================================

exports.verifyEmail = async (
    req,
    res
) => {

    try {

        const {
            email,
            otp
        } = req.body;


        if (
            !email ||
            !otp
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Email and OTP are required."
            });

        }


        const normalizedEmail =
            String(email)
                .trim()
                .toLowerCase();


        const user =
            await User.findOne({
                email:
                    normalizedEmail
            })
                .select(
                    "+otp +otpExpiresAt"
                );


        if (!user) {

            return res.status(404).json({
                success: false,
                message:
                    "User not found."
            });

        }


        if (
            user.isEmailVerified
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Email is already verified."
            });

        }


        if (
            !user.otp ||
            !user.otpExpiresAt
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "OTP not found. Please request a new OTP."
            });

        }


        if (
            user.otpExpiresAt <
            new Date()
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "OTP has expired. Please request a new OTP."
            });

        }


        if (
            String(user.otp) !==
            String(otp).trim()
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid OTP."
            });

        }


        user.isEmailVerified =
            true;

        user.otp = undefined;

        user.otpExpiresAt =
            undefined;

        await user.save();


        return res.status(200).json({

            success: true,

            message:
                "Email verified successfully. You can now login.",

            user:
                publicUser(user)

        });


    } catch (error) {

        console.error(
            "VERIFY EMAIL ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Email verification failed."
        });

    }

};


// =====================================================
// RESEND VERIFICATION OTP
// =====================================================

exports.resendVerificationOTP =
    async (
        req,
        res
    ) => {

        try {

            const {
                email
            } = req.body;


            if (!email) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Email is required."
                });

            }


            const normalizedEmail =
                String(email)
                    .trim()
                    .toLowerCase();


            const user =
                await User.findOne({
                    email:
                        normalizedEmail
                });


            if (!user) {

                return res.status(404).json({
                    success: false,
                    message:
                        "User not found."
                });

            }


            if (
                user.isEmailVerified
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Email is already verified."
                });

            }


            const otp =
                generateOTP();


            user.otp =
                otp;

            user.otpExpiresAt =
                new Date(
                    Date.now() +
                    10 * 60 * 1000
                );


            await user.save();


            await sendVerificationOTP(
                normalizedEmail,
                otp
            );


            return res.status(200).json({
                success: true,
                message:
                    "A new verification OTP has been sent."
            });


        } catch (error) {

            console.error(
                "RESEND OTP ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to resend OTP."
            });

        }

    };


// =====================================================
// LOGIN
// =====================================================

exports.login = async (
    req,
    res
) => {

    try {

        const { email, loginId, identifier, password } = req.body;
        const portal = String(req.body.portal || "student").toLowerCase();
        const suppliedIdentifier = String(identifier || loginId || email || "").trim();

        if (!["student", "admin", "volunteer"].includes(portal)) {
            return res.status(400).json({ success: false, message: "Invalid sign-in portal." });
        }

        if (!suppliedIdentifier || !password) {
            return res.status(400).json({
                success: false,
                message: "Login ID/email and password are required."
            });
        }

        const normalizedIdentifier = suppliedIdentifier.toLowerCase();
        const user = await User.findOne({
            $or: [
                { email: normalizedIdentifier },
                { loginId: suppliedIdentifier.toUpperCase() }
            ]
        }).select("+password");


        if (!user) {

            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password."
            });

        }


        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );


        if (!passwordMatch) {

            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password."
            });

        }

        if (user.role !== portal) {
            return res.status(403).json({
                success: false,
                message: portal === "student"
                    ? "Administrator and volunteer accounts must use their separate sign-in portals."
                    : `These credentials do not belong to a ${portal} account.`
            });
        }


        if (
            user.role === "student" && !user.isEmailVerified
        ) {

            return res.status(403).json({
                success: false,
                message:
                    "Please verify your email before logging in.",
                email:
                    user.email
            });

        }


        const token = createToken(user);


        return res.status(200).json({

            success: true,

            message:
                "Login successful.",

            token,

            user:
                publicUser(user)

        });


    } catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Login failed. Please try again."
        });

    }

};

exports.getCurrentUser = (req, res) => {
    return res.status(200).json({
        success: true,
        user: publicUser(req.user)
    });
};


// =====================================================
// FORGOT PASSWORD
// =====================================================


exports.forgotPassword = async (req, res) => {
    try {
        console.log("FORGOT PASSWORD: Request received");

        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required."
            });
        }

        const normalizedEmail = String(email)
            .trim()
            .toLowerCase();

        console.log("FORGOT PASSWORD: Checking user");

        const user = await User.findOne({
            email: normalizedEmail
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "No account found with this email."
            });
        }

        console.log("FORGOT PASSWORD: User found");

        const otp = generateOTP();

        user.otp = otp;
        user.otpExpiresAt = new Date(
            Date.now() + 10 * 60 * 1000
        );

        await user.save();

        console.log("FORGOT PASSWORD: OTP saved");
        console.log("FORGOT PASSWORD: Sending email");

        await sendPasswordResetOTP(normalizedEmail, otp);

        console.log("FORGOT PASSWORD: Email sent successfully");

        return res.status(200).json({
            success: true,
            message: "Password reset OTP has been sent to your email."
        });

    } catch (error) {
        console.error("FORGOT PASSWORD ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to process password reset request."
        });
    }
};



// =====================================================
// RESET PASSWORD
// =====================================================

exports.resetPassword =
    async (
        req,
        res
    ) => {

        try {

            const {
                email,
                otp,
                newPassword,
                confirmPassword
            } = req.body;


            if (
                !email ||
                !otp ||
                !newPassword ||
                !confirmPassword
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "All fields are required."
                });

            }


            if (
                newPassword !==
                confirmPassword
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Passwords do not match."
                });

            }


            if (
                newPassword.length < 6
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Password must be at least 6 characters long."
                });

            }


            const normalizedEmail =
                String(email)
                    .trim()
                    .toLowerCase();


            const user =
                await User.findOne({
                    email:
                        normalizedEmail
                })
                    .select(
                        "+password +otp +otpExpiresAt"
                    );


            if (!user) {

                return res.status(404).json({
                    success: false,
                    message:
                        "User not found."
                });

            }


            if (
                !user.otp ||
                !user.otpExpiresAt
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "OTP not found. Please request a new OTP."
                });

            }


            if (
                user.otpExpiresAt <
                new Date()
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "OTP has expired. Please request a new OTP."
                });

            }


            if (
                String(user.otp) !==
                String(otp).trim()
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid OTP."
                });

            }


            user.password =
                await bcrypt.hash(
                    newPassword,
                    12
                );

            user.otp =
                undefined;

            user.otpExpiresAt =
                undefined;


            await user.save();


            return res.status(200).json({
                success: true,
                message:
                    "Password reset successfully. You can now login."
            });


        } catch (error) {

            console.error(
                "RESET PASSWORD ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Password reset failed."
            });

        }

    };
