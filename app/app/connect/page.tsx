'use client'

import { useState, useEffect } from 'react'

const G = '#C9A84C'
const C = '#F5F0E8'
const D = '#C8C2B6'
const BG = '#0F2318'
const GLASS = 'rgba(255,255,255,0.04)'
const GB = 'rgba(255,255,255,0.08)'

export default function ConnectPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [brand, setBrand] = useState('')
  const [product, setProduct] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const SUPABASE_URL = 'https://alrwyeenxeuxgkcskkes.supabase.co'
  const SUPABASE_KEY = 'sb_publishable_o1j3z16rgfySe5QnJgMHyQ_iR0sGvme'

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
        body: JSON.stringify({
          email,
          source: 'connect',
          name,
          brand_name: brand,
          product_interest: product
        })
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
        body { background: ${BG}; color: ${C}; font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
        input, select { outline: none; }
        input:focus, select:focus { border-color: rgba(201,168,76,0.4) !important; }
      `}</style>

      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 48px',background:'rgba(15,35,24,0.92)',backdropFilter:'blur(12px)',borderBottom:`1px solid ${GB}`}}>
        <a href="/" style={{display:'flex',alignItems:'center',gap:10,textDecoration:'none'}}>
          <svg width="26" height="20" viewBox="0 0 56 44" fill="none"><path d="M4 36L12 14L22 26L28 6L34 26L44 14L52 36H4Z" fill="#C9A84C"/><rect x="4" y="36" width="48" height="6" rx="2" fill="#A07830"/></svg>
          <div style={{display:'flex',flexDirection:'column',lineHeight:1.1}}>
            <span style={{fontFamily:'Playfair Display,serif',fontSize:15,fontWeight:700,color:C,letterSpacing:'0.1em'}}>KING SOLOMON</span>
            <span style={{fontSize:10,color:G,letterSpacing:'0.08em'}}>Consumer intelligence that tells you why.</span>
          </div>
        </a>
        <div style={{display:'flex',alignItems:'center',gap:24}}>
          <a href="/" style={{color:D,fontSize:14,textDecoration:'none'}}>Home</a>
          <a href="/pricing" style={{color:D,fontSize:14,textDecoration:'none'}}>Pricing</a>
        </div>
      </nav>

      <main style={{padding:'120px 24px 80px',maxWidth:960,margin:'0 auto'}}>

        {/* HEADER */}
        <div style={{textAlign:'center',marginBottom:56}}>
          <p style={{fontSize:11,fontWeight:600,letterSpacing:'0.18em',textTransform:'uppercase',color:G,marginBottom:16}}>Let's talk</p>
          <h1 style={{fontFamily:'Playfair Display,serif',fontSize:52,fontWeight:800,color:C,lineHeight:1.08,marginBottom:16}}>
            Book a free discovery call.
          </h1>
          <p style={{fontSize:14,color:D,maxWidth:480,margin:'0 auto',lineHeight:1.75}}>
            Tell us about your brand and we will show you what Solomon's IQ finds before you spend a rupee. 30 minutes. No pitch. Just intelligence.
          </p>
        </div>

        {!success ? (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>

            {/* FORM */}
            <div style={{background:GLASS,border:`1px solid ${GB}`,borderRadius:14,padding:'36px 32px'}}>
              <h2 style={{fontFamily:'Playfair Display,serif',fontSize:24,fontWeight:700,color:C,marginBottom:28}}>Tell us about you</h2>
              <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:18}}>

                <div>
                  <label style={{fontSize:11,fontWeight:600,letterSpacing:'0.12em',textTransform:'uppercase',color:G,display:'block',marginBottom:8}}>Your name</label>
                  <input
                    type="text" placeholder="Full name" required
                    value={name} onChange={e => setName(e.target.value)}
                    style={{width:'100%',background:GLASS,border:`1px solid ${GB}`,borderRadius:8,padding:'12px 16px',color:C,fontSize:14,transition:'border-color 0.15s'}}
                  />
                </div>

                <div>
                  <label style={{fontSize:11,fontWeight:600,letterSpacing:'0.12em',textTransform:'uppercase',color:G,display:'block',marginBottom:8}}>Work email</label>
                  <input
                    type="email" placeholder="your@company.com" required
                    value={email} onChange={e => setEmail(e.target.value)}
                    style={{width:'100%',background:GLASS,border:`1px solid ${GB}`,borderRadius:8,padding:'12px 16px',color:C,fontSize:14,transition:'border-color 0.15s'}}
                  />
                </div>

                <div>
                  <label style={{fontSize:11,fontWeight:600,letterSpacing:'0.12em',textTransform:'uppercase',color:G,display:'block',marginBottom:8}}>Brand name</label>
                  <input
                    type="text" placeholder="Your brand" required
                    value={brand} onChange={e => setBrand(e.target.value)}
                    style={{width:'100%',background:GLASS,border:`1px solid ${GB}`,borderRadius:8,padding:'12px 16px',color:C,fontSize:14,transition:'border-color 0.15s'}}
                  />
                </div>

                <div>
                  <label style={{fontSize:11,fontWeight:600,letterSpacing:'0.12em',textTransform:'uppercase',color:G,display:'block',marginBottom:8}}>Which product interests you?</label>
                  <select
                    required value={product} onChange={e => setProduct(e.target.value)}
                    style={{width:'100%',background:'#0F2318',border:`1px solid ${GB}`,borderRadius:8,padding:'12px 16px',color:product ? C : 'rgba(197,194,186,0.4)',fontSize:14,cursor:'pointer',appearance:'none',transition:'border-color 0.15s'}}
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
                  style={{background:G,color:BG,border:'none',borderRadius:8,padding:'14px',fontSize:14,fontWeight:600,cursor:'pointer',marginTop:8,opacity:loading?0.7:1}}
                >
                  {loading ? 'Sending...' : 'Submit and book a call'}
                </button>

              </form>
            </div>

            {/* WHAT TO EXPECT */}
            <div style={{padding:'36px 24px'}}>
              <h2 style={{fontFamily:'Playfair Display,serif',fontSize:24,fontWeight:700,color:C,marginBottom:28}}>What to expect</h2>
              <div style={{display:'flex',flexDirection:'column',gap:24,marginBottom:32}}>
                {[
                  ['1','We review your brand','Before the call, we run a quick scan of your brand and pull some initial signals so the conversation is grounded in real data.'],
                  ['2','30-minute call','We walk you through what we found and show you what ongoing tracking would look like for your brand.'],
                  ['3','No pressure, no pitch','You decide if it makes sense. No commitment required to book the call.'],
                ].map(([num, title, desc]) => (
                  <div key={num} style={{display:'flex',gap:14,alignItems:'flex-start'}}>
                    <div style={{width:30,height:30,borderRadius:'50%',background:'rgba(201,168,76,0.12)',border:'1px solid rgba(201,168,76,0.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:600,color:G,flexShrink:0}}>{num}</div>
                    <div>
                      <p style={{fontSize:15,fontWeight:600,color:C,marginBottom:6}}>{title}</p>
                      <p style={{fontSize:14,color:D,lineHeight:1.75}}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{background:'rgba(201,168,76,0.06)',border:'1px solid rgba(201,168,76,0.15)',borderRadius:10,padding:'16px 20px'}}>
                <p style={{fontSize:11,fontWeight:600,letterSpacing:'0.12em',textTransform:'uppercase',color:G,marginBottom:6}}>After you submit</p>
                <p style={{fontSize:14,color:D,lineHeight:1.75}}>A confirmation email goes to your inbox and the Calendly booking opens below so you can pick your preferred time right away.</p>
              </div>
            </div>

          </div>
        ) : (
          <div>
            {/* SUCCESS STATE */}
            <div style={{background:'rgba(61,138,94,0.1)',border:'1px solid rgba(61,138,94,0.25)',borderRadius:12,padding:'20px 28px',maxWidth:560,margin:'0 auto 40px',textAlign:'center'}}>
              <p style={{fontSize:14,color:'#5fc68a',fontWeight:500}}>✦ Done, {name}. A confirmation email is on its way to {email}.</p>
            </div>
            <div style={{textAlign:'center',marginBottom:24}}>
              <h2 style={{fontFamily:'Playfair Display,serif',fontSize:36,fontWeight:700,color:C,marginBottom:12}}>Now pick a time that works.</h2>
              <p style={{fontSize:14,color:D}}>Book your 30-minute discovery call below.</p>
            </div>
            <div
              className="calendly-inline-widget"
              data-url="https://calendly.com/hello-kingsolomonhq/30min"
              style={{minWidth:320,height:700,maxWidth:800,margin:'0 auto'}}
            />
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer style={{borderTop:`1px solid ${GB}`,padding:'32px 48px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:16}}>
        <div style={{fontFamily:'Playfair Display,serif',fontSize:15,fontWeight:700,color:C,letterSpacing:'0.08em'}}>KING SOLOMON</div>
        <div style={{fontSize:12,color:'rgba(197,194,186,0.35)'}}>2026 King Solomon · kingsolomonhq.com · Bengaluru, India</div>
      </footer>
    </>
  )
}
