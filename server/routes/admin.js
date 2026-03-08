import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { isAdmin } from '../middleware/admin.js';
import User from '../models/User.js';
import Video from '../models/Video.js';
import Comment from '../models/Comment.js';
import { createNotification } from './notification.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(isAdmin);

// Dashboard Stats
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      totalCreators,
      verifiedCreators,
      totalVideos,
      totalViews,
      totalComments
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isCreator: true }),
      User.countDocuments({ isVerified: true }),
      Video.countDocuments(),
      Video.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]),
      Comment.countDocuments()
    ]);

    res.json({
      totalUsers,
      totalCreators,
      verifiedCreators,
      totalVideos,
      totalViews: totalViews[0]?.total || 0,
      totalComments
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get All Users
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', role = 'all' } = req.query;
    
    let query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { channelName: { $regex: search, $options: 'i' } }
      ];
    }
    if (role !== 'all') {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password')
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get All Videos
router.get('/videos', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', type = 'all' } = req.query;
    
    let query = {};
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    if (type !== 'all') {
      query.type = type;
    }

    const videos = await Video.find(query)
      .populate('creator', 'username channelName isVerified')
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Video.countDocuments(query);

    res.json({
      videos,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Verify/Unverify Creator
router.put('/users/:id/verify', async (req, res) => {
  try {
    const { isVerified } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified: isVerified },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Notify user if they got verified
    if (isVerified) {
      await createNotification({
        recipient: user._id,
        sender: req.user._id,
        type: 'verified',
        message: `Congratulations! You are now a verified creator on StreamFlix!`,
        link: `/channel/${user._id}`
      });
    }

    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Make User Admin
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['user', 'creator', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.role = role;
    
    // If changing to creator, also set isCreator flag
    if (role === 'creator') {
      user.isCreator = true;
    }
    // If changing from creator to user, remove isCreator flag
    else if (role === 'user' && user.isCreator) {
      user.isCreator = false;
    }
    
    await user.save();

    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete User
router.delete('/users/:id', async (req, res) => {
  try {
    // Don't allow deleting yourself
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user's videos
    await Video.deleteMany({ creator: req.params.id });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete Video
router.delete('/videos/:id', async (req, res) => {
  try {
    const video = await Video.findByIdAndDelete(req.params.id);
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Delete video comments
    await Comment.deleteMany({ video: req.params.id });

    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get Recent Activity
router.get('/activity', async (req, res) => {
  try {
    const [recentUsers, recentVideos, recentComments] = await Promise.all([
      User.find().select('-password').sort('-createdAt').limit(5),
      Video.find().populate('creator', 'username channelName').sort('-createdAt').limit(5),
      Comment.find().populate('user', 'username').populate('video', 'title').sort('-createdAt').limit(5)
    ]);

    res.json({
      recentUsers,
      recentVideos,
      recentComments
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
