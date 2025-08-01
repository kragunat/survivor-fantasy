import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPickableWeek, getPickDeadline } from '@/lib/nfl-utils';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: leagueId } = await params;
    const body = await request.json();
    const { teamId, week } = body;

    if (!teamId || !week) {
      return NextResponse.json({ error: 'Team ID and week required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Verify user is in the league and not eliminated
    const { data: membership } = await supabase
      .from('league_members')
      .select('id, is_eliminated')
      .eq('league_id', leagueId)
      .eq('user_id', profile.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this league' }, { status: 403 });
    }

    if (membership.is_eliminated) {
      return NextResponse.json({ error: 'You have been eliminated from this league' }, { status: 403 });
    }

    // Verify the week is pickable
    const currentPickableWeek = getPickableWeek();
    if (week !== currentPickableWeek) {
      return NextResponse.json({ error: 'Invalid week for picks' }, { status: 400 });
    }

    // Check if pick deadline has passed
    const deadline = getPickDeadline(week);
    if (new Date() > deadline) {
      return NextResponse.json({ error: 'Pick deadline has passed' }, { status: 400 });
    }

    // Check if user has already used this team
    const { data: previousPicks } = await supabase
      .from('picks')
      .select('team_id')
      .eq('league_member_id', membership.id)
      .neq('week', week); // Exclude current week so they can change their pick

    const usedTeamIds = previousPicks?.map(pick => pick.team_id) || [];
    if (usedTeamIds.includes(teamId)) {
      return NextResponse.json({ error: 'You have already used this team' }, { status: 400 });
    }

    // Check if pick already exists for this week (update) or create new
    const { data: existingPick } = await supabase
      .from('picks')
      .select('id')
      .eq('league_member_id', membership.id)
      .eq('week', week)
      .single();

    let pick;
    if (existingPick) {
      // Update existing pick
      const { data: updatedPick, error: updateError } = await supabase
        .from('picks')
        .update({ team_id: teamId })
        .eq('id', existingPick.id)
        .select(`
          id,
          team_id,
          week,
          created_at,
          team:teams!picks_team_id_fkey(id, name, abbreviation)
        `)
        .single();

      if (updateError) {
        console.error('Error updating pick:', updateError);
        return NextResponse.json({ error: 'Failed to update pick' }, { status: 500 });
      }
      pick = updatedPick;
    } else {
      // Create new pick
      const { data: newPick, error: createError } = await supabase
        .from('picks')
        .insert({
          league_member_id: membership.id,
          week,
          team_id: teamId
        })
        .select(`
          id,
          team_id,
          week,
          created_at,
          team:teams!picks_team_id_fkey(id, name, abbreviation)
        `)
        .single();

      if (createError) {
        console.error('Error creating pick:', createError);
        return NextResponse.json({ error: 'Failed to create pick' }, { status: 500 });
      }
      pick = newPick;
    }

    return NextResponse.json({ pick });

  } catch (error) {
    console.error('Error submitting pick:', error);
    return NextResponse.json(
      { error: 'Failed to submit pick' },
      { status: 500 }
    );
  }
}