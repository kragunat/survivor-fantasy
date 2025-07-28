import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { createAdminClient } from '@/lib/supabase/admin'
import { nanoid } from 'nanoid'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: leagueId } = await params
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { email } = await request.json()
  
  // Allow generic invites without specific email
  const inviteEmail = email === 'general-invite' ? 'general-invite@example.com' : email

  if (!inviteEmail) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const supabase = createAdminClient()
  
  try {
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
      return NextResponse.json({ error: 'Only commissioners can send invites' }, { status: 403 })
    }

    // Generate unique invite code
    const code = nanoid(12)

    const { data: invitation, error } = await supabase
      .from('invitations')
      .insert({
        league_id: leagueId,
        email: inviteEmail,
        code,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating invitation:', error)
      return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 })
    }

    return NextResponse.json({ 
      invitation,
      inviteUrl: `${process.env.NEXTAUTH_URL}/join/${code}`
    })
  } catch (error) {
    console.error('Error creating invitation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}