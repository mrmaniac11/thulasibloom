# Ultra Low-Cost Deployment Options

## Option 1: AWS Free Tier Only (~$0/month)
- **Frontend**: S3 Static Website (Free tier: 5GB storage)
- **Backend**: EC2 t2.micro (Free tier: 750 hours/month)
- **Database**: SQLite on EC2 (no extra cost)
- **Images**: Same S3 bucket as frontend
- **Total**: $0 for first 12 months

## Option 2: Serverless (~$1-3/month)
- **Frontend**: Netlify/Vercel (Free tier)
- **Backend**: AWS Lambda (1M requests free)
- **Database**: DynamoDB (25GB free)
- **Images**: S3 (5GB free)
- **Total**: ~$1-3/month

## Option 3: Alternative Platforms (~$0-5/month)
- **Render.com**: Free tier for both frontend/backend
- **Railway.app**: $5/month for everything
- **Heroku**: Free tier (limited hours)
- **PlanetScale**: Free MySQL database
- **Cloudinary**: Free image hosting

## Recommended: Render.com Setup
```bash
# 1. Push code to GitHub
git add .
git commit -m "Deploy ready"
git push origin main

# 2. Connect to Render.com
# - Frontend: Static site from GitHub
# - Backend: Web service from GitHub
# - Database: SQLite file persists

# 3. Environment Variables
NODE_ENV=production
DATABASE_PATH=/opt/render/project/src/thulasibloom.db
```

## Cost Breakdown (Render.com)
- Static Site: $0
- Web Service: $0 (750 hours free)
- Database: $0 (SQLite file)
- **Total: $0/month**

## Production Optimizations
```javascript
// Compress images
const sharp = require('sharp');

// Enable gzip compression
app.use(compression());

// Cache static files
app.use(express.static('public', { maxAge: '1d' }));
```