import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { createClient } from '@/lib/supabase/server';
import { getCurrentNFLWeek, getPickableWeek, arePicksLocked, getPicksUnlockTime, getPickDeadline } from '@/lib/nfl-utils';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get('leagueId');
    
    if (!leagueId) {
      return NextResponse.json({ error: 'League ID required' }, { status: 400 });
    }

    const supabase = createClient();
    
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Verify user is in the league
    const { data: membership } = await supabase
      .from('league_members')
      .select('id, is_eliminated')
      .eq('league_id', leagueId)
      .eq('user_id', profile.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this league' }, { status: 403 });
    }

    // Get current week info
    const currentDate = new Date();
    const currentWeek = getCurrentNFLWeek(currentDate);
    const pickableWeek = getPickableWeek(currentDate);
    const picksLocked = arePicksLocked(currentDate);
    const picksUnlockTime = getPicksUnlockTime(currentDate);
    const pickDeadline = pickableWeek > 0 ? getPickDeadline(pickableWeek) : null;

    // Get games for the pickable week
    let games = [];
    if (pickableWeek > 0) {
      const { data: weekGames } = await supabase
        .from('games')
        .select(`
          id,
          week,
          game_time,
          home_score,
          away_score,
          is_final,
          home_team:teams!games_home_team_id_fkey(id, name, abbreviation),
          away_team:teams!games_away_team_id_fkey(id, name, abbreviation)
        `)
        .eq('season_year', 2025)
        .eq('week', pickableWeek)
        .order('game_time', { ascending: true });

      games = weekGames || [];
    }

    // Get user's previous picks to show which teams they've already used
    const { data: previousPicks } = await supabase
      .from('picks')
      .select('team_id, week')
      .eq('league_member_id', membership.id);

    const usedTeamIds = previousPicks?.map(pick => pick.team_id) || [];

    // Get current week pick if exists
    const { data: currentPick } = await supabase
      .from('picks')
      .select(`
        id,
        team_id,
        team:teams!picks_team_id_fkey(id, name, abbreviation)
      `)
      .eq('league_member_id', membership.id)
      .eq('week', pickableWeek)
      .single();

    return NextResponse.json({
      currentWeek,
      pickableWeek,
      picksLocked,
      picksUnlockTime,
      pickDeadline: pickDeadline?.toISOString(),
      games,
      usedTeamIds,
      currentPick,
      isEliminated: membership.is_eliminated,
      previousPicks
    });

  } catch (error) {
    console.error('Error fetching current week data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch current week data' },
      { status: 500 }
    );
  }
}