# Join League Page - Server/Client Architecture Pattern

This directory demonstrates the proper pattern for handling Next.js 15 async params with client-side hooks.

## Architecture ✅

### Server Component (`page.tsx`) ✅
- Handles async `params` resolution from Next.js 15
- No client-side hooks or state
- Clean separation of server-side logic

```typescript
export default async function JoinLeague({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  
  return <JoinLeagueWrapper code={code} />
}
```

### Client Wrapper Component (`wrapper.tsx`) ✅
- Client component that handles dynamic imports
- Uses `ssr: false` to prevent server-side rendering of hooks
- Provides loading states during component hydration

```typescript
'use client'
const JoinLeagueClient = dynamic(() => import('./client'), {
  ssr: false,
  loading: () => <div>Loading...</div>
})

export default function JoinLeagueWrapper({ code }: { code: string }) {
  return <JoinLeagueClient code={code} />
}
```

### Client Component (`client.tsx`) ✅
- Marked with `'use client'` directive
- Contains all hooks and interactive logic:
  - `useSession()` for authentication
  - `useRouter()` for navigation
  - `useState()` for component state
  - `useEffect()` for side effects

## Problem Solved ✅

### Previous Issue
Mixed server and client components caused:
```
TypeError: Cannot destructure property 'data' of '(0 , f.useSession)(...)' as it is undefined
```

### Root Cause
- Async server function trying to use client-side hooks
- Next.js attempting server-side rendering of `useSession()` hook
- Incorrect component boundary between server and client code

### Solution Applied
1. **Three-layer architecture**: Server component → Client wrapper → Client implementation
2. **Dynamic imports with SSR disabled**: Prevents server-side execution of hooks
3. **Defensive destructuring**: Added null checks for `useSession()` result
4. **Proper boundaries**: Clear separation between server-side and client-side logic

## Features Implemented ✅

### Automatic League Joining
- Fetches invitation details on page load
- Auto-joins authenticated users to league
- Handles authentication flow for new users

### Error Handling
- Invalid invitation codes
- Network errors
- Authentication failures
- User-friendly error messages

### Authentication Flow
- Redirects unauthenticated users to sign-in
- Preserves invitation code in callback URL
- Seamless return to join flow after authentication

## Technical Implementation ✅

### Session Management
```typescript
const sessionResult = useSession()
const { data: session, status } = sessionResult || { data: null, status: 'loading' }
```

### API Integration
- `/api/invitations/[code]` - Fetch invitation details
- `/api/invitations/[code]/accept` - Accept league invitation
- Proper error handling for API responses

### UI States
- Loading states during invitation fetch
- Joining states during league acceptance  
- Error states with navigation options
- Success navigation to league page

## Next.js 15 Compatibility ✅

### Async Params Pattern
Properly handles the new Next.js 15 async params requirement:
```typescript
// Server component
const { code } = await params

// Pass to client component
<JoinLeagueClient code={code} />
```

### Build Optimization
- Server component: Minimal bundle size
- Client component: Contains interactive functionality
- Proper code splitting between server and client