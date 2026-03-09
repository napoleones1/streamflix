import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Video from './models/Video.js';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const count = await Video.countDocuments({ thumbnailUrl: { $regex: '^data:image' } });
  console.log('Videos with base64 thumbnails:', count);
  
  const totalVideos = await Video.countDocuments();
  console.log('Total videos:', totalVideos);
  
  process.exit(0);
});
