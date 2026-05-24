/**
 * Notice Routes — CRUD for IT Department Notices
 * 
 * GET    /api/notices      — List all notices for the user
 * POST   /api/notices      — Add a new notice
 * PUT    /api/notices/:id  — Update a notice (e.g., change status)
 * DELETE /api/notices/:id  — Delete a notice
 * 
 * All routes are protected (require JWT token).
 */

const express = require('express');
const Notice = require('../models/Notice');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/notices
 * 
 * Lists all notices for the logged-in user, sorted by due date.
 */
router.get('/', auth, async (req, res) => {
  try {
    const notices = await Notice.find({ userId: req.user.id })
      .sort({ dueDate: 1 }); // Earliest due date first

    res.json(notices);
  } catch (error) {
    console.error('List notices error:', error);
    res.status(500).json({ message: 'Server error listing notices' });
  }
});

/**
 * POST /api/notices
 * 
 * Adds a new notice entry.
 */
router.post('/', auth, async (req, res) => {
  try {
    const { noticeType, dateReceived, dueDate, status, notes } = req.body;

    // Validate required fields
    if (!noticeType || !dateReceived || !dueDate) {
      return res.status(400).json({ message: 'Notice type, date received, and due date are required' });
    }

    const notice = await Notice.create({
      userId: req.user.id,
      noticeType,
      dateReceived,
      dueDate,
      status: status || 'Pending',
      notes: notes || '',
    });

    res.status(201).json(notice);
  } catch (error) {
    console.error('Add notice error:', error);
    res.status(500).json({ message: 'Server error adding notice' });
  }
});

/**
 * PUT /api/notices/:id
 * 
 * Updates a notice (typically to change its status).
 * Only the owner can update.
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    // Security: only the owner can update
    if (notice.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this notice' });
    }

    // Update allowed fields
    const { noticeType, dateReceived, dueDate, status, notes } = req.body;
    if (noticeType) notice.noticeType = noticeType;
    if (dateReceived) notice.dateReceived = dateReceived;
    if (dueDate) notice.dueDate = dueDate;
    if (status) notice.status = status;
    if (notes !== undefined) notice.notes = notes;

    await notice.save();
    res.json(notice);
  } catch (error) {
    console.error('Update notice error:', error);
    res.status(500).json({ message: 'Server error updating notice' });
  }
});

/**
 * DELETE /api/notices/:id
 * 
 * Deletes a notice. Only the owner can delete.
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    // Security: only the owner can delete
    if (notice.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this notice' });
    }

    await Notice.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notice deleted successfully' });
  } catch (error) {
    console.error('Delete notice error:', error);
    res.status(500).json({ message: 'Server error deleting notice' });
  }
});

module.exports = router;
