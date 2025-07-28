# Lib Directory

This directory contains shared utilities, configurations, and helper functions for the Survivor Fantasy League application.

## Current Structure ✅

### Authentication ✅
- **auth-options.ts** - NextAuth.js configuration
  - Google OAuth provider with client credentials
  - Credentials provider for email/password authentication
  - JWT strategy for session management with user ID
  - Custom callbacks for user data mapping
  - Session strategy configured for JWT tokens

### Supabase Clients ✅
- **supabase/client.ts** - Browser client for client-side operations
  - Uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - For public data access and authenticated user operations
  - Browser-compatible with SSR support
  
- **supabase/server.ts** - Server client for SSR/API routes
  - Uses publishable key with cookie handling
  - Maintains user session across server requests
  - Handles cookie-based authentication state
  
- **supabase/admin.ts** - Admin client for privileged operations
  - Uses `SUPABASE_SECRET_KEY` to bypass RLS
  - Server-side only for API routes
  - Used for: league management, user operations, admin features
  - Warning comments about security implications

## Implementation Details ✅

### Environment Variables
Required environment variables for the lib components:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_anon_key
SUPABASE_SECRET_KEY=your_service_role_key
GOOGLE_CLIENT_ID=your_google_oauth_id
GOOGLE_CLIENT_SECRET=your_google_oauth_secret
NEXTAUTH_URL=your_app_url
NEXTAUTH_SECRET=your_nextauth_secret
```

### NextAuth Configuration ✅
- **Providers**: Google OAuth and credentials (email/password)
- **Session**: JWT strategy with custom user ID mapping
- **Callbacks**: 
  - JWT callback adds user ID to token
  - Session callback adds user ID to session object
- **Pages**: Custom sign-in page at `/auth/signin`

### Supabase Client Usage Patterns ✅

#### Browser Client (client.ts)
```typescript
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
// Used in client components for user data
```

#### Server Client (server.ts)
```typescript
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()
// Used in server components and middleware
```

#### Admin Client (admin.ts)
```typescript
import { createAdminClient } from '@/lib/supabase/admin'
const supabase = createAdminClient()
// Used in API routes for privileged operations
```

### Security Considerations ✅

#### RLS Policy Approach
- Regular clients respect Row Level Security policies
- Admin client bypasses RLS for server-side operations
- API routes validate sessions before using admin client
- User authorization checked at application level

#### Key Management
- Publishable key exposed to client (safe for public use)
- Secret key only used server-side in API routes
- Environment variable validation prevents startup without keys

## Integration Points ✅

### NextAuth + Supabase
- NextAuth handles authentication flow
- Supabase stores user profiles and application data
- User ID from NextAuth maps to Supabase profile records
- Session validation in API routes ensures data security

### API Route Pattern
```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { createAdminClient } from '@/lib/supabase/admin'

const session = await getServerSession(authOptions)
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

const supabase = createAdminClient()
// Safe to use admin client after session validation
```

## Next Steps 🔄

### API Integrations
- **nfl-api/** - NFL game data fetching
  - ESPN API client for game schedules and scores
  - Data transformation utilities for consistent format
  - Caching layer for performance optimization

### Utilities
- **utils/** - General helper functions
  - Date formatting for game times and seasons
  - NFL week calculation based on current date
  - Pick validation logic and business rules
  - Team lookup and data utilities

### Constants
- **constants/** - App-wide constants
  - NFL team data with IDs, names, abbreviations
  - Season configuration and important dates
  - Game rules and elimination logic
  - API endpoints and external service URLs

### Type Definitions
- **types/** - Shared TypeScript interfaces
  - Database record types matching Supabase schema
  - API request/response interfaces
  - Component prop types for reusability

## Best Practices ✅

### Client Selection Guidelines
- Use `client.ts` for client-side user operations
- Use `server.ts` for server components with user context
- Use `admin.ts` only in API routes with session validation
- Never expose admin client to client-side code

### Error Handling Standards
```typescript
try {
  const { data, error } = await supabase.from('table').select()
  if (error) {
    console.error('Database error:', error)
    throw new Error('Operation failed')
  }
  return data
} catch (error) {
  console.error('Unexpected error:', error)
  throw error // Re-throw for caller to handle
}
```

### Type Safety Implementation
- Use TypeScript interfaces for all database operations
- Define strict types for API request/response data
- Leverage Supabase's generated types when available
- Avoid `any` types and prefer `unknown` for dynamic data