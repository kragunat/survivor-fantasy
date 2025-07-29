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
✅ **Bulma CSS** - Modern CSS framework similar to Sleeper app styling for clean, responsive UI

## Database Schema (Planned)

### Core Tables
- **users**: id, email, name, created_at
- **leagues**: id, name, commissioner_id, created_at, season_year
- **league_members**: league_id, user_id, joined_at, is_eliminated
- **teams**: id, name, abbreviation (32 NFL teams)
- **games**: id, week, home_team_id, away_team_id, home_score, away_score, game_time
- **picks**: id, league_member_id, week, team_id, created_at
- **invitations**: id, league_id, email, code, expires_at

## Implementation Status

### Completed Features ✅
1. **Database Setup**: Supabase PostgreSQL with full schema implemented
2. **Authentication**: NextAuth.js with email/password and Google OAuth
3. **League Management**: 
   - Create leagues with commissioners
   - Invite system with unique codes and expiration
   - Join leagues via invite links
   - League overview pages showing members and picks
   - **Commissioner Controls**: Remove players with confirmation dialog
   - **Realtime Updates**: Live member list updates using Supabase subscriptions
4. **Dashboard**: Shows user's leagues with status and quick access
5. **User Flow**: Complete sign-up → create/join league → view league workflow
6. **Enhanced Signup**: Seamless invite-to-signup-to-join flow preserving context

### Next Steps 🔄
1. Implement NFL data integration (ESPN API)
2. Build weekly pick submission interface
3. Add game outcome tracking and elimination logic
4. Build league standings and history views
5. Add real-time notifications for picks and results

## Documentation Structure

Detailed documentation for each part of the codebase can be found in claude.md files throughout the src directory:

- **src/claude.md** - Overall source code architecture
- **src/app/claude.md** - Pages and routing structure
- **src/app/api/claude.md** - API routes documentation
- **src/lib/claude.md** - Utilities and configurations
- **src/components/claude.md** - Component library plans
- **src/types/claude.md** - TypeScript type definitions

These files provide context for AI assistants and developers working on specific parts of the codebase.