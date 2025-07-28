'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
  const { data: session, status } = useSession()
  const router = useRouter()
  const [league, setLeague] = useState<League | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [userPicks, setUserPicks] = useState<Pick[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    
    if (status === 'authenticated') {
      const fetchLeague = async () => {
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
      }

      fetchLeague()
    }
  }, [leagueId, status])

  if (!session) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p>Loading league...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-50 to-white">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <Link 
            href="/dashboard" 
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (!league) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>League not found</p>
      </div>
    )
  }

  const isCommissioner = league.commissioner.email === session.user?.email

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-primary-600 hover:text-primary-700 mr-4">
                ← Dashboard
              </Link>
              <h1 className="text-xl font-bold text-primary-900">{league.name}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{session.user?.email}</span>
              <a href="/api/auth/signout" className="text-primary-600 hover:text-primary-700">
                Sign Out
              </a>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* League Info */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{league.name}</h2>
                <p className="text-gray-600">Commissioner: {league.commissioner.name}</p>
                <p className="text-gray-600">Season: {league.season_year}</p>
                <p className="text-gray-600">
                  Members: {members.length} / {league.max_players}
                </p>
              </div>
              {isCommissioner && (
                <button className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700">
                  Invite Players
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* League Members */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">League Members</h3>
              </div>
              <div className="p-6">
                {members.length === 0 ? (
                  <p className="text-gray-500 text-center">No members yet</p>
                ) : (
                  <div className="space-y-3">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          member.is_eliminated ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
                        }`}
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {member.profile.name || member.profile.email}
                            {member.user_id === session.user?.id && ' (You)'}
                            {league.commissioner.email === member.profile.email && ' 👑'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Joined {new Date(member.joined_at).toLocaleDateString()}
                          </p>
                        </div>
                        {member.is_eliminated && (
                          <span className="text-red-600 text-sm font-medium">
                            Eliminated Week {member.eliminated_week}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Your Picks */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Your Picks</h3>
              </div>
              <div className="p-6">
                {userPicks.length === 0 ? (
                  <p className="text-gray-500 text-center">No picks made yet</p>
                ) : (
                  <div className="space-y-3">
                    {userPicks.map((pick) => (
                      <div key={pick.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">Week {pick.week}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(pick.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-primary-600">{pick.team.abbreviation}</p>
                          <p className="text-sm text-gray-500">{pick.team.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
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