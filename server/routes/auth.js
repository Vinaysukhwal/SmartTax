/**
 * Auth Routes — Register & Login
 * 
 * POST /api/auth/register — Create a new user account
 * POST /api/auth/login    — Login with email & password, get JWT
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

/**
 * Generate a JWT token for a user.
 * The token contains the userId and expires in 7 days.
 * 
 * @param {string} userId - The MongoDB _id of the user
 * @returns {string} - Signed JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

/**
 * POST /api/auth/register
 * 
 * Creates a new user account.
 * Steps:
 * 1. Validate required fields
 * 2. Check if email already exists
 * 3. Create user (password is auto-hashed by the model)
 * 4. Return JWT token + user data
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, pan } = req.body;

    // Validate required fields
    if (!name || !email || !password || !pan) {
      return res.status(400).json({ message: 'All fields are required: name, email, password, pan' });
    }

    // Check if a user with this email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    // Create the new user (password hashing happens in the pre-save hook)
    const user = await User.create({ name, email, password, pan });

    // Generate JWT token
    const token = generateToken(user._id);

    // Send back the token and user info (excluding password)
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        pan: user.pan,
      },
    });
  } catch (error) {
    // Handle Mongoose validation errors (e.g., invalid PAN format)
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

/**
 * POST /api/auth/login
 * 
 * Authenticates a user with email and password.
 * Steps:
 * 1. Find user by email
 * 2. Compare password with hashed password
 * 3. Return JWT token + user data
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Send back token and user info
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        pan: user.pan,
        phone: user.phone,
        address: user.address,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

module.exports = router;
