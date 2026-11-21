const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const connectDB = async () => {
    let mongoUri = process.env.MONGO_URI;

    try {
        if (!mongoUri) {
            mongoUri = "mongodb://127.0.0.1:27017/college-event-management";
        }

        await mongoose.connect(mongoUri);

        console.log("MongoDB connected successfully");
    } catch (error) {
        const shouldUseMemoryFallback =
            !mongoUri || /localhost|127\.0\.0\.1/.test(mongoUri);

        if (!shouldUseMemoryFallback) {
            console.error("MongoDB connection failed:", error.message);
            process.exit(1);
        }

        try {
            const memoryServer = await MongoMemoryServer.create();
            const memoryUri = memoryServer.getUri();
            process.env.MONGO_URI = memoryUri;

            await mongoose.connect(memoryUri);

            console.log("MongoDB connected successfully using in-memory server");
        } catch (memoryError) {
            console.error("MongoDB connection failed:", memoryError.message);
            process.exit(1);
        }
    }
};

module.exports = connectDB;