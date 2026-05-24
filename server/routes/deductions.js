/**
 * Deductions Routes — CRUD for Tax Deductions
 * 
 * GET    /api/deductions      — List all deductions for the user
 * POST   /api/deductions      — Add a new deduction
 * PUT    /api/deductions/:id  — Update a deduction
 * DELETE /api/deductions/:id  — Delete a deduction
 * 
 * All routes are protected (require JWT token).
 */

const express = require('express');
const Deduction = require('../models/Deduction');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/deductions
 * 
 * Lists all deductions for the logged-in user.
 * Optionally filter by financial year using query param: ?fy=2025-26
 */
router.get('/', auth, async (req, res) => {
  try {
    // Build query filter
    const filter = { userId: req.user.id };

    // Optional: filter by financial year
    if (req.query.fy) {
      filter.financialYear = req.query.fy;
    }

    const deductions = await Deduction.find(filter).sort({ section: 1 });
    res.json(deductions);
  } catch (error) {
    console.error('List deductions error:', error);
    res.status(500).json({ message: 'Server error listing deductions' });
  }
});

/**
 * POST /api/deductions
 * 
 * Adds a new deduction entry.
 */
router.post('/', auth, async (req, res) => {
  try {
    const { section, amount, description, financialYear } = req.body;

    // Validate required fields
    if (!section || !amount || !description) {
      return res.status(400).json({ message: 'Section, amount, and description are required' });
    }

    const deduction = await Deduction.create({
      userId: req.user.id,
      section,
      amount,
      description,
      financialYear: financialYear || '2025-26',
    });

    res.status(201).json(deduction);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('Add deduction error:', error);
    res.status(500).json({ message: 'Server error adding deduction' });
  }
});

/**
 * PUT /api/deductions/:id
 * 
 * Updates an existing deduction. Only the owner can update.
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const deduction = await Deduction.findById(req.params.id);

    if (!deduction) {
      return res.status(404).json({ message: 'Deduction not found' });
    }

    // Security: only the owner can update
    if (deduction.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this deduction' });
    }

    // Update allowed fields
    const { section, amount, description, financialYear } = req.body;
    if (section) deduction.section = section;
    if (amount !== undefined) deduction.amount = amount;
    if (description) deduction.description = description;
    if (financialYear) deduction.financialYear = financialYear;

    await deduction.save();
    res.json(deduction);
  } catch (error) {
    console.error('Update deduction error:', error);
    res.status(500).json({ message: 'Server error updating deduction' });
  }
});

/**
 * DELETE /api/deductions/:id
 * 
 * Deletes a deduction. Only the owner can delete.
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const deduction = await Deduction.findById(req.params.id);

    if (!deduction) {
      return res.status(404).json({ message: 'Deduction not found' });
    }

    // Security: only the owner can delete
    if (deduction.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this deduction' });
    }

    await Deduction.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deduction deleted successfully' });
  } catch (error) {
    console.error('Delete deduction error:', error);
    res.status(500).json({ message: 'Server error deleting deduction' });
  }
});

module.exports = router;
