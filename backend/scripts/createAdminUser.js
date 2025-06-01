const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config');
const User = require('../models/User');

const createAdminUser = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');

    // Check if an admin user already exists (optional)
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    if (existingAdmin) {
      console.log('Admin user already exists.');
      mongoose.connection.close();
      return;
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('1421yash', salt); // !!! CHANGE THIS PASSWORD !!!

    // Create new admin user
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin', // Assuming your User model supports a 'role' field
      googleId: 'yashbt22csd@gmail.com' // Add the required googleId
    });

    await adminUser.save();
    console.log('Admin user created successfully!');

    mongoose.connection.close();

  } catch (err) {
    console.error('Error creating admin user:', err);
    mongoose.connection.close();
    process.exit(1);
  }
};

createAdminUser(); 