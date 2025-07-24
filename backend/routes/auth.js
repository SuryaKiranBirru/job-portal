const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Controllers (to be implemented)
// const { register, login, linkedinAuth, resetPassword } = require('../controllers/authController');

// Register (role: candidate/employer)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!['candidate', 'employer'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
    });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Create JWT
    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      token,
      user: { role: user.role, name: user.name, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// LinkedIn OAuth (placeholder)
router.get('/linkedin', (req, res) => {
  // LinkedIn OAuth logic here
  res.send('LinkedIn OAuth endpoint');
});

// Password reset (placeholder)
router.post('/reset-password', (req, res) => {
  // password reset logic here
  res.send('Reset password endpoint');
});

module.exports = router; 