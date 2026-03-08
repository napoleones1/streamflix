import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import videoRoutes from './routes/video.js';
import profileRoutes from './routes/profile.js';
import youtubeRoutes from './routes/youtube.js';
import watchHistoryRoutes from './routes/watchHistory.js';
import notificationRoutes from './routes/notification.js';
import adminRoutes from './routes/admin.js';
import creatorRequestRoutes from './routes/creatorRequest.js';

dotenv.config();

const app = express();

// CORS configuration for production
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://streamflix-napoleones1.vercel.app',
    /\.vercel\.app$/ // Allow all Vercel preview deployments
  ],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/youtube', youtubeRoutes);
app.use('/api/watch-history', watchHistoryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/creator-request', creatorRequestRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
