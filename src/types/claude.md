# Types Directory

This directory contains TypeScript type definitions for the entire application.

## Current Types

### Authentication
- **next-auth.d.ts** - NextAuth session type extensions
  - Adds user.id to session
  - Ensures type safety for auth operations

## Planned Type Definitions

### Database Types
- **database.types.ts** - Supabase generated types
  - Table schemas
  - View types
  - Function parameters
  - Enums

### Domain Types
- **league.types.ts**
  ```typescript
  interface League {
    id: string
    name: string
    commissionerId: string
    seasonYear: number
    maxPlayers: number
    createdAt: Date
  }
  ```

- **pick.types.ts**
  ```typescript
  interface Pick {
    id: string
    leagueMemberId: string
    week: number
    teamId: number
    createdAt: Date
  }
  ```

- **game.types.ts**
  ```typescript
  interface Game {
    id: number
    week: number
    homeTeamId: number
    awayTeamId: number
    homeScore?: number
    awayScore?: number
    gameTime: Date
    isFinal: boolean
  }
  ```

### API Types
- **api.types.ts** - API request/response types
  ```typescript
  interface ApiResponse<T> {
    data?: T
    error?: string
  }
  ```

### UI Types
- **ui.types.ts** - Component prop types
  ```typescript
  type Variant = 'primary' | 'secondary' | 'danger'
  type Size = 'sm' | 'md' | 'lg'
  ```

## Type Guidelines

### Naming Conventions
- Use PascalCase for interfaces and types
- Prefix with 'I' only if avoiding naming conflicts
- Be descriptive but concise
- Group related types in same file

### Best Practices
- Prefer interfaces over type aliases for objects
- Use enums for fixed sets of values
- Export all types that cross module boundaries
- Document complex types with JSDoc comments
- Avoid using 'any' - use 'unknown' if type is truly unknown

### Database Type Sync
- Generate types from Supabase schema
- Keep types in sync with database changes
- Use generated types as source of truth
- Extend generated types when needed