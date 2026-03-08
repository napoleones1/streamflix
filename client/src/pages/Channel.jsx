import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import VideoCard from '../components/VideoCard';
import { BellRing, Share2, MoreHorizontal, Play } from 'lucide-react';
import { VerifiedBadge, AdminBadge } from '../components/VerifiedBadge';
import { ConfirmModal, PromptModal, AlertModal } from '../components/Modal';

export default function Channel() {
  const { id } = useParams();
  const [creator, setCreator] = useState(null);
  const [videos, setVideos] = useState([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [activeTab, setActiveTab] = useState('videos');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  
  // Modal states
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showShareAlert, setShowShareAlert] = useState(false);

  useEffect(() => {
    fetchChannel();
  }, [id]);

  const fetchChannel = async () => {
    try {
      const videosRes = await axios.get(`/api/videos`);
      // Filter videos by creator and exclude episodes (only show main series and regular videos)
      const creatorVideos = videosRes.data.filter(v => v.creator._id === id && !v.isEpisode);
      
      if (creatorVideos.length > 0) {
        setCreator(creatorVideos[0].creator);
      }
      setVideos(creatorVideos);
    } catch (error) {
      console.error('Error fetching channel:', error);
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
        await axios.post(`/api/users/unsubscribe/${id}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`/api/users/subscribe/${id}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setIsSubscribed(!isSubscribed);
      
      // Refresh channel data to get updated subscriber count
      fetchChannel();
    } catch (error) {
      console.error('Error subscribing:', error);
    }
  };

  const formatSubscribers = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count;
  };

  const handleShare = async () => {
    const shareData = {
      title: creator.channelName || creator.username,
      text: `Check out ${creator.channelName || creator.username}'s channel on StreamFlix!`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        setShowShareAlert(true);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        setShowShareAlert(true);
      } catch (err) {
        console.error('Error copying to clipboard:', err);
      }
    }
  };

  const handleReport = (reason) => {
    const reasons = {
      '1': 'Spam or misleading',
      '2': 'Inappropriate content',
      '3': 'Harassment or bullying',
      '4': 'Other'
    };
    
    const reportReason = reasons[reason] || 'Other';
    // TODO: Send report to backend
    console.log('Report submitted:', reportReason);
  };

  const handleBlock = () => {
    // TODO: Implement block functionality
    console.log('Channel blocked');
  };

  if (!creator) return (
    <div className="pt-20 flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-netflix"></div>
    </div>
  );

  return (
    <div className="pt-16 bg-gray-900 min-h-screen">
      {/* Channel Banner */}
      <div className="relative h-48 lg:h-64 bg-gradient-to-r from-purple-900 via-netflix to-youtube">
        {creator.channelBanner && creator.channelBanner.trim() !== '' ? (
          <img 
            src={creator.channelBanner}
            alt="Channel Banner"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : null}
      </div>

      {/* Channel Info */}
      <div className="max-w-[1920px] mx-auto px-4 lg:px-16">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 py-6 border-b border-gray-800">
          {creator.avatar ? (
            <img 
              src={creator.avatar}
              alt={creator.channelName || creator.username}
              className="w-20 h-20 lg:w-32 lg:h-32 rounded-full object-cover border-4 border-gray-800 flex-shrink-0"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className="w-20 h-20 lg:w-32 lg:h-32 rounded-full bg-gradient-to-br from-netflix to-youtube flex items-center justify-center text-3xl lg:text-5xl font-black flex-shrink-0"
            style={{ display: creator.avatar ? 'none' : 'flex' }}
          >
            {creator.username?.[0]?.toUpperCase()}
          </div>

          <div className="flex-1 space-y-2">
            <h1 className="text-3xl lg:text-4xl font-black flex items-center gap-2">
              {creator.channelName || creator.username}
              {creator.role === 'admin' && <AdminBadge size="lg" />}
              {creator.isVerified && creator.role !== 'admin' && <VerifiedBadge size="lg" />}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
              <span>@{creator.username}</span>
              <span>•</span>
              <span>{formatSubscribers(creator.subscribers?.length || 0)} subscribers</span>
              <span>•</span>
              <span>{videos.length} videos</span>
            </div>
            {creator.channelDescription && (
              <p className="text-sm text-gray-300 max-w-3xl">
                {creator.channelDescription}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleSubscribe}
              className={`px-6 py-2.5 rounded-full font-medium transition flex items-center gap-2 ${
                isSubscribed 
                  ? 'bg-gray-700 hover:bg-gray-600' 
                  : 'bg-white text-black hover:bg-gray-200'
              }`}
            >
              {isSubscribed ? (
                <>
                  <BellRing className="w-5 h-5" />
                  Subscribed
                </>
              ) : (
                'Subscribe'
              )}
            </button>

            <button 
              onClick={handleShare}
              className="p-2.5 bg-gray-800 rounded-full hover:bg-gray-700 transition"
              title="Share channel"
            >
              <Share2 className="w-5 h-5" />
            </button>

            <div className="relative">
              <button 
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="p-2.5 bg-gray-800 rounded-full hover:bg-gray-700 transition"
                title="More options"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>

              {/* More Options Menu */}
              {showMoreMenu && (
                <>
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowMoreMenu(false)}
                  />
                  
                  {/* Menu */}
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-[60]">
                    <button
                      onClick={() => {
                        handleShare();
                        setShowMoreMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-700 transition flex items-center gap-3 text-sm rounded-t-lg"
                    >
                      <Share2 className="w-4 h-4" />
                      Share channel
                    </button>
                    <button
                      onClick={() => {
                        setShowReportModal(true);
                        setShowMoreMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-700 transition flex items-center gap-3 text-sm border-t border-gray-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                      </svg>
                      Report channel
                    </button>
                    <button
                      onClick={() => {
                        setShowBlockModal(true);
                        setShowMoreMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-700 transition flex items-center gap-3 text-sm text-red-400 border-t border-gray-700 rounded-b-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                      Block channel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-8 border-b border-gray-800">
          <button 
            onClick={() => setActiveTab('videos')}
            className={`py-4 px-2 font-medium transition relative ${
              activeTab === 'videos' ? 'text-white' : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Videos
            {activeTab === 'videos' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab('about')}
            className={`py-4 px-2 font-medium transition relative ${
              activeTab === 'about' ? 'text-white' : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            About
            {activeTab === 'about' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="py-8">
          {activeTab === 'videos' && (
            <>
              {videos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {videos.map(video => (
                    <VideoCard key={video._id} video={video} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gray-800 flex items-center justify-center">
                    <Play className="w-16 h-16 text-gray-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">No videos yet</h3>
                  <p className="text-gray-400">This channel hasn't uploaded any videos</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'about' && (
            <div className="max-w-4xl space-y-8">
              <div>
                <h3 className="text-lg font-bold mb-3">Description</h3>
                <p className="text-gray-300">
                  {creator.channelDescription || 'No description available'}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3">Channel Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Username:</span>
                    <span>@{creator.username}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Subscribers:</span>
                    <span>{formatSubscribers(creator.subscribers?.length || 0)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Total Videos:</span>
                    <span>{videos.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Total Views:</span>
                    <span>{videos.reduce((acc, v) => acc + (v.views || 0), 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3">Stats</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-netflix">{videos.length}</p>
                    <p className="text-sm text-gray-400">Videos</p>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-youtube">{formatSubscribers(creator.subscribers?.length || 0)}</p>
                    <p className="text-sm text-gray-400">Subscribers</p>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-green-500">
                      {videos.reduce((acc, v) => acc + (v.views || 0), 0) > 1000 
                        ? formatSubscribers(videos.reduce((acc, v) => acc + (v.views || 0), 0))
                        : videos.reduce((acc, v) => acc + (v.views || 0), 0)
                      }
                    </p>
                    <p className="text-sm text-gray-400">Total Views</p>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-blue-500">
                      {videos.reduce((acc, v) => acc + (v.likes?.length || 0), 0)}
                    </p>
                    <p className="text-sm text-gray-400">Total Likes</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AlertModal
        isOpen={showShareAlert}
        onClose={() => setShowShareAlert(false)}
        title="Link Copied!"
        message="Channel link has been copied to your clipboard."
        type="success"
      />

      <PromptModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={handleReport}
        title="Report Channel"
        message="Why are you reporting this channel?"
        options={[
          { value: '1', label: 'Spam or misleading', description: 'Scams, fake content, or misleading information' },
          { value: '2', label: 'Inappropriate content', description: 'Offensive or inappropriate material' },
          { value: '3', label: 'Harassment or bullying', description: 'Targeting individuals with abuse' },
          { value: '4', label: 'Other', description: 'Other violations of community guidelines' }
        ]}
      />

      <ConfirmModal
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        onConfirm={handleBlock}
        title="Block Channel"
        message={`Are you sure you want to block ${creator.channelName || creator.username}? You won't see their content anymore.`}
        confirmText="Block"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
