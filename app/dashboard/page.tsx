'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login') }
      else { setUser(user); setLoading(false) }
    }
    getUser()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#0F2318'}}>
      <div style={{color:'#C9A84C'}}>Loading...</div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#0F2318'}}>
      <nav style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 32px',borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <svg width="28" height="22" viewBox="0 0 56 44" fill="none">
            <path d="M4 36L12 14L22 26L28 6L34 26L44 14L52 36H4Z" fill="#C9A84C"/>
            <rect x="4" y="36" width="48" height="6" rx="2" fill="#A07830"/>
          </svg>
          <div>
            <div style={{color:'#F5F0E8',fontFamily:'Georgia,serif',fontWeight:'700',fontSize:'14px',letterSpacing:'0.1em'}}>KING SOLOMON</div>
            <div style={{color:'#C9A84C',fontSize:'11px'}}>Consumer intelligence that tells you why.</div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
          <span style={{color:'#C8C2B6',fontSize:'13px'}}>{user?.email}</span>
          <button onClick={handleSignOut} style={{padding:'8px 16px',borderRadius:'8px',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.08)',color:'#F5F0E8',fontSize:'13px',cursor:'pointer'}}>
            Sign out
          </button>
        </div>
      </nav>

      <div style={{maxWidth:'1000px',margin:'0 auto',padding:'64px 32px',textAlign:'center'}}>
        <svg width="56" height="44" viewBox="0 0 56 44" fill="none" style={{margin:'0 auto 24px'}}>
          <path d="M4 36L12 14L22 26L28 6L34 26L44 14L52 36H4Z" fill="#C9A84C"/>
          <rect x="4" y="36" width="48" height="6" rx="2" fill="#A07830"/>
        </svg>
        <h1 style={{color:'#F5F0E8',fontFamily:'Georgia,serif',fontSize:'36px',fontWeight:'700',marginBottom:'12px'}}>
          Welcome to King Solomon
        </h1>
        <p style={{color:'#C9A84C',fontSize:'18px',marginBottom:'8px'}}>
          Hello, {user?.user_metadata?.full_name || user?.email} 👑
        </p>
        <p style={{color:'#C8C2B6',fontSize:'15px',marginBottom:'48px'}}>
          Your brand intelligence dashboard is being built.
        </p>

        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'16px',maxWidth:'900px',margin:'0 auto'}}>
          {['Awareness','Consideration','Usage','Imagery','Buzz'].map(kpi => (
            <div key={kpi} style={{padding:'24px 16px',borderRadius:'12px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
              <div style={{color:'#C9A84C',fontSize:'10px',fontWeight:'600',letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:'12px'}}>{kpi}</div>
              <div style={{color:'#F5F0E8',fontFamily:'Georgia,serif',fontSize:'32px',fontWeight:'700',marginBottom:'6px'}}>--</div>
              <div style={{color:'rgba(197,194,186,0.4)',fontSize:'11px'}}>Coming soon</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}