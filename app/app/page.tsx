'use client'
import { useState } from 'react'

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

function ReportPreview() {
  const [failed, setFailed] = useState(false)

  if (!failed) {
    return (
      <img
        src="/report-preview.png"
        alt="Sample King Solomon brand health report"
        onError={() => setFailed(true)}
        style={{width:'100%',borderRadius:12,border:`1px solid ${BORDER}`,display:'block'}}
      />
    )
  }

  const rows = [
    { k: 'Awareness', v: 68, band: 'Established', c: MID_GREEN },
    { k: 'Consideration', v: 54, band: 'Contested', c: GOLD },
    { k: 'Usage', v: 41, band: 'Contested', c: GOLD },
    { k: 'Imagery', v: 73, band: 'Established', c: MID_GREEN },
    { k: 'Buzz', v: 22, band: 'Emerging', c: '#B08968' },
  ]

  return (
    <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'22px 24px',position:'relative',overflow:'hidden'}}>
      <div style={{filter:'blur(3.5px)',opacity:0.75,pointerEvents:'none',userSelect:'none'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:18}}>
          <span style={{fontFamily:'Playfair Display,serif',fontSize:17,fontWeight:700,color:DARK}}>Brand health</span>
          <span style={{fontSize:11,color:BODY_TEXT}}>Q3 2026</span>
        </div>
        {rows.map(r => (
          <div key={r.k} style={{marginBottom:14}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:5}}>
              <span style={{fontSize:12,color:BODY_TEXT}}>{r.k}</span>
              <span style={{fontSize:12,fontWeight:600,color:r.c}}>{r.v} · {r.band}</span>
            </div>
            <div style={{height:6,borderRadius:3,background:'#f2f2f2'}}>
              <div style={{width:`${r.v}%`,height:6,borderRadius:3,background:r.c}} />
            </div>
          </div>
        ))}
        <div style={{marginTop:18,padding:'14px 16px',background:CARD_BG,borderRadius:8,border:'1px solid rgba(201,168,76,0.25)'}}>
          <div style={{fontSize:10,fontWeight:600,letterSpacing:'0.12em',textTransform:'uppercase',color:GOLD,marginBottom:6}}>Solomon&apos;s Verdict</div>
          <div style={{fontSize:12,color:BODY_TEXT,lineHeight:1.7}}>
            Consideration has moved eight points against a flat category. Attributed signal correlation with the March campaign, high confidence. Recommended action inside the next 30 days.
          </div>
        </div>
      </div>
      <div style={{position:'absolute',inset:0,display:'flex',alignItems:'flex-end',justifyContent:'center',padding:'0 0 18px'}}>
        <span style={{fontSize:11,fontWeight:600,letterSpacing:'0.14em',textTransform:'uppercase',color:BODY_TEXT,background:'rgba(255,255,255,0.92)',padding:'6px 14px',borderRadius:20,border:`1px solid ${BORDER}`}}>
          Sample report
        </span>
      </div>
    </div>
  )
}

function JohnPhoto({ size }: { size: number }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div style={{width:size,height:size,borderRadius:'50%',background:CARD_BG,border:'1px solid rgba(201,168,76,0.35)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontFamily:'Playfair Display,serif',fontSize:size*0.34,fontWeight:700,color:GOLD}}>
        JR
      </div>
    )
  }

  return (
    <img
      src="/john.jpg"
      alt="John Richard, founder of King Solomon"
      onError={() => setFailed(true)}
      style={{width:size,height:size,borderRadius:'50%',objectFit:'cover',flexShrink:0,border:'1px solid rgba(201,168,76,0.35)'}}
    />
  )
}

export default function Home() {
  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: ${WHITE}; color: ${DARK}; font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
        a { text-decoration: none; }
        .ks-h1 { font-size: 46px; }
        .ks-sub { font-size: 17px; }
        @media (max-width: 900px) {
          .ks-hero { grid-template-columns: 1fr !important; gap: 36px !important; text-align: center; }
          .ks-hero-cta { justify-content: center !important; }
          .ks-proof { justify-content: center !important; }
          .ks-about { grid-template-columns: 1fr !important; text-align: center; }
          .ks-about-photo { justify-content: center !important; }
          .ks-h1 { font-size: 34px; }
          .ks-sub { font-size: 16px; }
          .ks-nav { padding: 14px 20px !important; }
          .ks-navlinks { gap: 14px !important; }
          .ks-pad { padding-left: 20px !important; padding-right: 20px !important; }
        }
        @media (max-width: 520px) {
          .ks-h1 { font-size: 28px; }
          .ks-navlinks a:not(:last-child) { display: none; }
        }
      `}</style>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav className="ks-nav" style={{position:'fixed',top:0,left:0,right:0,zIndex:100,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 48px',background:DEEP,borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <svg width="24" height="19" viewBox="0 0 56 44" fill="none"><path d="M4 36L12 14L22 26L28 6L34 26L44 14L52 36H4Z" fill="#C9A84C"/><rect x="4" y="36" width="48" height="6" rx="2" fill="#A07830"/></svg>
          <div style={{display:'flex',flexDirection:'column',lineHeight:1.1}}>
            <span style={{fontFamily:'Playfair Display,serif',fontSize:14,fontWeight:700,color:CREAM,letterSpacing:'0.1em'}}>KING SOLOMON</span>
            <span style={{fontSize:10,color:GOLD}}>Consumer intelligence that tells you why.</span>
          </div>
        </div>
        <div className="ks-navlinks" style={{display:'flex',alignItems:'center',gap:24}}>
          <a href="#what-you-get" style={{color:CREAM_DIM,fontSize:14}}>What you get</a>
          <a href="#services" style={{color:CREAM_DIM,fontSize:14}}>Services</a>
          <a href="#about" style={{color:CREAM_DIM,fontSize:14}}>About</a>
          <a href="/pricing" style={{color:CREAM_DIM,fontSize:14}}>Pricing</a>
          <a href="/login" style={{color:CREAM_DIM,fontSize:14}}>Login</a>
          <a href="/pricing" style={{background:GOLD,color:DEEP,fontSize:14,fontWeight:600,padding:'10px 22px',borderRadius:6}}>Start tracking</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="ks-pad" style={{background:WHITE,padding:'128px 48px 40px',borderBottom:`1px solid ${BORDER}`}}>
        <div className="ks-hero" style={{maxWidth:1100,margin:'0 auto',display:'grid',gridTemplateColumns:'1fr 1fr',gap:56,alignItems:'center'}}>
          <div>
            <p style={{fontSize:11,fontWeight:600,letterSpacing:'0.18em',textTransform:'uppercase',color:GOLD,marginBottom:18}}>Brand intelligence for Indian brands</p>
            <h1 className="ks-h1" style={{fontFamily:'Playfair Display,serif',fontWeight:800,lineHeight:1.12,color:DARK,marginBottom:20}}>
              Your brand tracker tells you <em style={{color:GOLD}}>what.</em><br/>We tell you <em style={{color:MID_GREEN}}>why.</em>
            </h1>
            <p className="ks-sub" style={{color:BODY_TEXT,maxWidth:460,marginBottom:28,lineHeight:1.7}}>
              Real-time brand intelligence, CX audits, and strategic advisory built for brands that want to know the truth behind their numbers.
            </p>
            <div className="ks-hero-cta" style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:32}}>
              <a href="/pricing" style={{background:GOLD,color:DEEP,fontSize:14,fontWeight:600,padding:'13px 30px',borderRadius:8}}>Start tracking →</a>
              <a href="/connect" style={{border:`1px solid ${MID_GREEN}`,color:MID_GREEN,fontSize:14,fontWeight:500,padding:'13px 30px',borderRadius:8}}>Talk to us first</a>
            </div>

            {/* PROOF STRIP */}
            <div className="ks-proof" style={{display:'flex',alignItems:'center',gap:14,paddingTop:24,borderTop:`1px solid ${BORDER}`}}>
              <JohnPhoto size={52} />
              <div style={{textAlign:'left'}}>
                <div style={{fontSize:14,fontWeight:600,color:DARK,marginBottom:3}}>John Richard, founder</div>
                <div style={{fontSize:13,color:BODY_TEXT,lineHeight:1.6}}>
                  9 years in brand health and consumer research at Nielsen, Kantar and YouGov.<br/>
                  Lean Six Sigma Black Belt. Every report written personally.
                </div>
              </div>
            </div>
          </div>

          <ReportPreview />
        </div>

        <div style={{textAlign:'center',marginTop:40}}>
          <a href="#what-you-get" aria-label="Scroll to what you get" style={{display:'inline-block',color:GOLD,fontSize:20,lineHeight:1}}>↓</a>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section id="what-you-get" className="ks-pad" style={{padding:'56px 48px',maxWidth:1100,margin:'0 auto'}}>
        <p style={{fontSize:11,fontWeight:600,letterSpacing:'0.18em',textTransform:'uppercase',color:GOLD,textAlign:'center',marginBottom:12}}>What you get</p>
        <h2 style={{fontFamily:'Playfair Display,serif',fontSize:30,fontWeight:700,color:DARK,textAlign:'center',marginBottom:14,lineHeight:1.25}}>Five scores, one verdict,<br/>three days.</h2>
        <p style={{fontSize:16,color:BODY_TEXT,textAlign:'center',maxWidth:520,margin:'0 auto 36px',lineHeight:1.7}}>
          Every report scores your brand against its category and its competitors, then tells you what moved and what to do about it.
        </p>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:12,marginBottom:16}}>
          {[
            {k:'Awareness',d:'Who knows you exist'},
            {k:'Consideration',d:'Who is actively evaluating'},
            {k:'Usage',d:'Who bought and came back'},
            {k:'Imagery',d:'What they associate with you'},
            {k:'Buzz',d:'What they are saying right now'},
          ].map(x => (
            <div key={x.k} style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'18px 16px'}}>
              <div style={{fontSize:13,fontWeight:600,color:DARK,marginBottom:6}}>{x.k}</div>
              <div style={{fontSize:13,color:BODY_TEXT,lineHeight:1.6}}>{x.d}</div>
            </div>
          ))}
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:12}}>
          {[
            {t:'Competitor context',d:'Every score sits next to your competitive set and the category average, so a number always means something.'},
            {t:"Solomon's Verdict",d:'A written narrative on what moved, what is attributed to it, and the recommended action with a time window.'},
            {t:'Confidence gating',d:'Movements below the meaningful difference threshold are marked as noise rather than dressed up as insight.'},
          ].map(x => (
            <div key={x.t} style={{background:CARD_BG,border:'1px solid rgba(201,168,76,0.25)',borderRadius:12,padding:'20px 18px'}}>
              <div style={{fontSize:14,fontWeight:600,color:DARK,marginBottom:8}}>{x.t}</div>
              <div style={{fontSize:14,color:BODY_TEXT,lineHeight:1.7}}>{x.d}</div>
            </div>
          ))}
        </div>
      </section>

      <div style={{height:1,background:BORDER,margin:'0 48px'}}/>

      {/* SERVICES */}
      <section id="services" className="ks-pad" style={{padding:'56px 48px',maxWidth:1100,margin:'0 auto'}}>
        <p style={{fontSize:11,fontWeight:600,letterSpacing:'0.18em',textTransform:'uppercase',color:GOLD,textAlign:'center',marginBottom:24}}>Three ways we help</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:16}}>
          {[
            {label:"Solomon's IQ",labelColor:GOLD,title:'Brand intelligence',desc:"Real-time scores across Awareness, Consideration, Usage, Imagery and Buzz. Delivered within 3 days. A fraction of traditional trackers.",priceColor:GOLD,featured:false},
            {label:"Solomon's Eye",labelColor:MID_GREEN,title:'CX audit',desc:'A personal walkthrough of your customer experience, screen-recorded with expert commentary and a written report.',priceColor:MID_GREEN,featured:true},
            {label:"Solomon's Guide",labelColor:'#888',title:'Strategic advisory',desc:'John works with you through your entire growth journey. Fully embedded, on-call, invested in your outcome.',priceColor:'#888',featured:false},
          ].map(s => (
            <div key={s.label} style={{background:s.featured?CARD_BG:WHITE,border:`1px solid ${s.featured?'rgba(201,168,76,0.3)':BORDER}`,borderRadius:12,padding:'24px 20px'}}>
              <p style={{fontSize:11,fontWeight:600,letterSpacing:'0.12em',textTransform:'uppercase',color:s.labelColor,marginBottom:8}}>{s.label}</p>
              <h3 style={{fontFamily:'Playfair Display,serif',fontSize:19,fontWeight:700,color:DARK,marginBottom:10}}>{s.title}</h3>
              <p style={{fontSize:15,color:BODY_TEXT,lineHeight:1.75,marginBottom:16}}>{s.desc}</p>
              <a href="/pricing" style={{fontSize:13,color:s.priceColor,fontWeight:500}}>See pricing →</a>
            </div>
          ))}
        </div>
      </section>

      <div style={{height:1,background:BORDER,margin:'0 48px'}}/>

      {/* STATS */}
      <section className="ks-pad" style={{padding:'56px 48px',maxWidth:1100,margin:'0 auto'}}>
        <p style={{fontSize:11,fontWeight:600,letterSpacing:'0.18em',textTransform:'uppercase',color:GOLD,textAlign:'center',marginBottom:12}}>Why King Solomon</p>
        <h2 style={{fontFamily:'Playfair Display,serif',fontSize:30,fontWeight:700,color:DARK,textAlign:'center',marginBottom:32,lineHeight:1.25}}>Faster answers. Lower cost.<br/>No agency overhead.</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16}}>
          {[
            {stat:'3 days',title:'Fastest turnaround',desc:"Brand health reports delivered in 3 days. Traditional trackers take weeks. You see what is happening before your competitors do."},
            {stat:'94%',title:'Lower than agency cost',desc:"Kantar and YouGov charge $25K to $150K per year. Solomon's IQ starts at $1,499 for a full brand health report."},
            {stat:'5 KPIs',title:'In one verdict',desc:"Awareness, Consideration, Usage, Imagery and Buzz tracked together with competitor context and a recommended action."},
          ].map(s => (
            <div key={s.stat} style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'24px 20px',textAlign:'center'}}>
              <div style={{fontFamily:'Playfair Display,serif',fontSize:38,fontWeight:800,color:GOLD,lineHeight:1,marginBottom:8}}>{s.stat}</div>
              <h3 style={{fontSize:15,fontWeight:600,color:DARK,marginBottom:8}}>{s.title}</h3>
              <p style={{fontSize:15,color:BODY_TEXT,lineHeight:1.75}}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div style={{height:1,background:BORDER,margin:'0 48px'}}/>

      {/* ABOUT JOHN */}
      <section id="about" className="ks-pad" style={{padding:'56px 48px',maxWidth:1000,margin:'0 auto'}}>
        <div className="ks-about" style={{display:'grid',gridTemplateColumns:'260px 1fr',gap:44,alignItems:'center'}}>
          <div className="ks-about-photo" style={{display:'flex',justifyContent:'flex-start'}}>
            <JohnPhoto size={220} />
          </div>
          <div>
            <p style={{fontSize:11,fontWeight:600,letterSpacing:'0.18em',textTransform:'uppercase',color:GOLD,marginBottom:12}}>Who you are working with</p>
            <h2 style={{fontFamily:'Playfair Display,serif',fontSize:30,fontWeight:700,color:DARK,marginBottom:16,lineHeight:1.25}}>John Richard</h2>
            <p style={{fontSize:16,color:BODY_TEXT,lineHeight:1.8,marginBottom:14}}>
              Nine years measuring brand health, NPS and customer experience at Nielsen, Kantar and YouGov, then on the client side inside the brands buying that research. Lean Six Sigma Black Belt.
            </p>
            <p style={{fontSize:16,color:BODY_TEXT,lineHeight:1.8,marginBottom:14}}>
              King Solomon exists because the same problem kept turning up. Brand managers were paying serious money for a score, and nobody could tell them what moved it or what to do next. The methodology here is the one I would have wanted on the other side of the table.
            </p>
            <p style={{fontSize:16,color:BODY_TEXT,lineHeight:1.8}}>
              Every report is read and written by me before it reaches you. No junior analyst, no template, no filler.
            </p>
          </div>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="ks-pad" style={{padding:'12px 48px 56px',maxWidth:800,margin:'0 auto',textAlign:'center'}}>
        <p style={{fontSize:11,fontWeight:600,letterSpacing:'0.18em',textTransform:'uppercase',color:GOLD,marginBottom:20}}>Trusted by</p>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,marginBottom:20}}>
          <div style={{width:32,height:32,borderRadius:8,background:'#f0f0f0',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>🎓</div>
          <span style={{fontSize:15,fontWeight:600,color:DARK}}>TheSchoolGuide</span>
        </div>
        <div style={{background:CARD_BG,border:'1px solid rgba(201,168,76,0.2)',borderRadius:12,padding:'28px 32px',textAlign:'left'}}>
          <p style={{fontFamily:'Playfair Display,serif',fontSize:16,fontStyle:'italic',color:DARK,lineHeight:1.8,marginBottom:14}}>
            &ldquo;John has been a great strategic partner. He helped identify new revenue opportunities, suggested customer-trust-building product features, and introduced effective evaluation frameworks. His insights have been instrumental in driving better product and business decisions.&rdquo;
          </p>
          <p style={{fontSize:13,color:GOLD,fontWeight:500}}>Prathiba Seenivasan, TheSchoolGuide</p>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section style={{background:DEEP,padding:'56px 24px',textAlign:'center'}}>
        <h2 style={{fontFamily:'Playfair Display,serif',fontSize:30,fontWeight:700,color:CREAM,marginBottom:12,lineHeight:1.25}}>
          Start with one report.<br/>Stay for the intelligence.
        </h2>
        <p style={{fontSize:16,color:CREAM_DIM,maxWidth:440,margin:'0 auto 32px',lineHeight:1.75}}>
          Book a free 30-minute discovery call. We will show you what we find about your brand before you spend a rupee.
        </p>
        <a href="/connect" style={{display:'inline-block',background:GOLD,color:DEEP,fontSize:14,fontWeight:600,padding:'13px 32px',borderRadius:8}}>Connect with Us!</a>
      </section>

      {/* FOOTER */}
      <footer style={{background:DEEP,borderTop:'1px solid rgba(255,255,255,0.06)',padding:'28px 48px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:14}}>
        <div style={{fontFamily:'Playfair Display,serif',fontSize:14,fontWeight:700,color:CREAM,letterSpacing:'0.08em'}}>KING SOLOMON</div>
        <div style={{display:'flex',gap:24}}>
          <a href="/pricing" style={{fontSize:13,color:CREAM_DIM}}>Pricing</a>
          <a href="#about" style={{fontSize:13,color:CREAM_DIM}}>About</a>
          <a href="/login" style={{fontSize:13,color:CREAM_DIM}}>Login</a>
          <a href="/connect" style={{fontSize:13,color:CREAM_DIM}}>Contact</a>
        </div>
        <div style={{fontSize:12,color:'rgba(200,194,182,0.35)'}}>2026 King Solomon · kingsolomonhq.com · Bengaluru, India</div>
      </footer>
    </>
  )
}