import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Video, Eye, ThumbsUp, Users, TrendingUp, Upload, 
  BarChart3, DollarSign, Clock, Play, Settings
} from 'lucide-react';
import VideoCard from '../components/VideoCard';

export default function CreatorDashboard() {
  const [stats, setStats] = useState({
    totalVideos: 0,
    totalViews: 0,
    totalLikes: 0,
    totalSubscribers: 0
  });
  const [videos, setVideos] = useState([]);
  const [recentVideos, setRecentVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [userRes, videosRes] = await Promise.all([
        axios.get('/api/users/me'),
        axios.get('/api/videos')
      ]);

      const user = userRes.data;
      console.log('Current user:', user); // Debug
      console.log('All videos:', videosRes.data); // Debug
      
      // Filter videos by creator ID or username, exclude episodes
      const myVideos = videosRes.data.filter(v => {
        if (!v.creator) return false;
        const isMyVideo = v.creator._id === user.id || 
               v.creator._id === user._id || 
               v.creator.username === user.username;
        // Exclude episodes from dashboard display
        return isMyVideo && !v.isEpisode;
      });

      console.log('My videos:', myVideos); // Debug

      setVideos(myVideos);
      setRecentVideos(myVideos.slice(0, 5));

      const totalViews = myVideos.reduce((acc, v) => acc + (v.views || 0), 0);
      const totalLikes = myVideos.reduce((acc, v) => acc + (v.likes?.length || 0), 0);

      setStats({
        totalVideos: myVideos.length,
        totalViews,
        totalLikes,
        totalSubscribers: user.subscribers?.length || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num;
  };

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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Creator Dashboard</h1>
            <p className="text-gray-400">Manage your content and track performance</p>
          </div>
          <div className="flex gap-3">
            <Link 
              to="/channel-settings"
              className="bg-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition flex items-center gap-2"
            >
              <Settings className="w-5 h-5" />
              Settings
            </Link>
            <Link 
              to="/upload"
              className="bg-netflix px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition flex items-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Upload Video
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Video className="w-6 h-6 text-blue-500" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold mb-1">{stats.totalVideos}</p>
            <p className="text-sm text-gray-400">Total Videos</p>
          </div>

          <div className="bg-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-purple-500" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold mb-1">{formatNumber(stats.totalViews)}</p>
            <p className="text-sm text-gray-400">Total Views</p>
          </div>

          <div className="bg-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                <ThumbsUp className="w-6 h-6 text-red-500" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold mb-1">{formatNumber(stats.totalLikes)}</p>
            <p className="text-sm text-gray-400">Total Likes</p>
          </div>

          <div className="bg-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-500" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold mb-1">{formatNumber(stats.totalSubscribers)}</p>
            <p className="text-sm text-gray-400">Subscribers</p>
          </div>
        </div>

        {/* Recent Videos */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Recent Uploads</h2>
            <Link to="/my-videos" className="text-netflix hover:underline text-sm">
              View All
            </Link>
          </div>

          {recentVideos.length > 0 ? (
            <div className="space-y-4">
              {recentVideos.map(video => (
                <div key={video._id} className="flex gap-4 p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition">
                  <Link to={`/watch/${video._id}`} className="flex-shrink-0">
                    <img 
                      src={video.thumbnailUrl || `https://source.unsplash.com/400x225/?${video.category}`}
                      alt={video.title}
                      className="w-40 h-24 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x225?text=No+Thumbnail';
                      }}
                    />
                  </Link>
                  
                  <div className="flex-1 min-w-0">
                    <Link to={`/watch/${video._id}`}>
                      <h3 className="font-semibold mb-1 hover:text-netflix transition line-clamp-1">
                        {video.title}
                      </h3>
                    </Link>
                    <p className="text-sm text-gray-400 line-clamp-2 mb-2">
                      {video.description || 'No description'}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {formatNumber(video.views || 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" /> {video.likes?.length || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(video.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link 
                      to={`/watch/${video._id}`}
                      className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 transition text-sm"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-700 flex items-center justify-center">
                <Video className="w-10 h-10 text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No videos yet</h3>
              <p className="text-gray-400 mb-4">Start creating content to see it here</p>
              <Link 
                to="/upload"
                className="inline-flex items-center gap-2 bg-netflix px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition"
              >
                <Upload className="w-5 h-5" />
                Upload Your First Video
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link 
            to="/upload"
            className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition group"
          >
            <div className="w-12 h-12 bg-netflix/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-netflix/30 transition">
              <Upload className="w-6 h-6 text-netflix" />
            </div>
            <h3 className="font-bold mb-2">Upload Video</h3>
            <p className="text-sm text-gray-400">Share your content with the world</p>
          </Link>

          <Link 
            to="/analytics"
            className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition group"
          >
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-500/30 transition">
              <BarChart3 className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="font-bold mb-2">Analytics</h3>
            <p className="text-sm text-gray-400">Track your channel performance</p>
          </Link>

          <Link 
            to="/my-videos"
            className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition group"
          >
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-500/30 transition">
              <Play className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="font-bold mb-2">My Videos</h3>
            <p className="text-sm text-gray-400">Manage all your uploads</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
