# 🚀 Deployment Guide

Complete guide for deploying StreamFlix to production.

## Prerequisites

- GitHub account
- Vercel account (for frontend)
- Render account (for backend)
- MongoDB Atlas account (for database)

## Step 1: Prepare MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster (if you haven't)
3. Create database user with password
4. Whitelist all IPs: `0.0.0.0/0` (for production access)
5. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/streamflix`

## Step 2: Deploy Backend to Render

### 2.1 Create Render Account
1. Go to [Render.com](https://render.com)
2. Sign up with GitHub

### 2.2 Create Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `streamflix-backend`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

### 2.3 Add Environment Variables
```
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_random_secret_key_here
PORT=5000
```

### 2.4 Deploy
- Click "Create Web Service"
- Wait for deployment (5-10 minutes)
- Copy your backend URL: `https://streamflix-backend.onrender.com`

## Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Account
1. Go to [Vercel.com](https://vercel.com)
2. Sign up with GitHub

### 3.2 Import Project
1. Click "Add New..." → "Project"
2. Import your GitHub repository
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 3.3 Add Environment Variable
```
VITE_API_URL=https://streamflix-backend.onrender.com
```

### 3.4 Update Vite Config
Edit `client/vite.config.js`:
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
```

### 3.5 Deploy
- Click "Deploy"
- Wait for deployment (2-5 minutes)
- Your app is live at: `https://your-app.vercel.app`

## Step 4: Update Backend CORS

Edit `server/server.js` to allow Vercel domain:
```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-app.vercel.app'
  ],
  credentials: true
}));
```

Commit and push to trigger re-deployment.

## Step 5: Create Admin Account

SSH into Render or run locally:
```bash
cd server
node createAdmin.js
```

Or use the script in your backend.

## Troubleshooting

### Backend Issues
- Check Render logs for errors
- Verify MongoDB connection string
- Ensure environment variables are set

### Frontend Issues
- Check Vercel deployment logs
- Verify API URL is correct
- Check browser console for errors

### CORS Issues
- Add Vercel domain to CORS whitelist
- Ensure credentials: true is set

## Performance Tips

1. **Enable Caching**: Vercel automatically caches static assets
2. **Optimize Images**: Use CDN for large images
3. **Database Indexing**: Add indexes to MongoDB collections
4. **Lazy Loading**: Implement lazy loading for videos

## Monitoring

- **Render**: Check logs and metrics in dashboard
- **Vercel**: Check analytics and logs
- **MongoDB Atlas**: Monitor database performance

## Scaling

### Free Tier Limits
- **Render**: 750 hours/month, sleeps after 15 min inactivity
- **Vercel**: 100GB bandwidth/month
- **MongoDB Atlas**: 512MB storage

### Upgrade Options
- **Render**: $7/month for always-on
- **Vercel**: $20/month for Pro
- **MongoDB Atlas**: $9/month for 2GB

---

Need help? Create an issue on GitHub!
