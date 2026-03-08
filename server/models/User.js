import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  role: { type: String, enum: ['user', 'creator', 'admin'], default: 'user' },
  isCreator: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  creatorRequest: {
    status: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
    requestedAt: Date,
    reviewedAt: Date,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: String
  },
  channelName: String,
  channelDescription: String,
  channelBanner: String,
  avatar: String,
  subscribers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  subscribedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  watchlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
  myList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
  profiles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Profile' }],
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model('User', userSchema);
