import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Film, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 bg-black">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=1920&q=80"
          alt="Background"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      </div>

      {/* Logo */}
      <Link to="/" className="absolute top-8 left-8 z-10 flex items-center space-x-2">
        <div className="text-3xl font-black tracking-tighter">
          <span className="text-netflix">STREAM</span>
          <span className="text-white">FLIX</span>
        </div>
      </Link>

      {/* Login Form */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-black/75 backdrop-blur-md p-12 rounded-lg">
          <h1 className="text-3xl font-bold mb-8">Sign In</h1>
          
          {error && (
            <div className="bg-orange-600 text-white p-3 rounded mb-6 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="email"
                placeholder="Email or phone number"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                required
              />
            </div>
            
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-netflix py-4 rounded font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4" />
                <span className="text-gray-300">Remember me</span>
              </label>
              <a href="#" className="text-gray-300 hover:underline">
                Need help?
              </a>
            </div>
          </form>
          
          <div className="mt-16 text-gray-400">
            <p>
              New to StreamFlix?{' '}
              <Link to="/register" className="text-white hover:underline font-medium">
                Sign up now
              </Link>
            </p>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            This page is protected by reCAPTCHA and the Google{' '}
            <a href="#" className="text-blue-500 hover:underline">Privacy Policy</a> and{' '}
            <a href="#" className="text-blue-500 hover:underline">Terms of Service</a> apply.
          </p>
        </div>
      </div>
    </div>
  );
}
