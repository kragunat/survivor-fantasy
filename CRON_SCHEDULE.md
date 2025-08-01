# Vercel Cron Job Schedule for NFL Game Data Sync

This document explains the cron job configuration in `vercel.json` for syncing NFL game data during game times.

## Schedule Overview

NFL games typically occur on:
- **Thursday Night Football**: 8:20 PM ET (12:20 AM UTC Friday)
- **Sunday Games**: 1:00 PM ET (5:00 PM UTC), 4:25 PM ET (8:25 PM UTC), 8:20 PM ET (12:20 AM UTC Monday)
- **Monday Night Football**: 8:15 PM ET (12:15 AM UTC Tuesday)

## Cron Job Configuration

```json
{
  "crons": [
    {
      "path": "/api/sync-games",
      "schedule": "* 0-4 * * 5"
    },
    {
      "path": "/api/sync-games", 
      "schedule": "* 17-23 * * 0"
    },
    {
      "path": "/api/sync-games",
      "schedule": "* 0-4 * * 1"
    },
    {
      "path": "/api/sync-games",
      "schedule": "* 0-4 * * 2"
    }
  ]
}
```

### Schedule Breakdown

1. **`"* 0-4 * * 5"`** - Friday 12:00 AM - 4:59 AM UTC
   - Covers Thursday Night Football (8:20 PM ET = 12:20 AM UTC Friday)
   - Runs every minute during this window

2. **`"* 17-23 * * 0"`** - Sunday 5:00 PM - 11:59 PM UTC
   - Covers Sunday afternoon/evening games (1:00 PM - 8:20 PM ET)
   - Runs every minute during this window

3. **`"* 0-4 * * 1"`** - Monday 12:00 AM - 4:59 AM UTC
   - Covers Sunday Night Football (8:20 PM ET = 12:20 AM UTC Monday)
   - Runs every minute during this window

4. **`"* 0-4 * * 2"`** - Tuesday 12:00 AM - 4:59 AM UTC
   - Covers Monday Night Football (8:15 PM ET = 12:15 AM UTC Tuesday)
   - Runs every minute during this window

## How It Works

1. **Automatic Triggering**: Vercel automatically calls `/api/sync-games` based on the cron schedule
2. **Season Detection**: The API checks if we're in NFL season before processing
3. **Data Sync**: Fetches live game data from ESPN API and updates the database
4. **Event Processing**: Detects scoring events and processes eliminations automatically
5. **Real-time Updates**: Broadcasts events to connected users via Server-Sent Events

## API Response Examples

### Successful Sync
```json
{
  "success": true,
  "message": "Game data sync completed successfully",
  "week": 5,
  "duration": "1250ms",
  "timestamp": "2025-10-15T20:30:00.000Z"
}
```

### Off-season Skip
```json
{
  "success": true,
  "message": "No active NFL season",
  "skipped": true,
  "timestamp": "2025-06-15T12:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Game sync failed",
  "message": "ESPN API unavailable",
  "timestamp": "2025-10-15T20:30:00.000Z"
}
```

## Monitoring

- Check Vercel Function logs for cron job execution
- Monitor API response times and success rates
- Set up alerts for consecutive failures

## Cost Considerations

- Each cron execution consumes Vercel Function invocation
- During active game windows: ~300 executions per game day
- Off-season: Jobs run but skip processing quickly
- Consider upgrading Vercel plan if approaching limits

## Manual Testing

You can manually trigger the sync:
```bash
curl -X POST https://your-app.vercel.app/api/sync-games
```

Or test locally:
```bash
curl -X GET http://localhost:3000/api/sync-games
```