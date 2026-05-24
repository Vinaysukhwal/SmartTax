/**
 * ITR Routes — Save & Retrieve ITR Filing Data
 * 
 * POST /api/itr/save       — Create or update an ITR filing
 * GET  /api/itr/get/:userId — Get the latest filing for a user
 * 
 * All routes are protected (require JWT token).
 */

const express = require('express');
const ItrFiling = require('../models/ItrFiling');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/itr/save
 * 
 * Creates a new ITR filing or updates an existing one.
 * Uses "upsert" — if a filing exists for this user + assessment year,
 * it updates it. Otherwise, it creates a new one.
 */
router.post('/save', auth, async (req, res) => {
  try {
    const { itrType, assessmentYear, status, currentStep, formData } = req.body;

    // Validate ITR type is provided
    if (!itrType) {
      return res.status(400).json({ message: 'ITR type is required' });
    }

    // Upsert: find by userId + assessmentYear, update or create
    const filing = await ItrFiling.findOneAndUpdate(
      {
        userId: req.user.id,
        assessmentYear: assessmentYear || '2026-27',
      },
      {
        itrType,
        status: status || 'in-progress',
        currentStep: currentStep || 1,
        formData: formData || {},
      },
      {
        new: true,       // Return the updated document
        upsert: true,    // Create if doesn't exist
        runValidators: true,
      }
    );

    res.json(filing);
  } catch (error) {
    console.error('Save ITR error:', error);
    res.status(500).json({ message: 'Server error saving ITR filing' });
  }
});

/**
 * GET /api/itr/get/:userId
 * 
 * Gets the latest ITR filing for a user.
 * Note: We verify the requesting user matches the userId param for security.
 */
router.get('/get/:userId', auth, async (req, res) => {
  try {
    // Security check: users can only view their own filings
    if (req.user.id !== req.params.userId) {
      return res.status(403).json({ message: 'You can only view your own filings' });
    }

    // Get the most recent filing for this user
    const filing = await ItrFiling.findOne({ userId: req.params.userId })
      .sort({ updatedAt: -1 }); // Most recently updated first

    if (!filing) {
      return res.json(null); // No filing found — that's okay
    }

    res.json(filing);
  } catch (error) {
    console.error('Get ITR error:', error);
    res.status(500).json({ message: 'Server error fetching ITR filing' });
  }
});

module.exports = router;
