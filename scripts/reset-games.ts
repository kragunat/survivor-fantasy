import { createClient } from '@supabase/supabase-js';
import { Database } from '../src/types/database';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Initialize Supabase client with service role key for admin access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing required environment variables');
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceRoleKey);

// NFL 2025 Season - Week 1 Schedule (example - you'd want real schedule data)
// This is a more realistic schedule with actual NFL matchups
const week1Games = [
  // Thursday Night Football - Season Opener
  { home: 'KC', away: 'DET', day: 'thursday', slot: 'night' },
  
  // Sunday Early Games (1:00 PM ET)
  { home: 'BUF', away: 'ARI', day: 'sunday', slot: 'early' },
  { home: 'CHI', away: 'TEN', day: 'sunday', slot: 'early' },
  { home: 'CLE', away: 'DAL', day: 'sunday', slot: 'early' },
  { home: 'IND', away: 'HOU', day: 'sunday', slot: 'early' },
  { home: 'MIA', away: 'JAX', day: 'sunday', slot: 'early' },
  { home: 'NO', away: 'CAR', day: 'sunday', slot: 'early' },
  { home: 'NYJ', away: 'NE', day: 'sunday', slot: 'early' },
  { home: 'PIT', away: 'ATL', day: 'sunday', slot: 'early' },
  
  // Sunday Late Games (4:05/4:25 PM ET)
  { home: 'DEN', away: 'SEA', day: 'sunday', slot: 'late' },
  { home: 'LV', away: 'LAC', day: 'sunday', slot: 'late' },
  { home: 'PHI', away: 'GB', day: 'sunday', slot: 'late' },
  { home: 'WAS', away: 'TB', day: 'sunday', slot: 'late' },
  
  // Sunday Night Football
  { home: 'LAR', away: 'CIN', day: 'sunday', slot: 'night' },
  
  // Monday Night Football (two games)
  { home: 'SF', away: 'NYG', day: 'monday', slot: 'night' },
  { home: 'BAL', away: 'MIN', day: 'monday', slot: 'night2' }
];

// Function to get game time based on day and slot
function getGameTime(weekStart: Date, day: string, slot: string): Date {
  const gameTime = new Date(weekStart);
  
  switch (day) {
    case 'thursday':
      gameTime.setDate(weekStart.getDate() - 3); // Thursday before Sunday
      gameTime.setHours(20, 20, 0, 0); // 8:20 PM ET
      break;
    case 'sunday':
      // Sunday is the base date
      switch (slot) {
        case 'early':
          gameTime.setHours(13, 0, 0, 0); // 1:00 PM ET
          break;
        case 'late':
          gameTime.setHours(16, 25, 0, 0); // 4:25 PM ET
          break;
        case 'night':
          gameTime.setHours(20, 20, 0, 0); // 8:20 PM ET
          break;
      }
      break;
    case 'monday':
      gameTime.setDate(weekStart.getDate() + 1); // Monday after Sunday
      if (slot === 'night2') {
        gameTime.setHours(20, 15, 0, 0); // 8:15 PM ET (second game)
      } else {
        gameTime.setHours(20, 15, 0, 0); // 8:15 PM ET
      }
      break;
  }
  
  return gameTime;
}

async function resetAndLoadGames() {
  try {
    console.log('Resetting NFL games for 2025 season...');
    
    // First, get team mappings
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, abbreviation');
    
    if (teamsError || !teams) {
      throw new Error(`Failed to fetch teams: ${teamsError?.message}`);
    }
    
    const teamMap: Record<string, number> = {};
    teams.forEach(team => {
      teamMap[team.abbreviation] = team.id;
    });
    
    // Delete existing games for 2025 season
    console.log('Deleting existing 2025 season games...');
    const { error: deleteError } = await supabase
      .from('games')
      .delete()
      .eq('season_year', 2025);
    
    if (deleteError) {
      throw new Error(`Failed to delete games: ${deleteError.message}`);
    }
    
    // Create games for Week 1 (as an example)
    const seasonStartDate = new Date('2025-09-07T17:00:00Z'); // First Sunday of September 2025
    const week1GamesData = week1Games.map(game => ({
      season_year: 2025,
      week: 1,
      home_team_id: teamMap[game.home],
      away_team_id: teamMap[game.away],
      game_time: getGameTime(seasonStartDate, game.day, game.slot).toISOString(),
      home_score: null,
      away_score: null,
      is_final: false
    }));
    
    // Insert Week 1 games
    const { error: insertError } = await supabase
      .from('games')
      .insert(week1GamesData);
    
    if (insertError) {
      throw new Error(`Failed to insert games: ${insertError.message}`);
    }
    
    console.log(`Successfully loaded ${week1GamesData.length} games for Week 1`);
    console.log('\nWeek 1 Schedule:');
    
    // Display the schedule
    const { data: insertedGames, error: fetchError } = await supabase
      .from('games')
      .select(`
        *,
        home_team:teams!games_home_team_id_fkey(name, abbreviation),
        away_team:teams!games_away_team_id_fkey(name, abbreviation)
      `)
      .eq('season_year', 2025)
      .eq('week', 1)
      .order('game_time');
    
    if (!fetchError && insertedGames) {
      insertedGames.forEach(game => {
        const gameDate = new Date(game.game_time);
        const dayName = gameDate.toLocaleDateString('en-US', { weekday: 'long' });
        const time = gameDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        console.log(`${dayName} ${time}: ${game.away_team.name} @ ${game.home_team.name}`);
      });
    }
    
    console.log('\nNote: This is a sample Week 1 schedule. For a complete season, you would need to:');
    console.log('1. Get the official NFL schedule data');
    console.log('2. Load all 18 weeks of games');
    console.log('3. Handle bye weeks appropriately');
    
  } catch (error) {
    console.error('Error resetting games:', error);
    process.exit(1);
  }
}

// Run the script
resetAndLoadGames();