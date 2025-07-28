# Lib Directory

This directory contains shared utilities, configurations, and helper functions.

## Current Structure

### Authentication
- **auth-options.ts** - NextAuth.js configuration
  - Google OAuth provider
  - Credentials provider for email/password
  - JWT strategy for session management
  - Custom callbacks for user data

### Supabase Clients
- **supabase/client.ts** - Browser client for client-side operations
  - Uses publishable key
  - For public data access and user operations
  
- **supabase/server.ts** - Server client for SSR/API routes
  - Uses publishable key with cookie handling
  - Maintains user session across requests
  
- **supabase/admin.ts** - Admin client for privileged operations
  - Uses secret key to bypass RLS
  - Only for server-side admin operations
  - Used for: user management, data seeding, admin features

## Planned Additions

### API Integrations
- **nfl-api/** - NFL game data fetching
  - ESPN API client
  - Data transformation utilities
  - Caching layer

### Utilities
- **utils/** - General helper functions
  - Date formatting for game times
  - Week calculation for NFL season
  - Pick validation logic

### Constants
- **constants/** - App-wide constants
  - NFL team data
  - Season configuration
  - Game rules

## Best Practices

### Client Selection
- Use `client.ts` for user-facing features
- Use `server.ts` for SSR and API routes
- Use `admin.ts` only when bypassing RLS is required

### Error Handling
- Always wrap Supabase calls in try-catch
- Return consistent error formats
- Log errors for debugging

### Type Safety
- Define types for all Supabase queries
- Use generated types from Supabase when available
- Avoid `any` types