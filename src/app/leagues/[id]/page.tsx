'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { RealtimeTest } from '@/components/RealtimeTest'

interface League {
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

interface Member {
  id: string
  user_id: string
  joined_at: string
  is_eliminated: boolean
  eliminated_week?: number
  profile: {
    name: string
    email: string
  }
}

interface Pick {
  id: string
  week: number
  created_at: string
  team: {
    name: string
    abbreviation: string
  }
}

function LeagueOverviewContent({ leagueId }: { leagueId: string }) {
  return <LeagueOverviewContentImpl leagueId={leagueId} />
}

function LeagueOverviewContentImpl({ leagueId }: { leagueId: string }) {
  const sessionResult = useSession()
  const { data: session, status } = sessionResult || { data: null, status: 'loading' }
  const router = useRouter()
  const [league, setLeague] = useState<League | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [userPicks, setUserPicks] = useState<Pick[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showInvite, setShowInvite] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [generatingInvite, setGeneratingInvite] = useState(false)
  const [copied, setCopied] = useState(false)
  const [removingMember, setRemovingMember] = useState<string | null>(null)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<string | null>(null)
  const [realtimeStatus, setRealtimeStatus] = useState<string>('disconnected')

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

  const fetchLeague = useCallback(async () => {
    try {
      const response = await fetch(`/api/leagues/${leagueId}`)
      if (response.ok) {
        const data = await response.json()
        setLeague(data.league)
        setMembers(data.members)
        setUserPicks(data.userPicks)
      } else if (response.status === 403) {
        setError('You are not a member of this league')
      } else {
        setError('Failed to load league')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }, [leagueId])

  const refreshLeagueData = useCallback(async () => {
    try {
      const response = await fetch(`/api/leagues/${leagueId}`)
      if (response.ok) {
        const data = await response.json()
        setLeague(data.league)
        setMembers(data.members)
        setUserPicks(data.userPicks)
      }
    } catch (err) {
      console.error('Error refreshing league data:', err)
    }
  }, [leagueId])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    
    if (status === 'authenticated') {
      fetchLeague()
    }
  }, [leagueId, status, fetchLeague])

  // Realtime subscription for league members
  useEffect(() => {
    if (!leagueId || status !== 'authenticated') {
      setRealtimeStatus('disconnected')
      return
    }

    const supabase = createClient()
    
    console.log('Setting up realtime subscription for league:', leagueId)
    setRealtimeStatus('connecting')
    
    // Subscribe to changes in league_members table
    const subscription = supabase
      .channel(`league_members_${leagueId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'league_members',
          filter: `league_id=eq.${leagueId}`
        },
        (payload) => {
          console.log('Realtime update received:', payload)
          setRealtimeStatus('connected')
          // Refresh the league data when members change (without affecting loading state)
          refreshLeagueData()
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status)
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected')
          console.log('Successfully subscribed to league_members changes')
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setRealtimeStatus('error')
          console.error('Realtime subscription failed:', status)
        }
      })

    // Fallback: Poll for updates every 30 seconds if realtime fails
    const pollInterval = setInterval(() => {
      if (realtimeStatus !== 'connected') {
        console.log('Realtime not connected, polling for updates...')
        refreshLeagueData()
      }
    }, 30000)

    return () => {
      console.log('Unsubscribing from realtime')
      setRealtimeStatus('disconnected')
      clearInterval(pollInterval)
      subscription.unsubscribe()
    }
  }, [leagueId, status, refreshLeagueData, realtimeStatus])

  const handleGenerateInvite = async () => {
    if (!league) return
    
    setGeneratingInvite(true)
    try {
      const response = await fetch(`/api/leagues/${league.id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'general-invite' }),
      })

      if (response.ok) {
        const data = await response.json()
        setInviteLink(data.inviteUrl)
        setShowInvite(true)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        setError(errorData.error || 'Failed to generate invite')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setGeneratingInvite(false)
    }
  }

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000) // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!league) return
    
    setRemovingMember(memberId)
    try {
      const response = await fetch(`/api/leagues/${league.id}/members/${memberId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Remove member from local state for immediate UI update
        setMembers(prev => prev.filter(m => m.id !== memberId))
        setShowRemoveConfirm(null)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        setError(errorData.error || 'Failed to remove member')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setRemovingMember(null)
    }
  }

  if (!session) {
    return null
  }

  if (loading) {
    return (
      <section className="hero is-fullheight">
        <div className="hero-body">
          <div className="container has-text-centered">
            <button className="button is-loading is-large is-primary"></button>
            <p className="title is-4 mt-4">Loading league...</p>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="hero is-fullheight">
        <div className="hero-body">
          <div className="container">
            <div className="columns is-centered">
              <div className="column is-half">
                <div className="notification is-danger">
                  <h1 className="title is-4">Error</h1>
                  <p className="content">{error}</p>
                  <Link href="/dashboard" className="button is-primary">
                    Back to Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (!league) {
    return (
      <section className="hero is-fullheight">
        <div className="hero-body">
          <div className="container has-text-centered">
            <p className="title is-4">League not found</p>
          </div>
        </div>
      </section>
    )
  }

  const isCommissioner = league.commissioner.email === session.user?.email

  return (
    <div>
      <nav className="navbar" role="navigation" aria-label="main navigation">
        <div className="navbar-brand">
          <Link href="/dashboard" className="navbar-item">
            <span className="icon">
              <i className="fas fa-arrow-left"></i>
            </span>
            <span>Dashboard</span>
          </Link>
          <span className="navbar-item">
            <h1 className="title is-4">{league.name}</h1>
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
          {/* League Info */}
          <div className="box">
            <div className="level">
              <div className="level-left">
                <div className="level-item">
                  <div>
                    <h2 className="title is-3">{league.name}</h2>
                    <p className="subtitle is-6">Commissioner: {league.commissioner.name}</p>
                    <p>Season: {league.season_year}</p>
                    <p>Members: {members.length} / {league.max_players}</p>
                  </div>
                </div>
              </div>
              <div className="level-right">
                <div className="level-item">
                  {isCommissioner && (
                    <button 
                      onClick={handleGenerateInvite}
                      disabled={generatingInvite}
                      className={`button is-primary ${generatingInvite ? 'is-loading' : ''}`}
                    >
                      {!generatingInvite && 'Invite Players'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Invite Link Section */}
          {showInvite && inviteLink && (
            <div className="box">
              <h3 className="title is-5">Invite Link</h3>
              <p className="content">
                Share this link with players to invite them to join your league:
              </p>
              <div className="field has-addons">
                <div className="control is-expanded">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="input"
                  />
                </div>
                <div className="control">
                  <button
                    onClick={copyInviteLink}
                    className={`button ${copied ? 'is-success' : 'is-primary'}`}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
              <p className="help">
                This link will expire in 7 days and can only be used once per person.
              </p>
            </div>
          )}

          {/* Temporary Realtime Test */}
          <RealtimeTest />

          <div className="columns">
            {/* League Members */}
            <div className="column">
              <div className="box">
                <div className="level">
                  <div className="level-left">
                    <div className="level-item">
                      <h3 className="title is-5">League Members</h3>
                    </div>
                  </div>
                  <div className="level-right">
                    <div className="level-item">
                      <div className="field is-grouped">
                        <div className="control">
                          <span className={`tag is-small ${
                            realtimeStatus === 'connected' ? 'is-success' : 
                            realtimeStatus === 'connecting' ? 'is-warning' : 
                            realtimeStatus === 'error' ? 'is-danger' : 'is-light'
                          }`}>
                            {realtimeStatus === 'connected' ? '🟢 Live' : 
                             realtimeStatus === 'connecting' ? '🟡 Connecting' : 
                             realtimeStatus === 'error' ? '🔴 Error' : '⚫ Offline'}
                          </span>
                        </div>
                        <div className="control">
                          <button 
                            onClick={refreshLeagueData}
                            className="button is-small is-light"
                            title="Refresh member list"
                          >
                            🔄
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {members.length === 0 ? (
                  <p className="has-text-grey has-text-centered">No members yet</p>
                ) : (
                  <div>
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className={`notification ${
                          member.is_eliminated ? 'is-danger is-light' : 'is-light'
                        } mb-3`}
                      >
                        <div className="level">
                          <div className="level-left">
                            <div className="level-item">
                              <div>
                                <p className="has-text-weight-semibold">
                                  {member.profile.name || member.profile.email}
                                  {member.user_id === session.user?.id && ' (You)'}
                                  {league.commissioner.email === member.profile.email && ' 👑'}
                                </p>
                                <p className="is-size-7 has-text-grey">
                                  Joined {new Date(member.joined_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="level-right">
                            <div className="level-item">
                              {member.is_eliminated && (
                                <span className="tag is-danger">
                                  Eliminated Week {member.eliminated_week}
                                </span>
                              )}
                              {isCommissioner && 
                               member.user_id !== session.user?.id && 
                               league.commissioner.email !== member.profile.email && (
                                <button
                                  onClick={() => setShowRemoveConfirm(member.id)}
                                  disabled={removingMember === member.id}
                                  className={`button is-small is-danger is-outlined ml-2 ${
                                    removingMember === member.id ? 'is-loading' : ''
                                  }`}
                                >
                                  {removingMember !== member.id && 'Remove'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Your Picks */}
            <div className="column">
              <div className="box">
                <h3 className="title is-5">Your Picks</h3>
                {userPicks.length === 0 ? (
                  <p className="has-text-grey has-text-centered">No picks made yet</p>
                ) : (
                  <div>
                    {userPicks.map((pick) => (
                      <div key={pick.id} className="notification is-primary is-light mb-3">
                        <div className="level">
                          <div className="level-left">
                            <div className="level-item">
                              <div>
                                <p className="has-text-weight-semibold">Week {pick.week}</p>
                                <p className="is-size-7 has-text-grey">
                                  {new Date(pick.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="level-right">
                            <div className="level-item">
                              <div className="has-text-right">
                                <p className="has-text-weight-semibold has-text-primary">{pick.team.abbreviation}</p>
                                <p className="is-size-7 has-text-grey">{pick.team.name}</p>
                              </div>
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
        </div>
      </section>

      {/* Remove Member Confirmation Dialog */}
      {showRemoveConfirm && (
        <div className="modal is-active">
          <div className="modal-background" onClick={() => setShowRemoveConfirm(null)}></div>
          <div className="modal-card">
            <header className="modal-card-head">
              <p className="modal-card-title">Remove Member</p>
              <button 
                className="delete" 
                aria-label="close"
                onClick={() => setShowRemoveConfirm(null)}
              ></button>
            </header>
            <section className="modal-card-body">
              <p>
                Are you sure you want to remove this member from the league? This action cannot be undone.
              </p>
            </section>
            <footer className="modal-card-foot">
              <button
                onClick={() => handleRemoveMember(showRemoveConfirm)}
                disabled={removingMember === showRemoveConfirm}
                className={`button is-danger ${removingMember === showRemoveConfirm ? 'is-loading' : ''}`}
              >
                {removingMember !== showRemoveConfirm && 'Remove'}
              </button>
              <button 
                className="button"
                onClick={() => setShowRemoveConfirm(null)}
              >
                Cancel
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  )
}

export default async function LeagueOverview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LeagueOverviewContent leagueId={id} />
    </Suspense>
  )
}