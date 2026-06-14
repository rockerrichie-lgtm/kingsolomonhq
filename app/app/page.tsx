'use client'

import { useState, useEffect } from 'react'

export default function Home() {
  const [heroEmail, setHeroEmail] = useState('')
  const [ctaEmail, setCtaEmail] = useState('')
  const [heroSuccess, setHeroSuccess] = useState(false)
  const [ctaSuccess, setCtaSuccess] = useState(false)
  const [heroLoading, setHeroLoading] = useState(false)
  const [ctaLoading, setCtaLoading] = useState(false)

  const SUPABASE_URL = 'https://alrwyeenxeuxgkcskkes.supabase.co'
  const SUPABASE_KEY = 'sb_publishable_o1j3z16rgfySe5QnJgMHyQ_iR0sGvme'

  useEffect(() => {
    if (ctaSuccess) {
      const script = document.createElement('script')
      script.src = 'https://assets.calendly.com/assets/external/widget.js'
      script.async = true
      document.body.appendChild(script)
      return () => {
        document.body.removeChild(script)
      }
    }
  }, [ctaSuccess])

  async function saveToSupabase(email: string, source: string) {
    await fetch(`${SUPABASE_URL}/rest/v1/waitlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ email, source })
    })
  }

  async function sendConfirmation(email: string) {
    await fetch('/api/send-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
  }

  async function handleHero(e: React.FormEvent) {
    e.preventDefault()
    setHeroLoading(true)
    try {
      await saveToSupabase(heroEmail, 'hero')
      sendConfirmation(heroEmail).catch(() => {})
    } catch {}
    setHeroLoading(false)
    setHeroSuccess(true)
  }

  async function handleCta(e: React.FormEvent) {
    e.preventDefault()
    setCtaLoading(true)
    try {
      await saveToSupabase(ctaEmail, 'cta')
      sendConfirmation(ctaEmail).catch(() => {})
    } catch {}
    setCtaLoading(false)
    setCtaSuccess(true)
  }

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --green-deep: #0F2318; --green-brand: #1B4D35; --green-mid: #2D6B4A;
          --gold: #C9A84C; --gold-light: #E2C97A; --cream: #F5F0E8;
          --cream-dim: #C8C2B6; --glass: rgba(255,255,255,0.04);
          --glass-border: rgba(255,255,255,0.08);
        }
        html { scroll-behavior: smooth; }
        body { background: var(--green-deep); color: var(--cream); font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Inter:wght@300;400;500;600&display=swap');
      `}</style>

      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 48px',background:'rgba(15,35,24,0.85)',backdropFilter:'blur(12px)',borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <svg width="28" height="22" viewBox="0 0 56 44" fill="none"><path d="M4 36L12 14L22 26L28 6L34 26L44 14L52 36H4Z" fill="#C9A84C"/><rect x="4" y="36" width="48" height="6" rx="2" fill="#A07830"/></svg>
          <div style={{display:'flex',flexDirection:'column',lineHeight:1.1}}>
            <span style={{fontFamily:'Playfair Display,serif',fontSize:16,fontWeight:700,color:'#F5F0E8',letterSpacing:'0.1em'}}>KING SOLOMON</span>
            <span style={{fontSize:10,fontWeight:400,color:'#C9A84C',letterSpacing:'0.08em'}}>Consumer intelligence that tells you why.</span>
          </div>
        </div>
        <a href="#waitlist" style={{background:'#C9A84C',color:'#0F2318',fontSize:13,fontWeight:600,padding:'10px 22px',borderRadius:6,textDecoration:'none'}}>Connect with us</a>
      </nav>

      {/* HERO */}
      <section style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:'120px 24px 80px',background:'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(27,77,53,0.5) 0%, transparent 70%)'}}>
        <svg width="72" height="58" viewBox="0 0 80 64" fill="none" style={{marginBottom:32}}><path d="M5 52L16 18L32 36L40 6L48 36L64 18L75 52H5Z" fill="#C9A84C"/><rect x="5" y="52" width="70" height="9" rx="3" fill="#A07830"/></svg>
        <p style={{fontSize:11,fontWeight:600,letterSpacing:'0.18em',textTransform:'uppercase',color:'#C9A84C',marginBottom:20}}>Introducing King Solomon</p>
        <h1 style={{fontFamily:'Playfair Display,serif',fontSize:'clamp(40px,6vw,76px)',fontWeight:800,lineHeight:1.08,color:'#F5F0E8',maxWidth:820,marginBottom:24}}>
          Your brand tracker tells you <em style={{fontStyle:'italic',color:'#C9A84C'}}>what.</em><br/>We tell you <em style={{fontStyle:'italic',color:'#C9A84C'}}>why.</em>
        </h1>
        <p style={{fontSize:'clamp(16px,2vw,20px)',fontWeight:300,color:'#C8C2B6',maxWidth:560,marginBottom:48,lineHeight:1.7}}>Real-time brand intelligence that connects your media investment to Awareness, Consideration, Usage, Imagery and Buzz — with a plain-language verdict on what to do next.</p>
        {!heroSuccess ? (
          <form onSubmit={handleHero} style={{display:'flex',gap:12,flexWrap:'wrap',justifyContent:'center',width:'100%',maxWidth:480}}>
            <input type="email" placeholder="your@email.com" required value={heroEmail} onChange={e => setHeroEmail(e.target.value)}
              style={{flex:1,minWidth:220,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:8,padding:'14px 18px',color:'#F5F0E8',fontSize:15,outline:'none'}} />
            <button type="submit" disabled={heroLoading}
              style={{background:'#C9A84C',color:'#0F2318',border:'none',borderRadius:8,padding:'14px 28px',fontSize:15,fontWeight:600,cursor:'pointer'}}>
              {heroLoading ? 'Joining...' : 'Get early access'}
            </button>
          </form>
        ) : (
          <div style={{background:'rgba(61,138,94,0.15)',border:'1px solid rgba(61,138,94,0.3)',borderRadius:8,padding:'14px 20px',color:'#5fc68a'}}>✦ You&apos;re on the list. We&apos;ll be in touch soon.</div>
        )}
        <p style={{marginTop:16,fontSize:12,color:'rgba(197,194,186,0.4)'}}>No credit card. No spam. India-first pricing.</p>
        <div style={{display:'flex',gap:48,marginTop:72,flexWrap:'wrap',justifyContent:'center'}}>
          {[['5','Brand KPIs tracked in real time'],['2hr','Fastest update cycle for Buzz'],['40%','Below Western tool pricing']].map(([num,label]) => (
            <div key={num} style={{textAlign:'center'}}>
              <div style={{fontFamily:'Playfair Display,serif',fontSize:36,fontWeight:700,color:'#C9A84C',lineHeight:1}}>{num}</div>
              <div style={{fontSize:12,color:'#C8C2B6',marginTop:6}}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PROBLEM */}
      <section style={{padding:'100px 24px',maxWidth:900,margin:'0 auto',textAlign:'center'}}>
        <span style={{fontSize:11,fontWeight:600,letterSpacing:'0.18em',textTransform:'uppercase',color:'#C9A84C',marginBottom:16,display:'block'}}>The problem</span>
        <h2 style={{fontFamily:'Playfair Display,serif',fontSize:'clamp(28px,4vw,46px)',fontWeight:700,color:'#F5F0E8',marginBottom:24}}>Every tracker gives you a score.<br/>Nobody explains what it means.</h2>
        <p style={{fontSize:18,fontWeight:300,color:'#C8C2B6',lineHeight:1.75,maxWidth:680,margin:'0 auto'}}>Brand managers walk into leadership meetings with dashboards full of numbers — and no story. King Solomon was built to fix that.</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:16,marginTop:56}}>
          {[['📉','Scores without context','A number without a zone, a competitor benchmark, or a movement signal is decoration — not intelligence.'],
            ['💸','Spend without attribution','Your media agency shows CTR. Your brand tracker shows a score. Nobody connects the two. King Solomon does.'],
            ['🕐','Monthly reports, daily decisions','Traditional trackers tell you what happened last month. Campaigns move in days. You need signals that keep up.'],
            ['🌏','Western tools, Indian prices','Tracksuit and Latana charge $25K–$150K/year with no India presence. King Solomon is built for this market.']
          ].map(([icon,title,desc]) => (
            <div key={title} style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:'28px 24px',textAlign:'left'}}>
              <div style={{fontSize:24,marginBottom:14}}>{icon}</div>
              <h3 style={{fontFamily:'Playfair Display,serif',fontSize:18,fontWeight:600,color:'#F5F0E8',marginBottom:8}}>{title}</h3>
              <p style={{fontSize:14,color:'#C8C2B6',lineHeight:1.65}}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* KPIs */}
      <section style={{padding:'100px 24px',background:'rgba(27,77,53,0.12)',borderTop:'1px solid rgba(255,255,255,0.08)',borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
        <div style={{maxWidth:1100,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:64}}>
            <span style={{fontSize:11,fontWeight:600,letterSpacing:'0.18em',textTransform:'uppercase',color:'#C9A84C',display:'block',marginBottom:16}}>The platform</span>
            <h2 style={{fontFamily:'Playfair Display,serif',fontSize:'clamp(28px,4vw,46px)',fontWeight:700,color:'#F5F0E8'}}>Five KPIs. One real-time verdict.</h2>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:14}}>
            {[['Awareness','58','Total Awareness Index','↑ +8 pts this week','up'],
              ['Consideration','34','Behavioural intent signals','→ Stable','flat'],
              ['Usage','61','Post-experience signals','↑ +3 pts this week','up'],
              ['Imagery','47','Top brand associations','→ Stable','flat'],
              ['Buzz','+24','Net sentiment score','↓ −6 pts today','down']
            ].map(([label,score,desc,trend,dir]) => (
              <div key={label} style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:'24px 20px',borderTop:'2px solid #C9A84C'}}>
                <div style={{fontSize:10,fontWeight:600,letterSpacing:'0.15em',textTransform:'uppercase',color:'#C9A84C',marginBottom:10}}>{label}</div>
                <div style={{fontFamily:'Playfair Display,serif',fontSize:42,fontWeight:700,color:'#F5F0E8',lineHeight:1,marginBottom:6}}>{score}</div>
                <div style={{fontSize:12,color:'#C8C2B6',lineHeight:1.5}}>{desc}</div>
                <div style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:11,fontWeight:500,marginTop:10,padding:'3px 8px',borderRadius:20,background:dir==='up'?'rgba(61,138,94,0.2)':dir==='down'?'rgba(226,75,74,0.15)':'rgba(201,168,76,0.15)',color:dir==='up'?'#5fc68a':dir==='down'?'#e87878':'#C9A84C'}}>{trend}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VERDICT */}
      <section style={{padding:'100px 24px',maxWidth:900,margin:'0 auto',textAlign:'center'}}>
        <span style={{fontSize:11,fontWeight:600,letterSpacing:'0.18em',textTransform:'uppercase',color:'#C9A84C',display:'block',marginBottom:16}}>Solomon&apos;s Verdict</span>
        <h2 style={{fontFamily:'Playfair Display,serif',fontSize:'clamp(28px,4vw,46px)',fontWeight:700,color:'#F5F0E8',marginBottom:24}}>The screen no competitor has built.</h2>
        <p style={{fontSize:18,fontWeight:300,color:'#C8C2B6',lineHeight:1.75,maxWidth:680,margin:'0 auto'}}>An AI-written narrative that tells your CMO what happened, why it happened, and exactly what to do next.</p>
        <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:16,padding:'40px 48px',marginTop:48,textAlign:'left'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(201,168,76,0.12)',border:'1px solid rgba(201,168,76,0.25)',borderRadius:20,padding:'5px 14px',fontSize:11,fontWeight:600,color:'#C9A84C',marginBottom:20}}>⭐ Solomon&apos;s Verdict — Live</div>
          <p style={{fontFamily:'Playfair Display,serif',fontSize:'clamp(17px,2vw,22px)',fontWeight:400,color:'#F5F0E8',lineHeight:1.75,fontStyle:'italic'}}>&quot;Your Awareness score rose 8 points this week — driven by the ET Brand Equity feature on Wednesday. However your Consideration score has not moved. Consumers are hearing about you but not yet evaluating you. The gap between Awareness (58) and Consideration (34) is your biggest commercial opportunity right now.&quot;</p>
          <div style={{marginTop:24,display:'flex',gap:24,flexWrap:'wrap'}}>
            {[['Attribution','PR-driven (High confidence)'],['Next action','Mid-funnel content — this week'],['Risk flag','Buzz declining — monitor']].map(([k,v]) => (
              <div key={k} style={{fontSize:12,fontWeight:500,color:'#C8C2B6'}}>{k}: <span style={{color:'#C9A84C'}}>{v}</span></div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{padding:'100px 24px',maxWidth:1100,margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:64}}>
          <span style={{fontSize:11,fontWeight:600,letterSpacing:'0.18em',textTransform:'uppercase',color:'#C9A84C',display:'block',marginBottom:16}}>Pricing</span>
          <h2 style={{fontFamily:'Playfair Display,serif',fontSize:'clamp(28px,4vw,46px)',fontWeight:700,color:'#F5F0E8'}}>India-first pricing.<br/>Global-standard intelligence.</h2>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:20}}>
          {[
            {name:'Insight',inr:'₹12,000',usd:'~$149 / month',features:['2 active campaigns','1 brand tracked','Core KPI dashboard','Pre + post survey waves','PDF export','2 user seats'],featured:false},
            {name:'Growth',inr:'₹28,000',usd:'~$329 / month',features:["6 active campaigns","1 brand + 3 competitors","Solomon's Verdict — AI narrative","Pre / mid / post survey waves","Audience builder","White-label report export","5 user seats"],featured:true},
            {name:'Command',inr:'₹65,000',usd:'~$749 / month',features:['Unlimited campaigns','Up to 5 brands',"Solomon's Verdict for each brand",'Client-branded portal','Custom survey questions','Unlimited seats','Priority onboarding'],featured:false}
          ].map(p => (
            <div key={p.name} style={{background:'rgba(255,255,255,0.04)',border:`1px solid ${p.featured?'#C9A84C':'rgba(255,255,255,0.08)'}`,borderRadius:16,padding:'36px 32px',position:'relative'}}>
              {p.featured && <div style={{position:'absolute',top:-12,left:'50%',transform:'translateX(-50%)',background:'#C9A84C',color:'#0F2318',fontSize:11,fontWeight:700,padding:'4px 14px',borderRadius:20}}>Most popular</div>}
              <div style={{fontSize:12,fontWeight:600,letterSpacing:'0.12em',textTransform:'uppercase',color:'#C9A84C',marginBottom:8}}>{p.name}</div>
              <div style={{fontFamily:'Playfair Display,serif',fontSize:36,fontWeight:700,color:'#F5F0E8'}}>{p.inr}</div>
              <div style={{fontSize:13,color:'#C8C2B6',margin:'4px 0 24px'}}>{p.usd} · billed annually</div>
              <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:10}}>
                {p.features.map(f => <li key={f} style={{fontSize:13,color:'#C8C2B6',display:'flex',gap:10}}><span style={{color:'#C9A84C'}}>✦</span>{f}</li>)}
              </ul>
              <a href="#waitlist" style={{display:'block',width:'100%',marginTop:28,padding:13,borderRadius:8,textAlign:'center',fontSize:14,fontWeight:600,textDecoration:'none',background:p.featured?'#C9A84C':'transparent',color:p.featured?'#0F2318':'#F5F0E8',border:p.featured?'none':'1px solid rgba(255,255,255,0.08)'}}>Connect with us</a>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="waitlist" style={{padding:'100px 24px',textAlign:'center'}}>
        <span style={{fontSize:11,fontWeight:600,letterSpacing:'0.18em',textTransform:'uppercase',color:'#C9A84C',display:'block',marginBottom:16}}>Early access</span>
        <h2 style={{fontFamily:'Playfair Display,serif',fontSize:'clamp(28px,4vw,46px)',fontWeight:700,color:'#F5F0E8',marginBottom:16}}>Be the first brand<br/>to know why.</h2>
        <p style={{fontSize:18,fontWeight:300,color:'#C8C2B6',lineHeight:1.75,maxWidth:560,margin:'0 auto 40px'}}>King Solomon is in early access. First 20 customers get 50% off their first year — locked in for life.</p>
        {!ctaSuccess ? (
          <form onSubmit={handleCta} style={{display:'flex',gap:12,flexWrap:'wrap',justifyContent:'center',maxWidth:480,margin:'0 auto'}}>
            <input type="email" placeholder="your@email.com" required value={ctaEmail} onChange={e => setCtaEmail(e.target.value)}
              style={{flex:1,minWidth:220,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:8,padding:'14px 18px',color:'#F5F0E8',fontSize:15,outline:'none'}} />
            <button type="submit" disabled={ctaLoading}
              style={{background:'#C9A84C',color:'#0F2318',border:'none',borderRadius:8,padding:'14px 28px',fontSize:15,fontWeight:600,cursor:'pointer'}}>
              {ctaLoading ? 'Joining...' : 'Connect with us'}
            </button>
          </form>
        ) : (
          <div>
            <div style={{background:'rgba(61,138,94,0.15)',border:'1px solid rgba(61,138,94,0.3)',borderRadius:8,padding:'14px 20px',color:'#5fc68a',maxWidth:480,margin:'0 auto 24px'}}>✦ You&apos;re on the list. Want to talk sooner? Book a discovery call below.</div>
            <div className="calendly-inline-widget" data-url="https://calendly.com/hello-kingsolomonhq/30min" style={{minWidth:320,height:700,maxWidth:700,margin:'0 auto'}}></div>
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer style={{borderTop:'1px solid rgba(255,255,255,0.08)',padding:'40px 48px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:16}}>
        <div style={{fontFamily:'Playfair Display,serif',fontSize:16,fontWeight:700,color:'#F5F0E8',letterSpacing:'0.08em'}}>KING SOLOMON</div>
        <div style={{fontSize:12,color:'rgba(197,194,186,0.35)'}}>© 2026 King Solomon · kingsolomonhq.com · Bengaluru, India</div>
      </footer>
    </>
  )
}