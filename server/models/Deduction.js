/**
 * Deduction Model
 * 
 * Tracks tax deductions claimed by a user under various sections
 * of the Income Tax Act (80C, 80D, 80CCD, 80E, 80G).
 * 
 * Fields:
 * - userId: Who this deduction belongs to
 * - section: Tax section (e.g., "80C", "80D")
 * - amount: Deduction amount in ₹
 * - description: What the investment/expense is (e.g., "PPF", "LIC Premium")
 * - financialYear: Which FY this deduction is for (e.g., "2025-26")
 */

const mongoose = require('mongoose');

const deductionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  section: {
    type: String,
    required: [true, 'Section is required'],
    enum: ['80C', '80D', '80CCD(1B)', '80E', '80G'],
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
  },
  financialYear: {
    type: String,
    default: '2025-26',
  },
}, {
  timestamps: true,
});

// Index for quick lookups by user and financial year
deductionSchema.index({ userId: 1, financialYear: 1 });

module.exports = mongoose.model('Deduction', deductionSchema);
