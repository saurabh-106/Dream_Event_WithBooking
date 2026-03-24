const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    eventType: {
      type: String,
      required: true,
      enum: ["Wedding", "Birthday", "Corporate", "Cultural", "Photography", "Decoration", "Other"],
    },
    eventDate: { type: Date, required: true },
    guestCount: { type: Number, required: true, min: 1 },
    venue: { type: String, trim: true },
    budget: {
      type: String,
      enum: ["Below ₹50K", "₹50K–₹1L", "₹1L–₹5L", "₹5L–₹10L", "Above ₹10L"],
    },
    message: { type: String, trim: true },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Cancelled"],
      default: "Pending",
    },
    bookingId: { type: String, unique: true },
  },
  { timestamps: true }
);

// Auto-generate bookingId before saving
bookingSchema.pre("save", function (next) {
  if (!this.bookingId) {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.bookingId = `SE-${ts}-${rand}`;
  }
  next();
});

module.exports = mongoose.model("Booking", bookingSchema);
