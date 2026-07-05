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
const PURPLE = '#9F8FEF'

function BtnPrimary({ text, plan }: { text: string; plan: string }) {
  const href = plan === 'connect' ? '/connect' : `/checkout?plan=${plan}`
  return (
    <a href={href} style={{display:'block',padding:'10px',borderRadius:8,textAlign:'center',fontSize:13,fontWeight:600,background:GOLD,color:DEEP,textDecoration:'none',marginBottom:16}}>{text}</a>
  )
}

function BtnGhost({ text, plan }: { text: string; plan: string }) {
  const href = plan === 'connect' ? '/connect' : `/checkout?plan=${plan}`
  return (
    <a href={href} style={{display:'block',padding:'10px',borderRadius:8,textAlign:'center',fontSize:13,fontWeight:600,background:WHITE,color:DARK,border:`1px solid ${BORDER}`,textDecoration:'none',marginBottom:16}}>{text}</a>
  )
}

function Price({ amount, color = DARK, billing, saving }: { amount: string; color?: string; billing: string; saving?: string }) {
  return (
    <div style={{marginBottom:14}}>
      <div style={{fontSize:11,color:BODY_TEXT,marginBottom:4}}>{billing}</div>
      <div style={{display:'flex',alignItems:'baseline',gap:1,marginBottom:4}}>
        <span style={{fontSize:13,fontWeight:700,color,fontFamily:'Playfair Display,serif'}}>$</span>
        <span style={{fontSize:22,fontWeight:700,color,fontFamily:'Playfair Display,serif',lineHeight:1}}>{amount}</span>
      </div>
      {saving && <div style={{fontSize:12,color:MID_GREEN}}>{saving}</div>}
    </div>
  )
}

function Feat({ text, color = GOLD }: { text: string; color?: string }) {
  return (
    <div style={{display:'flex',gap:8,fontSize:14,color:BODY_TEXT,marginBottom:7,lineHeight:1.5}}>
      <span style={{color,flexShrink:0}}>✦</span>{text}
    </div>
  )
}

function Divider() {
  return <div style={{height:1,background:BORDER,margin:'14px 0'}} />
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>{children}</div>
}

function Card({ children, featured = false }: { children: React.ReactNode; featured?: boolean }) {
  return (
    <div style={{background:featured?CARD_BG:WHITE,border:`1px solid ${featured?'rgba(201,168,76,0.35)':BORDER}`,borderRadius:12,padding:'20px',position:'relative'}}>
      {children}
    </div>
  )
}

function Badge({ text, color, bg, border }: { text: string; color: string; bg: string; border: string }) {
  return (
    <div style={{position:'absolute',top:-10,left:'50%',transform:'translateX(-50%)',background:bg,border,color,fontSize:10,fontWeight:700,padding:'3px 12px',borderRadius:20,whiteSpace:'nowrap'}}>{text}</div>
  )
}

function Lbl({ text, color = GOLD }: { text: string; color?: string }) {
  return <div style={{fontSize:11,fontWeight:600,letterSpacing:'0.12em',textTransform:'uppercase',color,marginBottom:6}}>{text}</div>
}

function IQPricing() {
  return (
    <Grid>
      <Card>
        <Lbl text="Insight" />
        <div style={{fontSize:14,color:BODY_TEXT,marginBottom:14,lineHeight:1.6}}>A full point-in-time brand health snapshot.</div>
        <BtnGhost text="Get a report" plan="insight_iq" />
        <Price amount="599" billing="One-time" saving="per report" />
        <Divider />
        <Feat text="All 5 KPIs tracked" />
        <Feat text="Competitor landscape included" />
        <Feat text="Solomon's Verdict narrative" />
        <Feat text="PDF and PPT in 5 days" />
        <Feat text="Upgrade credit to Growth" />
      </Card>
      <Card featured>
        <Badge text="Most popular" color={DEEP} bg={GOLD} border="none" />
        <Lbl text="Growth" />
        <div style={{fontSize:14,color:BODY_TEXT,marginBottom:14,lineHeight:1.6}}>Continuous tracking with reports every 6 months.</div>
        <BtnPrimary text="Start tracking" plan="growth_iq" />
        <Price amount="3,599" color={GOLD} billing="Billed every 6 months" saving="$1,799 per report · saves $400 vs 2 x Insight" />
        <Divider />
        <Feat text="Continuous 6-month tracking" />
        <Feat text="Live dashboard access" />
        <Feat text="Unlimited competitors tracked" />
        <Feat text="Month 3 mid-point Verdict" />
        <Feat text="Month 6 full report PDF and PPT" />
        <Feat text="Campaign attribution tracking" />
      </Card>
      <Card>
        <Badge text="Best value per report" color={MID_GREEN} bg="rgba(31,74,47,0.08)" border="1px solid rgba(31,74,47,0.2)" />
        <Lbl text="Command" />
        <div style={{fontSize:14,color:BODY_TEXT,marginBottom:14,lineHeight:1.6}}>Quarterly reports timed to your board cycles.</div>
        <BtnGhost text="Get quarterly reporting" plan="command_iq" />
        <Price amount="2,799" billing="Billed per quarter" saving="$699 per report · saves $1,597 vs 4 x Insight" />
        <Divider />
        <Feat text="Everything in Growth" color={MID_GREEN} />
        <Feat text="4 quarterly reports per year" color={MID_GREEN} />
        <Feat text="Annual summary · 5th report free" color={MID_GREEN} />
        <Feat text="Priority 48hr Verdict turnaround" color={MID_GREEN} />
        <Feat text="Quarterly account review call" color={MID_GREEN} />
      </Card>
    </Grid>
  )
}

function EyePricing() {
  return (
    <div>
      <div style={{fontSize:14,color:BODY_TEXT,textAlign:'center',maxWidth:520,margin:'0 auto 28px',lineHeight:1.75}}>
        A personal CX audit. Screen-recorded walkthrough of your customer experience with expert commentary and a written report.
      </div>
      <Grid>
        <Card>
          <Lbl text="Insight" />
          <div style={{fontSize:14,color:BODY_TEXT,marginBottom:14,lineHeight:1.6}}>One-time CX audit of your brand experience.</div>
          <BtnGhost text="Book a CX audit" plan="insight_eye" />
          <Price amount="1,499" billing="One-time" saving="per audit" />
          <Divider />
          <Feat text="Full CX walkthrough: app, web, purchase flow" />
          <Feat text="Screen recording with expert commentary" />
          <Feat text="Written findings: PDF and PPT" />
          <Feat text="Top 5 friction points identified" />
          <Feat text="Delivered in 7 business days" />
        </Card>
        <Card featured>
          <Badge text="Most popular" color={DEEP} bg={GOLD} border="none" />
          <Lbl text="Growth" />
          <div style={{fontSize:14,color:BODY_TEXT,marginBottom:14,lineHeight:1.6}}>Two audits across 6 months to track your CX improvement.</div>
          <BtnPrimary text="Start CX tracking" plan="growth_eye" />
          <Price amount="5,999" color={GOLD} billing="Billed every 6 months" saving="$2,999 per audit · saves $999 vs 2 x Insight" />
          <Divider />
          <Feat text="Two full CX audits across 6 months" />
          <Feat text="Before and after comparison report" />
          <Feat text="Competitor CX benchmarking" />
          <Feat text="Friction point resolution tracking" />
          <Feat text="Priority scheduling, 5-day delivery" />
        </Card>
        <Card>
          <Badge text="Best value per audit" color={MID_GREEN} bg="rgba(31,74,47,0.08)" border="1px solid rgba(31,74,47,0.2)" />
          <Lbl text="Command" />
          <div style={{fontSize:14,color:BODY_TEXT,marginBottom:14,lineHeight:1.6}}>Quarterly CX audits timed to your business reviews.</div>
          <BtnGhost text="Get quarterly audits" plan="command_eye" />
          <Price amount="4,999" billing="Billed per quarter" saving="$1,249 per audit · saves $3,996 vs 4 x Insight" />
          <Divider />
          <Feat text="Everything in Growth" color={MID_GREEN} />
          <Feat text="4 quarterly CX audits per year" color={MID_GREEN} />
          <Feat text="Annual CX summary · 5th audit free" color={MID_GREEN} />
          <Feat text="48hr priority delivery" color={MID_GREEN} />
          <Feat text="Quarterly debrief call with findings" color={MID_GREEN} />
        </Card>
      </Grid>
    </div>
  )
}

function GuidePricing() {
  return (
    <div>
      <div style={{fontSize:14,color:BODY_TEXT,textAlign:'center',maxWidth:520,margin:'0 auto 28px',lineHeight:1.75}}>
        John works with you through your entire setup or growth journey. Fully embedded, on-call, invested in your outcome. 3-month minimum on all plans.
      </div>
      <Grid>
        <Card>
          <Lbl text="Clarity" color={PURPLE} />
          <div style={{fontSize:14,color:BODY_TEXT,marginBottom:14,lineHeight:1.6}}>Structured sessions with async support.</div>
          <BtnGhost text="Start with Clarity" plan="connect" />
          <Price amount="2,997" billing="Billed per quarter" saving="$500 per session · 6 sessions" />
          <Divider />
          <Feat text="2 structured sessions per month" color={PURPLE} />
          <Feat text="WhatsApp async access" color={PURPLE} />
          <Feat text="One strategy document per quarter" color={PURPLE} />
          <Feat text="Session notes and action items" color={PURPLE} />
          <Feat text="Auto-renews quarterly" color={PURPLE} />
        </Card>
        <Card featured>
          <Badge text="Most popular" color={DEEP} bg={GOLD} border="none" />
          <Lbl text="Growth" color={PURPLE} />
          <div style={{fontSize:14,color:BODY_TEXT,marginBottom:14,lineHeight:1.6}}>Full async access with monthly strategy reviews.</div>
          <BtnPrimary text="Start with Growth" plan="connect" />
          <Price amount="7,497" color={GOLD} billing="Billed per quarter" saving="$625 per session · 12 sessions + full async" />
          <Divider />
          <Feat text="4 sessions per month (12 per quarter)" color={PURPLE} />
          <Feat text="Full async: WhatsApp, email, voice" color={PURPLE} />
          <Feat text="Monthly strategy review document" color={PURPLE} />
          <Feat text="Campaign, NPD, and brand advisory" color={PURPLE} />
          <Feat text="Deck and document reviews" color={PURPLE} />
        </Card>
        <Card>
          <Badge text="Fully embedded" color={PURPLE} bg="rgba(159,143,239,0.08)" border="1px solid rgba(159,143,239,0.2)" />
          <Lbl text="Command" color={PURPLE} />
          <div style={{fontSize:14,color:BODY_TEXT,marginBottom:14,lineHeight:1.6}}>On-call strategic partner for board-level decisions.</div>
          <BtnGhost text="Start with Command" plan="connect" />
          <Price amount="14,997" billing="Billed per quarter" saving="Weekly sessions · on-call access within 4 hrs" />
          <Divider />
          <Feat text="13 sessions per quarter" color={PURPLE} />
          <Feat text="On-call priority response within 4 hrs" color={PURPLE} />
          <Feat text="Unlimited strategy documents" color={PURPLE} />
          <Feat text="Board-level strategy included" color={PURPLE} />
          <Feat text="Quarterly business review with output" color={PURPLE} />
        </Card>
      </Grid>
    </div>
  )
}

function FAQ({ activeTab }: { activeTab: string }) {
  const questions = activeTab === 'iq' ? [
    ['What is a report?', "A full brand health analysis with all 5 KPI scores, competitor comparison, Solomon's Verdict narrative, recommended action, and risk flags. Delivered as PDF and PPT."],
    ["Insight vs Growth — what's the difference?", 'Insight is a point-in-time snapshot. Growth gives you 6 months of continuous tracking plus two reports — month 3 and month 6.'],
    ['Why is Command cheaper per report than Insight?', 'Four Insight reports cost $2,396. Command is $11,196 per year and includes live tracking, unlimited competitors, quarterly reports, and a free annual summary.'],
    ['Do all plans include competitor tracking?', 'Yes. Every plan includes a full competitor landscape. There are no brand or competitor limits on any plan.'],
  ] : activeTab === 'eye' ? [
    ['What is a CX audit?', "A full walkthrough of your customer experience — app, website, purchase flow, support — delivered as a screen recording with expert commentary plus a written PDF and PPT report."],
    ['Who conducts the audit?', 'Every audit is conducted personally by John Richard — 9 years of brand and consumer research expertise.'],
    ['How is Eye different from IQ?', "IQ tracks brand health scores over time. Eye audits the actual customer experience — what it feels like to be your customer."],
  ] : [
    ['What does fully embedded mean?', "John is part of your decision-making process — not just a monthly advisor. On-call access, document reviews, strategic input on real decisions as they happen."],
    ['Is there a minimum commitment?', 'Yes — all Guide tiers have a 3-month minimum. Strategic advisory takes at least 90 days to show results.'],
    ['Can I combine Guide with IQ or Eye?', 'Yes. Guide clients who also subscribe to IQ get their brand data reviewed as part of every session.'],
  ]

  return (
    <div style={{maxWidth:640,margin:'0 auto',padding:'0 0 48px'}}>
      <h2 style={{fontFamily:'Playfair Display,serif',fontSize:25,fontWeight:700,color:DARK,marginBottom:28,textAlign:'center'}}>Common questions</h2>
      {questions.map(([q, a]) => (
        <div key={q} style={{borderBottom:`1px solid ${BORDER}`,paddingBottom:20,marginBottom:20}}>
          <div style={{fontSize:14,fontWeight:600,color:DARK,marginBottom:8}}>✦ {q}</div>
          <div style={{fontSize:14,color:BODY_TEXT,lineHeight:1.75}}>{a}</div>
        </div>
      ))}
    </div>
  )
}

export default function PricingPage() {
  const [activeTab, setActiveTab] = useState<'iq' | 'eye' | 'guide'>('iq')

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
        <a href="/" style={{display:'flex',alignItems:'center',gap:10}}>
          <svg width="24" height="19" viewBox="0 0 56 44" fill="none"><path d="M4 36L12 14L22 26L28 6L34 26L44 14L52 36H4Z" fill="#C9A84C"/><rect x="4" y="36" width="48" height="6" rx="2" fill="#A07830"/></svg>
          <div style={{display:'flex',flexDirection:'column',lineHeight:1.1}}>
            <span style={{fontFamily:'Playfair Display,serif',fontSize:14,fontWeight:700,color:CREAM,letterSpacing:'0.1em'}}>KING SOLOMON</span>
            <span style={{fontSize:10,color:GOLD}}>Consumer intelligence that tells you why.</span>
          </div>
        </a>
        <div style={{display:'flex',alignItems:'center',gap:24}}>
          <a href="/" style={{color:CREAM_DIM,fontSize:14}}>Home</a>
          <a href="/login" style={{color:CREAM_DIM,fontSize:14}}>Login</a>
          <a href="/pricing" style={{background:GOLD,color:DEEP,fontSize:14,fontWeight:600,padding:'10px 22px',borderRadius:6}}>Start tracking</a>
        </div>
      </nav>

      {/* HERO — white */}
      <section style={{background:WHITE,textAlign:'center',padding:'120px 24px 48px',borderBottom:`1px solid ${BORDER}`}}>
        <p style={{fontSize:11,fontWeight:600,letterSpacing:'0.18em',textTransform:'uppercase',color:GOLD,marginBottom:14}}>Pricing</p>
        <h1 style={{fontFamily:'Playfair Display,serif',fontSize:25,fontWeight:800,lineHeight:1.2,color:DARK,marginBottom:12}}>Simple pricing.<br/>Real intelligence.</h1>
        <p style={{fontSize:15,color:BODY_TEXT,maxWidth:400,margin:'0 auto 24px',lineHeight:1.75}}>Start with a single report. Stay for the intelligence that keeps your brand ahead.</p>
        <div style={{display:'flex',gap:4,background:DEEP,borderRadius:10,padding:4,maxWidth:480,margin:'0 auto'}}>
          {([['iq',"Solomon's IQ",'Brand intelligence'],['eye',"Solomon's Eye",'CX audit'],['guide',"Solomon's Guide",'Strategic advisory']] as const).map(([tab,name,sub]) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{flex:1,padding:'9px 10px',borderRadius:7,border:'none',cursor:'pointer',background:activeTab===tab?'rgba(201,168,76,0.15)':'transparent',color:activeTab===tab?GOLD:CREAM_DIM,fontSize:12,fontWeight:activeTab===tab?600:400,transition:'all 0.15s',display:'flex',flexDirection:'column',alignItems:'center',gap:2,fontFamily:'Inter,sans-serif'}}>
              <span>{name}</span>
              <span style={{fontSize:10,fontWeight:400,opacity:0.7}}>{sub}</span>
            </button>
          ))}
        </div>
      </section>

      {/* PLANS — white */}
      <section style={{padding:'48px 24px',maxWidth:1100,margin:'0 auto'}}>
        {activeTab === 'iq' ? <IQPricing /> : activeTab === 'eye' ? <EyePricing /> : <GuidePricing />}
      </section>

      {/* FAQ — white */}
      <section style={{padding:'0 24px',maxWidth:1100,margin:'0 auto'}}>
        <FAQ activeTab={activeTab} />
      </section>

      {/* BOTTOM CTA — dark green */}
      <section style={{background:DEEP,padding:'56px 24px',textAlign:'center'}}>
        <h2 style={{fontFamily:'Playfair Display,serif',fontSize:25,fontWeight:700,color:CREAM,marginBottom:12,lineHeight:1.3}}>
          {activeTab === 'guide' ? <>Not sure which tier fits?<br/>Let&apos;s talk it through.</> : <>Start with one report.<br/>Stay for the intelligence.</>}
        </h2>
        <p style={{fontSize:15,color:CREAM_DIM,maxWidth:420,margin:'0 auto 32px',lineHeight:1.75}}>
          {activeTab === 'guide' ? "Book a 30-minute call and we'll figure out the right level of engagement." : "Book a 30-minute call and we'll show you what we find about your brand before you spend a rupee."}
        </p>
        <a href="/connect" style={{display:'inline-block',background:GOLD,color:DEEP,fontSize:14,fontWeight:600,padding:'13px 32px',borderRadius:8}}>Connect with Us!</a>
      </section>

      {/* FOOTER — dark green */}
      <footer style={{background:DEEP,borderTop:'1px solid rgba(255,255,255,0.06)',padding:'28px 48px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:14}}>
        <div style={{fontFamily:'Playfair Display,serif',fontSize:14,fontWeight:700,color:CREAM,letterSpacing:'0.08em'}}>KING SOLOMON</div>
        <div style={{display:'flex',gap:24}}>
          <a href="/" style={{fontSize:13,color:CREAM_DIM}}>Home</a>
          <a href="/login" style={{fontSize:13,color:CREAM_DIM}}>Login</a>
          <a href="/connect" style={{fontSize:13,color:CREAM_DIM}}>Contact</a>
        </div>
        <div style={{fontSize:12,color:'rgba(200,194,182,0.35)'}}>2026 King Solomon · kingsolomonhq.com · Bengaluru, India</div>
      </footer>
    </>
  )
}