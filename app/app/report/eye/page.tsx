'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const GOLD = '#C9A84C'
const DEEP = '#0F2318'
const MID_GREEN = '#1F4A2F'
const WHITE = '#ffffff'
const DARK = '#1a1a1a'
const BODY_TEXT = '#444444'
const BORDER = '#e8e8e8'
const GREEN = '#2d8a5e'
const RED = '#c0392b'
const AMBER = '#d4890a'
const CREAM = '#FAF7F2'

const CX_THEMES = ['Product', 'Experience', 'Customer Service', 'Pricing', 'Collections'] as const

const THEME_DESCRIPTION: Record<string, string> = {
  'Product': 'Measures customer sentiment around product quality, ingredients, packaging, effectiveness and overall product experience.',
  'Experience': 'Tracks sentiment around the end-to-end brand experience — app, website, checkout, delivery and ease of interaction.',
  'Customer Service': 'Reflects post-purchase support sentiment — response quality, resolution speed, returns and complaint handling.',
  'Pricing': 'Captures consumer perception of value for money, pricing fairness, discount expectations and subscription clarity.',
  'Collections': 'Measures satisfaction with product range, variety, availability, new launches and category breadth.',
}

const THEME_ACTION: Record<string, string> = {
  'Product': 'Review top negative product keywords and cross-reference with R&D and QC teams within 30 days.',
  'Experience': 'Audit the top 3 friction points in the purchase and post-purchase journey — focus on the highest dropout touchpoints.',
  'Customer Service': 'Implement a 24-hour first response SLA for all negative reviews and complaints across platforms.',
  'Pricing': 'Conduct a competitive price-value audit and ensure first-purchase value propositions are clearly communicated.',
  'Collections': 'Review out-of-stock patterns and new launch communication — ensure range awareness matches availability.',
}

function npsColor(score: number | null, benchmark: number) {
  if (score === null) return '#ccc'
  if (score >= benchmark) return GREEN
  if (score >= benchmark - 15) return AMBER
  return RED
}

export default function EyeReportPage() {
  const [brand, setBrand] = useState<any>(null)
  const [audit, setAudit] = useState<any>(null)
  const [themes, setThemes] = useState<any[]>([])
  const [cxVerdict, setCxVerdict] = useState<any>(null)
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
      if (!brandData.eye_report_ready) { router.push('/dashboard'); return }
      setBrand(brandData)
      const { data: auditData } = await supabase.from('cx_audits')
        .select('*').eq('brand_id', brandData.id).eq('status', 'published')
        .order('created_at', { ascending: false }).limit(1).maybeSingle()
      if (auditData) {
        setAudit(auditData)
        const { data: themeData } = await supabase.from('cx_theme_scores').select('*').eq('audit_id', auditData.id)
        if (themeData) setThemes(themeData)
        const { data: verdictData } = await supabase.from('cx_verdicts').select('*').eq('audit_id', auditData.id).maybeSingle()
        if (verdictData) setCxVerdict(verdictData)
      }
      setLoading(false)
    }
    init()
  }, [])

  const getTheme = (name: string) => themes.find(t => t.theme === name)

  const handleDownload = async () => {
    if (!reportRef.current) return
    setDownloading(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const jsPDF = (await import('jspdf')).default
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: CREAM, windowWidth: 1200 })
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
      pdf.save(`${brand?.brand_name || 'brand'}-Eye-report-${new Date().toISOString().slice(0,10)}.pdf`)
    } catch (e) { console.error('PDF error:', e) }
    setDownloading(false)
  }

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:DEEP}}>
      <div style={{color:GOLD,fontSize:16}}>Preparing your CX audit report...</div>
    </div>
  )

  const reportDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  const totalNeg = themes.reduce((s, t) => s + (t.negative_signal_count || 0), 0)
  const totalPos = themes.reduce((s, t) => s + (t.positive_signal_count || 0), 0)
  const totalSig = totalPos + totalNeg
  const sortedByNeg = [...themes].sort((a, b) => (b.negative_signal_count || 0) - (a.negative_signal_count || 0))
  const allPosKeywords = [...new Set(themes.flatMap(t => (t.positive_keywords || '').split(',').map((w: string) => w.trim()).filter(Boolean)))].slice(0, 15)
  const allNegKeywords = [...new Set(themes.flatMap(t => (t.negative_keywords || '').split(',').map((w: string) => w.trim()).filter(Boolean)))].slice(0, 15)

  const pageHeader = (title: string) => (
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:32,paddingBottom:12,borderBottom:`2px solid ${MID_GREEN}`}}>
      <div style={{fontFamily:'Georgia, serif',fontSize:11,color:MID_GREEN,fontWeight:700,letterSpacing:'0.15em',textTransform:'uppercase'}}>King Solomon — {brand?.brand_name}</div>
      <div style={{fontSize:11,color:'#aaa'}}>{title}</div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#d8d5d0',padding:'32px 0'}}>
      <div style={{maxWidth:900,margin:'0 auto 24px',display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0 16px'}}>
        <button onClick={() => router.push('/dashboard')} style={{fontSize:13,color:DARK,background:'none',border:'none',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>← Back to dashboard</button>
        <button onClick={handleDownload} disabled={downloading} style={{padding:'10px 24px',background:GOLD,color:DEEP,border:'none',borderRadius:8,fontSize:14,fontWeight:600,cursor:downloading?'not-allowed':'pointer',fontFamily:'Inter,sans-serif'}}>
          {downloading ? '⏳ Generating PDF...' : '⬇ Download PDF'}
        </button>
      </div>

      <div ref={reportRef} style={{maxWidth:900,margin:'0 auto',background:CREAM,fontFamily:'Inter, sans-serif'}}>

        {/* COVER */}
        <div style={{background:WHITE,minHeight:400,padding:'80px 64px',display:'flex',flexDirection:'column',justifyContent:'space-between',pageBreakAfter:'always',borderBottom:`8px solid ${MID_GREEN}`}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <svg width="32" height="26" viewBox="0 0 56 44" fill="none"><path d="M4 36L12 14L22 26L28 6L34 26L44 14L52 36H4Z" fill="#C9A84C"/><rect x="4" y="36" width="48" height="6" rx="2" fill="#A07830"/></svg>
            <div style={{fontFamily:'Georgia, serif',fontSize:14,fontWeight:700,color:DEEP,letterSpacing:'0.15em'}}>KING SOLOMON</div>
          </div>
          <div>
            <div style={{fontSize:11,color:MID_GREEN,fontWeight:600,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:16}}>CX Audit Report</div>
            <div style={{fontFamily:'Georgia, serif',fontSize:48,fontWeight:700,color:DARK,lineHeight:1.1,marginBottom:8}}>{brand?.brand_name}</div>
            <div style={{fontSize:16,color:BODY_TEXT,marginBottom:48}}>{brand?.category}</div>
            <div style={{display:'flex',gap:32}}>
              {[
                {label:'Audit type', val:'Secondary'},
                {label:'Benchmark', val:audit?.benchmark || 45},
                {label:'Generated', val:reportDate},
                {label:'Total signals', val:audit?.total_signals?.toLocaleString() || '--'},
              ].map(f => (
                <div key={f.label}>
                  <div style={{fontSize:10,color:'#aaa',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4}}>{f.label}</div>
                  <div style={{fontSize:13,color:DARK}}>{f.val}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{fontSize:11,color:'#aaa'}}>Confidential — Prepared exclusively for {brand?.brand_name}</div>
        </div>

        {/* CX HEALTH OVERVIEW */}
        <div style={{padding:'48px 64px',borderBottom:'4px solid #e0dbd4',pageBreakAfter:'always'}}>
          {pageHeader('CX Health Overview')}
          <div style={{fontFamily:'Georgia, serif',fontSize:28,fontWeight:700,color:DARK,marginBottom:6}}>CX Health Overview</div>
          <div style={{fontSize:13,color:BODY_TEXT,marginBottom:32}}>Overall customer experience performance against benchmark — {reportDate}</div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginBottom:32}}>
            {[
              {label:'Overall CX NPS', val: audit?.overall_cx_nps !== null ? (audit.overall_cx_nps > 0 ? `+${audit.overall_cx_nps}` : String(audit.overall_cx_nps)) : '--', color: npsColor(audit?.overall_cx_nps, audit?.benchmark || 45)},
              {label:'Benchmark', val: String(audit?.benchmark || 45), color: BODY_TEXT},
              {label:'Total signals', val: audit?.total_signals?.toLocaleString() || '--', color: DARK},
            ].map(f => (
              <div key={f.label} style={{padding:'20px',background:WHITE,borderRadius:8,textAlign:'center',border:`1px solid ${BORDER}`}}>
                <div style={{fontSize:10,fontWeight:600,color:MID_GREEN,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>{f.label}</div>
                <div style={{fontFamily:'Georgia, serif',fontSize:40,fontWeight:700,color:f.color,lineHeight:1}}>{f.val}</div>
              </div>
            ))}
          </div>

          {totalSig > 0 && (
            <div style={{background:WHITE,borderRadius:8,padding:'20px',marginBottom:24,border:`1px solid ${BORDER}`}}>
              <div style={{fontSize:10,fontWeight:600,color:BODY_TEXT,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Signal distribution</div>
              <div style={{display:'flex',gap:24,marginBottom:12}}>
                <span style={{fontSize:13,color:GREEN,fontWeight:600}}>✓ {totalPos} positive ({Math.round(totalPos/totalSig*100)}%)</span>
                <span style={{fontSize:13,color:RED,fontWeight:600}}>✗ {totalNeg} negative ({Math.round(totalNeg/totalSig*100)}%)</span>
              </div>
              <div style={{height:12,borderRadius:6,background:'#e8e8e8',overflow:'hidden',marginBottom:16}}>
                <div style={{height:'100%',width:`${(totalPos/totalSig*100)}%`,background:GREEN,borderRadius:6}}/>
              </div>
              <div style={{fontSize:10,fontWeight:600,color:'#aaa',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8}}>Negative signal contribution by theme</div>
              {sortedByNeg.filter(t => (t.negative_signal_count || 0) > 0).map(t => {
                const pct = totalNeg > 0 ? Math.round((t.negative_signal_count || 0) / totalNeg * 100) : 0
                return (
                  <div key={t.theme} style={{marginBottom:8}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                      <span style={{fontSize:12,color:DARK}}>{t.theme}</span>
                      <span style={{fontSize:12,color:RED,fontWeight:600}}>{pct}% ({t.negative_signal_count} signals)</span>
                    </div>
                    <div style={{height:6,borderRadius:3,background:'#e8e8e8',overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${pct}%`,background:RED,borderRadius:3}}/>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {cxVerdict?.narrative && (
            <div style={{background:'rgba(31,74,47,0.06)',border:'1px solid rgba(31,74,47,0.2)',borderRadius:8,padding:'20px 24px'}}>
              <div style={{fontSize:10,fontWeight:700,color:MID_GREEN,textTransform:'uppercase',letterSpacing:'0.15em',marginBottom:12}}>Solomon&apos;s Eye Verdict</div>
              <p style={{fontFamily:'Georgia, serif',fontSize:15,color:DARK,lineHeight:1.8,fontStyle:'italic',margin:0}}>&ldquo;{cxVerdict.narrative}&rdquo;</p>
            </div>
          )}
        </div>

        {/* THEME OVERVIEW */}
        <div style={{padding:'48px 64px',borderBottom:'4px solid #e0dbd4',pageBreakAfter:'always'}}>
          {pageHeader('Theme Overview')}
          <div style={{fontFamily:'Georgia, serif',fontSize:28,fontWeight:700,color:DARK,marginBottom:6}}>CX Theme Overview</div>
          <div style={{fontSize:13,color:BODY_TEXT,marginBottom:24}}>All five CX themes — NPS, sentiment and signal volume</div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:32}}>
            {CX_THEMES.map(themeName => {
              const t = getTheme(themeName)
              const color = t ? npsColor(t.nps_score, audit?.benchmark || 45) : '#ccc'
              return (
                <div key={themeName} style={{padding:'16px 12px',borderRadius:8,background:WHITE,borderTop:`4px solid ${color}`,textAlign:'center',border:`1px solid ${BORDER}`}}>
                  <div style={{fontSize:9,fontWeight:700,color:GOLD,textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:8}}>{themeName}</div>
                  <div style={{fontFamily:'Georgia, serif',fontSize:30,fontWeight:700,color,marginBottom:4}}>
                    {t?.nps_score !== null && t?.nps_score !== undefined ? (t.nps_score > 0 ? `+${t.nps_score}` : String(t.nps_score)) : '--'}
                  </div>
                  <div style={{fontSize:10,color:BODY_TEXT,textTransform:'capitalize',marginBottom:4}}>{t?.sentiment || '--'}</div>
                  {t?.dropout_rate !== null && t?.dropout_rate !== undefined && (
                    <div style={{fontSize:10,color:t.dropout_rate > 20 ? RED : '#aaa'}}>{t.dropout_rate}% drop-off</div>
                  )}
                  {t && <div style={{fontSize:9,color:'#aaa',marginTop:4}}>+{t.positive_signal_count||0} / -{t.negative_signal_count||0}</div>}
                </div>
              )
            })}
          </div>

          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr style={{background:MID_GREEN}}>
                {['Theme','NPS','Benchmark','Gap','Sentiment','Signals','Drop-off','Top Concern'].map(h => (
                  <th key={h} style={{textAlign:'left',padding:'10px 12px',color:WHITE,fontSize:10,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CX_THEMES.map((themeName, i) => {
                const t = getTheme(themeName)
                const color = t ? npsColor(t.nps_score, audit?.benchmark || 45) : '#ccc'
                const gap = t?.nps_score !== null && t?.nps_score !== undefined ? t.nps_score - (audit?.benchmark || 45) : null
                return (
                  <tr key={themeName} style={{borderBottom:`1px solid ${BORDER}`,background: i % 2 === 0 ? WHITE : '#f5f2ee'}}>
                    <td style={{padding:'10px 12px',fontWeight:600,color:DARK}}>{themeName}</td>
                    <td style={{padding:'10px 12px',fontWeight:700,color,fontFamily:'Georgia, serif',fontSize:14}}>{t?.nps_score !== null && t?.nps_score !== undefined ? (t.nps_score > 0 ? `+${t.nps_score}` : t.nps_score) : '--'}</td>
                    <td style={{padding:'10px 12px',color:BODY_TEXT}}>{audit?.benchmark || 45}</td>
                    <td style={{padding:'10px 12px',fontWeight:600,color:gap !== null ? (gap >= 0 ? GREEN : RED) : '#aaa'}}>{gap !== null ? (gap > 0 ? `+${gap}` : String(gap)) : '--'}</td>
                    <td style={{padding:'10px 12px',color:BODY_TEXT,textTransform:'capitalize'}}>{t?.sentiment || '--'}</td>
                    <td style={{padding:'10px 12px',color:BODY_TEXT}}>{t?.signal_count || '--'}</td>
                    <td style={{padding:'10px 12px',color:t?.dropout_rate > 20 ? RED : BODY_TEXT}}>{t?.dropout_rate !== null && t?.dropout_rate !== undefined ? `${t.dropout_rate}%` : '--'}</td>
                    <td style={{padding:'10px 12px',color:'#aaa',fontSize:11}}>{t?.top_concern || '--'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* THEME DEEP DIVES */}
        {CX_THEMES.map((themeName, index) => {
          const t = getTheme(themeName)
          const color = t ? npsColor(t.nps_score, audit?.benchmark || 45) : '#ccc'
          const gap = t?.nps_score !== null && t?.nps_score !== undefined ? t.nps_score - (audit?.benchmark || 45) : null
          return (
            <div key={themeName} style={{padding:'48px 64px',borderBottom:'4px solid #e0dbd4',pageBreakAfter:'always'}}>
              {pageHeader(`${themeName} Deep Dive`)}
              <div style={{borderTop:`6px solid ${color}`,paddingTop:20,marginBottom:24}}>
                <div style={{fontSize:10,fontWeight:700,color:GOLD,textTransform:'uppercase',letterSpacing:'0.2em',marginBottom:8}}>{themeName}</div>
                <div style={{display:'flex',alignItems:'baseline',gap:16,marginBottom:8}}>
                  <div style={{fontFamily:'Georgia, serif',fontSize:64,fontWeight:700,color,lineHeight:1}}>
                    {t?.nps_score !== null && t?.nps_score !== undefined ? (t.nps_score > 0 ? `+${t.nps_score}` : String(t.nps_score)) : '--'}
                  </div>
                  <div>
                    <div style={{fontSize:13,color:BODY_TEXT,marginBottom:4}}>vs benchmark <strong style={{color}}>{audit?.benchmark || 45}</strong></div>
                    {gap !== null && <div style={{fontSize:13,fontWeight:600,color:gap >= 0 ? GREEN : RED}}>{gap >= 0 ? `+${gap} above benchmark` : `${gap} below benchmark`}</div>}
                  </div>
                </div>
                <div style={{display:'flex',gap:20}}>
                  <span style={{fontSize:12,color:BODY_TEXT,textTransform:'capitalize'}}>Sentiment: <strong>{t?.sentiment || '--'}</strong></span>
                  <span style={{fontSize:12,color:BODY_TEXT}}>Signals: <strong>{t?.signal_count || '--'}</strong></span>
                  <span style={{fontSize:12,color:t?.dropout_rate > 20 ? RED : BODY_TEXT}}>Drop-off: <strong>{t?.dropout_rate !== null && t?.dropout_rate !== undefined ? `${t.dropout_rate}%` : '--'}</strong></span>
                </div>
              </div>

              <div style={{background:WHITE,borderRadius:8,padding:'16px',marginBottom:20,border:`1px solid ${BORDER}`}}>
                <div style={{fontSize:10,fontWeight:600,color:BODY_TEXT,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>What this measures</div>
                <p style={{fontSize:13,color:BODY_TEXT,lineHeight:1.6,margin:0}}>{THEME_DESCRIPTION[themeName]}</p>
              </div>

              {t?.top_concern && (
                <div style={{background:'rgba(192,57,43,0.05)',border:'1px solid rgba(192,57,43,0.2)',borderRadius:8,padding:'14px 16px',marginBottom:20}}>
                  <div style={{fontSize:10,fontWeight:600,color:RED,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>Top concern signal</div>
                  <p style={{fontSize:13,color:RED,margin:0}}>{t.top_concern}</p>
                </div>
              )}

              {(t?.positive_keywords || t?.negative_keywords) && (
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
                  {t?.positive_keywords && (
                    <div style={{padding:'14px',background:'#f0faf5',borderRadius:8,border:'1px solid #b8e6d0'}}>
                      <div style={{fontSize:10,fontWeight:600,color:GREEN,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:10}}>Positive keywords</div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                        {t.positive_keywords.split(',').map((w: string, i: number) => (
                          <span key={`pos-${i}`} style={{fontSize:Math.max(10, 18 - i),fontWeight:i < 3 ? 700 : 400,color:GREEN,opacity:Math.max(0.5, 1 - i * 0.06)}}>{w.trim()}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {t?.negative_keywords && (
                    <div style={{padding:'14px',background:'#fdf0f0',borderRadius:8,border:'1px solid #f5b8b8'}}>
                      <div style={{fontSize:10,fontWeight:600,color:RED,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:10}}>Negative keywords</div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                        {t.negative_keywords.split(',').map((w: string, i: number) => (
                          <span key={`neg-${i}`} style={{fontSize:Math.max(10, 18 - i),fontWeight:i < 3 ? 700 : 400,color:RED,opacity:Math.max(0.5, 1 - i * 0.06)}}>{w.trim()}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div style={{borderLeft:`4px solid ${MID_GREEN}`,paddingLeft:16,background:'rgba(31,74,47,0.04)',padding:'14px 16px',borderRadius:'0 8px 8px 0'}}>
                <div style={{fontSize:10,fontWeight:700,color:MID_GREEN,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>Priority action</div>
                <p style={{fontSize:13,color:DARK,lineHeight:1.6,margin:0}}>{THEME_ACTION[themeName]}</p>
              </div>

              <div style={{marginTop:32,paddingTop:12,borderTop:`1px solid ${BORDER}`,display:'flex',justifyContent:'space-between',fontSize:10,color:'#bbb'}}>
                <span>King Solomon — Confidential</span>
                <span>Page {index + 4} of 10</span>
              </div>
            </div>
          )
        })}

        {/* CONSUMER SIGNAL KEYWORDS */}
        <div style={{padding:'48px 64px',borderBottom:'4px solid #e0dbd4',pageBreakAfter:'always'}}>
          {pageHeader('Consumer Signal Keywords')}
          <div style={{fontFamily:'Georgia, serif',fontSize:28,fontWeight:700,color:DARK,marginBottom:6}}>Consumer Signal Keywords</div>
          <div style={{fontSize:13,color:BODY_TEXT,marginBottom:32}}>Aggregated keywords across all CX themes — sized by frequency</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
            {allPosKeywords.length > 0 && (
              <div style={{padding:'24px',background:WHITE,borderRadius:8,border:'1px solid #b8e6d0'}}>
                <div style={{fontSize:11,fontWeight:700,color:GREEN,textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:16}}>What customers love</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:8,lineHeight:2}}>
                  {allPosKeywords.map((word, i) => (
                    <span key={`allpos-${i}`} style={{fontSize:Math.max(12, 28 - i * 1.2),fontWeight:i < 3 ? 700 : i < 6 ? 600 : 400,color:GREEN,opacity:Math.max(0.4, 1 - i * 0.04)}}>{word}</span>
                  ))}
                </div>
              </div>
            )}
            {allNegKeywords.length > 0 && (
              <div style={{padding:'24px',background:WHITE,borderRadius:8,border:'1px solid #f5b8b8'}}>
                <div style={{fontSize:11,fontWeight:700,color:RED,textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:16}}>What customers complain about</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:8,lineHeight:2}}>
                  {allNegKeywords.map((word, i) => (
                    <span key={`allneg-${i}`} style={{fontSize:Math.max(12, 28 - i * 1.2),fontWeight:i < 3 ? 700 : i < 6 ? 600 : 400,color:RED,opacity:Math.max(0.4, 1 - i * 0.04)}}>{word}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PRIORITY ACTIONS */}
        <div style={{padding:'48px 64px'}}>
          {pageHeader('Priority Actions')}
          <div style={{fontFamily:'Georgia, serif',fontSize:28,fontWeight:700,color:DARK,marginBottom:6}}>Priority Actions</div>
          <div style={{fontSize:13,color:BODY_TEXT,marginBottom:32}}>Recommended CX interventions ranked by negative signal contribution</div>

          {sortedByNeg.map((t, i) => {
            const color = npsColor(t.nps_score, audit?.benchmark || 45)
            const negPct = totalNeg > 0 ? Math.round((t.negative_signal_count || 0) / totalNeg * 100) : 0
            return (
              <div key={`action-${i}`} style={{marginBottom:16,padding:'16px 20px',borderRadius:8,background:WHITE,border:`1px solid ${BORDER}`,borderLeft:`4px solid ${color}`}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <span style={{fontSize:10,fontWeight:700,color:GOLD,textTransform:'uppercase',letterSpacing:'0.15em'}}>{t.theme}</span>
                    <span style={{fontSize:12,fontWeight:700,color}}>NPS {t.nps_score > 0 ? `+${t.nps_score}` : t.nps_score}</span>
                  </div>
                  <span style={{fontSize:11,color:RED,fontWeight:600}}>{negPct}% of negative signals</span>
                </div>
                <p style={{fontSize:13,color:DARK,lineHeight:1.6,margin:0}}>{THEME_ACTION[t.theme]}</p>
              </div>
            )
          })}

          {cxVerdict?.narrative && (
            <div style={{marginTop:24,background:'rgba(31,74,47,0.06)',border:'1px solid rgba(31,74,47,0.2)',borderRadius:8,padding:'20px 24px'}}>
              <div style={{fontSize:10,fontWeight:700,color:MID_GREEN,textTransform:'uppercase',letterSpacing:'0.15em',marginBottom:12}}>Solomon&apos;s Eye Verdict</div>
              <p style={{fontFamily:'Georgia, serif',fontSize:15,color:DARK,lineHeight:1.8,fontStyle:'italic',margin:0}}>&ldquo;{cxVerdict.narrative}&rdquo;</p>
            </div>
          )}

          <div style={{marginTop:48,padding:'20px 24px',background:MID_GREEN,borderRadius:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.5)'}}>Generated by King Solomon · kingsolomonhq.com</div>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.5)'}}>Confidential — {reportDate}</div>
          </div>
        </div>

      </div>
    </div>
  )
}