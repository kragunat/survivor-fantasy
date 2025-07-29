# Commissioner Controls

## Overview
League commissioners have special administrative privileges within their leagues, including the ability to manage league membership.

## Features Implemented

### Remove Players ✅

**Implementation Details:**
- Only commissioners can remove players from their leagues
- Commissioners cannot remove themselves from the league
- Commissioners cannot remove other commissioners
- Includes confirmation dialog to prevent accidental removals
- Real-time UI updates when members are removed

**User Experience:**
1. Commissioner views league member list
2. "Remove" button appears next to eligible members (non-commissioners, not themselves)
3. Click "Remove" opens confirmation dialog
4. Confirm removal to delete member from league
5. Member list updates immediately via optimistic update + realtime subscription

**API Endpoint:**
```typescript
DELETE /api/leagues/[id]/members/[memberId]
```

**Security Features:**
- Verifies user is authenticated
- Confirms user is commissioner of the specific league
- Prevents self-removal
- Prevents removal of other commissioners
- Uses admin client to bypass RLS for deletion

**Code Locations:**
- API: `/src/app/api/leagues/[id]/members/[memberId]/route.ts`
- UI: `/src/app/leagues/[id]/page.tsx` (lines 356-362 for remove button, 405-429 for confirmation dialog)

## User Interface

### Remove Button
- Appears only for commissioners
- Only shown for removable members (not self, not other commissioners)
- Disabled state while removal is in progress
- Red styling to indicate destructive action

### Confirmation Dialog
- Modal overlay with confirmation message
- Cancel and Remove actions
- Loading state during API call
- Clear warning about action being irreversible

## Technical Implementation

### Frontend State Management
```typescript
const [removingMember, setRemovingMember] = useState<string | null>(null)
const [showRemoveConfirm, setShowRemoveConfirm] = useState<string | null>(null)
```

### Remove Function
```typescript
const handleRemoveMember = async (memberId: string) => {
  // Optimistic update + API call + error handling
}
```

### Permission Check
```typescript
const isCommissioner = league.commissioner.email === session.user?.email

// In JSX:
{isCommissioner && 
 member.user_id !== session.user?.id && 
 league.commissioner.email !== member.profile.email && (
  // Remove button
)}
```

## Integration with Realtime

The remove functionality integrates seamlessly with the realtime subscription system:
1. Member is removed via API
2. Optimistic update removes member from local state immediately
3. Realtime subscription detects database change
4. All connected clients receive the update automatically
5. No manual refresh needed for any league viewers

## Future Enhancements

1. **Bulk Operations**: Select and remove multiple members at once
2. **Member Roles**: Support for different member roles beyond commissioner
3. **Audit Log**: Track when members are removed and by whom
4. **Undo Functionality**: Short window to undo member removal
5. **Member Transfer**: Transfer ownership between commissioners