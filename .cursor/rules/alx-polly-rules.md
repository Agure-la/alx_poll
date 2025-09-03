# ALX Polly Project Rules

Project-specific coding standards and patterns for the Next.js polling application with Supabase integration.

## 1. Folder Structure & Organization

### App Router Structure
- Use Next.js 15 App Router with nested layouts
- API routes: `/app/api/polls/` for poll-related endpoints
- Pages: `/app/polls/[id]/` for dynamic poll routes
- Auth pages: `/app/auth/login/`, `/app/auth/register/`, `/app/auth/profile/`
- Always include `page.tsx` for route segments
- Use `[id]` for dynamic segments, not `[...slug]` unless needed

### Component Organization