import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: leagueId } = await params
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  
  try {
    // First check if user is a member of this league
    const { data: membership, error: membershipError } = await supabase
      .from('league_members')
      .select('id')
      .eq('league_id', leagueId)
      .eq('user_id', session.user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Not a member of this league' }, { status: 403 })
    }

    // Get league details with commissioner info
    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .select(`
        *,
        commissioner:profiles!commissioner_id(name, email)
      `)
      .eq('id', leagueId)
      .single()

    if (leagueError || !league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 })
    }

    // Get all league members
    const { data: members, error: membersError } = await supabase
      .from('league_members')
      .select(`
        *,
        profile:profiles!user_id(name, email)
      `)
      .eq('league_id', leagueId)
      .order('joined_at')

    if (membersError) {
      console.error('Error fetching members:', membersError)
      return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
    }

    // Get current user's picks
    const currentMember = members?.find(m => m.user_id === session.user.id)
    let userPicks = []
    
    if (currentMember) {
      const { data: picks, error: picksError } = await supabase
        .from('picks')
        .select(`
          *,
          team:teams(name, abbreviation)
        `)
        .eq('league_member_id', currentMember.id)
        .order('week')

      if (!picksError && picks) {
        userPicks = picks
      }
    }

    return NextResponse.json({
      league,
      members: members || [],
      userPicks
    })
  } catch (error) {
    console.error('Error fetching league:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}