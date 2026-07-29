'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const KPI_NAMES = ['awareness', 'consideration', 'usage', 'imagery', 'buzz'] as const
type KpiName = typeof KPI_NAMES[number]
type TimeWindow = 'current' | '30d' | '60d' | '90d'
type ActiveProduct = 'iq' | 'eye'

const GOLD = '#C9A84C'
const DEEP = '#0F2318'
const MID_GREEN = '#1F4A2F'
const CREAM = '#F5F0E8'
const CREAM_DIM = '#C8C2B6'
const WHITE = '#ffffff'
const DARK = '#1a1a1a'
const BODY_TEXT = '#444444'
const BORDER = '#f0f0f0'
const GREEN = '#5fc68a'
const RED = '#e87878'
const AMBER = '#C9A84C'

const CX_THEMES = ['Product', 'Experience', 'Customer Service', 'Pricing', 'Collections'] as const

interface KpiSnapshot {
  kpi_name: KpiName
  score: number
  zone: string
  movement: number | null
  confidence_level: string
  source: string | null
  competitor_id: string | null
  sub_bucket_searched?: number | null
  sub_bucket_found?: number | null
  sub_bucket_shown?: number | null
  sub_bucket_comparing?: number | null
  sub_bucket_trialling?: number | null
  sub_bucket_interested?: number | null
  sub_bucket_repeat?: number | null
  sub_bucket_switchers?: number | null
  sub_bucket_lost?: number | null
  sub_bucket_praising?: number | null
  sub_bucket_questioning?: number | null
  sub_bucket_attacking?: number | null
  sources_count?: number | null
  last_updated?: string | null
  positive_keywords?: string | null
  negative_keywords?: string | null
}

interface Competitor { id: string; name: string }

interface Verdict {
  narrative: string
  recommended_action: string | null
  recommended_action_window: string | null
  risk_flags: string[] | null
  top_insights: string[] | null
  confidence_level: string | null
  created_at: string
}

interface CxAudit {
  id: string
  audit_date: string | null
  overall_cx_nps: number | null
  total_signals: number | null
  benchmark: number
  category_type: string
  status: string
  audit_type: string
}

interface CxThemeScore {
  theme: string
  nps_score: number | null
  signal_count: number | null
  dropout_rate: number | null
  top_concern: string | null
  sentiment: string
  confidence: string
  positive_keywords?: string | null
  negative_keywords?: string | null
  positive_signal_count?: number | null
  negative_signal_count?: number | null
}

interface CompetitorThemes {
  id: string
  name: string
  themes: CxThemeScore[]
}

interface CxVerdict {
  narrative: string | null
  top_priorities: any
  recommended_actions: any
  mystery_audit_triggered: boolean
}

const ZONE_COLOR: Record<string, string> = {
  critical: RED, emerging: '#E2C97A', contested: AMBER,
  established: GREEN, category_defining: GREEN,
}
const TIME_WINDOWS: { key: TimeWindow; label: string }[] = [
  { key: 'current', label: 'Now' },
  { key: '30d', label: '30d' },
  { key: '60d', label: '60d' },
  { key: '90d', label: '90d' },
]

const KPI_CONFIG: Record<KpiName, {
  label: string
  desc: string
  subBuckets: { key: string; label: string; desc: string; diagnostic?: boolean }[]
  intelligence: (brand: KpiSnapshot, compKpis: KpiSnapshot[], competitors: Competitor[]) => string | null
}> = {
  awareness: {
    label: 'Awareness',
    desc: 'How deeply the brand is present in consumer consciousness — across unprompted search recall, category discovery, and social feed presence.',
    subBuckets: [
      { key: 'sub_bucket_searched', label: 'Searched', desc: 'Consumer typed the brand name unprompted — spontaneous recall proxy' },
      { key: 'sub_bucket_found', label: 'Found', desc: 'Consumer searched the category and found the brand — aided discovery proxy' },
      { key: 'sub_bucket_shown', label: 'Shown', desc: 'Brand appeared in consumer feed without being searched — media reach proxy' },
    ],
    intelligence: (brand) => {
      const s = brand.sub_bucket_searched ?? 0
      const sh = brand.sub_bucket_shown ?? 0
      if (sh > s + 15) return `Shown (${sh}) is outpacing Searched (${s}) by ${sh - s} points. Media reach is not converting to spontaneous recall. Brand distinctiveness investment needed before media scale.`
      if (s > 60 && sh < 30) return `Searched (${s}) is strong but Shown (${sh}) is low. The brand has earned recall without paid media — amplification would compound this advantage.`
      return null
    }
  },
  consideration: {
    label: 'Consideration',
    desc: 'Active purchase-intent signals — how consumers are evaluating the brand against alternatives in the market.',
    subBuckets: [
      { key: 'sub_bucket_comparing', label: 'Comparing', desc: 'Consumer actively comparing brand vs alternatives' },
      { key: 'sub_bucket_trialling', label: 'Trialling', desc: 'Consumer has moved to first-time trial or purchase intent' },
      { key: 'sub_bucket_interested', label: 'Interested', desc: 'Passive interest — aware and curious but not yet evaluating' },
    ],
    intelligence: (brand) => {
      const c = brand.sub_bucket_comparing ?? 0
      const t = brand.sub_bucket_trialling ?? 0
      const i = brand.sub_bucket_interested ?? 0
      if (c > t + 10) return `Comparing (${c}) is strong but Trialling (${t}) is weak. Consumers are evaluating but not converting to trial. First purchase friction is the critical intervention point.`
      if (i > c + 15) return `Interested (${i}) dominates over Comparing (${c}). Passive awareness exists but active evaluation has not started. A trigger event or offer could accelerate conversion.`
      return null
    }
  },
  usage: {
    label: 'Usage',
    desc: 'Post-purchase behaviour signals — retention, loyalty and churn patterns from reviews and social content.',
    subBuckets: [
      { key: 'sub_bucket_repeat', label: 'Repeat', desc: 'Loyalty signals — habitual repurchase and regular usage language' },
      { key: 'sub_bucket_lost', label: 'Lost', desc: 'Churn signals — discontinued use, cancelled, never again language' },
      { key: 'sub_bucket_switchers', label: 'Switchers', desc: 'Users who came from or moved to a competitor — diagnostic only', diagnostic: true },
    ],
    intelligence: (brand) => {
      const r = brand.sub_bucket_repeat ?? 0
      const l = brand.sub_bucket_lost ?? 0
      const sw = brand.sub_bucket_switchers ?? 0
      if (l > r) return `Lost (${l}) exceeds Repeat (${r}). You are acquiring but not retaining. Every new customer costs more than keeping an existing one — retention is the priority lever.`
      if (sw > 30) return `Switchers (${sw}) is above 30% of usage signals — borrowed loyalty risk. These users came from a competitor and have not yet committed. A loyalty trigger within 60 days is critical.`
      if (r > 60) return `Repeat (${r}) is strong. Core base is loyal. Growth lever is acquisition not retention.`
      return null
    }
  },
  imagery: {
    label: 'Imagery',
    desc: 'Consumer attribute language — how the brand is perceived versus desired positioning. NLP analysis of brand language across all signals.',
    subBuckets: [
      { key: 'sub_bucket_searching', label: 'Positive attributes', desc: 'Language consumers use that aligns with desired brand attributes' },
      { key: 'sub_bucket_found', label: 'Negative attributes', desc: 'Language consumers use that conflicts with brand positioning' },
    ],
    intelligence: (brand) => {
      const pos = brand.sub_bucket_searched ?? brand.score
      const neg = brand.sub_bucket_found ?? 0
      if (pos > neg + 20) return `Positive attribute language strongly outpaces negative — brand equity is healthy. Protect and amplify rather than over-engineer messaging.`
      if (neg > pos) return `Negative attribute language exceeds positive — consumer perception is drifting from intended positioning. Communication and product experience need realignment.`
      return null
    }
  },
  buzz: {
    label: 'Buzz',
    desc: 'Social advocacy signals — who is talking about the brand and with what intent. Net sentiment across all social and news signals.',
    subBuckets: [
      { key: 'sub_bucket_praising', label: 'Praising', desc: 'Active positive advocacy — recommending, celebrating, defending' },
      { key: 'sub_bucket_questioning', label: 'Questioning', desc: 'Pre-crisis signal — uncertainty forming before a verdict — acts within 6-12 hours' },
      { key: 'sub_bucket_attacking', label: 'Attacking', desc: 'Active negative advocacy — criticism, avoidance, brand damage language' },
    ],
    intelligence: (brand) => {
      const p = brand.sub_bucket_praising ?? 0
      const q = brand.sub_bucket_questioning ?? 0
      const a = brand.sub_bucket_attacking ?? 0
      if (q > 30) return `Questioning (${q}) is elevated — pre-crisis signal. Questioning historically precedes Attacking by 6-12 hours. Identify the source of uncertainty and respond before it solidifies.`
      if (a > p) return `Attacking (${a}) exceeds Praising (${p}) — active reputation risk. Crisis response protocol should be activated.`
      if (p > 50 && a < 15) return `Praising (${p}) is strong and Attacking (${a}) is low. This amplification window typically lasts 7-14 days — act now to extend it.`
      return null
    }
  },
}

const THEME_INTELLIGENCE: Record<string, (t: CxThemeScore, benchmark: number) => string> = {
  'Customer Service': (t, b) => t.nps_score !== null && t.nps_score < b - 30
    ? `Score of ${t.nps_score} vs benchmark ${b} — a ${Math.abs(t.nps_score - b)}-point gap. Post-purchase breakdown is the single largest revenue risk in your CX profile.`
    : `Customer Service score of ${t.nps_score} is within range of benchmark ${b}.`,
  'Pricing': (t, b) => t.nps_score !== null && t.nps_score < 0
    ? `Negative pricing score of ${t.nps_score} indicates a value perception gap. Consumers are not connecting product quality to price point.`
    : `Pricing score of ${t.nps_score} is positive — value perception is intact.`,
  'Experience': (t, b) => t.dropout_rate !== null && t.dropout_rate > 30
    ? `Experience dropout at ${t.dropout_rate}% — nearly ${Math.round(t.dropout_rate / 10)} in 10 negative signal authors report abandoning the journey. Fix checkout friction before next campaign.`
    : `Experience dropout at ${t.dropout_rate}% is within acceptable range.`,
  'Collections': (t, b) => t.nps_score !== null && t.nps_score > b
    ? `Collections score of ${t.nps_score} exceeds benchmark ${b} — a brand strength. Range and availability are underutilised acquisition assets.`
    : `Collections score of ${t.nps_score} — ensure range awareness matches availability.`,
  'Product': (t, b) => t.nps_score !== null && t.nps_score > 0
    ? `Product score of ${t.nps_score} is positive — product quality is a brand strength. Amplify in acquisition messaging.`
    : `Product score of ${t.nps_score} indicates product experience concerns require attention.`,
}

function npsColor(score: number | null, benchmark: number): string {
  if (score === null) return '#ccc'
  if (score >= benchmark) return GREEN
  if (score >= benchmark - 15) return AMBER
  return RED
}

function sentimentDot(s: string) {
  return s === 'positive' ? GREEN : s === 'negative' ? RED : AMBER
}

function WordCloud({ keywords, color, label }: { keywords: string; color: string; label: string }) {
  const words = keywords.split(',').map(w => w.trim()).filter(Boolean)
  if (!words.length) return null
  return (
    <div style={{marginBottom:12}}>
      <div style={{fontSize:9,fontWeight:600,color,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>{label}</div>
      <div style={{display:'flex',flexWrap:'wrap',gap:5,padding:'10px 12px',background:'#f9f9f9',borderRadius:8,border:`1px solid ${BORDER}`}}>
        {words.map((w, i) => (
          <span key={w} style={{fontSize:Math.round(20 - (i / Math.max(words.length-1,1)) * 8),fontWeight:i<3?700:i<6?600:400,color,opacity:Math.max(0.5, 1 - i/words.length * 0.5)}}>{w}</span>
        ))}
      </div>
    </div>
  )
}

// ── KPI Deep Dive Modal ────────────────────────────────────────────────────────
function KpiModal({ kpiName, brandKpi, competitorKpis, competitors, brandName, onClose }: {
  kpiName: KpiName
  brandKpi: KpiSnapshot | undefined
  competitorKpis: KpiSnapshot[]
  competitors: Competitor[]
  brandName: string
  onClose: () => void
}) {
  const cfg = KPI_CONFIG[kpiName]
  const intel = brandKpi ? cfg.intelligence(brandKpi, competitorKpis, competitors) : null
  const getCompKpi = (cId: string) => competitorKpis.find(k => k.competitor_id === cId && k.kpi_name === kpiName)
  const allBrands = [
    { name: brandName, kpi: brandKpi, you: true },
    ...competitors.map(c => ({ name: c.name, kpi: getCompKpi(c.id), you: false }))
  ]
  const maxVal = Math.max(...allBrands.map(b => b.kpi?.score ?? 0), 50)

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
      <div onClick={e => e.stopPropagation()} style={{background:WHITE,borderRadius:16,width:'100%',maxWidth:640,maxHeight:'85vh',overflowY:'auto',boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 24px',borderBottom:`1px solid ${BORDER}`}}>
          <div>
            <div style={{fontSize:9,fontWeight:700,color:GOLD,textTransform:'uppercase',letterSpacing:'0.15em',marginBottom:3}}>{cfg.label}</div>
            <div style={{fontSize:12,color:BODY_TEXT,maxWidth:400}}>{cfg.desc}</div>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'#aaa',padding:'4px 8px'}}>×</button>
        </div>
        <div style={{padding:'20px 24px'}}>
          {cfg.subBuckets.map((sb, si) => {
            const brandVal = brandKpi ? (brandKpi as any)[sb.key] ?? brandKpi.score : null
            return (
              <div key={sb.key} style={{marginBottom: si < cfg.subBuckets.length - 1 ? 20 : 0}}>
                <div style={{marginBottom:6}}>
                  <div style={{fontSize:12,fontWeight:600,color:DARK,marginBottom:2}}>
                    {sb.label}
                    {sb.diagnostic && <span style={{fontSize:9,color:AMBER,marginLeft:6,fontWeight:400}}>diagnostic only</span>}
                  </div>
                  <div style={{fontSize:10,color:'#aaa'}}>{sb.desc}</div>
                </div>
                {allBrands.map(b => {
                  const val = b.kpi ? (b.kpi as any)[sb.key] ?? (b.you ? brandVal : null) : null
                  const diff = val !== null && brandVal !== null && !b.you ? val - brandVal : null
                  const ahead = diff !== null && diff >= 8
                  const behind = diff !== null && diff <= -8
                  return (
                    <div key={b.name} style={{display:'flex',alignItems:'center',gap:10,marginBottom:7}}>
                      <div style={{width:100,fontSize:11,color:b.you?DARK:BODY_TEXT,fontWeight:b.you?600:400,flexShrink:0}}>
                        {b.name}{b.you && <span style={{color:GOLD,fontSize:9,marginLeft:4}}>you</span>}
                      </div>
                      <div style={{flex:1,height:5,background:'#f0f0f0',borderRadius:3,overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${val !== null ? Math.min((val/maxVal)*100, 100) : 0}%`,background:b.you?GOLD:ahead?RED:behind?GREEN:'#ccc',borderRadius:3}}/>
                      </div>
                      <div style={{width:28,textAlign:'right',fontSize:12,fontWeight:b.you?700:400,color:b.you?DARK:ahead?RED:behind?GREEN:'#aaa'}}>
                        {val !== null ? val : '--'}
                      </div>
                      <div style={{width:56,fontSize:9,color:ahead?RED:behind?GREEN:'#bbb'}}>
                        {ahead ? `+${diff} ahead` : behind ? `${diff} behind` : diff !== null ? 'in range' : ''}
                      </div>
                    </div>
                  )
                })}
                {si < cfg.subBuckets.length - 1 && <div style={{borderBottom:`1px solid ${BORDER}`,marginTop:14}}/>}
              </div>
            )
          })}
          {kpiName === 'buzz' && brandKpi && (brandKpi.positive_keywords || brandKpi.negative_keywords) && (
            <div style={{marginTop:20,display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              {brandKpi.positive_keywords && <WordCloud keywords={brandKpi.positive_keywords} color={GREEN} label="Praising keywords" />}
              {brandKpi.negative_keywords && <WordCloud keywords={brandKpi.negative_keywords} color={RED} label="Attacking keywords" />}
            </div>
          )}
          {intel && (
            <div style={{marginTop:20,padding:'12px 16px',background:'rgba(201,168,76,0.06)',border:`1px solid rgba(201,168,76,0.25)`,borderRadius:8,borderLeft:`3px solid ${GOLD}`}}>
              <div style={{fontSize:9,fontWeight:700,color:GOLD,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:5}}>Intelligence signal</div>
              <div style={{fontSize:12,color:DARK,lineHeight:1.65}}>{intel}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Eye Theme Modal ────────────────────────────────────────────────────────────
function EyeThemeModal({ theme, themeData, competitorThemes, onClose, benchmark }: {
  theme: string
  themeData: CxThemeScore
  competitorThemes: CompetitorThemes[]
  onClose: () => void
  benchmark: number
}) {
  const color = npsColor(themeData.nps_score, benchmark)
  const pos = themeData.positive_signal_count ?? 0
  const neg = themeData.negative_signal_count ?? 0
  const total = pos + neg
  const posPct = total > 0 ? Math.round(pos/total*100) : 0
  const intel = THEME_INTELLIGENCE[theme]?.(themeData, benchmark) ?? ''

  const allBrands = [
    { name: 'Your brand', score: themeData.nps_score, you: true },
    ...competitorThemes.map(c => ({
      name: c.name,
      score: c.themes.find(t => t.theme === theme)?.nps_score ?? null,
      you: false,
    }))
  ]
  const maxAbs = Math.max(...allBrands.map(b => Math.abs(b.score ?? 0)), 60)

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
      <div onClick={e => e.stopPropagation()} style={{background:WHITE,borderRadius:16,width:'100%',maxWidth:580,maxHeight:'85vh',overflowY:'auto',boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}}>
        <div style={{borderTop:`3px solid ${color}`,borderRadius:'16px 16px 0 0'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 24px',borderBottom:`1px solid ${BORDER}`}}>
            <div style={{fontSize:9,fontWeight:700,color:GOLD,textTransform:'uppercase',letterSpacing:'0.15em'}}>{theme}</div>
            <button onClick={onClose} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'#aaa',padding:'4px 8px'}}>×</button>
          </div>
        </div>

        <div style={{padding:'20px 24px'}}>
          {/* Score cards */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:20}}>
            {[
              {label:'Theme score', val: themeData.nps_score !== null ? (themeData.nps_score > 0 ? `+${themeData.nps_score}` : String(themeData.nps_score)) : '--', color},
              {label:'Benchmark', val: String(benchmark), color:'#aaa'},
              {label:'Signals', val: String(themeData.signal_count ?? '--'), color:DARK},
              {label:'Drop-off', val: themeData.dropout_rate !== null ? `${themeData.dropout_rate}%` : '--', color: (themeData.dropout_rate ?? 0) > 30 ? RED : GREEN},
            ].map(f => (
              <div key={f.label} style={{background:'#f9f9f9',borderRadius:8,padding:'10px',textAlign:'center'}}>
                <div style={{fontSize:8,color:'#aaa',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:4}}>{f.label}</div>
                <div style={{fontSize:20,fontWeight:600,color:f.color}}>{f.val}</div>
              </div>
            ))}
          </div>

          {/* Brand vs competition bars */}
          {allBrands.length > 1 && (
            <div style={{marginBottom:16}}>
              <div style={{fontSize:9,fontWeight:600,color:'#aaa',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:10}}>Brand vs competition — {theme} score</div>
              {allBrands.map(b => {
                const val = b.score
                const diff = !b.you && val !== null && themeData.nps_score !== null ? val - themeData.nps_score : null
                const ahead = diff !== null && diff >= 8
                const behind = diff !== null && diff <= -8
                const barColor = b.you ? GOLD : ahead ? RED : behind ? GREEN : '#ccc'
                const widthPct = val !== null ? Math.round((Math.abs(val) / (maxAbs * 2)) * 100) : 0
                const leftPct = val !== null && val >= 0 ? 50 : val !== null ? Math.round((val + maxAbs) / (maxAbs * 2) * 100) : 50
                return (
                  <div key={b.name} style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                    <div style={{width:90,fontSize:11,color:b.you?DARK:BODY_TEXT,fontWeight:b.you?600:400,flexShrink:0}}>
                      {b.name}{b.you && <span style={{color:GOLD,fontSize:9,marginLeft:4}}>you</span>}
                    </div>
                    <div style={{flex:1,height:6,background:'#f0f0f0',borderRadius:3,overflow:'hidden',position:'relative'}}>
                      <div style={{position:'absolute',left:'50%',top:0,width:1,height:'100%',background:'#ddd'}}/>
                      <div style={{position:'absolute',left:`${leftPct}%`,width:`${widthPct}%`,height:'100%',background:barColor,borderRadius:3}}/>
                    </div>
                    <div style={{width:32,textAlign:'right',fontSize:12,fontWeight:b.you?700:400,color:barColor}}>
                      {val !== null ? (val > 0 ? `+${val}` : String(val)) : '--'}
                    </div>
                    <div style={{width:56,fontSize:9,color:ahead?RED:behind?GREEN:'#bbb'}}>
                      {ahead ? `+${diff} ahead` : behind ? `${diff} behind` : diff !== null ? 'in range' : ''}
                    </div>
                  </div>
                )
              })}
              <div style={{display:'flex',gap:16,fontSize:9,color:'#aaa',marginTop:6}}>
                <span style={{color:RED}}>Red — competitor leads</span>
                <span style={{color:GREEN}}>Green — you lead</span>
                <span>MMD: 8 pts</span>
              </div>
            </div>
          )}

          {/* Signal breakdown */}
          {total > 0 && (
            <div style={{marginBottom:16}}>
              <div style={{fontSize:9,fontWeight:600,color:'#aaa',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>Signal breakdown</div>
              <div style={{display:'flex',gap:16,marginBottom:6}}>
                <span style={{fontSize:11,color:GREEN}}>{pos} positive ({posPct}%)</span>
                <span style={{fontSize:11,color:RED}}>{neg} negative ({100-posPct}%)</span>
              </div>
              <div style={{height:6,background:'#f0f0f0',borderRadius:3,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${posPct}%`,background:GREEN,borderRadius:3}}/>
              </div>
            </div>
          )}

          {/* Top concern */}
          {themeData.top_concern && (
            <div style={{marginBottom:16,padding:'10px 14px',background:'rgba(232,120,120,0.05)',border:'1px solid rgba(232,120,120,0.2)',borderRadius:8,borderLeft:`2px solid ${RED}`}}>
              <div style={{fontSize:9,fontWeight:600,color:RED,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4}}>Top concern</div>
              <div style={{fontSize:12,color:DARK}}>{themeData.top_concern}</div>
            </div>
          )}

          {/* Keywords */}
          {(themeData.positive_keywords || themeData.negative_keywords) && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
              {themeData.positive_keywords && <WordCloud keywords={themeData.positive_keywords} color={GREEN} label="Positive keywords" />}
              {themeData.negative_keywords && <WordCloud keywords={themeData.negative_keywords} color={RED} label="Negative keywords" />}
            </div>
          )}

          {/* Intelligence signal */}
          {intel && (
            <div style={{padding:'12px 14px',background:'rgba(31,74,47,0.06)',border:'1px solid rgba(31,74,47,0.2)',borderRadius:8,borderLeft:`3px solid ${MID_GREEN}`}}>
              <div style={{fontSize:9,fontWeight:600,color:MID_GREEN,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4}}>Intelligence signal</div>
              <div style={{fontSize:12,color:DARK,lineHeight:1.65}}>{intel}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Eye Overall NPS Modal ──────────────────────────────────────────────────────
function EyeOverallModal({ audit, themes, onClose }: {
  audit: CxAudit
  themes: CxThemeScore[]
  onClose: () => void
}) {
  const color = npsColor(audit.overall_cx_nps, audit.benchmark)
  const npsStr = (v: number | null) => v === null ? '--' : v > 0 ? `+${v}` : String(v)

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
      <div onClick={e => e.stopPropagation()} style={{background:WHITE,borderRadius:16,width:'100%',maxWidth:600,maxHeight:'85vh',overflowY:'auto',boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 24px',borderBottom:`1px solid ${BORDER}`,borderTop:`3px solid ${MID_GREEN}`,borderRadius:'16px 16px 0 0'}}>
          <div>
            <div style={{fontSize:9,fontWeight:700,color:GOLD,textTransform:'uppercase',letterSpacing:'0.15em',marginBottom:3}}>Overall CX Score</div>
            <div style={{fontSize:12,color:BODY_TEXT}}>Brand customer experience vs benchmark</div>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'#aaa',padding:'4px 8px'}}>×</button>
        </div>
        <div style={{padding:'20px 24px'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:20}}>
            {[
              {label:'Overall CX Score', val:npsStr(audit.overall_cx_nps), color},
              {label:'Benchmark', val:String(audit.benchmark), color:'#aaa'},
              {label:'Total signals', val:audit.total_signals?.toLocaleString() ?? '--', color:DARK},
            ].map(f => (
              <div key={f.label} style={{background:'#f9f9f9',borderRadius:8,padding:'12px',textAlign:'center'}}>
                <div style={{fontSize:8,color:'#aaa',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:4}}>{f.label}</div>
                <div style={{fontSize:24,fontWeight:600,color:f.color}}>{f.val}</div>
              </div>
            ))}
          </div>

          <div style={{fontSize:9,fontWeight:600,color:'#aaa',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:10}}>Score by theme</div>
          <div style={{background:'#f9f9f9',borderRadius:8,overflow:'hidden',marginBottom:16}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead>
                <tr style={{background:MID_GREEN}}>
                  <th style={{textAlign:'left',padding:'8px 14px',color:WHITE,fontSize:10,fontWeight:600}}>Theme</th>
                  <th style={{textAlign:'center',padding:'8px 10px',color:WHITE,fontSize:10,fontWeight:600}}>Score</th>
                  <th style={{textAlign:'center',padding:'8px 10px',color:WHITE,fontSize:10,fontWeight:600}}>Benchmark</th>
                  <th style={{textAlign:'center',padding:'8px 10px',color:WHITE,fontSize:10,fontWeight:600}}>Gap</th>
                  <th style={{textAlign:'center',padding:'8px 10px',color:WHITE,fontSize:10,fontWeight:600}}>Signals</th>
                </tr>
              </thead>
              <tbody>
                {themes.map((t, i) => {
                  const c = npsColor(t.nps_score, audit.benchmark)
                  const gap = t.nps_score !== null ? t.nps_score - audit.benchmark : null
                  return (
                    <tr key={t.theme} style={{borderTop:'1px solid #e8e8e8',background:i%2===0?WHITE:'#fafafa'}}>
                      <td style={{padding:'8px 14px',color:DARK,fontWeight:500}}>{t.theme}</td>
                      <td style={{padding:'8px 10px',textAlign:'center',fontWeight:700,color:c}}>{t.nps_score !== null ? (t.nps_score > 0 ? `+${t.nps_score}` : t.nps_score) : '--'}</td>
                      <td style={{padding:'8px 10px',textAlign:'center',color:'#aaa'}}>{audit.benchmark}</td>
                      <td style={{padding:'8px 10px',textAlign:'center',fontWeight:600,color:gap !== null ? (gap >= 0 ? GREEN : RED) : '#aaa'}}>{gap !== null ? (gap > 0 ? `+${gap}` : String(gap)) : '--'}</td>
                      <td style={{padding:'8px 10px',textAlign:'center',color:BODY_TEXT}}>{t.signal_count ?? '--'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div style={{padding:'12px 14px',background:'rgba(31,74,47,0.06)',border:'1px solid rgba(31,74,47,0.2)',borderRadius:8,borderLeft:`3px solid ${MID_GREEN}`}}>
            <div style={{fontSize:9,fontWeight:600,color:MID_GREEN,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4}}>Intelligence signal</div>
            <div style={{fontSize:12,color:DARK,lineHeight:1.65}}>
              {themes.sort((a,b) => (a.nps_score ?? 0) - (b.nps_score ?? 0))[0]?.theme} is the primary drag on overall CX score.
              {' '}Resolving the top negative theme could shift the overall score by 10-20 points in the next audit cycle.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main dashboard ─────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [brand, setBrand] = useState<any>(null)
  const [brandKpis, setBrandKpis] = useState<KpiSnapshot[]>([])
  const [competitorKpis, setCompetitorKpis] = useState<KpiSnapshot[]>([])
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('current')
  const [activeProduct, setActiveProduct] = useState<ActiveProduct>('iq')
  const [eyePaid, setEyePaid] = useState(false)
  const [cxAudit, setCxAudit] = useState<CxAudit | null>(null)
  const [cxThemes, setCxThemes] = useState<CxThemeScore[]>([])
  const [cxVerdict, setCxVerdict] = useState<CxVerdict | null>(null)
  const [competitorThemes, setCompetitorThemes] = useState<CompetitorThemes[]>([])
  const [activeModal, setActiveModal] = useState<KpiName | null>(null)
  const [activeThemeModal, setActiveThemeModal] = useState<string | null>(null)
  const [showOverallModal, setShowOverallModal] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const fetchKpis = async (brandId: string, window: TimeWindow) => {
    const { data } = await supabase
      .from('kpi_snapshots')
      .select('kpi_name,score,zone,movement,confidence_level,source,competitor_id,sub_bucket_searched,sub_bucket_found,sub_bucket_shown,sub_bucket_comparing,sub_bucket_trialling,sub_bucket_interested,sub_bucket_repeat,sub_bucket_switchers,sub_bucket_lost,sub_bucket_praising,sub_bucket_questioning,sub_bucket_attacking,sources_count,last_updated,positive_keywords,negative_keywords')
      .eq('brand_id', brandId).eq('snapshot_type', 'brand_level')
      .eq('checkpoint', window).eq('status', 'published')
      .order('created_at', { ascending: false })
    if (data) {
      setBrandKpis(data.filter((r: any) => !r.competitor_id))
      setCompetitorKpis(data.filter((r: any) => !!r.competitor_id))
    }
  }

  const fetchCompetitors = async (brandId: string) => {
    const { data } = await supabase.from('competitors').select('id,name').eq('brand_id', brandId).order('name')
    if (data) setCompetitors(data)
  }

  const fetchVerdict = async (brandId: string) => {
    const { data } = await supabase.from('verdicts').select('narrative,recommended_action,recommended_action_window,risk_flags,top_insights,confidence_level,created_at')
      .eq('brand_id', brandId).eq('verdict_type', 'brand_level').eq('status', 'ready')
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (data) setVerdict(data)
  }

  const fetchEyeData = async (brandId: string, userId: string, comps: Competitor[]) => {
    const { data: order } = await supabase.from('orders').select('id').eq('user_id', userId).eq('product', 'eye').eq('status', 'paid').maybeSingle()
    if (order) {
      setEyePaid(true)
      const { data: audit } = await supabase.from('cx_audits').select('id,audit_date,overall_cx_nps,total_signals,benchmark,category_type,status,audit_type')
        .eq('brand_id', brandId).eq('status', 'published').is('competitor_id', null)
        .order('created_at', { ascending: false }).limit(1).maybeSingle()
      if (audit) {
        setCxAudit(audit)
        const { data: themes } = await supabase.from('cx_theme_scores')
          .select('theme,nps_score,signal_count,dropout_rate,top_concern,sentiment,confidence,positive_keywords,negative_keywords,positive_signal_count,negative_signal_count')
          .eq('audit_id', audit.id).is('competitor_id', null)
        if (themes) setCxThemes(themes)
        const { data: cv } = await supabase.from('cx_verdicts').select('narrative,top_priorities,recommended_actions,mystery_audit_triggered').eq('audit_id', audit.id).maybeSingle()
        if (cv) setCxVerdict(cv)

        // Fetch competitor Eye theme scores
        const compThemeData: CompetitorThemes[] = []
        for (const comp of comps) {
          const { data: compAudit } = await supabase.from('cx_audits').select('id')
            .eq('brand_id', brandId).eq('competitor_id', comp.id).eq('status', 'published')
            .order('created_at', { ascending: false }).limit(1).maybeSingle()
          if (compAudit) {
            const { data: compThemes } = await supabase.from('cx_theme_scores')
              .select('theme,nps_score,signal_count,dropout_rate,sentiment,top_concern,positive_keywords,negative_keywords,positive_signal_count,negative_signal_count')
              .eq('audit_id', compAudit.id).eq('competitor_id', comp.id)
            if (compThemes && compThemes.length > 0) {
              compThemeData.push({ id: comp.id, name: comp.name, themes: compThemes as CxThemeScore[] })
            }
          }
        }
        setCompetitorThemes(compThemeData)
      }
    }
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      const { data: brands } = await supabase.from('brands').select('*').eq('user_id', user.id).maybeSingle()
      if (!brands) { router.push('/brand-setup'); return }
      setBrand(brands)
      const { data: compsData } = await supabase.from('competitors').select('id,name').eq('brand_id', brands.id).order('name')
      const comps = compsData ?? []
      setCompetitors(comps)
      await Promise.all([
        fetchKpis(brands.id, 'current'),
        fetchVerdict(brands.id),
        fetchEyeData(brands.id, user.id, comps),
      ])
      setLoading(false)
    }
    init()
  }, [])

  const getBrandKpi = (name: KpiName) => brandKpis.find(k => k.kpi_name === name)
  const getTheme = (theme: string) => cxThemes.find(t => t.theme === theme)

  const buzz = getBrandKpi('buzz')
  const totalSources = brandKpis.reduce((max, k) => Math.max(max, k.sources_count || 0), 0)
  const lastUpdated = brandKpis[0]?.last_updated

  const eyePosKeywords = [...new Set(cxThemes.flatMap(t => (t.positive_keywords || '').split(',').map(w => w.trim()).filter(Boolean)))].slice(0,15).join(', ')
  const eyeNegKeywords = [...new Set(cxThemes.flatMap(t => (t.negative_keywords || '').split(',').map(w => w.trim()).filter(Boolean)))].slice(0,15).join(', ')

  const totalNeg = cxThemes.reduce((s, t) => s + (t.negative_signal_count || 0), 0)
  const totalPos = cxThemes.reduce((s, t) => s + (t.positive_signal_count || 0), 0)
  const totalSig = totalPos + totalNeg

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:DEEP}}>
      <div style={{color:GOLD}}>Loading...</div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:WHITE,display:'flex'}}>

      {/* Modals */}
      {activeModal && (
        <KpiModal
          kpiName={activeModal}
          brandKpi={getBrandKpi(activeModal)}
          competitorKpis={competitorKpis.filter(k => k.kpi_name === activeModal)}
          competitors={competitors}
          brandName={brand?.brand_name}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeThemeModal && cxAudit && getTheme(activeThemeModal) && (
        <EyeThemeModal
          theme={activeThemeModal}
          themeData={getTheme(activeThemeModal)!}
          competitorThemes={competitorThemes}
          benchmark={cxAudit.benchmark}
          onClose={() => setActiveThemeModal(null)}
        />
      )}
      {showOverallModal && cxAudit && (
        <EyeOverallModal audit={cxAudit} themes={cxThemes} onClose={() => setShowOverallModal(false)} />
      )}

      {/* SIDEBAR */}
      <div style={{width:220,flexShrink:0,background:DEEP,display:'flex',flexDirection:'column',position:'fixed',top:0,left:0,bottom:0,zIndex:100}}>
        <div style={{padding:'18px 16px 14px',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <svg width="18" height="14" viewBox="0 0 56 44" fill="none"><path d="M4 36L12 14L22 26L28 6L34 26L44 14L52 36H4Z" fill="#C9A84C"/><rect x="4" y="36" width="48" height="6" rx="2" fill="#A07830"/></svg>
            <div>
              <div style={{fontFamily:'Georgia,serif',fontSize:11,fontWeight:700,color:CREAM,letterSpacing:'0.1em'}}>KING SOLOMON</div>
              <div style={{fontSize:9,color:GOLD}}>Consumer intelligence</div>
            </div>
          </div>
        </div>
        <div style={{padding:'12px 0',flex:1}}>
          <div style={{fontSize:9,fontWeight:600,color:'rgba(197,194,186,0.4)',padding:'6px 16px 3px',textTransform:'uppercase',letterSpacing:'0.1em'}}>Solomon&apos;s IQ</div>
          <div onClick={() => setActiveProduct('iq')} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 16px',fontSize:12,color:activeProduct==='iq'?CREAM:CREAM_DIM,borderLeft:activeProduct==='iq'?`2px solid ${GOLD}`:'2px solid transparent',background:activeProduct==='iq'?'rgba(201,168,76,0.08)':'transparent',cursor:'pointer'}}>
            <span>📊</span> Dashboard
          </div>
          <div style={{fontSize:9,fontWeight:600,color:'rgba(197,194,186,0.4)',padding:'14px 16px 3px',textTransform:'uppercase',letterSpacing:'0.1em'}}>Solomon&apos;s Eye</div>
          <div onClick={() => setActiveProduct('eye')} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 16px',fontSize:12,color:activeProduct==='eye'?CREAM:CREAM_DIM,borderLeft:activeProduct==='eye'?`2px solid ${GOLD}`:'2px solid transparent',background:activeProduct==='eye'?'rgba(201,168,76,0.08)':'transparent',cursor:'pointer'}}>
            <span>👁</span> CX Audit
          </div>
          <div style={{fontSize:9,fontWeight:600,color:'rgba(197,194,186,0.4)',padding:'14px 16px 3px',textTransform:'uppercase',letterSpacing:'0.1em'}}>Account</div>
          <a href="/brand-setup" style={{display:'flex',alignItems:'center',gap:8,padding:'8px 16px',fontSize:12,color:CREAM_DIM,textDecoration:'none',borderLeft:'2px solid transparent'}}><span>⚙</span> Brand settings</a>
          <a href="/pricing" style={{display:'flex',alignItems:'center',gap:8,padding:'8px 16px',fontSize:12,color:CREAM_DIM,textDecoration:'none',borderLeft:'2px solid transparent'}}><span>↑</span> Upgrade plan</a>
        </div>
        <div style={{padding:'12px 16px',borderTop:'1px solid rgba(255,255,255,0.07)'}}>
          <div style={{fontSize:11,color:'rgba(197,194,186,0.5)',marginBottom:8,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.email}</div>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/login') }} style={{width:'100%',padding:'7px',borderRadius:6,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',color:CREAM_DIM,fontSize:11,cursor:'pointer',textAlign:'left',fontFamily:'Inter,sans-serif'}}>Sign out</button>
        </div>
      </div>

      {/* MAIN */}
      <div style={{flex:1,marginLeft:220,display:'flex',flexDirection:'column',minHeight:'100vh'}}>

        {/* Nav */}
        <nav style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 32px',borderBottom:`1px solid ${BORDER}`,background:WHITE,position:'sticky',top:0,zIndex:50}}>
          <div>
            <div style={{color:DARK,fontFamily:'Georgia,serif',fontWeight:700,fontSize:15}}>{brand?.brand_name}</div>
            <div style={{color:GOLD,fontSize:11}}>{activeProduct === 'iq' ? "Solomon's IQ" : "Solomon's Eye"}</div>
          </div>
          {activeProduct === 'iq' && (
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{display:'flex',background:'#f5f5f5',border:`1px solid ${BORDER}`,borderRadius:8,overflow:'hidden'}}>
                {TIME_WINDOWS.map(tw => (
                  <button key={tw.key} onClick={async () => { setTimeWindow(tw.key); setRefreshing(true); await fetchKpis(brand.id, tw.key); setRefreshing(false) }}
                    style={{padding:'6px 14px',border:'none',cursor:'pointer',fontSize:12,fontWeight:timeWindow===tw.key?600:400,background:timeWindow===tw.key?MID_GREEN:'transparent',color:timeWindow===tw.key?CREAM:BODY_TEXT,fontFamily:'Inter,sans-serif'}}>
                    {tw.label}
                  </button>
                ))}
              </div>
              <button onClick={async () => { setRefreshing(true); await fetchKpis(brand.id, timeWindow); setRefreshing(false) }} disabled={refreshing}
                style={{padding:'7px 12px',borderRadius:7,background:'#f5f5f5',border:`1px solid ${BORDER}`,color:MID_GREEN,fontSize:12,cursor:'pointer',fontWeight:600,fontFamily:'Inter,sans-serif'}}>
                {refreshing ? '...' : '↻'}
              </button>
            </div>
          )}
        </nav>

        {/* IQ VIEW */}
        {activeProduct === 'iq' && (
          <div style={{maxWidth:1100,margin:'0 auto',padding:'28px 32px',width:'100%'}}>

            <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 14px',background:'#f9f9f9',border:`1px solid ${BORDER}`,borderRadius:8,marginBottom:16,fontSize:12,color:BODY_TEXT}}>
              <div style={{width:7,height:7,borderRadius:'50%',background:GREEN,flexShrink:0}}/>
              <span>
                {totalSources > 0 ? `Signals from ${totalSources} sources` : 'Signals being collected'}
                {lastUpdated ? ` · Last updated ${new Date(lastUpdated).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}` : ''}
                {refreshing && <span style={{color:GOLD,marginLeft:8}}>Updating...</span>}
              </span>
            </div>

            {KPI_NAMES.map(kpiName => {
              const kpi = getBrandKpi(kpiName)
              if (!kpi) return null
              const intel = KPI_CONFIG[kpiName].intelligence(kpi, competitorKpis.filter(k => k.kpi_name === kpiName), competitors)
              if (!intel) return null
              return (
                <div key={kpiName} style={{display:'flex',alignItems:'flex-start',gap:8,padding:'10px 14px',background:'rgba(201,168,76,0.06)',border:'1px solid rgba(201,168,76,0.25)',borderRadius:8,marginBottom:10,fontSize:12,color:DARK}}>
                  <span style={{color:GOLD,flexShrink:0,marginTop:1}}>⚡</span>
                  <span><strong style={{color:GOLD,textTransform:'uppercase',fontSize:10,letterSpacing:'0.1em'}}>{kpiName}</strong> — {intel}</span>
                </div>
              )
            })}

            <div style={{fontSize:10,fontWeight:600,color:'#aaa',letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:12,marginTop:4}}>
              Brand health — {timeWindow === 'current' ? 'Current' : `Last ${timeWindow}`} · Click any card to deep dive
            </div>

            {brandKpis.length === 0 ? (
              <div style={{background:'#f9f9f9',border:`1px solid ${BORDER}`,borderRadius:12,padding:'40px',textAlign:'center',marginBottom:24}}>
                <div style={{fontSize:24,marginBottom:12}}>📊</div>
                <p style={{fontSize:15,fontWeight:600,color:DARK,marginBottom:8}}>Your data is being prepared</p>
                <p style={{fontSize:14,color:BODY_TEXT,lineHeight:1.75}}>We are collecting and verifying your brand signals. Your dashboard will populate once your first report is ready.</p>
              </div>
            ) : (
              <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:24}}>
                {KPI_NAMES.map(kpiName => {
                  const kpi = getBrandKpi(kpiName)
                  const cfg = KPI_CONFIG[kpiName]
                  return (
                    <div key={kpiName} onClick={() => setActiveModal(kpiName)}
                      style={{padding:'14px 12px',borderRadius:12,background:WHITE,border:`1px solid ${BORDER}`,borderTop:`3px solid ${kpi ? ZONE_COLOR[kpi.zone] : BORDER}`,boxShadow:'0 1px 4px rgba(0,0,0,0.04)',cursor:'pointer'}}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = GOLD)}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}>
                      <div style={{fontSize:9,fontWeight:700,color:GOLD,letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:6}}>{cfg.label}</div>
                      <div style={{display:'flex',flexDirection:'column',gap:5}}>
                        {cfg.subBuckets.map(sb => {
                          const val = kpi ? (kpi as any)[sb.key] ?? null : null
                          const color = val === null ? '#ccc' : val >= 60 ? GREEN : val >= 40 ? AMBER : RED
                          return (
                            <div key={sb.key} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:6}}>
                              <div style={{display:'flex',alignItems:'center',gap:5}}>
                                <div style={{width:5,height:5,borderRadius:'50%',background:color,flexShrink:0}}/>
                                <span style={{fontSize:10,color:sb.diagnostic?'#aaa':BODY_TEXT}}>{sb.label}{sb.diagnostic && ' *'}</span>
                              </div>
                              <div style={{display:'flex',alignItems:'center',gap:4}}>
                                <div style={{width:40,height:3,background:'#f0f0f0',borderRadius:2,overflow:'hidden'}}>
                                  <div style={{height:'100%',width:`${val ?? 0}%`,background:color,borderRadius:2}}/>
                                </div>
                                <span style={{fontSize:11,fontWeight:600,color,minWidth:20,textAlign:'right'}}>{val ?? '--'}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      <div style={{marginTop:8,paddingTop:8,borderTop:`1px solid ${BORDER}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <span style={{fontSize:9,color:'#bbb'}}>tap to deep dive</span>
                        {kpi?.movement !== null && kpi?.movement !== undefined && (
                          <span style={{fontSize:10,color:kpi.movement > 0 ? GREEN : kpi.movement < 0 ? RED : AMBER}}>
                            {kpi.movement > 0 ? `↑ +${kpi.movement}` : kpi.movement < 0 ? `↓ ${kpi.movement}` : '→'} pts
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {buzz && (buzz.positive_keywords || buzz.negative_keywords) && (
              <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'18px 22px',marginBottom:20,boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
                <div style={{fontSize:10,fontWeight:600,color:'#aaa',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Buzz — consumer signal keywords</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                  {buzz.positive_keywords && <WordCloud keywords={buzz.positive_keywords} color={GREEN} label="What consumers say positively" />}
                  {buzz.negative_keywords && <WordCloud keywords={buzz.negative_keywords} color={RED} label="What consumers say negatively" />}
                </div>
              </div>
            )}

            {brand?.iq_report_ready && (
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 20px',background:'rgba(201,168,76,0.06)',border:'1px solid rgba(201,168,76,0.25)',borderRadius:10,marginBottom:20}}>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:DARK,marginBottom:2}}>Your IQ report is ready</div>
                  <div style={{fontSize:12,color:BODY_TEXT}}>Download your full brand intelligence report as a PDF.</div>
                </div>
                <a href="/report/iq" target="_blank" style={{padding:'10px 20px',background:GOLD,color:DEEP,borderRadius:8,fontSize:13,fontWeight:600,textDecoration:'none',whiteSpace:'nowrap'}}>⬇ Download IQ Report</a>
              </div>
            )}

            {verdict ? (
              <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'24px 28px',boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                  <span style={{fontSize:10,fontWeight:700,color:GOLD,textTransform:'uppercase',letterSpacing:'0.1em'}}>⭐ Solomon&apos;s Verdict</span>
                  <span style={{fontSize:11,color:'#aaa'}}>{new Date(verdict.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span>
                </div>
                <p style={{fontFamily:'Georgia,serif',fontSize:15,color:DARK,lineHeight:1.75,fontStyle:'italic',marginBottom:16}}>&ldquo;{verdict.narrative}&rdquo;</p>
                {verdict.recommended_action && (
                  <div style={{paddingTop:14,borderTop:`1px solid ${BORDER}`}}>
                    <p style={{fontSize:10,fontWeight:600,color:GOLD,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>Recommended action</p>
                    <p style={{fontSize:13,color:DARK,lineHeight:1.5}}>{verdict.recommended_action}</p>
                  </div>
                )}
              </div>
            ) : (
              <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'24px 28px',textAlign:'center',boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
                <p style={{fontSize:10,fontWeight:700,color:GOLD,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:10}}>⭐ Solomon&apos;s Verdict</p>
                <p style={{fontSize:14,color:BODY_TEXT,lineHeight:1.7}}>Your verdict will appear here once enough brand signal data has been collected.</p>
              </div>
            )}
          </div>
        )}

        {/* EYE VIEW */}
        {activeProduct === 'eye' && (
          <div style={{maxWidth:1100,margin:'0 auto',padding:'28px 32px',width:'100%'}}>

            {!eyePaid && (
              <div style={{textAlign:'center',padding:'80px 24px'}}>
                <div style={{fontSize:36,marginBottom:16}}>👁</div>
                <h2 style={{fontFamily:'Georgia,serif',fontSize:25,fontWeight:700,color:DARK,marginBottom:12}}>Solomon&apos;s Eye</h2>
                <p style={{fontSize:15,color:BODY_TEXT,maxWidth:440,margin:'0 auto 28px',lineHeight:1.75}}>CX audit not active. Purchase Solomon&apos;s Eye to see your full customer experience audit.</p>
                <a href="/pricing" style={{display:'inline-block',background:GOLD,color:DEEP,fontSize:14,fontWeight:600,padding:'12px 28px',borderRadius:8,textDecoration:'none'}}>Purchase Solomon&apos;s Eye →</a>
              </div>
            )}

            {eyePaid && !cxAudit && (
              <div style={{textAlign:'center',padding:'80px 24px'}}>
                <div style={{fontSize:36,marginBottom:16}}>👁</div>
                <h2 style={{fontFamily:'Georgia,serif',fontSize:25,fontWeight:700,color:DARK,marginBottom:12}}>Your CX audit is being prepared</h2>
                <p style={{fontSize:15,color:BODY_TEXT,maxWidth:440,margin:'0 auto 24px',lineHeight:1.75}}>We are collecting and verifying your customer experience signals.</p>
              </div>
            )}

            {eyePaid && cxAudit && (
              <>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:20}}>
                  <div onClick={() => setShowOverallModal(true)} style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'16px 20px',cursor:'pointer',boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = MID_GREEN)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}>
                    <div style={{fontSize:9,fontWeight:600,color:MID_GREEN,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4}}>Overall CX Score <span style={{color:'#aaa',fontWeight:400}}>— tap to compare</span></div>
                    <div style={{fontFamily:'Georgia,serif',fontSize:36,fontWeight:700,color:npsColor(cxAudit.overall_cx_nps,cxAudit.benchmark),lineHeight:1,marginBottom:4}}>
                      {cxAudit.overall_cx_nps !== null ? (cxAudit.overall_cx_nps > 0 ? `+${cxAudit.overall_cx_nps}` : String(cxAudit.overall_cx_nps)) : '--'}
                    </div>
                    <div style={{fontSize:11,color:'#aaa'}}>vs benchmark {cxAudit.benchmark}</div>
                  </div>
                  <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'16px 20px',boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
                    <div style={{fontSize:9,fontWeight:600,color:'#aaa',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4}}>Total signals</div>
                    <div style={{fontFamily:'Georgia,serif',fontSize:36,fontWeight:700,color:DARK,lineHeight:1,marginBottom:4}}>{cxAudit.total_signals?.toLocaleString() ?? '--'}</div>
                    <div style={{fontSize:11,color:'#aaa'}}>across 5 CX themes</div>
                  </div>
                  <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'16px 20px',boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
                    <div style={{fontSize:9,fontWeight:600,color:'#aaa',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4}}>Negative signals</div>
                    <div style={{fontFamily:'Georgia,serif',fontSize:36,fontWeight:700,color:RED,lineHeight:1,marginBottom:4}}>{totalNeg.toLocaleString()}</div>
                    <div style={{fontSize:11,color:'#aaa'}}>{totalSig > 0 ? `${Math.round(totalNeg/totalSig*100)}% of total` : 'No signals yet'}</div>
                  </div>
                </div>

                {totalSig > 0 && (
                  <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'16px 20px',marginBottom:20,boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
                    <div style={{fontSize:9,fontWeight:600,color:'#aaa',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:10}}>Signal distribution — negative by theme</div>
                    <div style={{display:'flex',gap:16,marginBottom:8}}>
                      <span style={{fontSize:11,color:GREEN}}>✓ {totalPos} positive ({Math.round(totalPos/totalSig*100)}%)</span>
                      <span style={{fontSize:11,color:RED}}>✗ {totalNeg} negative ({Math.round(totalNeg/totalSig*100)}%)</span>
                    </div>
                    <div style={{height:5,background:'#f0f0f0',borderRadius:3,overflow:'hidden',marginBottom:12}}>
                      <div style={{height:'100%',width:`${Math.round(totalPos/totalSig*100)}%`,background:GREEN,borderRadius:3}}/>
                    </div>
                    {[...cxThemes].sort((a,b) => (b.negative_signal_count||0)-(a.negative_signal_count||0)).filter(t => (t.negative_signal_count||0) > 0).map(t => {
                      const pct = totalNeg > 0 ? Math.round((t.negative_signal_count||0)/totalNeg*100) : 0
                      return (
                        <div key={t.theme} style={{marginBottom:6}}>
                          <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                            <span style={{fontSize:11,color:BODY_TEXT}}>{t.theme}</span>
                            <span style={{fontSize:11,color:RED,fontWeight:500}}>{pct}% ({t.negative_signal_count} signals)</span>
                          </div>
                          <div style={{height:4,background:'#f0f0f0',borderRadius:2,overflow:'hidden'}}>
                            <div style={{height:'100%',width:`${pct}%`,background:RED,borderRadius:2}}/>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                <div style={{fontSize:10,fontWeight:600,color:'#aaa',textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:10}}>CX themes — tap to deep dive</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:20}}>
                  {CX_THEMES.map(theme => {
                    const t = getTheme(theme)
                    const color = t ? npsColor(t.nps_score, cxAudit.benchmark) : '#ccc'
                    const pos = t?.positive_signal_count ?? 0
                    const neg = t?.negative_signal_count ?? 0
                    const total = pos + neg
                    return (
                      <div key={theme} onClick={() => t && setActiveThemeModal(theme)}
                        style={{padding:'14px 12px',borderRadius:12,background:WHITE,border:`1px solid ${BORDER}`,borderTop:`3px solid ${color}`,boxShadow:'0 1px 4px rgba(0,0,0,0.04)',cursor:'pointer',textAlign:'center'}}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = color)}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}>
                        <div style={{fontSize:8,fontWeight:700,color:GOLD,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>{theme}</div>
                        <div style={{fontFamily:'Georgia,serif',fontSize:24,fontWeight:700,color,marginBottom:2}}>
                          {t?.nps_score !== null && t?.nps_score !== undefined ? (t.nps_score > 0 ? `+${t.nps_score}` : String(t.nps_score)) : '--'}
                        </div>
                        <div style={{fontSize:9,color:'#aaa',marginBottom:6}}>Theme score</div>
                        {t && (
                          <>
                            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:4,marginBottom:5}}>
                              <div style={{width:5,height:5,borderRadius:'50%',background:sentimentDot(t.sentiment)}}/>
                              <span style={{fontSize:9,color:BODY_TEXT,textTransform:'capitalize'}}>{t.sentiment}</span>
                            </div>
                            {total > 0 && (
                              <div style={{height:3,background:'#f0f0f0',borderRadius:2,overflow:'hidden',marginBottom:4}}>
                                <div style={{height:'100%',width:`${Math.round(pos/total*100)}%`,background:GREEN,borderRadius:2}}/>
                              </div>
                            )}
                            <div style={{fontSize:8,color:'#bbb'}}>+{pos} / -{neg}</div>
                          </>
                        )}
                        {!t && <div style={{fontSize:9,color:'#bbb'}}>No data yet</div>}
                      </div>
                    )
                  })}
                </div>

                {(eyePosKeywords || eyeNegKeywords) && (
                  <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'18px 22px',marginBottom:20,boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
                    <div style={{fontSize:10,fontWeight:600,color:'#aaa',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Consumer signal keywords — all CX themes</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                      {eyePosKeywords && <WordCloud keywords={eyePosKeywords} color={GREEN} label="What customers love" />}
                      {eyeNegKeywords && <WordCloud keywords={eyeNegKeywords} color={RED} label="What customers complain about" />}
                    </div>
                  </div>
                )}

                {brand?.eye_report_ready && (
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 20px',background:'rgba(31,74,47,0.06)',border:'1px solid rgba(31,74,47,0.25)',borderRadius:10,marginBottom:20}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,color:DARK,marginBottom:2}}>Your Eye report is ready</div>
                      <div style={{fontSize:12,color:BODY_TEXT}}>Download your full CX audit report as a PDF.</div>
                    </div>
                    <a href="/report/eye" target="_blank" style={{padding:'10px 20px',background:MID_GREEN,color:WHITE,borderRadius:8,fontSize:13,fontWeight:600,textDecoration:'none',whiteSpace:'nowrap'}}>⬇ Download Eye Report</a>
                  </div>
                )}

                {cxVerdict?.narrative ? (
                  <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'24px 28px',boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
                    <span style={{fontSize:10,fontWeight:700,color:GOLD,textTransform:'uppercase',letterSpacing:'0.1em'}}>👁 Solomon&apos;s Eye Verdict</span>
                    <p style={{fontFamily:'Georgia,serif',fontSize:15,color:DARK,lineHeight:1.75,fontStyle:'italic',marginTop:12}}>&ldquo;{cxVerdict.narrative}&rdquo;</p>
                  </div>
                ) : (
                  <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'24px 28px',textAlign:'center',boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
                    <p style={{fontSize:10,fontWeight:700,color:GOLD,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:10}}>👁 Solomon&apos;s Eye Verdict</p>
                    <p style={{fontSize:14,color:BODY_TEXT,lineHeight:1.7}}>Your Eye Verdict will appear here once the audit is complete.</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}