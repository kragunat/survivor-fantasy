import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { redirect } from 'next/navigation'

export default async function Dashboard() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
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
              <button className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 transition">
                Create League
              </button>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Join a League</h3>
              <p className="text-gray-600 mb-4">Enter an invitation code to join an existing league.</p>
              <button className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 transition">
                Join League
              </button>
            </div>
          </div>
          
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Leagues</h3>
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 text-center text-gray-500">
                You are not currently in any leagues.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}