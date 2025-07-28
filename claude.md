This repository is meant to be for a variation on a fantasy football site, known as a "survivor league". 
A survivor league is a lightweight way for people to get into fantasy football where the only choice that they make on a week to week basis is just selecting a single NFL team to win that week. The only catch is that they can only select a team once per season. 
If a person's selected team loses they are out for the season at that point. 
This website should offer a few different forms of functionality:
1. Sign up both for league comissioners and regular players in the league.
2. The functionality to create and invite players to the league.
3. Tracking selections and outcomes - ideally by referencing some API for game records.


This site is meant to be deployed onto vercel and will be done via the UI of vercel for importing the github repository.

## Technical Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

### Project Structure
```
src/
├── app/          # Next.js app router pages
├── components/   # Reusable React components
├── lib/          # Utility functions, API clients, database connections
└── types/        # TypeScript type definitions
```

### Development Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server

## Technical Decisions

### Database
✅ **Supabase** - Provides PostgreSQL with built-in auth, real-time features, and easy hosting
- Using new API key format (`sb_publishable_*` and `sb_secret_*`) to avoid migration issues

### Authentication
✅ **NextAuth.js** - Integrated with Supabase for email/password and Google OAuth support

### NFL Data API
🔄 **ESPN API** (planned) - Starting with unofficial free API for game data

### Design System
✅ **Tailwind CSS** with custom blue and white color palette for clean, modern UI

## Database Schema (Planned)

### Core Tables
- **users**: id, email, name, created_at
- **leagues**: id, name, commissioner_id, created_at, season_year
- **league_members**: league_id, user_id, joined_at, is_eliminated
- **teams**: id, name, abbreviation (32 NFL teams)
- **games**: id, week, home_team_id, away_team_id, home_score, away_score, game_time
- **picks**: id, league_member_id, week, team_id, created_at
- **invitations**: id, league_id, email, code, expires_at

## Next Steps
1. Choose and implement database solution
2. Set up authentication
3. Create basic pages (login, dashboard, league management)
4. Implement NFL data integration
5. Build pick submission and tracking features