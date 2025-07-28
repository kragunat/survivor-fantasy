import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  
  try {
    // Get the invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .select('*')
      .eq('code', code)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (inviteError || !invitation) {
      return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 })
    }

    // Check if user is already a member
    const { data: existingMember, error: memberCheckError } = await supabase
      .from('league_members')
      .select('id')
      .eq('league_id', invitation.league_id)
      .eq('user_id', session.user.id)
      .single()

    if (existingMember) {
      return NextResponse.json({ 
        leagueId: invitation.league_id,
        message: 'Already a member of this league'
      })
    }

    // Add user to the league
    const { error: joinError } = await supabase
      .from('league_members')
      .insert({
        league_id: invitation.league_id,
        user_id: session.user.id,
      })

    if (joinError) {
      console.error('Error joining league:', joinError)
      return NextResponse.json({ error: 'Failed to join league' }, { status: 500 })
    }

    // Delete the invitation (it's been used)
    await supabase
      .from('invitations')
      .delete()
      .eq('id', invitation.id)

    return NextResponse.json({ 
      leagueId: invitation.league_id,
      message: 'Successfully joined league'
    })
  } catch (error) {
    console.error('Error accepting invitation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}