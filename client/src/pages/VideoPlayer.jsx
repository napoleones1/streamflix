import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ThumbsUp, ThumbsDown, Share2, Plus, MoreHorizontal, Bell, Play, ChevronDown, Download } from 'lucide-react';
import VideoPlayerComponent from '../components/VideoPlayer';
import Comments from '../components/Comments';
import { VerifiedBadge, AdminBadge } from '../components/VerifiedBadge';

export default function VideoPlayer() {
  const { id } = useParams();
  const [video, setVideo] = useState(null);
  const [related, setRelated] = useState([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [watchProgress, setWatchProgress] = useState(0);
  const watchStartTimeRef = useRef(null);
  
  // TV Series state
  const [seriesData, setSeriesData] = useState(null);
  const [episodes, setEpisodes] = useState({});
  const [expandedSeasons, setExpandedSeasons] = useState({});

  useEffect(() => {
    fetchVideo();
    fetchRelated();
    fetchWatchProgress();
    watchStartTimeRef.current = Date.now();
    window.scrollTo(0, 0);

    console.log('🎬 VideoPlayer mounted for video:', id);

    // Save to watch history when component unmounts (user leaves page)
    return () => {
      if (watchStartTimeRef.current) {
        const watchDuration = Math.floor((Date.now() - watchStartTimeRef.current) / 1000);
        console.log('⏱️ Total watch duration:', watchDuration, 'seconds');
        
        if (watchDuration >= 10) { // Only save if watched 10 seconds or more
          try {
            const watchHistory = JSON.parse(localStorage.getItem('watchHistory') || '{}');
            
            // Get current progress from localStorage if available
            const currentProgress = watchHistory[id]?.progress || watchDuration;
            const currentDuration = watchHistory[id]?.duration || watchDuration * 2;
            
            watchHistory[id] = {
              progress: currentProgress,
              duration: currentDuration,
              lastWatched: new Date().toISOString()
            };
            
            localStorage.setItem('watchHistory', JSON.stringify(watchHistory));
            console.log('✅ Saved to watch history:', {
              videoId: id,
              progress: currentProgress,
              duration: currentDuration,
              watchDuration: watchDuration
            });
            
            // Verify save
            const saved = localStorage.getItem('watchHistory');
            console.log('✅ Verified localStorage:', saved);
          } catch (error) {
            console.error('❌ Error saving watch history:', error);
          }
        } else {
          console.log('⏭️ Watch duration too short, not saving:', watchDuration, 'seconds');
        }
      }
    };
  }, [id]);

  // Fetch series episodes if this is a TV show
  useEffect(() => {
    if (video && video.contentType === 'tvshow') {
      if (video.isEpisode && video.seriesId) {
        // This is an episode, fetch all episodes for the series
        fetchSeriesEpisodes(video.seriesId);
      } else if (video.isSeries) {
        // This is the main series entry, fetch all episodes
        fetchSeriesEpisodes(video._id);
      }
    }
  }, [video]);

  const fetchWatchProgress = async () => {
    try {
      // Try localStorage first
      const watchHistory = JSON.parse(localStorage.getItem('watchHistory') || '{}');
      if (watchHistory[id]) {
        setWatchProgress(watchHistory[id].progress || 0);
        console.log('Loaded progress from localStorage:', watchHistory[id].progress);
        return;
      }

      // Fallback to backend
      const token = localStorage.getItem('token');
      if (!token) return;

      const { data } = await axios.get(`/api/watch-history/progress/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWatchProgress(data.progress || 0);
    } catch (error) {
      console.error('Error fetching watch progress:', error);
    }
  };

  const handleTimeUpdate = async (currentTime, duration) => {
    try {
      // Save to localStorage for immediate use
      if (currentTime > 0 && duration > 0) {
        const watchHistory = JSON.parse(localStorage.getItem('watchHistory') || '{}');
        watchHistory[id] = {
          progress: Math.floor(currentTime),
          duration: Math.floor(duration),
          lastWatched: new Date().toISOString()
        };
        localStorage.setItem('watchHistory', JSON.stringify(watchHistory));
        
        // Log every 10 seconds for debugging
        if (Math.floor(currentTime) % 10 === 0 && currentTime > 0) {
          console.log('💾 Progress saved:', {
            videoId: id,
            progress: Math.floor(currentTime),
            duration: Math.floor(duration),
            percentage: Math.floor((currentTime / duration) * 100) + '%'
          });
        }
      }

      // Also save to backend every 15 seconds
      const token = localStorage.getItem('token');
      if (token && Math.floor(currentTime) % 15 === 0 && currentTime > 0) {
        await axios.post('/api/watch-history/progress', {
          videoId: id,
          progress: Math.floor(currentTime),
          duration: Math.floor(duration)
        }, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => {
          console.log('📡 Backend save failed, using localStorage only');
        });
      }
    } catch (error) {
      console.error('❌ Error updating watch progress:', error);
    }
  };

  useEffect(() => {
    fetchVideo();
    fetchRelated();
    window.scrollTo(0, 0);
  }, [id]);

  const fetchVideo = async () => {
    try {
      const { data } = await axios.get(`/api/videos/${id}`);
      setVideo(data);
    } catch (error) {
      console.error('Error fetching video:', error);
    }
  };

  const fetchRelated = async () => {
    try {
      const { data } = await axios.get('/api/videos');
      setRelated(data.filter(v => v._id !== id).slice(0, 20));
    } catch (error) {
      console.error('Error fetching related:', error);
    }
  };

  const fetchSeriesEpisodes = async (seriesId) => {
    try {
      const { data } = await axios.get(`/api/videos/series/${seriesId}/episodes`);
      setSeriesData(data.series);
      setEpisodes(data.episodes);
      
      // Auto-expand current season
      if (video && video.seasonNumber) {
        setExpandedSeasons({ [video.seasonNumber]: true });
      } else {
        // Expand season 1 by default
        setExpandedSeasons({ 1: true });
      }
    } catch (error) {
      console.error('Error fetching series episodes:', error);
    }
  };

  const toggleSeason = (seasonNum) => {
    setExpandedSeasons(prev => ({
      ...prev,
      [seasonNum]: !prev[seasonNum]
    }));
  };

  const getNextEpisode = () => {
    if (!video || !video.isEpisode || !episodes) return null;
    
    const currentSeason = video.seasonNumber;
    const currentEpisode = video.episodeNumber;
    
    // Try to find next episode in current season
    const currentSeasonEpisodes = episodes[currentSeason] || [];
    const nextInSeason = currentSeasonEpisodes.find(
      ep => ep.episodeNumber === currentEpisode + 1
    );
    
    if (nextInSeason) return nextInSeason;
    
    // Try to find first episode of next season
    const nextSeason = currentSeason + 1;
    const nextSeasonEpisodes = episodes[nextSeason] || [];
    if (nextSeasonEpisodes.length > 0) {
      return nextSeasonEpisodes[0];
    }
    
    return null;
  };

  const handleLike = async () => {
    try {
      const { data } = await axios.post(`/api/videos/${id}/like`);
      setVideo(data);
    } catch (error) {
      console.error('Error liking video:', error);
    }
  };

  const handleSubscribe = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to subscribe');
        return;
      }

      if (isSubscribed) {
        await axios.post(`/api/users/unsubscribe/${video.creator._id}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`/api/users/subscribe/${video.creator._id}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setIsSubscribed(!isSubscribed);
      
      // Refresh video data to get updated subscriber count
      fetchVideo();
    } catch (error) {
      console.error('Error subscribing:', error);
    }
  };

  const handleDownload = () => {
    if (!video) {
      alert('Video not available');
      return;
    }

    // Use downloadUrl if available, otherwise use videoUrl
    const downloadLink = video.downloadUrl || video.videoUrl;
    
    if (!downloadLink) {
      alert('Download link not available');
      return;
    }

    // For YouTube videos, open in new tab (can't direct download)
    if (video.videoType === 'youtube' && !video.downloadUrl) {
      window.open(video.videoUrl, '_blank');
      return;
    }

    // Open download link in new tab
    window.open(downloadLink, '_blank');
  };

  const formatViews = (views) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views;
  };

  const formatDate = (date) => {
    const now = new Date();
    const videoDate = new Date(date);
    const diffTime = Math.abs(now - videoDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  if (!video) return (
    <div className="pt-20 flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-netflix"></div>
    </div>
  );

  return (
    <div className="pt-16 bg-gray-900 min-h-screen">
      <div className="max-w-[1920px] mx-auto">
        <div className={`grid gap-6 p-4 lg:p-6 ${
          video?.contentType === 'tvshow' && Object.keys(episodes).length > 0
            ? 'grid-cols-1 xl:grid-cols-[1fr_400px]'
            : 'grid-cols-1 xl:grid-cols-3'
        }`}>
          {/* Main Content */}
          <div className={video?.contentType === 'tvshow' && Object.keys(episodes).length > 0 ? '' : 'xl:col-span-2'}>
            <div className="space-y-4">{/* Video Player */}
            <div className="bg-black rounded-xl overflow-hidden aspect-video">
              <VideoPlayerComponent 
                videoUrl={video.videoUrl}
                type={video.videoType}
                initialTime={watchProgress}
                onTimeUpdate={handleTimeUpdate}
              />
            </div>

            {/* Video Title */}
            <div>
              {video.contentType === 'tvshow' && video.isEpisode && seriesData && (
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                  <Link to={`/watch/${seriesData._id}`} className="hover:text-white transition">
                    {seriesData.title}
                  </Link>
                  <span>•</span>
                  <span>S{video.seasonNumber}E{video.episodeNumber}</span>
                </div>
              )}
              <h1 className="text-xl lg:text-2xl font-bold">{video.title}</h1>
            </div>
            
            {/* Video Info Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Channel Info */}
              <div className="flex items-center gap-4">
                <Link to={`/channel/${video.creator._id}`} className="flex items-center gap-3">
                  {video.creator.avatar ? (
                    <img 
                      src={video.creator.avatar}
                      alt={video.creator.channelName || video.creator.username}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-netflix to-youtube flex items-center justify-center font-bold"
                    style={{ display: video.creator.avatar ? 'none' : 'flex' }}
                  >
                    {video.creator.username?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold hover:text-gray-300 transition flex items-center gap-1.5">
                      {video.creator.channelName || video.creator.username}
                      {video.creator.role === 'admin' && <AdminBadge size="md" />}
                      {video.creator.isVerified && video.creator.role !== 'admin' && <VerifiedBadge size="md" />}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatViews(video.creator.subscribers?.length || 0)} subscribers
                    </p>
                  </div>
                </Link>

                <button 
                  onClick={handleSubscribe}
                  className={`px-6 py-2 rounded-full font-medium transition flex items-center gap-2 ${
                    isSubscribed 
                      ? 'bg-gray-700 hover:bg-gray-600' 
                      : 'bg-white text-black hover:bg-gray-200'
                  }`}
                >
                  {isSubscribed ? (
                    <>
                      <Bell className="w-4 h-4" />
                      Subscribed
                    </>
                  ) : (
                    'Subscribe'
                  )}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-gray-800 rounded-full overflow-hidden">
                  <button 
                    onClick={handleLike}
                    className="px-4 py-2 hover:bg-gray-700 transition flex items-center gap-2 border-r border-gray-700"
                  >
                    <ThumbsUp className="w-5 h-5" />
                    <span className="font-medium">{video.likes?.length || 0}</span>
                  </button>
                  <button className="px-4 py-2 hover:bg-gray-700 transition">
                    <ThumbsDown className="w-5 h-5" />
                  </button>
                </div>

                <button className="px-4 py-2 bg-gray-800 rounded-full hover:bg-gray-700 transition flex items-center gap-2">
                  <Share2 className="w-5 h-5" />
                  <span className="hidden sm:inline">Share</span>
                </button>

                <button 
                  onClick={handleDownload}
                  className="px-4 py-2 bg-gray-800 rounded-full hover:bg-gray-700 transition flex items-center gap-2"
                  title="Download video"
                >
                  <Download className="w-5 h-5" />
                  <span className="hidden sm:inline">Download</span>
                </button>

                <button className="px-4 py-2 bg-gray-800 rounded-full hover:bg-gray-700 transition flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Save</span>
                </button>

                <button className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Description Box */}
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-4 text-sm font-medium mb-2">
                <span>{formatViews(video.views)} views</span>
                <span>{formatDate(video.createdAt)}</span>
                {video.releaseYear && <span>{video.releaseYear}</span>}
                {video.ageRating && (
                  <span className="px-2 py-0.5 bg-gray-700 rounded text-xs">{video.ageRating}</span>
                )}
              </div>

              {/* Genres Display (Netflix-style) */}
              {video.genres && video.genres.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-sm text-gray-400">Genres:</span>
                  {video.genres.map((genre, i) => (
                    <span key={i} className="text-sm text-white">
                      {genre.charAt(0).toUpperCase() + genre.slice(1).replace('scifi', 'Sci-Fi')}
                      {i < video.genres.length - 1 && <span className="text-gray-500 mx-1">•</span>}
                    </span>
                  ))}
                </div>
              )}

              {/* Tags */}
              {video.tags && video.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {video.tags.slice(0, 5).map((tag, i) => (
                    <span key={i} className="text-xs px-2 py-1 bg-gray-700 rounded-full text-blue-400">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              
              <p className={`text-sm ${showDescription ? '' : 'line-clamp-2'}`}>
                {video.description || 'No description available'}
              </p>
              
              {video.description?.length > 100 && (
                <button 
                  onClick={() => setShowDescription(!showDescription)}
                  className="text-sm font-medium mt-2 hover:text-gray-300"
                >
                  {showDescription ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>

            {/* Comments Section */}
            <Comments videoId={id} />

            {/* Next Episode Button */}
            {video?.contentType === 'tvshow' && video?.isEpisode && getNextEpisode() && (
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4">Up Next</h3>
                <Link 
                  to={`/watch/${getNextEpisode()._id}`}
                  className="flex gap-4 hover:bg-gray-700 p-3 rounded-lg transition"
                >
                  <div className="relative w-40 flex-shrink-0 aspect-video rounded-lg overflow-hidden bg-gray-700">
                    <img 
                      src={getNextEpisode().thumbnailUrl || `https://source.unsplash.com/400x225/?tvshow`}
                      alt={getNextEpisode().title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Play className="w-12 h-12 text-white fill-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-400 mb-1">
                      S{getNextEpisode().seasonNumber}E{getNextEpisode().episodeNumber}
                    </p>
                    <h4 className="font-semibold mb-2">{getNextEpisode().title}</h4>
                    <p className="text-sm text-gray-400 line-clamp-2">
                      {getNextEpisode().description}
                    </p>
                  </div>
                </Link>
              </div>
            )}
          </div>
          </div>

          {/* Sidebar - Episodes or Related Videos */}
          {video?.contentType === 'tvshow' && Object.keys(episodes).length > 0 ? (
            /* Episode List Sidebar */
            <div className="space-y-3 max-h-[calc(100vh-120px)] overflow-y-auto">
              <div className="sticky top-0 bg-gray-900 pb-3 z-10">
                <h3 className="text-lg font-bold">Episodes</h3>
                {seriesData && (
                  <p className="text-sm text-gray-400">
                    {seriesData.totalSeasons > 0 && seriesData.totalEpisodes > 0
                      ? `${seriesData.totalSeasons} Season${seriesData.totalSeasons > 1 ? 's' : ''} • ${seriesData.totalEpisodes} Episodes`
                      : 'TV Series'
                    }
                  </p>
                )}
              </div>

              {Object.keys(episodes).sort((a, b) => parseInt(a) - parseInt(b)).map(seasonNum => (
                <div key={seasonNum} className="bg-gray-800 rounded-lg overflow-hidden">
                  {/* Season Header */}
                  <button
                    onClick={() => toggleSeason(parseInt(seasonNum))}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-700 transition"
                  >
                    <span className="font-semibold">Season {seasonNum}</span>
                    <ChevronDown 
                      className={`w-5 h-5 transition-transform ${
                        expandedSeasons[seasonNum] ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Episodes List */}
                  {expandedSeasons[seasonNum] && (
                    <div className="border-t border-gray-700">
                      {episodes[seasonNum].map((episode, idx) => {
                        const isCurrentEpisode = episode._id === video._id;
                        return (
                          <Link
                            key={episode._id}
                            to={`/watch/${episode._id}`}
                            className={`flex gap-3 p-3 hover:bg-gray-700 transition border-b border-gray-700 last:border-b-0 ${
                              isCurrentEpisode ? 'bg-gray-700/50' : ''
                            }`}
                          >
                            <div className="relative w-32 flex-shrink-0 aspect-video rounded overflow-hidden bg-gray-700">
                              <img 
                                src={episode.thumbnailUrl || `https://source.unsplash.com/320x180/?tvshow,episode`}
                                alt={episode.title}
                                className="w-full h-full object-cover"
                              />
                              {isCurrentEpisode && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                                  <Play className="w-8 h-8 text-white fill-white" />
                                </div>
                              )}
                              {episode.duration && (
                                <span className="absolute bottom-1 right-1 bg-black/90 px-1 text-xs rounded">
                                  {Math.floor(episode.duration / 60)}m
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-gray-400">
                                  E{episode.episodeNumber}
                                </span>
                                {isCurrentEpisode && (
                                  <span className="text-xs bg-netflix px-2 py-0.5 rounded font-semibold">
                                    Now Playing
                                  </span>
                                )}
                              </div>
                              <h4 className="font-medium text-sm line-clamp-1 mb-1">
                                {episode.title}
                              </h4>
                              <p className="text-xs text-gray-400 line-clamp-2">
                                {episode.description || 'No description'}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* Related Videos Sidebar */
            <div className="space-y-3">
            <h3 className="text-lg font-bold mb-4">Related Videos</h3>
            {related.map(v => (
              <Link 
                key={v._id} 
                to={`/watch/${v._id}`}
                className="flex gap-2 hover:bg-gray-800 p-2 rounded-lg transition"
              >
                <div className="relative w-40 flex-shrink-0 aspect-video rounded-lg overflow-hidden bg-gray-800">
                  <img 
                    src={v.thumbnailUrl || `https://source.unsplash.com/400x225/?${v.category}`}
                    alt={v.title}
                    className="w-full h-full object-cover"
                  />
                  {v.duration && (
                    <span className="absolute bottom-1 right-1 bg-black/90 px-1 text-xs rounded">
                      {Math.floor(v.duration / 60)}:{(v.duration % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm line-clamp-2 mb-1">{v.title}</h4>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    {v.creator?.username}
                    {v.creator?.role === 'admin' && <AdminBadge size="sm" />}
                    {v.creator?.isVerified && v.creator?.role !== 'admin' && <VerifiedBadge size="sm" />}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                    <span>{formatViews(v.views)} views</span>
                    <span>•</span>
                    <span>{formatDate(v.createdAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
