/**
 * Document Routes — Upload, List, Download, Delete
 * 
 * POST   /api/documents/upload — Upload a document (base64)
 * GET    /api/documents/list   — List user's documents (metadata only)
 * GET    /api/documents/:id    — Get a single document (with file data)
 * DELETE /api/documents/:id    — Delete a document
 * 
 * All routes are protected (require JWT token).
 */

const express = require('express');
const Document = require('../models/Document');
const auth = require('../middleware/auth');

const router = express.Router();

// Maximum file size: 5MB (in bytes)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed file types
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

/**
 * POST /api/documents/upload
 * 
 * Uploads a document as a base64 string.
 * Validates file type and size before saving.
 */
router.post('/upload', auth, async (req, res) => {
  try {
    const { fileName, fileType, fileSize, fileData } = req.body;

    // Validate required fields
    if (!fileName || !fileType || !fileData) {
      return res.status(400).json({ message: 'fileName, fileType, and fileData are required' });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(fileType)) {
      return res.status(400).json({
        message: `File type not allowed. Accepted: ${ALLOWED_TYPES.join(', ')}`,
      });
    }

    // Validate file size (5MB limit)
    if (fileSize > MAX_FILE_SIZE) {
      return res.status(400).json({ message: 'File size exceeds 5MB limit' });
    }

    // Create the document record
    const document = await Document.create({
      userId: req.user.id,
      fileName,
      fileType,
      fileSize,
      fileData,
    });

    // Return metadata only (not the full base64 data) for efficiency
    res.status(201).json({
      _id: document._id,
      fileName: document.fileName,
      fileType: document.fileType,
      fileSize: document.fileSize,
      createdAt: document.createdAt,
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ message: 'Server error uploading document' });
  }
});

/**
 * GET /api/documents/list
 * 
 * Lists all documents for the logged-in user.
 * Returns metadata only (no fileData) for performance.
 */
router.get('/list', auth, async (req, res) => {
  try {
    // Find all documents for this user, exclude the large fileData field
    const documents = await Document.find({ userId: req.user.id })
      .select('-fileData')
      .sort({ createdAt: -1 });

    res.json(documents);
  } catch (error) {
    console.error('List documents error:', error);
    res.status(500).json({ message: 'Server error listing documents' });
  }
});

/**
 * GET /api/documents/:id
 * 
 * Gets a single document with its file data (for downloading).
 * Only the owner can access their documents.
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Security: only the owner can download
    if (document.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this document' });
    }

    res.json(document);
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ message: 'Server error fetching document' });
  }
});

/**
 * DELETE /api/documents/:id
 * 
 * Deletes a document. Only the owner can delete their documents.
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Security: only the owner can delete
    if (document.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this document' });
    }

    await Document.findByIdAndDelete(req.params.id);
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ message: 'Server error deleting document' });
  }
});

module.exports = router;
