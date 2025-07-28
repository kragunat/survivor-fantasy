import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, maxPlayers } = await request.json()

  if (!name) {
    return NextResponse.json({ error: 'League name is required' }, { status: 400 })
  }

  const supabase = createServerComponentClient({ cookies })
  
  try {
    const { data: league, error } = await supabase
      .from('leagues')
      .insert({
        name,
        commissioner_id: session.user.id,
        max_players: maxPlayers || 100,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating league:', error)
      return NextResponse.json({ error: 'Failed to create league' }, { status: 500 })
    }

    // Add the commissioner as the first member
    const { error: memberError } = await supabase
      .from('league_members')
      .insert({
        league_id: league.id,
        user_id: session.user.id,
      })

    if (memberError) {
      console.error('Error adding commissioner to league:', memberError)
    }

    return NextResponse.json(league)
  } catch (error) {
    console.error('Error creating league:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}