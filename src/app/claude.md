# App Directory

This directory contains all Next.js App Router pages and API routes.

## Structure

### Pages
- **page.tsx** - Landing page with hero section and CTAs
- **layout.tsx** - Root layout with global styles and metadata
- **auth/** - Authentication-related pages
  - **signin/page.tsx** - Sign in/up page with email and Google OAuth
- **dashboard/** - Protected pages for authenticated users
  - **page.tsx** - Main dashboard showing user's leagues

### API Routes
- **api/auth/[...nextauth]/** - NextAuth.js authentication endpoints
- **api/auth/signup/** - Custom signup endpoint for Supabase

## Key Patterns

### Authentication Flow
1. User visits protected page
2. NextAuth checks session
3. Redirect to /auth/signin if not authenticated
4. After auth, redirect back to intended page

### Protected Pages Pattern
```typescript
const session = await getServerSession(authOptions)
if (!session) {
  redirect('/auth/signin')
}
```

### Styling Approach
- Tailwind CSS classes for all styling
- Custom color palette using `primary-*` classes
- Responsive design with Tailwind breakpoints

## Planned Features
- **leagues/** - League management pages
  - Create league
  - League settings
  - Invite members
- **picks/** - Weekly pick submission
- **standings/** - League standings and eliminations

## API Design Principles
- RESTful endpoints for CRUD operations
- Server-side validation for all inputs
- Consistent error response format
- Use Supabase admin client only when needed