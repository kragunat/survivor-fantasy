# Source Code Structure

This directory contains all the application source code for the Survivor Fantasy League website.

## Directory Structure

- **app/** - Next.js App Router pages and API routes
- **components/** - Reusable React components
- **lib/** - Utility functions, API clients, and configurations
- **types/** - TypeScript type definitions

## Key Architectural Decisions

### Frontend Architecture
- Using Next.js App Router for better performance and server components
- TypeScript for type safety throughout the application
- Tailwind CSS with custom blue/white theme for consistent styling

### State Management
- Server state managed via Supabase queries
- Client state using React hooks (useState, useContext)
- Session state managed by NextAuth.js

### Data Flow
1. User actions trigger API calls or server actions
2. Authentication checked via NextAuth.js middleware
3. Database operations through Supabase clients (regular or admin)
4. Row Level Security (RLS) enforces data access rules
5. UI updates reactively based on data changes

## Security Considerations
- Never expose secret keys to client-side code
- Use environment variables for all sensitive configuration
- Implement proper authentication checks before data access
- Leverage Supabase RLS for database-level security

## Performance Optimizations
- Server Components by default for better initial load
- Client Components only when interactivity needed
- Image optimization through Next.js Image component
- Code splitting happens automatically via App Router