/**
 * User Routes — Profile Management
 * 
 * GET  /api/user/profile — Get the current user's profile
 * PUT  /api/user/profile — Update profile (name, phone, address)
 * 
 * All routes are protected (require JWT token).
 */

const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/user/profile
 * 
 * Returns the logged-in user's profile data.
 * The password field is excluded from the response.
 */
router.get('/profile', auth, async (req, res) => {
  try {
    // Find user by ID (from JWT), exclude the password field
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

/**
 * PUT /api/user/profile
 * 
 * Updates the user's profile.
 * Only allows updating: name, phone, address.
 * Email and PAN cannot be changed (for security).
 */
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    // Build an update object with only the fields we allow
    const updateFields = {};
    if (name) updateFields.name = name;
    if (phone !== undefined) updateFields.phone = phone;
    if (address) updateFields.address = address;

    // Find and update the user, return the updated document
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

module.exports = router;
