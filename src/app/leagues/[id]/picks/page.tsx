'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Team {
  id: number
  name: string
  abbreviation: string
}

interface Game {
  id: number
  week: number
  game_time: string
  home_score: number | null
  away_score: number | null
  is_final: boolean
  home_team: Team
  away_team: Team
}

interface CurrentPick {
  id: string
  team_id: number
  team: Team
}

function PicksPageContent({ leagueId }: { leagueId: string }) {
  return <PicksPageContentImpl leagueId={leagueId} />
}

function PicksPageContentImpl({ leagueId }: { leagueId: string }) {
  const sessionResult = useSession()
  const { data: session, status } = sessionResult || { data: null, status: 'loading' }
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [games, setGames] = useState<Game[]>([])
  const [currentPick, setCurrentPick] = useState<CurrentPick | null>(null)
  const [usedTeamIds, setUsedTeamIds] = useState<number[]>([])
  const [pickableWeek, setPickableWeek] = useState(0)
  const [picksLocked, setPicksLocked] = useState(false)
  const [picksUnlockTime, setPicksUnlockTime] = useState('')
  const [pickDeadline, setPickDeadline] = useState<string | null>(null)
  const [isEliminated, setIsEliminated] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)

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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    
    if (status === 'authenticated') {
      fetchWeekData()
    }
  }, [leagueId, status])

  const fetchWeekData = async () => {
    try {
      const response = await fetch(`/api/games/current-week?leagueId=${leagueId}`)
      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to load games')
        return
      }

      const data = await response.json()
      setGames(data.games)
      setCurrentPick(data.currentPick)
      setUsedTeamIds(data.usedTeamIds)
      setPickableWeek(data.pickableWeek)
      setPicksLocked(data.picksLocked)
      setPicksUnlockTime(data.picksUnlockTime)
      setPickDeadline(data.pickDeadline)
      setIsEliminated(data.isEliminated)
      
      // Set selected team to current pick if exists
      if (data.currentPick) {
        setSelectedTeamId(data.currentPick.team_id)
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleTeamSelect = (teamId: number) => {
    if (usedTeamIds.includes(teamId)) return
    if (picksLocked) return
    if (isEliminated) return
    
    setSelectedTeamId(teamId)
  }

  const handleSubmitPick = async () => {
    if (!selectedTeamId) return
    
    setSubmitting(true)
    setError('')
    
    try {
      const response = await fetch(`/api/leagues/${leagueId}/picks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId: selectedTeamId,
          week: pickableWeek,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to submit pick')
        return
      }

      const data = await response.json()
      setCurrentPick(data.pick)
      
      // Show success message
      const teamName = games
        .flatMap(g => [g.home_team, g.away_team])
        .find(t => t.id === selectedTeamId)?.name
      
      setError('') // Clear any errors
      alert(`Pick submitted successfully! You selected ${teamName} for Week ${pickableWeek}`)
      
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setSubmitting(false)
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
            <p className="title is-4 mt-4">Loading games...</p>
          </div>
        </div>
      </section>
    )
  }

  const formatGameTime = (gameTime: string) => {
    return new Date(gameTime).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    })
  }

  const formatDeadline = (deadline: string) => {
    return new Date(deadline).toLocaleString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    })
  }

  return (
    <div>
      <nav className="navbar" role="navigation" aria-label="main navigation">
        <div className="navbar-brand">
          <Link href={`/leagues/${leagueId}`} className="navbar-item">
            <span className="icon">
              <i className="fas fa-arrow-left"></i>
            </span>
            <span>Back to League</span>
          </Link>
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
          <h1 className="title">Week {pickableWeek} Picks</h1>

          {/* Status Messages */}
          {error && (
            <div className="notification is-danger">
              <button className="delete" onClick={() => setError('')}></button>
              {error}
            </div>
          )}

          {isEliminated && (
            <div className="notification is-danger">
              <p className="has-text-weight-semibold">You have been eliminated from this league.</p>
              <p>You can no longer make picks.</p>
            </div>
          )}

          {picksLocked && !isEliminated && (
            <div className="notification is-warning">
              <p className="has-text-weight-semibold">Picks are currently locked.</p>
              <p>Picks will unlock after Monday Night Football: {picksUnlockTime}</p>
            </div>
          )}

          {!picksLocked && !isEliminated && pickDeadline && (
            <div className="notification is-info">
              <p className="has-text-weight-semibold">Pick Deadline: {formatDeadline(pickDeadline)}</p>
              <p>Make your pick before the first game of the week!</p>
            </div>
          )}

          {/* Current Pick Display */}
          {currentPick && (
            <div className="box">
              <h2 className="subtitle">Your Current Pick</h2>
              <div className="notification is-primary is-light">
                <p className="title is-4">{currentPick.team.name}</p>
                <p className="subtitle is-6">{currentPick.team.abbreviation}</p>
              </div>
            </div>
          )}

          {/* Games List */}
          {!picksLocked && !isEliminated && (
            <div className="box">
              <h2 className="subtitle">Select Your Team</h2>
              <p className="mb-4">Choose one team to win this week. Teams you've already used are grayed out.</p>
              
              {games.length === 0 ? (
                <p className="has-text-grey has-text-centered">No games scheduled for this week</p>
              ) : (
                <div className="columns is-multiline">
                  {games.map((game) => (
                    <div key={game.id} className="column is-full">
                      <div className="box">
                        <p className="has-text-centered mb-3">
                          <strong>{formatGameTime(game.game_time)}</strong>
                        </p>
                        <div className="columns is-vcentered">
                          <div className="column">
                            <button
                              onClick={() => handleTeamSelect(game.away_team.id)}
                              disabled={usedTeamIds.includes(game.away_team.id)}
                              className={`button is-fullwidth ${
                                selectedTeamId === game.away_team.id ? 'is-primary' : ''
                              } ${usedTeamIds.includes(game.away_team.id) ? 'is-static' : ''}`}
                            >
                              <div>
                                <p className="has-text-weight-semibold">{game.away_team.abbreviation}</p>
                                <p className="is-size-7">{game.away_team.name}</p>
                                {usedTeamIds.includes(game.away_team.id) && (
                                  <p className="is-size-7 has-text-danger">Already Used</p>
                                )}
                              </div>
                            </button>
                          </div>
                          <div className="column is-narrow">
                            <p className="has-text-centered">@</p>
                          </div>
                          <div className="column">
                            <button
                              onClick={() => handleTeamSelect(game.home_team.id)}
                              disabled={usedTeamIds.includes(game.home_team.id)}
                              className={`button is-fullwidth ${
                                selectedTeamId === game.home_team.id ? 'is-primary' : ''
                              } ${usedTeamIds.includes(game.home_team.id) ? 'is-static' : ''}`}
                            >
                              <div>
                                <p className="has-text-weight-semibold">{game.home_team.abbreviation}</p>
                                <p className="is-size-7">{game.home_team.name}</p>
                                {usedTeamIds.includes(game.home_team.id) && (
                                  <p className="is-size-7 has-text-danger">Already Used</p>
                                )}
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Submit Button */}
              {selectedTeamId && !currentPick && (
                <div className="has-text-centered mt-5">
                  <button
                    onClick={handleSubmitPick}
                    disabled={submitting}
                    className={`button is-primary is-large ${submitting ? 'is-loading' : ''}`}
                  >
                    {!submitting && 'Submit Pick'}
                  </button>
                </div>
              )}

              {selectedTeamId && currentPick && selectedTeamId !== currentPick.team_id && (
                <div className="has-text-centered mt-5">
                  <button
                    onClick={handleSubmitPick}
                    disabled={submitting}
                    className={`button is-primary is-large ${submitting ? 'is-loading' : ''}`}
                  >
                    {!submitting && 'Change Pick'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default async function PicksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <PicksPageContent leagueId={id} />
    </Suspense>
  )
}