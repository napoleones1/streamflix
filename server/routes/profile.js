import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Profile from '../models/Profile.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const profiles = await Profile.find({ user: req.user._id });
    res.json(profiles);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const profile = new Profile({ ...req.body, user: req.user._id });
    await profile.save();
    
    req.user.profiles.push(profile._id);
    await req.user.save();
    
    res.status(201).json(profile);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/watch-history', authenticate, async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id);
    profile.watchHistory.push(req.body);
    await profile.save();
    res.json(profile);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
