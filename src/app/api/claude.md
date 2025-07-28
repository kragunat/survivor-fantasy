# API Routes Directory

This directory contains all Next.js API route handlers.

## Current Routes

### Authentication (/api/auth)
- **/[...nextauth]/** - NextAuth.js dynamic route
  - Handles all auth operations (signin, signout, callback)
  - Configured in lib/auth-options.ts
  
- **/signup/** - Custom Supabase signup
  - Creates user in Supabase Auth
  - Triggers profile creation via database trigger

## Planned API Routes

### League Management (/api/leagues)
- **POST /** - Create new league
- **GET /:id** - Get league details
- **PUT /:id** - Update league settings
- **POST /:id/invite** - Generate invitation code
- **POST /join** - Join league with code

### Pick Management (/api/picks)
- **POST /** - Submit weekly pick
- **GET /my-picks** - Get user's picks
- **GET /league/:id/week/:week** - Get league picks for week

### Game Data (/api/games)
- **GET /week/:week** - Get games for specific week
- **POST /sync** - Sync game data from external API
- **GET /current-week** - Get current NFL week

### Admin Routes (/api/admin)
- **POST /games/update** - Update game scores
- **POST /process-eliminations** - Process weekly eliminations

## API Design Standards

### Request/Response Format
```typescript
// Success Response
{
  "success": true,
  "data": { ... }
}

// Error Response
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Authentication Pattern
```typescript
const session = await getServerSession(authOptions)
if (!session) {
  return NextResponse.json(
    { success: false, error: 'Unauthorized' },
    { status: 401 }
  )
}
```

### Error Handling
- Validate all inputs
- Return appropriate HTTP status codes
- Log errors for debugging
- Don't expose internal errors to client

### Rate Limiting
- Implement rate limiting for public endpoints
- Higher limits for authenticated users
- Special consideration for admin endpoints

## Security Considerations
- Always validate session for protected routes
- Sanitize user inputs
- Use parameterized queries
- Implement CORS if needed
- Add request logging for audit trail