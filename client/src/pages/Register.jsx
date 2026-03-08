import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Check } from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const passwordStrength = () => {
    if (password.length === 0) return { strength: 0, text: '', color: '' };
    if (password.length < 6) return { strength: 1, text: 'Weak', color: 'bg-red-500' };
    if (password.length < 10) return { strength: 2, text: 'Medium', color: 'bg-yellow-500' };
    return { strength: 3, text: 'Strong', color: 'bg-green-500' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    
    try {
      await register(email, password, username);
      navigate('/profiles');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const strength = passwordStrength();

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

      {/* Register Form */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-black/75 backdrop-blur-md p-12 rounded-lg">
          <h1 className="text-3xl font-bold mb-2">Create Account</h1>
          <p className="text-gray-400 mb-8">Join millions of users on StreamFlix</p>
          
          {error && (
            <div className="bg-orange-600 text-white p-3 rounded mb-6 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-5 py-4 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                required
                minLength={3}
              />
              <p className="text-xs text-gray-400 mt-1">This will be your unique username</p>
            </div>

            <div>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded ${
                          level <= strength.strength ? strength.color : 'bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400">
                    Password strength: <span className={strength.strength >= 2 ? 'text-green-500' : 'text-yellow-500'}>{strength.text}</span>
                  </p>
                </div>
              )}
            </div>
            
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-netflix py-4 rounded font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>

            <div className="space-y-2 text-xs text-gray-400">
              <label className="flex items-start gap-2">
                <input type="checkbox" className="mt-0.5" required />
                <span>I agree to the Terms of Service and Privacy Policy</span>
              </label>
              <label className="flex items-start gap-2">
                <input type="checkbox" className="mt-0.5" />
                <span>Send me promotional emails and updates</span>
              </label>
            </div>
          </form>
          
          <div className="mt-8 text-gray-400">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="text-white hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-300">
            <Check className="w-5 h-5 text-green-500" />
            <span>Unlimited streaming</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Check className="w-5 h-5 text-green-500" />
            <span>HD quality</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Check className="w-5 h-5 text-green-500" />
            <span>Multiple profiles</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Check className="w-5 h-5 text-green-500" />
            <span>Upload videos</span>
          </div>
        </div>
      </div>
    </div>
  );
}
