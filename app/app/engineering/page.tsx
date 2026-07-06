'use client'
import { useState, useEffect } from 'react'

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

const SUPABASE_URL = 'https://alrwyeenxeuxgkcskkes.supabase.co'
const ADMIN_PASSWORD = 'ks-admin-2026'

const KPI_NAMES = ['awareness', 'consideration', 'usage', 'imagery', 'buzz'] as const
type KpiName = typeof KPI_NAMES[number]
const CX_THEMES = ['Product', 'Experience', 'Customer Service', 'Pricing', 'Collections'] as const

const ZONE_LABEL: Record<string, string> = {
  critical: 'Critical', emerging: 'Emerging', contested: 'Contested',
  established: 'Established', category_defining: 'Category Defining',
}
const ZONE_COLOR: Record<string, string> = {
  critical: RED, emerging: '#E2C97A', contested: AMBER,
  established: GREEN, category_defining: GREEN,
}

function scoreDisplay(kpiName: KpiName, score: number) {
  return kpiName === 'buzz' && score > 0 ? `+${score}` : String(score)
}

function npsColor(score: number | null, benchmark: number): string {
  if (score === null) return '#ccc'
  if (score >= benchmark) return GREEN
  if (score >= benchmark - 15) return AMBER
  return RED
}

export default function EngineeringPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [brands, setBrands] = useState<any[]>([])
  const [selectedBrand, setSelectedBrand] = useState<any>(null)
  const [activeView, setActiveView] = useState<'iq' | 'eye'>('iq')
  const [kpis, setKpis] = useState<any[]>([])
  const [competitors, setCompetitors] = useState<any[]>([])
  const [verdict, setVerdict] = useState<any>(null)
  const [cxAudit, setCxAudit] = useState<any>(null)
  const [cxThemes, setCxThemes] = useState<any[]>([])
  const [cxVerdict, setCxVerdict] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [statusFilter, setStatusFilter] = useState<'published' | 'pending_review' | 'all'>('published')

  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  const headers = {
    'Content-Type': 'application/json',
    'apikey': anon,
    'Authorization': `Bearer ${anon}`,
  }

  const fetchBrands = async () => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/brands?select=*&order=created_at.desc`, { headers })
    const data = await res.json()
    setBrands(Array.isArray(data) ? data : [])
  }

  const fetchIQData = async (brandId: string) => {
    setLoading(true)
    const statusQuery = statusFilter === 'all' ? '' : `&status=eq.${statusFilter}`
    const res = await fetch(`${SUPABASE_URL}/rest/v1/kpi_snapshots?brand_id=eq.${brandId}&snapshot_type=eq.brand_level&checkpoint=eq.current${statusQuery}&order=created_at.desc`, { headers })
    const data = await res.json()
    setKpis(Array.isArray(data) ? data.filter((k: any) => !k.competitor_id) : [])

    const compRes = await fetch(`${SUPABASE_URL}/rest/v1/competitors?brand_id=eq.${brandId}&select=*`, { headers })
    const compData = await compRes.json()
    setCompetitors(Array.isArray(compData) ? compData : [])

    const vRes = await fetch(`${SUPABASE_URL}/rest/v1/verdicts?brand_id=eq.${brandId}&status=eq.ready&order=created_at.desc&limit=1`, { headers })
    const vData = await vRes.json()
    setVerdict(Array.isArray(vData) && vData.length > 0 ? vData[0] : null)
    setLoading(false)
  }

  const fetchEyeData = async (brandId: string, userId: string) => {
    setLoading(true)
    const statusQuery = statusFilter === 'all' ? '' : `&status=eq.${statusFilter === 'published' ? 'published' : 'pending_review'}`
    const aRes = await fetch(`${SUPABASE_URL}/rest/v1/cx_audits?brand_id=eq.${brandId}${statusQuery}&order=created_at.desc&limit=1`, { headers })
    const aData = await aRes.json()
    if (Array.isArray(aData) && aData.length > 0) {
      setCxAudit(aData[0])
      const tRes = await fetch(`${SUPABASE_URL}/rest/v1/cx_theme_scores?audit_id=eq.${aData[0].id}&select=*`, { headers })
      const tData = await tRes.json()
      setCxThemes(Array.isArray(tData) ? tData : [])
      const cvRes = await fetch(`${SUPABASE_URL}/rest/v1/cx_verdicts?audit_id=eq.${aData[0].id}&select=*&limit=1`, { headers })
      const cvData = await cvRes.json()
      setCxVerdict(Array.isArray(cvData) && cvData.length > 0 ? cvData[0] : null)
    } else {
      setCxAudit(null)
      setCxThemes([])
      setCxVerdict(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (authed) fetchBrands()
  }, [authed])

  useEffect(() => {
    if (selectedBrand) {
      if (activeView === 'iq') fetchIQData(selectedBrand.id)
      else fetchEyeData(selectedBrand.id, selectedBrand.user_id)
    }
  }, [selectedBrand, activeView, statusFilter])

  const getBrandKpi = (name: KpiName) => kpis.find((k: any) => k.kpi_name === name)
  const getTheme = (theme: string) => cxThemes.find((t: any) => t.theme === theme)

  if (!authed) return (
    <div style={{minHeight:'100vh',background:DEEP,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <style>{`*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{font-family:'Inter',sans-serif}`}</style>
      <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:'40px 36px',width:320,textAlign:'center'}}>
        <div style={{fontSize:32,color:GOLD,marginBottom:12}}>⚙</div>
        <div style={{fontFamily:'Georgia,serif',fontSize:18,fontWeight:700,color:CREAM,marginBottom:4}}>Engineering Panel</div>
        <div style={{fontSize:12,color:CREAM_DIM,marginBottom:24}}>King Solomon — internal only</div>
        <input
          type="password" placeholder="Admin password" value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { if (password === ADMIN_PASSWORD) { setAuthed(true) } else { setMsg('Wrong password') } } }}
          style={{width:'100%',padding:'10px 14px',borderRadius:8,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.06)',color:CREAM,fontSize:14,marginBottom:12,fontFamily:'Inter,sans-serif'}}
        />
        <button
          onClick={() => { if (password === ADMIN_PASSWORD) { setAuthed(true) } else { setMsg('Wrong password') } }}
          style={{width:'100%',padding:'10px',background:GOLD,color:DEEP,border:'none',borderRadius:8,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}
        >Enter</button>
        {msg && <div style={{marginTop:12,fontSize:12,color:RED}}>{msg}</div>}
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#f5f5f5'}}>
      <style>{`*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{font-family:'Inter',sans-serif}`}</style>

      {/* TOP BAR */}
      <div style={{background:DEEP,padding:'12px 24px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:10,fontWeight:600,color:AMBER,textTransform:'uppercase',letterSpacing:'0.1em',background:'rgba(201,168,76,0.15)',padding:'3px 8px',borderRadius:4}}>⚙ Engineering</span>
          <span style={{fontSize:12,color:CREAM_DIM}}>Sandboxed preview — changes here do not affect live customers</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <a href="/admin" style={{fontSize:12,color:CREAM_DIM,textDecoration:'none'}}>← Admin panel</a>
          <button onClick={() => setAuthed(false)} style={{fontSize:11,color:CREAM_DIM,background:'none',border:'none',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Sign out</button>
        </div>
      </div>

      {/* CONTROLS */}
      <div style={{background:WHITE,borderBottom:`1px solid ${BORDER}`,padding:'14px 24px',display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>

        {/* Brand selector */}
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:11,color:BODY_TEXT,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em'}}>Brand</span>
          <select
            value={selectedBrand?.id || ''}
            onChange={e => {
              const b = brands.find(br => br.id === e.target.value)
              setSelectedBrand(b || null)
            }}
            style={{padding:'7px 12px',border:`1px solid ${BORDER}`,borderRadius:7,fontSize:13,color:DARK,background:WHITE,fontFamily:'Inter,sans-serif'}}
          >
            <option value="">Select a brand</option>
            {brands.map(b => <option key={b.id} value={b.id}>{b.brand_name}</option>)}
          </select>
        </div>

        {/* View toggle */}
        <div style={{display:'flex',background:'#f5f5f5',border:`1px solid ${BORDER}`,borderRadius:7,overflow:'hidden'}}>
          {(['iq','eye'] as const).map(v => (
            <button key={v} onClick={() => setActiveView(v)} style={{padding:'7px 16px',border:'none',cursor:'pointer',fontSize:12,fontWeight:activeView===v?600:400,background:activeView===v?DEEP:'transparent',color:activeView===v?CREAM:BODY_TEXT,fontFamily:'Inter,sans-serif'}}>
              {v === 'iq' ? "Solomon's IQ" : "Solomon's Eye"}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:11,color:BODY_TEXT,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em'}}>Show data</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            style={{padding:'7px 12px',border:`1px solid ${BORDER}`,borderRadius:7,fontSize:13,color:DARK,background:WHITE,fontFamily:'Inter,sans-serif'}}
          >
            <option value="published">Published only</option>
            <option value="pending_review">Pending review</option>
            <option value="all">All data</option>
          </select>
        </div>

        {selectedBrand && (
          <button
            onClick={() => { if (activeView === 'iq') fetchIQData(selectedBrand.id); else fetchEyeData(selectedBrand.id, selectedBrand.user_id) }}
            style={{padding:'7px 14px',background:GOLD,color:DEEP,border:'none',borderRadius:7,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}
          >
            ↻ Refresh
          </button>
        )}

        {loading && <span style={{fontSize:12,color:AMBER}}>Loading...</span>}
      </div>

      {/* CONTENT */}
      <div style={{maxWidth:1100,margin:'0 auto',padding:24}}>

        {!selectedBrand && (
          <div style={{textAlign:'center',padding:'80px 24px'}}>
            <div style={{fontSize:36,marginBottom:16}}>⚙</div>
            <h2 style={{fontFamily:'Georgia,serif',fontSize:25,fontWeight:700,color:DARK,marginBottom:12}}>Engineering Panel</h2>
            <p style={{fontSize:15,color:BODY_TEXT,maxWidth:440,margin:'0 auto',lineHeight:1.75}}>Select a brand above to preview exactly what the customer dashboard shows — including pending data not yet approved.</p>
          </div>
        )}

        {/* IQ PREVIEW */}
        {selectedBrand && activeView === 'iq' && (
          <div>
            {/* Status banner */}
            <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 14px',background:statusFilter==='pending_review'?'rgba(201,168,76,0.1)':'rgba(95,198,138,0.08)',border:`1px solid ${statusFilter==='pending_review'?'rgba(201,168,76,0.3)':'rgba(95,198,138,0.3)'}`,borderRadius:8,marginBottom:16,fontSize:12,color:BODY_TEXT}}>
              <div style={{width:7,height:7,borderRadius:'50%',background:statusFilter==='pending_review'?AMBER:GREEN,flexShrink:0}}/>
              <span>Previewing <strong>{statusFilter === 'published' ? 'published data only' : statusFilter === 'pending_review' ? 'pending data awaiting approval' : 'all data regardless of status'}</strong> for {selectedBrand.brand_name}</span>
            </div>

            <h2 style={{fontFamily:'Georgia,serif',fontSize:25,fontWeight:700,color:DARK,marginBottom:4}}>{selectedBrand.brand_name}</h2>
            <p style={{fontSize:14,color:BODY_TEXT,marginBottom:20}}>{selectedBrand.category}</p>

            {/* KPI cards */}
            <p style={{fontSize:11,fontWeight:600,color:BODY_TEXT,textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:12}}>Brand Health — Current</p>
            {kpis.length === 0 ? (
              <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'32px',textAlign:'center',marginBottom:20}}>
                <p style={{fontSize:14,color:'#aaa'}}>No {statusFilter} KPI data found for this brand.</p>
              </div>
            ) : (
              <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:24}}>
                {KPI_NAMES.map(kpiName => {
                  const kpi = getBrandKpi(kpiName)
                  const zoneColor = kpi ? ZONE_COLOR[kpi.zone] : BORDER
                  return (
                    <div key={kpiName} style={{padding:'18px 14px',borderRadius:12,background:WHITE,border:`1px solid ${BORDER}`,borderTop:`3px solid ${zoneColor}`,boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
                      <div style={{fontSize:10,fontWeight:600,color:GOLD,textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:8}}>{kpiName}</div>
                      <div style={{fontFamily:'Georgia,serif',fontSize:30,fontWeight:700,color:DARK,lineHeight:1,marginBottom:4}}>
                        {kpi ? scoreDisplay(kpiName, kpi.score) : '--'}
                      </div>
                      {kpi ? (
                        <>
                          <div style={{fontSize:11,color:zoneColor,marginBottom:3,fontWeight:600}}>{ZONE_LABEL[kpi.zone]}</div>
                          <div style={{fontSize:10,color:'#bbb',marginTop:4}}>Status: {kpi.status}</div>
                        </>
                      ) : (
                        <div style={{color:'#bbb',fontSize:11}}>No data</div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Verdict preview */}
            {verdict && (
              <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'24px 28px',boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
                <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.25)',borderRadius:20,padding:'4px 14px',marginBottom:12}}>
                  <span style={{fontSize:11,fontWeight:600,color:GOLD,letterSpacing:'0.05em',textTransform:'uppercase'}}>⭐ Solomon&apos;s Verdict</span>
                </div>
                <p style={{fontFamily:'Georgia,serif',fontSize:15,color:DARK,lineHeight:1.75,fontStyle:'italic'}}>&ldquo;{verdict.narrative}&rdquo;</p>
              </div>
            )}
          </div>
        )}

        {/* EYE PREVIEW */}
        {selectedBrand && activeView === 'eye' && (
          <div>
            <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 14px',background:statusFilter==='pending_review'?'rgba(201,168,76,0.1)':'rgba(95,198,138,0.08)',border:`1px solid ${statusFilter==='pending_review'?'rgba(201,168,76,0.3)':'rgba(95,198,138,0.3)'}`,borderRadius:8,marginBottom:16,fontSize:12,color:BODY_TEXT}}>
              <div style={{width:7,height:7,borderRadius:'50%',background:statusFilter==='pending_review'?AMBER:GREEN,flexShrink:0}}/>
              <span>Previewing <strong>{statusFilter === 'published' ? 'published data only' : statusFilter === 'pending_review' ? 'pending data awaiting approval' : 'all data regardless of status'}</strong> for {selectedBrand.brand_name}</span>
            </div>

            {!cxAudit ? (
              <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'32px',textAlign:'center'}}>
                <p style={{fontSize:14,color:'#aaa'}}>No {statusFilter} Eye audit found for this brand.</p>
              </div>
            ) : (
              <>
                <h2 style={{fontFamily:'Georgia,serif',fontSize:25,fontWeight:700,color:DARK,marginBottom:4}}>{selectedBrand.brand_name} — CX Audit</h2>
                <p style={{fontSize:14,color:BODY_TEXT,marginBottom:20}}>{cxAudit.category_type} · Benchmark {cxAudit.benchmark} · Status: <strong>{cxAudit.status}</strong></p>

                {/* Overall NPS */}
                <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'20px 24px',marginBottom:20,display:'flex',gap:32,alignItems:'center'}}>
                  <div>
                    <div style={{fontSize:11,fontWeight:600,color:GOLD,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>Overall CX NPS</div>
                    <div style={{fontFamily:'Georgia,serif',fontSize:48,fontWeight:700,color:npsColor(cxAudit.overall_cx_nps,cxAudit.benchmark),lineHeight:1}}>
                      {cxAudit.overall_cx_nps !== null ? (cxAudit.overall_cx_nps > 0 ? `+${cxAudit.overall_cx_nps}` : String(cxAudit.overall_cx_nps)) : '--'}
                    </div>
                  </div>
                  <div style={{height:60,width:1,background:BORDER}}/>
                  <div>
                    <div style={{fontSize:11,color:'#aaa',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>Benchmark</div>
                    <div style={{fontFamily:'Georgia,serif',fontSize:28,fontWeight:600,color:'#aaa'}}>{cxAudit.benchmark}</div>
                  </div>
                  <div style={{height:60,width:1,background:BORDER}}/>
                  <div>
                    <div style={{fontSize:11,color:'#aaa',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>Total signals</div>
                    <div style={{fontFamily:'Georgia,serif',fontSize:28,fontWeight:600,color:BODY_TEXT}}>{cxAudit.total_signals?.toLocaleString() || '--'}</div>
                  </div>
                  <div style={{height:60,width:1,background:BORDER}}/>
                  <div>
                    <div style={{fontSize:11,color:'#aaa',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>Audit status</div>
                    <span style={{fontSize:13,fontWeight:600,padding:'4px 10px',borderRadius:20,background:cxAudit.status==='published'?'rgba(95,198,138,0.1)':'rgba(201,168,76,0.1)',color:cxAudit.status==='published'?'#1a6b1a':AMBER}}>{cxAudit.status}</span>
                  </div>
                </div>

                {/* Theme cards */}
                <p style={{fontSize:11,fontWeight:600,color:BODY_TEXT,textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:12}}>CX by theme</p>
                <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:20}}>
                  {CX_THEMES.map(theme => {
                    const t = getTheme(theme)
                    const color = t ? npsColor(t.nps_score, cxAudit.benchmark) : '#ccc'
                    return (
                      <div key={theme} style={{padding:'16px 14px',borderRadius:12,background:WHITE,border:`1px solid ${BORDER}`,borderTop:`3px solid ${color}`}}>
                        <div style={{fontSize:10,fontWeight:600,color:GOLD,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>{theme}</div>
                        <div style={{fontFamily:'Georgia,serif',fontSize:26,fontWeight:700,color:color,lineHeight:1,marginBottom:3}}>
                          {t?.nps_score !== null && t?.nps_score !== undefined ? (t.nps_score > 0 ? `+${t.nps_score}` : String(t.nps_score)) : '--'}
                        </div>
                        {t && (
                          <>
                            <div style={{fontSize:10,color:BODY_TEXT,marginBottom:3,textTransform:'capitalize'}}>{t.sentiment}</div>
                            {t.dropout_rate !== null && <div style={{fontSize:10,color:t.dropout_rate > 20 ? RED : '#aaa'}}>{t.dropout_rate}% drop-off</div>}
                          </>
                        )}
                        {!t && <div style={{fontSize:10,color:'#bbb'}}>No data</div>}
                      </div>
                    )
                  })}
                </div>

                {/* Eye verdict */}
                {cxVerdict && (
                  <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'24px 28px'}}>
                    <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.25)',borderRadius:20,padding:'4px 14px',marginBottom:12}}>
                      <span style={{fontSize:11,fontWeight:600,color:GOLD,textTransform:'uppercase'}}>👁 Solomon&apos;s Eye Verdict</span>
                    </div>
                    <p style={{fontFamily:'Georgia,serif',fontSize:15,color:DARK,lineHeight:1.75,fontStyle:'italic'}}>&ldquo;{cxVerdict.narrative}&rdquo;</p>
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