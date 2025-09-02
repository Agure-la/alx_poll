# 🚀 Deployment Guide - Next.js Polling App

## 📋 Prerequisites

- [Vercel](https://vercel.com) account
- [Supabase](https://supabase.com) account
- [GitHub](https://github.com) repository

## 🗄️ Supabase Setup

### 1. Create Supabase Project
```bash
# Go to https://supabase.com
# Create new project
# Note down your project URL and anon key
```

### 2. Run Database Migrations
```bash
# In Supabase Dashboard > SQL Editor
# Run the database-schema.sql file
```

### 3. Configure Storage Buckets
```bash
# In Supabase Dashboard > Storage
# Create bucket: poll-assets
# Set public access
# Configure CORS if needed
```

### 4. Set Up Row Level Security (RLS)
```bash
# RLS policies are already included in the schema
# Verify they're active in Supabase Dashboard > Authentication > Policies
```

### 5. Configure Authentication
```bash
# In Supabase Dashboard > Authentication > Settings
# Add your domain to Site URL
# Configure email templates
# Set up OAuth providers if needed
```

## 🔧 Environment Variables

### Local Development (.env.local)
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Polly

# QR Code Storage
NEXT_PUBLIC_STORAGE_URL=your-storage-url
```

### Vercel Environment Variables
```bash
# In Vercel Dashboard > Project Settings > Environment Variables
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_APP_NAME=Polly
NEXT_PUBLIC_STORAGE_URL=your-storage-url
```

## 🚀 Vercel Deployment

### 1. Connect Repository
```bash
# In Vercel Dashboard
# Import your GitHub repository
# Select Next.js framework
```

### 2. Configure Build Settings
```bash
# Build Command: npm run build
# Output Directory: .next
# Install Command: npm install
```

### 3. Set Environment Variables
```bash
# Add all environment variables from above
# Make sure to use production URLs
```

### 4. Deploy
```bash
# Vercel will automatically deploy on push to main branch
# Or manually deploy from dashboard
```

## 🔒 Security Considerations

### 1. API Rate Limiting
```typescript
// Add rate limiting to API routes
import { rateLimit } from '@/lib/rate-limit'

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500
})

export async function POST(request: NextRequest) {
  try {
    await limiter.check(request, 10, 'CACHE_TOKEN') // 10 requests per minute
    // ... rest of your API logic
  } catch {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }
}
```

### 2. CORS Configuration
```typescript
// In next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_APP_URL },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
}
```

### 3. Content Security Policy
```typescript
// In next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-eval' 'unsafe-inline';
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: https:;
              connect-src 'self' https://*.supabase.co;
              frame-src 'self';
            `.replace(/\s+/g, ' ').trim()
          },
        ],
      },
    ]
  },
}
```

## 📊 Monitoring & Analytics

### 1. Vercel Analytics
```bash
# Enable Vercel Analytics in dashboard
# Add to _app.tsx or layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### 2. Error Tracking
```bash
# Add Sentry or similar error tracking
npm install @sentry/nextjs

# Configure in sentry.client.config.js and sentry.server.config.js
```

### 3. Performance Monitoring
```bash
# Use Vercel's built-in performance monitoring
# Or add custom performance tracking
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Run linting
        run: npm run lint
      
      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## 🧪 Testing Strategy

### 1. Unit Tests
```bash
# Install testing libraries
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# Create test files for components and utilities
```

### 2. Integration Tests
```bash
# Test API routes and database interactions
npm install --save-dev @testing-library/nextjs
```

### 3. E2E Tests
```bash
# Use Playwright or Cypress
npm install --save-dev @playwright/test
```

## 📈 Performance Optimization

### 1. Image Optimization
```typescript
// Use Next.js Image component
import Image from 'next/image'

// Configure domains in next.config.js
images: {
  domains: ['your-supabase-project.supabase.co'],
}
```

### 2. Database Optimization
```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_polls_created_at ON polls(created_at DESC);
CREATE INDEX idx_votes_poll_option ON votes(poll_id, option_id);
```

### 3. Caching Strategy
```typescript
// Implement Redis caching for frequently accessed data
// Use Supabase's built-in caching
// Implement client-side caching with SWR or React Query
```

## 🔧 Maintenance

### 1. Database Backups
```bash
# Supabase provides automatic backups
# Set up additional backup strategy if needed
```

### 2. Log Monitoring
```bash
# Use Vercel's built-in logging
# Set up external logging service (e.g., LogRocket, Sentry)
```

### 3. Regular Updates
```bash
# Keep dependencies updated
npm audit fix
npm update

# Monitor for security vulnerabilities
npm audit
```

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check Supabase CORS settings
   - Verify environment variables

2. **Authentication Issues**
   - Check Supabase auth settings
   - Verify redirect URLs

3. **Database Connection Issues**
   - Check Supabase project status
   - Verify connection strings

4. **Build Failures**
   - Check TypeScript errors
   - Verify all dependencies are installed

### Support Resources
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
