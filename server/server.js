
const dotenv = require("dotenv");

// Load environment variables FIRST
dotenv.config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const { closeExpiredRegistrations } = require("./services/eventLifecycle");

// ========================================
// CREATE EXPRESS APP
// ========================================

const app = express();

// ========================================
// CORS CONFIGURATION
// ========================================

const allowedOrigins = [
    "http://localhost:5173",
    "https://college-event-management-system-lyart.vercel.app"
];

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests without an Origin header
            // and requests from approved frontend URLs
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(
                new Error("Not allowed by CORS: " + origin)
            );
        },
        credentials: true,
        methods: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS"
        ],
        allowedHeaders: [
            "Content-Type",
            "Authorization"
        ]
    })
);

// Parse JSON request body
app.use(express.json({ limit: "5mb" }));

// ========================================
// DATABASE CONNECTION & EVENT LIFECYCLE
// ========================================

const closeExpiredEventRegistrations = () => {
    closeExpiredRegistrations().catch((error) => {
        console.error(
            "EVENT REGISTRATION CLOSURE ERROR:",
            error.message
        );
    });
};

// ========================================
// ROUTES
// ========================================

// Authentication
app.use("/api/analytics", require("./routes/analyticsRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));

// Student Profile
app.use("/api/profile", require("./routes/profileRoutes"));

// Events
app.use("/api/events", require("./routes/eventRoutes"));

// Event Categories
app.use("/api/categories", require("./routes/categoryRoutes"));

// Event Registrations
app.use("/api/registrations", require("./routes/registrationRoutes"));

// Payments / Razorpay
app.use("/api/payments", require("./routes/paymentRoutes"));

// Admin
app.use("/api/admin", require("./routes/adminRoutes"));

// Tickets / QR Scanner
app.use("/api/tickets", require("./routes/ticketRoutes"));

// Volunteer
app.use("/api/volunteer", require("./routes/volunteerRoutes"));

// ========================================
// API TEST ROUTE
// ========================================

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "College Event Management API is running"
    });
});

// ========================================
// 404 ROUTE
// ========================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API route not found"
    });
});

// ========================================
// GLOBAL ERROR HANDLER
// ========================================

app.use((err, req, res, next) => {
    console.error("Server Error:", err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal server error"
    });
});

// ========================================
// START SERVER AFTER DATABASE CONNECTION
// ========================================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();

        console.log("Database connection established");

        // Check expired event registrations
        closeExpiredEventRegistrations();

        // Automatically check every 30 seconds
        const eventRegistrationClosureTimer = setInterval(
            closeExpiredEventRegistrations,
            30_000
        );

        eventRegistrationClosureTimer.unref();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);

            console.log(
                "Allowed frontend origins:",
                allowedOrigins.join(", ")
            );

            console.log(
                `Razorpay Key ID loaded: ${process.env.RAZORPAY_KEY_ID ? "YES" : "NO"
                }`
            );

            console.log(
                `Razorpay Secret loaded: ${process.env.RAZORPAY_KEY_SECRET ? "YES" : "NO"
                }`
            );
        });
    } catch (error) {
        console.error("SERVER STARTUP ERROR:", error.message);
        process.exit(1);
    }
};

startServer();
