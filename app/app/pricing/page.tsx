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

const CALENDLY = 'https://calendly.com/hello-kingsolomonhq/30min'

type PriceBands = { base: number; band2: number; band3: number }

const IQ_PRICE: PriceBands = { base: 1499, band2: 1200, band3: 1100 }
const EYE_PRICE: PriceBands = { base: 1799, band2: 1500, band3: 1400 }

function perReportCost(p: PriceBands, brands: number) {
  let total = p.base
  for (let i = 2; i <= brands; i++) total += i <= 3 ? p.band2 : p.band3
  return total
}

function money(n: number) {
  return n.toLocaleString('en-US')
}

function BtnPrimary({ text }: { text: string }) {
  return (
    <a href={CALENDLY} target="_blank" rel="noopener noreferrer"
      style={{display:'block',padding:'10px',borderRadius:8,textAlign:'center',fontSize:13,fontWeight:600,background:GOLD,color:DEEP,textDecoration:'none',marginBottom:16}}>
      {text}
    </a>
  )
}

function BtnGhost({ text }: { text: string }) {
  return (
    <a href={CALENDLY} target="_blank" rel="noopener noreferrer"
      style={{display:'block',padding:'10px',borderRadius:8,textAlign:'center',fontSize:13,fontWeight:600,background:WHITE,color:DARK,border:`1px solid ${BORDER}`,textDecoration:'none',marginBottom:16}}>
      {text}
    </a>
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
  return <div className="ks-grid" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>{children}</div>
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

function BrandSelector({
  price, unit, brands, setBrands,
}: { price: PriceBands; unit: string; brands: number; setBrands: (n: number) => void }) {
  const perReport = perReportCost(price, brands)
  const blended = Math.round(perReport / brands)
  const saved = price.base * brands - perReport

  return (
    <div style={{background:CARD_BG,border:'1px solid rgba(201,168,76,0.25)',borderRadius:12,padding:'24px',marginBottom:20}}>
      <div className="ks-selector" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:28,alignItems:'center'}}>
        <div>
          <div style={{fontSize:11,fontWeight:600,letterSpacing:'0.12em',textTransform:'uppercase',color:GOLD,marginBottom:10}}>
            How many brands
          </div>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <input
              type="range" min={1} max={10} step={1} value={brands}
              onChange={(e) => setBrands(Number(e.target.value))}
              aria-label="Number of brands"
              style={{flex:1,accentColor:GOLD,cursor:'pointer'}}
            />
            <span style={{fontFamily:'Playfair Display,serif',fontSize:22,fontWeight:700,color:DARK,minWidth:26,textAlign:'right',lineHeight:1}}>
              {brands}
            </span>
          </div>
          <div style={{fontSize:12,color:BODY_TEXT,marginTop:10,lineHeight:1.6}}>
            Brands 2 to 3 at ${money(price.band2)} each. 4 or more at ${money(price.band3)} each.
          </div>
        </div>

        <div style={{borderLeft:`1px solid ${BORDER}`,paddingLeft:28}}>
          <div style={{fontSize:11,color:BODY_TEXT,marginBottom:4}}>Your price per {unit}, per brand</div>
          <div style={{display:'flex',alignItems:'baseline',gap:1,marginBottom:4}}>
            <span style={{fontSize:16,fontWeight:700,color:DARK,fontFamily:'Playfair Display,serif'}}>$</span>
            <span style={{fontSize:34,fontWeight:800,color:DARK,fontFamily:'Playfair Display,serif',lineHeight:1}}>{money(blended)}</span>
          </div>
          <div style={{fontSize:12,color:brands > 1 ? MID_GREEN : BODY_TEXT,lineHeight:1.6,minHeight:19}}>
            {brands > 1
              ? `Down from $${money(price.base)}. You save $${money(saved)} per ${unit} cycle.`
              : `Add brands and this number falls.`}
          </div>
        </div>
      </div>
    </div>
  )
}

type Tier = {
  name: string
  cadence: string
  billing: string
  reports: number
  desc: string
  featured?: boolean
  badge?: { text: string; color: string; bg: string; border: string }
  featColor?: string
  features: string[]
}

const IQ_TIERS: Tier[] = [
  {
    name: 'Insight', cadence: 'Annual', billing: 'One-time', reports: 1,
    desc: 'A full point-in-time brand health snapshot.',
    features: ['All 5 KPIs tracked','Competitor landscape included',"Solomon's Verdict narrative",'PDF and PPT in 3 days','Upgrade credit to Growth'],
  },
  {
    name: 'Growth', cadence: 'Half-yearly', billing: 'Billed every 6 months', reports: 2,
    desc: 'Continuous tracking with a report every 6 months.',
    featured: true,
    badge: { text: 'Most popular', color: DEEP, bg: GOLD, border: 'none' },
    features: ['Continuous 6-month tracking','Live dashboard access','Unlimited competitors tracked','Month 3 mid-point Verdict','Month 6 full report PDF and PPT','Campaign attribution tracking'],
  },
  {
    name: 'Command', cadence: 'Quarterly', billing: 'Billed annually', reports: 4,
    desc: 'Quarterly reports timed to your board cycles.',
    badge: { text: 'Deepest tracking', color: MID_GREEN, bg: 'rgba(31,74,47,0.08)', border: '1px solid rgba(31,74,47,0.2)' },
    featColor: MID_GREEN,
    features: ['Everything in Growth','4 quarterly reports per year','Annual summary report included','Priority 48hr Verdict turnaround','Quarterly account review call'],
  },
]

const EYE_TIERS: Tier[] = [
  {
    name: 'Insight', cadence: 'Annual', billing: 'One-time', reports: 1,
    desc: 'One-time CX audit of your brand experience.',
    features: ['Full CX walkthrough: app, web, purchase flow','Screen recording with expert commentary','Written findings: PDF and PPT','Top 5 friction points identified','Delivered in 3 business days'],
  },
  {
    name: 'Growth', cadence: 'Half-yearly', billing: 'Billed every 6 months', reports: 2,
    desc: 'Two audits across 6 months to track your CX improvement.',
    featured: true,
    badge: { text: 'Most popular', color: DEEP, bg: GOLD, border: 'none' },
    features: ['Two full CX audits across 6 months','Before and after comparison report','Competitor CX benchmarking','Friction point resolution tracking','Priority scheduling, 3-day delivery'],
  },
  {
    name: 'Command', cadence: 'Quarterly', billing: 'Billed annually', reports: 4,
    desc: 'Quarterly CX audits timed to your business reviews.',
    badge: { text: 'Deepest tracking', color: MID_GREEN, bg: 'rgba(31,74,47,0.08)', border: '1px solid rgba(31,74,47,0.2)' },
    featColor: MID_GREEN,
    features: ['Everything in Growth','4 quarterly CX audits per year','Annual CX summary report included','48hr priority delivery','Quarterly debrief call with findings'],
  },
]

function ReportPricing({
  price, tiers, unit, unitPlural, intro, brands, setBrands,
}: {
  price: PriceBands
  tiers: Tier[]
  unit: string
  unitPlural: string
  intro?: string
  brands: number
  setBrands: (n: number) => void
}) {
  const perReport = perReportCost(price, brands)

  return (
    <div>
      {intro && (
        <div style={{fontSize:14,color:BODY_TEXT,textAlign:'center',maxWidth:520,margin:'0 auto 28px',lineHeight:1.75}}>
          {intro}
        </div>
      )}

      <BrandSelector price={price} unit={unit} brands={brands} setBrands={setBrands} />

      <Grid>
        {tiers.map((t) => {
          const total = perReport * t.reports
          const countLine = `${t.reports} ${t.reports === 1 ? unit : unitPlural} a year${brands > 1 ? `, ${brands} brands` : ''}`
          return (
            <Card key={t.name} featured={t.featured}>
              {t.badge && <Badge text={t.badge.text} color={t.badge.color} bg={t.badge.bg} border={t.badge.border} />}
              <Lbl text={`${t.cadence} · ${t.name}`} />
              <div style={{fontSize:14,color:BODY_TEXT,marginBottom:14,lineHeight:1.6}}>{t.desc}</div>
              {t.featured ? <BtnPrimary text="Book a call" /> : <BtnGhost text="Book a call" />}
              <Price
                amount={money(total)}
                color={t.featured ? GOLD : DARK}
                billing={t.billing}
                saving={countLine}
              />
              <Divider />
              {t.features.map((f) => <Feat key={f} text={f} color={t.featColor} />)}
            </Card>
          )
        })}
      </Grid>
    </div>
  )
}

function GuidePricing() {
  return (
    <div>
      <div style={{fontSize:14,color:BODY_TEXT,textAlign:'center',maxWidth:520,margin:'0 auto 28px',lineHeight:1.75}}>
        John works with you through your entire setup or growth journey. Fully embedded, on-call, invested in your outcome. 3-month minimum on all plans. Priced per brand.
      </div>
      <Grid>
        <Card>
          <Lbl text="Clarity" color={PURPLE} />
          <div style={{fontSize:14,color:BODY_TEXT,marginBottom:14,lineHeight:1.6}}>Structured sessions with async support.</div>
          <BtnGhost text="Book a call" />
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
          <BtnPrimary text="Book a call" />
          <Price amount="5,997" color={GOLD} billing="Billed per quarter" saving="$500 per session · 12 sessions plus full async" />
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
          <BtnGhost text="Book a call" />
          <Price amount="9,997" billing="Billed per quarter" saving="Weekly sessions · on-call access within 4 hrs" />
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
    ['What is a report?', "A full brand health analysis with all 5 KPI scores, competitor comparison, Solomon's Verdict narrative, recommended action, and risk flags. Delivered as PDF and PPT in 3 days."],
    ['How does pricing work?', 'Pricing is per report, per brand. The first brand is $1,499 per report. Brands 2 and 3 are $1,200 each, and any brand beyond that is $1,100. You then choose how often you want reports: once a year, every 6 months, or quarterly.'],
    ['What counts as a brand?', 'One brand is one tracked entity with its own competitive set, its own dashboard and its own reports. If you run three brands in a portfolio, that is three brands.'],
    ['Do all plans include competitor tracking?', 'Yes. Every plan includes a full competitor landscape for every brand you track. There is no limit on competitors.'],
    ['Can I add a brand later?', 'Yes. Additional brands can be added at any point and are priced at the same band rates. Your existing reports and dashboards are unaffected.'],
  ] : activeTab === 'eye' ? [
    ['What is a CX audit?', 'A full walkthrough of your customer experience across app, website, purchase flow and support, delivered as a screen recording with expert commentary plus a written PDF and PPT report in 3 days.'],
    ['How does pricing work?', 'Pricing is per audit, per brand. The first brand is $1,799 per audit. Brands 2 and 3 are $1,500 each, and any brand beyond that is $1,400. You then choose how often you want audits: once a year, every 6 months, or quarterly.'],
    ['Who conducts the audit?', 'Every audit is conducted personally by John Richard, with 9 years of brand and consumer research expertise.'],
    ['How is Eye different from IQ?', 'IQ tracks brand health scores over time. Eye audits the actual customer experience, meaning what it feels like to be your customer.'],
  ] : [
    ['What does fully embedded mean?', 'John is part of your decision-making process rather than a monthly advisor. On-call access, document reviews, and strategic input on real decisions as they happen.'],
    ['Is there a minimum commitment?', 'Yes. All Guide tiers have a 3-month minimum. Strategic advisory takes at least 90 days to show results.'],
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
  const [brands, setBrands] = useState(1)

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: ${WHITE}; color: ${DARK}; font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
        a { text-decoration: none; }
        input[type=range] { height: 4px; border-radius: 2px; background: rgba(201,168,76,0.25); appearance: none; }
        @media (max-width: 860px) {
          .ks-grid { grid-template-columns: 1fr !important; }
          .ks-selector { grid-template-columns: 1fr !important; gap: 20px !important; }
          .ks-selector > div:last-child { border-left: none !important; padding-left: 0 !important; border-top: 1px solid ${BORDER}; padding-top: 20px !important; }
          .ks-process { grid-template-columns: repeat(2,1fr) !important; }
          .ks-nav { padding: 14px 20px !important; }
          .ks-navlinks { gap: 14px !important; }
        }
        @media (max-width: 520px) {
          .ks-process { grid-template-columns: 1fr !important; }
          .ks-tabs { flex-direction: column !important; }
        }
      `}</style>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />

      <nav className="ks-nav" style={{position:'fixed',top:0,left:0,right:0,zIndex:100,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 48px',background:DEEP,borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
        <a href="/" style={{display:'flex',alignItems:'center',gap:10}}>
          <svg width="24" height="19" viewBox="0 0 56 44" fill="none"><path d="M4 36L12 14L22 26L28 6L34 26L44 14L52 36H4Z" fill="#C9A84C"/><rect x="4" y="36" width="48" height="6" rx="2" fill="#A07830"/></svg>
          <div style={{display:'flex',flexDirection:'column',lineHeight:1.1}}>
            <span style={{fontFamily:'Playfair Display,serif',fontSize:14,fontWeight:700,color:CREAM,letterSpacing:'0.1em'}}>KING SOLOMON</span>
            <span style={{fontSize:10,color:GOLD}}>Consumer intelligence that tells you why.</span>
          </div>
        </a>
        <div className="ks-navlinks" style={{display:'flex',alignItems:'center',gap:24}}>
          <a href="/" style={{color:CREAM_DIM,fontSize:14}}>Home</a>
          <a href="/pricing" style={{color:GOLD,fontSize:14}}>Pricing</a>
          <a href="/login" style={{color:CREAM_DIM,fontSize:14}}>Login</a>
          <a href={CALENDLY} target="_blank" rel="noopener noreferrer" style={{background:GOLD,color:DEEP,fontSize:14,fontWeight:600,padding:'10px 22px',borderRadius:6}}>Book a call</a>
        </div>
      </nav>

      <section style={{background:WHITE,textAlign:'center',padding:'120px 24px 48px',borderBottom:`1px solid ${BORDER}`}}>
        <p style={{fontSize:11,fontWeight:600,letterSpacing:'0.18em',textTransform:'uppercase',color:GOLD,marginBottom:14}}>Pricing</p>
        <h1 style={{fontFamily:'Playfair Display,serif',fontSize:25,fontWeight:800,lineHeight:1.2,color:DARK,marginBottom:12}}>Simple pricing.<br/>Real intelligence.</h1>
        <p style={{fontSize:15,color:BODY_TEXT,maxWidth:400,margin:'0 auto 24px',lineHeight:1.75}}>Priced per report, per brand. Add brands and the price per brand comes down.</p>
        <div className="ks-tabs" style={{display:'flex',gap:4,background:DEEP,borderRadius:10,padding:4,maxWidth:480,margin:'0 auto'}}>
          {([['iq',"Solomon's IQ",'Brand intelligence'],['eye',"Solomon's Eye",'CX audit'],['guide',"Solomon's Guide",'Strategic advisory']] as const).map(([tab,name,sub]) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{flex:1,padding:'9px 10px',borderRadius:7,border:'none',cursor:'pointer',background:activeTab===tab?'rgba(201,168,76,0.15)':'transparent',color:activeTab===tab?GOLD:CREAM_DIM,fontSize:12,fontWeight:activeTab===tab?600:400,transition:'all 0.15s',display:'flex',flexDirection:'column',alignItems:'center',gap:2,fontFamily:'Inter,sans-serif'}}>
              <span>{name}</span>
              <span style={{fontSize:10,fontWeight:400,opacity:0.7}}>{sub}</span>
            </button>
          ))}
        </div>
      </section>

      <section style={{padding:'48px 24px',maxWidth:1100,margin:'0 auto'}}>
        {activeTab === 'iq' ? (
          <ReportPricing price={IQ_PRICE} tiers={IQ_TIERS} unit="report" unitPlural="reports" brands={brands} setBrands={setBrands} />
        ) : activeTab === 'eye' ? (
          <ReportPricing
            price={EYE_PRICE} tiers={EYE_TIERS} unit="audit" unitPlural="audits"
            intro="A personal CX audit. Screen-recorded walkthrough of your customer experience with expert commentary and a written report."
            brands={brands} setBrands={setBrands}
          />
        ) : <GuidePricing />}
      </section>

      <section style={{padding:'8px 24px 56px',maxWidth:860,margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:40}}>
          <p style={{fontSize:11,fontWeight:600,letterSpacing:'0.18em',textTransform:'uppercase',color:GOLD,marginBottom:12}}>The process</p>
          <h2 style={{fontFamily:'Playfair Display,serif',fontSize:25,fontWeight:700,color:DARK,marginBottom:12}}>What happens after you book</h2>
          <p style={{fontSize:15,color:BODY_TEXT,maxWidth:420,margin:'0 auto',lineHeight:1.75}}>No sales pitch. No long onboarding. You will have data on your brand within 3 business days.</p>
        </div>
        <div className="ks-process" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:0,position:'relative'}}>
          {[
            {step:'01',title:'30-minute call',desc:'We learn about your brand, category and competitors. You tell us who to track. No preparation needed.'},
            {step:'02',title:'Brand setup',desc:'We configure your competitive set and signal sources. Takes 24 hours. You do nothing.'},
            {step:'03',title:'Data collection',desc:'We pull signals from search, social, reviews and news across your brand and all competitors.'},
            {step:'04',title:'Report delivered',desc:'Your dashboard goes live and your PDF report lands in your inbox. Within 3 business days of the call.'},
          ].map((s, i) => (
            <div key={s.step} style={{padding:'28px 24px',position:'relative',borderLeft:i===0?'none':`1px solid ${BORDER}`}}>
              <div style={{fontFamily:'Playfair Display,serif',fontSize:36,fontWeight:800,color:'#f0ece4',lineHeight:1,marginBottom:12}}>{s.step}</div>
              <div style={{fontSize:14,fontWeight:600,color:DARK,marginBottom:8}}>{s.title}</div>
              <div style={{fontSize:13,color:BODY_TEXT,lineHeight:1.7}}>{s.desc}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:32,padding:'20px 24px',background:'#f9f9f9',borderRadius:10,border:`1px solid ${BORDER}`,textAlign:'center'}}>
          <span style={{fontSize:13,color:BODY_TEXT}}>First call is free. No commitment until you see your brand data. </span>
          <a href={CALENDLY} target="_blank" rel="noopener noreferrer" style={{fontSize:13,fontWeight:600,color:GOLD}}>Book your 30-minute call →</a>
        </div>
      </section>

      <section style={{padding:'0 24px',maxWidth:1100,margin:'0 auto'}}>
        <FAQ activeTab={activeTab} />
      </section>

      <section style={{background:DEEP,padding:'56px 24px',textAlign:'center'}}>
        <h2 style={{fontFamily:'Playfair Display,serif',fontSize:25,fontWeight:700,color:CREAM,marginBottom:12,lineHeight:1.3}}>
          {activeTab === 'guide' ? <>Not sure which tier fits?<br/>Let&apos;s talk it through.</> : <>Start with one report.<br/>Stay for the intelligence.</>}
        </h2>
        <p style={{fontSize:15,color:CREAM_DIM,maxWidth:420,margin:'0 auto 32px',lineHeight:1.75}}>
          {activeTab === 'guide' ? "Book a 30-minute call and we'll figure out the right level of engagement." : "Book a 30-minute call and we'll show you what we find about your brand before you spend a rupee."}
        </p>
        <a href={CALENDLY} target="_blank" rel="noopener noreferrer" style={{display:'inline-block',background:GOLD,color:DEEP,fontSize:14,fontWeight:600,padding:'13px 32px',borderRadius:8}}>Book a 30-minute call</a>
      </section>

      <footer style={{background:DEEP,borderTop:'1px solid rgba(255,255,255,0.06)',padding:'28px 48px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:14}}>
        <div style={{fontFamily:'Playfair Display,serif',fontSize:14,fontWeight:700,color:CREAM,letterSpacing:'0.08em'}}>KING SOLOMON</div>
        <div style={{display:'flex',gap:24}}>
          <a href="/" style={{fontSize:13,color:CREAM_DIM}}>Home</a>
          <a href="/pricing" style={{fontSize:13,color:CREAM_DIM}}>Pricing</a>
          <a href="/login" style={{fontSize:13,color:CREAM_DIM}}>Login</a>
          <a href="/connect" style={{fontSize:13,color:CREAM_DIM}}>Contact</a>
        </div>
        <div style={{fontSize:12,color:'rgba(200,194,182,0.35)'}}>2026 King Solomon · kingsolomonhq.com · Bengaluru, India</div>
      </footer>
    </>
  )
}