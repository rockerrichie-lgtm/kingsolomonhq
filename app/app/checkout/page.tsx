'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

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

const PLANS: Record<string, {
  label: string
  product: string
  billing: string
  amount_inr: number
  amount_usd: number
  saving?: string
  features: string[]
}> = {
  insight_iq: {
    label: "Solomon's IQ · Insight",
    product: "Solomon's IQ",
    billing: 'One-time report',
    amount_inr: 56900,
    amount_usd: 599,
    features: ['All 5 KPIs tracked', 'Competitor landscape', "Solomon's Verdict narrative", 'PDF + PPT in 5 days'],
  },
  growth_iq: {
    label: "Solomon's IQ · Growth",
    product: "Solomon's IQ",
    billing: 'Billed every 6 months',
    amount_inr: 341900,
    amount_usd: 3599,
    saving: 'Saves $400 vs 2x Insight reports',
    features: ['6-month continuous tracking', 'Live dashboard access', 'Month 3 mid-point Verdict', 'Month 6 full report PDF + PPT', 'Campaign attribution tracking'],
  },
  command_iq: {
    label: "Solomon's IQ · Command",
    product: "Solomon's IQ",
    billing: 'Billed per quarter',
    amount_inr: 265900,
    amount_usd: 2799,
    saving: 'Saves $1,597 vs 4x Insight reports',
    features: ['4 quarterly reports per year', 'Everything in Growth', '5th annual report free', 'Priority 48hr Verdict turnaround', 'Quarterly account review call'],
  },
  insight_eye: {
    label: "Solomon's Eye · Insight",
    product: "Solomon's Eye",
    billing: 'One-time CX audit',
    amount_inr: 142400,
    amount_usd: 1499,
    features: ['Full CX walkthrough', 'Screen recording + commentary', 'Written PDF + PPT', 'Top 5 friction points', 'Delivered in 7 business days'],
  },
  growth_eye: {
    label: "Solomon's Eye · Growth",
    product: "Solomon's Eye",
    billing: 'Billed every 6 months',
    amount_inr: 569900,
    amount_usd: 5999,
    saving: 'Saves $999 vs 2x Insight audits',
    features: ['2 full CX audits across 6 months', 'Before and after comparison', 'Competitor CX benchmarking', 'Friction point resolution tracking', 'Priority 5-day delivery'],
  },
  command_eye: {
    label: "Solomon's Eye · Command",
    product: "Solomon's Eye",
    billing: 'Billed per quarter',
    amount_inr: 474900,
    amount_usd: 4999,
    saving: 'Saves $3,996 vs 4x Insight audits',
    features: ['4 quarterly CX audits per year', 'Everything in Growth', '5th annual audit free', '48hr priority delivery', 'Quarterly debrief call'],
  },
}

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planKey = searchParams.get('plan') || 'insight_iq'
  const plan = PLANS[planKey]

  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)

  // AUTH GUARD — redirect to login if not signed in
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push(`/login?redirect=/checkout?plan=${planKey}`)
        return
      }
      setUser({ id: user.id, email: user.email || '' })
      setAuthChecked(true)
    }
    checkAuth()
  }, [planKey, router])

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => setScriptLoaded(true)
    document.body.appendChild(script)
    return () => { document.body.removeChild(script) }
  }, [])

  // Show nothing while auth check is in progress
  if (!authChecked) return (
    <div style={{minHeight:'100vh',background:WHITE,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{fontSize:14,color:BODY_TEXT}}>Loading...</div>
    </div>
  )

  if (!plan) {
    return (
      <div style={{minHeight:'100vh',background:WHITE,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{textAlign:'center'}}>
          <p style={{fontSize:15,color:BODY_TEXT,marginBottom:16}}>Invalid plan.</p>
          <a href="/pricing" style={{color:GOLD,fontSize:14,fontWeight:500}}>View pricing →</a>
        </div>
      </div>
    )
  }

  const displayAmount = currency === 'INR'
    ? `Rs ${plan.amount_inr.toLocaleString('en-IN')}`
    : `$${plan.amount_usd.toLocaleString()}`

  const handlePayment = async () => {
    if (!user) { setError('Please sign in to continue.'); return }
    if (!scriptLoaded) { setError('Payment loading. Please wait a moment.'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_key: planKey, email: user.email, user_id: user.id, currency }),
      })
      const orderData = await res.json()
      if (!res.ok) throw new Error(orderData.error || 'Failed to create order')

      const rzp = new (window as any).Razorpay({
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.order_id,
        name: 'King Solomon',
        description: orderData.plan_label,
        image: '/favicon.ico',
        prefill: { email: user.email },
        theme: { color: GOLD },
        handler: async (response: any) => {
          const verifyRes = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          })
          const verifyData = await verifyRes.json()
          if (verifyData.success) {
            router.push(`/confirmation?plan=${planKey}&payment_id=${response.razorpay_payment_id}`)
          } else {
            setError('Payment verification failed. Please contact support.')
            setLoading(false)
          }
        },
        modal: { ondismiss: () => { setLoading(false) } }
      })
      rzp.open()
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

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
            <span style={{fontSize:10,color:GOLD}}>Secure checkout</span>
          </div>
        </a>
        <div style={{fontSize:12,color:CREAM_DIM,display:'flex',alignItems:'center',gap:6}}>
          <span style={{color:GREEN}}>🔒</span> Secured by Razorpay
        </div>
      </nav>

      {/* HERO — white */}
      <section style={{background:WHITE,padding:'48px 24px 32px',borderBottom:`1px solid ${BORDER}`}}>
        <div style={{maxWidth:900,margin:'0 auto'}}>
          <p style={{fontSize:11,fontWeight:600,letterSpacing:'0.18em',textTransform:'uppercase',color:GOLD,marginBottom:8}}>Order summary</p>
          <h1 style={{fontFamily:'Playfair Display,serif',fontSize:25,fontWeight:700,color:DARK,marginBottom:6}}>{plan.label}</h1>
          <p style={{fontSize:15,color:BODY_TEXT,marginBottom:16}}>{plan.billing}</p>
          <div style={{display:'flex',gap:4,border:`1px solid ${BORDER}`,borderRadius:8,padding:3,width:'fit-content'}}>
            {(['INR','USD'] as const).map(c => (
              <button key={c} onClick={() => setCurrency(c)} style={{padding:'6px 16px',borderRadius:6,border:'none',cursor:'pointer',background:currency===c?GOLD:WHITE,color:currency===c?DEEP:BODY_TEXT,fontSize:12,fontWeight:600,fontFamily:'Inter,sans-serif'}}>
                {c === 'INR' ? '₹ INR' : '$ USD'}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* BODY — white */}
      <div style={{maxWidth:900,margin:'0 auto',padding:'32px 24px',display:'grid',gridTemplateColumns:'1fr 360px',gap:32,alignItems:'start'}}>

        {/* LEFT */}
        <div>
          <div style={{background:CARD_BG,border:'1px solid rgba(201,168,76,0.2)',borderRadius:12,padding:'20px 24px',marginBottom:20}}>
            <div style={{display:'flex',alignItems:'baseline',gap:4,marginBottom:4}}>
              <span style={{fontFamily:'Playfair Display,serif',fontSize:32,fontWeight:700,color:GOLD}}>{displayAmount}</span>
            </div>
            <div style={{fontSize:14,color:BODY_TEXT,marginBottom:plan.saving?6:0}}>{plan.billing}</div>
            {plan.saving && <div style={{fontSize:13,color:MID_GREEN}}>{plan.saving}</div>}
          </div>

          <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'20px 24px',marginBottom:20}}>
            <div style={{fontSize:11,fontWeight:600,letterSpacing:'0.12em',textTransform:'uppercase',color:GOLD,marginBottom:14}}>What is included</div>
            {plan.features.map(f => (
              <div key={f} style={{display:'flex',gap:10,fontSize:15,color:BODY_TEXT,marginBottom:10,lineHeight:1.5}}>
                <span style={{color:GREEN,flexShrink:0}}>✦</span>{f}
              </div>
            ))}
          </div>

          <div style={{fontSize:13,color:BODY_TEXT,lineHeight:1.6}}>
            Questions before purchasing? <a href="/connect" style={{color:GOLD,fontWeight:500}}>Connect with us</a> — discovery call is free.
          </div>
        </div>

        {/* RIGHT */}
        <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'24px'}}>
          <div style={{fontSize:11,fontWeight:600,letterSpacing:'0.15em',textTransform:'uppercase',color:GOLD,marginBottom:16}}>Payment</div>

          <div style={{fontSize:13,color:BODY_TEXT,marginBottom:16,padding:'10px 12px',background:CARD_BG,borderRadius:8,border:`1px solid ${BORDER}`}}>
            Paying as <strong style={{color:DARK}}>{user?.email}</strong>
          </div>

          <div style={{fontSize:13,color:BODY_TEXT,marginBottom:16,lineHeight:1.6}}>
            You will be redirected to Razorpay's secure checkout. Pay by card, UPI, net banking, or wallet.
          </div>

          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderTop:`1px solid ${BORDER}`,borderBottom:`1px solid ${BORDER}`,marginBottom:20}}>
            <span style={{fontSize:14,color:BODY_TEXT}}>Total {currency === 'INR' ? '(+ GST if applicable)' : ''}</span>
            <span style={{fontSize:18,fontWeight:700,color:GOLD,fontFamily:'Playfair Display,serif'}}>{displayAmount}</span>
          </div>

          {error && (
            <div style={{background:'rgba(220,50,50,0.08)',border:'1px solid rgba(220,50,50,0.2)',borderRadius:8,padding:'10px 14px',fontSize:13,color:'#c0392b',marginBottom:16}}>
              {error}
            </div>
          )}

          <button
            onClick={handlePayment}
            disabled={loading || !scriptLoaded}
            style={{width:'100%',padding:'13px',background:loading?'rgba(201,168,76,0.5)':GOLD,color:DEEP,border:'none',borderRadius:8,fontSize:14,fontWeight:700,cursor:loading?'not-allowed':'pointer',fontFamily:'Inter,sans-serif',marginBottom:12}}
          >
            {loading ? 'Opening checkout...' : `Pay ${displayAmount}`}
          </button>

          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,fontSize:12,color:BODY_TEXT}}>
            <span style={{color:GREEN}}>🔒</span> Secured by Razorpay
          </div>

          <div style={{marginTop:14,fontSize:12,color:BODY_TEXT,textAlign:'center',lineHeight:1.6}}>
            For refunds or queries email support@kingsolomonhq.com
          </div>
        </div>
      </div>

      {/* FOOTER — dark green */}
      <footer style={{background:DEEP,borderTop:'1px solid rgba(255,255,255,0.06)',padding:'24px 48px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:14,marginTop:48}}>
        <div style={{fontFamily:'Playfair Display,serif',fontSize:14,fontWeight:700,color:CREAM,letterSpacing:'0.08em'}}>KING SOLOMON</div>
        <div style={{fontSize:12,color:'rgba(200,194,182,0.35)'}}>By paying you agree to our terms · support@kingsolomonhq.com</div>
      </footer>
    </>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div style={{background:WHITE,minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,color:BODY_TEXT}}>
        Loading...
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}