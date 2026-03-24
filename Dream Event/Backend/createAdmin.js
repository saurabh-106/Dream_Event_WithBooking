const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Import User model
const User = require("./models/User");

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/dreamevent", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const createAdmin = async () => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: "saurabhjaiswar211@gmail.com" });
    
    if (existingUser) {
      console.log("User already exists! Updating role to admin...");
      existingUser.role = "admin";
      await existingUser.save();
      console.log("✅ User role updated to admin successfully!");
    } else {
      console.log("Creating new admin user...");
      // Create new admin user
      const hashedPassword = await bcrypt.hash("12345", 10);
      
      const admin = new User({
        username: "Saurabh Jaiswar",
        email: "saurabhjaiswar211@gmail.com",
        password: hashedPassword,
        role: "admin"
      });
      
      await admin.save();
      console.log("✅ New admin user created successfully!");
    }
    
    console.log("📧 Email: saurabhjaiswar211@gmail.com");
    console.log("🔑 Password: 12345");
    console.log("🔗 Admin Dashboard: http://localhost:5001/admin-dashboard");
    console.log("🔗 Admin Login: http://localhost:5001/admin-login");
    
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
};

createAdmin();
