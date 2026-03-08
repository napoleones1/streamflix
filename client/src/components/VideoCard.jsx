import { Link, useNavigate } from 'react-router-dom';
import { Play, Plus, ChevronDown, ThumbsUp, Eye, X, Info } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { VerifiedBadge, AdminBadge } from './VerifiedBadge';

export default function VideoCard({ video }) {
  const [isHovered, setIsHovered] = useState(false);
  const [showHoverCard, setShowHoverCard] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isInList, setIsInList] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  // Delay hover card appearance for smoother UX
  useEffect(() => {
    let timer;
    if (isHovered) {
      timer = setTimeout(() => setShowHoverCard(true), 500);
    } else {
      setShowHoverCard(false);
    }
    return () => clearTimeout(timer);
  }, [isHovered]);

  const formatViews = (views) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to like videos');
        navigate('/login');
        return;
      }

      await axios.post(`/api/videos/${video._id}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Error liking video:', error);
      if (error.response?.status === 401) {
        alert('Please login to like videos');
        navigate('/login');
      }
    }
  };

  const handleAddToList = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to add videos to your list');
        navigate('/login');
        return;
      }

      const response = await axios.post(`/api/users/mylist/${video._id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setIsInList(response.data.inList);
      
      // Show notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-20 right-4 bg-white text-black px-6 py-3 rounded shadow-lg z-50 animate-fade-in';
      notification.textContent = response.data.message;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.remove();
      }, 2000);
    } catch (error) {
      console.error('Error adding to list:', error);
      if (error.response?.status === 401) {
        alert('Please login to add videos to your list');
        navigate('/login');
      }
    }
  };

  const handleMoreInfo = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowModal(true);
  };

  const handlePlay = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/watch/${video._id}`);
  };

  return (
    <div 
      className="video-card-wrapper relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Original Card - Hidden when hover card shows */}
      <div className={`transition-opacity duration-300 ${showHoverCard ? 'opacity-0' : 'opacity-100'}`}>
        <Link to={`/watch/${video._id}`} className="block">
          <div className="relative overflow-hidden rounded-md bg-gray-800 aspect-video">
            <img 
              src={video.thumbnailUrl || `https://source.unsplash.com/400x225/?${video.category || 'video'}`} 
              alt={video.title}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/400x225/1a1a1a/666666?text=No+Thumbnail';
              }}
            />
            
            {/* Duration Badge */}
            {video.duration && (
              <span className="absolute bottom-2 right-2 bg-black/90 px-1.5 py-0.5 text-xs font-semibold rounded">
                {formatDuration(video.duration)}
              </span>
            )}

            {/* TV Series Badge */}
            {video.contentType === 'tvshow' && video.isSeries && (
              <span className="absolute top-2 left-2 bg-blue-600 px-2 py-1 text-xs font-bold rounded flex items-center gap-1">
                📺 SERIES
              </span>
            )}

            {/* Episode Badge */}
            {video.contentType === 'tvshow' && video.isEpisode && (
              <span className="absolute top-2 left-2 bg-purple-600 px-2 py-1 text-xs font-bold rounded">
                S{video.seasonNumber}E{video.episodeNumber}
              </span>
            )}

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <Play className="w-12 h-12 text-white fill-white drop-shadow-lg" />
            </div>
          </div>
        </Link>

        {/* Info Section */}
        <div className="mt-2 px-1">
          <Link to={`/watch/${video._id}`}>
            <h3 className="font-semibold text-sm line-clamp-2 hover:text-gray-300 transition">
              {video.title}
            </h3>
          </Link>
          
          <div className="flex items-center justify-between mt-1">
            <Link 
              to={`/channel/${video.creator?._id}`}
              className="text-xs text-gray-400 hover:text-gray-300 transition flex items-center gap-1"
            >
              {video.creator?.channelName || video.creator?.username}
              {video.creator?.role === 'admin' && <AdminBadge size="sm" showTooltip={false} />}
              {video.creator?.isVerified && video.creator?.role !== 'admin' && <VerifiedBadge size="sm" showTooltip={false} />}
            </Link>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" /> {formatViews(video.views || 0)}
            </span>
            <span className="flex items-center gap-1">
              <ThumbsUp className="w-3 h-3" /> {video.likes?.length || 0}
            </span>
            {/* Show season/episode count for TV Series */}
            {video.contentType === 'tvshow' && video.isSeries && (
              <span className="text-blue-400 font-medium">
                {video.totalSeasons > 0 && video.totalEpisodes > 0 
                  ? `S${video.totalSeasons} • ${video.totalEpisodes} Eps`
                  : 'TV Series'
                }
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Card on Hover (Netflix Style) */}
      {showHoverCard && (
        <div className="hidden lg:block absolute top-0 left-0 right-0 bg-gray-900 rounded-lg shadow-2xl z-[60] -translate-y-1 scale-105 transition-all duration-300 border border-gray-700">
          <Link to={`/watch/${video._id}`}>
            <div className="relative aspect-video rounded-t-lg overflow-hidden">
              <img 
                src={video.thumbnailUrl || `https://source.unsplash.com/400x225/?${video.category || 'video'}`}
                alt={video.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/400x225/1a1a1a/666666?text=No+Thumbnail';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />
              
              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                  <Play className="w-6 h-6 text-black fill-black ml-0.5" />
                </div>
              </div>
            </div>
          </Link>

          <div className="p-3 space-y-2">
            <h3 className="font-bold text-sm line-clamp-1 leading-tight">
              {video.title}
            </h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button 
                  onClick={handlePlay}
                  className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-200 transition"
                  title="Play"
                >
                  <Play className="w-4 h-4 text-black fill-black ml-0.5" />
                </button>
                <button 
                  onClick={handleAddToList}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition ${
                    isInList 
                      ? 'bg-white border-white' 
                      : 'border-gray-400 hover:border-white bg-gray-800/50'
                  }`}
                  title={isInList ? "Remove from My List" : "Add to My List"}
                >
                  <Plus className={`w-4 h-4 ${isInList ? 'text-black' : ''}`} />
                </button>
                <button 
                  onClick={handleLike}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition ${
                    isLiked 
                      ? 'bg-white border-white' 
                      : 'border-gray-400 hover:border-white bg-gray-800/50'
                  }`}
                  title={isLiked ? "Unlike" : "Like"}
                >
                  <ThumbsUp className={`w-4 h-4 ${isLiked ? 'text-black fill-black' : ''}`} />
                </button>
              </div>
              
              <button 
                onClick={handleMoreInfo}
                className="w-8 h-8 rounded-full border-2 border-gray-400 flex items-center justify-center hover:border-white transition bg-gray-800/50"
                title="More Info"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-green-500 font-semibold">95% Match</span>
              <span className="border border-gray-500 px-1.5 py-0.5 rounded text-xs">HD</span>
              <span className="flex items-center gap-1 text-gray-400">
                <Eye className="w-3 h-3" /> {formatViews(video.views || 0)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* More Info Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-gray-900 rounded-lg max-w-3xl w-full my-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button - Fixed Position */}
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-gray-900 border-2 border-gray-600 flex items-center justify-center hover:bg-gray-800 hover:border-white transition z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Video Preview */}
            <div className="relative aspect-video bg-black rounded-t-lg overflow-hidden">
              <img 
                src={video.thumbnailUrl || `https://source.unsplash.com/800x450/?${video.category || 'video'}`}
                alt={video.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/800x450/1a1a1a/666666?text=No+Thumbnail';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />

              {/* Play Button Overlay */}
              <button 
                onClick={handlePlay}
                className="absolute inset-0 flex items-center justify-center group"
              >
                <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center group-hover:bg-white transition transform group-hover:scale-110">
                  <Play className="w-8 h-8 text-black fill-black ml-1" />
                </div>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-3">
              {/* Title and Actions */}
              <div className="space-y-3">
                <h2 className="text-xl lg:text-2xl font-bold pr-8 line-clamp-2">{video.title}</h2>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handlePlay}
                    className="bg-white text-black px-6 py-2 rounded font-bold flex items-center gap-2 hover:bg-gray-200 transition text-sm"
                  >
                    <Play className="w-4 h-4 fill-current" /> Play
                  </button>
                  <button 
                    onClick={handleAddToList}
                    className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition ${
                      isInList 
                        ? 'bg-white border-white' 
                        : 'border-gray-400 hover:border-white'
                    }`}
                    title={isInList ? "Remove from My List" : "Add to My List"}
                  >
                    <Plus className={`w-4 h-4 ${isInList ? 'text-black' : ''}`} />
                  </button>
                  <button 
                    onClick={handleLike}
                    className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition ${
                      isLiked 
                        ? 'bg-white border-white' 
                        : 'border-gray-400 hover:border-white'
                    }`}
                    title={isLiked ? "Unlike" : "Like"}
                  >
                    <ThumbsUp className={`w-4 h-4 ${isLiked ? 'text-black fill-black' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Meta Info */}
              <div className="flex items-center gap-3 text-xs">
                <span className="text-green-500 font-semibold">95% Match</span>
                <span className="border border-gray-500 px-1.5 py-0.5">{video.ageRating || 'PG-13'}</span>
                <span>{video.releaseYear || '2024'}</span>
                <span className="border border-gray-500 px-1.5 py-0.5">HD</span>
              </div>

              {/* Genres (Netflix-style) */}
              {video.genres && video.genres.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 text-xs">
                  <span className="text-gray-400">Genres:</span>
                  {video.genres.map((genre, i) => (
                    <span key={i} className="text-gray-300">
                      {genre.charAt(0).toUpperCase() + genre.slice(1).replace('scifi', 'Sci-Fi')}
                      {i < video.genres.length - 1 && <span className="text-gray-500 mx-1">•</span>}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" /> {formatViews(video.views || 0)} views
                </span>
                <span className="flex items-center gap-1">
                  <ThumbsUp className="w-3 h-3" /> {video.likes?.length || 0} likes
                </span>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-sm font-semibold mb-1">Description</h3>
                <p className="text-gray-300 text-xs leading-relaxed line-clamp-3">
                  {video.description || 'No description available'}
                </p>
              </div>

              {/* Creator Info */}
              {video.creator && (
                <div className="border-t border-gray-700 pt-3">
                  <Link 
                    to={`/channel/${video.creator._id}`}
                    className="flex items-center gap-2 hover:text-gray-300 transition"
                    onClick={() => setShowModal(false)}
                  >
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
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-netflix to-youtube flex items-center justify-center text-lg font-bold"
                      style={{ display: video.creator.avatar ? 'none' : 'flex' }}
                    >
                      {video.creator.channelName?.[0] || video.creator.username?.[0] || 'U'}
                    </div>
                    <div>
                      <p className="font-semibold text-sm flex items-center gap-1.5">
                        {video.creator.channelName || video.creator.username}
                        {video.creator.role === 'admin' && <AdminBadge size="sm" showTooltip={false} />}
                        {video.creator.isVerified && video.creator.role !== 'admin' && <VerifiedBadge size="sm" showTooltip={false} />}
                      </p>
                      <p className="text-xs text-gray-400">
                        {video.creator.subscribers?.length || 0} subscribers
                      </p>
                    </div>
                  </Link>
                </div>
              )}

              {/* Tags */}
              {video.tags && video.tags.length > 0 && (
                <div className="border-t border-gray-700 pt-3">
                  <div className="flex flex-wrap gap-1.5">
                    {video.tags.slice(0, 5).map((tag, i) => (
                      <span 
                        key={i}
                        className="bg-gray-800 px-2 py-0.5 rounded-full text-xs text-gray-300 hover:bg-gray-700 transition cursor-pointer"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
