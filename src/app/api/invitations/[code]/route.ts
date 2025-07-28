import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const supabase = await createClient()
  
  try {
    const { data: invitation, error } = await supabase
      .from('invitations')
      .select(`
        *,
        league:leagues(id, name, commissioner_id)
      `)
      .eq('code', code)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !invitation) {
      return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 })
    }

    return NextResponse.json(invitation)
  } catch (error) {
    console.error('Error fetching invitation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}