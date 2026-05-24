/**
 * Document Model
 * 
 * Stores uploaded tax documents (Form 16, 26AS, etc.) in MongoDB.
 * Files are stored as base64 strings directly in the database.
 * 
 * Note: This approach works for a learning project but has a 16MB
 * per-document limit in MongoDB. For production, use cloud storage (S3).
 * 
 * Fields:
 * - userId: Who uploaded this document
 * - fileName: Original file name
 * - fileType: MIME type (e.g., application/pdf, image/jpeg)
 * - fileSize: Size in bytes (for display purposes)
 * - fileData: Base64-encoded file content
 * - uploadedAt: When the file was uploaded
 */

const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fileName: {
    type: String,
    required: [true, 'File name is required'],
    trim: true,
  },
  fileType: {
    type: String,
    required: [true, 'File type is required'],
  },
  fileSize: {
    type: Number,
    required: true,
  },
  fileData: {
    type: String, // Base64-encoded file content
    required: true,
  },
}, {
  timestamps: true, // Adds createdAt (used as uploadedAt) and updatedAt
});

module.exports = mongoose.model('Document', documentSchema);
