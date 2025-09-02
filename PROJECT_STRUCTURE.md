# Next.js Polling App - Project Structure

## 📁 Directory Structure

```
src/
├── app/                           # App Router (Next.js 15)
│   ├── (auth)/                    # Auth group routes
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── profile/
│   │       └── page.tsx
│   ├── (dashboard)/               # Protected dashboard routes
│   │   ├── polls/
│   │   │   ├── create/
│   │   │   │   └── page.tsx
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   └── analytics/
│   │       └── page.tsx
│   ├── api/                       # Route handlers
│   │   ├── auth/
│   │   │   ├── callback/
│   │   │   │   └── route.ts
│   │   │   └── logout/
│   │   │       └── route.ts
│   │   ├── polls/
│   │   │   ├── route.ts
│   │   │   ├── [id]/
│   │   │   │   ├── route.ts
│   │   │   │   ├── vote/
│   │   │   │   │   └── route.ts
│   │   │   │   └── qr/
│   │   │   │       └── route.ts
│   │   │   └── share/
│   │   │       └── route.ts
│   │   └── webhooks/
│   │       └── supabase/
│   │           └── route.ts
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── middleware.ts              # Auth middleware
├── components/                    # Reusable components
│   ├── ui/                        # Shadcn components
│   ├── auth/                      # Auth components
│   ├── polls/                     # Poll components
│   ├── layout/                    # Layout components
│   └── shared/                    # Shared components
├── lib/                           # Utilities & configurations
│   ├── supabase/                  # Supabase client & config
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── auth-helpers.ts
│   ├── utils.ts                   # General utilities
│   ├── validations.ts             # Zod schemas
│   └── constants.ts               # App constants
├── hooks/                         # Custom React hooks
│   ├── use-auth.ts
│   ├── use-polls.ts
│   ├── use-votes.ts
│   └── use-realtime.ts
├── types/                         # TypeScript definitions
│   ├── database.ts                # Generated from Supabase
│   ├── supabase.ts                # Supabase types
│   └── index.ts                   # App types
├── store/                         # State management
│   ├── auth-store.ts
│   └── poll-store.ts
└── middleware.ts                  # Root middleware
```

## 🔧 Key Configuration Files

### `next.config.js`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
  images: {
    domains: ['localhost', 'your-supabase-project.supabase.co'],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
}

module.exports = nextConfig
```

### `package.json` Dependencies
```json
{
  "dependencies": {
    "next": "15.5.2",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "@supabase/supabase-js": "^2.39.0",
    "@supabase/auth-helpers-nextjs": "^0.9.0",
    "@supabase/auth-ui-react": "^0.4.6",
    "@supabase/auth-ui-shared": "^0.1.8",
    "qrcode": "^1.5.3",
    "qrcode.react": "^3.1.0",
    "react-qr-scanner": "^1.0.0-alpha.11",
    "zod": "^3.22.4",
    "react-hook-form": "^7.48.2",
    "@hookform/resolvers": "^3.3.2",
    "zustand": "^4.4.7",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.2.0",
    "lucide-react": "^0.294.0",
    "date-fns": "^2.30.0",
    "recharts": "^2.8.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "typescript": "^5",
    "tailwindcss": "^4",
    "autoprefixer": "^10.0.1",
    "postcss": "^8",
    "@biomejs/biome": "2.2.0"
  }
}
```

## 🚀 Deployment Configuration

### `vercel.json`
```json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-role-key"
  }
}
```

### Environment Variables (`.env.local`)
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Polly

# QR Code Storage (Supabase Storage)
NEXT_PUBLIC_STORAGE_URL=your-storage-url
```
