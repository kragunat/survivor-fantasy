import Link from 'next/link'

export default function Home() {
  return (
    <section className="hero is-fullheight">
      <div className="hero-body">
        <div className="container has-text-centered">
          <div className="columns is-centered">
            <div className="column is-8">
              <h1 className="title is-1 has-text-white">
                Survivor Fantasy League
              </h1>
              <h2 className="subtitle is-3 has-text-white">
                Pick one NFL team to win each week - but you can only pick each team once!
              </h2>
              <p className="has-text-white is-size-5 mb-6">
                Last person standing wins the league. Join your friends in the ultimate test of NFL knowledge and strategy.
              </p>
              <div className="buttons is-centered">
                <Link href="/auth/signin" className="button is-white is-large">
                  <strong>Get Started</strong>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}