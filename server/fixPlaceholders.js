import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Video from './models/Video.js';

dotenv.config();

async function fixPlaceholders() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    console.log('Finding videos with placeholder thumbnails...');
    const videos = await Video.find({
      thumbnailUrl: { $regex: 'placeholder' }
    });

    console.log(`Found ${videos.length} videos with placeholder thumbnails`);

    if (videos.length === 0) {
      console.log('No videos to fix!');
      process.exit(0);
    }

    console.log('Fixing thumbnails...');
    
    // Default thumbnail - simple solid color
    const defaultThumbnail = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1280&h=720&fit=crop';
    
    for (const video of videos) {
      // For YouTube videos, try to get YouTube thumbnail
      if (video.videoType === 'youtube') {
        const match = video.videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^#&?\/]{11})/);
        if (match && match[1]) {
          video.thumbnailUrl = `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg`;
        } else {
          video.thumbnailUrl = defaultThumbnail;
        }
      } else {
        // Use default thumbnail for non-YouTube videos
        video.thumbnailUrl = defaultThumbnail;
      }
      
      await video.save();
      console.log(`✅ Fixed: ${video.title}`);
    }

    console.log(`\n🎉 Successfully fixed ${videos.length} thumbnails!`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixPlaceholders();
