# AWS Deployment Guide

## Option 1: EC2 + S3 (Simple)

### 1. Frontend (S3 + CloudFront)
```bash
# Build React app
cd react-app
npm run build

# Upload to S3 bucket
aws s3 sync build/ s3://thulasibloom-frontend --delete
```

### 2. Backend (EC2)
- Launch EC2 t2.micro instance
- Install Node.js, PM2
- Upload server code
- Run: `pm2 start server.js`

### 3. Database
- Keep SQLite for simplicity
- Or migrate to RDS MySQL

## Option 2: Serverless (Lambda + RDS)

### 1. Frontend (Amplify)
```bash
# Connect GitHub repo to Amplify
# Auto-deploys on git push
```

### 2. Backend (Lambda)
- Convert Express routes to Lambda functions
- Use API Gateway for routing
- Store in RDS/DynamoDB

### 3. Images
- Upload to S3 bucket
- Use CloudFront CDN

## Environment Variables
```
DATABASE_URL=mysql://user:pass@rds-endpoint/db
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
ENCRYPTION_KEY=your-secret-key
```

## Cost Estimate (Monthly)
- EC2 t2.micro: $0 (free tier)
- S3 storage: $1-5
- RDS t3.micro: $15-20
- CloudFront: $1-5
- **Total: ~$20-30/month**