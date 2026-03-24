const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const jwt = require("jsonwebtoken");

// Optional auth middleware — attaches userId if token present
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
      req.userId = decoded.userId;
    } catch (_) {}
  }
  next();
}

// Auth required middleware
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }
  try {
    const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (_) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// POST /api/bookings — Create a new booking
router.post("/", optionalAuth, async (req, res) => {
  try {
    const { name, email, phone, eventType, eventDate, guestCount, venue, budget, message } = req.body;

    if (!name || !email || !phone || !eventType || !eventDate || !guestCount) {
      return res.status(400).json({ message: "Please fill all required fields." });
    }

    // Validate date is in future
    if (new Date(eventDate) < new Date()) {
      return res.status(400).json({ message: "Event date must be in the future." });
    }

    const booking = new Booking({
      userId: req.userId || null,
      name,
      email,
      phone,
      eventType,
      eventDate,
      guestCount,
      venue,
      budget,
      message,
    });

    await booking.save();

    res.status(201).json({
      message: "Booking confirmed! We'll contact you within 24 hours.",
      bookingId: booking.bookingId,
      booking: {
        bookingId: booking.bookingId,
        eventType: booking.eventType,
        eventDate: booking.eventDate,
        status: booking.status,
      },
    });
  } catch (error) {
    console.error("Booking error:", error);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});

// GET /api/bookings/track/:bookingId — Track booking by ID (public)
router.get("/track/:bookingId", async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingId: req.params.bookingId }).select("-__v");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found. Please check your booking ID." });
    }
    res.json({ booking });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
});

// GET /api/bookings/my — Get all bookings for logged-in user
router.get("/my", requireAuth, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.userId }).sort({ createdAt: -1 }).select("-__v");
    res.json({ bookings });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
});

// GET /api/bookings — Admin: get all bookings
router.get("/", requireAuth, async (req, res) => {
  try {
    const { status, eventType, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (eventType) filter.eventType = eventType;

    const bookings = await Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select("-__v");

    const total = await Booking.countDocuments(filter);
    res.json({ bookings, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
});

// PATCH /api/bookings/:id/status — Update booking status
router.patch("/:id/status", requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Pending", "Confirmed", "Cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status." });
    }
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!booking) return res.status(404).json({ message: "Booking not found." });
    res.json({ message: "Status updated.", booking });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
