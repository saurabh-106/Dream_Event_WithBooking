const express = require("express");
const router = express.Router();
const adminAuth = require("../middleware/adminAuth");
const User = require("../models/User");
const Booking = require("../models/Booking");
const Feedback = require("../models/Feedback");

// Get dashboard statistics
router.get("/stats", adminAuth, async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalFeedback = await Feedback.countDocuments();
    
    // Calculate estimated revenue (assuming average booking value of $500)
    const estimatedRevenue = totalBookings * 500;
    
    // Get recent bookings
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'username email');
    
    // Get recent feedback
    const recentFeedback = await Feedback.find()
      .sort({ createdAt: -1 })
      .limit(5);
    
    res.json({
      totalBookings,
      totalUsers,
      totalFeedback,
      estimatedRevenue: `$${estimatedRevenue.toLocaleString()}`,
      recentBookings,
      recentFeedback
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching dashboard stats", error: error.message });
  }
});

// Get all bookings
router.get("/bookings", adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { eventType: { $regex: search, $options: "i" } }
        ]
      };
    }
    
    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'username email');
    
    const total = await Booking.countDocuments(query);
    
    res.json({
      bookings,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching bookings", error: error.message });
  }
});

// Update booking status
router.put("/bookings/:id/status", adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('userId', 'username email');
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    res.json({ message: "Booking status updated successfully", booking });
  } catch (error) {
    res.status(500).json({ message: "Error updating booking", error: error.message });
  }
});

// Delete booking
router.delete("/bookings/:id", adminAuth, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    res.json({ message: "Booking deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting booking", error: error.message });
  }
});

// Get all users
router.get("/users", adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    if (search) {
      query = {
        $or: [
          { username: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } }
        ]
      };
    }
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error: error.message });
  }
});

// Update user role
router.put("/users/:id/role", adminAuth, async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({ message: "User role updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Error updating user role", error: error.message });
  }
});

// Delete user
router.delete("/users/:id", adminAuth, async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }
    
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Also delete user's bookings
    await Booking.deleteMany({ userId: req.params.id });
    
    res.json({ message: "User and associated bookings deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user", error: error.message });
  }
});

// Get all feedback
router.get("/feedback", adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { message: { $regex: search, $options: "i" } }
        ]
      };
    }
    
    const feedback = await Feedback.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Feedback.countDocuments(query);
    
    res.json({
      feedback,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching feedback", error: error.message });
  }
});

// Delete feedback
router.delete("/feedback/:id", adminAuth, async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    
    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }
    
    res.json({ message: "Feedback deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting feedback", error: error.message });
  }
});

// Get analytics data
router.get("/analytics", adminAuth, async (req, res) => {
  try {
    // Booking trends by month
    const bookingTrends = await Booking.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Event types distribution
    const eventTypes = await Booking.aggregate([
      {
        $group: {
          _id: "$eventType",
          count: { $sum: 1 }
        }
      }
    ]);
    
    // User growth by month
    const userGrowth = await User.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Average rating
    const avgRating = await Feedback.aggregate([
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" }
        }
      }
    ]);
    
    res.json({
      bookingTrends,
      eventTypes,
      userGrowth,
      averageRating: avgRating[0]?.avgRating || 0
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching analytics", error: error.message });
  }
});

// Get comprehensive report data
router.get("/reports/:type", adminAuth, async (req, res) => {
  try {
    const { type } = req.params;
    const { dateRange = "all", startDate, endDate } = req.query;
    
    // Build date filter
    let dateFilter = {};
    if (dateRange !== "all") {
      const now = new Date();
      let filterStart, filterEnd;
      
      switch (dateRange) {
        case "today":
          filterStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          filterEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          break;
        case "week":
          filterStart = new Date(now.setDate(now.getDate() - now.getDay()));
          filterEnd = new Date(now.setDate(now.getDate() - now.getDay() + 7));
          break;
        case "month":
          filterStart = new Date(now.getFullYear(), now.getMonth(), 1);
          filterEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case "quarter":
          const quarter = Math.floor(now.getMonth() / 3);
          filterStart = new Date(now.getFullYear(), quarter * 3, 1);
          filterEnd = new Date(now.getFullYear(), quarter * 3 + 3, 0);
          break;
        case "year":
          filterStart = new Date(now.getFullYear(), 0, 1);
          filterEnd = new Date(now.getFullYear(), 11, 31);
          break;
        case "custom":
          if (startDate && endDate) {
            filterStart = new Date(startDate);
            filterEnd = new Date(endDate);
            filterEnd.setDate(filterEnd.getDate() + 1); // Include end date
          }
          break;
      }
      
      if (filterStart && filterEnd) {
        dateFilter = { createdAt: { $gte: filterStart, $lt: filterEnd } };
      }
    }
    
    let reportData = {};
    
    switch (type) {
      case "bookings":
        const bookings = await Booking.find(dateFilter)
          .sort({ createdAt: -1 })
          .populate('userId', 'username email');
        
        const bookingStats = {
          total: bookings.length,
          pending: bookings.filter(b => b.status === 'pending').length,
          confirmed: bookings.filter(b => b.status === 'confirmed').length,
          cancelled: bookings.filter(b => b.status === 'cancelled').length,
          byEventType: bookings.reduce((acc, b) => {
            acc[b.eventType] = (acc[b.eventType] || 0) + 1;
            return acc;
          }, {}),
          totalRevenue: bookings.reduce((sum, b) => sum + (b.budget || 0), 0)
        };
        
        reportData = { bookings, stats: bookingStats };
        break;
        
      case "users":
        const users = await User.find(dateFilter)
          .select('-password')
          .sort({ createdAt: -1 });
        
        const userStats = {
          total: users.length,
          admins: users.filter(u => u.role === 'admin').length,
          regularUsers: users.filter(u => u.role === 'user').length,
          byMonth: users.reduce((acc, u) => {
            const month = new Date(u.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            acc[month] = (acc[month] || 0) + 1;
            return acc;
          }, {})
        };
        
        reportData = { users, stats: userStats };
        break;
        
      case "revenue":
        const revenueBookings = await Booking.find({
          ...dateFilter,
          status: { $ne: 'cancelled' }
        }).sort({ createdAt: -1 });
        
        const revenueStats = {
          totalRevenue: revenueBookings.reduce((sum, b) => sum + (b.budget || 0), 0),
          averageBookingValue: revenueBookings.length > 0 ? 
            revenueBookings.reduce((sum, b) => sum + (b.budget || 0), 0) / revenueBookings.length : 0,
          byMonth: revenueBookings.reduce((acc, b) => {
            const month = new Date(b.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            acc[month] = (acc[month] || 0) + (b.budget || 0);
            return acc;
          }, {}),
          byEventType: revenueBookings.reduce((acc, b) => {
            acc[b.eventType] = (acc[b.eventType] || 0) + (b.budget || 0);
            return acc;
          }, {})
        };
        
        reportData = { bookings: revenueBookings, stats: revenueStats };
        break;
        
      case "feedback":
        const feedbackData = await Feedback.find(dateFilter)
          .sort({ createdAt: -1 });
        
        const feedbackStats = {
          total: feedbackData.length,
          averageRating: feedbackData.length > 0 ? 
            feedbackData.reduce((sum, f) => sum + f.rating, 0) / feedbackData.length : 0,
          byRating: feedbackData.reduce((acc, f) => {
            acc[f.rating] = (acc[f.rating] || 0) + 1;
            return acc;
          }, {}),
          byMonth: feedbackData.reduce((acc, f) => {
            const month = new Date(f.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            acc[month] = (acc[month] || 0) + 1;
            return acc;
          }, {})
        };
        
        reportData = { feedback: feedbackData, stats: feedbackStats };
        break;
        
      case "events":
        const allBookings = await Booking.find(dateFilter)
          .sort({ createdAt: -1 })
          .populate('userId', 'username email');
        
        const eventStats = {
          totalEvents: allBookings.length,
          upcomingEvents: allBookings.filter(b => new Date(b.eventDate) > new Date()).length,
          pastEvents: allBookings.filter(b => new Date(b.eventDate) <= new Date()).length,
          byEventType: allBookings.reduce((acc, b) => {
            acc[b.eventType] = (acc[b.eventType] || 0) + 1;
            return acc;
          }, {}),
          byStatus: {
            pending: allBookings.filter(b => b.status === 'pending').length,
            confirmed: allBookings.filter(b => b.status === 'confirmed').length,
            cancelled: allBookings.filter(b => b.status === 'cancelled').length
          },
          averageGuests: allBookings.length > 0 ? 
            allBookings.reduce((sum, b) => sum + (b.guestCount || 0), 0) / allBookings.length : 0
        };
        
        reportData = { events: allBookings, stats: eventStats };
        break;
        
      default:
        return res.status(400).json({ message: "Invalid report type" });
    }
    
    res.json({
      type,
      dateRange,
      generatedAt: new Date().toISOString(),
      ...reportData
    });
    
  } catch (error) {
    res.status(500).json({ message: "Error generating report", error: error.message });
  }
});

// Get report statistics
router.get("/reports-stats", adminAuth, async (req, res) => {
  try {
    // This would typically come from a database table tracking report generation
    // For now, we'll return mock data
    res.json({
      totalReports: 0,
      totalDownloads: 0,
      lastReport: null,
      avgTime: 0
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching report stats", error: error.message });
  }
});

module.exports = router;
