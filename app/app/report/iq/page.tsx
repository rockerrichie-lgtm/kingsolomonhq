'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const GOLD = '#C9A84C'
const DEEP = '#0F2318'
const WHITE = '#ffffff'
const DARK = '#1a1a1a'
const BODY_TEXT = '#444444'
const BORDER = '#e8e8e8'
const GREEN = '#2d8a5e'
const RED = '#c0392b'
const AMBER = '#d4890a'
const CREAM = '#FAF7F2'

const KPI_NAMES = ['awareness', 'consideration', 'usage', 'imagery', 'buzz'] as const
type KpiName = typeof KPI_NAMES[number]

const ZONE_LABEL: Record<string, string> = {
  critical: 'Critical', emerging: 'Emerging', contested: 'Contested',
  established: 'Established', category_defining: 'Category Defining',
}
const ZONE_COLOR: Record<string, string> = {
  critical: RED, emerging: AMBER, contested: AMBER,
  established: GREEN, category_defining: GREEN,
}
const KPI_DESCRIPTION: Record<string, string> = {
  awareness: 'Measures the share of organic search presence and brand mention volume relative to category competitors.',
  consideration: 'Tracks active purchase-intent signals — comparison queries, review searches, and price checks — indicating consumers evaluating the brand.',
  usage: 'Reflects post-purchase sentiment from verified reviews and user-generated content across platforms.',
  imagery: 'NLP-derived score measuring the alignment between consumer language about the brand and desired brand attributes.',
  buzz: 'Net sentiment score across all social platforms — positive signals minus negative signals on a -100 to +100 scale.',
}
const KPI_ACTION: Record<string, string> = {
  awareness: 'Invest in top-of-funnel search presence and organic keyword share to build category visibility.',
  consideration: 'Audit the comparison and review content landscape — ensure the brand is present and compelling at the moment of evaluation.',
  usage: 'Address the top concerns from post-purchase reviews within 30 days to protect repeat purchase intent.',
  imagery: 'Align brand communication with the language consumers already use — amplify positive attribute signals.',
  buzz: 'Monitor net sentiment weekly. Respond to negative surges within 12 hours before narratives solidify.',
}
const KPI_SUB_BUCKETS: Record<string, { key: string; label: string }[]> = {
  awareness: [{key:'sub_bucket_searched',label:'Searched'},{key:'sub_bucket_found',label:'Found'},{key:'sub_bucket_shown',label:'Shown'}],
  consideration: [{key:'sub_bucket_comparing',label:'Comparing'},{key:'sub_bucket_trialling',label:'Trialling'},{key:'sub_bucket_interested',label:'Interested'}],
  usage: [{key:'sub_bucket_repeat',label:'Repeat'},{key:'sub_bucket_switchers',label:'Switchers'},{key:'sub_bucket_lost',label:'Lost'}],
  imagery: [],
  buzz: [{key:'sub_bucket_praising',label:'Praising'},{key:'sub_bucket_questioning',label:'Questioning'},{key:'sub_bucket_attacking',label:'Attacking'}],
}

function scoreDisplay(kpiName: string, score: number) {
  return kpiName === 'buzz' && score > 0 ? `+${score}` : String(score)
}

function subBucketColor(val: number | null | undefined) {
  if (!val) return '#ccc'
  if (val >= 60) return GREEN
  if (val >= 40) return AMBER
  return RED
}

export default function IQReportPage() {
  const [brand, setBrand] = useState<any>(null)
  const [brandKpis, setBrandKpis] = useState<any[]>([])
  const [competitorKpis, setCompetitorKpis] = useState<any[]>([])
  const [competitors, setCompetitors] = useState<any[]>([])
  const [verdict, setVerdict] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: brandData } = await supabase.from('brands').select('*').eq('user_id', user.id).maybeSingle()
      if (!brandData) { router.push('/dashboard'); return }
      if (!brandData.iq_report_ready) { router.push('/dashboard'); return }
      setBrand(brandData)
      const { data: kpis } = await supabase.from('kpi_snapshots')
        .select('*').eq('brand_id', brandData.id).eq('snapshot_type', 'brand_level')
        .eq('checkpoint', 'current').eq('status', 'published').order('created_at', { ascending: false })
      if (kpis) {
        setBrandKpis(kpis.filter((k: any) => !k.competitor_id))
        setCompetitorKpis(kpis.filter((k: any) => !!k.competitor_id))
      }
      const { data: comps } = await supabase.from('competitors').select('*').eq('brand_id', brandData.id)
      if (comps) setCompetitors(comps)
      const { data: v } = await supabase.from('verdicts').select('*')
        .eq('brand_id', brandData.id).eq('status', 'ready').order('created_at', { ascending: false }).limit(1).maybeSingle()
      if (v) setVerdict(v)
      setLoading(false)
    }
    init()
  }, [])

  const getBrandKpi = (name: string) => brandKpis.find(k => k.kpi_name === name)
  const getCompKpi = (compId: string, name: string) => competitorKpis.find(k => k.competitor_id === compId && k.kpi_name === name)

  const handleDownload = async () => {
    if (!reportRef.current) return
    setDownloading(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const jsPDF = (await import('jspdf')).default
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: WHITE, windowWidth: 1200 })
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const pageHeightInPx = (imgWidth / pdfWidth) * pdfHeight
      let position = 0
      let page = 0
      while (position < imgHeight) {
        if (page > 0) pdf.addPage()
        const sourceH = Math.min(pageHeightInPx, imgHeight - position)
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = imgWidth
        tempCanvas.height = sourceH
        const ctx = tempCanvas.getContext('2d')
        ctx?.drawImage(canvas, 0, position, imgWidth, sourceH, 0, 0, imgWidth, sourceH)
        const displayH = (sourceH / imgWidth) * pdfWidth
        pdf.addImage(tempCanvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, displayH)
        position += pageHeightInPx
        page++
      }
      pdf.save(`${brand?.brand_name || 'brand'}-IQ-report-${new Date().toISOString().slice(0,10)}.pdf`)
    } catch (e) { console.error('PDF error:', e) }
    setDownloading(false)
  }

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:DEEP}}>
      <div style={{color:GOLD,fontSize:16}}>Preparing your report...</div>
    </div>
  )

  const reportDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  const buzz = getBrandKpi('buzz')

  const pageHeader = (title: string) => (
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:32,paddingBottom:12,borderBottom:`2px solid ${GOLD}`}}>
      <div style={{fontFamily:'Georgia, serif',fontSize:11,color:DEEP,fontWeight:700,letterSpacing:'0.15em',textTransform:'uppercase'}}>King Solomon — {brand?.brand_name}</div>
      <div style={{fontSize:11,color:'#aaa'}}>{title}</div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#e8e8e8',padding:'32px 0'}}>
      <div style={{maxWidth:900,margin:'0 auto 24px',display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0 16px'}}>
        <button onClick={() => router.push('/dashboard')} style={{fontSize:13,color:DEEP,background:'none',border:'none',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>← Back to dashboard</button>
        <button onClick={handleDownload} disabled={downloading} style={{padding:'10px 24px',background:GOLD,color:DEEP,border:'none',borderRadius:8,fontSize:14,fontWeight:600,cursor:downloading?'not-allowed':'pointer',fontFamily:'Inter,sans-serif'}}>
          {downloading ? '⏳ Generating PDF...' : '⬇ Download PDF'}
        </button>
      </div>

      <div ref={reportRef} style={{maxWidth:900,margin:'0 auto',background:WHITE,fontFamily:'Inter, sans-serif'}}>

        {/* COVER */}
        <div style={{background:DEEP,minHeight:400,padding:'80px 64px',display:'flex',flexDirection:'column',justifyContent:'space-between',pageBreakAfter:'always'}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <svg width="32" height="26" viewBox="0 0 56 44" fill="none"><path d="M4 36L12 14L22 26L28 6L34 26L44 14L52 36H4Z" fill="#C9A84C"/><rect x="4" y="36" width="48" height="6" rx="2" fill="#A07830"/></svg>
            <div style={{fontFamily:'Georgia, serif',fontSize:14,fontWeight:700,color:CREAM,letterSpacing:'0.15em'}}>KING SOLOMON</div>
          </div>
          <div>
            <div style={{fontSize:11,color:GOLD,fontWeight:600,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:16}}>Brand Intelligence Report</div>
            <div style={{fontFamily:'Georgia, serif',fontSize:48,fontWeight:700,color:WHITE,lineHeight:1.1,marginBottom:8}}>{brand?.brand_name}</div>
            <div style={{fontSize:16,color:'rgba(255,255,255,0.6)',marginBottom:48}}>{brand?.category}</div>
            <div style={{display:'flex',gap:32}}>
              {[
                {label:'Period', val:'Current'},
                {label:'Generated', val:reportDate},
                {label:'Category', val:brand?.category},
              ].map(f => (
                <div key={f.label}>
                  <div style={{fontSize:10,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4}}>{f.label}</div>
                  <div style={{fontSize:13,color:WHITE}}>{f.val}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{fontSize:11,color:'rgba(255,255,255,0.3)'}}>Confidential — Prepared exclusively for {brand?.brand_name}</div>
        </div>

        {/* EXECUTIVE SUMMARY */}
        <div style={{padding:'48px 64px',borderBottom:'4px solid #f0f0f0',pageBreakAfter:'always'}}>
          {pageHeader('Executive Summary')}
          <div style={{fontFamily:'Georgia, serif',fontSize:28,fontWeight:700,color:DARK,marginBottom:6}}>Executive Summary</div>
          <div style={{fontSize:13,color:BODY_TEXT,marginBottom:32}}>Brand health overview across all five KPIs — {reportDate}</div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:32}}>
            {KPI_NAMES.map(kpiName => {
              const kpi = getBrandKpi(kpiName)
              const zoneColor = kpi ? ZONE_COLOR[kpi.zone] : '#ccc'
              return (
                <div key={kpiName} style={{padding:'16px 12px',borderRadius:8,background:'#f9f9f9',borderTop:`4px solid ${zoneColor}`,textAlign:'center'}}>
                  <div style={{fontSize:9,fontWeight:700,color:GOLD,textTransform:'uppercase',letterSpacing:'0.15em',marginBottom:8}}>{kpiName}</div>
                  <div style={{fontFamily:'Georgia, serif',fontSize:32,fontWeight:700,color:DARK,marginBottom:4}}>
                    {kpi ? scoreDisplay(kpiName, kpi.score) : '--'}
                  </div>
                  <div style={{fontSize:10,color:zoneColor,fontWeight:600}}>{kpi ? ZONE_LABEL[kpi.zone] : 'No data'}</div>
                  {kpi?.movement !== null && kpi?.movement !== undefined && (
                    <div style={{fontSize:10,color:kpi.movement > 0 ? GREEN : kpi.movement < 0 ? RED : AMBER,marginTop:4}}>
                      {kpi.movement > 0 ? `↑ +${kpi.movement}` : kpi.movement < 0 ? `↓ ${kpi.movement}` : '→ Stable'} pts
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {verdict && (
            <div style={{background:'rgba(201,168,76,0.06)',border:'1px solid rgba(201,168,76,0.25)',borderRadius:8,padding:'20px 24px',marginBottom:24}}>
              <div style={{fontSize:10,fontWeight:700,color:GOLD,textTransform:'uppercase',letterSpacing:'0.15em',marginBottom:12}}>Solomon&apos;s Verdict</div>
              <p style={{fontFamily:'Georgia, serif',fontSize:15,color:DARK,lineHeight:1.8,fontStyle:'italic',marginBottom:16}}>&ldquo;{verdict.narrative}&rdquo;</p>
              {verdict.recommended_action && (
                <div style={{borderLeft:`3px solid ${GOLD}`,paddingLeft:12}}>
                  <div style={{fontSize:10,color:GOLD,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4}}>Recommended action</div>
                  <div style={{fontSize:13,color:DARK}}>{verdict.recommended_action}</div>
                </div>
              )}
            </div>
          )}

          {(() => {
            const con = getBrandKpi('consideration')
            const usg = getBrandKpi('usage')
            const gap = con && usg ? con.score - usg.score : null
            return gap && gap >= 20 ? (
              <div style={{background:'rgba(212,137,10,0.08)',border:'1px solid rgba(212,137,10,0.3)',borderRadius:8,padding:'12px 16px',fontSize:13,color:'#7a5c00'}}>
                ⚠ Conversion gap detected — Consideration ({con!.score}) is {gap} points above Usage ({usg!.score}). Inside-platform audit recommended.
              </div>
            ) : null
          })()}
        </div>

        {/* COMPETITIVE LANDSCAPE */}
        <div style={{padding:'48px 64px',borderBottom:'4px solid #f0f0f0',pageBreakAfter:'always'}}>
          {pageHeader('Competitive Landscape')}
          <div style={{fontFamily:'Georgia, serif',fontSize:28,fontWeight:700,color:DARK,marginBottom:6}}>Competitive Landscape</div>
          <div style={{fontSize:13,color:BODY_TEXT,marginBottom:24}}>All brands compared across all five KPIs. Differences of 8+ points with structural zone difference are directionally significant.</div>

          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13,marginBottom:24}}>
            <thead>
              <tr style={{background:DEEP}}>
                <th style={{textAlign:'left',padding:'12px 16px',color:WHITE,fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.1em'}}>Brand</th>
                {KPI_NAMES.map(k => <th key={k} style={{textAlign:'center',padding:'12px 10px',color:GOLD,fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.1em'}}>{k}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr style={{background:'rgba(201,168,76,0.06)',borderBottom:`2px solid ${GOLD}`}}>
                <td style={{padding:'14px 16px',fontWeight:700,color:DARK}}>
                  {brand?.brand_name} <span style={{fontSize:10,color:GOLD,fontWeight:400}}>you</span>
                </td>
                {KPI_NAMES.map(kpiName => {
                  const kpi = getBrandKpi(kpiName)
                  return (
                    <td key={kpiName} style={{textAlign:'center',padding:'14px 10px',fontWeight:700,color:DARK,fontFamily:'Georgia, serif',fontSize:16}}>
                      {kpi ? scoreDisplay(kpiName, kpi.score) : '--'}
                    </td>
                  )
                })}
              </tr>
              {competitors.map((comp, ci) => (
                <tr key={comp.id} style={{borderBottom:`1px solid ${BORDER}`,background:ci % 2 === 0 ? WHITE : '#fafafa'}}>
                  <td style={{padding:'12px 16px',color:BODY_TEXT}}>{comp.name}</td>
                  {KPI_NAMES.map(kpiName => {
                    const compKpi = getCompKpi(comp.id, kpiName)
                    const brandKpi = getBrandKpi(kpiName)
                    const diff = compKpi && brandKpi ? compKpi.score - brandKpi.score : null
                    const ahead = diff !== null && diff >= 8
                    const behind = diff !== null && diff <= -8
                    return (
                      <td key={kpiName} style={{textAlign:'center',padding:'12px 10px',color:ahead?RED:behind?GREEN:BODY_TEXT,fontWeight:ahead||behind?600:400,fontFamily:'Georgia, serif',fontSize:14}}>
                        {compKpi ? (
                          <div>
                            <div>{scoreDisplay(kpiName, compKpi.score)}</div>
                            {diff !== null && Math.abs(diff) >= 8 && (
                              <div style={{fontSize:9,color:ahead?RED:GREEN}}>{ahead?`+${diff}`:String(diff)}</div>
                            )}
                          </div>
                        ) : '--'}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{display:'flex',gap:24,fontSize:11,color:'#aaa'}}>
            <span><span style={{color:RED,fontWeight:600}}>Red scores</span> — competitor leads by 8+ points</span>
            <span><span style={{color:GREEN,fontWeight:600}}>Green scores</span> — you lead by 8+ points</span>
            <span>MMD threshold: 8 points</span>
          </div>
        </div>

        {/* KPI DEEP DIVES */}
        {KPI_NAMES.map((kpiName, index) => {
          const kpi = getBrandKpi(kpiName)
          const zoneColor = kpi ? ZONE_COLOR[kpi.zone] : '#ccc'
          const subBuckets = KPI_SUB_BUCKETS[kpiName]
          const maxScore = Math.max(kpi?.score || 0, ...competitors.map(c => getCompKpi(c.id, kpiName)?.score || 0), 50)
          return (
            <div key={kpiName} style={{padding:'48px 64px',borderBottom:'4px solid #f0f0f0',pageBreakAfter:'always'}}>
              {pageHeader(`${kpiName.charAt(0).toUpperCase() + kpiName.slice(1)} Deep Dive`)}

              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:24}}>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:GOLD,textTransform:'uppercase',letterSpacing:'0.2em',marginBottom:8}}>{kpiName}</div>
                  <div style={{fontFamily:'Georgia, serif',fontSize:64,fontWeight:700,color:DARK,lineHeight:1,marginBottom:8}}>
                    {kpi ? scoreDisplay(kpiName, kpi.score) : '--'}
                  </div>
                  <div style={{display:'flex',gap:16,alignItems:'center'}}>
                    <span style={{fontSize:13,fontWeight:600,color:zoneColor,padding:'3px 10px',background:`${zoneColor}15`,borderRadius:20}}>{kpi ? ZONE_LABEL[kpi.zone] : '--'}</span>
                    {kpi?.movement !== null && kpi?.movement !== undefined && (
                      <span style={{fontSize:13,color:kpi.movement > 0 ? GREEN : kpi.movement < 0 ? RED : AMBER,fontWeight:600}}>
                        {kpi.movement > 0 ? `↑ +${kpi.movement}` : kpi.movement < 0 ? `↓ ${kpi.movement}` : '→ Stable'} pts
                      </span>
                    )}
                    {kpi?.sources_count && <span style={{fontSize:11,color:'#aaa'}}>{kpi.sources_count} sources</span>}
                  </div>
                </div>
                <div style={{maxWidth:300,background:'#f9f9f9',borderRadius:8,padding:'16px',borderLeft:`4px solid ${zoneColor}`}}>
                  <div style={{fontSize:10,fontWeight:600,color:BODY_TEXT,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>What this measures</div>
                  <p style={{fontSize:12,color:BODY_TEXT,lineHeight:1.6,margin:0}}>{KPI_DESCRIPTION[kpiName]}</p>
                </div>
              </div>

              {subBuckets.length > 0 && (
                <div style={{marginBottom:24,padding:'16px',background:'#f9f9f9',borderRadius:8}}>
                  <div style={{fontSize:10,fontWeight:600,color:BODY_TEXT,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Signal breakdown</div>
                  <div style={{display:'flex',gap:20}}>
                    {subBuckets.map(sb => {
                      const val = kpi ? (kpi as any)[sb.key] : null
                      return (
                        <div key={sb.key} style={{display:'flex',alignItems:'center',gap:6}}>
                          <div style={{width:8,height:8,borderRadius:'50%',background:subBucketColor(val)}}/>
                          <span style={{fontSize:12,color:BODY_TEXT}}>{sb.label}</span>
                          {val !== null && val !== undefined && <span style={{fontSize:12,fontWeight:600,color:subBucketColor(val)}}>{val}</span>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {kpiName === 'buzz' && (kpi?.positive_keywords || kpi?.negative_keywords) && (
                <div style={{marginBottom:24,display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                  {kpi?.positive_keywords && (
                    <div style={{padding:'14px',background:'#f0faf5',borderRadius:8,border:'1px solid #b8e6d0'}}>
                      <div style={{fontSize:10,fontWeight:600,color:GREEN,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:10}}>Positive signals</div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                        {kpi.positive_keywords.split(',').map((w: string, i: number) => (
                          <span key={`pos-${i}`} style={{fontSize:Math.max(11, 20 - i * 1.2),fontWeight:i < 3 ? 700 : 400,color:GREEN,opacity:Math.max(0.5, 1 - i * 0.06)}}>{w.trim()}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {kpi?.negative_keywords && (
                    <div style={{padding:'14px',background:'#fdf0f0',borderRadius:8,border:'1px solid #f5b8b8'}}>
                      <div style={{fontSize:10,fontWeight:600,color:RED,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:10}}>Negative signals</div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                        {kpi.negative_keywords.split(',').map((w: string, i: number) => (
                          <span key={`neg-${i}`} style={{fontSize:Math.max(11, 20 - i * 1.2),fontWeight:i < 3 ? 700 : 400,color:RED,opacity:Math.max(0.5, 1 - i * 0.06)}}>{w.trim()}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div style={{marginBottom:24}}>
                <div style={{fontSize:10,fontWeight:600,color:BODY_TEXT,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Brand vs competition</div>
                <div style={{marginBottom:8}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                    <span style={{fontSize:12,fontWeight:700,color:DARK}}>{brand?.brand_name} <span style={{color:GOLD,fontSize:10}}>you</span></span>
                    <span style={{fontSize:12,fontWeight:700,color:DARK}}>{kpi ? scoreDisplay(kpiName, kpi.score) : '--'}</span>
                  </div>
                  <div style={{height:10,background:'#e8e8e8',borderRadius:5,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${((kpi?.score || 0) / maxScore) * 100}%`,background:GOLD,borderRadius:5}}/>
                  </div>
                </div>
                {competitors.map(comp => {
                  const compKpi = getCompKpi(comp.id, kpiName)
                  const diff = compKpi && kpi ? compKpi.score - kpi.score : null
                  const ahead = diff !== null && diff >= 8
                  return (
                    <div key={comp.id} style={{marginBottom:8}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                        <span style={{fontSize:12,color:BODY_TEXT}}>{comp.name}</span>
                        <div style={{display:'flex',gap:8,alignItems:'center'}}>
                          {diff !== null && Math.abs(diff) >= 8 && (
                            <span style={{fontWeight:600,fontSize:10,color:ahead?RED:GREEN}}>
                              {ahead ? `+${diff} ahead` : `${diff} behind`}
                            </span>
                          )}
                          <span style={{fontSize:12,color:BODY_TEXT}}>{compKpi ? scoreDisplay(kpiName, compKpi.score) : '--'}</span>
                        </div>
                      </div>
                      <div style={{height:8,background:'#e8e8e8',borderRadius:5,overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${((compKpi?.score || 0) / maxScore) * 100}%`,background:ahead?RED:'#b8d4b8',borderRadius:5}}/>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={{borderLeft:`4px solid ${GOLD}`,paddingLeft:16,background:'rgba(201,168,76,0.04)',padding:'14px 16px',borderRadius:'0 8px 8px 0'}}>
                <div style={{fontSize:10,fontWeight:700,color:GOLD,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>Priority action</div>
                <p style={{fontSize:13,color:DARK,lineHeight:1.6,margin:0}}>{KPI_ACTION[kpiName]}</p>
              </div>

              <div style={{marginTop:32,paddingTop:12,borderTop:`1px solid ${BORDER}`,display:'flex',justifyContent:'space-between',fontSize:10,color:'#bbb'}}>
                <span>King Solomon — Confidential</span>
                <span>Page {index + 4} of 9</span>
              </div>
            </div>
          )
        })}

        {/* STRATEGIC PRIORITIES */}
        <div style={{padding:'48px 64px'}}>
          {pageHeader('Strategic Priorities')}
          <div style={{fontFamily:'Georgia, serif',fontSize:28,fontWeight:700,color:DARK,marginBottom:6}}>Strategic Priorities</div>
          <div style={{fontSize:13,color:BODY_TEXT,marginBottom:32}}>Recommended actions ranked by commercial impact — {reportDate}</div>

          {KPI_NAMES.map((kpiName, i) => {
            const kpi = getBrandKpi(kpiName)
            const zoneColor = kpi ? ZONE_COLOR[kpi.zone] : '#ccc'
            return (
              <div key={kpiName} style={{marginBottom:20,padding:'16px 20px',borderRadius:8,background:'#f9f9f9',borderLeft:`4px solid ${zoneColor}`}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <span style={{fontSize:10,fontWeight:700,color:GOLD,textTransform:'uppercase',letterSpacing:'0.15em'}}>{kpiName}</span>
                    <span style={{fontSize:12,fontWeight:700,color:zoneColor}}>{kpi ? scoreDisplay(kpiName, kpi.score) : '--'} — {kpi ? ZONE_LABEL[kpi.zone] : '--'}</span>
                  </div>
                  <span style={{fontSize:10,color:'#aaa'}}>Priority {i + 1}</span>
                </div>
                <p style={{fontSize:13,color:DARK,lineHeight:1.6,margin:0}}>{KPI_ACTION[kpiName]}</p>
              </div>
            )
          })}

          {verdict?.risk_flags && verdict.risk_flags.length > 0 && (
            <div style={{marginTop:24,padding:'16px 20px',borderRadius:8,background:'rgba(192,57,43,0.05)',border:'1px solid rgba(192,57,43,0.2)'}}>
              <div style={{fontSize:10,fontWeight:700,color:RED,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:10}}>Risk flags</div>
              {verdict.risk_flags.map((flag: string, i: number) => (
                <div key={i} style={{fontSize:13,color:RED,marginBottom:4}}>⚠ {flag}</div>
              ))}
            </div>
          )}

          <div style={{marginTop:48,padding:'20px 24px',background:DEEP,borderRadius:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.5)'}}>Generated by King Solomon · kingsolomonhq.com</div>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.5)'}}>Confidential — {reportDate}</div>
          </div>
        </div>

      </div>
    </div>
  )
}