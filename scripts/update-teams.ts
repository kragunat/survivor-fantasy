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

// Complete list of NFL teams with correct data
const nflTeams = [
  { name: 'Arizona Cardinals', abbreviation: 'ARI', conference: 'NFC', division: 'West' },
  { name: 'Atlanta Falcons', abbreviation: 'ATL', conference: 'NFC', division: 'South' },
  { name: 'Baltimore Ravens', abbreviation: 'BAL', conference: 'AFC', division: 'North' },
  { name: 'Buffalo Bills', abbreviation: 'BUF', conference: 'AFC', division: 'East' },
  { name: 'Carolina Panthers', abbreviation: 'CAR', conference: 'NFC', division: 'South' },
  { name: 'Chicago Bears', abbreviation: 'CHI', conference: 'NFC', division: 'North' },
  { name: 'Cincinnati Bengals', abbreviation: 'CIN', conference: 'AFC', division: 'North' },
  { name: 'Cleveland Browns', abbreviation: 'CLE', conference: 'AFC', division: 'North' },
  { name: 'Dallas Cowboys', abbreviation: 'DAL', conference: 'NFC', division: 'East' },
  { name: 'Denver Broncos', abbreviation: 'DEN', conference: 'AFC', division: 'West' },
  { name: 'Detroit Lions', abbreviation: 'DET', conference: 'NFC', division: 'North' },
  { name: 'Green Bay Packers', abbreviation: 'GB', conference: 'NFC', division: 'North' },
  { name: 'Houston Texans', abbreviation: 'HOU', conference: 'AFC', division: 'South' },
  { name: 'Indianapolis Colts', abbreviation: 'IND', conference: 'AFC', division: 'South' },
  { name: 'Jacksonville Jaguars', abbreviation: 'JAX', conference: 'AFC', division: 'South' },
  { name: 'Kansas City Chiefs', abbreviation: 'KC', conference: 'AFC', division: 'West' },
  { name: 'Las Vegas Raiders', abbreviation: 'LV', conference: 'AFC', division: 'West' },
  { name: 'Los Angeles Chargers', abbreviation: 'LAC', conference: 'AFC', division: 'West' },
  { name: 'Los Angeles Rams', abbreviation: 'LAR', conference: 'NFC', division: 'West' },
  { name: 'Miami Dolphins', abbreviation: 'MIA', conference: 'AFC', division: 'East' },
  { name: 'Minnesota Vikings', abbreviation: 'MIN', conference: 'NFC', division: 'North' },
  { name: 'New England Patriots', abbreviation: 'NE', conference: 'AFC', division: 'East' },
  { name: 'New Orleans Saints', abbreviation: 'NO', conference: 'NFC', division: 'South' },
  { name: 'New York Giants', abbreviation: 'NYG', conference: 'NFC', division: 'East' },
  { name: 'New York Jets', abbreviation: 'NYJ', conference: 'AFC', division: 'East' },
  { name: 'Philadelphia Eagles', abbreviation: 'PHI', conference: 'NFC', division: 'East' },
  { name: 'Pittsburgh Steelers', abbreviation: 'PIT', conference: 'AFC', division: 'North' },
  { name: 'San Francisco 49ers', abbreviation: 'SF', conference: 'NFC', division: 'West' },
  { name: 'Seattle Seahawks', abbreviation: 'SEA', conference: 'NFC', division: 'West' },
  { name: 'Tampa Bay Buccaneers', abbreviation: 'TB', conference: 'NFC', division: 'South' },
  { name: 'Tennessee Titans', abbreviation: 'TEN', conference: 'AFC', division: 'South' },
  { name: 'Washington Commanders', abbreviation: 'WAS', conference: 'NFC', division: 'East' }
];

async function updateTeams() {
  try {
    console.log('Updating NFL teams...');
    
    // First, get all existing teams
    const { data: existingTeams, error: fetchError } = await supabase
      .from('teams')
      .select('*')
      .order('id');
    
    if (fetchError) {
      throw new Error(`Failed to fetch teams: ${fetchError.message}`);
    }
    
    console.log(`Found ${existingTeams?.length || 0} existing teams`);
    
    // Check if we need to delete and recreate or just update
    if (existingTeams && existingTeams.length > 0) {
      // Option 1: Update existing teams by ID order
      console.log('Updating existing teams...');
      
      for (let i = 0; i < nflTeams.length && i < existingTeams.length; i++) {
        const team = nflTeams[i];
        const existingTeam = existingTeams[i];
        
        const { error } = await supabase
          .from('teams')
          .update({
            name: team.name,
            abbreviation: team.abbreviation,
            conference: team.conference,
            division: team.division
          })
          .eq('id', existingTeam.id);
        
        if (error) {
          console.error(`Failed to update team ${existingTeam.id}: ${error.message}`);
        } else {
          console.log(`Updated team ${existingTeam.id}: ${team.name} (${team.abbreviation})`);
        }
      }
      
      // If there are more teams in our list than in the database, insert the remaining
      if (nflTeams.length > existingTeams.length) {
        const remainingTeams = nflTeams.slice(existingTeams.length);
        const { error: insertError } = await supabase
          .from('teams')
          .insert(remainingTeams);
        
        if (insertError) {
          console.error(`Failed to insert remaining teams: ${insertError.message}`);
        } else {
          console.log(`Inserted ${remainingTeams.length} additional teams`);
        }
      }
    } else {
      // Option 2: Insert all teams fresh
      console.log('Inserting all teams...');
      
      const { error: insertError } = await supabase
        .from('teams')
        .insert(nflTeams);
      
      if (insertError) {
        throw new Error(`Failed to insert teams: ${insertError.message}`);
      }
      
      console.log('Successfully inserted all 32 NFL teams!');
    }
    
    // Verify the update
    const { data: updatedTeams, error: verifyError } = await supabase
      .from('teams')
      .select('*')
      .order('name');
    
    if (verifyError) {
      console.error('Failed to verify teams:', verifyError);
    } else {
      console.log('\nFinal team list:');
      updatedTeams?.forEach(team => {
        console.log(`${team.id}: ${team.name} (${team.abbreviation}) - ${team.conference} ${team.division}`);
      });
    }
    
  } catch (error) {
    console.error('Error updating teams:', error);
    process.exit(1);
  }
}

// Run the script
updateTeams();