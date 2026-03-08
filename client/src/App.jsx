import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VideoPlayer from './pages/VideoPlayer';
import Channel from './pages/Channel';
import Upload from './pages/Upload';
import Profiles from './pages/Profiles';
import Browse from './pages/Browse';
import MyList from './pages/MyList';
import CreatorDashboard from './pages/CreatorDashboard';
import MyVideos from './pages/MyVideos';
import Search from './pages/Search';
import ChannelSettings from './pages/ChannelSettings';
import EditVideo from './pages/EditVideo';
import AdminDashboard from './pages/AdminDashboard';
import CreatorRequest from './pages/CreatorRequest';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  return user?.role === 'admin' ? children : <Navigate to="/" />;
}

function Layout() {
  const location = useLocation();
  const hideNavbar = ['/login', '/register'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-gray-900">
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/search" element={<Search />} />
        <Route path="/profiles" element={<PrivateRoute><Profiles /></PrivateRoute>} />
        <Route path="/my-list" element={<PrivateRoute><MyList /></PrivateRoute>} />
        <Route path="/watch/:id" element={<PrivateRoute><VideoPlayer /></PrivateRoute>} />
        <Route path="/channel/:id" element={<Channel />} />
        <Route path="/upload" element={<PrivateRoute><Upload /></PrivateRoute>} />
        <Route path="/edit-video/:id" element={<PrivateRoute><EditVideo /></PrivateRoute>} />
        <Route path="/creator-dashboard" element={<PrivateRoute><CreatorDashboard /></PrivateRoute>} />
        <Route path="/my-videos" element={<PrivateRoute><MyVideos /></PrivateRoute>} />
        <Route path="/channel-settings" element={<PrivateRoute><ChannelSettings /></PrivateRoute>} />
        <Route path="/creator-request" element={<PrivateRoute><CreatorRequest /></PrivateRoute>} />
        <Route path="/admin-dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
