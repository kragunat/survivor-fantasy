# API Routes Directory

This directory contains all Next.js API route handlers for the Survivor Fantasy League application.

## Current Structure ✅

### Authentication (/api/auth)
- **[...nextauth]/route.ts** - NextAuth.js dynamic route
  - Handles all auth operations (signin, signout, callback)
  - Google OAuth and credentials providers
  - Session management with JWT tokens
  
- **signup/route.ts** - Custom Supabase signup endpoint
  - Creates user in Supabase Auth
  - Triggers profile creation via database trigger
  - Returns user data for immediate signin

### League Management (/api/leagues) ✅
- **route.ts** - League CRUD operations
  - `POST /api/leagues` - Create new league with commissioner
  - Validates session and auto-adds commissioner as member
  
- **[id]/route.ts** - Individual league operations
  - `GET /api/leagues/[id]` - Get league details, members, and user picks
  - Validates user membership before data access
  - Efficient queries with joins for related data
  
- **[id]/invite/route.ts** - League invitation system
  - `POST /api/leagues/[id]/invite` - Create invitation with unique code
  - Commissioner-only endpoint with email validation
  - 7-day expiration with nanoid-generated codes

### Invitation System (/api/invitations) ✅
- **[code]/route.ts** - Invitation validation
  - `GET /api/invitations/[code]` - Get invitation details
  - Validates expiration and returns league info
  
- **[code]/accept/route.ts** - Join league via invitation
  - `POST /api/invitations/[code]/accept` - Accept invitation
  - Prevents duplicate memberships
  - Auto-removes invitation after use

### User Data (/api/user) ✅
- **leagues/route.ts** - User-specific endpoints
  - `GET /api/user/leagues` - Get all user's leagues
  - Includes commissioner status and elimination data
  - Powers dashboard league listing

## Implementation Patterns ✅

### Authentication Middleware
All protected endpoints validate session:
```typescript
const session = await getServerSession(authOptions)
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

### Database Integration
Using admin client for server-side operations:
```typescript
import { createAdminClient } from '@/lib/supabase/admin'
const supabase = createAdminClient()
```

### Authorization Checks
League-specific access control:
```typescript
// Verify user is league member
const { data: membership } = await supabase
  .from('league_members')
  .select('id')
  .eq('league_id', leagueId)
  .eq('user_id', session.user.id)
  .single()

if (!membership) {
  return NextResponse.json({ error: 'Not a member' }, { status: 403 })
}
```

### Error Handling Pattern
```typescript
try {
  // Database operations
  const { data, error } = await supabase.from('table').select()
  if (error) {
    console.error('DB Error:', error)
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 })
  }
  return NextResponse.json(data)
} catch (error) {
  console.error('Unexpected error:', error)
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
```

## Security Implementation ✅

### Input Validation
```typescript
const { name, maxPlayers } = await request.json()
if (!name || typeof name !== 'string') {
  return NextResponse.json({ error: 'Invalid league name' }, { status: 400 })
}
```

### Admin Client Security
- Service role key stored securely in environment variables
- Used only in server-side API routes
- Bypasses RLS for authorized operations
- Session validation provides security layer

### Invitation Security
- Unique codes with 7-day expiration
- Single-use invitations (deleted after acceptance)
- Email-based tracking for audit purposes

## Response Formats ✅

### Success Responses
```typescript
// Data response
return NextResponse.json({ league, members, userPicks })

// Operation confirmation
return NextResponse.json({ message: 'League created successfully', leagueId })
```

### Error Responses
```typescript
// Client errors
return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
return NextResponse.json({ error: 'Not found' }, { status: 404 })

// Server errors
return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
```

## API Documentation ✅

### League Endpoints
- `POST /api/leagues`
  - Body: `{ name: string, maxPlayers?: number }`
  - Returns: `{ id, name, commissioner_id, ... }`

- `GET /api/leagues/[id]`
  - Returns: `{ league, members[], userPicks[] }`

- `POST /api/leagues/[id]/invite`
  - Body: `{ email: string }`
  - Returns: `{ invitation, inviteUrl }`

### User Endpoints
- `GET /api/user/leagues`
  - Returns: `{ leagues: UserLeague[] }`

### Invitation Endpoints
- `GET /api/invitations/[code]`
  - Returns: `{ invitation with league details }`

- `POST /api/invitations/[code]/accept`
  - Returns: `{ leagueId, message }`

## Database Queries ✅

### Efficient Data Fetching
```typescript
// Single query with joins for related data
const { data: league } = await supabase
  .from('leagues')
  .select(`
    *,
    commissioner:profiles!commissioner_id(name, email),
    members:league_members(
      *,
      profile:profiles!user_id(name, email)
    )
  `)
  .eq('id', leagueId)
  .single()
```

### Preventing Duplicate Operations
```typescript
// Check existing membership before joining
const { data: existingMember } = await supabase
  .from('league_members')
  .select('id')
  .eq('league_id', leagueId)
  .eq('user_id', userId)
  .maybeSingle()

if (existingMember) {
  return NextResponse.json({ message: 'Already a member' })
}
```

## Next Steps 🔄

### Game Data Integration
- `GET /api/games/week/[week]` - Get games for specific week
- `POST /api/games/sync` - Sync from external NFL API
- `GET /api/games/current-week` - Get current NFL week

### Pick Management
- `POST /api/picks` - Submit weekly pick
- `GET /api/picks/user` - Get user's pick history
- `GET /api/leagues/[id]/picks/[week]` - Get all picks for week

### League Administration
- `PUT /api/leagues/[id]` - Update league settings
- `POST /api/leagues/[id]/eliminate` - Process eliminations
- `GET /api/leagues/[id]/standings` - Get league standings

### Analytics and Reporting
- `GET /api/leagues/[id]/stats` - League statistics
- `GET /api/user/stats` - User performance stats
- `GET /api/admin/metrics` - System-wide metrics