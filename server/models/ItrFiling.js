/**
 * ITR Filing Model
 * 
 * Stores income tax return filing data for users.
 * Each filing has a type (ITR-1 to ITR-4), status, and form data.
 * Form data is stored as a flexible JSON object since different
 * ITR types have different fields.
 * 
 * Fields:
 * - userId: Reference to the User who created this filing
 * - itrType: Which ITR form (ITR-1, ITR-2, ITR-3, ITR-4)
 * - assessmentYear: e.g., "2026-27" for FY 2025-26
 * - status: Filing progress (not-started, in-progress, filed)
 * - currentStep: Which wizard step the user is on (1-4)
 * - formData: Flexible JSON object storing all form fields
 */

const mongoose = require('mongoose');

const itrFilingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  itrType: {
    type: String,
    enum: ['ITR-1', 'ITR-2', 'ITR-3', 'ITR-4'],
    required: true,
  },
  assessmentYear: {
    type: String,
    default: '2026-27', // AY for FY 2025-26
  },
  status: {
    type: String,
    enum: ['not-started', 'in-progress', 'filed'],
    default: 'not-started',
  },
  currentStep: {
    type: Number,
    default: 1,
    min: 1,
    max: 4,
  },
  formData: {
    // Flexible schema — stores all form fields as a JSON object
    // Structure varies by ITR type
    personalInfo: { type: mongoose.Schema.Types.Mixed, default: {} },
    incomeDetails: { type: mongoose.Schema.Types.Mixed, default: {} },
    deductions: { type: mongoose.Schema.Types.Mixed, default: {} },
    taxComputation: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
}, {
  timestamps: true,
});

// Compound index: one filing per user per assessment year
itrFilingSchema.index({ userId: 1, assessmentYear: 1 });

module.exports = mongoose.model('ItrFiling', itrFilingSchema);
