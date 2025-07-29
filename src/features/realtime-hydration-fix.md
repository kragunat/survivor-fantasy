# Realtime Subscription Hydration Fix

## Problem
React error #418 (hydration mismatch) was occurring on the league page during automatic realtime updates. The error happened when the Supabase realtime subscription triggered updates to the member list.

## Root Cause
The issue was caused by stale closures in the realtime subscription callback:

1. **Stale Function Reference**: The `fetchLeague` function was not properly memoized with `useCallback`
2. **Missing Dependencies**: The realtime subscription `useEffect` was calling `fetchLeague()` but didn't include it in the dependency array
3. **State Timing Issues**: This created inconsistent state updates that caused hydration mismatches between server and client rendering

## Solution

### 1. Memoized fetchLeague with useCallback
```typescript
const fetchLeague = useCallback(async () => {
  try {
    const response = await fetch(`/api/leagues/${leagueId}`)
    if (response.ok) {
      const data = await response.json()
      setLeague(data.league)
      setMembers(data.members)
      setUserPicks(data.userPicks)
    } else if (response.status === 403) {
      setError('You are not a member of this league')
    } else {
      setError('Failed to load league')
    }
  } catch (err) {
    setError('Network error occurred')
  } finally {
    setLoading(false)
  }
}, [leagueId])
```

### 2. Created Separate Refresh Function
```typescript
const refreshLeagueData = useCallback(async () => {
  try {
    const response = await fetch(`/api/leagues/${leagueId}`)
    if (response.ok) {
      const data = await response.json()
      setLeague(data.league)
      setMembers(data.members)
      setUserPicks(data.userPicks)
    }
  } catch (err) {
    console.error('Error refreshing league data:', err)
  }
}, [leagueId])
```

### 3. Updated useEffect Dependencies
```typescript
// Initial data loading
useEffect(() => {
  if (status === 'unauthenticated') {
    router.push('/auth/signin')
    return
  }
  
  if (status === 'authenticated') {
    fetchLeague()
  }
}, [leagueId, status, fetchLeague])

// Realtime subscription
useEffect(() => {
  if (!leagueId || status !== 'authenticated') return

  const supabase = createClient()
  
  const subscription = supabase
    .channel(`league_members:${leagueId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'league_members',
      filter: `league_id=eq.${leagueId}`
    }, (payload) => {
      console.log('Realtime update:', payload)
      refreshLeagueData() // Use separate function that doesn't affect loading state
    })
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
}, [leagueId, status, refreshLeagueData])
```

## Key Improvements

### 1. Proper Function Memoization
- `fetchLeague` is now properly memoized with `useCallback`
- Dependencies are correctly specified (`[leagueId]`)
- Prevents stale closures in event callbacks

### 2. Separation of Concerns
- `fetchLeague`: Used for initial data loading (includes loading state management)
- `refreshLeagueData`: Used for realtime updates (no loading state changes)
- Prevents UI flickering during realtime updates

### 3. Correct Dependency Arrays
- All useEffect hooks now include their function dependencies
- React can properly track when effects should re-run
- Eliminates stale closure issues

### 4. Stable References
- Functions are stable between renders when dependencies don't change
- Realtime subscriptions don't recreate unnecessarily
- Consistent state updates across renders

## Benefits

### 1. Eliminated Hydration Errors
- No more React error #418 during realtime updates
- Consistent rendering between server and client
- Stable component behavior

### 2. Better Performance
- Reduced unnecessary re-subscriptions
- More efficient state updates
- No UI flickering during updates

### 3. Improved User Experience
- Seamless realtime updates
- No page errors or crashes
- Smooth member list updates

## Testing
- Build compiles successfully without warnings
- Realtime subscription works correctly
- No hydration mismatches in browser console
- Member list updates smoothly when players join/leave

## Future Considerations
- Consider adding debouncing for rapid successive updates
- Add error boundaries for realtime subscription failures
- Implement optimistic updates for better perceived performance