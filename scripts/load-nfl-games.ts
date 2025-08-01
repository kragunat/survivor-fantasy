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

// NFL 2025-2026 season structure
const SEASON_YEAR = 2025;
const REGULAR_SEASON_WEEKS = 18;

// Team abbreviations mapping
const teamAbbreviations: Record<string, number> = {};

// Function to get team ID from abbreviation
async function getTeamMapping() {
  const { data: teams, error } = await supabase
    .from('teams')
    .select('id, abbreviation');
  
  if (error) {
    throw new Error(`Failed to fetch teams: ${error.message}`);
  }
  
  teams.forEach(team => {
    teamAbbreviations[team.abbreviation] = team.id;
  });
}

// Generate game schedule for 2025-2026 season
function generateSeasonSchedule() {
  const games: Array<{
    season_year: number;
    week: number;
    home_team_id: number;
    away_team_id: number;
    game_time: string;
  }> = [];
  
  // Get all team abbreviations
  const teams = Object.keys(teamAbbreviations);
  
  // 2025 NFL season starts in September
  const seasonStartDate = new Date('2025-09-07T17:00:00Z'); // First Sunday of September 2025
  
  // Generate games for each week
  for (let week = 1; week <= REGULAR_SEASON_WEEKS; week++) {
    const weekStartDate = new Date(seasonStartDate);
    weekStartDate.setDate(seasonStartDate.getDate() + (week - 1) * 7);
    
    // Create a simplified schedule where each team plays once per week
    const teamsCopy = [...teams];
    const usedTeams = new Set<string>();
    
    // Thursday Night Football (1 game)
    if (week > 1) { // No TNF in week 1
      const thursdayDate = new Date(weekStartDate);
      thursdayDate.setDate(weekStartDate.getDate() - 3); // Thursday before Sunday
      thursdayDate.setHours(20, 20, 0, 0); // 8:20 PM ET
      
      const availableTeams = teamsCopy.filter(t => !usedTeams.has(t));
      if (availableTeams.length >= 2) {
        const homeTeam = availableTeams[Math.floor(Math.random() * availableTeams.length)];
        usedTeams.add(homeTeam);
        const awayTeams = availableTeams.filter(t => t !== homeTeam && !usedTeams.has(t));
        const awayTeam = awayTeams[Math.floor(Math.random() * awayTeams.length)];
        usedTeams.add(awayTeam);
        
        games.push({
          season_year: SEASON_YEAR,
          week,
          home_team_id: teamAbbreviations[homeTeam],
          away_team_id: teamAbbreviations[awayTeam],
          game_time: thursdayDate.toISOString()
        });
      }
    }
    
    // Sunday games
    const sundayEarlyDate = new Date(weekStartDate);
    sundayEarlyDate.setHours(13, 0, 0, 0); // 1:00 PM ET
    
    const sundayLateDate = new Date(weekStartDate);
    sundayLateDate.setHours(16, 25, 0, 0); // 4:25 PM ET
    
    const sundayNightDate = new Date(weekStartDate);
    sundayNightDate.setHours(20, 20, 0, 0); // 8:20 PM ET
    
    // Generate Sunday 1PM games (typically 7-9 games)
    for (let i = 0; i < 8; i++) {
      const availableTeams = teamsCopy.filter(t => !usedTeams.has(t));
      if (availableTeams.length >= 2) {
        const homeTeam = availableTeams[Math.floor(Math.random() * availableTeams.length)];
        usedTeams.add(homeTeam);
        const awayTeams = availableTeams.filter(t => t !== homeTeam && !usedTeams.has(t));
        const awayTeam = awayTeams[Math.floor(Math.random() * awayTeams.length)];
        usedTeams.add(awayTeam);
        
        games.push({
          season_year: SEASON_YEAR,
          week,
          home_team_id: teamAbbreviations[homeTeam],
          away_team_id: teamAbbreviations[awayTeam],
          game_time: sundayEarlyDate.toISOString()
        });
      }
    }
    
    // Generate Sunday 4:25PM games (typically 3-4 games)
    for (let i = 0; i < 3; i++) {
      const availableTeams = teamsCopy.filter(t => !usedTeams.has(t));
      if (availableTeams.length >= 2) {
        const homeTeam = availableTeams[Math.floor(Math.random() * availableTeams.length)];
        usedTeams.add(homeTeam);
        const awayTeams = availableTeams.filter(t => t !== homeTeam && !usedTeams.has(t));
        const awayTeam = awayTeams[Math.floor(Math.random() * awayTeams.length)];
        usedTeams.add(awayTeam);
        
        games.push({
          season_year: SEASON_YEAR,
          week,
          home_team_id: teamAbbreviations[homeTeam],
          away_team_id: teamAbbreviations[awayTeam],
          game_time: sundayLateDate.toISOString()
        });
      }
    }
    
    // Sunday Night Football (1 game)
    const availableForSNF = teamsCopy.filter(t => !usedTeams.has(t));
    if (availableForSNF.length >= 2) {
      const homeTeam = availableForSNF[Math.floor(Math.random() * availableForSNF.length)];
      usedTeams.add(homeTeam);
      const awayTeams = availableForSNF.filter(t => t !== homeTeam && !usedTeams.has(t));
      const awayTeam = awayTeams[Math.floor(Math.random() * awayTeams.length)];
      usedTeams.add(awayTeam);
      
      games.push({
        season_year: SEASON_YEAR,
        week,
        home_team_id: teamAbbreviations[homeTeam],
        away_team_id: teamAbbreviations[awayTeam],
        game_time: sundayNightDate.toISOString()
      });
    }
    
    // Monday Night Football (1 game)
    const mondayDate = new Date(weekStartDate);
    mondayDate.setDate(weekStartDate.getDate() + 1); // Monday
    mondayDate.setHours(20, 15, 0, 0); // 8:15 PM ET
    
    const availableForMNF = teamsCopy.filter(t => !usedTeams.has(t));
    if (availableForMNF.length >= 2) {
      const homeTeam = availableForMNF[Math.floor(Math.random() * availableForMNF.length)];
      usedTeams.add(homeTeam);
      const awayTeams = availableForMNF.filter(t => t !== homeTeam && !usedTeams.has(t));
      const awayTeam = awayTeams[Math.floor(Math.random() * awayTeams.length)];
      usedTeams.add(awayTeam);
      
      games.push({
        season_year: SEASON_YEAR,
        week,
        home_team_id: teamAbbreviations[homeTeam],
        away_team_id: teamAbbreviations[awayTeam],
        game_time: mondayDate.toISOString()
      });
    }
  }
  
  return games;
}

// Main function to load games
async function loadNFLGames() {
  try {
    console.log('Loading NFL games for 2025-2026 season...');
    
    // First, get team mappings
    await getTeamMapping();
    console.log(`Loaded ${Object.keys(teamAbbreviations).length} teams`);
    
    // Check if games already exist for this season
    const { data: existingGames, error: checkError } = await supabase
      .from('games')
      .select('id')
      .eq('season_year', SEASON_YEAR)
      .limit(1);
    
    if (checkError) {
      throw new Error(`Failed to check existing games: ${checkError.message}`);
    }
    
    if (existingGames && existingGames.length > 0) {
      console.log('Games for 2025-2026 season already exist. Skipping...');
      return;
    }
    
    // Generate the season schedule
    const games = generateSeasonSchedule();
    console.log(`Generated ${games.length} games`);
    
    // Insert games in batches of 50
    const batchSize = 50;
    for (let i = 0; i < games.length; i += batchSize) {
      const batch = games.slice(i, i + batchSize);
      const { error } = await supabase
        .from('games')
        .insert(batch);
      
      if (error) {
        throw new Error(`Failed to insert games batch ${i / batchSize + 1}: ${error.message}`);
      }
      
      console.log(`Inserted batch ${i / batchSize + 1} of ${Math.ceil(games.length / batchSize)}`);
    }
    
    console.log('Successfully loaded all NFL games for 2025-2026 season!');
  } catch (error) {
    console.error('Error loading NFL games:', error);
    process.exit(1);
  }
}

// Run the script
loadNFLGames();