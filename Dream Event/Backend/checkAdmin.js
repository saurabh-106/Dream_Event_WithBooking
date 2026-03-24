const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dreamevent')
  .then(async () => {
    console.log('Checking admin user...');
    
    const adminUser = await User.findOne({ email: 'admin@dreamevent.com' });
    
    if (adminUser) {
      console.log('Admin found:', adminUser.email, 'Role:', adminUser.role);
    } else {
      console.log('Admin not found. Creating...');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const admin = new User({
        username: 'Admin',
        email: 'admin@dreamevent.com',
        password: hashedPassword,
        role: 'admin'
      });
      
      await admin.save();
      console.log('Admin created successfully!');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
