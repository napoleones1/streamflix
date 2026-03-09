import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import VideoCard from '../components/VideoCard';
import { Play, Info, Volume2, VolumeX, ChevronLeft, ChevronRight, Pause } from 'lucide-react';

export default function Home() {
  const [featured, setFeatured] = useState(null);
  const [netflixContent, setNetflixContent] = useState([]);
  const [youtubeContent, setYoutubeContent] = useState([]);
  const [trendingContent, setTrendingContent] = useState([]);
  const [continueWatching, setContinueWatching] = useState([]);
  const [muted, setMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    fetchContent();
    fetchContinueWatching();
    
    // Refresh continue watching every 30 seconds
    const interval = setInterval(() => {
      fetchContinueWatching();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Auto-play video after 3 seconds
    // For movies with trailerUrl or regular YouTube videos
    if (featured && (featured.videoType === 'youtube' || (featured.contentType === 'movie' && featured.trailerUrl))) {
      const timer = setTimeout(() => {
        setIsPlaying(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [featured]);

  const fetchContent = async () => {
    try {
      const [netflixRes, youtubeRes] = await Promise.all([
        axios.get('/api/videos?type=netflix').catch(() => ({ data: [] })),
        axios.get('/api/videos?type=youtube').catch(() => ({ data: [] }))
      ]);
      
      // Filter out episodes - only show main series and regular videos
      const netflixFiltered = netflixRes.data.filter(v => !v.isEpisode);
      const youtubeFiltered = youtubeRes.data.filter(v => !v.isEpisode);
      
      setNetflixContent(netflixFiltered);
      setYoutubeContent(youtubeFiltered);
      setTrendingContent([...netflixFiltered, ...youtubeFiltered].sort((a, b) => (b.views || 0) - (a.views || 0)));
      setFeatured(netflixFiltered[0] || youtubeFiltered[0]);
    } catch (error) {
      console.error('Error fetching content:', error);
    }
  };

  const fetchContinueWatching = async () => {
    try {
      console.log('🔍 Fetching continue watching...');
      
      // Use localStorage
      const localHistory = localStorage.getItem('watchHistory');
      console.log('📦 localStorage watchHistory:', localHistory);
      
      if (!localHistory) {
        console.log('❌ No watch history found in localStorage');
        setContinueWatching([]);
        return;
      }

      const history = JSON.parse(localHistory);
      const videoIds = Object.keys(history);
      console.log('📝 Video IDs in history:', videoIds);
      
      if (videoIds.length === 0) {
        console.log('❌ Watch history is empty');
        setContinueWatching([]);
        return;
      }

      const continueList = [];
      
      for (const [videoId, data] of Object.entries(history)) {
        console.log(`🎬 Processing video ${videoId}:`, data);
        
        // Show all videos watched more than 10 seconds
        if (data.progress > 10) {
          try {
            const response = await axios.get(`/api/videos/${videoId}`);
            if (response.data) {
              continueList.push({
                _id: videoId,
                video: response.data,
                progress: data.progress,
                duration: data.duration || data.progress * 2,
                lastWatched: data.lastWatched
              });
              console.log(`✅ Added video to continue watching: ${response.data.title}`);
            }
          } catch (err) {
            console.log(`⚠️ Video not found or deleted: ${videoId}`);
          }
        } else {
          console.log(`⏭️ Skipping video ${videoId} - progress too short (${data.progress}s)`);
        }
      }
      
      // Sort by last watched (most recent first)
      continueList.sort((a, b) => new Date(b.lastWatched) - new Date(a.lastWatched));
      
      // Limit to 20 videos
      const limitedList = continueList.slice(0, 20);
      
      setContinueWatching(limitedList);
      console.log(`✅ Continue watching loaded: ${limitedList.length} videos`);
      console.log('📋 Continue watching list:', limitedList);
    } catch (error) {
      console.error('❌ Error fetching continue watching:', error);
      setContinueWatching([]);
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const getVideoEmbedUrl = (video) => {
    if (!video) return null;
    
    // For movies, use trailerUrl if available, otherwise use videoUrl
    const urlToUse = (video.contentType === 'movie' && video.trailerUrl) ? video.trailerUrl : video.videoUrl;
    
    if (video.videoType === 'youtube' || (video.contentType === 'movie' && video.trailerUrl)) {
      // Extract YouTube video ID
      const match = urlToUse.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^#&?\/]{11})/);
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=${muted ? 1 : 0}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1`;
      }
    }
    
    return null;
  };

  const scrollRow = (direction, rowId) => {
    const row = document.getElementById(rowId);
    if (row) {
      const scrollAmount = direction === 'left' ? -row.offsetWidth : row.offsetWidth;
      row.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen">
      {/* Hero Section */}
      {featured ? (
        <div className="relative h-[85vh] lg:h-[95vh]">
          <div className="absolute inset-0">
            {(featured.videoType === 'youtube' || (featured.contentType === 'movie' && featured.trailerUrl)) && isPlaying ? (
              <iframe
                key={`video-${muted}`}
                src={getVideoEmbedUrl(featured)}
                className="w-full h-full object-cover pointer-events-none"
                frameBorder="0"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            ) : (
              <img 
                loading="lazy"
                src={featured.thumbnailUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1920'} 
                alt={featured.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1920';
                }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
          </div>
          
          <div className="relative h-full flex items-center px-4 sm:px-8 lg:px-16">
            <div className="max-w-2xl space-y-4 lg:space-y-6">
              <div className="flex items-center space-x-2">
                <span className="bg-netflix px-2 py-1 text-xs font-bold">NEW</span>
                <span className="text-sm text-gray-300">Featured</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black leading-tight line-clamp-2">
                {featured.title}
              </h1>
              
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-green-500 font-semibold">98% Match</span>
                <span className="border border-gray-400 px-2 py-0.5 text-xs">{featured.ageRating || 'PG-13'}</span>
                <span>{featured.releaseYear || '2024'}</span>
                <span className="border border-gray-400 px-2 py-0.5 text-xs">HD</span>
              </div>

              {/* Genres Display for Movies/TV Shows */}
              {featured.genres && featured.genres.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {featured.genres.map((genre, index) => (
                    <span key={index} className="text-sm text-gray-300">
                      {genre.charAt(0).toUpperCase() + genre.slice(1).replace('scifi', 'Sci-Fi')}
                      {index < featured.genres.length - 1 && <span className="text-gray-500 mx-1">•</span>}
                    </span>
                  ))}
                </div>
              )}
              
              <p className="text-base lg:text-lg text-gray-200 line-clamp-3 max-w-xl">
                {featured.description || 'Experience the ultimate streaming platform combining the best of movies, series, and creator content all in one place.'}
              </p>
              
              <div className="flex flex-wrap gap-3">
                <Link 
                  to={`/watch/${featured._id}`} 
                  className="bg-white text-black px-8 py-3 rounded font-bold flex items-center gap-2 hover:bg-gray-200 transition shadow-lg"
                >
                  <Play className="w-6 h-6 fill-current" /> Play
                </Link>
                <button className="bg-gray-500/70 backdrop-blur-sm px-8 py-3 rounded font-bold flex items-center gap-2 hover:bg-gray-500/50 transition">
                  <Info className="w-6 h-6" /> More Info
                </button>
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="absolute bottom-32 right-8 lg:right-16 flex gap-3">
            {(featured.videoType === 'youtube' || (featured.contentType === 'movie' && featured.trailerUrl)) && (
              <button 
                onClick={togglePlayPause}
                className="w-12 h-12 rounded-full border-2 border-gray-400 flex items-center justify-center hover:bg-white/10 transition backdrop-blur-sm"
                title={isPlaying ? "Pause Trailer" : "Play Trailer"}
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
              </button>
            )}
            {(featured.videoType === 'youtube' || (featured.contentType === 'movie' && featured.trailerUrl)) && isPlaying && (
              <button 
                onClick={() => setMuted(!muted)}
                className="w-12 h-12 rounded-full border-2 border-gray-400 flex items-center justify-center hover:bg-white/10 transition backdrop-blur-sm"
                title={muted ? "Unmute" : "Mute"}
              >
                {muted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Welcome to StreamFlix</h1>
            <p className="text-gray-400 mb-6">Start uploading videos to see content here</p>
            <Link to="/upload" className="bg-netflix px-8 py-3 rounded font-bold hover:bg-red-700 transition inline-block">
              Upload Your First Video
            </Link>
          </div>
        </div>
      )}

      {/* Content Rows */}
      <div className={`relative ${featured ? '-mt-32 lg:-mt-40' : ''} space-y-8 lg:space-y-12 pb-16`}>
        {/* Continue Watching */}
        {continueWatching.length > 0 && (
          <section className="px-4 sm:px-8 lg:px-16 mb-8">
            <h2 className="text-xl lg:text-2xl font-bold mb-4">Continue Watching</h2>
            <div className="relative group">
              <button 
                onClick={() => scrollRow('left', 'continue-row')}
                className="absolute left-0 top-0 bottom-0 z-10 w-12 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <div id="continue-row" className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth overflow-y-visible py-4 pb-8">
                {continueWatching.map(item => (
                  <div key={item._id} className="flex-none w-[200px] lg:w-[280px] relative">
                    <VideoCard video={item.video} />
                    {/* Progress Bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                      <div 
                        className="h-full bg-netflix"
                        style={{ width: `${(item.progress / item.duration) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => scrollRow('right', 'continue-row')}
                className="absolute right-0 top-0 bottom-0 z-10 w-12 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </div>
          </section>
        )}

        {/* Trending Now */}
        {trendingContent.length > 0 && (
          <section className="px-4 sm:px-8 lg:px-16 mb-8">
            <h2 className="text-xl lg:text-2xl font-bold mb-4">Trending Now</h2>
            <div className="relative group">
              <button 
                onClick={() => scrollRow('left', 'trending-row')}
                className="absolute left-0 top-0 bottom-0 z-10 w-12 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <div id="trending-row" className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth overflow-y-visible py-4 pb-8">
                {trendingContent.slice(0, 20).map(video => (
                  <div key={video._id} className="flex-none w-[200px] lg:w-[280px]">
                    <VideoCard video={video} />
                  </div>
                ))}
              </div>
              <button 
                onClick={() => scrollRow('right', 'trending-row')}
                className="absolute right-0 top-0 bottom-0 z-10 w-12 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </div>
          </section>
        )}

        {/* Netflix Originals */}
        {netflixContent.length > 0 && (
          <section className="px-4 sm:px-8 lg:px-16 mb-8">
            <h2 className="text-xl lg:text-2xl font-bold mb-4">Movies & Series</h2>
            <div className="relative group">
              <button 
                onClick={() => scrollRow('left', 'netflix-row')}
                className="absolute left-0 top-0 bottom-0 z-10 w-12 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <div id="netflix-row" className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth overflow-y-visible py-4 pb-8">
                {netflixContent.map(video => (
                  <div key={video._id} className="flex-none w-[200px] lg:w-[280px]">
                    <VideoCard video={video} />
                  </div>
                ))}
              </div>
              <button 
                onClick={() => scrollRow('right', 'netflix-row')}
                className="absolute right-0 top-0 bottom-0 z-10 w-12 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </div>
          </section>
        )}

        {/* Popular on StreamFlix */}
        {youtubeContent.length > 0 && (
          <section className="px-4 sm:px-8 lg:px-16 mb-8">
            <h2 className="text-xl lg:text-2xl font-bold mb-4">Popular on StreamFlix</h2>
            <div className="relative group">
              <button 
                onClick={() => scrollRow('left', 'youtube-row')}
                className="absolute left-0 top-0 bottom-0 z-10 w-12 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <div id="youtube-row" className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth overflow-y-visible py-4 pb-8">
                {youtubeContent.map(video => (
                  <div key={video._id} className="flex-none w-[200px] lg:w-[280px]">
                    <VideoCard video={video} />
                  </div>
                ))}
              </div>
              <button 
                onClick={() => scrollRow('right', 'youtube-row')}
                className="absolute right-0 top-0 bottom-0 z-10 w-12 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
