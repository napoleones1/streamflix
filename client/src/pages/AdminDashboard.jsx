import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Users, Video, CheckCircle, Eye, MessageCircle, Shield, Trash2, Search, UserPlus } from 'lucide-react';
import { ConfirmModal, PromptModal, AlertModal } from '../components/Modal';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [videos, setVideos] = useState([]);
  const [creatorRequests, setCreatorRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [showApproveSuccess, setShowApproveSuccess] = useState(false);
  const [showApproveError, setShowApproveError] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showRejectSuccess, setShowRejectSuccess] = useState(false);
  const [showRejectError, setShowRejectError] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showRoleSuccess, setShowRoleSuccess] = useState(false);
  const [showRoleError, setShowRoleError] = useState(false);
  const [showVerifyError, setShowVerifyError] = useState(false);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [showDeleteUserError, setShowDeleteUserError] = useState(false);
  const [showDeleteVideoModal, setShowDeleteVideoModal] = useState(false);
  const [showDeleteVideoError, setShowDeleteVideoError] = useState(false);
  
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserRole, setSelectedUserRole] = useState(null);
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [newRole, setNewRole] = useState('');

  useEffect(() => {
    checkAdminAccess();
    fetchStats();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'videos') fetchVideos();
    if (activeTab === 'requests') fetchCreatorRequests();
  }, [activeTab]);

  const checkAdminAccess = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const { data } = await axios.get('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.role !== 'admin') {
        setShowAccessDenied(true);
        setTimeout(() => navigate('/'), 2000);
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/login');
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`/api/admin/users?search=${searchQuery}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchVideos = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`/api/admin/videos?search=${searchQuery}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVideos(data.videos);
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  const fetchCreatorRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('/api/creator-request/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCreatorRequests(data);
    } catch (error) {
      console.error('Error fetching creator requests:', error);
    }
  };

  const approveCreatorRequest = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/creator-request/approve/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowApproveSuccess(true);
      fetchCreatorRequests();
      fetchStats();
    } catch (error) {
      console.error('Error approving request:', error);
      setShowApproveError(true);
    }
  };

  const rejectCreatorRequest = async (reason) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/creator-request/reject/${selectedUserId}`, 
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowRejectSuccess(true);
      fetchCreatorRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      setShowRejectError(true);
    }
  };

  const changeUserRole = async (roleValue) => {
    const roles = ['user', 'creator', 'admin'];
    const roleIndex = parseInt(roleValue) - 1;
    
    if (roleIndex < 0 || roleIndex >= roles.length) {
      return;
    }
    
    const role = roles[roleIndex];
    if (role === selectedUserRole) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/admin/users/${selectedUserId}/role`, 
        { role },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewRole(role);
      setShowRoleSuccess(true);
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error('Error changing role:', error);
      setShowRoleError(true);
    }
  };

  const toggleVerified = async (userId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/admin/users/${userId}/verify`, 
        { isVerified: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error('Error toggling verified:', error);
      setShowVerifyError(true);
    }
  };

  const deleteUser = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/users/${selectedUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error('Error deleting user:', error);
      setShowDeleteUserError(true);
    }
  };

  const deleteVideo = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/videos/${selectedVideoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchVideos();
      fetchStats();
    } catch (error) {
      console.error('Error deleting video:', error);
      setShowDeleteVideoError(true);
    }
  };

  if (loading) {
    return (
      <div className="pt-20 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-netflix"></div>
      </div>
    );
  }

  return (
    <div className="pt-20 px-4 sm:px-8 lg:px-16 min-h-screen bg-gray-900">
      <div className="max-w-[1920px] mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-netflix" />
            <h1 className="text-3xl lg:text-4xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-gray-400">Manage users, videos, and platform settings</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-gray-800 p-6 rounded-xl">
              <Users className="w-8 h-8 text-blue-500 mb-2" />
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
              <p className="text-sm text-gray-400">Total Users</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-xl">
              <Users className="w-8 h-8 text-green-500 mb-2" />
              <p className="text-2xl font-bold">{stats.totalCreators}</p>
              <p className="text-sm text-gray-400">Creators</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-xl">
              <CheckCircle className="w-8 h-8 text-netflix mb-2" />
              <p className="text-2xl font-bold">{stats.verifiedCreators}</p>
              <p className="text-sm text-gray-400">Verified</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-xl">
              <Video className="w-8 h-8 text-purple-500 mb-2" />
              <p className="text-2xl font-bold">{stats.totalVideos}</p>
              <p className="text-sm text-gray-400">Videos</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-xl">
              <Eye className="w-8 h-8 text-yellow-500 mb-2" />
              <p className="text-2xl font-bold">{(stats.totalViews / 1000).toFixed(1)}K</p>
              <p className="text-sm text-gray-400">Total Views</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-xl">
              <MessageCircle className="w-8 h-8 text-pink-500 mb-2" />
              <p className="text-2xl font-bold">{stats.totalComments}</p>
              <p className="text-sm text-gray-400">Comments</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap ${
              activeTab === 'overview' ? 'bg-netflix text-white' : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap relative ${
              activeTab === 'requests' ? 'bg-netflix text-white' : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            Creator Requests
            {creatorRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {creatorRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap ${
              activeTab === 'users' ? 'bg-netflix text-white' : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap ${
              activeTab === 'videos' ? 'bg-netflix text-white' : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            Videos
          </button>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Platform Overview</h2>
            <p className="text-gray-400">
              Welcome to the admin dashboard. Use the tabs above to manage users and videos.
            </p>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Manage Users</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && fetchUsers()}
                  className="pl-10 pr-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4">User</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-left py-3 px-4">Role</th>
                    <th className="text-left py-3 px-4">Creator</th>
                    <th className="text-left py-3 px-4">Verified</th>
                    <th className="text-left py-3 px-4">Subscribers</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id} className="border-b border-gray-700 hover:bg-gray-700/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-netflix to-youtube flex items-center justify-center text-sm font-bold">
                              {user.username[0].toUpperCase()}
                            </div>
                          )}
                          <span className="font-medium">{user.username}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-400">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          user.role === 'admin' 
                            ? 'bg-red-900 text-red-200' 
                            : user.role === 'creator'
                            ? 'bg-purple-900 text-purple-200'
                            : 'bg-gray-700 text-gray-300'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {user.isCreator ? (
                          <span className="text-green-500">✓</span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => toggleVerified(user._id, user.isVerified)}
                          className={`px-3 py-1 rounded text-xs ${
                            user.isVerified 
                              ? 'bg-blue-900 text-blue-200' 
                              : 'bg-gray-700 hover:bg-gray-600'
                          }`}
                        >
                          {user.isVerified ? 'Verified' : 'Verify'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-gray-400">{user.subscribers?.length || 0}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => {
                            setSelectedUserId(user._id);
                            setSelectedUserRole(user.role);
                            setShowRoleModal(true);
                          }}
                          className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition mr-2"
                          title="Change role"
                        >
                          Change Role
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUserId(user._id);
                            setShowDeleteUserModal(true);
                          }}
                          className="p-2 hover:bg-red-900/50 rounded transition"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'videos' && (
          <div className="bg-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Manage Videos</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search videos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && fetchVideos()}
                  className="pl-10 pr-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map(video => (
                <div key={video._id} className="bg-gray-700 rounded-lg overflow-hidden">
                  <img 
                    src={video.thumbnailUrl} 
                    alt={video.title}
                    className="w-full aspect-video object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold line-clamp-2 mb-2">{video.title}</h3>
                    <p className="text-sm text-gray-400 mb-2">
                      by {video.creator?.channelName || video.creator?.username}
                      {video.creator?.isVerified && (
                        <CheckCircle className="inline w-4 h-4 text-blue-500 ml-1" />
                      )}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{video.views} views</span>
                      <button
                        onClick={() => {
                          setSelectedVideoId(video._id);
                          setShowDeleteVideoModal(true);
                        }}
                        className="p-2 hover:bg-red-900/50 rounded transition"
                        title="Delete video"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Creator Requests Tab */}
        {activeTab === 'requests' && (
          <div className="bg-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <UserPlus className="w-6 h-6 text-yellow-500" />
                Pending Creator Requests
              </h2>
              <span className="text-sm text-gray-400">
                {creatorRequests.length} pending
              </span>
            </div>

            {creatorRequests.length === 0 ? (
              <div className="text-center py-12">
                <UserPlus className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No pending creator requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {creatorRequests.map(request => (
                  <div key={request._id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      {request.avatar ? (
                        <img
                          src={request.avatar}
                          alt={request.username}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-netflix to-youtube flex items-center justify-center text-xl font-bold">
                          {request.username?.[0]?.toUpperCase()}
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{request.username}</h3>
                          <span className="text-xs bg-yellow-900/50 text-yellow-300 px-2 py-0.5 rounded">
                            Pending
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mb-2">{request.email}</p>
                        
                        {request.channelName && (
                          <p className="text-sm text-gray-300 mb-2">
                            Channel: {request.channelName}
                          </p>
                        )}

                        <div className="bg-gray-800 rounded p-3 mb-3">
                          <p className="text-xs text-gray-400 mb-1">Reason:</p>
                          <p className="text-sm">{request.creatorRequest.reason}</p>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span>Requested: {new Date(request.creatorRequest.requestedAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>Member since: {new Date(request.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => approveCreatorRequest(request._id)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-medium text-sm transition flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUserId(request._id);
                            setShowRejectModal(true);
                          }}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-medium text-sm transition flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <AlertModal
        isOpen={showAccessDenied}
        onClose={() => setShowAccessDenied(false)}
        title="Access Denied"
        message="You don't have permission to access the admin dashboard. Admin access only."
        type="error"
      />

      <AlertModal
        isOpen={showApproveSuccess}
        onClose={() => setShowApproveSuccess(false)}
        title="Request Approved"
        message="Creator request has been approved successfully!"
        type="success"
      />

      <AlertModal
        isOpen={showApproveError}
        onClose={() => setShowApproveError(false)}
        title="Approval Failed"
        message="Failed to approve creator request. Please try again."
        type="error"
      />

      <PromptModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onSubmit={(reason) => rejectCreatorRequest(reason || 'No reason provided')}
        title="Reject Creator Request"
        message="Enter rejection reason (optional):"
        placeholder="Reason for rejection..."
      />

      <AlertModal
        isOpen={showRejectSuccess}
        onClose={() => setShowRejectSuccess(false)}
        title="Request Rejected"
        message="Creator request has been rejected."
        type="warning"
      />

      <AlertModal
        isOpen={showRejectError}
        onClose={() => setShowRejectError(false)}
        title="Rejection Failed"
        message="Failed to reject creator request. Please try again."
        type="error"
      />

      <PromptModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        onSubmit={changeUserRole}
        title="Change User Role"
        message={`Select new role (Current: ${selectedUserRole}):`}
        options={[
          { value: '1', label: 'User', description: 'Regular user with basic permissions' },
          { value: '2', label: 'Creator', description: 'Can upload and manage videos' },
          { value: '3', label: 'Admin', description: 'Full platform access and management' }
        ]}
      />

      <AlertModal
        isOpen={showRoleSuccess}
        onClose={() => setShowRoleSuccess(false)}
        title="Role Changed"
        message={`User role has been changed to ${newRole} successfully!`}
        type="success"
      />

      <AlertModal
        isOpen={showRoleError}
        onClose={() => setShowRoleError(false)}
        title="Role Change Failed"
        message="Failed to change user role. Please try again."
        type="error"
      />

      <AlertModal
        isOpen={showVerifyError}
        onClose={() => setShowVerifyError(false)}
        title="Verification Failed"
        message="Failed to update verification status. Please try again."
        type="error"
      />

      <ConfirmModal
        isOpen={showDeleteUserModal}
        onClose={() => setShowDeleteUserModal(false)}
        onConfirm={deleteUser}
        title="Delete User"
        message="Are you sure you want to delete this user? This will also delete all their videos. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      <AlertModal
        isOpen={showDeleteUserError}
        onClose={() => setShowDeleteUserError(false)}
        title="Delete Failed"
        message="Failed to delete user. Please try again."
        type="error"
      />

      <ConfirmModal
        isOpen={showDeleteVideoModal}
        onClose={() => setShowDeleteVideoModal(false)}
        onConfirm={deleteVideo}
        title="Delete Video"
        message="Are you sure you want to delete this video? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      <AlertModal
        isOpen={showDeleteVideoError}
        onClose={() => setShowDeleteVideoError(false)}
        title="Delete Failed"
        message="Failed to delete video. Please try again."
        type="error"
      />
    </div>
  );
}
