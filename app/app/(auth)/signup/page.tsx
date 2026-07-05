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
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSignup = async () => {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error, data } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: 'https://kingsolomonhq.com/demo'
      }
    })
    
    if (error) {
      if (error.message.toLowerCase().includes('already registered') || 
          error.message.toLowerCase().includes('already exists') ||
          error.message.toLowerCase().includes('user already')) {
        setError('An account with this email already exists. Please sign in instead.')
      } else if (error.message.toLowerCase().includes('rate limit') ||
                 error.message.toLowerCase().includes('email rate')) {
        setError('Too many attempts. Please wait a few minutes and try again.')
      } else if (error.message.toLowerCase().includes('password')) {
        setError('Password must be at least 6 characters.')
      } else {
        setError('Something went wrong. Please try again.')
      }
      setLoading(false)
      return
    }

    // If user already confirmed (shouldn't need email confirmation)
    if (data.user && data.session) {
      router.push('/brand-setup')
      return
    }

    // New user — needs to confirm email
    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div style={{minHeight:'100vh',background:'#0F2318',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}}>
        <div style={{width:'100%',maxWidth:440,textAlign:'center'}}>
          <svg width="48" height="38" viewBox="0 0 56 44" fill="none" style={{marginBottom:24}}><path d="M4 36L12 14L22 26L28 6L34 26L44 14L52 36H4Z" fill="#C9A84C"/><rect x="4" y="36" width="48" height="6" rx="2" fill="#A07830"/></svg>
          <h1 style={{fontFamily:'Georgia,serif',fontSize:24,fontWeight:700,color:'#F5F0E8',marginBottom:12}}>Check your email</h1>
          <p style={{fontSize:15,color:'#C8C2B6',lineHeight:1.7,marginBottom:8}}>We sent a confirmation link to</p>
          <p style={{fontSize:15,color:'#C9A84C',fontWeight:600,marginBottom:16}}>{email}</p>
          <p style={{fontSize:14,color:'#C8C2B6',lineHeight:1.7,marginBottom:32}}>Click the link in the email to activate your account. Once confirmed, you'll be taken to your dashboard.</p>
          <p style={{fontSize:13,color:'rgba(197,194,186,0.4)'}}>Didn't receive it? Check your spam folder or <Link href="/signup" style={{color:'#C9A84C'}}>try again</Link>.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{minHeight:'100vh',background:'#0F2318',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}}>
      <div style={{width:'100%',maxWidth:440}}>
        <div style={{textAlign:'center',marginBottom:40}}>
          <svg width="40" height="32" viewBox="0 0 56 44" fill="none" style={{marginBottom:16}}><path d="M4 36L12 14L22 26L28 6L34 26L44 14L52 36H4Z" fill="#C9A84C"/><rect x="4" y="36" width="48" height="6" rx="2" fill="#A07830"/></svg>
          <h1 style={{fontFamily:'Georgia,serif',fontSize:28,fontWeight:700,color:'#F5F0E8',marginBottom:8}}>Create your account</h1>
          <p style={{fontSize:14,color:'#C8C2B6'}}>King Solomon — early access</p>
        </div>

        {error && (
          <div style={{background:'rgba(232,120,120,0.1)',border:'1px solid rgba(232,120,120,0.3)',borderRadius:8,padding:'12px 16px',marginBottom:20}}>
            <p style={{color:'#e87878',fontSize:13,lineHeight:1.5}}>{error}</p>
            {error.includes('already exists') && (
              <Link href="/login" style={{color:'#C9A84C',fontSize:13,textDecoration:'none',fontWeight:600}}>Sign in instead →</Link>
            )}
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
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{width:'100%',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:8,padding:'14px 16px',color:'#F5F0E8',fontSize:15,outline:'none',marginBottom:24}}
        />
        <button
          onClick={handleSignup}
          disabled={loading}
          style={{width:'100%',background:'#C9A84C',color:'#0F2318',border:'none',borderRadius:8,padding:'14px',fontSize:15,fontWeight:600,cursor:'pointer',marginBottom:24}}
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
        <p style={{textAlign:'center',fontSize:13,color:'rgba(197,194,186,0.5)'}}>
          Already have an account?{' '}
          <Link href="/login" style={{color:'#C9A84C',textDecoration:'none'}}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}