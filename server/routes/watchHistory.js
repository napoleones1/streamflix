import express from 'express';
import { authenticate } from '../middleware/auth.js';
import WatchHistory from '../models/WatchHistory.js';
import Video from '../models/Video.js';

const router = express.Router();

// Get continue watching list
router.get('/continue-watching', authenticate, async (req, res) => {
  try {
    const history = await WatchHistory.find({ 
      user: req.user._id,
      completed: false,
      progress: { $gt: 30 } // Only show if watched more than 30 seconds
    })
      .populate({
        path: 'video',
        populate: { path: 'creator', select: 'username channelName' }
      })
      .sort('-lastWatched')
      .limit(20);
    
    // Filter out deleted videos
    const validHistory = history.filter(h => h.video);
    
    res.json(validHistory);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update watch progress
router.post('/progress', authenticate, async (req, res) => {
  try {
    const { videoId, progress, duration } = req.body;
    
    const completed = duration > 0 && progress >= duration * 0.9; // 90% watched = completed
    
    const history = await WatchHistory.findOneAndUpdate(
      { user: req.user._id, video: videoId },
      { 
        progress,
        duration,
        completed,
        lastWatched: new Date()
      },
      { upsert: true, new: true }
    );
    
    res.json(history);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get watch progress for a specific video
router.get('/progress/:videoId', authenticate, async (req, res) => {
  try {
    const history = await WatchHistory.findOne({
      user: req.user._id,
      video: req.params.videoId
    });
    
    res.json(history || { progress: 0, duration: 0 });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Clear watch history
router.delete('/clear', authenticate, async (req, res) => {
  try {
    await WatchHistory.deleteMany({ user: req.user._id });
    res.json({ message: 'Watch history cleared' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
