# App Directory - Next.js 15 App Router

This directory contains all Next.js App Router pages and API routes for the Survivor Fantasy League application.

## Current Structure

### Core Pages ✅
- **page.tsx** - Landing page with hero section and CTAs
- **layout.tsx** - Root layout with SessionProvider and global styles
- **providers.tsx** - Client-side providers (NextAuth SessionProvider)

### Authentication Pages ✅
- **auth/signin/page.tsx** - Sign in/up page with email and Google OAuth, wrapped in Suspense for static generation

### Dashboard ✅
- **dashboard/page.tsx** - User dashboard showing all leagues with status and quick actions
- **dashboard/layout.tsx** - Dynamic layout to prevent static generation

### League Management ✅
- **leagues/create/page.tsx** - Create new league form with validation and error handling
- **leagues/create/layout.tsx** - Dynamic layout
- **leagues/join/page.tsx** - Manual invitation code entry form
- **leagues/join/layout.tsx** - Dynamic layout
- **leagues/[id]/page.tsx** - League overview showing members, picks, and league details
- **leagues/[id]/layout.tsx** - Dynamic layout

### Invitation System ✅
- **join/[code]/page.tsx** - Client-only component using useParams() hook
- **join/[code]/client.tsx** - Client component with useSession hook and invitation logic

### API Routes ✅
- **api/auth/[...nextauth]/route.ts** - NextAuth.js authentication endpoints
- **api/auth/signup/route.ts** - Custom signup endpoint for Supabase
- **api/leagues/route.ts** - Create leagues endpoint
- **api/leagues/[id]/route.ts** - Get league details, members, and user picks
- **api/leagues/[id]/invite/route.ts** - Create league invitations with unique codes
- **api/invitations/[code]/route.ts** - Get invitation details for validation
- **api/invitations/[code]/accept/route.ts** - Accept league invitations
- **api/user/leagues/route.ts** - Get user's leagues for dashboard

## Implementation Patterns

### Authentication Flow ✅
1. SessionProvider wraps entire app in layout
2. `useSession()` hook for client-side auth state
3. Protected pages redirect to signin if not authenticated
4. Invite links preserve destination after auth

### Dynamic Rendering
All pages using `useSession()` require dynamic rendering:
```typescript
// In layout.tsx
export const dynamic = 'force-dynamic'
```

### Error Handling Pattern
```typescript
const [error, setError] = useState('')
// API call with try/catch
if (!response.ok) {
  const errorData = await response.json()
  setError(errorData.error || 'Operation failed')
}
```

### League Access Control
```typescript
// Check league membership in API routes
const { data: membership } = await supabase
  .from('league_members')
  .select('id')
  .eq('league_id', leagueId)
  .eq('user_id', session.user.id)
  .single()
```

## Database Integration

### Admin Client Usage
API routes use admin client for bypass RLS:
```typescript
import { createAdminClient } from '@/lib/supabase/admin'
const supabase = createAdminClient()
```

### Session Validation
All protected API routes validate NextAuth session:
```typescript
const session = await getServerSession(authOptions)
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

## User Experience Features

### Dashboard ✅
- Shows all user's leagues with status indicators
- Commissioner status with crown emoji
- Elimination status with week number
- Quick "View League" access buttons
- Loading states and empty states

### League Overview ✅
- Member list with join dates and elimination status
- User's personal picks history
- Commissioner controls with functional "Invite Players" button
- League statistics and information
- Invitation link generation with copy functionality
- Real-time invite link display with expiration notice

### Invitation System ✅
- Unique codes with 7-day expiration using nanoid(12)
- Generic invite links without requiring specific emails
- Automatic league joining for authenticated users
- Seamless auth flow for new users via join/[code] pages
- Commissioner-only invite generation with proper authorization
- Copy-to-clipboard functionality with success feedback
- Real-time invite link display in expandable UI section

## Technical Considerations

### Static Generation Issues
- All pages with session hooks need dynamic layouts
- Suspense boundaries for proper loading states
- Client component wrappers for server-side compatibility

### Session Management ✅
- **Defensive useSession pattern**: Added null checks to prevent destructuring errors
```typescript
// Pattern used across all components
const sessionResult = useSession()
const { data: session, status } = sessionResult || { data: null, status: 'loading' }
```
- **Hydration safety**: Prevents "Cannot destructure property" errors during SSR/CSR transitions
- **Server/Client separation**: Proper separation of async server components and client components using hooks
- **Admin client usage**: API routes use `createAdminClient()` to bypass RLS for invite operations

### Type Safety
```typescript
interface League {
  id: string
  name: string
  season_year: number
  commissioner: {
    name: string
    email: string
  }
}
```

### Performance Optimizations
- Efficient database queries with joins
- Loading states for better UX
- Error boundaries for graceful failures

## Next Steps 🔄
1. Add league settings page for commissioners
2. Build weekly pick submission interface (`/leagues/[id]/picks`)
3. Implement game data integration
4. Add standings page (`/leagues/[id]/standings`)
5. Build pick history and analytics views