import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  avatar: String,
  isKids: { type: Boolean, default: false },
  watchHistory: [{
    video: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
    watchedAt: { type: Date, default: Date.now },
    progress: Number
  }],
  preferences: {
    language: String,
    autoplay: { type: Boolean, default: true }
  }
}, { timestamps: true });

export default mongoose.model('Profile', profileSchema);
