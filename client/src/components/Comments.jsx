import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ThumbsUp, Trash2, Send } from 'lucide-react';
import { ConfirmModal, AlertModal } from './Modal';

export default function Comments({ videoId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  // Modal states
  const [showLoginAlert, setShowLoginAlert] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState(null);

  useEffect(() => {
    fetchComments();
  }, [videoId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/videos/${videoId}/comments`);
      setComments(data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
      setShowLoginAlert(true);
      return;
    }

    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const { data } = await axios.post(
        `/api/videos/${videoId}/comments`,
        { text: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setComments([data, ...comments]);
      setNewComment('');
    } catch (error) {
      console.error('Error posting comment:', error);
      if (error.response?.status === 401) {
        setShowLoginAlert(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await axios.delete(`/api/videos/${videoId}/comments/${selectedCommentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setComments(comments.filter(c => c._id !== selectedCommentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleLike = async (commentId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setShowLoginAlert(true);
      return;
    }

    try {
      const { data } = await axios.post(
        `/api/videos/${videoId}/comments/${commentId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setComments(comments.map(c => c._id === commentId ? data : c));
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const formatDate = (date) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffMs = now - commentDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return commentDate.toLocaleDateString();
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6">
        {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
      </h2>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-netflix to-youtube flex items-center justify-center text-lg font-bold flex-shrink-0">
            U
          </div>
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-netflix resize-none"
              rows="3"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setNewComment('')}
                className="px-4 py-2 text-sm font-semibold hover:bg-gray-700 rounded transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newComment.trim() || submitting}
                className="px-6 py-2 bg-netflix text-sm font-semibold rounded hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Posting...' : 'Comment'}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Comments List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-netflix"></div>
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-6">
          {comments.map(comment => (
            <div key={comment._id} className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-netflix to-youtube flex items-center justify-center text-lg font-bold flex-shrink-0">
                {comment.user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{comment.user?.username || 'Anonymous'}</span>
                  <span className="text-sm text-gray-400">{formatDate(comment.createdAt)}</span>
                </div>
                <p className="text-gray-200 mb-2 whitespace-pre-wrap">{comment.text}</p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleLike(comment._id)}
                    className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>{comment.likes?.length || 0}</span>
                  </button>
                  {comment.user?._id === localStorage.getItem('userId') && (
                    <button
                      onClick={() => {
                        setSelectedCommentId(comment._id);
                        setShowDeleteModal(true);
                      }}
                      className="flex items-center gap-1 text-sm text-gray-400 hover:text-red-500 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <p>No comments yet. Be the first to comment!</p>
        </div>
      )}

      {/* Modals */}
      <AlertModal
        isOpen={showLoginAlert}
        onClose={() => {
          setShowLoginAlert(false);
          navigate('/login');
        }}
        title="Login Required"
        message="Please login to comment and interact with videos."
        type="warning"
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
