import JoinLeagueWrapper from './wrapper'

export default async function JoinLeague({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  
  return <JoinLeagueWrapper code={code} />
}