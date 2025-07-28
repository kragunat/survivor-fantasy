# Types Directory

This directory contains TypeScript type definitions for the entire application.

## Current Types ✅

### Authentication ✅
- **next-auth.d.ts** - NextAuth session type extensions
  - Adds `user.id` to session object for database operations
  - Ensures type safety for authenticated API routes
  - Matches Supabase user ID format (UUID strings)

## Inline Type Definitions ✅

Currently types are defined inline within components and API routes for rapid development. Here are the types being used:

### League Management Types ✅
```typescript
// Used in dashboard and league overview pages
interface League {
  id: string
  name: string
  season_year: number
  max_players: number
  created_at: string
  commissioner: {
    name: string
    email: string
  }
}

interface Member {
  id: string
  user_id: string
  joined_at: string
  is_eliminated: boolean
  eliminated_week?: number
  profile: {
    name: string
    email: string
  }
}

interface Pick {
  id: string
  week: number
  created_at: string
  team: {
    name: string
    abbreviation: string
  }
}

interface UserLeague {
  joined_at: string
  is_eliminated: boolean
  eliminated_week?: number
  league: League
}
```

### API Response Types ✅
```typescript
// Used across API routes
interface ApiErrorResponse {
  error: string
}

interface LeagueResponse {
  league: League
  members: Member[]
  userPicks: Pick[]
}

interface UserLeaguesResponse {
  leagues: UserLeague[]
}

interface InvitationResponse {
  invitation: Invitation
  inviteUrl?: string
}
```

### Form Types ✅
```typescript
// Used in form components
interface LeagueFormData {
  name: string
  maxPlayers: number
}

interface InviteFormData {
  email: string
}

interface JoinFormData {
  inviteCode: string
}
```

## Type Extraction Plan 🔄

### High Priority - Core Domain Types
- **league.types.ts** - League, Member, and related interfaces
- **user.types.ts** - User profile and session types
- **invitation.types.ts** - Invitation and join flow types

### Medium Priority - Feature Types
- **pick.types.ts** - Pick submission and history types
- **game.types.ts** - NFL game and team data types
- **api.types.ts** - Standardized API request/response types

### Low Priority - UI Types
- **component.types.ts** - Reusable component prop types
- **form.types.ts** - Form validation and data types
- **ui.types.ts** - Common UI patterns and variants

## Database Schema Mapping ✅

### Current Supabase Tables
Based on the schema, these types should match:

```typescript
// From supabase/schema.sql
interface DbProfile {
  id: string // UUID, references auth.users
  email: string
  name?: string
  created_at: string
  updated_at: string
}

interface DbLeague {
  id: string // UUID
  name: string
  commissioner_id: string // UUID, references profiles
  season_year: number
  max_players: number
  created_at: string
}

interface DbLeagueMember {
  id: string // UUID
  league_id: string // UUID, references leagues
  user_id: string // UUID, references profiles
  joined_at: string
  is_eliminated: boolean
  eliminated_week?: number
}

interface DbTeam {
  id: number
  name: string
  abbreviation: string
  conference: string
  division: string
}

interface DbInvitation {
  id: string // UUID
  league_id: string // UUID, references leagues
  email: string
  code: string // nanoid generated
  created_at: string
  expires_at: string
}
```

## Type Safety Patterns ✅

### API Route Validation
```typescript
// Pattern used in API routes
const session = await getServerSession(authOptions)
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
// session.user.id is now type-safe string
```

### Component Props Pattern
```typescript
// Pattern for page components
interface PageProps {
  params: Promise<{ id: string }> // Next.js 15 async params
}

// Pattern for client components
interface ComponentProps {
  leagueId: string
  onSuccess?: () => void
  className?: string
}
```

### Form State Pattern
```typescript
// Pattern used across forms
const [loading, setLoading] = useState(false)
const [error, setError] = useState('')
const [formData, setFormData] = useState<FormDataType>({
  // initial values
})
```

## Environment Type Safety ✅

### Environment Variables
Types for required environment variables:
```typescript
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_SUPABASE_URL: string
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: string
      SUPABASE_SECRET_KEY: string
      GOOGLE_CLIENT_ID: string
      GOOGLE_CLIENT_SECRET: string
      NEXTAUTH_URL: string
      NEXTAUTH_SECRET: string
    }
  }
}
```

## Future Type Generation 🔄

### Supabase Type Generation
```bash
# Generate types from Supabase schema
npx supabase gen types typescript --project-id [project-id] > src/types/database.types.ts
```

### API Type Generation
- Use OpenAPI/Swagger spec for API documentation
- Generate client types from API schema
- Ensure consistency between backend and frontend

## Type Guidelines Implementation ✅

### Current Naming Conventions
- **PascalCase** for interfaces (League, Member, Pick)
- **camelCase** for properties (leagueId, userId, createdAt)
- **snake_case** for database fields (user_id, created_at) - matches Supabase
- **Descriptive names** that indicate purpose and domain

### Error Handling Types
```typescript
// Consistent error handling pattern
try {
  const { data, error } = await supabase.from('table').select()
  if (error) {
    console.error('Database error:', error)
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 })
  }
  return NextResponse.json(data)
} catch (error: unknown) {
  console.error('Unexpected error:', error)
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
```

### Type Safety Best Practices Used ✅
- **No `any` types** - All variables have explicit types
- **Strict null checks** - Handle undefined/null values explicitly
- **Promise types** - Async operations properly typed
- **Error boundary types** - Error states properly handled
- **Form validation** - Input validation with type checking

## Next Steps 🔄

### Immediate (Next Sprint)
1. Extract inline types to dedicated files
2. Create central type index for exports
3. Add JSDoc comments for complex types
4. Implement database type generation

### Future Enhancements
1. Add runtime type validation with Zod
2. Generate API documentation from types
3. Add type testing for critical interfaces
4. Create type utilities for common patterns