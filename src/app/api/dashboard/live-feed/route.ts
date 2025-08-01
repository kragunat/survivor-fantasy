import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { createClient } from '@/lib/supabase/server';

// SSE connection tracking
const connections = new Map<string, ReadableStreamDefaultController>();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new Response('Unauthorized', { status: 401 });
    }

    const supabase = await createClient();
    
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (!profile) {
      return new Response('Profile not found', { status: 404 });
    }

    // Create SSE stream
    const stream = new ReadableStream({
      start(controller) {
        // Store connection for broadcasting
        connections.set(profile.id, controller);

        // Send initial connection message
        const data = JSON.stringify({
          type: 'connection',
          message: 'Connected to live feed',
          timestamp: new Date().toISOString()
        });
        
        controller.enqueue(`data: ${data}\n\n`);

        // Send initial game events
        sendInitialEvents(profile.id, controller, supabase);

        // Keep connection alive with periodic pings
        const pingInterval = setInterval(() => {
          try {
            controller.enqueue(`data: ${JSON.stringify({
              type: 'ping',
              timestamp: new Date().toISOString()
            })}\n\n`);
          } catch (error) {
            clearInterval(pingInterval);
            connections.delete(profile.id);
          }
        }, 30000); // Ping every 30 seconds

        // Cleanup function
        return () => {
          clearInterval(pingInterval);
          connections.delete(profile.id);
        };
      },
      cancel() {
        connections.delete(profile.id);
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    });

  } catch (error) {
    console.error('Error in live feed SSE:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

async function sendInitialEvents(
  userId: string, 
  controller: ReadableStreamDefaultController,
  supabase: any
) {
  try {
    // Get user's recent game events (last 2 hours)
    const twoHoursAgo = new Date();
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

    // Get user's current picks to filter relevant events
    const { data: userPicks } = await supabase
      .from('picks')
      .select(`
        team_id,
        week,
        league_members!inner (
          user_id,
          league_id,
          leagues (
            name
          )
        )
      `)
      .eq('league_members.user_id', userId);

    if (!userPicks || userPicks.length === 0) {
      controller.enqueue(`data: ${JSON.stringify({
        type: 'no_picks',
        message: 'No active picks found',
        timestamp: new Date().toISOString()
      })}\n\n`);
      return;
    }

    const userTeamIds = [...new Set(userPicks.map(pick => pick.team_id))];

    // Get recent events for user's teams
    const { data: events } = await supabase
      .from('game_events')
      .select(`
        *,
        games (
          id,
          week,
          season_year,
          home_team:teams!games_home_team_id_fkey (name, abbreviation),
          away_team:teams!games_away_team_id_fkey (name, abbreviation)
        ),
        team:teams (name, abbreviation)
      `)
      .in('team_id', userTeamIds)
      .gte('created_at', twoHoursAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    if (events && events.length > 0) {
      for (const event of events) {
        const data = JSON.stringify({
          type: 'game_event',
          event: {
            id: event.id,
            type: event.event_type,
            description: event.description,
            team: event.team,
            game: event.games,
            score: {
              home: event.score_home,
              away: event.score_away
            },
            timestamp: event.created_at
          }
        });
        
        controller.enqueue(`data: ${data}\n\n`);
      }
    } else {
      controller.enqueue(`data: ${JSON.stringify({
        type: 'no_recent_events',
        message: 'No recent events for your teams',
        timestamp: new Date().toISOString()
      })}\n\n`);
    }

  } catch (error) {
    console.error('Error sending initial events:', error);
    controller.enqueue(`data: ${JSON.stringify({
      type: 'error',
      message: 'Error loading initial events',
      timestamp: new Date().toISOString()
    })}\n\n`);
  }
}

// Function to broadcast events to connected users
export function broadcastGameEvent(event: any, affectedUserIds: string[]) {
  affectedUserIds.forEach(userId => {
    const controller = connections.get(userId);
    if (controller) {
      try {
        const data = JSON.stringify({
          type: 'game_event',
          event: event,
          timestamp: new Date().toISOString()
        });
        
        controller.enqueue(`data: ${data}\n\n`);
      } catch (error) {
        console.error(`Error broadcasting to user ${userId}:`, error);
        connections.delete(userId);
      }
    }
  });
}

// Function to broadcast elimination notifications
export function broadcastElimination(userId: string, teamName: string, week: number) {
  const controller = connections.get(userId);
  if (controller) {
    try {
      const data = JSON.stringify({
        type: 'elimination',
        message: `You have been eliminated! Your pick ${teamName} lost in Week ${week}`,
        team: teamName,
        week: week,
        timestamp: new Date().toISOString()
      });
      
      controller.enqueue(`data: ${data}\n\n`);
    } catch (error) {
      console.error(`Error broadcasting elimination to user ${userId}:`, error);
      connections.delete(userId);
    }
  }
}