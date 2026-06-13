'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error, data } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) {
      if (error.message.toLowerCase().includes('invalid login') ||
          error.message.toLowerCase().includes('invalid credentials')) {
        setError('Incorrect email or password. Please try again.')
      } else if (error.message.toLowerCase().includes('email not confirmed')) {
        setError('Please confirm your email before signing in. Check your inbox.')
      } else {
        setError('Something went wrong. Please try again.')
      }
      setLoading(false)
      return
    }

    // Check if brand is set up
    const { data: brands } = await supabase.from('brands').select('id').eq('user_id', data.user.id).single()
    if (!brands) {
      router.push('/brand-setup')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div style={{minHeight:'100vh',background:'#0F2318',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}}>
      <div style={{width:'100%',maxWidth:440}}>
        <div style={{textAlign:'center',marginBottom:40}}>
          <svg width="40" height="32" viewBox="0 0 56 44" fill="none" style={{marginBottom:16}}><path d="M4 36L12 14L22 26L28 6L34 26L44 14L52 36H4Z" fill="#C9A84C"/><rect x="4" y="36" width="48" height="6" rx="2" fill="#A07830"/></svg>
          <h1 style={{fontFamily:'Georgia,serif',fontSize:28,fontWeight:700,color:'#F5F0E8',marginBottom:8}}>Sign in</h1>
          <p style={{fontSize:14,color:'#C8C2B6'}}>King Solomon — brand intelligence</p>
        </div>

        {error && (
          <div style={{background:'rgba(232,120,120,0.1)',border:'1px solid rgba(232,120,120,0.3)',borderRadius:8,padding:'12px 16px',marginBottom:20}}>
            <p style={{color:'#e87878',fontSize:13,lineHeight:1.5}}>{error}</p>
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{width:'100%',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:8,padding:'14px 16px',color:'#F5F0E8',fontSize:15,outline:'none',marginBottom:12}}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{width:'100%',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:8,padding:'14px 16px',color:'#F5F0E8',fontSize:15,outline:'none',marginBottom:24}}
        />
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{width:'100%',background:'#C9A84C',color:'#0F2318',border:'none',borderRadius:8,padding:'14px',fontSize:15,fontWeight:600,cursor:'pointer',marginBottom:24}}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
        <p style={{textAlign:'center',fontSize:13,color:'rgba(197,194,186,0.5)'}}>
          No account?{' '}
          <Link href="/signup" style={{color:'#C9A84C',textDecoration:'none'}}>Sign up</Link>
        </p>
      </div>
    </div>
  )
}