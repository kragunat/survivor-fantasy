import { Suspense } from 'react'
import JoinLeagueClient from './client'

export default async function JoinLeague({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <JoinLeagueClient code={code} />
    </Suspense>
  )
}