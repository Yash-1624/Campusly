require("dotenv").config();

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const email = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
        const password = process.env.ADMIN_PASSWORD || "";

        if (!email || !password || password.length < 12) {
            throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters) in server/.env before creating an admin account.");
        }

        const existing = await User.findOne({
            email
        });

        if (existing) {
            console.log("Admin already exists.");
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(
            password,
            12
        );

        await User.create({
            fullName: "System Administrator",

            // Required College PID
            collegePid: "ADMIN001",

            email,

            mobileNumber: "9999999999",

            collegeName: "College Administration",

            yearSemester: "Administrator",

            password: hashedPassword,

            role: "admin",

            isEmailVerified: true
        });

        console.log("Admin created successfully.");

        process.exit(0);

    } catch (error) {
        console.error(error);

        process.exit(1);
    }
};

seedAdmin();
