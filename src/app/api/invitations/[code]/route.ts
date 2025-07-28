import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    
    if (!code) {
      return NextResponse.json({ error: 'Missing invitation code' }, { status: 400 })
    }

    const supabase = createAdminClient()
    
    const { data: invitation, error } = await supabase
      .from('invitations')
      .select(`
        *,
        league:leagues(id, name, commissioner_id)
      `)
      .eq('code', code)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error) {
      console.error('Supabase error:', error)
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!invitation) {
      return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 })
    }

    return NextResponse.json(invitation)
  } catch (error) {
    console.error('Error fetching invitation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}