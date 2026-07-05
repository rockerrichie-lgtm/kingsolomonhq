'use client'

import { useState, useEffect } from 'react'

const GOLD = '#C9A84C'
const DEEP = '#0F2318'
const CREAM = '#F5F0E8'
const CREAM_DIM = '#C8C2B6'
const WHITE = '#ffffff'
const DARK = '#1a1a1a'
const BODY_TEXT = '#444444'
const BORDER = '#f0f0f0'
const MID_GREEN = '#1F4A2F'
const CARD_BG = '#FDFAF3'

const SUPABASE_URL = 'https://alrwyeenxeuxgkcskkes.supabase.co'
const SUPABASE_KEY = 'sb_publishable_o1j3z16rgfySe5QnJgMHyQ_iR0sGvme'

export default function ConnectPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [brand, setBrand] = useState('')
  const [product, setProduct] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (success) {
      const script = document.createElement('script')
      script.src = 'https://assets.calendly.com/assets/external/widget.js'
      script.async = true
      document.body.appendChild(script)
      return () => { document.body.removeChild(script) }
    }
  }, [success])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/waitlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ email, source: 'connect', name, brand_name: brand, product_interest: product })
      })
      await fetch('/api/send-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, brand, product })
      }).catch(() => {})
    } catch {}
    setLoading(false)
    setSuccess(true)
  }

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: ${WHITE}; color: ${DARK}; font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
        input, select, textarea { outline: none; }
        input:focus, select:focus, textarea:focus { border-color: rgba(201,168,76,0.5) !important; }
        a { text-decoration: none; }
      `}</style>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />

      {/* NAV — dark green */}
      <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 48px',background:DEEP,borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
        <a href="/" style={{display:'flex',alignItems:'center',gap:10}}>
          <svg width="24" height="19" viewBox="0 0 56 44" fill="none"><path d="M4 36L12 14L22 26L28 6L34 26L44 14L52 36H4Z" fill="#C9A84C"/><rect x="4" y="36" width="48" height="6" rx="2" fill="#A07830"/></svg>
          <div style={{display:'flex',flexDirection:'column',lineHeight:1.1}}>
            <span style={{fontFamily:'Playfair Display,serif',fontSize:14,fontWeight:700,color:CREAM,letterSpacing:'0.1em'}}>KING SOLOMON</span>
            <span style={{fontSize:10,color:GOLD}}>Consumer intelligence that tells you why.</span>
          </div>
        </a>
        <div style={{display:'flex',alignItems:'center',gap:24}}>
          <a href="/" style={{color:CREAM_DIM,fontSize:14}}>Home</a>
          <a href="/pricing" style={{color:CREAM_DIM,fontSize:14}}>Pricing</a>
          <a href="/pricing" style={{background:GOLD,color:DEEP,fontSize:14,fontWeight:600,padding:'10px 22px',borderRadius:6}}>Start tracking</a>
        </div>
      </nav>

      {/* HERO — white */}
      <section style={{background:WHITE,textAlign:'center',padding:'120px 24px 48px',borderBottom:`1px solid ${BORDER}`}}>
        <p style={{fontSize:11,fontWeight:600,letterSpacing:'0.18em',textTransform:'uppercase',color:GOLD,marginBottom:14}}>Let's talk</p>
        <h1 style={{fontFamily:'Playfair Display,serif',fontSize:25,fontWeight:800,lineHeight:1.2,color:DARK,marginBottom:14}}>
          Book a free discovery call.
        </h1>
        <p style={{fontSize:15,color:BODY_TEXT,maxWidth:480,margin:'0 auto',lineHeight:1.75}}>
          Tell us about your brand and we will show you what Solomon's IQ finds before you spend a rupee. 30 minutes. No pitch. Just intelligence.
        </p>
      </section>

      {/* BODY — white */}
      <main style={{padding:'48px 24px',maxWidth:960,margin:'0 auto'}}>
        {!success ? (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>

            {/* FORM */}
            <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'32px 28px'}}>
              <h2 style={{fontFamily:'Playfair Display,serif',fontSize:20,fontWeight:700,color:DARK,marginBottom:24}}>Tell us about you</h2>
              <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:16}}>
                <div>
                  <label style={{fontSize:11,fontWeight:600,letterSpacing:'0.12em',textTransform:'uppercase',color:GOLD,display:'block',marginBottom:6}}>Your name</label>
                  <input
                    type="text" placeholder="Full name" required
                    value={name} onChange={e => setName(e.target.value)}
                    style={{width:'100%',background:WHITE,border:`1px solid ${BORDER}`,borderRadius:7,padding:'10px 14px',color:DARK,fontSize:15}}
                  />
                </div>
                <div>
                  <label style={{fontSize:11,fontWeight:600,letterSpacing:'0.12em',textTransform:'uppercase',color:GOLD,display:'block',marginBottom:6}}>Work email</label>
                  <input
                    type="email" placeholder="your@company.com" required
                    value={email} onChange={e => setEmail(e.target.value)}
                    style={{width:'100%',background:WHITE,border:`1px solid ${BORDER}`,borderRadius:7,padding:'10px 14px',color:DARK,fontSize:15}}
                  />
                </div>
                <div>
                  <label style={{fontSize:11,fontWeight:600,letterSpacing:'0.12em',textTransform:'uppercase',color:GOLD,display:'block',marginBottom:6}}>Brand name</label>
                  <input
                    type="text" placeholder="Your brand" required
                    value={brand} onChange={e => setBrand(e.target.value)}
                    style={{width:'100%',background:WHITE,border:`1px solid ${BORDER}`,borderRadius:7,padding:'10px 14px',color:DARK,fontSize:15}}
                  />
                </div>
                <div>
                  <label style={{fontSize:11,fontWeight:600,letterSpacing:'0.12em',textTransform:'uppercase',color:GOLD,display:'block',marginBottom:6}}>Which product interests you?</label>
                  <select
                    required value={product} onChange={e => setProduct(e.target.value)}
                    style={{width:'100%',background:WHITE,border:`1px solid ${BORDER}`,borderRadius:7,padding:'10px 14px',color:product?DARK:'#aaa',fontSize:15,cursor:'pointer',appearance:'none'}}
                  >
                    <option value="" disabled>Select a product</option>
                    <option value="Solomon's IQ">Solomon&apos;s IQ — Brand intelligence</option>
                    <option value="Solomon's Eye">Solomon&apos;s Eye — CX audit</option>
                    <option value="Solomon's Guide">Solomon&apos;s Guide — Strategic advisory</option>
                    <option value="Multiple">Multiple products</option>
                  </select>
                </div>
                <button
                  type="submit" disabled={loading}
                  style={{background:GOLD,color:DEEP,border:'none',borderRadius:8,padding:'13px',fontSize:14,fontWeight:600,cursor:'pointer',marginTop:6,opacity:loading?0.7:1,fontFamily:'Inter,sans-serif'}}
                >
                  {loading ? 'Sending...' : 'Submit and book a call'}
                </button>
              </form>
            </div>

            {/* WHAT TO EXPECT */}
            <div style={{padding:'32px 20px'}}>
              <h2 style={{fontFamily:'Playfair Display,serif',fontSize:20,fontWeight:700,color:DARK,marginBottom:24}}>What to expect</h2>
              <div style={{display:'flex',flexDirection:'column',gap:20,marginBottom:28}}>
                {[
                  ['1','We review your brand','Before the call we run a quick scan of your brand and pull some initial signals so the conversation is grounded in real data.'],
                  ['2','30-minute call','We walk you through what we found and show you what ongoing tracking would look like for your brand.'],
                  ['3','No pressure, no pitch','You decide if it makes sense.'],
                ].map(([num, title, desc]) => (
                  <div key={num} style={{display:'flex',gap:12,alignItems:'flex-start'}}>
                    <div style={{width:28,height:28,borderRadius:'50%',background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:600,color:GOLD,flexShrink:0}}>{num}</div>
                    <div>
                      <p style={{fontSize:15,fontWeight:600,color:DARK,marginBottom:4}}>{title}</p>
                      <p style={{fontSize:15,color:BODY_TEXT,lineHeight:1.75}}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{background:CARD_BG,border:'1px solid rgba(201,168,76,0.2)',borderRadius:10,padding:'14px 18px'}}>
                <p style={{fontSize:11,fontWeight:600,letterSpacing:'0.12em',textTransform:'uppercase',color:GOLD,marginBottom:6}}>After you submit</p>
                <p style={{fontSize:15,color:BODY_TEXT,lineHeight:1.75}}>A confirmation email goes to your inbox and the Calendly booking opens so you can pick your preferred time right away.</p>
              </div>
            </div>

          </div>
        ) : (
          <div>
            <div style={{background:'rgba(61,138,94,0.08)',border:'1px solid rgba(61,138,94,0.2)',borderRadius:10,padding:'16px 24px',maxWidth:520,margin:'0 auto 32px',textAlign:'center'}}>
              <p style={{fontSize:14,color:MID_GREEN,fontWeight:500}}>✦ Done, {name}. A confirmation email is on its way to {email}.</p>
            </div>
            <div style={{textAlign:'center',marginBottom:20}}>
              <h2 style={{fontFamily:'Playfair Display,serif',fontSize:25,fontWeight:700,color:DARK,marginBottom:10}}>Now pick a time that works.</h2>
              <p style={{fontSize:15,color:BODY_TEXT}}>Book your 30-minute discovery call below.</p>
            </div>
            <div
              className="calendly-inline-widget"
              data-url="https://calendly.com/hello-kingsolomonhq/30min"
              style={{minWidth:320,height:700,maxWidth:800,margin:'0 auto'}}
            />
          </div>
        )}
      </main>

      {/* BOTTOM CTA — dark green */}
      <section style={{background:DEEP,padding:'48px 24px',textAlign:'center'}}>
        <h2 style={{fontFamily:'Playfair Display,serif',fontSize:25,fontWeight:700,color:CREAM,marginBottom:10}}>Questions before connecting?</h2>
        <p style={{fontSize:15,color:CREAM_DIM,maxWidth:380,margin:'0 auto 24px',lineHeight:1.75}}>Email us directly and we will respond within 4 hours on weekdays.</p>
        <a href="mailto:support@kingsolomonhq.com" style={{display:'inline-block',background:GOLD,color:DEEP,fontSize:14,fontWeight:600,padding:'12px 28px',borderRadius:8}}>support@kingsolomonhq.com</a>
      </section>

      {/* FOOTER — dark green */}
      <footer style={{background:DEEP,borderTop:'1px solid rgba(255,255,255,0.06)',padding:'28px 48px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:14}}>
        <div style={{fontFamily:'Playfair Display,serif',fontSize:14,fontWeight:700,color:CREAM,letterSpacing:'0.08em'}}>KING SOLOMON</div>
        <div style={{display:'flex',gap:24}}>
          <a href="/" style={{fontSize:13,color:CREAM_DIM}}>Home</a>
          <a href="/pricing" style={{fontSize:13,color:CREAM_DIM}}>Pricing</a>
          <a href="/login" style={{fontSize:13,color:CREAM_DIM}}>Login</a>
        </div>
        <div style={{fontSize:12,color:'rgba(200,194,182,0.35)'}}>2026 King Solomon · kingsolomonhq.com · Bengaluru, India</div>
      </footer>
    </>
  )
}