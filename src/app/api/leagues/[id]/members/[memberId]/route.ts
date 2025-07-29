import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id: leagueId, memberId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    
    // Verify user is commissioner of this league
    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .select('commissioner_id')
      .eq('id', leagueId)
      .single()

    if (leagueError || !league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 })
    }

    if (league.commissioner_id !== session.user.id) {
      return NextResponse.json({ error: 'Only commissioners can remove players' }, { status: 403 })
    }

    // Get the member to be removed
    const { data: member, error: memberError } = await supabase
      .from('league_members')
      .select('user_id')
      .eq('id', memberId)
      .eq('league_id', leagueId)
      .single()

    if (memberError || !member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Prevent commissioner from removing themselves
    if (member.user_id === session.user.id) {
      return NextResponse.json({ error: 'Commissioners cannot remove themselves' }, { status: 400 })
    }

    // Remove the member
    const { error: deleteError } = await supabase
      .from('league_members')
      .delete()
      .eq('id', memberId)
      .eq('league_id', leagueId)

    if (deleteError) {
      console.error('Error removing member:', deleteError)
      return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Member removed successfully' })
  } catch (error) {
    console.error('Error removing member:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}