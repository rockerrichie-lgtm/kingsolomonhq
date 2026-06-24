'use client'

export default function Home() {

  const G = '#C9A84C'
  const C = '#F5F0E8'
  const D = '#C8C2B6'
  const BG = '#0F2318'
  const GLASS = 'rgba(255,255,255,0.04)'
  const GB = 'rgba(255,255,255,0.08)'

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: ${BG}; color: ${C}; font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
      `}</style>

      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 48px',background:'rgba(15,35,24,0.92)',backdropFilter:'blur(12px)',borderBottom:`1px solid ${GB}`}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <svg width="26" height="20" viewBox="0 0 56 44" fill="none"><path d="M4 36L12 14L22 26L28 6L34 26L44 14L52 36H4Z" fill="#C9A84C"/><rect x="4" y="36" width="48" height="6" rx="2" fill="#A07830"/></svg>
          <div style={{display:'flex',flexDirection:'column',lineHeight:1.1}}>
            <span style={{fontFamily:'Playfair Display,serif',fontSize:15,fontWeight:700,color:C,letterSpacing:'0.1em'}}>KING SOLOMON</span>
            <span style={{fontSize:10,color:G,letterSpacing:'0.08em'}}>Consumer intelligence that tells you why.</span>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:24}}>
          <a href="#services" style={{color:D,fontSize:14,textDecoration:'none'}}>Services</a>
          <a href="/pricing" style={{color:D,fontSize:14,textDecoration:'none'}}>Pricing</a>
          <a href="/login" style={{color:D,fontSize:14,textDecoration:'none'}}>Login</a>
          <a href="/connect" style={{background:G,color:BG,fontSize:14,fontWeight:600,padding:'10px 22px',borderRadius:6,textDecoration:'none'}}>Connect with Us!</a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:'120px 24px 80px',background:`radial-gradient(ellipse 60% 50% at 50% 0%, rgba(27,77,53,0.5) 0%, transparent 70%)`}}>
        <svg width="64" height="52" viewBox="0 0 80 64" fill="none" style={{marginBottom:28}}><path d="M5 52L16 18L32 36L40 6L48 36L64 18L75 52H5Z" fill="#C9A84C"/><rect x="5" y="52" width="70" height="9" rx="3" fill="#A07830"/></svg>
        <p style={{fontSize:11,fontWeight:600,letterSpacing:'0.18em',textTransform:'uppercase',color:G,marginBottom:18}}>King Solomon</p>
        <h1 style={{fontFamily:'Playfair Display,serif',fontSize:'clamp(34px,5vw,58px)',fontWeight:800,lineHeight:1.1,color:C,maxWidth:740,marginBottom:22}}>
          Your brand tracker tells you <em style={{fontStyle:'italic',color:G}}>what.</em><br/>We tell you <em style={{fontStyle:'italic',color:G}}>why.</em>
        </h1>
        <p style={{fontSize:14,fontWeight:300,color:D,maxWidth:500,marginBottom:44,lineHeight:1.75}}>
          Real-time brand intelligence, CX audits, and strategic advisory built for brands that want to know the truth behind their numbers.
        </p>
        <div style={{display:'flex',gap:12,flexWrap:'wrap',justifyContent:'center'}}>
          <a href="#connect" style={{background:G,color:BG,fontSize:14,fontWeight:600,padding:'13px 28px',borderRadius:8,textDecoration:'none'}}>Connect with Us!</a>
          <a href="/pricing" style={{background:'transparent',color:C,fontSize:14,fontWeight:500,padding:'13px 28px',borderRadius:8,textDecoration:'none',border:`1px solid ${GB}`}}>View pricing</a>
        </div>
      </section>

      {/* THREE SERVICES */}
      <section id="services" style={{padding:'100px 24px',maxWidth:1100,margin:'0 auto'}}>
        <p style={{fontSize:11,fontWeight:600,letterSpacing:'0.18em',textTransform:'uppercase',color:G,textAlign:'center',marginBottom:48}}>Three ways we help</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:16}}>
          {[
            {
              label:"Solomon's IQ",
              title:'Brand intelligence',
              desc:'Real-time scores across Awareness, Consideration, Usage, Imagery and Buzz. Updated every 2 to 6 hours. A fraction of the cost and time of traditional brand trackers.',
              price:'From $599, one-time report',
              featured: false
            },
            {
              label:"Solomon's Eye",
              title:'CX audit',
              desc:'A personal walkthrough of your customer experience, from app flows to support landscape, delivered as a screen recording with expert commentary and a written report.',
              price:'From $1,499, one-time audit',
              featured: true
            },
            {
              label:"Solomon's Guide",
              title:'Strategic advisory',
              desc:'John works with you through your entire setup or growth journey. Fully embedded, on-call, invested in your outcome. Sessions, async access, and board-level strategy.',
              price:'From $2,997 per quarter',
              featured: false
            }
          ].map(s => (
            <div key={s.label} style={{background:GLASS,border:`1px solid ${s.featured ? 'rgba(201,168,76,0.3)' : GB}`,borderRadius:14,padding:'32px 28px'}}>
              <p style={{fontSize:11,fontWeight:600,letterSpacing:'0.12em',textTransform:'uppercase',color:G,marginBottom:10}}>{s.label}</p>
              <h3 style={{fontFamily:'Playfair Display,serif',fontSize:22,fontWeight:700,color:C,marginBottom:12}}>{s.title}</h3>
              <p style={{fontSize:14,color:D,lineHeight:1.75,marginBottom:20}}>{s.desc}</p>
              <a href="/pricing" style={{fontSize:13,color:G,textDecoration:'none',fontWeight:500}}>{s.price} →</a>
            </div>
          ))}
        </div>
      </section>

      {/* WHY KING SOLOMON — 3 stat cards */}
      <section style={{padding:'0 24px 100px',maxWidth:1100,margin:'0 auto'}}>
        <p style={{fontSize:11,fontWeight:600,letterSpacing:'0.18em',textTransform:'uppercase',color:G,textAlign:'center',marginBottom:16}}>Why King Solomon</p>
        <h2 style={{fontFamily:'Playfair Display,serif',fontSize:'clamp(26px,4vw,40px)',fontWeight:700,color:C,textAlign:'center',marginBottom:48}}>Faster answers. Lower cost.<br/>No agency overhead.</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16}}>
          {[
            {stat:'2 hrs',title:'Fastest update cycle',desc:'Buzz scores refresh every 2 hours. Traditional trackers report monthly. You see shifts the day they happen.'},
            {stat:'90%',title:'Lower than agency cost',desc:'Kantar and YouGov charge $25K to $150K per year. Solomon\'s IQ starts at $599 for a full brand health report.'},
            {stat:'5 KPIs',title:'In one verdict',desc:'Awareness, Consideration, Usage, Imagery and Buzz tracked together with competitor context and a recommended action.'},
          ].map(s => (
            <div key={s.stat} style={{background:GLASS,border:`1px solid ${GB}`,borderRadius:14,padding:'32px 28px',textAlign:'center'}}>
              <div style={{fontFamily:'Playfair Display,serif',fontSize:42,fontWeight:700,color:G,lineHeight:1,marginBottom:10}}>{s.stat}</div>
              <h3 style={{fontSize:15,fontWeight:600,color:C,marginBottom:10}}>{s.title}</h3>
              <p style={{fontSize:14,color:D,lineHeight:1.75}}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DIVIDER */}
      <div style={{height:1,background:'rgba(255,255,255,0.06)',margin:'0 48px'}} />

      {/* TESTIMONIAL */}
      <section style={{padding:'100px 24px',maxWidth:800,margin:'0 auto',textAlign:'center'}}>
        <p style={{fontSize:11,fontWeight:600,letterSpacing:'0.18em',textTransform:'uppercase',color:G,marginBottom:32}}>Trusted by</p>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:12,marginBottom:32}}>
          <div style={{width:36,height:36,borderRadius:8,background:GLASS,border:`1px solid ${GB}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>🎓</div>
          <span style={{fontSize:16,fontWeight:600,color:C}}>TheSchoolGuide</span>
        </div>
        <div style={{background:GLASS,border:`1px solid ${GB}`,borderRadius:14,padding:'36px 40px',textAlign:'left'}}>
          <p style={{fontFamily:'Playfair Display,serif',fontSize:18,fontWeight:400,color:C,lineHeight:1.8,fontStyle:'italic',marginBottom:16}}>
            &ldquo;John has been a great strategic partner. He helped identify new revenue opportunities, suggested customer-trust-building product features, and introduced effective evaluation frameworks. His insights have been instrumental in driving better product and business decisions.&rdquo;
          </p>
          <p style={{fontSize:13,color:G,fontWeight:500}}>Prathiba Seenivasan, TheSchoolGuide</p>
        </div>
      </section>

      {/* DIVIDER */}
      <div style={{height:1,background:'rgba(255,255,255,0.06)',margin:'0 48px'}} />

      {/* CTA */}
      <section id="connect" style={{padding:'100px 24px',textAlign:'center'}}>
        <h2 style={{fontFamily:'Playfair Display,serif',fontSize:'clamp(26px,4vw,44px)',fontWeight:700,color:C,marginBottom:16}}>
          Start with one report.<br/>Stay for the intelligence.
        </h2>
        <p style={{fontSize:14,fontWeight:300,color:D,maxWidth:460,margin:'0 auto 40px',lineHeight:1.75}}>
          Book a free 30-minute discovery call. We will show you what we find about your brand before you spend a rupee.
        </p>
        <a href="/connect" style={{display:'inline-block',background:G,color:BG,fontSize:14,fontWeight:600,padding:'14px 36px',borderRadius:8,textDecoration:'none'}}>Connect with Us!</a>
        <p style={{marginTop:14,fontSize:12,color:'rgba(197,194,186,0.4)'}}>No credit card. No commitment. Discovery call is free.</p>
      </section>

      {/* FOOTER */}
      <footer style={{borderTop:`1px solid ${GB}`,padding:'36px 48px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:16}}>
        <div style={{fontFamily:'Playfair Display,serif',fontSize:15,fontWeight:700,color:C,letterSpacing:'0.08em'}}>KING SOLOMON</div>
        <div style={{display:'flex',gap:24}}>
          <a href="/pricing" style={{fontSize:13,color:D,textDecoration:'none'}}>Pricing</a>
          <a href="/login" style={{fontSize:13,color:D,textDecoration:'none'}}>Login</a>
          <a href="#connect" style={{fontSize:13,color:D,textDecoration:'none'}}>Contact</a>
        </div>
        <div style={{fontSize:12,color:'rgba(197,194,186,0.35)'}}>2026 King Solomon · kingsolomonhq.com · Bengaluru, India</div>
      </footer>
    </>
  )
}
