import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Video from '../models/Video.js';
import Comment from '../models/Comment.js';
import { createNotification } from './notification.js';

const router = express.Router();

// Search videos
router.get('/search', async (req, res) => {
  try {
    const { q, filter } = req.query;
    
    if (!q) {
      return res.json([]);
    }

    let query = {
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ]
    };

    // Apply content type filter
    if (filter && filter !== 'all') {
      query.contentType = filter;
    }

    const videos = await Video.find(query)
      .populate('creator', 'username channelName avatar channelBanner channelDescription subscribers isVerified role')
      .sort('-views')
      .limit(50);
    
    res.json(videos);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { type, category, search, contentType } = req.query;
    let query = {};
    
    if (type) query.type = type;
    
    // Filter by contentType (movie, tvshow, video)
    if (contentType) {
      query.contentType = contentType;
    }
    
    // Filter by category - check both category field and genres array
    if (category) {
      query.$or = [
        { category: category },
        { genres: category }
      ];
    }
    
    if (search) {
      // If there's already a $or for category, we need to combine with $and
      if (query.$or) {
        query = {
          $and: [
            { $or: query.$or },
            { title: { $regex: search, $options: 'i' } }
          ]
        };
        if (type) query.$and.push({ type: type });
        if (contentType) query.$and.push({ contentType: contentType });
      } else {
        query.title = { $regex: search, $options: 'i' };
      }
    }
    
    const videos = await Video.find(query)
      .populate('creator', 'username channelName avatar channelBanner channelDescription subscribers isVerified role')
      .sort('-createdAt');
    
    // Auto-calculate totalSeasons and totalEpisodes for TV series
    const videosWithCounts = await Promise.all(videos.map(async (video) => {
      if (video.isSeries && video.contentType === 'tvshow') {
        const episodes = await Video.find({
          seriesId: video._id,
          isEpisode: true
        });
        
        if (episodes.length > 0) {
          const maxSeason = Math.max(...episodes.map(ep => ep.seasonNumber || 1));
          const totalEps = episodes.length;
          
          // Update if changed
          if (video.totalSeasons !== maxSeason || video.totalEpisodes !== totalEps) {
            video.totalSeasons = maxSeason;
            video.totalEpisodes = totalEps;
            await video.save();
          }
        }
      }
      return video;
    }));
    
    res.json(videosWithCounts);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate('creator', 'username channelName avatar channelBanner channelDescription subscribers isVerified role')
      .populate({
        path: 'comments',
        populate: { path: 'user', select: 'username avatar' }
      });
    
    if (!video) return res.status(404).json({ error: 'Video not found' });
    
    video.views += 1;
    await video.save();
    
    res.json(video);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const videoData = { ...req.body, creator: req.user._id };
    
    // Clean up empty string fields that should be undefined for ObjectId
    if (videoData.seriesId === '') delete videoData.seriesId;
    
    // Remove episode fields if not an episode
    if (!videoData.isEpisode) {
      delete videoData.seriesId;
      delete videoData.seasonNumber;
      delete videoData.episodeNumber;
    }
    
    // Remove series fields if not a series
    if (!videoData.isSeries) {
      delete videoData.totalSeasons;
      delete videoData.totalEpisodes;
    }
    
    const video = new Video(videoData);
    await video.save();
    res.status(201).json(video);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update video
router.put('/:id', authenticate, async (req, res) => {
  try {
    console.log('Update video request:', req.params.id);
    console.log('Update data received:', {
      ...req.body,
      thumbnailUrl: req.body.thumbnailUrl?.substring(0, 50) + '...'
    });
    
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    // Check if user is the creator
    if (video.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to edit this video' });
    }
    
    // Update allowed fields
    const allowedUpdates = ['title', 'description', 'thumbnailUrl', 'downloadUrl', 'trailerUrl', 'tags', 'ageRating', 'releaseYear', 'category', 'genres'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        video[field] = req.body[field];
        console.log(`Updated ${field}:`, field === 'thumbnailUrl' ? req.body[field]?.substring(0, 50) + '...' : req.body[field]);
      }
    });
    
    await video.save();
    console.log('Video saved successfully');
    
    // Populate creator info for response
    await video.populate('creator', 'username channelName avatar channelBanner channelDescription subscribers isVerified role');
    
    res.json(video);
  } catch (error) {
    console.error('Update video error:', error);
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/like', authenticate, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id).populate('creator');
    video.dislikes = video.dislikes.filter(id => !id.equals(req.user._id));
    
    const wasLiked = video.likes.includes(req.user._id);
    
    if (!wasLiked) {
      video.likes.push(req.user._id);
      
      // Create notification for video creator
      await createNotification({
        recipient: video.creator._id,
        sender: req.user._id,
        type: 'like',
        video: video._id,
        message: `${req.user.username} liked your video "${video.title}"`,
        link: `/watch/${video._id}`
      });
    } else {
      video.likes = video.likes.filter(id => !id.equals(req.user._id));
    }
    
    await video.save();
    res.json(video);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/comment', authenticate, async (req, res) => {
  try {
    const comment = new Comment({
      user: req.user._id,
      video: req.params.id,
      text: req.body.text
    });
    await comment.save();
    
    const video = await Video.findById(req.params.id).populate('creator');
    video.comments.push(comment._id);
    await video.save();
    
    // Create notification for video creator
    await createNotification({
      recipient: video.creator._id,
      sender: req.user._id,
      type: 'comment',
      video: video._id,
      comment: comment._id,
      message: `${req.user.username} commented on your video "${video.title}"`,
      link: `/watch/${video._id}`
    });
    
    const populatedComment = await Comment.findById(comment._id).populate('user', 'username avatar');
    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get comments for a video
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ video: req.params.id })
      .populate('user', 'username avatar')
      .sort('-createdAt');
    res.json(comments);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Post a comment
router.post('/:id/comments', authenticate, async (req, res) => {
  try {
    const comment = new Comment({
      user: req.user._id,
      video: req.params.id,
      text: req.body.text
    });
    await comment.save();
    
    const video = await Video.findById(req.params.id);
    video.comments.push(comment._id);
    await video.save();
    
    const populatedComment = await Comment.findById(comment._id).populate('user', 'username avatar');
    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a comment
router.delete('/:videoId/comments/:commentId', authenticate, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    // Check if user is the comment author
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }
    
    await Comment.findByIdAndDelete(req.params.commentId);
    
    // Remove comment from video
    await Video.findByIdAndUpdate(req.params.videoId, {
      $pull: { comments: req.params.commentId }
    });
    
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Like a comment
router.post('/:videoId/comments/:commentId/like', authenticate, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    const likeIndex = comment.likes.indexOf(req.user._id);
    
    if (likeIndex > -1) {
      comment.likes.splice(likeIndex, 1);
    } else {
      comment.likes.push(req.user._id);
    }
    
    await comment.save();
    
    const populatedComment = await Comment.findById(comment._id).populate('user', 'username avatar');
    res.json(populatedComment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    // Check if user is the creator
    if (video.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this video' });
    }
    
    await Video.findByIdAndDelete(req.params.id);
    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all episodes for a series
router.get('/series/:seriesId/episodes', async (req, res) => {
  try {
    const { seriesId } = req.params;
    
    // Get the main series info
    const series = await Video.findById(seriesId)
      .populate('creator', 'username channelName avatar isVerified role');
    
    if (!series) {
      return res.status(404).json({ error: 'Series not found' });
    }
    
    // Get all episodes for this series
    const episodes = await Video.find({
      seriesId: seriesId,
      isEpisode: true
    })
    .populate('creator', 'username channelName avatar isVerified role')
    .sort({ seasonNumber: 1, episodeNumber: 1 });
    
    // Group episodes by season
    const episodesBySeason = {};
    episodes.forEach(ep => {
      const season = ep.seasonNumber || 1;
      if (!episodesBySeason[season]) {
        episodesBySeason[season] = [];
      }
      episodesBySeason[season].push(ep);
    });
    
    res.json({
      series,
      episodes: episodesBySeason,
      totalEpisodes: episodes.length
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get episodes for a specific season
router.get('/series/:seriesId/season/:seasonNumber', async (req, res) => {
  try {
    const { seriesId, seasonNumber } = req.params;
    
    const episodes = await Video.find({
      seriesId: seriesId,
      isEpisode: true,
      seasonNumber: parseInt(seasonNumber)
    })
    .populate('creator', 'username channelName avatar isVerified role')
    .sort({ episodeNumber: 1 });
    
    res.json(episodes);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all series (main entries only)
router.get('/series/list/all', async (req, res) => {
  try {
    const series = await Video.find({
      isSeries: true,
      contentType: 'tvshow'
    })
    .populate('creator', 'username channelName avatar isVerified role')
    .sort('-createdAt');
    
    // Auto-calculate totalSeasons and totalEpisodes for each series
    const seriesWithCounts = await Promise.all(series.map(async (s) => {
      const episodes = await Video.find({
        seriesId: s._id,
        isEpisode: true
      });
      
      if (episodes.length > 0) {
        // Calculate max season number
        const maxSeason = Math.max(...episodes.map(ep => ep.seasonNumber || 1));
        // Total episodes
        const totalEps = episodes.length;
        
        // Update series if counts changed
        if (s.totalSeasons !== maxSeason || s.totalEpisodes !== totalEps) {
          s.totalSeasons = maxSeason;
          s.totalEpisodes = totalEps;
          await s.save();
        }
      }
      
      return s;
    }));
    
    res.json(seriesWithCounts);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
