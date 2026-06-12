'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else { router.push('/dashboard') }
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/dashboard` } })
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#0F2318'}}>
      <div style={{width:'100%',maxWidth:'400px',padding:'40px 32px',borderRadius:'16px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
        <div style={{textAlign:'center',marginBottom:'32px'}}>
          <svg width="40" height="32" viewBox="0 0 56 44" fill="none" style={{margin:'0 auto 16px'}}>
            <path d="M4 36L12 14L22 26L28 6L34 26L44 14L52 36H4Z" fill="#C9A84C"/>
            <rect x="4" y="36" width="48" height="6" rx="2" fill="#A07830"/>
          </svg>
          <h1 style={{color:'#F5F0E8',fontFamily:'Georgia,serif',fontSize:'22px',fontWeight:'700',letterSpacing:'0.1em',margin:'0 0 4px'}}>KING SOLOMON</h1>
          <p style={{color:'#C9A84C',fontSize:'13px',margin:'0'}}>Sign in to your account</p>
        </div>

        <button onClick={handleGoogle} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:'10px',padding:'12px',borderRadius:'8px',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)',color:'#F5F0E8',fontSize:'14px',cursor:'pointer',marginBottom:'20px'}}>
          Sign in with Google
        </button>

        <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'20px'}}>
          <div style={{flex:1,height:'1px',background:'rgba(255,255,255,0.08)'}}></div>
          <span style={{color:'rgba(197,194,186,0.4)',fontSize:'12px'}}>or</span>
          <div style={{flex:1,height:'1px',background:'rgba(255,255,255,0.08)'}}></div>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{marginBottom:'16px'}}>
            <label style={{color:'#C8C2B6',fontSize:'12px',display:'block',marginBottom:'6px'}}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required
              style={{width:'100%',padding:'12px 16px',borderRadius:'8px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'#F5F0E8',fontSize:'14px',outline:'none',boxSizing:'border-box'}}/>
          </div>
          <div style={{marginBottom:'16px'}}>
            <label style={{color:'#C8C2B6',fontSize:'12px',display:'block',marginBottom:'6px'}}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
              style={{width:'100%',padding:'12px 16px',borderRadius:'8px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'#F5F0E8',fontSize:'14px',outline:'none',boxSizing:'border-box'}}/>
          </div>
          {error && <p style={{color:'#f87171',fontSize:'13px',marginBottom:'12px'}}>{error}</p>}
          <button type="submit" disabled={loading}
            style={{width:'100%',padding:'12px',borderRadius:'8px',background:'#C9A84C',color:'#0F2318',fontSize:'14px',fontWeight:'600',border:'none',cursor:'pointer'}}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p style={{textAlign:'center',fontSize:'13px',marginTop:'24px',color:'rgba(197,194,186,0.5)'}}>
          No account? <Link href="/auth/signup" style={{color:'#C9A84C'}}>Sign up</Link>
        </p>
      </div>
    </div>
  )
}