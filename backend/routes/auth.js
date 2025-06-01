const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const User = require('../models/User'); // Import User model
const bcrypt = require('bcryptjs'); // Import bcryptjs for password comparison
const config = require('../config'); // Require the main config file

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/login',
    session: false
  }),
  (req, res) => {
    try {
      const token = jwt.sign(
        { 
          id: req.user._id, 
          email: req.user.email, 
          name: req.user.name, 
          picture: req.user.picture 
        },
        config.JWT_SECRET,
        { expiresIn: '1d' }
      );
      
      res.redirect(`${config.CORS_ORIGIN}/auth/callback?token=${token}&id=${req.user._id}&name=${encodeURIComponent(req.user.name)}&email=${encodeURIComponent(req.user.email)}&picture=${encodeURIComponent(req.user.picture)}`);
    } catch (error) {
      console.error('Token generation error:', error);
      res.redirect(`${config.CORS_ORIGIN}/login?error=token_generation_failed`);
    }
  }
);

// Get current user
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin || user.createdAt
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout
router.get('/logout', verifyToken, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// Login with email and password
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const payload = { userId: user.id };
    const token = jwt.sign(payload, config.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router; 