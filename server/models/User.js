const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true
        },

        /*
         * College PID / Student PID
         */
        collegePid: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        // Volunteers receive a separate login ID created by the admin.
        loginId: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
            uppercase: true
        },

        departmentName: {
            type: String,
            trim: true,
            default: ""
        },

        assignedEvents: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event"
        }],

        mobileNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        collegeName: {
            type: String,
            required: function () { return this.role !== "volunteer"; },
            trim: true,
            default: ""
        },

        yearSemester: {
            type: String,
            required: function () { return this.role !== "volunteer"; },
            trim: true,
            default: ""
        },

        password: {
            type: String,
            required: true,
            select: false
        },

        role: {
            type: String,
            enum: [
                "student",
                "admin",
                "volunteer"
            ],
            default: "student"
        },

        isEmailVerified: {
            type: Boolean,
            default: false
        },

        otp: {
            type: String,
            select: false
        },

        otpExpiresAt: {
            type: Date,
            select: false
        }
    },

    {
        timestamps: true
    }
);

module.exports =
    mongoose.model(
        "User",
        userSchema
    );
