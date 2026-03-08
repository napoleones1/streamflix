import express from 'express';
import { authenticate } from '../middleware/auth.js';
import User from '../models/User.js';
import { createNotification } from './notification.js';

const router = express.Router();

router.get('/me', authenticate, async (req, res) => {
  res.json(req.user);
});

// Update channel settings
router.put('/channel', authenticate, async (req, res) => {
  try {
    const { channelName, channelDescription, channelBanner, avatar } = req.body;
    
    // Validate required field
    if (!channelName || channelName.trim() === '') {
      return res.status(400).json({ error: 'Channel name is required' });
    }
    
    // Validate description length
    if (channelDescription && channelDescription.length > 1000) {
      return res.status(400).json({ error: 'Description must be less than 1000 characters' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        channelName: channelName.trim(),
        channelDescription: channelDescription?.trim() || '',
        channelBanner: channelBanner || '',
        avatar: avatar || '',
        isCreator: true // Automatically make them a creator
      },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error updating channel:', error);
    res.status(400).json({ error: error.message || 'Failed to update channel' });
  }
});

router.post('/subscribe/:creatorId', authenticate, async (req, res) => {
  try {
    const creator = await User.findById(req.params.creatorId);
    if (!creator) return res.status(404).json({ error: 'Creator not found' });
    
    if (!creator.subscribers.includes(req.user._id)) {
      creator.subscribers.push(req.user._id);
      req.user.subscribedTo.push(creator._id);
      await creator.save();
      await req.user.save();
      
      // Create notification for creator
      await createNotification({
        recipient: creator._id,
        sender: req.user._id,
        type: 'subscribe',
        message: `${req.user.username} subscribed to your channel`,
        link: `/channel/${req.user._id}`
      });
    }
    
    res.json({ message: 'Subscribed successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/unsubscribe/:creatorId', authenticate, async (req, res) => {
  try {
    const creator = await User.findById(req.params.creatorId);
    creator.subscribers = creator.subscribers.filter(id => !id.equals(req.user._id));
    req.user.subscribedTo = req.user.subscribedTo.filter(id => !id.equals(creator._id));
    await creator.save();
    await req.user.save();
    
    res.json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/watchlist/:videoId', authenticate, async (req, res) => {
  try {
    if (!req.user.watchlist.includes(req.params.videoId)) {
      req.user.watchlist.push(req.params.videoId);
      await req.user.save();
    }
    res.json({ message: 'Added to watchlist' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add or remove video from My List
router.post('/mylist/:videoId', authenticate, async (req, res) => {
  try {
    const videoId = req.params.videoId;
    const user = await User.findById(req.user._id);
    
    if (!user.myList) {
      user.myList = [];
    }
    
    const index = user.myList.indexOf(videoId);
    
    if (index > -1) {
      // Remove from list
      user.myList.splice(index, 1);
      await user.save();
      res.json({ message: 'Removed from My List', inList: false });
    } else {
      // Add to list
      user.myList.push(videoId);
      await user.save();
      res.json({ message: 'Added to My List', inList: true });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get My List
router.get('/mylist', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('myList');
    res.json(user.myList || []);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
