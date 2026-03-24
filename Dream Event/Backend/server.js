const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const { connectDB } = require("./config/db");
const authRoutes = require("./routes/auth");
const bookingRoutes = require("./routes/bookings");
const adminRoutes = require("./routes/admin");

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, "../Frontend")));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);

// Feedback route
app.post("/api/feedback", async (req, res) => {
  try {
    const Feedback = require("./models/Feedback");
    const { name, email, message, rating } = req.body;
    const feedback = new Feedback({ name, email, message, rating });
    await feedback.save();
    res.json({ message: "Feedback submitted successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Error submitting feedback" });
  }
});

// Serve frontend pages
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../Frontend/login.html"));
});
app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "../Frontend/signup.html"));
});
app.get("/booking", (req, res) => {
  res.sendFile(path.join(__dirname, "../Frontend/booking.html"));
});
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "../Frontend/admin.html"));
});
app.get("/admin-login", (req, res) => {
  res.sendFile(path.join(__dirname, "../Frontend/admin-login.html"));
});
app.get("/admin-dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "../Frontend/admin-dashboard.html"));
});
app.get("/quick-admin", (req, res) => {
  res.sendFile(path.join(__dirname, "../Frontend/quick-admin.html"));
});
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../Frontend/index.html"));
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Subh Event Server running on http://localhost:${PORT}`);
});
