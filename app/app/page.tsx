'use client'

export default function Home() {
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

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: ${WHITE}; color: ${DARK}; font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
        a { text-decoration: none; }
      `}</style>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />

      {/* NAV — dark green */}
      <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 48px',background:DEEP,borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <svg width="24" height="19" viewBox="0 0 56 44" fill="none"><path d="M4 36L12 14L22 26L28 6L34 26L44 14L52 36H4Z" fill="#C9A84C"/><rect x="4" y="36" width="48" height="6" rx="2" fill="#A07830"/></svg>
          <div style={{display:'flex',flexDirection:'column',lineHeight:1.1}}>
            <span style={{fontFamily:'Playfair Display,serif',fontSize:14,fontWeight:700,color:CREAM,letterSpacing:'0.1em'}}>KING SOLOMON</span>
            <span style={{fontSize:10,color:GOLD}}>Consumer intelligence that tells you why.</span>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:24}}>
          <a href="#services" style={{color:CREAM_DIM,fontSize:14}}>Services</a>
          <a href="/pricing" style={{color:CREAM_DIM,fontSize:14}}>Pricing</a>
          <a href="/login" style={{color:CREAM_DIM,fontSize:14}}>Login</a>
          <a href="/pricing" style={{background:GOLD,color:DEEP,fontSize:14,fontWeight:600,padding:'10px 22px',borderRadius:6}}>Start tracking</a>
        </div>
      </nav>

      {/* HERO — white */}
      <section style={{background:WHITE,textAlign:'center',padding:'120px 24px 48px',borderBottom:`1px solid ${BORDER}`}}>
        <svg width="56" height="44" viewBox="0 0 80 64" fill="none" style={{marginBottom:16}}><path d="M5 52L16 18L32 36L40 6L48 36L64 18L75 52H5Z" fill="#C9A84C"/><rect x="5" y="52" width="70" height="9" rx="3" fill="#A07830"/></svg>
        <p style={{fontSize:11,fontWeight:600,letterSpacing:'0.18em',textTransform:'uppercase',color:GOLD,marginBottom:14}}>King Solomon</p>
        <h1 style={{fontFamily:'Playfair Display,serif',fontSize:25,fontWeight:800,lineHeight:1.2,color:DARK,maxWidth:600,margin:'0 auto 16px'}}>
          Your brand tracker tells you <em style={{color:GOLD}}>what.</em><br/>We tell you <em style={{color:MID_GREEN}}>why.</em>
        </h1>
        <p style={{fontSize:15,color:BODY_TEXT,maxWidth:480,margin:'0 auto 32px',lineHeight:1.75}}>
          Real-time brand intelligence, CX audits, and strategic advisory built for brands that want to know the truth behind their numbers.
        </p>
        <div style={{display:'flex',gap:12,flexWrap:'wrap',justifyContent:'center'}}>
          <a href="/pricing" style={{background:GOLD,color:DEEP,fontSize:14,fontWeight:600,padding:'12px 28px',borderRadius:8}}>Start tracking →</a>
          <a href="/connect" style={{border:`1px solid ${MID_GREEN}`,color:MID_GREEN,fontSize:14,fontWeight:500,padding:'12px 28px',borderRadius:8}}>Talk to us first</a>
        </div>
      </section>

      {/* SERVICES — white */}
      <section id="services" style={{padding:'48px 24px',maxWidth:1100,margin:'0 auto'}}>
        <p style={{fontSize:11,fontWeight:600,letterSpacing:'0.18em',textTransform:'uppercase',color:GOLD,textAlign:'center',marginBottom:24}}>Three ways we help</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:16}}>
          {[
            {label:"Solomon's IQ",labelColor:GOLD,title:'Brand intelligence',desc:'Real-time scores across Awareness, Consideration, Usage, Imagery and Buzz. Updated every 2 to 6 hours. A fraction of traditional trackers.',price:'From $599, one-time report',priceColor:GOLD,featured:false},
            {label:"Solomon's Eye",labelColor:MID_GREEN,title:'CX audit',desc:'A personal walkthrough of your customer experience, screen-recorded with expert commentary and a written report.',price:'From $1,499, one-time audit',priceColor:MID_GREEN,featured:true},
            {label:"Solomon's Guide",labelColor:'#888',title:'Strategic advisory',desc:'John works with you through your entire growth journey. Fully embedded, on-call, invested in your outcome.',price:'From $2,997 per quarter',priceColor:'#888',featured:false},
          ].map(s => (
            <div key={s.label} style={{background:s.featured?CARD_BG:WHITE,border:`1px solid ${s.featured?'rgba(201,168,76,0.3)':BORDER}`,borderRadius:12,padding:'24px 20px'}}>
              <p style={{fontSize:11,fontWeight:600,letterSpacing:'0.12em',textTransform:'uppercase',color:s.labelColor,marginBottom:8}}>{s.label}</p>
              <h3 style={{fontFamily:'Playfair Display,serif',fontSize:18,fontWeight:700,color:DARK,marginBottom:10}}>{s.title}</h3>
              <p style={{fontSize:15,color:BODY_TEXT,lineHeight:1.75,marginBottom:16}}>{s.desc}</p>
              <a href="/pricing" style={{fontSize:13,color:s.priceColor,fontWeight:500}}>{s.price} →</a>
            </div>
          ))}
        </div>
      </section>

      <div style={{height:1,background:BORDER,margin:'0 48px'}}/>

      {/* STATS — white */}
      <section style={{padding:'48px 24px',maxWidth:1100,margin:'0 auto'}}>
        <p style={{fontSize:11,fontWeight:600,letterSpacing:'0.18em',textTransform:'uppercase',color:GOLD,textAlign:'center',marginBottom:12}}>Why King Solomon</p>
        <h2 style={{fontFamily:'Playfair Display,serif',fontSize:25,fontWeight:700,color:DARK,textAlign:'center',marginBottom:32,lineHeight:1.3}}>Faster answers. Lower cost.<br/>No agency overhead.</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16}}>
          {[
            {stat:'2 hrs',title:'Fastest update cycle',desc:"Buzz scores refresh every 2 hours. Traditional trackers report monthly. You see shifts the day they happen."},
            {stat:'90%',title:'Lower than agency cost',desc:"Kantar and YouGov charge $25K to $150K per year. Solomon's IQ starts at $599 for a full brand health report."},
            {stat:'5 KPIs',title:'In one verdict',desc:"Awareness, Consideration, Usage, Imagery and Buzz tracked together with competitor context and a recommended action."},
          ].map(s => (
            <div key={s.stat} style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'24px 20px',textAlign:'center'}}>
              <div style={{fontFamily:'Playfair Display,serif',fontSize:36,fontWeight:800,color:GOLD,lineHeight:1,marginBottom:8}}>{s.stat}</div>
              <h3 style={{fontSize:15,fontWeight:600,color:DARK,marginBottom:8}}>{s.title}</h3>
              <p style={{fontSize:15,color:BODY_TEXT,lineHeight:1.75}}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div style={{height:1,background:BORDER,margin:'0 48px'}}/>

      {/* TESTIMONIAL — white */}
      <section style={{padding:'48px 24px',maxWidth:800,margin:'0 auto',textAlign:'center'}}>
        <p style={{fontSize:11,fontWeight:600,letterSpacing:'0.18em',textTransform:'uppercase',color:GOLD,marginBottom:20}}>Trusted by</p>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,marginBottom:20}}>
          <div style={{width:32,height:32,borderRadius:8,background:'#f0f0f0',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>🎓</div>
          <span style={{fontSize:15,fontWeight:600,color:DARK}}>TheSchoolGuide</span>
        </div>
        <div style={{background:CARD_BG,border:'1px solid rgba(201,168,76,0.2)',borderRadius:12,padding:'28px 32px',textAlign:'left'}}>
          <p style={{fontFamily:'Playfair Display,serif',fontSize:15,fontStyle:'italic',color:DARK,lineHeight:1.8,marginBottom:14}}>
            &ldquo;John has been a great strategic partner. He helped identify new revenue opportunities, suggested customer-trust-building product features, and introduced effective evaluation frameworks. His insights have been instrumental in driving better product and business decisions.&rdquo;
          </p>
          <p style={{fontSize:13,color:GOLD,fontWeight:500}}>Prathiba Seenivasan, TheSchoolGuide</p>
        </div>
      </section>

      {/* BOTTOM CTA — dark green */}
      <section style={{background:DEEP,padding:'56px 24px',textAlign:'center'}}>
        <h2 style={{fontFamily:'Playfair Display,serif',fontSize:25,fontWeight:700,color:CREAM,marginBottom:12,lineHeight:1.3}}>
          Start with one report.<br/>Stay for the intelligence.
        </h2>
        <p style={{fontSize:15,color:CREAM_DIM,maxWidth:420,margin:'0 auto 32px',lineHeight:1.75}}>
          Book a free 30-minute discovery call. We will show you what we find about your brand before you spend a rupee.
        </p>
        <a href="/connect" style={{display:'inline-block',background:GOLD,color:DEEP,fontSize:14,fontWeight:600,padding:'13px 32px',borderRadius:8}}>Connect with Us!</a>
      </section>

      {/* FOOTER — dark green */}
      <footer style={{background:DEEP,borderTop:'1px solid rgba(255,255,255,0.06)',padding:'28px 48px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:14}}>
        <div style={{fontFamily:'Playfair Display,serif',fontSize:14,fontWeight:700,color:CREAM,letterSpacing:'0.08em'}}>KING SOLOMON</div>
        <div style={{display:'flex',gap:24}}>
          <a href="/pricing" style={{fontSize:13,color:CREAM_DIM}}>Pricing</a>
          <a href="/login" style={{fontSize:13,color:CREAM_DIM}}>Login</a>
          <a href="/connect" style={{fontSize:13,color:CREAM_DIM}}>Contact</a>
        </div>
        <div style={{fontSize:12,color:'rgba(200,194,182,0.35)'}}>2026 King Solomon · kingsolomonhq.com · Bengaluru, India</div>
      </footer>
    </>
  )
}