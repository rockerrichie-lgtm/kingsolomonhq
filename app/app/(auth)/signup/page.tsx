'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async () => {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-full max-w-md p-8">
        <h1 className="text-3xl font-bold text-white mb-2">King Solomon</h1>
        <p className="text-zinc-400 mb-8">Create your account</p>
        {error && <p className="text-red-400 mb-4 text-sm">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full bg-zinc-900 text-white border border-zinc-700 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:border-amber-500"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full bg-zinc-900 text-white border border-zinc-700 rounded-lg px-4 py-3 mb-6 focus:outline-none focus:border-amber-500"
        />
        <button
          onClick={handleSignup}
          disabled={loading}
          className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold py-3 rounded-lg transition"
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
        <p className="text-zinc-500 text-sm text-center mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-amber-500 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}