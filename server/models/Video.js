import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  videoUrl: { type: String, required: true },
  videoType: { 
    type: String, 
    enum: ['direct', 'youtube', 'doodstream', 'streamtape', 'mixdrop', 'other'], 
    default: 'direct' 
  },
  contentType: {
    type: String,
    enum: ['video', 'movie', 'tvshow'],
    default: 'video'
  },
  // For TV Shows
  totalSeasons: { type: Number, default: 0 }, // 0 = belum tahu
  totalEpisodes: { type: Number, default: 0 }, // 0 = belum tahu
  // For linking episodes to a series
  seriesId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' }, // Reference to main series
  isSeries: { type: Boolean, default: false }, // True if this is the main series entry
  isEpisode: { type: Boolean, default: false }, // True if this is an episode
  seasonNumber: { type: Number }, // For episodes
  episodeNumber: { type: Number }, // For episodes
  
  thumbnailUrl: String,
  downloadUrl: String, // Optional separate download link
  trailerUrl: String, // YouTube trailer URL (for movies only)
  duration: Number,
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, enum: ['movie', 'series', 'short', 'vlog', 'tutorial', 'gaming', 'music', 'other'], default: 'other' },
  genres: [{ type: String }], // Multiple genres for movies/TV shows
  type: { type: String, enum: ['netflix', 'youtube'], required: true },
  views: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  tags: [String],
  isPublished: { type: Boolean, default: true },
  ageRating: String,
  releaseYear: Number,
  episodes: [{
    episodeNumber: Number,
    season: Number,
    title: String,
    videoUrl: String,
    videoType: String,
    thumbnailUrl: String,
    duration: Number
  }]
}, { timestamps: true });

// Indexes for performance optimization
videoSchema.index({ type: 1, createdAt: -1 }); // For fetching netflix/youtube videos sorted by date
videoSchema.index({ views: -1 }); // For trending/most viewed
videoSchema.index({ contentType: 1, isSeries: 1, isEpisode: 1 }); // For filtering content types
videoSchema.index({ creator: 1 }); // For creator's videos
videoSchema.index({ seriesId: 1, seasonNumber: 1, episodeNumber: 1 }); // For episodes lookup
videoSchema.index({ title: 'text', description: 'text', tags: 'text' }); // For text search

export default mongoose.model('Video', videoSchema);
