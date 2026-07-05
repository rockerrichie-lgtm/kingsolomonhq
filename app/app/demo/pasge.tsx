'use client'

import { useRouter } from 'next/navigation'

const GOLD = '#C9A84C'
const DEEP = '#0F2318'
const CREAM = '#F5F0E8'
const CREAM_DIM = '#C8C2B6'
const GREEN = '#5fc68a'
const RED = '#e87878'
const AMBER = '#C9A84C'
const GB = 'rgba(255,255,255,0.08)'
const GLASS = 'rgba(255,255,255,0.04)'

const KPI_CARDS = [
  { label: 'Awareness', score: '72', zone: 'Established', zoneColor: GREEN, mov: '↑ +4 pts', signals: [['Searched', GREEN], ['Found', GREEN], ['Shown', '#555']] },
  { label: 'Consideration', score: '61', zone: 'Contested', zoneColor: AMBER, mov: '↑ +9 pts', signals: [['Comparing', AMBER], ['Trialling', GREEN], ['Interested', AMBER]] },
  { label: 'Usage', score: '33', zone: 'Emerging', zoneColor: RED, mov: '↓ −3 pts', signals: [['Repeat users', AMBER], ['Switchers', RED], ['Lost', AMBER]] },
  { label: 'Imagery', score: null, zone: 'Mixed signals', zoneColor: AMBER, mov: '● themes', signals: [['Echoing', GREEN], ['Drifting', AMBER]] },
  { label: 'Buzz', score: '+18', zone: 'Contested', zoneColor: AMBER, mov: '→ Stable', signals: [['Praising', GREEN], ['Questioning', AMBER], ['Attacking', AMBER]] },
]

const COMP_ROWS = [
  { brand: 'Your brand', you: true, aw: '72', co: '61', us: '33', bz: '+18' },
  { brand: 'Competitor A', you: false, aw: '81 ↑', co: '74 ↑', us: '52 ↑', bz: '+28' },
  { brand: 'Competitor B', you: false, aw: '68 ~', co: '57 ~', us: '44 ↑', bz: '+14' },
  { brand: 'Competitor C', you: false, aw: '61 ~', co: '58 ~', us: '29 ~', bz: '+11' },
]

export default function DemoPage() {
  const router = useRouter()

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${DEEP}; color: ${CREAM}; font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />

      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative' }}>

        {/* Sidebar */}
        <div style={{ width: 190, flexShrink: 0, background: 'rgba(0,0,0,0.3)', borderRight: `1px solid ${GB}`, display: 'flex', flexDirection: 'column', padding: '14px 0' }}>
          <div style={{ padding: '0 14px 14px', borderBottom: `1px solid ${GB}`, marginBottom: 8 }}>
            <div style={{ fontSize: 16, color: GOLD }}>♛</div>
            <div style={{ fontSize: 12, fontWeight: 500, color: CREAM }}>King Solomon</div>
            <div style={{ fontSize: 10, color: CREAM_DIM }}>Consumer intelligence</div>
          </div>
          <div style={{ fontSize: 9, fontWeight: 500, color: 'rgba(197,194,186,0.4)', padding: '6px 14px 2px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Solomon's IQ</div>
          {[['Dashboard', true], ['Campaigns', false], ['Brand Settings', false]].map(([label, active]) => (
            <div key={String(label)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', fontSize: 12, color: active ? CREAM : CREAM_DIM, borderLeft: active ? `2px solid ${GOLD}` : '2px solid transparent', background: active ? 'rgba(255,255,255,0.04)' : 'transparent' }}>
              {String(label)}
            </div>
          ))}
          <div style={{ fontSize: 9, fontWeight: 500, color: 'rgba(197,194,186,0.4)', padding: '10px 14px 2px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Solomon's Eye</div>
          <div style={{ padding: '7px 14px', fontSize: 12, color: 'rgba(197,194,186,0.3)' }}>CX Audit</div>
          <div style={{ marginTop: 'auto', padding: '10px 14px', borderTop: `1px solid ${GB}` }}>
            <div style={{ fontSize: 10, color: 'rgba(197,194,186,0.4)' }}>Demo mode</div>
          </div>
        </div>

        {/* Main */}
        <div style={{ flex: 1, overflow: 'auto', padding: 16, filter: 'blur(2px)', userSelect: 'none' }}>

          {/* Top bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, color: CREAM }}>Sample Brand</div>
              <div style={{ fontSize: 11, color: CREAM_DIM }}>Demo data · not your brand</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['Now', '30d', '60d', '90d'].map((t, i) => (
                <div key={t} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, background: i === 0 ? 'rgba(255,255,255,0.1)' : 'transparent', color: i === 0 ? CREAM : CREAM_DIM, border: `1px solid ${GB}` }}>{t}</div>
              ))}
            </div>
          </div>

          {/* Source bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: GLASS, borderRadius: 6, border: `1px solid ${GB}`, marginBottom: 12, fontSize: 11, color: CREAM_DIM }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN }} />
            Signals from 14 sources · Last updated 2 hours ago · 2.4M+ data points
          </div>

          {/* Gap alert */}
          <div style={{ background: 'rgba(201,168,76,0.1)', border: `1px solid rgba(201,168,76,0.3)`, borderRadius: 6, padding: '7px 12px', fontSize: 11, color: AMBER, marginBottom: 12 }}>
            ⚠ Conversion gap — Consideration (61) is 28 points above Usage (33). Inside-platform audit recommended.
          </div>

          {/* KPI cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, marginBottom: 12 }}>
            {KPI_CARDS.map(k => (
              <div key={k.label} style={{ background: GLASS, border: `1px solid ${GB}`, borderRadius: 10, padding: '10px 9px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: k.zoneColor }} />
                <div style={{ fontSize: 9, fontWeight: 500, color: 'rgba(197,194,186,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>{k.label}</div>
                {k.score && <div style={{ fontSize: 24, fontWeight: 500, color: CREAM, lineHeight: 1, marginBottom: 3 }}>{k.score}</div>}
                <div style={{ fontSize: 9, fontWeight: 500, color: k.zoneColor, marginBottom: 4 }}>{k.zone}</div>
                <div style={{ fontSize: 9, color: CREAM_DIM, marginBottom: 6 }}>{k.mov}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {k.signals.map(([label, color]) => (
                    <div key={String(label)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 8, color: CREAM_DIM }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: String(color), flexShrink: 0 }} />
                      {String(label)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Competitor table */}
          <div style={{ background: GLASS, border: `1px solid ${GB}`, borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ padding: '8px 12px', borderBottom: `1px solid ${GB}`, fontSize: 10, fontWeight: 500, color: CREAM_DIM, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Competitor comparison</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr>
                  {['Brand', 'Awareness', 'Consideration', 'Usage', 'Buzz'].map(h => (
                    <th key={h} style={{ padding: '6px 10px', textAlign: h === 'Brand' ? 'left' : 'center', fontSize: 9, fontWeight: 500, color: 'rgba(197,194,186,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1px solid ${GB}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMP_ROWS.map(r => (
                  <tr key={r.brand} style={{ background: r.you ? 'rgba(201,168,76,0.06)' : 'transparent' }}>
                    <td style={{ padding: '6px 10px', color: CREAM, fontWeight: r.you ? 500 : 400 }}>{r.brand}{r.you && <span style={{ fontSize: 9, color: CREAM_DIM, marginLeft: 4 }}>you</span>}</td>
                    {[r.aw, r.co, r.us, r.bz].map((v, i) => (
                      <td key={i} style={{ padding: '6px 10px', textAlign: 'center', color: v.includes('↑') ? GREEN : v.includes('~') ? AMBER : CREAM }}>{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Verdict */}
          <div style={{ background: GLASS, border: `1px solid ${GB}`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 500, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>⭐ Solomon's Verdict</div>
            <div style={{ fontSize: 12, color: CREAM_DIM, lineHeight: 1.7, fontStyle: 'italic', borderLeft: `2px solid ${GB}`, paddingLeft: 10 }}>
              Consideration spiked +9 points driven by the campaign, but Usage is declining and the Conversion Gap has widened to 28 points. The problem is inside the platform — not in the campaign. Audit delivery time and checkout experience in top 3 cities. Act within 2 weeks.
            </div>
          </div>
        </div>

        {/* Overlay CTA */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, padding: '1rem' }}>
          <div style={{ background: 'rgba(15,35,24,0.92)', backdropFilter: 'blur(16px)', border: `1px solid rgba(201,168,76,0.3)`, borderRadius: 16, padding: '40px 48px', textAlign: 'center', maxWidth: 480, width: '100%', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
            <div style={{ fontSize: 36, color: GOLD, marginBottom: 12 }}>♛</div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: GOLD, marginBottom: 10 }}>Demo mode</div>
            <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: 26, fontWeight: 700, color: CREAM, marginBottom: 10, lineHeight: 1.3 }}>
              This is what your dashboard looks like
            </h1>
            <p style={{ fontSize: 13, color: CREAM_DIM, lineHeight: 1.75, marginBottom: 28 }}>
              Real scores for your brand vs your competitors. Live KPI tracking, competitor comparison, and Solomon's Verdict — telling you why, not just what.
            </p>
            <button
              onClick={() => router.push('/pricing')}
              style={{ width: '100%', padding: '13px', background: GOLD, color: DEEP, border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif', marginBottom: 12 }}
            >
              Set up my brand →
            </button>
            <div
              onClick={() => router.push('/dashboard')}
              style={{ fontSize: 12, color: CREAM_DIM, cursor: 'pointer', textDecoration: 'underline' }}
            >
              I already have an account — go to dashboard
            </div>
          </div>
        </div>

      </div>
    </>
  )
}