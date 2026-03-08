import express from 'express';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { adminAuth } from '../middleware/admin.js';
import { createNotification } from './notification.js';

const router = express.Router();

// Request to become creator
router.post('/request', authenticate, async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already a creator
    if (user.isCreator) {
      return res.status(400).json({ message: 'You are already a creator' });
    }

    // Check if already has pending request
    if (user.creatorRequest.status === 'pending') {
      return res.status(400).json({ message: 'You already have a pending request' });
    }

    // Create request
    user.creatorRequest = {
      status: 'pending',
      requestedAt: new Date(),
      reason: reason || 'I want to become a creator on StreamFlix'
    };

    await user.save();

    // Notify all admins about new creator request
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await createNotification({
        recipient: admin._id,
        sender: user._id,
        type: 'creator_request',
        message: `${user.username} has requested to become a creator`,
        link: '/admin-dashboard'
      });
    }

    res.json({ 
      message: 'Creator request submitted successfully. Please wait for admin approval.',
      request: user.creatorRequest
    });
  } catch (error) {
    console.error('Error submitting creator request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's creator request status
router.get('/status', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId || req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      isCreator: user.isCreator,
      request: user.creatorRequest
    });
  } catch (error) {
    console.error('Error fetching request status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel creator request
router.delete('/cancel', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.creatorRequest.status !== 'pending') {
      return res.status(400).json({ message: 'No pending request to cancel' });
    }

    user.creatorRequest = {
      status: 'none',
      requestedAt: null,
      reviewedAt: null,
      reviewedBy: null,
      reason: null
    };

    await user.save();

    res.json({ message: 'Creator request cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get all pending creator requests
router.get('/pending', authenticate, adminAuth, async (req, res) => {
  try {
    const pendingRequests = await User.find({
      'creatorRequest.status': 'pending'
    }).select('username email avatar channelName creatorRequest createdAt');

    res.json(pendingRequests);
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Approve creator request
router.put('/approve/:userId', authenticate, adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.creatorRequest.status !== 'pending') {
      return res.status(400).json({ message: 'No pending request for this user' });
    }

    user.isCreator = true;
    user.role = 'creator'; // Set role to creator
    user.creatorRequest = {
      status: 'approved',
      requestedAt: user.creatorRequest.requestedAt,
      reviewedAt: new Date(),
      reviewedBy: req.user._id,
      reason: user.creatorRequest.reason
    };

    await user.save();

    // Notify user about approval
    await createNotification({
      recipient: user._id,
      sender: req.user._id,
      type: 'creator_approved',
      message: `Congratulations! Your creator request has been approved. You can now upload videos.`,
      link: '/upload'
    });

    res.json({ 
      message: 'Creator request approved successfully',
      user: {
        id: user._id,
        username: user.username,
        isCreator: user.isCreator,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error approving request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Reject creator request
router.put('/reject/:userId', authenticate, adminAuth, async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.creatorRequest.status !== 'pending') {
      return res.status(400).json({ message: 'No pending request for this user' });
    }

    user.creatorRequest = {
      status: 'rejected',
      requestedAt: user.creatorRequest.requestedAt,
      reviewedAt: new Date(),
      reviewedBy: req.user._id,
      reason: reason || 'Request rejected by admin'
    };

    await user.save();

    // Notify user about rejection
    await createNotification({
      recipient: user._id,
      sender: req.user._id,
      type: 'creator_rejected',
      message: `Your creator request has been rejected. ${reason ? 'Reason: ' + reason : ''}`,
      link: '/creator-request'
    });

    res.json({ 
      message: 'Creator request rejected',
      user: {
        id: user._id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
