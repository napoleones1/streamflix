import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Upload, Bell, User, ChevronDown, Home, Film, Video as VideoIcon, Tv, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch notifications
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const { data } = await axios.get('/api/notifications/unread-count', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const { data } = await axios.get('/api/notifications?limit=10', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUnreadCount();
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/notifications/mark-all-read', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUnreadCount();
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    await markAsRead(notification._id);
    setShowNotifications(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const formatNotificationTime = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now - notifDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notifDate.toLocaleDateString();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      scrolled ? 'bg-black' : 'bg-gradient-to-b from-black/80 to-transparent'
    }`}>
      <div className="max-w-[1920px] mx-auto px-4 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16 lg:h-[68px]">
          {/* Left Section */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <div className="text-3xl font-black tracking-tighter">
                <span className="text-netflix">STREAM</span>
                <span className="text-white">FLIX</span>
              </div>
            </Link>
            
            <div className="hidden lg:flex items-center space-x-6">
              <Link 
                to="/" 
                className={`text-sm font-medium transition ${
                  location.pathname === '/' ? 'text-white' : 'text-gray-300 hover:text-gray-200'
                }`}
              >
                Home
              </Link>
              <Link 
                to="/browse?type=netflix&contentType=movie" 
                className="text-sm font-medium text-gray-300 hover:text-gray-200 transition"
              >
                Movies
              </Link>
              <Link 
                to="/browse?type=netflix&contentType=tvshow" 
                className="text-sm font-medium text-gray-300 hover:text-gray-200 transition"
              >
                TV Shows
              </Link>
              <Link 
                to="/browse?type=youtube" 
                className="text-sm font-medium text-gray-300 hover:text-gray-200 transition"
              >
                Videos
              </Link>
              <Link 
                to="/my-list" 
                className="text-sm font-medium text-gray-300 hover:text-gray-200 transition"
              >
                My List
              </Link>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4 lg:space-x-6">
            {/* Search */}
            <div className="relative">
              {showSearch ? (
                <form onSubmit={handleSearch} className="flex items-center">
                  <input
                    type="text"
                    placeholder="Titles, people, genres"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onBlur={() => !searchQuery && setTimeout(() => setShowSearch(false), 200)}
                    autoFocus
                    className="bg-black border border-white text-white px-4 py-1.5 w-64 focus:outline-none"
                  />
                  <button type="submit" className="absolute right-2">
                    <Search className="w-5 h-5 text-white" />
                  </button>
                </form>
              ) : (
                <button 
                  onClick={() => setShowSearch(true)}
                  className="hover:text-gray-300 transition"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}
            </div>

            {user ? (
              <>
                <Link to="/upload" className="hidden md:block hover:text-gray-300 transition" title="Upload Video">
                  <Upload className="w-5 h-5" />
                </Link>
                
                {/* Notifications */}
                <div className="relative">
                  <button 
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      if (!showNotifications) fetchNotifications();
                    }}
                    className="hover:text-gray-300 transition relative" 
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-netflix text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-semibold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-96 bg-black/95 border border-gray-700 rounded shadow-xl max-h-[500px] overflow-y-auto z-50">
                      <div className="p-3 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-black/95">
                        <h3 className="font-semibold">Notifications</h3>
                        {notifications.length > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-blue-400 hover:text-blue-300"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                      
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                          <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No notifications yet</p>
                        </div>
                      ) : (
                        <div>
                          {notifications.map(notif => (
                            <button
                              key={notif._id}
                              onClick={() => handleNotificationClick(notif)}
                              className={`w-full p-3 hover:bg-gray-800 transition text-left border-b border-gray-800 ${
                                !notif.read ? 'bg-gray-900/50' : ''
                              }`}
                            >
                              <div className="flex gap-3">
                                {notif.sender?.avatar ? (
                                  <img
                                    src={notif.sender.avatar}
                                    alt={notif.sender.username}
                                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-netflix to-youtube flex items-center justify-center flex-shrink-0">
                                    <span className="text-sm font-bold">
                                      {notif.sender?.username?.[0]?.toUpperCase() || 'N'}
                                    </span>
                                  </div>
                                )}
                                
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm line-clamp-2">{notif.message}</p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {formatNotificationTime(notif.createdAt)}
                                  </p>
                                </div>
                                
                                {!notif.read && (
                                  <div className="w-2 h-2 bg-netflix rounded-full flex-shrink-0 mt-2"></div>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setShowProfile(!showProfile)}
                    className="flex items-center space-x-2 hover:text-gray-300 transition"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-netflix to-youtube rounded overflow-hidden flex items-center justify-center">
                      <User className="w-5 h-5" />
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showProfile ? 'rotate-180' : ''}`} />
                  </button>

                  {showProfile && (
                    <div className="absolute right-0 mt-2 w-56 bg-black/95 border border-gray-700 rounded shadow-xl">
                      <div className="p-3 border-b border-gray-700">
                        <p className="text-sm font-semibold">{user.username}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                      <Link 
                        to="/profiles" 
                        className="block px-4 py-2 text-sm hover:bg-gray-800 transition"
                        onClick={() => setShowProfile(false)}
                      >
                        Manage Profiles
                      </Link>
                      <Link 
                        to="/creator-dashboard" 
                        className="block px-4 py-2 text-sm hover:bg-gray-800 transition"
                        onClick={() => setShowProfile(false)}
                      >
                        Creator Dashboard
                      </Link>
                      {user.role === 'admin' && (
                        <Link 
                          to="/admin-dashboard" 
                          className="block px-4 py-2 text-sm hover:bg-gray-800 transition text-yellow-400"
                          onClick={() => setShowProfile(false)}
                        >
                          Admin Dashboard
                        </Link>
                      )}
                      <Link 
                        to="/my-list" 
                        className="block px-4 py-2 text-sm hover:bg-gray-800 transition"
                        onClick={() => setShowProfile(false)}
                      >
                        My List
                      </Link>
                      <Link 
                        to="/upload" 
                        className="block px-4 py-2 text-sm hover:bg-gray-800 transition md:hidden"
                        onClick={() => setShowProfile(false)}
                      >
                        Upload Video
                      </Link>
                      <div className="border-t border-gray-700">
                        <button 
                          onClick={() => { logout(); setShowProfile(false); }}
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-800 transition"
                        >
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link to="/login" className="bg-netflix px-6 py-1.5 rounded text-sm font-medium hover:bg-red-700 transition">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
