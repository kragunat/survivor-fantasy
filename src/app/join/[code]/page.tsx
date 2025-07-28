'use client'

import { useParams } from 'next/navigation'
import { Suspense } from 'react'
import JoinLeagueClient from './client'

function JoinLeagueContent() {
  const params = useParams()
  const code = params.code as string
  
  return <JoinLeagueClient code={code} />
}

export default function JoinLeague() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <JoinLeagueContent />
    </Suspense>
  )
}