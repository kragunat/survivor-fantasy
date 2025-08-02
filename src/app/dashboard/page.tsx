'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import LiveFeed from '@/components/LiveFeed'

interface UserLeague {
  joined_at: string
  is_eliminated: boolean
  eliminated_week?: number
  league: {
    id: string
    name: string
    season_year: number
    max_players: number
    created_at: string
    commissioner: {
      name: string
      email: string
    }
  }
}

function DashboardContent() {
  return <DashboardContentImpl />
}

function DashboardContentImpl() {
  const sessionResult = useSession()
  const { data: session, status } = sessionResult || { data: null, status: 'loading' }
  const router = useRouter()
  const [leagues, setLeagues] = useState<UserLeague[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    
    if (status === 'authenticated') {
      const fetchLeagues = async () => {
        try {
          const response = await fetch('/api/user/leagues')
          if (response.ok) {
            const data = await response.json()
            setLeagues(data.leagues)
          }
        } catch (error) {
          console.error('Error fetching leagues:', error)
        } finally {
          setLoading(false)
        }
      }

      fetchLeagues()
    }
  }, [status])

  if (status === 'loading') {
    return (
      <section className="hero is-fullheight">
        <div className="hero-body">
          <div className="container has-text-centered">
            <button className="button is-loading is-large is-primary"></button>
            <p className="title is-4 mt-4">Loading...</p>
          </div>
        </div>
      </section>
    )
  }

  if (!session) {
    return null
  }
  
  return (
    <div>
      <nav className="navbar" role="navigation" aria-label="main navigation">
        <div className="navbar-brand">
          <span className="navbar-item">
            <h1 className="title is-4">Survivor Fantasy League</h1>
          </span>
        </div>
        <div className="navbar-menu">
          <div className="navbar-end">
            <div className="navbar-item">
              <span>{session.user?.email}</span>
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
          <h2 className="title is-2">Welcome to your Dashboard</h2>
          
          <div className="columns">
            <div className="column">
              <div className="box">
                <h3 className="title is-5">Create a New League</h3>
                <p className="content">Start your own survivor league and invite friends to join.</p>
                <Link href="/leagues/create" className="button is-primary">
                  Create League
                </Link>
              </div>
            </div>
            
            <div className="column">
              <div className="box">
                <h3 className="title is-5">Join a League</h3>
                <p className="content">Enter an invitation code to join an existing league.</p>
                <Link href="/leagues/join" className="button is-primary">
                  Join League
                </Link>
              </div>
            </div>
          </div>
          
          {/* Live Feed */}
          <LiveFeed />
          
          {/* Test Feed Link (for development) */}
          <div className="box has-background-info-light">
            <div className="level">
              <div className="level-left">
                <div className="level-item">
                  <div>
                    <h4 className="title is-6">🧪 Testing Mode</h4>
                    <p className="is-size-7">Test the live feed with mock NFL events</p>
                  </div>
                </div>
              </div>
              <div className="level-right">
                <div className="level-item">
                  <Link href="/test-feed" className="button is-info is-small">
                    Test Live Events
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="title is-4">Your Leagues</h3>
            <div className="box">
              {loading ? (
                <div className="has-text-centered">
                  <button className="button is-loading is-medium is-primary"></button>
                  <p className="has-text-grey mt-2">Loading leagues...</p>
                </div>
              ) : leagues.length === 0 ? (
                <div className="has-text-centered has-text-grey">
                  You are not currently in any leagues.
                </div>
              ) : (
                <div>
                  {leagues.map((userLeague) => (
                    <div key={userLeague.league.id} className="notification mb-4">
                      <div className="level">
                        <div className="level-left">
                          <div className="level-item">
                            <div>
                              <div className="is-flex is-align-items-center">
                                <h4 className="title is-5 mb-0">
                                  {userLeague.league.name}
                                </h4>
                                {userLeague.league.commissioner.email === session.user?.email && (
                                  <span className="ml-2" title="You are the commissioner">
                                    👑
                                  </span>
                                )}
                                {userLeague.is_eliminated && (
                                  <span className="tag is-danger ml-2">
                                    Eliminated Week {userLeague.eliminated_week}
                                  </span>
                                )}
                              </div>
                              <p className="subtitle is-6 mb-1">
                                Season {userLeague.league.season_year} • Commissioner: {userLeague.league.commissioner.name}
                              </p>
                              <p className="is-size-7 has-text-grey-dark">
                                Joined {new Date(userLeague.joined_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="level-right">
                          <div className="level-item">
                            <Link
                              href={`/leagues/${userLeague.league.id}`}
                              className="button is-primary"
                            >
                              View League
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <section className="hero is-fullheight">
        <div className="hero-body">
          <div className="container has-text-centered">
            <button className="button is-loading is-large is-primary"></button>
          </div>
        </div>
      </section>
    }>
      <DashboardContent />
    </Suspense>
  )
}