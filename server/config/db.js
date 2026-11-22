
const mongoose = require("mongoose");

const connectDB = async () => {
    let mongoUri = process.env.MONGO_URI;

    try {
        // Production must use MongoDB Atlas
        if (process.env.NODE_ENV === "production") {
            if (!mongoUri) {
                throw new Error("MONGO_URI is required in production");
            }

            await mongoose.connect(mongoUri, {
                maxPoolSize: 10,
                minPoolSize: 1,
                serverSelectionTimeoutMS: 10000,
                socketTimeoutMS: 45000
            });

            console.log("MongoDB Atlas connected successfully");
            return;
        }

        // Local development
        if (!mongoUri) {
            mongoUri = "mongodb://127.0.0.1:27017/college-event-management";
        }

        try {
            await mongoose.connect(mongoUri, {
                maxPoolSize: 10,
                minPoolSize: 1,
                serverSelectionTimeoutMS: 10000,
                socketTimeoutMS: 45000
            });

            console.log("MongoDB connected successfully");
        } catch (error) {
            // Memory database fallback only for local development
            if (!/localhost|127\.0\.0\.1/.test(mongoUri)) {
                throw error;
            }

            console.log("Local MongoDB unavailable. Starting Memory Server...");

            const { MongoMemoryServer } = require("mongodb-memory-server");

            const memoryServer = await MongoMemoryServer.create();
            const memoryUri = memoryServer.getUri();

            await mongoose.connect(memoryUri);

            console.log("MongoDB connected successfully using in-memory server");
        }

    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
