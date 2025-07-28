import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  
  try {
    const { data: leagues, error } = await supabase
      .from('league_members')
      .select(`
        joined_at,
        is_eliminated,
        eliminated_week,
        league:leagues(
          id,
          name,
          season_year,
          max_players,
          created_at,
          commissioner:profiles!commissioner_id(name, email)
        )
      `)
      .eq('user_id', session.user.id)
      .order('joined_at', { ascending: false })

    if (error) {
      console.error('Error fetching user leagues:', error)
      return NextResponse.json({ error: 'Failed to fetch leagues' }, { status: 500 })
    }

    return NextResponse.json({ leagues: leagues || [] })
  } catch (error) {
    console.error('Error fetching user leagues:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}