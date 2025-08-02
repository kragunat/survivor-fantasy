import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { broadcastGameEvent } from '@/lib/live-feed-broadcast';

// Mock game events for testing
const mockEvents = [
  {
    type: 'touchdown',
    team: 'KC',
    description: 'Kansas City Chiefs scored a touchdown',
    points: 6
  },
  {
    type: 'field_goal',
    team: 'BUF',
    description: 'Buffalo Bills kicked a field goal',
    points: 3
  },
  {
    type: 'touchdown',
    team: 'SF',
    description: 'San Francisco 49ers scored a touchdown',
    points: 6
  },
  {
    type: 'safety',
    team: 'DAL',
    description: 'Dallas Cowboys scored a safety',
    points: 2
  },
  {
    type: 'touchdown',
    team: 'GB',
    description: 'Green Bay Packers scored a touchdown',
    points: 6
  },
  {
    type: 'field_goal',
    team: 'NE',
    description: 'New England Patriots kicked a field goal',
    points: 3
  }
];

export async function POST() {
  try {
    console.log('🧪 Starting test event simulation...');
    
    const supabase = createAdminClient();
    
    // Get a random mock event
    const mockEvent = mockEvents[Math.floor(Math.random() * mockEvents.length)];
    
    // Get team ID from abbreviation
    const { data: team } = await supabase
      .from('teams')
      .select('id, name')
      .eq('abbreviation', mockEvent.team)
      .single();
    
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }
    
    // Create a mock game if none exists
    let { data: game } = await supabase
      .from('games')
      .select('id, home_team_id, away_team_id, home_score, away_score')
      .eq('season_year', 2025)
      .eq('week', 1)
      .limit(1)
      .single();
    
    if (!game) {
      // Create a mock game
      const { data: newGame } = await supabase
        .from('games')
        .insert({
          season_year: 2025,
          week: 1,
          home_team_id: team.id,
          away_team_id: team.id === 1 ? 2 : 1, // Just use different team
          home_score: 0,
          away_score: 0,
          game_time: new Date().toISOString(),
          is_final: false,
          espn_game_id: 'test-game-1'
        })
        .select('id, home_team_id, away_team_id, home_score, away_score')
        .single();
      
      game = newGame;
    }
    
    if (!game) {
      return NextResponse.json({ error: 'Failed to create test game' }, { status: 500 });
    }
    
    // Update game score
    const isHomeTeam = game.home_team_id === team.id;
    const newHomeScore = (game.home_score || 0) + (isHomeTeam ? mockEvent.points : 0);
    const newAwayScore = (game.away_score || 0) + (!isHomeTeam ? mockEvent.points : 0);
    
    await supabase
      .from('games')
      .update({
        home_score: newHomeScore,
        away_score: newAwayScore,
        last_updated: new Date().toISOString()
      })
      .eq('id', game.id);
    
    // Insert game event
    const { data: gameEvent } = await supabase
      .from('game_events')
      .insert({
        game_id: game.id,
        event_type: mockEvent.type,
        team_id: team.id,
        description: mockEvent.description,
        score_home: newHomeScore,
        score_away: newAwayScore
      })
      .select(`
        id,
        event_type,
        description,
        score_home,
        score_away,
        created_at,
        team:teams(name, abbreviation),
        games(
          id,
          week,
          season_year,
          home_team:teams!games_home_team_id_fkey(name, abbreviation),
          away_team:teams!games_away_team_id_fkey(name, abbreviation)
        )
      `)
      .single();
    
    // Get all users who might be interested (for testing, get all users)
    const { data: allUsers } = await supabase
      .from('profiles')
      .select('id');
    
    const userIds = allUsers?.map(u => u.id) || [];
    
    // Broadcast the event to all connected users
    if (gameEvent && userIds.length > 0) {
      broadcastGameEvent({
        id: gameEvent.id,
        type: gameEvent.event_type,
        description: gameEvent.description,
        team: gameEvent.team,
        game: gameEvent.games,
        score: {
          home: gameEvent.score_home,
          away: gameEvent.score_away
        },
        timestamp: gameEvent.created_at
      }, userIds);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Test event created and broadcasted',
      event: {
        type: mockEvent.type,
        team: team.name,
        description: mockEvent.description,
        newScore: `${newAwayScore} - ${newHomeScore}`,
        broadcastTo: userIds.length
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Test event failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Test event failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test Events API',
    usage: 'POST to this endpoint to simulate random game events',
    availableEvents: mockEvents.map(e => ({ type: e.type, team: e.team }))
  });
}