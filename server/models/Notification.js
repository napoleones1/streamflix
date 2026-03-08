import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  type: { 
    type: String, 
    enum: ['like', 'comment', 'subscribe', 'upload', 'reply', 'creator_request', 'creator_approved', 'creator_rejected', 'verified'],
    required: true 
  },
  video: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Video' 
  },
  comment: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Comment' 
  },
  message: { 
    type: String, 
    required: true 
  },
  read: { 
    type: Boolean, 
    default: false 
  },
  link: String
}, { timestamps: true });

// Index for faster queries
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
