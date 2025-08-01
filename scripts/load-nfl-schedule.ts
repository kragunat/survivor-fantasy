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

// ESPN API endpoints (unofficial)
const ESPN_BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';

// Team abbreviation mapping from ESPN to our database
const espnToDbAbbreviations: Record<string, string> = {
  'ARI': 'ARI', 'ATL': 'ATL', 'BAL': 'BAL', 'BUF': 'BUF',
  'CAR': 'CAR', 'CHI': 'CHI', 'CIN': 'CIN', 'CLE': 'CLE',
  'DAL': 'DAL', 'DEN': 'DEN', 'DET': 'DET', 'GB': 'GB',
  'HOU': 'HOU', 'IND': 'IND', 'JAX': 'JAX', 'KC': 'KC',
  'LAC': 'LAC', 'LAR': 'LAR', 'LV': 'LV', 'MIA': 'MIA',
  'MIN': 'MIN', 'NE': 'NE', 'NO': 'NO', 'NYG': 'NYG',
  'NYJ': 'NYJ', 'PHI': 'PHI', 'PIT': 'PIT', 'SF': 'SF',
  'SEA': 'SEA', 'TB': 'TB', 'TEN': 'TEN', 'WSH': 'WAS', // ESPN uses WSH for Washington
  'WAS': 'WAS'
};

interface ESPNGame {
  id: string;
  date: string;
  competitions: Array<{
    competitors: Array<{
      homeAway: 'home' | 'away';
      team: {
        abbreviation: string;
      };
      score?: string;
    }>;
    status: {
      type: {
        completed: boolean;
      };
    };
  }>;
}

interface ESPNScheduleResponse {
  events: ESPNGame[];
}

async function fetchWeekSchedule(year: number, seasonType: number, week: number): Promise<ESPNGame[]> {
  try {
    // ESPN API: seasontype 2 = regular season, 3 = playoffs
    const url = `${ESPN_BASE_URL}/scoreboard?dates=${year}&seasontype=${seasonType}&week=${week}`;
    console.log(`Fetching week ${week} from: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: ESPNScheduleResponse = await response.json();
    return data.events || [];
  } catch (error) {
    console.error(`Error fetching week ${week}:`, error);
    return [];
  }
}

async function loadNFLSchedule(year: number = 2025) {
  try {
    console.log(`Loading NFL schedule for ${year} season...`);
    
    // Get team mappings
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
    
    // Clear existing games for this season
    console.log(`Clearing existing ${year} season games...`);
    const { error: deleteError } = await supabase
      .from('games')
      .delete()
      .eq('season_year', year);
    
    if (deleteError) {
      throw new Error(`Failed to delete games: ${deleteError.message}`);
    }
    
    const allGames = [];
    const totalWeeks = 18; // Regular season weeks
    
    // Fetch all weeks of the regular season
    for (let week = 1; week <= totalWeeks; week++) {
      console.log(`\nFetching Week ${week}...`);
      const weekGames = await fetchWeekSchedule(year, 2, week); // 2 = regular season
      
      if (weekGames.length === 0) {
        console.log(`No games found for week ${week}`);
        continue;
      }
      
      // Process each game
      for (const game of weekGames) {
        const competition = game.competitions[0];
        const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
        const awayTeam = competition.competitors.find(c => c.homeAway === 'away');
        
        if (!homeTeam || !awayTeam) {
          console.warn(`Skipping game ${game.id} - missing team data`);
          continue;
        }
        
        const homeAbbr = espnToDbAbbreviations[homeTeam.team.abbreviation] || homeTeam.team.abbreviation;
        const awayAbbr = espnToDbAbbreviations[awayTeam.team.abbreviation] || awayTeam.team.abbreviation;
        
        const homeTeamId = teamMap[homeAbbr];
        const awayTeamId = teamMap[awayAbbr];
        
        if (!homeTeamId || !awayTeamId) {
          console.warn(`Skipping game: ${awayAbbr} @ ${homeAbbr} - team not found in database`);
          continue;
        }
        
        const gameData = {
          season_year: year,
          week: week,
          home_team_id: homeTeamId,
          away_team_id: awayTeamId,
          game_time: new Date(game.date).toISOString(),
          home_score: competition.status.type.completed && homeTeam.score ? parseInt(homeTeam.score) : null,
          away_score: competition.status.type.completed && awayTeam.score ? parseInt(awayTeam.score) : null,
          is_final: competition.status.type.completed
        };
        
        allGames.push(gameData);
        console.log(`  Added: ${awayAbbr} @ ${homeAbbr} - ${new Date(game.date).toLocaleString()}`);
      }
      
      // Add a small delay to be respectful to the API
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Insert all games in batches
    console.log(`\nInserting ${allGames.length} games into database...`);
    const batchSize = 50;
    
    for (let i = 0; i < allGames.length; i += batchSize) {
      const batch = allGames.slice(i, i + batchSize);
      const { error } = await supabase
        .from('games')
        .insert(batch);
      
      if (error) {
        throw new Error(`Failed to insert games batch: ${error.message}`);
      }
      
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(allGames.length / batchSize)}`);
    }
    
    console.log(`\nSuccessfully loaded ${allGames.length} games for the ${year} NFL season!`);
    
    // Show summary
    const { data: summary } = await supabase
      .from('games')
      .select('week')
      .eq('season_year', year);
    
    if (summary) {
      const weekCounts = summary.reduce((acc, game) => {
        acc[game.week] = (acc[game.week] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);
      
      console.log('\nGames per week:');
      Object.entries(weekCounts)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .forEach(([week, count]) => {
          console.log(`  Week ${week}: ${count} games`);
        });
    }
    
  } catch (error) {
    console.error('Error loading NFL schedule:', error);
    process.exit(1);
  }
}

// Allow running with a specific year
const year = process.argv[2] ? parseInt(process.argv[2]) : 2025;

// Run the script
loadNFLSchedule(year);