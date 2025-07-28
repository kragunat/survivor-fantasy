'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'

const JoinLeagueClient = dynamic(() => import('./client'), {
  ssr: false,
  loading: () => <div className="min-h-screen flex items-center justify-center">Loading...</div>
})

export default function JoinLeagueWrapper({ code }: { code: string }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <JoinLeagueClient code={code} />
    </Suspense>
  )
}