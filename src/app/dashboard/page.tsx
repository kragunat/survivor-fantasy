'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
  // Early return for server-side rendering
  if (typeof window === 'undefined') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-primary-900">Survivor Fantasy League</h1>
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
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Welcome to your Dashboard</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create a New League</h3>
              <p className="text-gray-600 mb-4">Start your own survivor league and invite friends to join.</p>
              <Link 
                href="/leagues/create"
                className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 transition inline-block"
              >
                Create League
              </Link>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Join a League</h3>
              <p className="text-gray-600 mb-4">Enter an invitation code to join an existing league.</p>
              <Link 
                href="/leagues/join"
                className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 transition inline-block"
              >
                Join League
              </Link>
            </div>
          </div>
          
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Leagues</h3>
            <div className="bg-white rounded-lg shadow">
              {loading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                  <p className="text-gray-500">Loading leagues...</p>
                </div>
              ) : leagues.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  You are not currently in any leagues.
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {leagues.map((userLeague) => (
                    <div key={userLeague.league.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <h4 className="text-lg font-semibold text-gray-900">
                              {userLeague.league.name}
                            </h4>
                            {userLeague.league.commissioner.email === session.user?.email && (
                              <span className="ml-2 text-yellow-600" title="You are the commissioner">
                                👑
                              </span>
                            )}
                            {userLeague.is_eliminated && (
                              <span className="ml-2 px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full">
                                Eliminated Week {userLeague.eliminated_week}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Season {userLeague.league.season_year} • Commissioner: {userLeague.league.commissioner.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            Joined {new Date(userLeague.joined_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Link
                          href={`/leagues/${userLeague.league.id}`}
                          className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 transition"
                        >
                          View League
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  )
}