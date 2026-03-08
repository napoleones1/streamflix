import mongoose from 'mongoose';

const watchHistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  video: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true },
  progress: { type: Number, default: 0 }, // in seconds
  duration: { type: Number, default: 0 }, // total video duration
  completed: { type: Boolean, default: false },
  lastWatched: { type: Date, default: Date.now }
}, { timestamps: true });

// Compound index to ensure one history per user per video
watchHistorySchema.index({ user: 1, video: 1 }, { unique: true });

export default mongoose.model('WatchHistory', watchHistorySchema);
