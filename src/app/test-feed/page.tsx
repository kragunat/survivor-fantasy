'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function TestFeedPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isTriggering, setIsTriggering] = useState(false)
  const [lastResult, setLastResult] = useState<any>(null)

  if (status === 'loading') {
    return (
      <section className="hero is-fullheight">
        <div className="hero-body">
          <div className="container has-text-centered">
            <button className="button is-loading is-large is-white"></button>
            <p className="title is-4 mt-4">Loading...</p>
          </div>
        </div>
      </section>
    )
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin')
    return null
  }

  const triggerTestEvent = async () => {
    setIsTriggering(true)
    try {
      const response = await fetch('/api/test-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()
      setLastResult(result)
      
      if (result.success) {
        console.log('✅ Test event triggered:', result)
      } else {
        console.error('❌ Test event failed:', result)
      }
    } catch (error) {
      console.error('❌ Error triggering test event:', error)
      setLastResult({
        success: false,
        error: 'Network error',
        message: 'Failed to trigger test event'
      })
    } finally {
      setIsTriggering(false)
    }
  }

  return (
    <div>
      <nav className="navbar" role="navigation" aria-label="main navigation">
        <div className="navbar-brand">
          <Link href="/dashboard" className="navbar-item">
            <span className="icon">
              <i className="fas fa-arrow-left"></i>
            </span>
            <span>Back to Dashboard</span>
          </Link>
        </div>
        <div className="navbar-menu">
          <div className="navbar-end">
            <div className="navbar-item">
              <span>{session?.user?.email}</span>
            </div>
            <div className="navbar-item">
              <a href="/api/auth/signout" className="button is-light">
                Sign Out
              </a>
            </div>
          </div>
        </div>
      </nav>

      <section className="section">
        <div className="container">
          <h1 className="title">Live Feed Testing</h1>
          <p className="subtitle">
            Use this page to test the real-time game event system without waiting for actual NFL games.
          </p>

          <div className="columns">
            <div className="column is-half">
              <div className="box">
                <h2 className="title is-4">Test Event Trigger</h2>
                <p className="mb-4">
                  Click the button below to simulate a random NFL scoring event. 
                  The event will appear in your live feed on the dashboard in real-time.
                </p>
                
                <button
                  onClick={triggerTestEvent}
                  disabled={isTriggering}
                  className={`button is-primary is-large ${isTriggering ? 'is-loading' : ''}`}
                >
                  {!isTriggering && '🏈 Trigger Test Event'}
                </button>
                
                <div className="content mt-4">
                  <h3>Available Test Events:</h3>
                  <ul>
                    <li>🏈 <strong>Touchdown</strong> - Team scores 6 points</li>
                    <li>🥅 <strong>Field Goal</strong> - Team scores 3 points</li>
                    <li>🛡️ <strong>Safety</strong> - Team scores 2 points</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="column is-half">
              <div className="box">
                <h2 className="title is-4">How to Test</h2>
                <div className="content">
                  <ol>
                    <li>
                      <strong>Open Dashboard:</strong> Open your{' '}
                      <Link href="/dashboard" className="has-text-primary">
                        dashboard
                      </Link>{' '}
                      in another tab/window
                    </li>
                    <li>
                      <strong>Check Live Feed:</strong> Make sure the live feed shows "🟢 Live" status
                    </li>
                    <li>
                      <strong>Trigger Events:</strong> Click the "Trigger Test Event" button
                    </li>
                    <li>
                      <strong>Watch Updates:</strong> See real-time events appear in your dashboard feed
                    </li>
                  </ol>
                  
                  <div className="notification is-info is-light">
                    <p>
                      <strong>💡 Tip:</strong> Keep the dashboard open in a separate tab 
                      to see the live updates appear instantly when you trigger events here.
                    </p>
                  </div>
                </div>
              </div>

              {lastResult && (
                <div className="box">
                  <h2 className="title is-5">Last Result</h2>
                  <div className={`notification ${lastResult.success ? 'is-success' : 'is-danger'} is-light`}>
                    {lastResult.success ? (
                      <div>
                        <p className="has-text-weight-semibold">✅ Event Triggered Successfully!</p>
                        <p>Type: {lastResult.event?.type}</p>
                        <p>Team: {lastResult.event?.team}</p>
                        <p>Score: {lastResult.event?.newScore}</p>
                        <p>Broadcasted to: {lastResult.event?.broadcastTo} users</p>
                      </div>
                    ) : (
                      <div>
                        <p className="has-text-weight-semibold">❌ Event Failed</p>
                        <p>{lastResult.message}</p>
                      </div>
                    )}
                    <p className="is-size-7 mt-2">
                      {new Date(lastResult.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="box">
            <h2 className="title is-4">Manual API Testing</h2>
            <p>You can also test the API directly using curl:</p>
            <pre className="has-background-dark has-text-light p-4">
              <code>
{`# Trigger a test event
curl -X POST ${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/test-events

# Get available events
curl -X GET ${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/test-events`}
              </code>
            </pre>
          </div>
        </div>
      </section>
    </div>
  )
}