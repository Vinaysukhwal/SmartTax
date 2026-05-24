/**
 * Notice Model
 * 
 * Tracks income tax notices received from the IT department.
 * Users manually add notices and update their status.
 * 
 * Fields:
 * - userId: Who received this notice
 * - noticeType: Type of notice (e.g., "Intimation u/s 143(1)")
 * - dateReceived: When the notice was received
 * - dueDate: Deadline to respond
 * - status: Current status (Pending / Responded / Resolved)
 * - notes: Optional notes about the notice
 */

const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  noticeType: {
    type: String,
    required: [true, 'Notice type is required'],
    trim: true,
  },
  dateReceived: {
    type: Date,
    required: [true, 'Date received is required'],
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
  },
  status: {
    type: String,
    enum: ['Pending', 'Responded', 'Resolved'],
    default: 'Pending',
  },
  notes: {
    type: String,
    trim: true,
    default: '',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Notice', noticeSchema);
