// Vercel Serverless Function - Main API Handler
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import authRoutes from '../server/routes/auth.js';
import userRoutes from '../server/routes/user.js';
import videoRoutes from '../server/routes/video.js';
import profileRoutes from '../server/routes/profile.js';
import youtubeRoutes from '../server/routes/youtube.js';
import watchHistoryRoutes from '../server/routes/watchHistory.js';
import notificationRoutes from '../server/routes/notification.js';
import adminRoutes from '../server/routes/admin.js';
import creatorRequestRoutes from '../server/routes/creatorRequest.js';

const app = express();

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://streamflix-napoleones1.vercel.app',
    /\.vercel\.app$/
  ],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// MongoDB connection with caching for serverless
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    console.log('Using cached database connection');
    return cachedDb;
  }

  try {
    console.log('Creating new database connection...');
    
    // Close existing connection if any
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
    });

    cachedDb = connection;
    console.log('Database connected successfully');
    return connection;
  } catch (error) {
    console.error('Database connection error:', error);
    cachedDb = null;
    throw error;
  }
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/youtube', youtubeRoutes);
app.use('/api/watch-history', watchHistoryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/creator-request', creatorRequestRoutes);

// Health check
app.get('/api', (req, res) => {
  res.json({ 
    message: 'StreamFlix API is running on Vercel!',
    dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ error: err.message || 'Something went wrong!' });
});

// Vercel serverless handler
export default async function handler(req, res) {
  try {
    await connectToDatabase();
    return app(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ 
      error: 'Database connection failed',
      details: error.message 
    });
  }
}
