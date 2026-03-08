import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// Get user notifications
router.get('/', authenticate, async (req, res) => {
  try {
    const { limit = 20, unreadOnly = false } = req.query;
    
    let query = { recipient: req.user._id };
    if (unreadOnly === 'true') {
      query.read = false;
    }
    
    const notifications = await Notification.find(query)
      .populate('sender', 'username avatar channelName')
      .populate('video', 'title thumbnailUrl')
      .sort('-createdAt')
      .limit(parseInt(limit));
    
    res.json(notifications);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get unread count
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      read: false
    });
    
    res.json({ count });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Mark notification as read
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', authenticate, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    );
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete notification
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id
    });
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Helper function to create notification (used by other routes)
export const createNotification = async ({ recipient, sender, type, video, comment, message, link }) => {
  try {
    // Don't create notification if sender is the same as recipient
    if (sender && sender.toString() === recipient.toString()) {
      return null;
    }
    
    const notification = new Notification({
      recipient,
      sender,
      type,
      video,
      comment,
      message,
      link
    });
    
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

export default router;
