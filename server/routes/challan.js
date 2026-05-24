/**
 * Challan Routes — Generate Tax Payment Challans
 * 
 * POST /api/challan/generate — Generate a Challan 280 record
 * GET  /api/challan          — List user's challans
 * 
 * All routes are protected (require JWT token).
 */

const express = require('express');
const Challan = require('../models/Challan');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/challan/generate
 * 
 * Creates a new challan record with auto-calculated cess.
 * Cess is 4% of (tax + surcharge) — Health & Education Cess.
 */
router.post('/generate', auth, async (req, res) => {
  try {
    const { assessmentYear, taxAmount, paymentType, surcharge } = req.body;

    // Validate required fields
    if (!assessmentYear || taxAmount === undefined || !paymentType) {
      return res.status(400).json({
        message: 'Assessment year, tax amount, and payment type are required',
      });
    }

    // Calculate cess: 4% of (tax + surcharge)
    const surchageAmount = surcharge || 0;
    const cess = Math.round((taxAmount + surchageAmount) * 0.04);
    const totalAmount = taxAmount + surchageAmount + cess;

    const challan = await Challan.create({
      userId: req.user.id,
      assessmentYear,
      taxAmount,
      surcharge: surchageAmount,
      cess,
      totalAmount,
      paymentType,
    });

    res.status(201).json(challan);
  } catch (error) {
    console.error('Generate challan error:', error);
    res.status(500).json({ message: 'Server error generating challan' });
  }
});

/**
 * GET /api/challan
 * 
 * Lists all challans for the logged-in user.
 */
router.get('/', auth, async (req, res) => {
  try {
    const challans = await Challan.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    res.json(challans);
  } catch (error) {
    console.error('List challans error:', error);
    res.status(500).json({ message: 'Server error listing challans' });
  }
});

module.exports = router;
