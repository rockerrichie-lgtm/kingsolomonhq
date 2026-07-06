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
type CxTheme = typeof CX_THEMES[number]

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
  status?: string
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
}

interface CxVerdict {
  narrative: string | null
  top_priorities: any
  recommended_actions: any
  mystery_audit_triggered: boolean
}

const ZONE_LABEL: Record<string, string> = {
  critical: 'Critical', emerging: 'Emerging', contested: 'Contested',
  established: 'Established', category_defining: 'Category Defining',
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

const KPI_SUB_BUCKETS: Record<KpiName, { key: string; label: string }[]> = {
  awareness: [
    { key: 'sub_bucket_searched', label: 'Searched' },
    { key: 'sub_bucket_found', label: 'Found' },
    { key: 'sub_bucket_shown', label: 'Shown' },
  ],
  consideration: [
    { key: 'sub_bucket_comparing', label: 'Comparing' },
    { key: 'sub_bucket_trialling', label: 'Trialling' },
    { key: 'sub_bucket_interested', label: 'Interested' },
  ],
  usage: [
    { key: 'sub_bucket_repeat', label: 'Repeat' },
    { key: 'sub_bucket_switchers', label: 'Switchers' },
    { key: 'sub_bucket_lost', label: 'Lost' },
  ],
  imagery: [],
  buzz: [
    { key: 'sub_bucket_praising', label: 'Praising' },
    { key: 'sub_bucket_questioning', label: 'Questioning' },
    { key: 'sub_bucket_attacking', label: 'Attacking' },
  ],
}

function movementLabel(m: number | null) {
  if (m === null) return null
  if (m > 0) return { text: `↑ +${m} pts`, color: GREEN }
  if (m < 0) return { text: `↓ ${m} pts`, color: RED }
  return { text: '→ Stable', color: AMBER }
}

function scoreDisplay(kpiName: KpiName, score: number) {
  return kpiName === 'buzz' && score > 0 ? `+${score}` : String(score)
}

function subBucketColor(val: number | null | undefined): string {
  if (val === null || val === undefined) return '#ccc'
  if (val >= 60) return GREEN
  if (val >= 40) return AMBER
  return RED
}

function npsColor(score: number | null, benchmark: number): string {
  if (score === null) return '#ccc'
  if (score >= benchmark) return GREEN
  if (score >= benchmark - 15) return AMBER
  return RED
}

function sentimentDot(sentiment: string): string {
  if (sentiment === 'positive') return GREEN
  if (sentiment === 'negative') return RED
  return AMBER
}

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
  const router = useRouter()
  const supabase = createClient()

  const fetchKpis = async (brandId: string, window: TimeWindow) => {
    const { data } = await supabase
      .from('kpi_snapshots')
      .select('kpi_name, score, zone, movement, confidence_level, source, competitor_id, sub_bucket_searched, sub_bucket_found, sub_bucket_shown, sub_bucket_comparing, sub_bucket_trialling, sub_bucket_interested, sub_bucket_repeat, sub_bucket_switchers, sub_bucket_lost, sub_bucket_praising, sub_bucket_questioning, sub_bucket_attacking, sources_count, last_updated, status')
      .eq('brand_id', brandId)
      .eq('snapshot_type', 'brand_level')
      .eq('checkpoint', window)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
    if (data) {
      setBrandKpis(data.filter((r: KpiSnapshot) => !r.competitor_id) as KpiSnapshot[])
      setCompetitorKpis(data.filter((r: KpiSnapshot) => !!r.competitor_id) as KpiSnapshot[])
    }
  }

  const fetchCompetitors = async (brandId: string) => {
    const { data } = await supabase.from('competitors').select('id, name').eq('brand_id', brandId).order('name')
    if (data) setCompetitors(data as Competitor[])
  }

  const fetchVerdict = async (brandId: string) => {
    const { data } = await supabase
      .from('verdicts')
      .select('narrative, recommended_action, recommended_action_window, risk_flags, top_insights, confidence_level, created_at')
      .eq('brand_id', brandId)
      .eq('verdict_type', 'brand_level')
      .eq('status', 'ready')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (data) setVerdict(data as Verdict)
  }

  const fetchEyeData = async (brandId: string, userId: string) => {
    const { data: order } = await supabase
      .from('orders')
      .select('id')
      .eq('user_id', userId)
      .eq('product', 'eye')
      .eq('status', 'paid')
      .maybeSingle()
    if (order) {
      setEyePaid(true)
      const { data: audit } = await supabase
        .from('cx_audits')
        .select('id, audit_date, overall_cx_nps, total_signals, benchmark, category_type, status, audit_type')
        .eq('brand_id', brandId)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (audit) {
        setCxAudit(audit as CxAudit)
        const { data: themes } = await supabase
          .from('cx_theme_scores')
          .select('theme, nps_score, signal_count, dropout_rate, top_concern, sentiment, confidence')
          .eq('audit_id', audit.id)
        if (themes) setCxThemes(themes as CxThemeScore[])
        const { data: cv } = await supabase
          .from('cx_verdicts')
          .select('narrative, top_priorities, recommended_actions, mystery_audit_triggered')
          .eq('audit_id', audit.id)
          .maybeSingle()
        if (cv) setCxVerdict(cv as CxVerdict)
      }
    }
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      const { data: brands, error: brandError } = await supabase
        .from('brands').select('*').eq('user_id', user.id).maybeSingle()
      if (brandError || !brands) { router.push('/brand-setup'); return }
      setBrand(brands)
      await Promise.all([
        fetchKpis(brands.id, 'current'),
        fetchCompetitors(brands.id),
        fetchVerdict(brands.id),
        fetchEyeData(brands.id, user.id),
      ])
      setLoading(false)
    }
    init()
  }, [])

  const handleTimeWindow = async (window: TimeWindow) => {
    if (!brand) return
    setTimeWindow(window)
    setRefreshing(true)
    await fetchKpis(brand.id, window)
    setRefreshing(false)
  }

  const handleRefresh = async () => {
    if (!brand) return
    setRefreshing(true)
    await fetchKpis(brand.id, timeWindow)
    setRefreshing(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const getBrandKpi = (name: KpiName) => brandKpis.find(k => k.kpi_name === name)
  const getCompetitorKpi = (cId: string, kpiName: KpiName) =>
    competitorKpis.find(k => k.competitor_id === cId && k.kpi_name === kpiName)
  const getTheme = (theme: string) => cxThemes.find(t => t.theme === theme)

  const consideration = getBrandKpi('consideration')
  const usage = getBrandKpi('usage')
  const conversionGap = consideration && usage ? consideration.score - usage.score : null
  const showConversionGap = conversionGap !== null && conversionGap >= 20
  const buzz = getBrandKpi('buzz')
  const showBuzzSurge = buzz && buzz.movement !== null && buzz.movement >= 7
  const showBuzzRisk = buzz && buzz.movement !== null && buzz.movement <= -7
  const totalSources = brandKpis.reduce((max, k) => Math.max(max, k.sources_count || 0), 0)
  const lastUpdated = brandKpis[0]?.last_updated

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:DEEP}}>
      <div style={{color:GOLD}}>Loading...</div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:WHITE,display:'flex'}}>

      {/* SIDEBAR */}
      <div style={{width:220,flexShrink:0,background:DEEP,borderRight:'1px solid rgba(255,255,255,0.07)',display:'flex',flexDirection:'column',position:'fixed',top:0,left:0,bottom:0,zIndex:50}}>
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
          <a href="/campaign-setup" style={{display:'flex',alignItems:'center',gap:8,padding:'8px 16px',fontSize:12,color:CREAM_DIM,textDecoration:'none',borderLeft:'2px solid transparent'}}>
            <span>＋</span> New campaign
          </a>
          <div style={{fontSize:9,fontWeight:600,color:'rgba(197,194,186,0.4)',padding:'14px 16px 3px',textTransform:'uppercase',letterSpacing:'0.1em'}}>Solomon&apos;s Eye</div>
          <div onClick={() => setActiveProduct('eye')} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 16px',fontSize:12,color:activeProduct==='eye'?CREAM:CREAM_DIM,borderLeft:activeProduct==='eye'?`2px solid ${GOLD}`:'2px solid transparent',background:activeProduct==='eye'?'rgba(201,168,76,0.08)':'transparent',cursor:'pointer'}}>
            <span>👁</span> CX Audit
          </div>
          <div style={{fontSize:9,fontWeight:600,color:'rgba(197,194,186,0.4)',padding:'14px 16px 3px',textTransform:'uppercase',letterSpacing:'0.1em'}}>Account</div>
          <a href="/brand-setup" style={{display:'flex',alignItems:'center',gap:8,padding:'8px 16px',fontSize:12,color:CREAM_DIM,textDecoration:'none',borderLeft:'2px solid transparent'}}>
            <span>⚙</span> Brand settings
          </a>
          <a href="/pricing" style={{display:'flex',alignItems:'center',gap:8,padding:'8px 16px',fontSize:12,color:CREAM_DIM,textDecoration:'none',borderLeft:'2px solid transparent'}}>
            <span>↑</span> Upgrade plan
          </a>
        </div>
        <div style={{padding:'12px 16px',borderTop:'1px solid rgba(255,255,255,0.07)'}}>
          <div style={{fontSize:11,color:'rgba(197,194,186,0.5)',marginBottom:8,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.email}</div>
          <button onClick={handleSignOut} style={{width:'100%',padding:'7px',borderRadius:6,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',color:CREAM_DIM,fontSize:11,cursor:'pointer',textAlign:'left',fontFamily:'Inter,sans-serif'}}>Sign out</button>
        </div>
      </div>

      {/* MAIN */}
      <div style={{flex:1,marginLeft:220,display:'flex',flexDirection:'column',minHeight:'100vh',background:WHITE}}>

        {/* Top nav */}
        <nav style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 32px',borderBottom:`1px solid ${BORDER}`,background:WHITE}}>
          <div>
            <div style={{color:DARK,fontFamily:'Georgia,serif',fontWeight:700,fontSize:15}}>{brand?.brand_name}</div>
            <div style={{color:GOLD,fontSize:11}}>{activeProduct === 'iq' ? "Solomon's IQ" : "Solomon's Eye"}</div>
          </div>
          {activeProduct === 'iq' && (
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{display:'flex',background:'#f5f5f5',border:`1px solid ${BORDER}`,borderRadius:8,overflow:'hidden'}}>
                {TIME_WINDOWS.map(tw => (
                  <button key={tw.key} onClick={() => handleTimeWindow(tw.key)} style={{padding:'6px 14px',border:'none',cursor:'pointer',fontSize:12,fontWeight:timeWindow===tw.key?600:400,background:timeWindow===tw.key?MID_GREEN:'transparent',color:timeWindow===tw.key?CREAM:BODY_TEXT,fontFamily:'Inter,sans-serif',transition:'all 0.15s'}}>
                    {tw.label}
                  </button>
                ))}
              </div>
              <a href="/campaign-setup" style={{color:DEEP,fontSize:12,fontWeight:600,textDecoration:'none',padding:'7px 14px',borderRadius:7,background:GOLD}}>+ New Campaign</a>
              <button onClick={handleRefresh} disabled={refreshing} style={{padding:'7px 12px',borderRadius:7,background:'#f5f5f5',border:`1px solid ${BORDER}`,color:MID_GREEN,fontSize:12,cursor:'pointer',fontWeight:600,fontFamily:'Inter,sans-serif'}}>
                {refreshing ? '...' : '↻'}
              </button>
            </div>
          )}
          {activeProduct === 'eye' && (
            <a href="/pricing" style={{color:DEEP,fontSize:12,fontWeight:600,textDecoration:'none',padding:'7px 14px',borderRadius:7,background:GOLD}}>+ New Audit</a>
          )}
        </nav>

        {/* IQ VIEW */}
        {activeProduct === 'iq' && (
          <div style={{maxWidth:'1100px',margin:'0 auto',padding:'32px',width:'100%'}}>
            <div style={{marginBottom:'20px'}}>
              <h1 style={{color:DARK,fontFamily:'Georgia,serif',fontSize:'25px',fontWeight:700,marginBottom:4}}>{brand?.brand_name}</h1>
              <p style={{color:BODY_TEXT,fontSize:14,marginBottom:4}}>{brand?.category}</p>
              {[brand?.competitor_1,brand?.competitor_2,brand?.competitor_3].filter(Boolean).length > 0 && (
                <p style={{color:'#aaa',fontSize:12}}>vs {[brand?.competitor_1,brand?.competitor_2,brand?.competitor_3].filter(Boolean).join(', ')}</p>
              )}
            </div>

            {/* Source bar */}
            <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 14px',background:'#f9f9f9',border:`1px solid ${BORDER}`,borderRadius:8,marginBottom:16,fontSize:12,color:BODY_TEXT}}>
              <div style={{width:7,height:7,borderRadius:'50%',background:GREEN,flexShrink:0}}/>
              <span>
                {totalSources > 0 ? `Signals from ${totalSources} sources` : 'Signals being collected — check back soon'}
                {lastUpdated ? ` · Last updated ${new Date(lastUpdated).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}` : ''}
                {refreshing && <span style={{color:GOLD,marginLeft:8}}>Updating...</span>}
              </span>
            </div>

            {/* Alerts */}
            {showConversionGap && (
              <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',background:'rgba(201,168,76,0.08)',border:'1px solid rgba(201,168,76,0.3)',borderRadius:8,marginBottom:16,fontSize:13,color:'#7a5c00'}}>
                <span>⚠</span>
                <span>Conversion gap — Consideration ({consideration!.score}) is {conversionGap} points above Usage ({usage!.score}). Inside-platform audit recommended.</span>
              </div>
            )}
            {showBuzzSurge && (
              <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',background:'rgba(95,198,138,0.08)',border:'1px solid rgba(95,198,138,0.3)',borderRadius:8,marginBottom:16,fontSize:13,color:'#1a6b1a'}}>
                <span>🚀</span>
                <span>Buzz Surge — score moved +{buzz!.movement} points. Find the source and amplify within 24 hours.</span>
              </div>
            )}
            {showBuzzRisk && (
              <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',background:'rgba(232,120,120,0.08)',border:'1px solid rgba(232,120,120,0.3)',borderRadius:8,marginBottom:16,fontSize:13,color:'#7a1a1a'}}>
                <span>⚠</span>
                <span>Buzz Risk — score moved {buzz!.movement} points. Respond within 12 hours before narrative solidifies.</span>
              </div>
            )}

            <p style={{color:BODY_TEXT,fontSize:11,fontWeight:600,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:12}}>
              Brand Health — {timeWindow === 'current' ? 'Current' : `Last ${timeWindow}`}
            </p>

            {/* KPI Cards */}
            {brandKpis.length === 0 ? (
              <div style={{background:'#f9f9f9',border:`1px solid ${BORDER}`,borderRadius:12,padding:'32px',textAlign:'center',marginBottom:24}}>
                <div style={{fontSize:24,marginBottom:12}}>📊</div>
                <p style={{fontSize:15,fontWeight:600,color:DARK,marginBottom:8}}>Your data is being prepared</p>
                <p style={{fontSize:14,color:BODY_TEXT,lineHeight:1.75}}>We are collecting and verifying your brand signals. Your dashboard will populate once your first report is ready.</p>
              </div>
            ) : (
              <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:24}}>
                {KPI_NAMES.map(kpiName => {
                  const kpi = getBrandKpi(kpiName)
                  const mv = movementLabel(kpi?.movement ?? null)
                  const zoneColor = kpi ? ZONE_COLOR[kpi.zone] : BORDER
                  const subBuckets = KPI_SUB_BUCKETS[kpiName]
                  return (
                    <div key={kpiName} style={{padding:'18px 14px',borderRadius:12,background:WHITE,border:`1px solid ${BORDER}`,borderTop:`3px solid ${zoneColor}`,boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
                      <div style={{color:GOLD,fontSize:10,fontWeight:600,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:8}}>{kpiName}</div>
                      <div style={{color:DARK,fontFamily:'Georgia,serif',fontSize:30,fontWeight:700,lineHeight:1,marginBottom:4}}>
                        {kpi ? scoreDisplay(kpiName, kpi.score) : '--'}
                      </div>
                      {kpi ? (
                        <>
                          <div style={{fontSize:11,color:zoneColor,marginBottom:3,fontWeight:600}}>{ZONE_LABEL[kpi.zone]}</div>
                          {mv && <div style={{fontSize:11,color:mv.color,fontWeight:500,marginBottom:8}}>{mv.text}</div>}
                        </>
                      ) : (
                        <div style={{color:'#bbb',fontSize:11,marginBottom:8}}>No data yet</div>
                      )}
                      {subBuckets.length > 0 && (
                        <div style={{display:'flex',flexDirection:'column',gap:3,borderTop:`1px solid ${BORDER}`,paddingTop:8}}>
                          {subBuckets.map(sb => {
                            const val = kpi ? (kpi as any)[sb.key] : null
                            return (
                              <div key={sb.key} style={{display:'flex',alignItems:'center',gap:5,fontSize:10,color:BODY_TEXT}}>
                                <div style={{width:6,height:6,borderRadius:'50%',background:subBucketColor(val),flexShrink:0}}/>
                                <span>{sb.label}</span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                      {kpiName === 'imagery' && kpi && (
                        <div style={{borderTop:`1px solid ${BORDER}`,paddingTop:8,fontSize:10,color:BODY_TEXT}}>
                          <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:3}}>
                            <div style={{width:6,height:6,borderRadius:'50%',background:GREEN,flexShrink:0}}/>
                            <span>Echoing</span>
                          </div>
                          <div style={{display:'flex',alignItems:'center',gap:5}}>
                            <div style={{width:6,height:6,borderRadius:'50%',background:AMBER,flexShrink:0}}/>
                            <span>Drifting</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Competitor table */}
            {competitors.length > 0 && brandKpis.length > 0 && (
              <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,overflow:'hidden',marginBottom:24,boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
                <div style={{padding:'12px 24px',borderBottom:`1px solid ${BORDER}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <span style={{fontSize:11,fontWeight:600,color:BODY_TEXT,textTransform:'uppercase',letterSpacing:'0.1em'}}>Competitor comparison</span>
                  <span style={{fontSize:11,color:'#aaa'}}>{timeWindow === 'current' ? 'Current' : `Last ${timeWindow}`}</span>
                </div>
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                    <thead>
                      <tr style={{background:'#fafafa'}}>
                        <th style={{textAlign:'left',padding:'10px 24px',fontWeight:600,color:'#aaa',fontSize:11,textTransform:'uppercase',letterSpacing:'0.08em',width:180}}>Brand</th>
                        {KPI_NAMES.map(k => (
                          <th key={k} style={{textAlign:'center',padding:'10px 16px',fontWeight:600,color:'#aaa',fontSize:11,textTransform:'uppercase',letterSpacing:'0.08em'}}>{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{borderTop:`1px solid ${BORDER}`,background:'rgba(201,168,76,0.04)'}}>
                        <td style={{padding:'12px 24px'}}>
                          <div style={{display:'flex',alignItems:'center',gap:8}}>
                            <span style={{width:8,height:8,borderRadius:'50%',background:GOLD,display:'inline-block',flexShrink:0}}/>
                            <span style={{color:DARK,fontWeight:600,fontSize:13}}>{brand?.brand_name}</span>
                            <span style={{fontSize:10,color:'#bbb'}}>you</span>
                          </div>
                        </td>
                        {KPI_NAMES.map(kpiName => {
                          const kpi = getBrandKpi(kpiName)
                          return (
                            <td key={kpiName} style={{textAlign:'center',padding:'12px 16px',color:DARK,fontWeight:600,fontSize:14}}>
                              {kpi ? scoreDisplay(kpiName, kpi.score) : '--'}
                            </td>
                          )
                        })}
                      </tr>
                      {competitors.map((comp) => (
                        <tr key={comp.id} style={{borderTop:`1px solid ${BORDER}`}}>
                          <td style={{padding:'12px 24px'}}>
                            <div style={{display:'flex',alignItems:'center',gap:8}}>
                              <span style={{width:8,height:8,borderRadius:'50%',background:BORDER,display:'inline-block',flexShrink:0}}/>
                              <span style={{color:BODY_TEXT,fontSize:13}}>{comp.name}</span>
                            </div>
                          </td>
                          {KPI_NAMES.map(kpiName => {
                            const compKpi = getCompetitorKpi(comp.id, kpiName)
                            const brandKpi = getBrandKpi(kpiName)
                            const MMD = 8
                            const ZONE_ORDER = ['critical','emerging','contested','established','category_defining']
                            const diff = compKpi && brandKpi ? compKpi.score - brandKpi.score : 0
                            const bothHigh = compKpi?.confidence_level === 'high' && brandKpi?.confidence_level === 'high'
                            const compRank = compKpi ? ZONE_ORDER.indexOf(compKpi.zone) : -1
                            const brandRank = brandKpi ? ZONE_ORDER.indexOf(brandKpi.zone) : -1
                            const structAhead = bothHigh && diff >= MMD && compRank > brandRank
                            const dirAhead = bothHigh && diff >= MMD && compRank <= brandRank
                            const inRange = compKpi && brandKpi && Math.abs(diff) < MMD
                            const lowConf = compKpi && brandKpi && !bothHigh
                            return (
                              <td key={kpiName} style={{textAlign:'center',padding:'12px 16px',fontSize:14,fontWeight:structAhead?600:400,color:structAhead?GREEN:dirAhead?AMBER:'#bbb'}}>
                                {compKpi ? (
                                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
                                    <span>{scoreDisplay(kpiName, compKpi.score)}</span>
                                    {structAhead && <span style={{fontSize:9,color:GREEN}}>↑ ahead</span>}
                                    {dirAhead && <span style={{fontSize:9,color:AMBER}}>~ directional</span>}
                                    {inRange && <span style={{fontSize:9,color:'#bbb'}}>~ in range</span>}
                                    {lowConf && <span style={{fontSize:9,color:'#bbb'}}>⚠ low conf</span>}
                                  </div>
                                ) : '--'}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Verdict */}
            {verdict ? (
              <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'28px 32px',boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                  <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.25)',borderRadius:20,padding:'4px 14px'}}>
                    <span style={{fontSize:11,fontWeight:600,color:GOLD,letterSpacing:'0.05em',textTransform:'uppercase'}}>⭐ Solomon&apos;s Verdict</span>
                  </div>
                  <span style={{fontSize:11,color:'#aaa'}}>{new Date(verdict.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span>
                </div>
                <p style={{fontFamily:'Georgia,serif',fontSize:16,color:DARK,lineHeight:1.75,fontStyle:'italic',marginBottom:18}}>&ldquo;{verdict.narrative}&rdquo;</p>
                {verdict.top_insights && verdict.top_insights.length > 0 && (
                  <div style={{marginBottom:16}}>
                    <p style={{fontSize:11,fontWeight:600,color:GOLD,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>Top insights</p>
                    {verdict.top_insights.map((insight, i) => (
                      <div key={i} style={{display:'flex',gap:8,marginBottom:6,alignItems:'flex-start'}}>
                        <span style={{color:GOLD,fontSize:12,marginTop:2}}>✦</span>
                        <span style={{fontSize:14,color:BODY_TEXT,lineHeight:1.6}}>{insight}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{display:'flex',gap:24,flexWrap:'wrap',paddingTop:16,borderTop:`1px solid ${BORDER}`}}>
                  {verdict.recommended_action && (
                    <div style={{flex:1,minWidth:200}}>
                      <p style={{fontSize:10,fontWeight:600,color:GOLD,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>Recommended action</p>
                      <p style={{fontSize:14,color:DARK,lineHeight:1.5}}>{verdict.recommended_action}</p>
                      {verdict.recommended_action_window && <p style={{fontSize:12,color:'#aaa',marginTop:4}}>→ {verdict.recommended_action_window}</p>}
                    </div>
                  )}
                  {verdict.risk_flags && verdict.risk_flags.length > 0 && (
                    <div style={{flex:1,minWidth:200}}>
                      <p style={{fontSize:10,fontWeight:600,color:RED,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>Risk flags</p>
                      {verdict.risk_flags.map((flag, i) => <p key={i} style={{fontSize:14,color:RED,lineHeight:1.5}}>⚠ {flag}</p>)}
                    </div>
                  )}
                  {verdict.confidence_level && (
                    <div>
                      <p style={{fontSize:10,fontWeight:600,color:GOLD,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>Confidence</p>
                      <p style={{fontSize:14,color:BODY_TEXT,textTransform:'capitalize'}}>{verdict.confidence_level}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'28px 32px',textAlign:'center',boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
                <p style={{fontSize:11,fontWeight:600,color:GOLD,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:10}}>⭐ Solomon&apos;s Verdict</p>
                <p style={{fontSize:15,color:BODY_TEXT,lineHeight:1.7}}>Your verdict will appear here once enough brand signal data has been collected.</p>
              </div>
            )}
          </div>
        )}

        {/* EYE VIEW */}
        {activeProduct === 'eye' && (
          <div style={{maxWidth:'1100px',margin:'0 auto',padding:'32px',width:'100%'}}>

            {!eyePaid && (
              <div style={{textAlign:'center',padding:'80px 24px'}}>
                <div style={{fontSize:36,marginBottom:16}}>👁</div>
                <h2 style={{fontFamily:'Georgia,serif',fontSize:25,fontWeight:700,color:DARK,marginBottom:12}}>Solomon&apos;s Eye</h2>
                <p style={{fontSize:15,color:BODY_TEXT,maxWidth:440,margin:'0 auto 28px',lineHeight:1.75}}>CX audit not active on your account. Purchase Solomon&apos;s Eye to see your full customer experience audit — by theme, by sub-touchpoint, with drop-off rates and Solomon&apos;s Eye Verdict.</p>
                <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,maxWidth:700,margin:'0 auto 28px',opacity:0.3,filter:'blur(2px)',pointerEvents:'none'}}>
                  {CX_THEMES.map(theme => (
                    <div key={theme} style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:10,padding:'16px 12px',textAlign:'center'}}>
                      <div style={{fontSize:10,fontWeight:600,color:GOLD,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>{theme}</div>
                      <div style={{fontFamily:'Georgia,serif',fontSize:24,fontWeight:700,color:DARK,marginBottom:4}}>--</div>
                      <div style={{fontSize:11,color:'#aaa'}}>CX NPS</div>
                    </div>
                  ))}
                </div>
                <a href="/pricing" style={{display:'inline-block',background:GOLD,color:DEEP,fontSize:14,fontWeight:600,padding:'12px 28px',borderRadius:8,textDecoration:'none'}}>Purchase Solomon&apos;s Eye →</a>
              </div>
            )}

            {eyePaid && !cxAudit && (
              <div style={{textAlign:'center',padding:'80px 24px'}}>
                <div style={{fontSize:36,marginBottom:16}}>👁</div>
                <h2 style={{fontFamily:'Georgia,serif',fontSize:25,fontWeight:700,color:DARK,marginBottom:12}}>Your CX audit is being prepared</h2>
                <p style={{fontSize:15,color:BODY_TEXT,maxWidth:440,margin:'0 auto 24px',lineHeight:1.75}}>We are collecting and verifying your customer experience signals. Your dashboard will populate once your first audit is ready.</p>
                <a href="/connect" style={{display:'inline-block',background:GOLD,color:DEEP,fontSize:14,fontWeight:600,padding:'12px 28px',borderRadius:8,textDecoration:'none'}}>Questions? Connect with us</a>
              </div>
            )}

            {eyePaid && cxAudit && (
              <>
                <div style={{marginBottom:20}}>
                  <h1 style={{color:DARK,fontFamily:'Georgia,serif',fontSize:25,fontWeight:700,marginBottom:4}}>{brand?.brand_name} — CX Audit</h1>
                  <p style={{color:BODY_TEXT,fontSize:14,marginBottom:4}}>
                    {cxAudit.category_type} · Benchmark {cxAudit.benchmark}
                    {cxAudit.audit_date ? ` · ${new Date(cxAudit.audit_date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}` : ''}
                  </p>
                </div>

                <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'20px 24px',marginBottom:20,boxShadow:'0 1px 4px rgba(0,0,0,0.04)',display:'flex',alignItems:'center',gap:32}}>
                  <div>
                    <div style={{fontSize:11,fontWeight:600,color:GOLD,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>Overall CX NPS</div>
                    <div style={{fontFamily:'Georgia,serif',fontSize:48,fontWeight:700,color:npsColor(cxAudit.overall_cx_nps,cxAudit.benchmark),lineHeight:1}}>
                      {cxAudit.overall_cx_nps !== null ? (cxAudit.overall_cx_nps > 0 ? `+${cxAudit.overall_cx_nps}` : String(cxAudit.overall_cx_nps)) : '--'}
                    </div>
                  </div>
                  <div style={{height:60,width:1,background:BORDER}}/>
                  <div>
                    <div style={{fontSize:11,fontWeight:600,color:'#aaa',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>Benchmark</div>
                    <div style={{fontFamily:'Georgia,serif',fontSize:28,fontWeight:600,color:'#aaa'}}>{cxAudit.benchmark}</div>
                  </div>
                  <div style={{height:60,width:1,background:BORDER}}/>
                  <div>
                    <div style={{fontSize:11,fontWeight:600,color:'#aaa',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>Total signals</div>
                    <div style={{fontFamily:'Georgia,serif',fontSize:28,fontWeight:600,color:BODY_TEXT}}>{cxAudit.total_signals?.toLocaleString() || '--'}</div>
                  </div>
                </div>

                <p style={{fontSize:11,fontWeight:600,color:BODY_TEXT,textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:12}}>CX by theme</p>
                <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:24}}>
                  {CX_THEMES.map(theme => {
                    const t = getTheme(theme)
                    const color = t ? npsColor(t.nps_score, cxAudit.benchmark) : '#ccc'
                    return (
                      <div key={theme} style={{padding:'18px 14px',borderRadius:12,background:WHITE,border:`1px solid ${BORDER}`,borderTop:`3px solid ${color}`,boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
                        <div style={{fontSize:10,fontWeight:600,color:GOLD,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>{theme}</div>
                        <div style={{fontFamily:'Georgia,serif',fontSize:28,fontWeight:700,color:color,lineHeight:1,marginBottom:4}}>
                          {t?.nps_score !== null && t?.nps_score !== undefined ? (t.nps_score > 0 ? `+${t.nps_score}` : String(t.nps_score)) : '--'}
                        </div>
                        <div style={{fontSize:11,color:'#aaa',marginBottom:8}}>Theme NPS</div>
                        {t && (
                          <>
                            <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:6}}>
                              <div style={{width:6,height:6,borderRadius:'50%',background:sentimentDot(t.sentiment),flexShrink:0}}/>
                              <span style={{fontSize:10,color:BODY_TEXT,textTransform:'capitalize'}}>{t.sentiment}</span>
                            </div>
                            {t.dropout_rate !== null && (
                              <div style={{fontSize:10,color:t.dropout_rate > 20 ? RED : BODY_TEXT}}>{t.dropout_rate}% drop-off</div>
                            )}
                            {t.top_concern && (
                              <div style={{fontSize:10,color:'#aaa',marginTop:4,lineHeight:1.4,borderTop:`1px solid ${BORDER}`,paddingTop:6}}>{t.top_concern}</div>
                            )}
                          </>
                        )}
                        {!t && <div style={{fontSize:10,color:'#bbb'}}>No data yet</div>}
                      </div>
                    )
                  })}
                </div>

                {cxVerdict ? (
                  <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'28px 32px',boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
                    <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.25)',borderRadius:20,padding:'4px 14px',marginBottom:16}}>
                      <span style={{fontSize:11,fontWeight:600,color:GOLD,letterSpacing:'0.05em',textTransform:'uppercase'}}>👁 Solomon&apos;s Eye Verdict</span>
                    </div>
                    {cxVerdict.narrative && (
                      <p style={{fontFamily:'Georgia,serif',fontSize:16,color:DARK,lineHeight:1.75,fontStyle:'italic',marginBottom:18}}>&ldquo;{cxVerdict.narrative}&rdquo;</p>
                    )}
                    {cxVerdict.mystery_audit_triggered && (
                      <div style={{background:'rgba(201,168,76,0.08)',border:'1px solid rgba(201,168,76,0.3)',borderRadius:8,padding:'12px 16px',marginBottom:16,fontSize:13,color:'#7a5c00'}}>
                        ⚠ Mystery audit recommended — one or more themes have insufficient signal volume. <a href="/pricing" style={{color:GOLD,fontWeight:500}}>Add mystery audit →</a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'28px 32px',textAlign:'center',boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
                    <p style={{fontSize:11,fontWeight:600,color:GOLD,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:10}}>👁 Solomon&apos;s Eye Verdict</p>
                    <p style={{fontSize:15,color:BODY_TEXT,lineHeight:1.7}}>Your Eye Verdict will appear here once the audit is complete.</p>
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