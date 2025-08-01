'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'

interface GameEvent {
  id: number
  type: string
  description: string
  team?: {
    name: string
    abbreviation: string
  }
  game?: {
    id: number
    week: number
    home_team: { name: string; abbreviation: string }
    away_team: { name: string; abbreviation: string }
  }
  score?: {
    home: number | null
    away: number | null
  }
  timestamp: string
}

interface LiveFeedEvent {
  type: 'connection' | 'game_event' | 'elimination' | 'ping' | 'no_picks' | 'no_recent_events' | 'error'
  message?: string
  event?: GameEvent
  team?: string
  week?: number
  timestamp: string
}

export default function LiveFeed() {
  const { data: session, status } = useSession()
  const [events, setEvents] = useState<LiveFeedEvent[]>([])
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
  const [isVisible, setIsVisible] = useState(true)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      connectToLiveFeed()
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [status, session])

  const connectToLiveFeed = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    setConnectionStatus('connecting')
    
    const eventSource = new EventSource('/api/dashboard/live-feed')
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      setConnectionStatus('connected')
      console.log('Connected to live feed')
    }

    eventSource.onmessage = (event) => {
      try {
        const data: LiveFeedEvent = JSON.parse(event.data)
        
        if (data.type === 'ping') {
          return // Don't show ping events
        }

        setEvents(prev => [data, ...prev.slice(0, 19)]) // Keep only last 20 events
      } catch (error) {
        console.error('Error parsing SSE data:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error)
      setConnectionStatus('error')
      
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
          connectToLiveFeed()
        }
      }, 5000)
    }
  }

  const getEventIcon = (event: LiveFeedEvent) => {
    switch (event.type) {
      case 'connection':
        return '🔗'
      case 'game_event':
        if (event.event?.type === 'touchdown') return '🏈'
        if (event.event?.type === 'field_goal') return '🥅'
        if (event.event?.type === 'game_end') return '🏁'
        return '📊'
      case 'elimination':
        return '❌'
      case 'no_picks':
      case 'no_recent_events':
        return 'ℹ️'
      case 'error':
        return '⚠️'
      default:
        return '📢'
    }
  }

  const getEventColor = (event: LiveFeedEvent) => {
    switch (event.type) {
      case 'connection':
        return 'is-info'
      case 'game_event':
        return 'is-primary'
      case 'elimination':
        return 'is-danger'
      case 'error':
        return 'is-warning'
      default:
        return 'is-light'
    }
  }

  const formatEventMessage = (event: LiveFeedEvent) => {
    if (event.message) return event.message
    if (event.event) return event.event.description
    return 'Unknown event'
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  if (status === 'loading') {
    return null
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className="box">
      <div className="level mb-4">
        <div className="level-left">
          <div className="level-item">
            <h3 className="title is-5">Live Game Feed</h3>
          </div>
        </div>
        <div className="level-right">
          <div className="level-item">
            <div className="field is-grouped">
              <div className="control">
                <span className={`tag is-small ${
                  connectionStatus === 'connected' ? 'is-success' : 
                  connectionStatus === 'connecting' ? 'is-warning' : 
                  connectionStatus === 'error' ? 'is-danger' : 'is-light'
                }`}>
                  {connectionStatus === 'connected' ? '🟢 Live' : 
                   connectionStatus === 'connecting' ? '🟡 Connecting' : 
                   connectionStatus === 'error' ? '🔴 Error' : '⚫ Offline'}
                </span>
              </div>
              <div className="control">
                <button 
                  onClick={() => setIsVisible(!isVisible)}
                  className="button is-small is-light"
                  title={isVisible ? "Hide feed" : "Show feed"}
                >
                  {isVisible ? '🔽' : '🔼'}
                </button>
              </div>
              <div className="control">
                <button 
                  onClick={connectToLiveFeed}
                  className="button is-small is-light"
                  title="Reconnect"
                >
                  🔄
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isVisible && (
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {events.length === 0 ? (
            <div className="has-text-centered has-text-grey">
              <p>Waiting for live updates...</p>
              <p className="is-size-7 mt-2">
                {connectionStatus === 'connected' ? 
                  'Connected to live feed. Game events will appear here when your teams are playing.' :
                  'Connecting to live feed...'
                }
              </p>
            </div>
          ) : (
            <div>
              {events.map((event, index) => (
                <div key={`${event.timestamp}-${index}`} className={`notification ${getEventColor(event)} is-small mb-2`}>
                  <div className="level">
                    <div className="level-left">
                      <div className="level-item">
                        <span className="mr-2">{getEventIcon(event)}</span>
                        <div>
                          <p className="is-size-7 has-text-weight-semibold">
                            {formatEventMessage(event)}
                          </p>
                          {event.event?.game && (
                            <p className="is-size-7 has-text-grey-dark">
                              Week {event.event.game.week}: {event.event.game.away_team.abbreviation} @ {event.event.game.home_team.abbreviation}
                              {event.event.score && (
                                <span className="ml-2">
                                  {event.event.score.away}-{event.event.score.home}
                                </span>
                              )}
                            </p>
                          )}
                          {event.type === 'elimination' && event.team && event.week && (
                            <p className="is-size-7 has-text-grey-dark">
                              Week {event.week} - {event.team}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="level-right">
                      <div className="level-item">
                        <span className="is-size-7 has-text-grey">
                          {formatTime(event.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}