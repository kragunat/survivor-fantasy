'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function JoinLeagueClient({ code }: { code: string }) {
  // Early return for server-side rendering
  if (typeof window === 'undefined') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return <JoinLeagueClientImpl code={code} />
}

function JoinLeagueClientImpl({ code }: { code: string }) {
  const sessionResult = useSession()
  const { data: session, status } = sessionResult || { data: null, status: 'loading' }
  const router = useRouter()
  const [invitation, setInvitation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        const response = await fetch(`/api/invitations/${code}`)
        if (response.ok) {
          const data = await response.json()
          setInvitation(data)
        } else {
          setError('Invalid or expired invitation link')
        }
      } catch (err) {
        setError('Failed to load invitation')
      } finally {
        setLoading(false)
      }
    }

    fetchInvitation()
  }, [code])

  const handleJoin = async () => {
    if (!session?.user) return

    setJoining(true)
    try {
      const response = await fetch(`/api/invitations/${code}/accept`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/leagues/${data.leagueId}`)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to join league')
      }
    } catch (err) {
      setError('Failed to join league')
    } finally {
      setJoining(false)
    }
  }

  useEffect(() => {
    // If user is logged in and invitation is valid, auto-join
    if (session?.user && invitation && !joining) {
      handleJoin()
    }
  }, [session?.user?.id, invitation?.id, joining])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p>Loading invitation...</p>
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
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-50 to-white">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
          <h1 className="text-3xl font-bold text-primary-900 mb-4">
            Join League
          </h1>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">{invitation?.league?.name}</h2>
            <p className="text-gray-600">You've been invited to join this Survivor league!</p>
          </div>
          <Link 
            href={`/auth/signin?callbackUrl=${encodeURIComponent(`/join/${code}`)}`}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition font-semibold inline-block"
          >
            Sign In to Join
          </Link>
          <p className="mt-4 text-sm text-gray-500">
            Don't have an account? You can create one during sign in.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-50 to-white">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
        {joining ? (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-primary-900 mb-2">Joining League...</h1>
            <p className="text-gray-600">Please wait while we add you to the league.</p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-primary-900 mb-4">
              Welcome!
            </h1>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">{invitation?.league?.name}</h2>
              <p className="text-gray-600">You're about to join this Survivor league.</p>
            </div>
            <button
              onClick={handleJoin}
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition font-semibold"
            >
              Join League
            </button>
          </>
        )}
      </div>
    </div>
  )
}