import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Eye, ThumbsUp, MessageCircle, MoreVertical, Edit, Trash2, BarChart } from 'lucide-react';
import { AlertModal } from '../components/Modal';

export default function MyVideos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showDeleteError, setShowDeleteError] = useState(false);

  useEffect(() => {
    fetchMyVideos();
    
    // Refresh data when returning from edit page
    const handleFocus = () => {
      console.log('Window focused, refreshing videos...');
      fetchMyVideos();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchMyVideos = async () => {
    try {
      console.log('Fetching my videos...');
      const [userRes, videosRes] = await Promise.all([
        axios.get('/api/users/me'),
        axios.get('/api/videos')
      ]);

      const user = userRes.data;
      console.log('Current user:', user.username);
      
      const myVideos = videosRes.data.filter(v => {
        if (!v.creator) return false;
        return v.creator._id === user.id || 
               v.creator._id === user._id || 
               v.creator.username === user.username;
      });
      
      console.log('My videos count:', myVideos.length);
      myVideos.forEach(v => {
        console.log(`Video: ${v.title}, Thumbnail: ${v.thumbnailUrl?.substring(0, 50)}...`);
      });
      
      setVideos(myVideos);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (videoId) => {
    try {
      await axios.delete(`/api/videos/${videoId}`);
      setVideos(videos.filter(v => v._id !== videoId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting video:', error);
      setShowDeleteError(true);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num;
  };

  const filteredVideos = videos.filter(v => {
    if (filter === 'all') return true;
    if (filter === 'netflix') return v.type === 'netflix';
    if (filter === 'youtube') return v.type === 'youtube';
    return true;
  });

  if (loading) {
    return (
      <div className="pt-20 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-netflix"></div>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Videos</h1>
            <p className="text-gray-400">{videos.length} videos uploaded</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                console.log('Manual refresh triggered');
                setLoading(true);
                fetchMyVideos();
              }}
              className="px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition text-sm"
            >
              🔄 Refresh
            </button>
            <Link 
              to="/upload"
              className="bg-netflix px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition"
            >
              Upload New Video
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'all' ? 'bg-white text-black' : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            All ({videos.length})
          </button>
          <button
            onClick={() => setFilter('netflix')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'netflix' ? 'bg-white text-black' : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            Movies & Series ({videos.filter(v => v.type === 'netflix').length})
          </button>
          <button
            onClick={() => setFilter('youtube')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'youtube' ? 'bg-white text-black' : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            Videos ({videos.filter(v => v.type === 'youtube').length})
          </button>
        </div>

        {/* Videos List */}
        {filteredVideos.length > 0 ? (
          <div className="space-y-4">
            {filteredVideos.map(video => {
              console.log(`Rendering video: ${video.title}, has thumbnail: ${!!video.thumbnailUrl}`);
              return (
              <div key={video._id} className="bg-gray-800 rounded-xl p-4 hover:bg-gray-750 transition">
                <div className="flex gap-4">
                  <Link to={`/watch/${video._id}`} className="flex-shrink-0">
                    {video.thumbnailUrl && video.thumbnailUrl.trim() !== '' ? (
                      <img 
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-48 h-28 rounded-lg object-cover bg-gray-700"
                        onError={(e) => {
                          console.error('❌ Thumbnail load error for:', video.title, video.thumbnailUrl?.substring(0, 50));
                          e.target.style.display = 'none';
                          const fallback = document.createElement('div');
                          fallback.className = 'w-48 h-28 rounded-lg bg-gray-700 flex items-center justify-center text-gray-500 text-sm';
                          fallback.textContent = 'No Thumbnail';
                          e.target.parentNode.appendChild(fallback);
                        }}
                        onLoad={() => {
                          console.log('✅ Thumbnail loaded successfully for:', video.title);
                        }}
                      />
                    ) : (
                      <div className="w-48 h-28 rounded-lg bg-gray-700 flex items-center justify-center text-gray-500 text-sm">
                        No Thumbnail
                      </div>
                    )}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <Link to={`/watch/${video._id}`}>
                          <h3 className="font-bold text-lg mb-1 hover:text-netflix transition line-clamp-1">
                            {video.title}
                          </h3>
                        </Link>
                        <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                          {video.description || 'No description'}
                        </p>
                      </div>
                      
                      <button className="p-2 hover:bg-gray-700 rounded-lg transition">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-400 mb-4">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {formatNumber(video.views || 0)} views
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4" />
                        {video.likes?.length || 0} likes
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        {video.comments?.length || 0} comments
                      </span>
                      <span>
                        {new Date(video.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link 
                        to={`/watch/${video._id}`}
                        className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition text-sm flex items-center gap-2"
                      >
                        <BarChart className="w-4 h-4" />
                        View
                      </Link>
                      <Link 
                        to={`/edit-video/${video._id}`}
                        className="px-4 py-2 bg-blue-600/20 text-blue-500 rounded-lg hover:bg-blue-600/30 transition text-sm flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </Link>
                      <button 
                        onClick={() => setDeleteConfirm(video._id)}
                        className="px-4 py-2 bg-red-600/20 text-red-500 rounded-lg hover:bg-red-600/30 transition text-sm flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gray-800 flex items-center justify-center">
              <BarChart className="w-16 h-16 text-gray-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No videos found</h2>
            <p className="text-gray-400 mb-6">
              {filter !== 'all' 
                ? `You haven't uploaded any ${filter === 'netflix' ? 'movies or series' : 'videos'} yet`
                : "You haven't uploaded any videos yet"
              }
            </p>
            <Link 
              to="/upload"
              className="inline-block bg-netflix px-8 py-3 rounded-lg font-semibold hover:bg-red-700 transition"
            >
              Upload Your First Video
            </Link>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Delete Video?</h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete this video? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-600 py-3 rounded-lg font-semibold hover:bg-red-700 transition"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      <AlertModal
        isOpen={showDeleteError}
        onClose={() => setShowDeleteError(false)}
        title="Delete Failed"
        message="Failed to delete video. Please try again."
        type="error"
      />
    </div>
  );
}
