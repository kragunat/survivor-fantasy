# Supabase Realtime Configuration Guide

## Required Supabase Settings

### 1. Enable Realtime for Tables

**Navigate to:** Database → Replication

**Tables to Enable:**
- ✅ `league_members` (required for member updates)
- ✅ `leagues` (optional, for future features)
- ✅ `picks` (optional, for future pick updates)

**Steps:**
1. Go to your Supabase project dashboard
2. Click **Database** in the sidebar
3. Click **Replication** tab
4. Find `league_members` in the table list
5. Toggle the **Enable** switch for this table
6. The table should show as "Enabled" with a green indicator

### 2. Verify Realtime is Enabled Project-Wide

**Navigate to:** Settings → API

**Check for:**
- Realtime URL should be displayed
- WebSocket connection should be available
- If missing, realtime may not be enabled for your project

### 3. Row Level Security (RLS) Policies

**Current Policies Needed:**
```sql
-- Allow authenticated users to read league_members for leagues they belong to
CREATE POLICY "Users can read league members for their leagues" ON league_members
FOR SELECT USING (
  auth.uid() IN (
    SELECT user_id FROM league_members lm2 
    WHERE lm2.league_id = league_members.league_id
  )
);

-- Allow authenticated users to insert themselves into leagues (via invites)
CREATE POLICY "Users can join leagues via invites" ON league_members
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow commissioners to delete league members
CREATE POLICY "Commissioners can remove league members" ON league_members
FOR DELETE USING (
  auth.uid() IN (
    SELECT commissioner_id FROM leagues 
    WHERE leagues.id = league_members.league_id
  )
);
```

### 4. Test Realtime Connection

**Using the RealtimeTest Component:**
1. Navigate to any league page
2. Look for the "Realtime Test" box (temporarily added)
3. Status should show:
   - **🟡 connecting** → **🟢 connected** (good)
   - **🔴 error** (indicates configuration issue)

**Console Testing:**
Open browser developer tools and look for:
```
Testing realtime connection...
Realtime test - subscription status: SUBSCRIBED
```

## Common Issues & Solutions

### Issue 1: "Realtime not enabled for table"
**Symptoms:** Status shows "error", console shows subscription failed
**Solution:** Enable realtime for `league_members` table in Database → Replication

### Issue 2: "RLS policy prevents subscription"
**Symptoms:** Subscription connects but no updates received
**Solution:** Update RLS policies to allow SELECT for authenticated users on their leagues

### Issue 3: "WebSocket connection failed"
**Symptoms:** Status stuck on "connecting"
**Solution:** 
- Check if realtime is enabled project-wide
- Verify network/firewall allows WebSocket connections
- Try from different network

### Issue 4: "Project doesn't support realtime"
**Symptoms:** No realtime URL in Settings → API
**Solution:** Realtime might not be available on your plan or region

## Testing Steps

### Manual Test Procedure:
1. **Open league page** - Check RealtimeTest shows "connected"
2. **Open second browser window** - Navigate to invitation link
3. **Join league** - Complete the join process
4. **Verify update** - First window should show new member instantly
5. **Check console** - Look for "Realtime update received" messages

### Expected Console Output:
```
Setting up realtime subscription for league: [league-id]
Testing realtime connection...
Realtime test - subscription status: SUBSCRIBED
Subscription status: SUBSCRIBED
Successfully subscribed to league_members changes
// When someone joins:
Realtime test - received update: {eventType: "INSERT", new: {...}, old: null}
Realtime update received: {eventType: "INSERT", new: {...}, old: null}
```

## Supabase Dashboard Checklist

### ✅ Database → Replication
- [ ] `league_members` table is enabled
- [ ] Shows green "Enabled" indicator

### ✅ Settings → API  
- [ ] Realtime URL is displayed
- [ ] anon/service role keys are correct

### ✅ Authentication → Policies
- [ ] RLS policies allow authenticated users to read league_members
- [ ] Policies don't block realtime subscriptions

### ✅ Settings → Database
- [ ] Connection pooling settings (if applicable)
- [ ] No connection limits blocking realtime

## Alternative: Supabase CLI Check

If you have Supabase CLI installed:
```bash
supabase projects list
supabase db pull
# Check if realtime is configured in your schema
```

## Environment Variables

Ensure these are set correctly:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## After Configuration

Once you've enabled realtime in Supabase:
1. **Refresh the league page** 
2. **Check RealtimeTest status** - should show "connected"
3. **Test with actual invite** - join from another window
4. **Remove test component** - once confirmed working

## Removing Test Component

Once realtime is working, remove the test:
```typescript
// Remove this line from leagues/[id]/page.tsx:
import { RealtimeTest } from '@/components/RealtimeTest'

// Remove this JSX:
<RealtimeTest />
```

The main realtime subscription in the league page will then work correctly for live member updates.