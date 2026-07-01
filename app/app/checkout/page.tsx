'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const GOLD = '#C9A84C'
const DEEP = '#0F2318'
const CREAM = '#F5F0E8'
const CREAM_DIM = '#C8C2B6'
const GREEN = '#5fc68a'
const GB = 'rgba(255,255,255,0.08)'
const GLASS = 'rgba(255,255,255,0.04)'

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
    saving: 'Saves $400 vs 2× Insight reports',
    features: ['6-month continuous tracking', 'Live dashboard access', 'Month 3 mid-point Verdict', 'Month 6 full report PDF + PPT', 'Campaign attribution tracking'],
  },
  command_iq: {
    label: "Solomon's IQ · Command",
    product: "Solomon's IQ",
    billing: 'Billed per quarter',
    amount_inr: 265900,
    amount_usd: 2799,
    saving: 'Saves $1,597 vs 4× Insight reports',
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
    saving: 'Saves $999 vs 2× Insight audits',
    features: ['2 full CX audits across 6 months', 'Before and after comparison', 'Competitor CX benchmarking', 'Friction point resolution tracking', 'Priority 5-day delivery'],
  },
  command_eye: {
    label: "Solomon's Eye · Command",
    product: "Solomon's Eye",
    billing: 'Billed per quarter',
    amount_inr: 474900,
    amount_usd: 4999,
    saving: 'Saves $3,996 vs 4× Insight audits',
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
  const [scriptLoaded, setScriptLoaded] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push(`/login?redirect=/checkout?plan=${planKey}`)
        return
      }
      setUser({ id: user.id, email: user.email || '' })
    }
    getUser()
  }, [planKey, router])

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => setScriptLoaded(true)
    document.body.appendChild(script)
    return () => { document.body.removeChild(script) }
  }, [])

  if (!plan) {
    return (
      <div style={{ color: CREAM, textAlign: 'center', padding: '4rem' }}>
        Invalid plan. <a href="/pricing" style={{ color: GOLD }}>View pricing</a>
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
        body { background: ${DEEP}; color: ${CREAM}; font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; min-height: 100vh; }
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />

      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 48px', borderBottom: `1px solid ${GB}` }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <svg width="22" height="17" viewBox="0 0 56 44" fill="none">
            <path d="M4 36L12 14L22 26L28 6L34 26L44 14L52 36H4Z" fill="#C9A84C"/>
            <rect x="4" y="36" width="48" height="6" rx="2" fill="#A07830"/>
          </svg>
          <span style={{ fontFamily: 'Playfair Display,serif', fontSize: 14, fontWeight: 700, color: CREAM, letterSpacing: '0.1em' }}>KING SOLOMON</span>
        </a>
        <div style={{ fontSize: 12, color: CREAM_DIM }}>Secure checkout <span style={{ marginLeft: 8, color: GREEN }}>🔒</span></div>
      </nav>

      <div style={{ maxWidth: 900, margin: '48px auto', padding: '0 24px', display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, alignItems: 'start' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: GOLD, marginBottom: 8 }}>Order summary</div>
          <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: 28, fontWeight: 700, color: CREAM, marginBottom: 6 }}>{plan.label}</h1>
          <div style={{ fontSize: 13, color: CREAM_DIM, marginBottom: 24 }}>{plan.billing}</div>

          <div style={{ display: 'flex', gap: 4, background: GLASS, border: `1px solid ${GB}`, borderRadius: 8, padding: 3, width: 'fit-content', marginBottom: 24 }}>
            {(['INR', 'USD'] as const).map(c => (
              <button key={c} onClick={() => setCurrency(c)} style={{ padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', background: currency === c ? GOLD : 'transparent', color: currency === c ? DEEP : CREAM_DIM, fontSize: 12, fontWeight: 600 }}>
                {c === 'INR' ? '₹ INR' : '$ USD'}
              </button>
            ))}
          </div>

          <div style={{ background: GLASS, border: `1px solid ${GB}`, borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
              <span style={{ fontFamily: 'Playfair Display,serif', fontSize: 36, fontWeight: 700, color: GOLD }}>{displayAmount}</span>
            </div>
            <div style={{ fontSize: 12, color: CREAM_DIM, marginBottom: plan.saving ? 6 : 0 }}>{plan.billing}</div>
            {plan.saving && <div style={{ fontSize: 12, color: GREEN }}>{plan.saving}</div>}
          </div>

          <div style={{ background: GLASS, border: `1px solid ${GB}`, borderRadius: 12, padding: '20px 24px', marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: GOLD, marginBottom: 14 }}>What's included</div>
            {plan.features.map(f => (
              <div key={f} style={{ display: 'flex', gap: 10, fontSize: 13, color: CREAM_DIM, marginBottom: 10, lineHeight: 1.4 }}>
                <span style={{ color: GREEN, flexShrink: 0 }}>✦</span>{f}
              </div>
            ))}
          </div>

          <div style={{ fontSize: 11, color: 'rgba(197,194,186,0.4)', lineHeight: 1.6 }}>
            Questions? <a href="/connect" style={{ color: GOLD, textDecoration: 'none' }}>Connect with us</a> before purchasing. Discovery call is free.
          </div>
        </div>

        <div style={{ background: GLASS, border: `1px solid ${GB}`, borderRadius: 12, padding: '24px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: GOLD, marginBottom: 16 }}>Payment</div>

          {user ? (
            <div style={{ fontSize: 12, color: CREAM_DIM, marginBottom: 16, padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 8 }}>
              Paying as <strong style={{ color: CREAM }}>{user.email}</strong>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: CREAM_DIM, marginBottom: 16 }}>Sign in to continue...</div>
          )}

          <div style={{ fontSize: 12, color: CREAM_DIM, marginBottom: 16, lineHeight: 1.6 }}>
            You'll be redirected to Razorpay's secure checkout. Pay by card, UPI, net banking, or wallet.
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: `1px solid ${GB}`, borderBottom: `1px solid ${GB}`, marginBottom: 20 }}>
            <span style={{ fontSize: 13, color: CREAM_DIM }}>Total {currency === 'INR' ? '(+ GST if applicable)' : ''}</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: GOLD, fontFamily: 'Playfair Display,serif' }}>{displayAmount}</span>
          </div>

          {error && (
            <div style={{ background: 'rgba(220,50,50,0.12)', border: '1px solid rgba(220,50,50,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#ff8080', marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button
            onClick={handlePayment}
            disabled={loading || !user || !scriptLoaded}
            style={{ width: '100%', padding: '13px', background: loading ? 'rgba(201,168,76,0.5)' : GOLD, color: DEEP, border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', marginBottom: 12 }}
          >
            {loading ? 'Opening checkout...' : `Pay ${displayAmount}`}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11, color: 'rgba(197,194,186,0.4)' }}>
            🔒 Secured by Razorpay
          </div>

          <div style={{ marginTop: 16, fontSize: 11, color: 'rgba(197,194,186,0.4)', textAlign: 'center', lineHeight: 1.6 }}>
            By paying you agree to our terms. For refunds email support@kingsolomonhq.com
          </div>
        </div>
      </div>
    </>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div style={{ background: '#0F2318', color: '#F5F0E8', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
        Loading...
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}