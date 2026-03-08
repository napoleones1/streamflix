import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Save, Film, Image, X, AlertCircle, ArrowLeft } from 'lucide-react';

export default function EditVideo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnailUrl: '',
    downloadUrl: '', // Add download URL field
    trailerUrl: '', // Add trailer URL field (for movies only)
    tags: '',
    ageRating: 'PG-13',
    releaseYear: new Date().getFullYear(),
    category: 'vlog',
    genres: [], // Multiple genres for movies/TV
    contentType: 'video'
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchVideo();
  }, [id]);

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

  const fetchVideo = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const { data } = await axios.get(`/api/videos/${id}`);
      
      // Check if user is the creator
      const userResponse = await axios.get('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (data.creator._id !== userResponse.data._id) {
        setError('You are not authorized to edit this video');
        setTimeout(() => navigate('/my-videos'), 2000);
        return;
      }

      setFormData({
        title: data.title || '',
        description: data.description || '',
        thumbnailUrl: data.thumbnailUrl || '',
        downloadUrl: data.downloadUrl || '', // Add download URL
        trailerUrl: data.trailerUrl || '', // Add trailer URL
        tags: data.tags?.join(', ') || '',
        ageRating: data.ageRating || 'PG-13',
        releaseYear: data.releaseYear || new Date().getFullYear(),
        category: data.category || 'vlog',
        genres: data.genres || [],
        contentType: data.contentType || 'video'
      });
      
      setFetchLoading(false);
    } catch (error) {
      console.error('Error fetching video:', error);
      setError('Error loading video data');
      setFetchLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const dataToSend = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };
      
      console.log('Sending update data:', {
        ...dataToSend,
        thumbnailUrl: dataToSend.thumbnailUrl?.substring(0, 50) + '...' // Log first 50 chars
      });
      
      const response = await axios.put(`/api/videos/${id}`, dataToSend, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Update response:', response.data);
      setSuccess('Video updated successfully!');
      
      // Refresh video data to show updated thumbnail
      await fetchVideo();
      
      setTimeout(() => {
        navigate('/my-videos');
      }, 2000);
    } catch (error) {
      console.error('Update error:', error);
      setError(error.response?.data?.error || 'Error updating video');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="pt-20 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-netflix"></div>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={() => navigate('/my-videos')}
            className="p-2 hover:bg-gray-800 rounded-lg transition"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold mb-2">Edit Video</h1>
            <p className="text-gray-400">Update your video information</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-600 text-white p-4 rounded-lg mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold mb-1">Error</p>
              <p className="text-sm">{error}</p>
            </div>
            <button onClick={() => setError('')}>
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-600 text-white p-4 rounded-lg mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold mb-1">Success</p>
              <p className="text-sm">{success}</p>
            </div>
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
              <label className="block text-sm font-medium mb-2">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Enter video title"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Tell viewers about your video"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix focus:border-transparent h-32 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                {formData.description.length} / 5000 characters
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

          {/* Thumbnail Card */}
          <div className="bg-gray-800 rounded-xl p-6 space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Image className="w-6 h-6 text-youtube" />
              Thumbnail
            </h2>

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
                <button
                  type="button"
                  onClick={() => setFormData({...formData, thumbnailUrl: ''})}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 p-2 rounded-full opacity-0 group-hover:opacity-100 transition"
                  title="Remove thumbnail"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

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

              <div>
                <label className="block text-sm font-medium mb-2">Thumbnail URL</label>
                <input
                  type="url"
                  value={formData.thumbnailUrl.startsWith('data:') ? '' : formData.thumbnailUrl}
                  onChange={(e) => setFormData({...formData, thumbnailUrl: e.target.value})}
                  placeholder="https://example.com/thumbnail.jpg"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix focus:border-transparent"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Enter a URL for your video thumbnail
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
                  Link download terpisah (Google Drive, Mega, dll). Kosongkan jika tidak ada.
                </p>
              </div>

              {/* Trailer URL - Only for Movies */}
              {formData.contentType === 'movie' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Trailer URL (Optional - YouTube Only)</label>
                  <input
                    type="url"
                    value={formData.trailerUrl}
                    onChange={(e) => setFormData({...formData, trailerUrl: e.target.value})}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix focus:border-transparent"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    🎬 Link trailer YouTube untuk ditampilkan di Featured section sebagai cuplikan.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Settings Card */}
          <div className="bg-gray-800 rounded-xl p-6 space-y-6">
            <h2 className="text-xl font-bold">Settings</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    ? 'Kategori untuk video YouTube-style' 
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

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 bg-netflix py-4 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
            
            <button 
              type="button"
              onClick={() => navigate('/my-videos')}
              className="px-8 py-4 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
