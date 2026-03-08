import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Shield, Send, ArrowLeft } from 'lucide-react';
import { AlertModal } from '../components/Modal';

export default function CreatorRequest() {
  const navigate = useNavigate();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!reason.trim()) {
      setError('Please provide a reason for your creator request');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/creator-request/request', 
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Show success and redirect
      setShowSuccessModal(true);
    } catch (error) {
      setError(error.response?.data?.message || 'Error submitting request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-20 min-h-screen bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <div className="bg-gray-800 rounded-xl p-8">
          <div className="w-20 h-20 bg-gradient-to-br from-netflix to-youtube rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10" />
          </div>

          <h1 className="text-3xl font-bold text-center mb-4">Request Creator Access</h1>
          <p className="text-gray-300 text-center mb-8">
            Tell us why you want to become a creator on StreamFlix
          </p>

          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-100 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Why do you want to become a creator? *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Tell us about your content plans, experience, and why you'd be a great creator on StreamFlix..."
                rows={6}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-netflix transition"
                required
              />
              <p className="text-xs text-gray-400 mt-2">
                Minimum 50 characters. Be specific about your content plans.
              </p>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="font-semibold mb-3 text-sm">What happens next?</h3>
              <ol className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-netflix font-bold">1.</span>
                  <span>Your request will be reviewed by our admin team</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-netflix font-bold">2.</span>
                  <span>Review typically takes 1-3 business days</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-netflix font-bold">3.</span>
                  <span>You'll be notified via email once reviewed</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-netflix font-bold">4.</span>
                  <span>If approved, you can start uploading immediately</span>
                </li>
              </ol>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-lg font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || reason.trim().length < 50}
                className="flex-1 bg-netflix hover:bg-red-700 py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Request
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal */}
      <AlertModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          navigate('/upload');
        }}
        title="Request Submitted"
        message="Creator request submitted successfully! You will be notified once reviewed by our admin team."
        type="success"
      />
    </div>
  );
}
