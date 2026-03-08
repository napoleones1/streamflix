# 🎬 StreamFlix - Netflix + YouTube Clone

A full-stack streaming platform combining Netflix-style movies/series with YouTube-style video content.

![StreamFlix](https://img.shields.io/badge/version-1.3.1-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🌟 Features

### Core Features
- 🎥 **Dual Platform Style**: Netflix (Movies/Series) + YouTube (Videos)
- 📺 **TV Series & Episodes**: Upload series with multiple seasons and episodes
- 🎬 **Movie Trailers**: Add YouTube trailer URLs for movies (Featured section preview)
- 👤 **User Profiles**: Multiple profiles per account (Netflix-style)
- 🎨 **Creator Channels**: Customizable channels with banners and descriptions
- ✅ **Verified Badges**: Admin and Verified Creator badges
- 💬 **Comments System**: Like, reply, and interact with content
- 📊 **Creator Dashboard**: Analytics, views, likes, and subscriber stats
- 🔔 **Notifications**: Real-time notifications for likes, comments, and subscriptions
- 📥 **Download Videos**: Separate download URLs for each video
- 🔍 **Advanced Search**: Search by title, description, tags, and genres
- 🎭 **Multi-Genre Support**: Multiple genres for movies and TV shows
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile

### User Features
- 🔐 User authentication (Register/Login)
- 👥 Multiple profiles per account
- 📝 My List (Save videos to watch later)
- ⏯️ Continue Watching (Auto-save progress)
- 🔔 Notification system
- 👤 Profile customization

### Creator Features
- 🎬 Upload videos, movies, and TV series
- 📺 Episode management (seasons and episodes)
- 🎨 Channel customization (banner, description)
- 📊 Analytics dashboard
- ✅ Verified creator badge (admin approval)
- 💬 Interact with audience

### Admin Features
- 👑 Admin dashboard
- ✅ Approve/reject creator requests
- 🛡️ Verify creators
- 📊 Platform statistics
- 👥 User management

## 🛠️ Tech Stack

### Frontend
- **React** 18.3.1 with Vite
- **React Router** for navigation
- **Axios** for API calls
- **Tailwind CSS** for styling
- **Lucide React** for icons

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **JWT** for authentication
- **Bcrypt** for password hashing

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/streamflix.git
cd streamflix
```

### 2. Install Dependencies

**Backend:**
```bash
cd server
npm install
```

**Frontend:**
```bash
cd client
npm install
```

### 3. Environment Variables

Create `server/.env`:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

### 4. Run Application

**Backend (Terminal 1):**
```bash
cd server
npm start
```

**Frontend (Terminal 2):**
```bash
cd client
npm run dev
```

Access the app at: `http://localhost:3000`

## � Deployment

### Deploy to Vercel (Frontend) + Render (Backend)

**Backend (Render.com):**
1. Create account at [Render.com](https://render.com)
2. Create new Web Service
3. Connect GitHub repository
4. Set build command: `cd server && npm install`
5. Set start command: `cd server && npm start`
6. Add environment variables (MONGODB_URI, JWT_SECRET)

**Frontend (Vercel):**
1. Create account at [Vercel.com](https://vercel.com)
2. Import GitHub repository
3. Set root directory: `client`
4. Set build command: `npm run build`
5. Set output directory: `dist`
6. Add environment variable: `VITE_API_URL=your_render_backend_url`

## 📖 Usage Guide

### For Users
1. **Register/Login**: Create account or login
2. **Browse Content**: Explore Movies, TV Shows, and Videos
3. **Watch Videos**: Click any video to watch
4. **Create Profile**: Add multiple profiles (Netflix-style)
5. **My List**: Save videos to watch later
6. **Continue Watching**: Resume from where you left off

### For Creators
1. **Request Creator Access**: Submit creator request
2. **Wait for Approval**: Admin will review your request
3. **Upload Content**: 
   - Videos (YouTube-style)
   - Movies (with optional trailer URL)
   - TV Series (main entry + episodes)
4. **Customize Channel**: Add banner and description
5. **Track Analytics**: View stats in Creator Dashboard

### For Admins
1. **Login as Admin**: Use admin credentials
2. **Review Creator Requests**: Approve/reject requests
3. **Verify Creators**: Grant verified badge
4. **Monitor Platform**: View statistics and manage users

## 🎬 TV Series & Episodes

### Upload TV Series
1. **Create Main Series Entry**:
   - Upload poster/thumbnail
   - Add title, description, genres
   - Set total seasons/episodes (optional, can be 0)
   - No video URL required

2. **Upload Episodes**:
   - Select series from dropdown
   - Set season and episode number
   - Add episode title and video URL
   - Episodes auto-calculate season/episode counts

### Episode Display
- Episodes only visible in series page (Netflix-style sidebar)
- Main series shown in Browse/Home/Search
- Episodes grouped by season with collapse/expand

## 🎥 Movie Trailers

Movies can have separate trailer URLs:
- **Trailer URL**: YouTube link for preview (Featured section)
- **Video URL**: Main movie link (accessed when clicking video card)
- Trailer auto-plays in Featured section after 3 seconds
- Only available for Movies (not TV Shows or Videos)

## 📥 Download Feature

Each video can have separate download URL:
- **Video URL**: For streaming/watching
- **Download URL**: For downloading (Google Drive, Mega, etc.)
- If no download URL, uses video URL as fallback

## � Customization

### Channel Customization
- Upload custom banner (1280x300px recommended)
- Add channel description
- Customize channel name

### Profile Customization
- Multiple profiles per account
- Custom profile names
- Avatar selection

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Videos
- `GET /api/videos` - Get all videos
- `GET /api/videos/:id` - Get video by ID
- `POST /api/videos` - Upload video (auth required)
- `PUT /api/videos/:id` - Update video (auth required)
- `DELETE /api/videos/:id` - Delete video (auth required)

### TV Series
- `GET /api/videos/series/list/all` - Get all series
- `GET /api/videos/series/:seriesId/episodes` - Get episodes by series
- `GET /api/videos/series/:seriesId/season/:seasonNumber` - Get season episodes

### Users
- `GET /api/users/me` - Get current user
- `POST /api/users/subscribe/:id` - Subscribe to creator
- `POST /api/users/unsubscribe/:id` - Unsubscribe from creator

### Creator Requests
- `POST /api/creator-request` - Submit creator request
- `GET /api/creator-request/status` - Get request status
- `GET /api/creator-request/all` - Get all requests (admin)
- `PUT /api/creator-request/:id/approve` - Approve request (admin)
- `PUT /api/creator-request/:id/reject` - Reject request (admin)

## 📝 Changelog

### Version 1.3.1 (Latest)
- ✅ Added movie trailer URL feature (YouTube only)
- ✅ Fixed episodes display in creator page
- ✅ Fixed episodes display in creator dashboard
- ✅ Optimized Home page performance
- ✅ Added download URL field for videos
- ✅ Improved TV series episode management

### Version 1.3.0
- ✅ TV Series & Episodes feature
- ✅ Episode sidebar (Netflix-style)
- ✅ Auto-calculate season/episode counts
- ✅ Multi-genre support for movies/TV shows

### Version 1.2.4
- ✅ Custom modal system (replaced browser dialogs)
- ✅ Fixed VideoCard hover issues
- ✅ Fixed tooltip display issues
- ✅ Improved UI/UX

### Version 1.1.0
- ✅ Creator request system
- ✅ Verified badges
- ✅ Notifications
- ✅ Download feature

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Muhamad Haikal**
- Email: ahmadlutpillah14@gmail.com

## 🙏 Acknowledgments

- Netflix for UI/UX inspiration
- YouTube for content platform inspiration
- MongoDB Atlas for database hosting
- Vercel & Render for deployment platforms

## � Support

For support, email ahmadlutpillah14@gmail.com or create an issue in the repository.

---

Made with ❤️ by Muhamad Haikal
