'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const KPI_NAMES = ['awareness', 'consideration', 'usage', 'imagery', 'buzz'] as const
type KpiName = typeof KPI_NAMES[number]

interface KpiSnapshot {
  kpi_name: KpiName
  score: number
  zone: string
  movement: number | null
  confidence_level: string
  source: string | null
  competitor_id: string | null
}

interface Competitor {
  id: string
  name: string
}

interface Verdict {
  narrative: string
  recommended_action: string | null
  recommended_action_window: string | null
  risk_flags: string[] | null
  top_insights: string[] | null
  confidence_level: string | null
  created_at: string
}

const ZONE_LABEL: Record<string, string> = {
  critical: 'Critical',
  emerging: 'Emerging',
  contested: 'Contested',
  established: 'Established',
  category_defining: 'Category Defining',
}

const ZONE_COLOR: Record<string, string> = {
  critical: '#e87878',
  emerging: '#E2C97A',
  contested: '#C9A84C',
  established: '#5fc68a',
  category_defining: '#5fc68a',
}

function movementLabel(m: number | null) {
  if (m === null) return null
  if (m > 0) return { text: `↑ +${m} pts`, color: '#5fc68a' }
  if (m < 0) return { text: `↓ ${m} pts`, color: '#e87878' }
  return { text: '→ Stable', color: '#C9A84C' }
}

function scoreDisplay(kpiName: KpiName, score: number) {
  return kpiName === 'buzz' && score > 0 ? `+${score}` : String(score)
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
  const router = useRouter()
  const supabase = createClient()

  const fetchKpis = async (brandId: string) => {
    const { data } = await supabase
      .from('kpi_snapshots')
      .select('kpi_name, score, zone, movement, confidence_level, source, competitor_id')
      .eq('brand_id', brandId)
      .eq('snapshot_type', 'brand_level')
      .eq('checkpoint', 'current')
      .order('created_at', { ascending: false })
    if (data) {
      setBrandKpis(data.filter((r: KpiSnapshot) => !r.competitor_id) as KpiSnapshot[])
      setCompetitorKpis(data.filter((r: KpiSnapshot) => !!r.competitor_id) as KpiSnapshot[])
    }
  }

  const fetchCompetitors = async (brandId: string) => {
    const { data } = await supabase
      .from('competitors')
      .select('id, name')
      .eq('brand_id', brandId)
      .order('name')
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

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      const { data: brands, error: brandError } = await supabase
        .from('brands')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      if (brandError || !brands) { router.push('/brand-setup'); return }
      setBrand(brands)
      await Promise.all([fetchKpis(brands.id), fetchCompetitors(brands.id), fetchVerdict(brands.id)])
      setLoading(false)
    }
    init()
  }, [])

  const handleRefresh = async () => {
    if (!brand) return
    setRefreshing(true)
    await Promise.all([fetchKpis(brand.id), fetchCompetitors(brand.id), fetchVerdict(brand.id)])
    setRefreshing(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const getBrandKpi = (name: KpiName) => brandKpis.find(k => k.kpi_name === name)
  const getCompetitorKpi = (competitorId: string, kpiName: KpiName) =>
    competitorKpis.find(k => k.competitor_id === competitorId && k.kpi_name === kpiName)

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#0F2318'}}>
      <div style={{color:'#C9A84C'}}>Loading...</div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#0F2318',display:'flex'}}>

      {/* SIDEBAR */}
      <div style={{width:220,flexShrink:0,background:'rgba(0,0,0,0.25)',borderRight:'1px solid rgba(255,255,255,0.07)',display:'flex',flexDirection:'column',position:'fixed',top:0,left:0,bottom:0,zIndex:50}}>
        <div style={{padding:'18px 16px 14px',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <svg width="18" height="14" viewBox="0 0 56 44" fill="none"><path d="M4 36L12 14L22 26L28 6L34 26L44 14L52 36H4Z" fill="#C9A84C"/><rect x="4" y="36" width="48" height="6" rx="2" fill="#A07830"/></svg>
            <div>
              <div style={{fontFamily:'Georgia,serif',fontSize:11,fontWeight:700,color:'#F5F0E8',letterSpacing:'0.1em'}}>KING SOLOMON</div>
              <div style={{fontSize:9,color:'#C9A84C'}}>Consumer intelligence</div>
            </div>
          </div>
        </div>
        <div style={{padding:'12px 0',flex:1}}>
          <div style={{fontSize:9,fontWeight:600,color:'rgba(197,194,186,0.4)',padding:'6px 16px 3px',textTransform:'uppercase',letterSpacing:'0.1em'}}>Solomon&apos;s IQ</div>
          <a href="/dashboard" style={{display:'flex',alignItems:'center',gap:8,padding:'8px 16px',fontSize:12,color:'#F5F0E8',textDecoration:'none',borderLeft:'2px solid #C9A84C',background:'rgba(201,168,76,0.06)'}}>
            <span>📊</span> Dashboard
          </a>
          <a href="/campaign-setup" style={{display:'flex',alignItems:'center',gap:8,padding:'8px 16px',fontSize:12,color:'#C8C2B6',textDecoration:'none',borderLeft:'2px solid transparent'}}>
            <span>＋</span> New campaign
          </a>
          <div style={{fontSize:9,fontWeight:600,color:'rgba(197,194,186,0.4)',padding:'14px 16px 3px',textTransform:'uppercase',letterSpacing:'0.1em'}}>Solomon&apos;s Eye</div>
          <a href="#" style={{display:'flex',alignItems:'center',gap:8,padding:'8px 16px',fontSize:12,color:'rgba(197,194,186,0.35)',textDecoration:'none',borderLeft:'2px solid transparent'}}>
            <span>👁</span> CX Audit
          </a>
          <div style={{fontSize:9,fontWeight:600,color:'rgba(197,194,186,0.4)',padding:'14px 16px 3px',textTransform:'uppercase',letterSpacing:'0.1em'}}>Account</div>
          <a href="/brand-setup" style={{display:'flex',alignItems:'center',gap:8,padding:'8px 16px',fontSize:12,color:'#C8C2B6',textDecoration:'none',borderLeft:'2px solid transparent'}}>
            <span>⚙</span> Brand settings
          </a>
          <a href="/pricing" style={{display:'flex',alignItems:'center',gap:8,padding:'8px 16px',fontSize:12,color:'#C8C2B6',textDecoration:'none',borderLeft:'2px solid transparent'}}>
            <span>↑</span> Upgrade plan
          </a>
        </div>
        <div style={{padding:'12px 16px',borderTop:'1px solid rgba(255,255,255,0.07)'}}>
          <div style={{fontSize:11,color:'rgba(197,194,186,0.5)',marginBottom:8,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.email}</div>
          <button onClick={handleSignOut} style={{width:'100%',padding:'7px',borderRadius:6,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',color:'#C8C2B6',fontSize:11,cursor:'pointer',textAlign:'left'}}>Sign out</button>
        </div>
      </div>

      {/* MAIN — offset by sidebar */}
      <div style={{flex:1,marginLeft:220,display:'flex',flexDirection:'column',minHeight:'100vh'}}>

        {/* Top nav */}
        <nav style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 32px',borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
            <div>
              <div style={{color:'#F5F0E8',fontFamily:'Georgia,serif',fontWeight:'700',fontSize:'14px',letterSpacing:'0.1em'}}>{brand?.brand_name}</div>
              <div style={{color:'#C9A84C',fontSize:'11px'}}>{brand?.category}</div>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
            <a href="/campaign-setup" style={{color:'#0F2318',fontSize:'13px',fontWeight:600,textDecoration:'none',padding:'8px 16px',borderRadius:'8px',background:'#C9A84C'}}>+ New Campaign</a>
            <button onClick={handleRefresh} disabled={refreshing} style={{padding:'8px 16px',borderRadius:'8px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'#C9A84C',fontSize:'12px',cursor:'pointer',fontWeight:600}}>
              {refreshing ? 'Refreshing...' : '↻ Refresh'}
            </button>
          </div>
        </nav>

        <div style={{maxWidth:'1100px',margin:'0 auto',padding:'40px 32px',width:'100%'}}>

          {/* Brand header */}
          <div style={{marginBottom:'32px'}}>
            <h1 style={{color:'#F5F0E8',fontFamily:'Georgia,serif',fontSize:'25px',fontWeight:'700',marginBottom:'6px'}}>
              {brand?.brand_name}
            </h1>
            <p style={{color:'#C8C2B6',fontSize:'13px',marginBottom:'4px'}}>{brand?.category}</p>
            {[brand?.competitor_1, brand?.competitor_2, brand?.competitor_3].filter(Boolean).length > 0 && (
              <p style={{color:'rgba(197,194,186,0.4)',fontSize:'12px'}}>
                vs {[brand?.competitor_1, brand?.competitor_2, brand?.competitor_3].filter(Boolean).join(', ')}
              </p>
            )}
          </div>

          {/* KPI cards */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px'}}>
            <p style={{color:'#C8C2B6',fontSize:'11px',fontWeight:600,letterSpacing:'0.12em',textTransform:'uppercase'}}>Brand Health — Current</p>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'12px',marginBottom:'28px'}}>
            {KPI_NAMES.map(kpiName => {
              const kpi = getBrandKpi(kpiName)
              const mv = movementLabel(kpi?.movement ?? null)
              const zoneColor = kpi ? ZONE_COLOR[kpi.zone] : 'rgba(197,194,186,0.4)'
              return (
                <div key={kpiName} style={{padding:'20px 14px',borderRadius:'12px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderTop:`2px solid ${zoneColor}`}}>
                  <div style={{color:'#C9A84C',fontSize:'10px',fontWeight:'600',letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:'10px'}}>
                    {kpiName}
                  </div>
                  <div style={{color:'#F5F0E8',fontFamily:'Georgia,serif',fontSize:'32px',fontWeight:'700',lineHeight:1,marginBottom:'6px'}}>
                    {kpi ? scoreDisplay(kpiName, kpi.score) : '--'}
                  </div>
                  {kpi ? (
                    <>
                      <div style={{fontSize:'11px',color:zoneColor,marginBottom:'4px',fontWeight:600}}>
                        {ZONE_LABEL[kpi.zone]}
                      </div>
                      {mv && (
                        <div style={{fontSize:'11px',color:mv.color,fontWeight:500}}>
                          {mv.text}
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{color:'rgba(197,194,186,0.4)',fontSize:'11px'}}>No data yet</div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Competitor comparison table */}
          {competitors.length > 0 && (
            <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'16px',overflow:'hidden',marginBottom:'28px'}}>
              <div style={{padding:'14px 24px',borderBottom:'1px solid rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <span style={{fontSize:'11px',fontWeight:600,color:'#C8C2B6',textTransform:'uppercase',letterSpacing:'0.1em'}}>Competitor comparison</span>
                <span style={{fontSize:'11px',color:'rgba(197,194,186,0.4)'}}>Brand health — current</span>
              </div>
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:'13px'}}>
                  <thead>
                    <tr style={{background:'rgba(255,255,255,0.02)'}}>
                      <th style={{textAlign:'left',padding:'10px 24px',fontWeight:600,color:'rgba(197,194,186,0.6)',fontSize:'11px',textTransform:'uppercase',letterSpacing:'0.08em',width:'180px'}}>Brand</th>
                      {KPI_NAMES.map(k => (
                        <th key={k} style={{textAlign:'center',padding:'10px 16px',fontWeight:600,color:'rgba(197,194,186,0.6)',fontSize:'11px',textTransform:'uppercase',letterSpacing:'0.08em'}}>{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{borderTop:'1px solid rgba(255,255,255,0.06)',background:'rgba(201,168,76,0.06)'}}>
                      <td style={{padding:'12px 24px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                          <span style={{display:'inline-block',width:'8px',height:'8px',borderRadius:'50%',background:'#C9A84C',flexShrink:0}}></span>
                          <span style={{color:'#F5F0E8',fontWeight:600,fontSize:'13px'}}>{brand?.brand_name}</span>
                          <span style={{fontSize:'10px',color:'rgba(197,194,186,0.4)'}}>you</span>
                        </div>
                      </td>
                      {KPI_NAMES.map(kpiName => {
                        const kpi = getBrandKpi(kpiName)
                        return (
                          <td key={kpiName} style={{textAlign:'center',padding:'12px 16px',color:'#F5F0E8',fontWeight:600,fontSize:'14px'}}>
                            {kpi ? scoreDisplay(kpiName, kpi.score) : '--'}
                          </td>
                        )
                      })}
                    </tr>
                    {competitors.map((comp) => (
                      <tr key={comp.id} style={{borderTop:'1px solid rgba(255,255,255,0.06)'}}>
                        <td style={{padding:'12px 24px'}}>
                          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                            <span style={{display:'inline-block',width:'8px',height:'8px',borderRadius:'50%',background:'rgba(197,194,186,0.3)',flexShrink:0}}></span>
                            <span style={{color:'#C8C2B6',fontSize:'13px'}}>{comp.name}</span>
                          </div>
                        </td>
                        {KPI_NAMES.map(kpiName => {
                          const compKpi = getCompetitorKpi(comp.id, kpiName)
                          const brandKpi = getBrandKpi(kpiName)
                          const MMD = 8
                          const ZONE_ORDER = ['critical','emerging','contested','established','category_defining']
                          const diff = compKpi && brandKpi ? compKpi.score - brandKpi.score : 0
                          const bothHighConfidence = compKpi?.confidence_level === 'high' && brandKpi?.confidence_level === 'high'
                          const compZoneRank = compKpi ? ZONE_ORDER.indexOf(compKpi.zone) : -1
                          const brandZoneRank = brandKpi ? ZONE_ORDER.indexOf(brandKpi.zone) : -1
                          const structurallyAhead = bothHighConfidence && diff >= MMD && compZoneRank > brandZoneRank
                          const directionalAhead = bothHighConfidence && diff >= MMD && compZoneRank <= brandZoneRank
                          const withinRange = compKpi && brandKpi && Math.abs(diff) < MMD
                          const lowConfidence = compKpi && brandKpi && !bothHighConfidence
                          return (
                            <td key={kpiName} style={{textAlign:'center',padding:'12px 16px',fontSize:'14px',fontWeight:structurallyAhead?600:400,color:structurallyAhead?'#5fc68a':directionalAhead?'#C9A84C':'rgba(197,194,186,0.5)'}}>
                              {compKpi ? (
                                <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'2px'}}>
                                  <span>{scoreDisplay(kpiName, compKpi.score)}</span>
                                  {structurallyAhead && <span style={{fontSize:'9px',color:'#5fc68a'}}>↑ ahead</span>}
                                  {directionalAhead && <span style={{fontSize:'9px',color:'#C9A84C'}}>~ directional</span>}
                                  {withinRange && <span style={{fontSize:'9px',color:'rgba(197,194,186,0.35)'}}>~ in range</span>}
                                  {lowConfidence && <span style={{fontSize:'9px',color:'rgba(197,194,186,0.35)'}}>⚠ low conf</span>}
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

          {/* Solomon's Verdict */}
          {verdict ? (
            <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'16px',padding:'32px 36px'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'18px'}}>
                <div style={{display:'inline-flex',alignItems:'center',gap:'8px',background:'rgba(201,168,76,0.12)',border:'1px solid rgba(201,168,76,0.25)',borderRadius:'20px',padding:'5px 14px'}}>
                  <span style={{fontSize:'11px',fontWeight:600,color:'#C9A84C',letterSpacing:'0.05em',textTransform:'uppercase'}}>⭐ Solomon&#39;s Verdict</span>
                </div>
                <span style={{fontSize:'11px',color:'rgba(197,194,186,0.4)'}}>
                  {new Date(verdict.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                </span>
              </div>
              <p style={{fontFamily:'Georgia,serif',fontSize:'16px',fontWeight:400,color:'#F5F0E8',lineHeight:1.75,fontStyle:'italic',marginBottom:'20px'}}>
                &ldquo;{verdict.narrative}&rdquo;
              </p>
              {verdict.top_insights && verdict.top_insights.length > 0 && (
                <div style={{marginBottom:'18px'}}>
                  <p style={{fontSize:'11px',fontWeight:600,color:'#C9A84C',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:'10px'}}>Top insights</p>
                  {verdict.top_insights.map((insight, i) => (
                    <div key={i} style={{display:'flex',gap:'10px',marginBottom:'8px',alignItems:'flex-start'}}>
                      <span style={{color:'#C9A84C',fontSize:'12px',marginTop:'2px'}}>✦</span>
                      <span style={{fontSize:'13px',color:'#C8C2B6',lineHeight:1.6}}>{insight}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{display:'flex',gap:'24px',flexWrap:'wrap',paddingTop:'18px',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
                {verdict.recommended_action && (
                  <div style={{flex:1,minWidth:'200px'}}>
                    <p style={{fontSize:'10px',fontWeight:600,color:'#C9A84C',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:'6px'}}>Recommended action</p>
                    <p style={{fontSize:'13px',color:'#F5F0E8',lineHeight:1.5}}>{verdict.recommended_action}</p>
                    {verdict.recommended_action_window && (
                      <p style={{fontSize:'11px',color:'rgba(197,194,186,0.5)',marginTop:'4px'}}>→ {verdict.recommended_action_window}</p>
                    )}
                  </div>
                )}
                {verdict.risk_flags && verdict.risk_flags.length > 0 && (
                  <div style={{flex:1,minWidth:'200px'}}>
                    <p style={{fontSize:'10px',fontWeight:600,color:'#e87878',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:'6px'}}>Risk flags</p>
                    {verdict.risk_flags.map((flag, i) => (
                      <p key={i} style={{fontSize:'13px',color:'#e87878',lineHeight:1.5}}>⚠ {flag}</p>
                    ))}
                  </div>
                )}
                {verdict.confidence_level && (
                  <div>
                    <p style={{fontSize:'10px',fontWeight:600,color:'#C9A84C',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:'6px'}}>Confidence</p>
                    <p style={{fontSize:'13px',color:'#C8C2B6',textTransform:'capitalize'}}>{verdict.confidence_level}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'16px',padding:'32px 36px',textAlign:'center'}}>
              <p style={{fontSize:'11px',fontWeight:600,color:'#C9A84C',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:'12px'}}>⭐ Solomon&#39;s Verdict</p>
              <p style={{fontSize:'15px',color:'#C8C2B6',lineHeight:1.7}}>Your verdict will appear here once enough brand signal data has been collected.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}