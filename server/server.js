
const dotenv = require("dotenv");

// Load environment variables FIRST
dotenv.config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

const app = express();

// ========================================
// CORS CONFIGURATION
// ========================================

const allowedOrigins = (
    process.env.CLIENT_URL || "http://localhost:5173"
)
    .split(",")
    .map((url) => url.trim().replace(/\/+$/, ""))
    .filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            // Requests without an Origin header don't need CORS permission
            if (!origin) {
                return callback(null, false);
            }

            if (allowedOrigins.includes(origin)) {
                return callback(null, origin);
            }

            console.log("CORS blocked origin:", origin);
            return callback(new Error("Not allowed by CORS"));
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"]
    })
);

// ========================================
// MIDDLEWARE
// ========================================

app.use(express.json({ limit: "5mb" }));

// ========================================
// ROUTES
// ========================================

app.use("/api/analytics", require("./routes/analyticsRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/profile", require("./routes/profileRoutes"));
app.use("/api/events", require("./routes/eventRoutes"));
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/registrations", require("./routes/registrationRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/tickets", require("./routes/ticketRoutes"));
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
    console.error("Server Error:", err.message);

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

        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Server running on port ${PORT}`);

            console.log("Allowed frontend origins:", allowedOrigins);

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
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
};

startServer();
