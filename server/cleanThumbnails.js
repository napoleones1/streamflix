import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Video from './models/Video.js';

dotenv.config();

async function cleanThumbnails() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    console.log('Finding videos with base64 thumbnails...');
    const videos = await Video.find({
      thumbnailUrl: { $regex: '^data:image' }
    });

    console.log(`Found ${videos.length} videos with base64 thumbnails`);

    if (videos.length === 0) {
      console.log('No videos to clean!');
      process.exit(0);
    }

    console.log('Cleaning thumbnails...');
    
    for (const video of videos) {
      // Replace with placeholder or YouTube thumbnail
      if (video.videoType === 'youtube') {
        // Extract YouTube ID and use YouTube thumbnail
        const match = video.videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^#&?\/]{11})/);
        if (match && match[1]) {
          video.thumbnailUrl = `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg`;
        } else {
          video.thumbnailUrl = 'https://via.placeholder.com/1280x720/1a1a1a/ffffff?text=No+Thumbnail';
        }
      } else {
        // Use placeholder for non-YouTube videos
        video.thumbnailUrl = 'https://via.placeholder.com/1280x720/1a1a1a/ffffff?text=No+Thumbnail';
      }
      
      await video.save();
      console.log(`✅ Cleaned: ${video.title}`);
    }

    console.log(`\n🎉 Successfully cleaned ${videos.length} thumbnails!`);
    console.log('Database size reduced significantly!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanThumbnails();
