# NFL Games Loader Script

This script loads the NFL games schedule for the 2025-2026 season into the database.

## Setup

1. Make sure you have the required environment variables set:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (admin access)

2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

Run the script to load all NFL games for the 2025-2026 season:

```bash
npm run load-games
```

## What it does

The script:
1. Fetches all NFL teams from the database
2. Generates a complete 18-week regular season schedule
3. Creates games with appropriate time slots:
   - Thursday Night Football (8:20 PM ET) - Starting week 2
   - Sunday Early Games (1:00 PM ET) - 7-9 games
   - Sunday Late Games (4:25 PM ET) - 3-4 games
   - Sunday Night Football (8:20 PM ET) - 1 game
   - Monday Night Football (8:15 PM ET) - 1 game
4. Ensures each team plays exactly once per week
5. Prevents duplicate game loading for the same season

## Notes

- The script uses a simplified scheduling algorithm that randomly assigns matchups
- For production use, you would want to integrate with an actual NFL schedule API
- Game times are stored in UTC format in the database
- The script checks for existing games before inserting to prevent duplicates