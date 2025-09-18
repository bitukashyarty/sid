# Deployment Guide

This guide will help you deploy the Attendance System to Render (backend) and Vercel (frontend).

## Prerequisites

1. GitHub account with your code pushed to a repository
2. Render account (https://render.com)
3. Vercel account (https://vercel.com)
4. MongoDB Atlas database (already configured)

## Backend Deployment (Render)

### Step 1: Prepare Backend for Deployment

1. Ensure your `backend/package.json` has the correct start script:
   ```json
   {
     "scripts": {
       "start": "node server.js",
       "dev": "nodemon server.js"
     }
   }
   ```

### Step 2: Deploy to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `attendance-system-backend`
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### Step 3: Set Environment Variables in Render

In the Render dashboard, go to your service → Environment tab and add:

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://sidma:Itsmesid@sid.06flftp.mongodb.net/attendance_system?retryWrites=true&w=majority&appName=sid
JWT_SECRET=KaisaHaiTuAudi
PORT=10000
FRONTEND_URL=https://your-frontend-app.vercel.app
```

**Important**: Replace `https://your-frontend-app.vercel.app` with your actual Vercel URL after frontend deployment.

### Step 4: Deploy

Click "Create Web Service" and wait for deployment to complete.
Your backend will be available at: `https://your-backend-app.onrender.com`

## Frontend Deployment (Vercel)

### Step 1: Update Frontend Environment

1. Update `frontend/.env` with your Render backend URL:
   ```
   REACT_APP_API_URL=https://your-backend-app.onrender.com/api
   ```

### Step 2: Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Install Command**: `npm install`

### Step 3: Set Environment Variables in Vercel

In Vercel dashboard, go to your project → Settings → Environment Variables and add:

```
REACT_APP_API_URL=https://your-backend-app.onrender.com/api
```

**Important**: Replace `https://your-backend-app.onrender.com` with your actual Render backend URL.

### Step 4: Deploy

Click "Deploy" and wait for deployment to complete.
Your frontend will be available at: `https://your-project-name.vercel.app`

## Final Configuration

### Step 1: Update Backend CORS

After getting your Vercel URL, update the `FRONTEND_URL` environment variable in Render:

1. Go to Render dashboard → Your service → Environment
2. Update `FRONTEND_URL` with your actual Vercel URL
3. Save changes (this will trigger a redeploy)

### Step 2: Test the Connection

1. Visit your Vercel frontend URL
2. Try to log in with your admin credentials
3. Test creating/viewing students and attendance

## Troubleshooting

### Common Issues:

1. **CORS Error**: Make sure `FRONTEND_URL` in Render matches your Vercel URL exactly
2. **API Connection Failed**: Verify `REACT_APP_API_URL` in Vercel points to correct Render URL
3. **Database Connection**: Ensure MongoDB URI is correct and database is accessible
4. **Build Failures**: Check build logs in respective platforms

### Environment Variables Checklist:

**Render (Backend):**
- ✅ NODE_ENV=production
- ✅ MONGODB_URI=(your MongoDB connection string)
- ✅ JWT_SECRET=(your JWT secret)
- ✅ PORT=10000
- ✅ FRONTEND_URL=(your Vercel URL)

**Vercel (Frontend):**
- ✅ REACT_APP_API_URL=(your Render backend URL + /api)

## URLs to Replace

After deployment, update these placeholder URLs:

1. In `backend/.env`: Replace `https://your-frontend-app.vercel.app` with actual Vercel URL
2. In `frontend/.env`: Replace `https://your-backend-app.onrender.com/api` with actual Render URL + /api

## Security Notes

- Never commit `.env` files to version control
- Use strong, unique JWT secrets in production
- Ensure MongoDB database has proper access controls
- Consider enabling additional security headers in production