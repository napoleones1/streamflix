import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Save, Image as ImageIcon, X } from 'lucide-react';

export default function ChannelSettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    channelName: '',
    channelDescription: '',
    channelBanner: '',
    avatar: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchChannelData();
  }, []);

  const fetchChannelData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const { data } = await axios.get('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setFormData({
        channelName: data.channelName || '',
        channelDescription: data.channelDescription || '',
        channelBanner: data.channelBanner || '',
        avatar: data.avatar || ''
      });
    } catch (error) {
      console.error('Error fetching channel data:', error);
    }
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Harap upload file gambar (JPG, PNG, GIF)');
      return;
    }

    // Validate file size (max 2MB for better performance)
    if (file.size > 2 * 1024 * 1024) {
      setError('Ukuran gambar harus kurang dari 2MB');
      return;
    }

    setError('');

    try {
      // Compress and convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Resize if too large
          const maxWidth = type === 'banner' ? 1200 : 512;
          const maxHeight = type === 'banner' ? 200 : 512;
          
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = width * ratio;
            height = height * ratio;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with compression
          const base64String = canvas.toDataURL('image/jpeg', 0.8);
          
          if (type === 'banner') {
            setFormData({ ...formData, channelBanner: base64String });
          } else {
            setFormData({ ...formData, avatar: base64String });
          }
        };
        img.onerror = () => {
          setError('Error memproses gambar');
        };
        img.src = reader.result;
      };
      reader.onerror = () => {
        setError('Error membaca file');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setError('Error mengupload gambar');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // Validate data size
      const dataSize = JSON.stringify(formData).length;
      if (dataSize > 10 * 1024 * 1024) { // 10MB limit
        setError('Data terlalu besar. Gunakan gambar yang lebih kecil.');
        setLoading(false);
        return;
      }
      
      await axios.put('/api/users/channel', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setSuccess('Channel berhasil diupdate!');
      setTimeout(() => {
        navigate('/creator-dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error updating channel:', error);
      setError(error.response?.data?.error || 'Error mengupdate channel. Coba gunakan gambar yang lebih kecil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-20 px-4 sm:px-8 lg:px-16 min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">Channel Customization</h1>
          <p className="text-gray-400">Customize your channel appearance</p>
        </div>

        {error && (
          <div className="bg-red-600 text-white p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-600 text-white p-4 rounded-lg mb-6">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Channel Banner */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <ImageIcon className="w-6 h-6" />
              Channel Banner
            </h2>
            
            {formData.channelBanner && (
              <div className="mb-4 rounded-lg overflow-hidden aspect-[6/1] bg-gray-700 relative group">
                <img 
                  src={formData.channelBanner} 
                  alt="Channel Banner"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/1200x200/1a1a1a/666666?text=Channel+Banner';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setFormData({...formData, channelBanner: ''})}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 p-2 rounded-full opacity-0 group-hover:opacity-100 transition"
                  title="Remove banner"
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
                  onChange={(e) => handleFileUpload(e, 'banner')}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-netflix file:text-white file:cursor-pointer hover:file:bg-red-700"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Max size: 2MB | Recommended: 1200x200px | Auto-compressed
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-gray-600"></div>
                <span className="text-sm text-gray-400">OR</span>
                <div className="flex-1 border-t border-gray-600"></div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Banner URL</label>
                <input
                  type="url"
                  value={formData.channelBanner.startsWith('data:') ? '' : formData.channelBanner}
                  onChange={(e) => setFormData({...formData, channelBanner: e.target.value})}
                  placeholder="https://example.com/banner.jpg"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix"
                />
              </div>
            </div>
          </div>

          {/* Avatar */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Channel Avatar</h2>
            
            {formData.avatar && (
              <div className="mb-4 flex justify-center relative">
                <div className="relative group">
                  <img 
                    src={formData.avatar} 
                    alt="Avatar"
                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-700"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/128/1a1a1a/666666?text=Avatar';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, avatar: ''})}
                    className="absolute top-0 right-0 bg-red-600 hover:bg-red-700 p-2 rounded-full opacity-0 group-hover:opacity-100 transition"
                    title="Remove avatar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2">Upload from Device</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'avatar')}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-netflix file:text-white file:cursor-pointer hover:file:bg-red-700"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Max size: 2MB | Recommended: 256x256px | Auto-compressed
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-gray-600"></div>
                <span className="text-sm text-gray-400">OR</span>
                <div className="flex-1 border-t border-gray-600"></div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Avatar URL</label>
                <input
                  type="url"
                  value={formData.avatar.startsWith('data:') ? '' : formData.avatar}
                  onChange={(e) => setFormData({...formData, avatar: e.target.value})}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix"
                />
              </div>
            </div>
          </div>

          {/* Channel Info */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Channel Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Channel Name *</label>
                <input
                  type="text"
                  value={formData.channelName}
                  onChange={(e) => setFormData({...formData, channelName: e.target.value})}
                  placeholder="Your Channel Name"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Channel Description</label>
                <textarea
                  value={formData.channelDescription}
                  onChange={(e) => setFormData({...formData, channelDescription: e.target.value})}
                  placeholder="Tell viewers about your channel..."
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix h-32 resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {formData.channelDescription.length} / 1000 characters
                </p>
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
              onClick={() => navigate('/creator-dashboard')}
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
