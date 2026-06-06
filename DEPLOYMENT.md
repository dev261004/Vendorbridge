# VendorBridge ERP - Deployment Guide

## Overview
This guide explains how to deploy VendorBridge ERP to production on Vercel with Supabase as the database backend.

---

## Prerequisites

- [ ] Vercel account (vercel.com)
- [ ] Supabase account (supabase.com)
- [ ] GitHub account with repository
- [ ] Domain name (optional)

---

## Step 1: Prepare Supabase Database

### 1.1 Create Supabase Project
1. Go to supabase.com and sign in
2. Click "New Project"
3. Fill in:
   - **Project Name**: `vendorbridge`
   - **Database Password**: Strong password
   - **Region**: Closest to your users
4. Wait for project to initialize

### 1.2 Verify Database Tables
1. Go to SQL Editor
2. All 10 tables should exist:
   - vendors
   - rfqs
   - rfq_items
   - quotations
   - quotation_items
   - purchase_orders
   - po_items
   - invoices
   - invoice_items
   - profiles

### 1.3 Get Connection Info
1. Go to Project Settings → API
2. Copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Step 2: Push Code to GitHub

### 2.1 Initialize Git Repository
```bash
cd /path/to/vendorbridge
git init
git add .
git commit -m "Initial VendorBridge ERP setup"
```

### 2.2 Create GitHub Repository
1. Go to github.com
2. Click "New repository"
3. Name it `vendorbridge-erp`
4. Click "Create repository"

### 2.3 Push Code
```bash
git remote add origin https://github.com/YOUR_USERNAME/vendorbridge-erp.git
git branch -M main
git push -u origin main
```

---

## Step 3: Deploy to Vercel

### 3.1 Import Project
1. Go to vercel.com/new
2. Click "Import Git Repository"
3. Select `vendorbridge-erp`
4. Click "Import"

### 3.2 Configure Environment Variables
In Vercel deployment settings, add:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

### 3.3 Configure Build & Start
Leave defaults:
- **Build Command**: `pnpm run build`
- **Output Directory**: `.next`
- **Install Command**: `pnpm install`

### 3.4 Deploy
1. Click "Deploy"
2. Wait for build to complete
3. Visit your production URL

---

## Step 4: Post-Deployment Verification

### 4.1 Test Login Flow
1. Navigate to `/auth/sign-up`
2. Create test account
3. Check email confirmation if enabled
4. Login with credentials
5. Should redirect to dashboard

### 4.2 Test Vendor Creation
1. Go to `/dashboard/vendors`
2. Click "Add Vendor"
3. Fill form with test data
4. Submit
5. Vendor should appear in table
6. Check Supabase database to confirm data saved

### 4.3 Test RFQ Flow
1. Go to `/dashboard/rfqs`
2. Create RFQ
3. Add items
4. Verify data in Supabase

### 4.4 Test Theme Toggle
1. Click theme button in sidebar
2. Page should switch to light/dark mode
3. Refresh page - theme should persist

---

## Step 5: Configure Custom Domain (Optional)

### 5.1 In Vercel
1. Project Settings → Domains
2. Enter your domain
3. Update DNS records as instructed

### 5.2 DNS Configuration
Add Vercel's DNS records to your domain registrar

---

## Step 6: Set Up Monitoring

### 6.1 Enable Vercel Analytics
1. Project Settings → Analytics
2. Enable Web Analytics
3. Enable Speed Insights

### 6.2 Monitor Supabase
1. Go to Supabase dashboard
2. Check Query Performance
3. Monitor Auth logs
4. Track database size

---

## Step 7: Production Security Checklist

- [ ] Enable Supabase email verification
- [ ] Set strong password requirements
- [ ] Configure rate limiting
- [ ] Enable HTTPS (automatic on Vercel)
- [ ] Review RLS policies
- [ ] Set up backup strategy
- [ ] Enable database logging
- [ ] Configure CDN caching
- [ ] Set up error monitoring
- [ ] Review environment variables

---

## Troubleshooting Deployment

### Issue: Build Fails
**Solution**: Check build logs in Vercel dashboard
```bash
# Common fixes:
pnpm install  # Reinstall dependencies
pnpm run build  # Test build locally
```

### Issue: Database Connection Error
**Solution**: Verify environment variables
```
NEXT_PUBLIC_SUPABASE_URL=http://your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
```

### Issue: Authentication Fails
**Solution**: Update auth redirect URL in Supabase
1. Supabase → Authentication → URL Configuration
2. Add your Vercel domain to allowed redirect URLs

### Issue: Theme Not Working
**Solution**: Clear browser cache and localStorage
- Hard refresh (Ctrl+Shift+R)
- Clear localStorage

---

## Scaling the Application

### Database Scaling
- Monitor Supabase storage
- Archive old invoices
- Implement data partitioning

### Performance Optimization
- Enable Vercel Analytics
- Optimize images
- Use ISR for reports
- Implement caching strategies

### Adding More Users
- Configure SAML/SSO
- Implement team management
- Add user roles system
- Enable audit logging

---

## Backup Strategy

### Supabase Backups
1. Enable automated backups
2. Test restore procedures
3. Keep weekly snapshots

### Code Backups
- GitHub is primary backup
- Enable branch protection
- Require pull request reviews

---

## Monitoring & Maintenance

### Daily
- Check Vercel deployment status
- Monitor error rates
- Review user reports

### Weekly
- Check database performance
- Review auth logs
- Verify backups

### Monthly
- Update dependencies
- Security audit
- Performance review

---

## Support & Resources

- **Vercel Docs**: vercel.com/docs
- **Supabase Docs**: supabase.com/docs
- **Next.js Docs**: nextjs.org/docs
- **Community**: Discord, GitHub Issues

---

## Deployment Commands Reference

```bash
# Local development
pnpm dev

# Production build
pnpm run build

# Preview production build
pnpm run build && pnpm start

# Lint code
pnpm run lint

# Type check
pnpm run type-check
```

---

## Version Control Best Practices

```bash
# Create feature branch
git checkout -b feature/vendor-export

# Make changes and commit
git add .
git commit -m "Add vendor export functionality"

# Push and create PR
git push origin feature/vendor-export

# After review, merge to main
git checkout main
git pull origin main
git merge feature/vendor-export
git push origin main

# Vercel auto-deploys on main push
```

---

## Environment Variables Checklist

Production environment needs:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

These are configured in Vercel during deployment setup.

---

**VendorBridge ERP is ready for production deployment!**

For questions or issues, refer to the IMPLEMENTATION_GUIDE.md file or check logs in Vercel/Supabase dashboards.
