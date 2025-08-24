# Custom Domain Setup Guide

## Domain Costs
- **.com**: $10-15/year (GoDaddy, Namecheap, Cloudflare)
- **.in**: $8-12/year
- **.shop**: $3-5/year
- **Free options**: .tk, .ml, .ga (Freenom) - Not recommended for business

## Platform Support for Custom Domains

### Render.com (FREE)
- ✅ Custom domain supported on free tier
- ✅ Free SSL certificate
- Steps:
  1. Buy domain from any registrar
  2. Add CNAME record: `www.yourdomain.com` → `your-app.onrender.com`
  3. Add domain in Render dashboard

### Netlify (FREE)
- ✅ Custom domain on free tier
- ✅ Free SSL + CDN
- Steps:
  1. Deploy site to Netlify
  2. Add custom domain in site settings
  3. Update DNS records

### Vercel (FREE)
- ✅ Custom domain on free tier
- ✅ Free SSL + global CDN
- Automatic HTTPS

### Railway ($5/month)
- ✅ Custom domain included
- ✅ Free SSL

## DNS Configuration Example
```
Type    Name    Value
CNAME   www     your-app.onrender.com
A       @       185.199.108.153 (or platform IP)
```

## Recommended Setup
1. **Domain**: Namecheap (~$10/year)
2. **Hosting**: Render.com (Free)
3. **Total Cost**: ~$10/year

## SSL Certificate
- All platforms provide FREE SSL certificates
- Automatic renewal
- No additional cost

## Example Domains
- thulasibloom.com
- thulasibloom.shop
- thulasibloom.in
- healthmix.store