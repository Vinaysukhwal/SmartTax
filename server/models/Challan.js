/**
 * Challan Model
 * 
 * Stores generated tax payment challan (Challan 280) records.
 * Used to help users prepare their income tax payments.
 * 
 * Fields:
 * - userId: Who generated this challan
 * - assessmentYear: Which AY (e.g., "2026-27")
 * - taxAmount: Base tax amount
 * - surcharge: Applicable surcharge
 * - cess: Health & education cess (4% of tax + surcharge)
 * - totalAmount: Total payment (tax + surcharge + cess)
 * - paymentType: Type of payment (Advance Tax / Self-Assessment / Regular)
 */

const mongoose = require('mongoose');

const challanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assessmentYear: {
    type: String,
    required: [true, 'Assessment year is required'],
  },
  taxAmount: {
    type: Number,
    required: [true, 'Tax amount is required'],
    min: 0,
  },
  surcharge: {
    type: Number,
    default: 0,
  },
  cess: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  paymentType: {
    type: String,
    enum: ['Advance Tax', 'Self-Assessment Tax', 'Regular Assessment Tax'],
    required: [true, 'Payment type is required'],
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Challan', challanSchema);
