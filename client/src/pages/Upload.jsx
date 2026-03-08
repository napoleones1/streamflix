import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Upload as UploadIcon, Film, Youtube, Image, X, AlertCircle, Shield } from 'lucide-react';
import { AlertModal } from '../components/Modal';

export default function Upload() {
  const navigate = useNavigate();
  const [creatorStatus, setCreatorStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    videoType: 'direct',
    thumbnailUrl: '',
    type: 'youtube',
    category: 'vlog',
    genres: [], // Multiple genres for movies/TV
    contentType: 'video', // video, movie, tvshow
    tags: '',
    ageRating: 'PG-13',
    releaseYear: new Date().getFullYear(),
    downloadUrl: '', // Optional download link
    trailerUrl: '', // Optional trailer URL (YouTube) for movies only
    // TV Series fields
    isSeries: false, // Is this the main series entry?
    isEpisode: false, // Is this an episode?
    seriesId: '', // Link to main series (for episodes)
    seasonNumber: 1,
    episodeNumber: 1,
    totalSeasons: 0, // 0 = belum tahu
    totalEpisodes: 0 // 0 = belum tahu
  });
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState('');
  const [youtubeDataFetched, setYoutubeDataFetched] = useState(false);
  const [availableSeries, setAvailableSeries] = useState([]); // For episode upload

  // Modal states
  const [showInvalidUrlAlert, setShowInvalidUrlAlert] = useState(false);
  const [showFetchSuccessAlert, setShowFetchSuccessAlert] = useState(false);
  const [showFetchPartialAlert, setShowFetchPartialAlert] = useState(false);
  const [showFetchErrorAlert, setShowFetchErrorAlert] = useState(false);
  const [fetchedInfo, setFetchedInfo] = useState(null);

  // Check creator status on mount
  useEffect(() => {
    checkCreatorStatus();
    fetchAvailableSeries();
  }, []);

  const checkCreatorStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const { data } = await axios.get('/api/creator-request/status', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCreatorStatus(data);
      setLoading(false);
    } catch (error) {
      console.error('Error checking creator status:', error);
      setLoading(false);
    }
  };

  const fetchAvailableSeries = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const { data } = await axios.get('/api/videos/series/list/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filter to only show series created by current user
      const userId = JSON.parse(atob(token.split('.')[1])).userId;
      const mySeries = data.filter(s => s.creator._id === userId);
      setAvailableSeries(mySeries);
    } catch (error) {
      console.error('Error fetching series:', error);
    }
  };

  const handleThumbnailUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Harap upload file gambar (JPG, PNG, GIF)');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Ukuran gambar harus kurang dari 2MB');
      return;
    }

    setError('');

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Just use the base64 directly without compression
        // Browser will handle the image display
        const base64String = reader.result;
        setFormData({ ...formData, thumbnailUrl: base64String });
        console.log('✅ Thumbnail uploaded, length:', base64String.length);
      };
      reader.onerror = () => {
        setError('Error membaca file');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      setError('Error mengupload gambar');
    }
  };

  // Extract YouTube video ID - improved regex
  const getYouTubeId = (url) => {
    if (!url) return null;
    
    // Remove timestamp parameter
    url = url.split('&t=')[0].split('?t=')[0];
    
    // Multiple regex patterns for different YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^#&?\/]{11})/,
      /^([^#&?\/]{11})$/ // Just the ID
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  };

  // Extract YouTube thumbnail - check multiple quality options
  const getYouTubeThumbnail = async (videoId) => {
    if (!videoId) return '';
    
    // Try maxresdefault first (highest quality)
    const maxresUrl = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
    const hqdefaultUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    
    try {
      // Check if maxresdefault exists
      const response = await fetch(maxresUrl, { method: 'HEAD' });
      if (response.ok) {
        console.log('Using maxresdefault thumbnail');
        return maxresUrl;
      }
    } catch (error) {
      console.log('maxresdefault not available, using hqdefault');
    }
    
    // Fallback to hqdefault (always available)
    console.log('Using hqdefault thumbnail');
    return hqdefaultUrl;
  };

  // Fetch YouTube video info
  const fetchYouTubeInfo = async (url) => {
    const videoId = getYouTubeId(url);
    if (!videoId) {
      console.error('Could not extract video ID from URL:', url);
      return null;
    }

    console.log('Fetching YouTube info for video ID:', videoId);

    try {
      // Fetch title, description, and thumbnail from our backend
      const response = await axios.get(`/api/youtube/info/${videoId}`);
      
      console.log('YouTube info response:', response.data);
      
      // Use thumbnail from backend if available, otherwise fallback to manual fetch
      let thumbnail = response.data.thumbnail;
      if (!thumbnail) {
        thumbnail = await getYouTubeThumbnail(videoId);
      }
      
      console.log('Selected thumbnail URL:', thumbnail);
      
      return {
        title: response.data.title || '',
        thumbnail: thumbnail,
        author: response.data.author || '',
        description: response.data.description || ''
      };
    } catch (error) {
      console.error('Error fetching YouTube info:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      // Return basic info even if fetch fails
      const thumbnail = await getYouTubeThumbnail(videoId);
      return {
        title: '',
        thumbnail: thumbnail,
        author: '',
        description: ''
      };
    }
  };

  // Auto-fill data when YouTube URL changes
  useEffect(() => {
    const loadYouTubeInfo = async () => {
      if (formData.videoType === 'youtube' && formData.videoUrl && !youtubeDataFetched) {
        const videoId = getYouTubeId(formData.videoUrl);
        
        console.log('=== AUTO-FETCHING YOUTUBE INFO ===');
        console.log('Video URL:', formData.videoUrl);
        console.log('Extracted Video ID:', videoId);
        
        if (videoId) {
          setYoutubeDataFetched(true);
          const info = await fetchYouTubeInfo(formData.videoUrl);
          
          console.log('=== FETCHED INFO ===');
          console.log('Title:', info?.title);
          console.log('Thumbnail:', info?.thumbnail);
          console.log('Description length:', info?.description?.length || 0);
          console.log('Description preview:', info?.description?.substring(0, 100));
          
          if (info) {
            setFormData(prev => {
              const updated = { 
                ...prev, 
                thumbnailUrl: info.thumbnail || prev.thumbnailUrl,
                title: info.title || prev.title,
                description: info.description || prev.description
              };
              console.log('=== FORM DATA UPDATED ===');
              console.log('New title:', updated.title);
              console.log('New description length:', updated.description?.length || 0);
              return updated;
            });
          }
        } else {
          console.error('Failed to extract video ID from URL');
        }
      }
    };

    // Delay to prevent too many calls
    const timer = setTimeout(() => {
      loadYouTubeInfo();
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData.videoUrl, formData.videoType, youtubeDataFetched]);

  // Reset youtube data fetched flag when URL or type changes
  useEffect(() => {
    setYoutubeDataFetched(false);
  }, [formData.videoUrl, formData.videoType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation for episodes
    if (formData.isEpisode && !formData.seriesId) {
      setError('Please select a series for this episode');
      return;
    }

    // Validation for main series
    if (formData.isSeries && !formData.isEpisode) {
      if (!formData.title || !formData.description) {
        setError('Main series entry requires title and description');
        return;
      }
    }

    // Validation for episodes - video URL required
    if (formData.isEpisode && !formData.videoUrl) {
      setError('Episode requires a video URL');
      return;
    }

    setUploadLoading(true);

    try {
      const dataToSend = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };
      
      // Clean up fields based on content type
      if (formData.isSeries && !formData.isEpisode) {
        // Main series entry - remove episode-specific fields
        delete dataToSend.seriesId;
        delete dataToSend.seasonNumber;
        delete dataToSend.episodeNumber;
        
        // Video URL is optional for main series
        if (!formData.videoUrl) {
          dataToSend.videoUrl = 'https://placeholder.com/series-trailer';
        }
      } else if (formData.isEpisode) {
        // Episode - remove series-specific fields
        delete dataToSend.totalSeasons;
        delete dataToSend.totalEpisodes;
      } else {
        // Regular video/movie - remove all series/episode fields
        delete dataToSend.isSeries;
        delete dataToSend.isEpisode;
        delete dataToSend.seriesId;
        delete dataToSend.seasonNumber;
        delete dataToSend.episodeNumber;
        delete dataToSend.totalSeasons;
        delete dataToSend.totalEpisodes;
      }
      
      await axios.post('/api/videos', dataToSend);
      
      // Refresh series list if we just created a new series
      if (formData.isSeries) {
        await fetchAvailableSeries();
      }
      
      navigate('/creator-dashboard');
    } catch (error) {
      setError(error.response?.data?.error || 'Error uploading video');
    } finally {
      setUploadLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="pt-20 min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-netflix"></div>
      </div>
    );
  }

  // Not a creator - show request page
  if (!creatorStatus?.isCreator) {
    return (
      <div className="pt-20 min-h-screen bg-gray-900">
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="bg-gray-800 rounded-xl p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-netflix to-youtube rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10" />
            </div>
            
            <h1 className="text-3xl font-bold mb-4">Become a Creator</h1>
            
            {creatorStatus?.request?.status === 'pending' ? (
              <>
                <p className="text-gray-300 mb-6">
                  Your creator request is currently under review by our admin team.
                </p>
                <div className="bg-yellow-900/30 border border-yellow-700 text-yellow-100 p-4 rounded-lg mb-6">
                  <p className="font-semibold mb-2">Request Status: Pending</p>
                  <p className="text-sm">Requested on: {new Date(creatorStatus.request.requestedAt).toLocaleDateString()}</p>
                  {creatorStatus.request.reason && (
                    <p className="text-sm mt-2">Reason: {creatorStatus.request.reason}</p>
                  )}
                </div>
                <p className="text-sm text-gray-400">
                  You will be notified once your request has been reviewed.
                </p>
              </>
            ) : creatorStatus?.request?.status === 'rejected' ? (
              <>
                <p className="text-gray-300 mb-6">
                  Your previous creator request was not approved.
                </p>
                <div className="bg-red-900/30 border border-red-700 text-red-100 p-4 rounded-lg mb-6">
                  <p className="font-semibold mb-2">Request Status: Rejected</p>
                  {creatorStatus.request.reason && (
                    <p className="text-sm">Reason: {creatorStatus.request.reason}</p>
                  )}
                  <p className="text-sm mt-2">Reviewed on: {new Date(creatorStatus.request.reviewedAt).toLocaleDateString()}</p>
                </div>
                <p className="text-sm text-gray-400 mb-6">
                  You can submit a new request if you believe this was a mistake.
                </p>
                <Link
                  to="/creator-request"
                  className="inline-block bg-netflix hover:bg-red-700 px-8 py-3 rounded-lg font-semibold transition"
                >
                  Submit New Request
                </Link>
              </>
            ) : (
              <>
                <p className="text-gray-300 mb-6">
                  To upload videos and content to StreamFlix, you need to become an approved creator.
                  Submit a request and our admin team will review your application.
                </p>
                <div className="bg-gray-700 rounded-lg p-6 mb-6 text-left">
                  <h3 className="font-semibold mb-3">Creator Benefits:</h3>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>Upload unlimited videos, movies, and TV shows</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>Access to Creator Dashboard with analytics</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>Build your audience with subscribers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>Customize your channel with banner and description</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>Eligible for verified creator badge</span>
                    </li>
                  </ul>
                </div>
                <Link
                  to="/creator-request"
                  className="inline-block bg-netflix hover:bg-red-700 px-8 py-3 rounded-lg font-semibold transition"
                >
                  Request Creator Access
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">Upload Video</h1>
          <p className="text-gray-400">Share your content with the world</p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-900/30 border border-blue-700 text-blue-100 p-4 rounded-lg mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-semibold mb-1">Upload Guidelines</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Movies: Recommended 90+ minutes duration</li>
              <li>TV Show Episodes: Recommended 21+ minutes duration</li>
              <li>Use appropriate video hosting platform (YouTube, DoodStream, etc.)</li>
            </ul>
          </div>
        </div>

        {error && (
          <div className="bg-orange-600 text-white p-4 rounded-lg mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold mb-1">Upload Information</p>
              <p className="text-sm">{error}</p>
            </div>
            <button onClick={() => setError('')}>
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Video Details Card */}
          <div className="bg-gray-800 rounded-xl p-6 space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Film className="w-6 h-6 text-netflix" />
              Video Details
            </h2>

            <div>
              <label className="block text-sm font-medium mb-2">
                Title *
                {formData.videoType === 'youtube' && formData.title && (
                  <span className="text-green-500 ml-2">(Auto-filled from YouTube)</span>
                )}
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Enter a catchy title for your video"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Description
                {formData.videoType === 'youtube' && formData.description && (
                  <span className="text-green-500 ml-2">(Auto-filled from YouTube)</span>
                )}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Tell viewers about your video"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix focus:border-transparent h-32 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                {formData.description.length} / 5000 characters
                {formData.videoType === 'youtube' && ' (YouTube videos auto-fill with video title)'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tags</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({...formData, tags: e.target.value})}
                placeholder="gaming, tutorial, vlog (comma separated)"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-1">
                Add tags to help people find your video
              </p>
            </div>
          </div>

          {/* Media URLs Card */}
          <div className="bg-gray-800 rounded-xl p-6 space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <UploadIcon className="w-6 h-6 text-youtube" />
              Media Files
            </h2>

            <div>
              <label className="block text-sm font-medium mb-2">Video URL *</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={formData.videoUrl}
                  onChange={(e) => {
                    setFormData({...formData, videoUrl: e.target.value});
                    setYoutubeDataFetched(false);
                  }}
                  placeholder="https://example.com/video.mp4 or YouTube URL"
                  className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix focus:border-transparent"
                  required
                />
                {formData.videoType === 'youtube' && formData.videoUrl && (
                  <button
                    type="button"
                    onClick={async () => {
                      console.log('=== MANUAL FETCH TRIGGERED ===');
                      setYoutubeDataFetched(false);
                      
                      const videoId = getYouTubeId(formData.videoUrl);
                      console.log('Video ID:', videoId);
                      
                      if (!videoId) {
                        setShowInvalidUrlAlert(true);
                        return;
                      }
                      
                      const info = await fetchYouTubeInfo(formData.videoUrl);
                      console.log('Fetched info:', info);
                      
                      if (info) {
                        setFormData(prev => ({ 
                          ...prev, 
                          thumbnailUrl: info.thumbnail || prev.thumbnailUrl,
                          title: info.title || prev.title,
                          description: info.description || prev.description
                        }));
                        setYoutubeDataFetched(true);
                        
                        if (info.title && info.description) {
                          setFetchedInfo(info);
                          setShowFetchSuccessAlert(true);
                        } else {
                          setShowFetchPartialAlert(true);
                        }
                      } else {
                        setShowFetchErrorAlert(true);
                      }
                    }}
                    className="px-4 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition whitespace-nowrap flex items-center gap-2"
                  >
                    <Youtube className="w-4 h-4" />
                    Fetch Info
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Supports: Direct MP4, YouTube, DoodStream, StreamTape, MixDrop
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Download URL (Optional)</label>
              <input
                type="url"
                value={formData.downloadUrl}
                onChange={(e) => setFormData({...formData, downloadUrl: e.target.value})}
                placeholder="https://drive.google.com/... or https://mega.nz/..."
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-1">
                Link download terpisah (Google Drive, Mega, MediaFire, dll). Jika kosong, akan menggunakan Video URL.
              </p>
            </div>

            {/* Trailer URL - Only for Movies */}
            {formData.contentType === 'movie' && (
              <div>
                <label className="block text-sm font-medium mb-2">Trailer URL (Optional - YouTube Only)</label>
                <input
                  type="url"
                  value={formData.trailerUrl || ''}
                  onChange={(e) => setFormData({...formData, trailerUrl: e.target.value})}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix focus:border-transparent"
                />
                <p className="text-xs text-gray-400 mt-1">
                  🎬 Link trailer YouTube untuk ditampilkan di Featured section sebagai cuplikan. Video utama tetap diakses saat klik VideoCard.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Video Source Type *</label>
              <select
                value={formData.videoType}
                onChange={(e) => setFormData({...formData, videoType: e.target.value})}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix focus:border-transparent"
              >
                <option value="direct">Direct Video (MP4, WebM)</option>
                <option value="youtube">YouTube</option>
                <option value="doodstream">DoodStream</option>
                <option value="streamtape">StreamTape</option>
                <option value="mixdrop">MixDrop</option>
                <option value="other">Other Embed</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Select the video hosting platform you're using
              </p>
            </div>

            {formData.thumbnailUrl && (
              <div className="mb-4 rounded-lg overflow-hidden aspect-video bg-gray-700 relative group max-w-md">
                <img 
                  src={formData.thumbnailUrl} 
                  alt="Thumbnail"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                {formData.videoType !== 'youtube' && (
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, thumbnailUrl: ''})}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 p-2 rounded-full opacity-0 group-hover:opacity-100 transition"
                    title="Remove thumbnail"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            {formData.videoType !== 'youtube' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Upload from Device</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-netflix file:text-white file:cursor-pointer hover:file:bg-red-700"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Max size: 2MB | Recommended: 1280x720px | Auto-compressed
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t border-gray-600"></div>
                  <span className="text-sm text-gray-400">OR</span>
                  <div className="flex-1 border-t border-gray-600"></div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                Thumbnail URL {formData.videoType === 'youtube' && <span className="text-green-500">(Auto-filled from YouTube)</span>}
              </label>
              <input
                type="url"
                value={formData.thumbnailUrl.startsWith('data:') ? '' : formData.thumbnailUrl}
                onChange={(e) => setFormData({...formData, thumbnailUrl: e.target.value})}
                placeholder="https://example.com/thumbnail.jpg"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix focus:border-transparent"
                readOnly={formData.videoType === 'youtube'}
              />
              <p className="text-xs text-gray-400 mt-1">
                {formData.videoType === 'youtube' 
                  ? 'Thumbnail will be automatically fetched from YouTube' 
                  : 'Enter a URL for your video thumbnail'}
              </p>
            </div>
          </div>

          {/* Settings Card */}
          <div className="bg-gray-800 rounded-xl p-6 space-y-6">
            <h2 className="text-xl font-bold">Settings</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Platform Style *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix focus:border-transparent"
                >
                  <option value="youtube">YouTube Style (Short Content)</option>
                  <option value="netflix">Netflix Style (Movies/Series)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Content Type *</label>
                <select
                  value={formData.contentType}
                  onChange={(e) => {
                    const newContentType = e.target.value;
                    setFormData({
                      ...formData, 
                      contentType: newContentType,
                      type: newContentType === 'video' ? 'youtube' : 'netflix',
                      category: newContentType === 'video' ? 'vlog' : 'action',
                      isSeries: false,
                      isEpisode: false
                    });
                  }}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix focus:border-transparent"
                >
                  <option value="video">Video (YouTube Style)</option>
                  <option value="movie">Movie (Min 90 minutes)</option>
                  <option value="tvshow">TV Show (Series or Episode)</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  {formData.contentType === 'movie' && '🎬 Movies: Recommended 90+ minutes'}
                  {formData.contentType === 'tvshow' && '📺 TV Show: Create series or upload episodes'}
                  {formData.contentType === 'video' && '📹 Regular videos (any duration)'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {formData.contentType === 'video' ? 'Category *' : 'Primary Genre *'}
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix focus:border-transparent"
                >
                  {formData.contentType === 'video' ? (
                    <>
                      <option value="vlog">Vlog</option>
                      <option value="tutorial">Tutorial</option>
                      <option value="gaming">Gaming</option>
                      <option value="music">Music</option>
                      <option value="review">Review</option>
                      <option value="educational">Educational</option>
                      <option value="entertainment">Entertainment</option>
                      <option value="sports">Sports</option>
                      <option value="news">News</option>
                      <option value="other">Other</option>
                    </>
                  ) : (
                    <>
                      <option value="action">Action</option>
                      <option value="comedy">Comedy</option>
                      <option value="drama">Drama</option>
                      <option value="horror">Horror</option>
                      <option value="scifi">Sci-Fi</option>
                      <option value="romance">Romance</option>
                      <option value="thriller">Thriller</option>
                      <option value="animation">Animation</option>
                      <option value="documentary">Documentary</option>
                      <option value="fantasy">Fantasy</option>
                      <option value="crime">Crime</option>
                      <option value="adventure">Adventure</option>
                      <option value="mystery">Mystery</option>
                      <option value="family">Family</option>
                      <option value="other">Other</option>
                    </>
                  )}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  {formData.contentType === 'video' 
                    ? 'Pilih kategori untuk video YouTube-style' 
                    : 'Genre utama untuk movie/TV show'}
                </p>
              </div>

              {/* Multi-Genre Selection for Movies/TV Shows */}
              {(formData.contentType === 'movie' || formData.contentType === 'tvshow') && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Additional Genres (Optional)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {['action', 'comedy', 'drama', 'horror', 'scifi', 'romance', 'thriller', 'animation', 'documentary', 'fantasy', 'crime', 'adventure', 'mystery', 'family'].map(genre => (
                      <label
                        key={genre}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition ${
                          formData.genres.includes(genre)
                            ? 'bg-netflix text-white'
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.genres.includes(genre)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({...formData, genres: [...formData.genres, genre]});
                            } else {
                              setFormData({...formData, genres: formData.genres.filter(g => g !== genre)});
                            }
                          }}
                          className="hidden"
                        />
                        <span className="text-sm capitalize">{genre === 'scifi' ? 'Sci-Fi' : genre}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Pilih genre tambahan yang sesuai (akan ditampilkan di info video)
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Age Rating</label>
                <select
                  value={formData.ageRating}
                  onChange={(e) => setFormData({...formData, ageRating: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix focus:border-transparent"
                >
                  <option value="G">G - General Audiences</option>
                  <option value="PG">PG - Parental Guidance</option>
                  <option value="PG-13">PG-13 - Parents Strongly Cautioned</option>
                  <option value="R">R - Restricted</option>
                  <option value="18+">18+ - Adults Only</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Release Year</label>
                <input
                  type="number"
                  value={formData.releaseYear}
                  onChange={(e) => setFormData({...formData, releaseYear: parseInt(e.target.value)})}
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* TV Series Configuration */}
          {formData.contentType === 'tvshow' && (
            <div className="bg-gray-800 rounded-xl p-6 space-y-6 border-2 border-blue-600">
              <h2 className="text-xl font-bold flex items-center gap-2">
                📺 TV Series Configuration
              </h2>

              <div className="bg-blue-900/30 border border-blue-700 text-blue-100 p-4 rounded-lg text-sm">
                <p className="font-semibold mb-2">How TV Series Work:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>First, create a <strong>Main Series Entry</strong> (poster, description, info)</li>
                  <li>Then, upload <strong>Episodes</strong> linked to that series</li>
                  <li>Episodes are organized by Season and Episode Number</li>
                  <li>Viewers can browse episodes like Netflix</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">What are you uploading? *</label>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition">
                    <input
                      type="radio"
                      name="seriesType"
                      checked={formData.isSeries && !formData.isEpisode}
                      onChange={() => setFormData({
                        ...formData,
                        isSeries: true,
                        isEpisode: false,
                        seriesId: ''
                      })}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-semibold">Main Series Entry (Poster & Info)</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Create the main series page with poster, description, and total seasons/episodes info. No video file needed.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition">
                    <input
                      type="radio"
                      name="seriesType"
                      checked={!formData.isSeries && formData.isEpisode}
                      onChange={() => setFormData({
                        ...formData,
                        isSeries: false,
                        isEpisode: true
                      })}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-semibold">Episode (Actual Video)</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Upload an episode video linked to an existing series. Requires video URL.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Main Series Fields */}
              {formData.isSeries && !formData.isEpisode && (
                <div className="space-y-4 p-4 bg-gray-700/50 rounded-lg">
                  <h3 className="font-semibold text-green-400">Main Series Information</h3>
                  
                  <div className="bg-blue-900/30 border border-blue-700 text-blue-100 p-3 rounded text-xs mb-4">
                    <p><strong>Tip:</strong> Jika belum tahu total seasons/episodes, bisa diisi perkiraan dulu (misal: 1 season, 10 episodes). Nanti bisa diupdate setelah semua episode selesai diupload.</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Total Seasons (Perkiraan)</label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={formData.totalSeasons}
                        onChange={(e) => setFormData({...formData, totalSeasons: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix"
                        placeholder="Contoh: 1"
                      />
                      <p className="text-xs text-gray-400 mt-1">Isi 0 jika belum tahu</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Total Episodes (Perkiraan)</label>
                      <input
                        type="number"
                        min="0"
                        max="500"
                        value={formData.totalEpisodes}
                        onChange={(e) => setFormData({...formData, totalEpisodes: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix"
                        placeholder="Contoh: 10"
                      />
                      <p className="text-xs text-gray-400 mt-1">Isi 0 jika belum tahu</p>
                    </div>
                  </div>

                  <div className="bg-yellow-900/30 border border-yellow-700 text-yellow-100 p-3 rounded text-xs">
                    <p><strong>Video URL:</strong> Optional untuk main series entry. Bisa dikosongkan atau diisi dengan trailer series.</p>
                  </div>
                </div>
              )}

              {/* Episode Fields */}
              {!formData.isSeries && formData.isEpisode && (
                <div className="space-y-4 p-4 bg-gray-700/50 rounded-lg">
                  <h3 className="font-semibold text-blue-400">Episode Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Select Series *</label>
                    <select
                      value={formData.seriesId}
                      onChange={(e) => setFormData({...formData, seriesId: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix"
                      required
                    >
                      <option value="">-- Choose a series --</option>
                      {availableSeries.map(series => (
                        <option key={series._id} value={series._id}>
                          {series.title} ({series.totalSeasons} seasons, {series.totalEpisodes} episodes)
                        </option>
                      ))}
                    </select>
                    {availableSeries.length === 0 && (
                      <p className="text-xs text-orange-400 mt-2">
                        ⚠️ No series found. Please create a main series entry first.
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Season Number *</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={formData.seasonNumber}
                        onChange={(e) => setFormData({...formData, seasonNumber: parseInt(e.target.value) || 1})}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Episode Number *</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={formData.episodeNumber}
                        onChange={(e) => setFormData({...formData, episodeNumber: parseInt(e.target.value) || 1})}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix"
                        required
                      />
                    </div>
                  </div>

                  <div className="bg-blue-900/30 border border-blue-700 text-blue-100 p-3 rounded text-xs">
                    <p><strong>Tip:</strong> Episode title should be the episode name (e.g., "Pilot", "The One Where..."). The series name will be shown automatically.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button 
              type="submit"
              disabled={uploadLoading}
              className="flex-1 bg-netflix py-4 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploadLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <UploadIcon className="w-5 h-5" />
                  Upload Video
                </>
              )}
            </button>
            
            <button 
              type="button"
              onClick={() => navigate('/')}
              className="px-8 py-4 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Modals */}
      <AlertModal
        isOpen={showInvalidUrlAlert}
        onClose={() => setShowInvalidUrlAlert(false)}
        title="Invalid URL"
        message="Could not extract video ID from URL. Please check the URL format and try again."
        type="error"
      />

      <AlertModal
        isOpen={showFetchSuccessAlert}
        onClose={() => setShowFetchSuccessAlert(false)}
        title="YouTube Info Fetched"
        message={fetchedInfo ? `Successfully fetched video information!\n\nTitle: ${fetchedInfo.title?.substring(0, 50)}...\nDescription: ${fetchedInfo.description?.substring(0, 50)}...` : 'YouTube info fetched successfully!'}
        type="success"
      />

      <AlertModal
        isOpen={showFetchPartialAlert}
        onClose={() => setShowFetchPartialAlert(false)}
        title="Partial Data Fetched"
        message="Some YouTube information was fetched, but some data may not be available. Please fill in the missing fields manually."
        type="warning"
      />

      <AlertModal
        isOpen={showFetchErrorAlert}
        onClose={() => setShowFetchErrorAlert(false)}
        title="Fetch Failed"
        message="Failed to fetch YouTube information. Please try again or enter the information manually."
        type="error"
      />
    </div>
  );
}
