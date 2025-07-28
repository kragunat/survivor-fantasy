import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-primary-50 to-white">
      <div className="text-center max-w-4xl">
        <h1 className="text-6xl font-bold mb-4 text-primary-900">Survivor Fantasy League</h1>
        <p className="text-xl text-primary-700 mb-8">
          Pick one NFL team to win each week - but you can only pick each team once!
        </p>
        <div className="space-x-4">
          <Link href="/auth/signin?action=create">
            <button className="bg-primary-600 text-white px-8 py-4 rounded-lg hover:bg-primary-700 transition shadow-lg text-lg font-semibold">
              Create a League
            </button>
          </Link>
          <Link href="/auth/signin?action=join">
            <button className="bg-white text-primary-600 border-2 border-primary-600 px-8 py-4 rounded-lg hover:bg-primary-50 transition shadow-lg text-lg font-semibold">
              Join a League
            </button>
          </Link>
        </div>
      </div>
    </main>
  )
}