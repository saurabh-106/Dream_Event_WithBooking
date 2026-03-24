const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      w: "majority",
    });
    console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
    console.error("❌ DB connection failed:", error.message);
    console.error("\n⚠️  FIX: Your IP is likely not whitelisted in MongoDB Atlas");
    console.error("👉 Go to: https://cloud.mongodb.com/v2");
    console.error("👉 Click 'Network Access' → Add Current IP Address");
    console.error("👉 Wait 1-2 minutes, then restart the server\n");
    process.exit(1);
  }
};

module.exports = { connectDB };
