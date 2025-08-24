# Free Deployment Guide

## Step 1: Prepare for Deployment

### Update API URL for production
```javascript
// In react-app/src/context/CartContext.js and components/Checkout.js
// Change: http://localhost:5000/api
// To: https://thulasibloom-backend.onrender.com/api
```

### Add build scripts
```json
// In server/package.json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```

## Step 2: Deploy to Render.com (100% FREE)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial deployment"
   git branch -M main
   git remote add origin https://github.com/yourusername/thulasibloom.git
   git push -u origin main
   ```

2. **Create Render Account:**
   - Go to render.com
   - Sign up with GitHub

3. **Deploy Backend:**
   - New → Web Service
   - Connect GitHub repo
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Free tier selected
   - Deploy!

4. **Deploy Frontend:**
   - New → Static Site
   - Same GitHub repo
   - Build Command: `cd react-app && npm install && npm run build`
   - Publish Directory: `react-app/build`
   - Deploy!

## Your FREE URLs:
- **Frontend**: https://thulasibloom.onrender.com
- **Backend**: https://thulasibloom-backend.onrender.com

## Step 3: Update API URLs
After backend deploys, update frontend API calls to use the Render backend URL.

## Total Cost: $0
- Hosting: Free
- Domain: Free (.onrender.com subdomain)
- SSL: Free
- Database: SQLite file (free)