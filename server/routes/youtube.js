import express from 'express';
import axios from 'axios';

const router = express.Router();

// Get YouTube video info (title + description)
router.get('/info/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    
    console.log('Fetching info for video ID:', videoId);
    
    // Fetch the YouTube page
    const response = await axios.get(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    
    const html = response.data;
    
    let title = '';
    let description = '';
    let author = '';
    
    // Extract title
    const titlePatterns = [
      /<title>([^<]+)<\/title>/,
      /"title":"([^"]+)"/
    ];
    
    for (const pattern of titlePatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        title = match[1]
          .replace(' - YouTube', '')
          .replace(/\\u([0-9a-fA-F]{4})/g, (match, code) => String.fromCharCode(parseInt(code, 16)))
          .trim();
        break;
      }
    }
    
    // Extract description
    const descriptionPatterns = [
      /"shortDescription":"([^"]+)"/,
      /"description":\{"simpleText":"([^"]+)"\}/,
      /"attributedDescriptionBodyText":\{"content":"([^"]+)"\}/,
      /description":"([^"]+)","lengthSeconds/
    ];
    
    for (const pattern of descriptionPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        description = match[1];
        break;
      }
    }
    
    if (description) {
      // Decode unicode escape sequences and clean up
      description = description
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .replace(/\\\\/g, '\\')
        .replace(/\\u([0-9a-fA-F]{4})/g, (match, code) => String.fromCharCode(parseInt(code, 16)));
    }
    
    // Extract author
    const authorMatch = html.match(/"author":"([^"]+)"/);
    if (authorMatch && authorMatch[1]) {
      author = authorMatch[1];
    }
    
    console.log('Extracted title:', title);
    console.log('Extracted description length:', description.length);
    console.log('Extracted author:', author);
    
    // Generate thumbnail URLs (try multiple qualities)
    const thumbnails = {
      maxres: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      hq: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      mq: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
      default: `https://i.ytimg.com/vi/${videoId}/default.jpg`
    };
    
    // Try to verify maxres exists, fallback to hq
    let thumbnail = thumbnails.maxres;
    try {
      const thumbCheck = await axios.head(thumbnails.maxres);
      if (thumbCheck.status !== 200) {
        thumbnail = thumbnails.hq;
      }
    } catch {
      thumbnail = thumbnails.hq;
    }
    
    console.log('Thumbnail URL:', thumbnail);
    
    res.json({ title, description, author, thumbnail });
  } catch (error) {
    console.error('Error fetching YouTube info:', error.message);
    res.status(200).json({ error: 'Failed to fetch info', title: '', description: '', author: '' });
  }
});

// Get YouTube video description
router.get('/description/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    
    console.log('Fetching description for video ID:', videoId);
    
    // Fetch the YouTube page
    const response = await axios.get(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    
    const html = response.data;
    
    let description = '';
    
    // Try multiple patterns to extract description
    const patterns = [
      /"shortDescription":"([^"]+)"/,
      /"description":\{"simpleText":"([^"]+)"\}/,
      /"attributedDescriptionBodyText":\{"content":"([^"]+)"\}/,
      /description":"([^"]+)","lengthSeconds/
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        description = match[1];
        break;
      }
    }
    
    if (description) {
      // Decode unicode escape sequences and clean up
      description = description
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .replace(/\\\\/g, '\\')
        .replace(/\\u([0-9a-fA-F]{4})/g, (match, code) => String.fromCharCode(parseInt(code, 16)));
      
      console.log('Extracted description length:', description.length);
      console.log('Description preview:', description.substring(0, 100) + '...');
    } else {
      console.log('No description found');
    }
    
    res.json({ description });
  } catch (error) {
    console.error('Error fetching YouTube description:', error.message);
    res.status(200).json({ error: 'Failed to fetch description', description: '' });
  }
});

export default router;
