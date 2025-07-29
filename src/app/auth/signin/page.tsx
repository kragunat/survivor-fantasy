'use client'

import { signIn } from 'next-auth/react'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function SignInContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const searchParams = useSearchParams()
  const action = searchParams.get('action')
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (isSignUp) {
      // Handle sign up with Supabase
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      
      if (response.ok) {
        // Sign in immediately after signup with the callback URL
        const result = await signIn('credentials', { 
          email, 
          password, 
          callbackUrl,
          redirect: false 
        })
        
        if (result?.ok) {
          window.location.href = callbackUrl
        } else {
          setError('Failed to sign in after signup')
        }
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to sign up')
      }
    } else {
      signIn('credentials', { email, password, callbackUrl })
    }
  }

  return (
    <section className="hero is-fullheight">
      <div className="hero-body">
        <div className="container">
          <div className="columns is-centered">
            <div className="column is-one-third">
              <div className="box">
                <h2 className="title is-3 has-text-centered">
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </h2>
                
                {callbackUrl?.includes('/join/') && (
                  <div className="notification is-info is-light">
                    {isSignUp 
                      ? "Create an account to join the league you've been invited to!" 
                      : "Sign in to join the league you've been invited to!"}
                  </div>
                )}
                
                {error && (
                  <div className="notification is-danger is-light">
                    {error}
                  </div>
                )}
                
                <form onSubmit={handleSubmit}>
                  <div className="field">
                    <label className="label" htmlFor="email">Email</label>
                    <div className="control">
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="field">
                    <label className="label" htmlFor="password">Password</label>
                    <div className="control">
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="field">
                    <div className="control">
                      <button type="submit" className="button is-primary is-fullwidth">
                        {isSignUp ? 'Sign Up' : 'Sign In'}
                      </button>
                    </div>
                  </div>
                </form>
                
                <div className="has-text-centered">
                  <hr />
                  <p className="has-text-grey">Or continue with</p>
                  
                  <button
                    onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                    className="button is-white is-fullwidth mt-4"
                  >
                    <span className="icon">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    </span>
                    <span>Sign in with Google</span>
                  </button>
                </div>
                
                <div className="has-text-centered mt-5">
                  <p>
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                    <button
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="button is-text"
                    >
                      {isSignUp ? 'Sign in' : 'Sign up'}
                    </button>
                  </p>
                  
                  <Link href="/" className="button is-text is-small mt-2">
                    Back to home
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function SignIn() {
  return (
    <Suspense fallback={
      <section className="hero is-fullheight">
        <div className="hero-body">
          <div className="container has-text-centered">
            <button className="button is-loading is-large is-primary"></button>
          </div>
        </div>
      </section>
    }>
      <SignInContent />
    </Suspense>
  )
}