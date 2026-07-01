'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const GOLD = '#C9A84C'
const DEEP = '#0F2318'
const CREAM = '#F5F0E8'
const CREAM_DIM = '#C8C2B6'
const GREEN = '#5fc68a'
const GB = 'rgba(255,255,255,0.08)'
const GLASS = 'rgba(255,255,255,0.04)'

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
        body { background: ${DEEP}; color: ${CREAM}; font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; }
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />

      <div style={{ maxWidth: 520, width: '100%', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, color: GOLD, marginBottom: 20 }}>♛</div>

        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(95,198,138,0.15)', border: '2px solid rgba(95,198,138,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 24, color: GREEN }}>
          ✓
        </div>

        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: GOLD, marginBottom: 10 }}>
          Payment confirmed
        </div>

        <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: 32, fontWeight: 700, color: CREAM, marginBottom: 8, lineHeight: 1.2 }}>
          You're in.
        </h1>

        <div style={{ fontSize: 14, color: CREAM_DIM, marginBottom: 28, lineHeight: 1.75 }}>
          {plan.product} · {plan.name} is now active.
        </div>

        <div style={{ background: GLASS, border: `1px solid ${GB}`, borderRadius: 12, padding: '20px 24px', marginBottom: 24, textAlign: 'left' }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: GOLD, marginBottom: 12 }}>What happens next</div>
          <div style={{ fontSize: 13, color: CREAM_DIM, lineHeight: 1.75 }}>{plan.next}</div>
        </div>

        {paymentId && (
          <div style={{ fontSize: 11, color: 'rgba(197,194,186,0.4)', marginBottom: 28 }}>
            Payment reference: {paymentId}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/dashboard" style={{ display: 'inline-block', background: GOLD, color: DEEP, fontSize: 13, fontWeight: 600, padding: '11px 24px', borderRadius: 8, textDecoration: 'none' }}>
            Go to dashboard
          </a>
          <a href="/connect" style={{ display: 'inline-block', background: 'transparent', color: CREAM, fontSize: 13, fontWeight: 500, padding: '11px 24px', borderRadius: 8, textDecoration: 'none', border: `1px solid ${GB}` }}>
            Connect with us
          </a>
        </div>

        <div style={{ marginTop: 28, fontSize: 11, color: 'rgba(197,194,186,0.35)', lineHeight: 1.6 }}>
          Questions? Email support@kingsolomonhq.com — we respond within 4 hours on weekdays.
        </div>
      </div>
    </>
  )
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div style={{ background: '#0F2318', color: '#F5F0E8', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
        Loading...
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  )
}