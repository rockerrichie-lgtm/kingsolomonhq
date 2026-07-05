'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

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
const GREEN = '#5fc68a'

const PLAN_LABELS: Record<string, { name: string; product: string; next: string }> = {
  insight_iq:  { name: 'IQ · Insight',  product: "Solomon's IQ",  next: 'Your report will be delivered within 5 business days. We will email you at the address used at checkout.' },
  growth_iq:   { name: 'IQ · Growth',   product: "Solomon's IQ",  next: 'Your dashboard access is being set up. You will receive login details within 24 hours.' },
  command_iq:  { name: 'IQ · Command',  product: "Solomon's IQ",  next: 'Your first quarterly report is being scoped. We will be in touch within 24 hours to kick off.' },
  insight_eye: { name: 'Eye · Insight', product: "Solomon's Eye", next: 'Your CX audit is being scheduled. We will email you within 24 hours with next steps.' },
  growth_eye:  { name: 'Eye · Growth',  product: "Solomon's Eye", next: 'Your first audit is being scheduled. We will email you within 24 hours to kick off.' },
  command_eye: { name: 'Eye · Command', product: "Solomon's Eye", next: 'Your quarterly audit schedule is being set up. Expect an email within 24 hours.' },
}

function ConfirmationContent() {
  const searchParams = useSearchParams()
  const planKey = searchParams.get('plan') || 'insight_iq'
  const paymentId = searchParams.get('payment_id') || ''
  const plan = PLAN_LABELS[planKey] || PLAN_LABELS['insight_iq']

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${WHITE}; color: ${DARK}; font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
        a { text-decoration: none; }
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />

      {/* NAV — dark green */}
      <nav style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 48px',background:DEEP,borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
        <a href="/" style={{display:'flex',alignItems:'center',gap:10}}>
          <svg width="24" height="19" viewBox="0 0 56 44" fill="none"><path d="M4 36L12 14L22 26L28 6L34 26L44 14L52 36H4Z" fill="#C9A84C"/><rect x="4" y="36" width="48" height="6" rx="2" fill="#A07830"/></svg>
          <div style={{display:'flex',flexDirection:'column',lineHeight:1.1}}>
            <span style={{fontFamily:'Playfair Display,serif',fontSize:14,fontWeight:700,color:CREAM,letterSpacing:'0.1em'}}>KING SOLOMON</span>
            <span style={{fontSize:10,color:GOLD}}>Consumer intelligence that tells you why.</span>
          </div>
        </a>
      </nav>

      {/* BODY — white */}
      <div style={{background:WHITE,minHeight:'calc(100vh - 120px)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'48px 24px',textAlign:'center'}}>

        {/* Check icon */}
        <div style={{width:60,height:60,borderRadius:'50%',background:'rgba(95,198,138,0.12)',border:'2px solid rgba(95,198,138,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,color:GREEN,marginBottom:20}}>
          ✓
        </div>

        <p style={{fontSize:11,fontWeight:600,letterSpacing:'0.18em',textTransform:'uppercase',color:GOLD,marginBottom:10}}>Payment confirmed</p>

        <h1 style={{fontFamily:'Playfair Display,serif',fontSize:25,fontWeight:700,color:DARK,marginBottom:8,lineHeight:1.2}}>
          You are in.
        </h1>

        <p style={{fontSize:15,color:BODY_TEXT,marginBottom:28,lineHeight:1.75}}>
          {plan.product} · {plan.name} is now active.
        </p>

        {/* Next steps */}
        <div style={{background:CARD_BG,border:'1px solid rgba(201,168,76,0.2)',borderRadius:12,padding:'20px 28px',maxWidth:480,width:'100%',textAlign:'left',marginBottom:24}}>
          <p style={{fontSize:11,fontWeight:600,letterSpacing:'0.12em',textTransform:'uppercase',color:GOLD,marginBottom:10}}>What happens next</p>
          <p style={{fontSize:15,color:BODY_TEXT,lineHeight:1.75}}>{plan.next}</p>
        </div>

        {/* Payment reference */}
        {paymentId && (
          <p style={{fontSize:12,color:BODY_TEXT,marginBottom:28}}>
            Payment reference: {paymentId}
          </p>
        )}

        {/* CTAs */}
        <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
          <a href="/dashboard" style={{display:'inline-block',background:GOLD,color:DEEP,fontSize:14,fontWeight:600,padding:'12px 24px',borderRadius:8}}>
            Go to dashboard
          </a>
          <a href="/connect" style={{display:'inline-block',background:WHITE,color:DARK,fontSize:14,fontWeight:500,padding:'12px 24px',borderRadius:8,border:`1px solid ${BORDER}`}}>
            Connect with us
          </a>
        </div>

        <p style={{marginTop:24,fontSize:12,color:BODY_TEXT,lineHeight:1.6}}>
          Questions? Email support@kingsolomonhq.com — we respond within 4 hours on weekdays.
        </p>
      </div>

      {/* FOOTER — dark green */}
      <footer style={{background:DEEP,borderTop:'1px solid rgba(255,255,255,0.06)',padding:'24px 48px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:14}}>
        <div style={{fontFamily:'Playfair Display,serif',fontSize:14,fontWeight:700,color:CREAM,letterSpacing:'0.08em'}}>KING SOLOMON</div>
        <div style={{fontSize:12,color:'rgba(200,194,182,0.35)'}}>2026 King Solomon · kingsolomonhq.com · Bengaluru, India</div>
      </footer>
    </>
  )
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div style={{background:WHITE,minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,color:BODY_TEXT}}>
        Loading...
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  )
}