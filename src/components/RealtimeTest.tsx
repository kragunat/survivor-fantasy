'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function RealtimeTest() {
  const [status, setStatus] = useState('disconnected')
  const [lastUpdate, setLastUpdate] = useState<string>('')

  useEffect(() => {
    const supabase = createClient()
    
    console.log('Testing realtime connection...')
    setStatus('connecting')
    
    const subscription = supabase
      .channel('test-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'league_members'
      }, (payload) => {
        console.log('Realtime test - received update:', payload)
        setStatus('connected')
        setLastUpdate(new Date().toLocaleTimeString())
      })
      .subscribe((status) => {
        console.log('Realtime test - subscription status:', status)
        if (status === 'SUBSCRIBED') {
          setStatus('connected')
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setStatus('error')
        }
      })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <div className="box">
      <h4 className="title is-6">Realtime Test</h4>
      <div className="content">
        <p>Status: 
          <span className={`tag ml-2 ${
            status === 'connected' ? 'is-success' : 
            status === 'connecting' ? 'is-warning' : 
            'is-danger'
          }`}>
            {status}
          </span>
        </p>
        {lastUpdate && <p>Last update: {lastUpdate}</p>}
        <p className="is-size-7 has-text-grey">
          This tests if realtime subscriptions are working for league_members table.
          Try joining a league from another window to see if updates appear.
        </p>
      </div>
    </div>
  )
}