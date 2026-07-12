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
const KPI_NAMES = ['awareness', 'consideration', 'usage', 'imagery', 'buzz']
const CX_THEMES = ['Product', 'Experience', 'Customer Service', 'Pricing', 'Collections']

type Section = 'payments' | 'clients' | 'approval' | 'upload' | 'scraper'
type Decision = 'approve' | 'reject' | null

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [section, setSection] = useState<Section>('payments')
  const [orders, setOrders] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [pendingKpis, setPendingKpis] = useState<any[]>([])
  const [pendingAudits, setPendingAudits] = useState<any[]>([])
  const [auditThemes, setAuditThemes] = useState<Record<string, any[]>>({})
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [clientOrders, setClientOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [scraperInstructions, setScraperInstructions] = useState<Record<string, string>>({})
  const [kpiDecisions, setKpiDecisions] = useState<Record<string, Decision>>({})
  const [kpiInstructions, setKpiInstructions] = useState<Record<string, string>>({})
  const [themeDecisions, setThemeDecisions] = useState<Record<string, Decision>>({})
  const [themeInstructions, setThemeInstructions] = useState<Record<string, string>>({})

  // CSV upload state
  const [csvText, setCsvText] = useState('')
  const [csvBrandId, setCsvBrandId] = useState('')
  const [csvCheckpoint, setCsvCheckpoint] = useState('current')
  const [csvPreview, setCsvPreview] = useState<any[]>([])
  const [csvUploading, setCsvUploading] = useState(false)

  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  const headers = {
    'Content-Type': 'application/json',
    'apikey': anon,
    'Authorization': `Bearer ${anon}`,
  }

  const fetchOrders = async () => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?select=*&order=created_at.desc`, { headers })
    const data = await res.json()
    setOrders(Array.isArray(data) ? data : [])
  }

  const fetchBrands = async () => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/brands?select=*&order=created_at.desc`, { headers })
    const data = await res.json()
    setBrands(Array.isArray(data) ? data : [])
  }

  const fetchPendingKpis = async () => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/kpi_snapshots?select=*&status=eq.pending_review&snapshot_type=eq.brand_level&competitor_id=is.null&order=created_at.desc`, { headers })
    const data = await res.json()
    setPendingKpis(Array.isArray(data) ? data : [])
  }

  const fetchPendingAudits = async () => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/cx_audits?select=*&status=eq.pending_review&order=created_at.desc`, { headers })
    const data = await res.json()
    const audits = Array.isArray(data) ? data : []
    setPendingAudits(audits)
    for (const audit of audits) {
      const tRes = await fetch(`${SUPABASE_URL}/rest/v1/cx_theme_scores?audit_id=eq.${audit.id}&select=*`, { headers })
      const tData = await tRes.json()
      setAuditThemes(prev => ({ ...prev, [audit.id]: Array.isArray(tData) ? tData : [] }))
    }
  }

  const fetchClientOrders = async (userId: string) => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?user_id=eq.${userId}&select=*&order=created_at.desc`, { headers })
    const data = await res.json()
    setClientOrders(Array.isArray(data) ? data : [])
  }

  useEffect(() => {
    if (authed) {
      fetchOrders()
      fetchBrands()
      fetchPendingKpis()
      fetchPendingAudits()
    }
  }, [authed])

  const getBrandName = (brandId: string) => brands.find(b => b.id === brandId)?.brand_name || brandId.slice(0, 8)

  const markPaid = async (orderId: string) => {
    await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`, {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ status: 'paid' })
    })
    setMsg('✅ Order marked as paid.')
    fetchOrders()
  }

  const groupedKpis = pendingKpis.reduce((acc: any, kpi: any) => {
    const key = `${kpi.brand_id}__${kpi.checkpoint}`
    if (!acc[key]) acc[key] = { brand_id: kpi.brand_id, checkpoint: kpi.checkpoint, date: kpi.created_at, kpis: [] }
    acc[key].kpis.push(kpi)
    return acc
  }, {})
  const brandGroups = Object.values(groupedKpis) as any[]

  const submitBrandDecisions = async (group: any) => {
    setLoading(true)
    setMsg('')
    const { brand_id, kpis } = group
    let approvedCount = 0
    let rejectedCount = 0
    for (const kpi of kpis) {
      const decision = kpiDecisions[kpi.id]
      if (decision === 'approve') {
        await fetch(`${SUPABASE_URL}/rest/v1/kpi_snapshots?id=eq.${kpi.id}`, {
          method: 'PATCH',
          headers: { ...headers, 'Prefer': 'return=minimal' },
          body: JSON.stringify({ status: 'published', approved_at: new Date().toISOString() })
        })
        approvedCount++
      } else if (decision === 'reject') {
        const instruction = kpiInstructions[kpi.id] || ''
        await fetch(`${SUPABASE_URL}/rest/v1/kpi_snapshots?id=eq.${kpi.id}`, {
          method: 'PATCH',
          headers: { ...headers, 'Prefer': 'return=minimal' },
          body: JSON.stringify({ status: 'rejected', rejection_note: instruction, scraper_instruction: instruction })
        })
        rejectedCount++
      }
    }
    if (rejectedCount === 0 && approvedCount > 0) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/kpi_snapshots?brand_id=eq.${brand_id}&status=eq.pending_review&competitor_id=is.null&select=id`, { headers })
      const remaining = await res.json()
      if (Array.isArray(remaining) && remaining.length === 0) {
        await fetch(`${SUPABASE_URL}/rest/v1/brands?id=eq.${brand_id}`, {
          method: 'PATCH',
          headers: { ...headers, 'Prefer': 'return=minimal' },
          body: JSON.stringify({ iq_report_ready: true })
        })
        setMsg('✅ All KPIs approved. IQ report unlocked for client.')
      } else {
        setMsg(`✅ ${approvedCount} KPI${approvedCount > 1 ? 's' : ''} approved and published.`)
      }
    } else {
      setMsg(`✅ ${approvedCount} approved, ${rejectedCount} flagged for re-scrape.`)
    }
    setKpiDecisions({})
    setKpiInstructions({})
    fetchPendingKpis()
    setLoading(false)
  }

  const submitAuditDecisions = async (audit: any) => {
    setLoading(true)
    setMsg('')
    const themes = auditThemes[audit.id] || []
    let approvedCount = 0
    let rejectedCount = 0
    for (const theme of themes) {
      const decision = themeDecisions[theme.id]
      if (decision === 'approve') {
        await fetch(`${SUPABASE_URL}/rest/v1/cx_theme_scores?id=eq.${theme.id}`, {
          method: 'PATCH',
          headers: { ...headers, 'Prefer': 'return=minimal' },
          body: JSON.stringify({ confidence: 'approved' })
        })
        approvedCount++
      } else if (decision === 'reject') {
        await fetch(`${SUPABASE_URL}/rest/v1/cx_theme_scores?id=eq.${theme.id}`, {
          method: 'PATCH',
          headers: { ...headers, 'Prefer': 'return=minimal' },
          body: JSON.stringify({ confidence: 'rejected', top_concern: themeInstructions[theme.id] || '' })
        })
        rejectedCount++
      }
    }
    if (rejectedCount === 0 && approvedCount > 0) {
      await fetch(`${SUPABASE_URL}/rest/v1/cx_audits?id=eq.${audit.id}`, {
        method: 'PATCH',
        headers: { ...headers, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ status: 'published' })
      })
      await fetch(`${SUPABASE_URL}/rest/v1/brands?id=eq.${audit.brand_id}`, {
        method: 'PATCH',
        headers: { ...headers, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ eye_report_ready: true })
      })
      setMsg('✅ All themes approved. Eye dashboard and report unlocked for client.')
    } else {
      setMsg(`✅ ${approvedCount} themes approved, ${rejectedCount} flagged for re-scrape.`)
    }
    setThemeDecisions({})
    setThemeInstructions({})
    fetchPendingAudits()
    setLoading(false)
  }

  // CSV parser
  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n').filter(l => l.trim())
    if (lines.length < 2) return []
    const headerLine = lines[0].toLowerCase().replace(/\s/g, '')
    const headers_csv = headerLine.split(',')
    const rows = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
      const row: any = {}
      headers_csv.forEach((h, idx) => { row[h] = values[idx] || '' })
      if (row.kpi_name && row.score) rows.push(row)
    }
    return rows
  }

  const handleCSVPreview = () => {
    if (!csvText.trim()) { setMsg('❌ Please paste CSV data first.'); return }
    if (!csvBrandId) { setMsg('❌ Please select a brand first.'); return }
    const rows = parseCSV(csvText)
    if (!rows.length) { setMsg('❌ Could not parse CSV. Check format.'); return }
    setCsvPreview(rows)
    setMsg('')
  }

  const handleCSVUpload = async () => {
    if (!csvPreview.length) { setMsg('❌ Preview data first.'); return }
    if (!csvBrandId) { setMsg('❌ Please select a brand.'); return }
    setCsvUploading(true)
    setMsg('')
    let count = 0
    for (const row of csvPreview) {
      const kpi_name = row.kpi_name?.toLowerCase().trim()
      const score = parseFloat(row.score)
      if (!kpi_name || isNaN(score)) continue
      const zone = row.zone?.toLowerCase().trim() || (
        score <= 20 ? 'critical' : score <= 40 ? 'emerging' : score <= 60 ? 'contested' : score <= 80 ? 'established' : 'category_defining'
      )
      const snapshotRow = {
        brand_id: csvBrandId,
        competitor_id: null,
        kpi_name,
        score,
        zone,
        confidence_level: 'external',
        source: row.source?.trim() || 'Manual CSV upload',
        snapshot_type: 'brand_level',
        checkpoint: csvCheckpoint,
        trigger_method: 'manual',
        movement: null,
        sources_count: 1,
        last_updated: new Date().toISOString(),
        status: 'pending_review',
      }
      await fetch(`${SUPABASE_URL}/rest/v1/kpi_snapshots`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=minimal' },
        body: JSON.stringify(snapshotRow)
      })
      count++
    }
    setMsg(`✅ ${count} KPI rows uploaded as pending_review. Go to Data approval to review.`)
    setCsvText('')
    setCsvPreview([])
    setCsvUploading(false)
    fetchPendingKpis()
  }

  if (!authed) return (
    <div style={{minHeight:'100vh',background:DEEP,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <style>{`*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{font-family:'Inter',sans-serif}`}</style>
      <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:'40px 36px',width:320,textAlign:'center'}}>
        <div style={{fontSize:32,color:GOLD,marginBottom:12}}>♛</div>
        <div style={{fontFamily:'Georgia,serif',fontSize:18,fontWeight:700,color:CREAM,marginBottom:4}}>Admin Panel</div>
        <div style={{fontSize:12,color:CREAM_DIM,marginBottom:24}}>King Solomon — internal only</div>
        <input type="password" placeholder="Admin password" value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { if (password === ADMIN_PASSWORD) { setAuthed(true) } else { setMsg('Wrong password') } } }}
          style={{width:'100%',padding:'10px 14px',borderRadius:8,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.06)',color:CREAM,fontSize:14,marginBottom:12,fontFamily:'Inter,sans-serif'}}
        />
        <button onClick={() => { if (password === ADMIN_PASSWORD) { setAuthed(true) } else { setMsg('Wrong password') } }}
          style={{width:'100%',padding:'10px',background:GOLD,color:DEEP,border:'none',borderRadius:8,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}
        >Enter</button>
        {msg && <div style={{marginTop:12,fontSize:12,color:RED}}>{msg}</div>}
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#f9f9f9',display:'flex'}}>
      <style>{`*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{font-family:'Inter',sans-serif}`}</style>

      {/* SIDEBAR */}
      <div style={{width:220,background:DEEP,display:'flex',flexDirection:'column',position:'fixed',top:0,left:0,bottom:0,zIndex:50}}>
        <div style={{padding:'20px 16px',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
          <div style={{fontSize:10,color:GOLD,fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase'}}>King Solomon</div>
          <div style={{fontSize:12,color:CREAM_DIM,marginTop:2}}>Admin panel</div>
        </div>
        {([
          ['payments','💳 Payments'],
          ['clients','🏢 Clients'],
          ['approval','✅ Data approval'],
          ['upload','📤 Data upload'],
          ['scraper','🔍 Scraper'],
        ] as const).map(([key, label]) => (
          <div key={key} onClick={() => { setSection(key); setSelectedClient(null); setMsg('') }}
            style={{padding:'10px 16px',fontSize:13,color:section===key?CREAM:CREAM_DIM,borderLeft:section===key?`2px solid ${GOLD}`:'2px solid transparent',background:section===key?'rgba(201,168,76,0.08)':'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <span>{label}</span>
            {key === 'approval' && (brandGroups.length + pendingAudits.length) > 0 && (
              <span style={{background:RED,color:WHITE,fontSize:10,fontWeight:700,padding:'1px 6px',borderRadius:20}}>{brandGroups.length + pendingAudits.length}</span>
            )}
          </div>
        ))}
        <div style={{marginTop:'auto',padding:'12px 16px',borderTop:'1px solid rgba(255,255,255,0.07)'}}>
          <button onClick={() => setAuthed(false)} style={{fontSize:11,color:CREAM_DIM,background:'none',border:'none',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Sign out</button>
        </div>
      </div>

      {/* MAIN */}
      <div style={{flex:1,marginLeft:220,padding:32}}>
        {msg && (
          <div style={{padding:'10px 16px',borderRadius:8,background:msg.startsWith('✅')?'rgba(95,198,138,0.1)':'rgba(232,120,120,0.1)',border:`1px solid ${msg.startsWith('✅')?'rgba(95,198,138,0.3)':'rgba(232,120,120,0.3)'}`,fontSize:13,color:msg.startsWith('✅')?'#1a6b1a':'#7a1a1a',marginBottom:20}}>
            {msg} <span onClick={() => setMsg('')} style={{cursor:'pointer',marginLeft:12,opacity:0.5}}>✕</span>
          </div>
        )}

        {/* PAYMENTS */}
        {section === 'payments' && !selectedClient && (
          <div>
            <h1 style={{fontFamily:'Georgia,serif',fontSize:25,fontWeight:700,color:DARK,marginBottom:6}}>Payments</h1>
            <p style={{fontSize:14,color:BODY_TEXT,marginBottom:20}}>All orders.</p>
            <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,overflow:'hidden'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                <thead><tr style={{background:'#fafafa'}}>
                  {['Email','Plan','Product','Status','Amount','Date','Action'].map(h => (
                    <th key={h} style={{textAlign:'left',padding:'10px 16px',fontWeight:600,color:'#aaa',fontSize:11,textTransform:'uppercase',letterSpacing:'0.08em',borderBottom:`1px solid ${BORDER}`}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} style={{borderBottom:`1px solid ${BORDER}`}}>
                      <td style={{padding:'10px 16px',color:DARK}}>{o.email}</td>
                      <td style={{padding:'10px 16px',color:BODY_TEXT}}>{o.plan_name}</td>
                      <td style={{padding:'10px 16px',fontSize:11,fontWeight:600,color:o.product==='eye'?MID_GREEN:GOLD,textTransform:'uppercase'}}>{o.product}</td>
                      <td style={{padding:'10px 16px'}}><span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:20,background:o.status==='paid'?'rgba(95,198,138,0.1)':'rgba(232,120,120,0.1)',color:o.status==='paid'?'#1a6b1a':'#7a1a1a'}}>{o.status}</span></td>
                      <td style={{padding:'10px 16px',color:BODY_TEXT}}>{o.currency==='INR'?`Rs ${o.amount_inr?.toLocaleString('en-IN')}`:`$${o.amount_usd}`}</td>
                      <td style={{padding:'10px 16px',color:'#aaa',fontSize:12}}>{new Date(o.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</td>
                      <td style={{padding:'10px 16px'}}>{o.status !== 'paid' && <button onClick={() => markPaid(o.id)} style={{fontSize:11,padding:'4px 10px',borderRadius:6,background:GOLD,color:DEEP,border:'none',cursor:'pointer',fontFamily:'Inter,sans-serif',fontWeight:600}}>Mark paid</button>}</td>
                    </tr>
                  ))}
                  {orders.length === 0 && <tr><td colSpan={7} style={{padding:'24px',textAlign:'center',color:'#aaa',fontSize:13}}>No orders yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CLIENTS */}
        {section === 'clients' && !selectedClient && (
          <div>
            <h1 style={{fontFamily:'Georgia,serif',fontSize:25,fontWeight:700,color:DARK,marginBottom:6}}>Clients</h1>
            <p style={{fontSize:14,color:BODY_TEXT,marginBottom:20}}>Click a client to see their campaigns, purchase history and active products.</p>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12}}>
              {brands.map(b => {
                const bOrders = orders.filter(o => o.user_id === b.user_id)
                const hasIQ = bOrders.some(o => o.product === 'iq' && o.status === 'paid')
                const hasEye = bOrders.some(o => o.product === 'eye' && o.status === 'paid')
                return (
                  <div key={b.id} onClick={() => { setSelectedClient(b); fetchClientOrders(b.user_id) }} style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'18px 20px',cursor:'pointer'}}>
                    <div style={{fontSize:15,fontWeight:700,color:DARK,marginBottom:4}}>{b.brand_name}</div>
                    <div style={{fontSize:13,color:BODY_TEXT,marginBottom:8}}>{b.category}</div>
                    <div style={{fontSize:12,color:'#aaa',marginBottom:10}}>{[b.competitor_1,b.competitor_2,b.competitor_3].filter(Boolean).join(', ')}</div>
                    <div style={{display:'flex',gap:6}}>
                      {hasIQ && <span style={{fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:20,background:'rgba(201,168,76,0.1)',color:GOLD}}>IQ active</span>}
                      {hasEye && <span style={{fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:20,background:'rgba(31,74,47,0.1)',color:MID_GREEN}}>Eye active</span>}
                      {!hasIQ && !hasEye && <span style={{fontSize:10,color:'#bbb'}}>No active products</span>}
                    </div>
                  </div>
                )
              })}
              {brands.length === 0 && <div style={{color:'#aaa',fontSize:13}}>No clients yet.</div>}
            </div>
          </div>
        )}

        {/* CLIENT DETAIL */}
        {(section === 'clients' || section === 'payments') && selectedClient && (
          <div>
            <button onClick={() => setSelectedClient(null)} style={{fontSize:13,color:GOLD,background:'none',border:'none',cursor:'pointer',marginBottom:16,fontFamily:'Inter,sans-serif'}}>← Back</button>
            <h1 style={{fontFamily:'Georgia,serif',fontSize:25,fontWeight:700,color:DARK,marginBottom:4}}>{selectedClient.brand_name}</h1>
            <p style={{fontSize:14,color:BODY_TEXT,marginBottom:20}}>{selectedClient.category} · vs {[selectedClient.competitor_1,selectedClient.competitor_2,selectedClient.competitor_3].filter(Boolean).join(', ')}</p>
            <div style={{fontSize:11,fontWeight:600,color:GOLD,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Purchase history</div>
            <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,overflow:'hidden',marginBottom:24}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                <thead><tr style={{background:'#fafafa'}}>
                  {['Plan','Product','Status','Amount','Date'].map(h => (
                    <th key={h} style={{textAlign:'left',padding:'10px 16px',fontWeight:600,color:'#aaa',fontSize:11,textTransform:'uppercase',letterSpacing:'0.08em',borderBottom:`1px solid ${BORDER}`}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {clientOrders.map(o => (
                    <tr key={o.id} style={{borderBottom:`1px solid ${BORDER}`}}>
                      <td style={{padding:'10px 16px',color:DARK}}>{o.plan_name}</td>
                      <td style={{padding:'10px 16px',fontSize:11,fontWeight:600,color:o.product==='eye'?MID_GREEN:GOLD,textTransform:'uppercase'}}>{o.product}</td>
                      <td style={{padding:'10px 16px'}}><span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:20,background:o.status==='paid'?'rgba(95,198,138,0.1)':'rgba(232,120,120,0.1)',color:o.status==='paid'?'#1a6b1a':'#7a1a1a'}}>{o.status}</span></td>
                      <td style={{padding:'10px 16px',color:BODY_TEXT}}>{o.currency==='INR'?`Rs ${o.amount_inr?.toLocaleString('en-IN')}`:`$${o.amount_usd}`}</td>
                      <td style={{padding:'10px 16px',color:'#aaa',fontSize:12}}>{new Date(o.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</td>
                    </tr>
                  ))}
                  {clientOrders.length === 0 && <tr><td colSpan={5} style={{padding:'24px',textAlign:'center',color:'#aaa',fontSize:13}}>No orders yet.</td></tr>}
                </tbody>
              </table>
            </div>
            <div style={{fontSize:11,fontWeight:600,color:GOLD,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Brand details</div>
            <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'16px 20px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              {[{label:'Brand ID',val:selectedClient.id},{label:'User ID',val:selectedClient.user_id},{label:'IQ report ready',val:selectedClient.iq_report_ready?'✅ Yes':'⬜ No'},{label:'Eye report ready',val:selectedClient.eye_report_ready?'✅ Yes':'⬜ No'}].map(f => (
                <div key={f.label}>
                  <div style={{fontSize:10,color:'#aaa',marginBottom:3,textTransform:'uppercase',letterSpacing:'0.06em'}}>{f.label}</div>
                  <div style={{fontSize:13,color:DARK,fontFamily:f.label.includes('ID')?'monospace':'Inter,sans-serif'}}>{f.val}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DATA APPROVAL */}
        {section === 'approval' && (
          <div>
            <h1 style={{fontFamily:'Georgia,serif',fontSize:25,fontWeight:700,color:DARK,marginBottom:6}}>Data approval</h1>
            <p style={{fontSize:14,color:BODY_TEXT,marginBottom:20}}>Tick or reject each KPI and CX theme. Rejected items require a re-scrape instruction. Hit Submit to process all decisions at once.</p>

            {/* IQ */}
            <div style={{marginBottom:32}}>
              <div style={{fontSize:11,fontWeight:600,color:GOLD,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Solomon&apos;s IQ — Pending review ({brandGroups.length})</div>
              {brandGroups.length === 0 ? (
                <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'24px',textAlign:'center',color:'#aaa',fontSize:13}}>No pending IQ scores. All clear.</div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:16}}>
                  {brandGroups.map((group: any) => {
                    const groupKey = `${group.brand_id}__${group.checkpoint}`
                    const allDecided = group.kpis.every((k: any) => !!kpiDecisions[k.id])
                    const rejectedKpis = group.kpis.filter((k: any) => kpiDecisions[k.id] === 'reject')
                    const missingInstructions = rejectedKpis.some((k: any) => !kpiInstructions[k.id])
                    return (
                      <div key={groupKey} style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'20px 24px'}}>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                          <div>
                            <span style={{fontSize:15,fontWeight:700,color:DARK}}>{getBrandName(group.brand_id)}</span>
                            <span style={{fontSize:11,color:'#aaa',marginLeft:10}}>{group.checkpoint} · {new Date(group.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span>
                          </div>
                          <span style={{fontSize:10,fontWeight:600,padding:'3px 10px',borderRadius:20,background:'rgba(201,168,76,0.1)',color:AMBER}}>Pending review</span>
                        </div>
                        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:16}}>
                          {KPI_NAMES.map(kpiName => {
                            const kpi = group.kpis.find((k: any) => k.kpi_name === kpiName)
                            const decision = kpi ? kpiDecisions[kpi.id] : null
                            return (
                              <div key={kpiName} style={{background:'#f9f9f9',borderRadius:10,padding:'12px 10px',textAlign:'center',border:`2px solid ${decision==='approve'?GREEN:decision==='reject'?RED:BORDER}`}}>
                                <div style={{fontSize:9,fontWeight:600,color:GOLD,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>{kpiName}</div>
                                <div style={{fontFamily:'Georgia,serif',fontSize:22,fontWeight:700,color:DARK,marginBottom:8}}>
                                  {kpi ? (kpiName==='buzz'&&kpi.score>0?`+${kpi.score}`:kpi.score) : '--'}
                                </div>
                                {kpi ? (
                                  <div style={{display:'flex',gap:4,justifyContent:'center'}}>
                                    <button onClick={() => setKpiDecisions(prev => ({...prev,[kpi.id]:'approve'}))} style={{width:28,height:28,borderRadius:6,border:`1px solid ${decision==='approve'?GREEN:BORDER}`,background:decision==='approve'?GREEN:WHITE,color:decision==='approve'?WHITE:'#aaa',fontSize:13,cursor:'pointer',fontWeight:700}}>✓</button>
                                    <button onClick={() => setKpiDecisions(prev => ({...prev,[kpi.id]:'reject'}))} style={{width:28,height:28,borderRadius:6,border:`1px solid ${decision==='reject'?RED:BORDER}`,background:decision==='reject'?RED:WHITE,color:decision==='reject'?WHITE:'#aaa',fontSize:13,cursor:'pointer',fontWeight:700}}>✗</button>
                                  </div>
                                ) : <div style={{fontSize:10,color:'#ccc'}}>No data</div>}
                              </div>
                            )
                          })}
                        </div>
                        {rejectedKpis.length > 0 && (
                          <div style={{marginBottom:16,display:'flex',flexDirection:'column',gap:8}}>
                            {rejectedKpis.map((kpi: any) => (
                              <div key={kpi.id} style={{display:'flex',alignItems:'center',gap:8}}>
                                <span style={{fontSize:11,fontWeight:600,color:RED,textTransform:'uppercase',minWidth:90}}>{kpi.kpi_name}</span>
                                <input placeholder={`Re-scrape instruction for ${kpi.kpi_name}...`} value={kpiInstructions[kpi.id]||''} onChange={e => setKpiInstructions(prev => ({...prev,[kpi.id]:e.target.value}))} style={{flex:1,padding:'7px 12px',border:`1px solid ${RED}`,borderRadius:7,fontSize:13,color:DARK,fontFamily:'Inter,sans-serif'}}/>
                              </div>
                            ))}
                          </div>
                        )}
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                          <div style={{fontSize:12,color:'#aaa'}}>{group.kpis.filter((k:any)=>kpiDecisions[k.id]==='approve').length} approved · {group.kpis.filter((k:any)=>kpiDecisions[k.id]==='reject').length} flagged · {group.kpis.filter((k:any)=>!kpiDecisions[k.id]).length} undecided</div>
                          <button onClick={() => { if(!allDecided){setMsg('❌ Please tick or reject every KPI before submitting.');return} if(missingInstructions){setMsg('❌ Please add a re-scrape instruction for every rejected KPI.');return} submitBrandDecisions(group) }} disabled={loading}
                            style={{padding:'9px 20px',background:allDecided&&!missingInstructions?GOLD:'#e0e0e0',color:allDecided&&!missingInstructions?DEEP:'#aaa',border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:allDecided?'pointer':'not-allowed',fontFamily:'Inter,sans-serif'}}>
                            {loading?'Submitting...':'Submit decisions →'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* EYE */}
            <div>
              <div style={{fontSize:11,fontWeight:600,color:MID_GREEN,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Solomon&apos;s Eye — Pending review ({pendingAudits.length})</div>
              {pendingAudits.length === 0 ? (
                <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'24px',textAlign:'center',color:'#aaa',fontSize:13}}>No pending Eye audits. All clear.</div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:16}}>
                  {pendingAudits.map(audit => {
                    const themes = auditThemes[audit.id] || []
                    const rejectedThemes = themes.filter(t => themeDecisions[t.id]==='reject')
                    const allThemesDecided = themes.length > 0 && themes.every(t => !!themeDecisions[t.id])
                    const missingThemeInstructions = rejectedThemes.some(t => !themeInstructions[t.id])
                    return (
                      <div key={audit.id} style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'20px 24px'}}>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                          <div>
                            <span style={{fontSize:15,fontWeight:700,color:DARK}}>{getBrandName(audit.brand_id)}</span>
                            <span style={{fontSize:11,color:'#aaa',marginLeft:10}}>{audit.category_type} · Benchmark {audit.benchmark} · {new Date(audit.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</span>
                          </div>
                          <span style={{fontSize:10,fontWeight:600,padding:'3px 10px',borderRadius:20,background:'rgba(31,74,47,0.1)',color:MID_GREEN}}>Pending review</span>
                        </div>
                        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16}}>
                          {[{label:'Overall CX NPS',val:audit.overall_cx_nps!==null?(audit.overall_cx_nps>0?`+${audit.overall_cx_nps}`:audit.overall_cx_nps):'--'},{label:'Total signals',val:audit.total_signals?.toLocaleString()||'--'},{label:'Audit type',val:audit.audit_type||'--'}].map(f => (
                            <div key={f.label} style={{background:'#f9f9f9',borderRadius:8,padding:'10px 12px'}}>
                              <div style={{fontSize:9,fontWeight:600,color:MID_GREEN,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4}}>{f.label}</div>
                              <div style={{fontSize:18,fontWeight:700,color:DARK,fontFamily:'Georgia,serif'}}>{f.val}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{fontSize:11,fontWeight:600,color:BODY_TEXT,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:10}}>CX themes</div>
                        {themes.length === 0 ? (
                          <div style={{fontSize:13,color:'#aaa',marginBottom:16}}>No theme scores found for this audit.</div>
                        ) : (
                          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:16}}>
                            {CX_THEMES.map(themeName => {
                              const theme = themes.find(t => t.theme===themeName)
                              const decision = theme ? themeDecisions[theme.id] : null
                              return (
                                <div key={themeName} style={{background:'#f9f9f9',borderRadius:10,padding:'12px 10px',textAlign:'center',border:`2px solid ${decision==='approve'?GREEN:decision==='reject'?RED:BORDER}`}}>
                                  <div style={{fontSize:9,fontWeight:600,color:MID_GREEN,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>{themeName}</div>
                                  <div style={{fontFamily:'Georgia,serif',fontSize:20,fontWeight:700,color:DARK,marginBottom:3}}>
                                    {theme ? (theme.nps_score>0?`+${theme.nps_score}`:theme.nps_score) : '--'}
                                  </div>
                                  {theme ? (
                                    <>
                                      <div style={{fontSize:10,color:BODY_TEXT,marginBottom:6,textTransform:'capitalize'}}>{theme.sentiment}</div>
                                      <div style={{display:'flex',gap:4,justifyContent:'center'}}>
                                        <button onClick={() => setThemeDecisions(prev => ({...prev,[theme.id]:'approve'}))} style={{width:28,height:28,borderRadius:6,border:`1px solid ${decision==='approve'?GREEN:BORDER}`,background:decision==='approve'?GREEN:WHITE,color:decision==='approve'?WHITE:'#aaa',fontSize:13,cursor:'pointer',fontWeight:700}}>✓</button>
                                        <button onClick={() => setThemeDecisions(prev => ({...prev,[theme.id]:'reject'}))} style={{width:28,height:28,borderRadius:6,border:`1px solid ${decision==='reject'?RED:BORDER}`,background:decision==='reject'?RED:WHITE,color:decision==='reject'?WHITE:'#aaa',fontSize:13,cursor:'pointer',fontWeight:700}}>✗</button>
                                      </div>
                                    </>
                                  ) : <div style={{fontSize:10,color:'#ccc'}}>No data</div>}
                                </div>
                              )
                            })}
                          </div>
                        )}
                        {rejectedThemes.length > 0 && (
                          <div style={{marginBottom:16,display:'flex',flexDirection:'column',gap:8}}>
                            {rejectedThemes.map(theme => (
                              <div key={theme.id} style={{display:'flex',alignItems:'center',gap:8}}>
                                <span style={{fontSize:11,fontWeight:600,color:RED,textTransform:'uppercase',minWidth:120}}>{theme.theme}</span>
                                <input placeholder={`Re-scrape instruction for ${theme.theme}...`} value={themeInstructions[theme.id]||''} onChange={e => setThemeInstructions(prev => ({...prev,[theme.id]:e.target.value}))} style={{flex:1,padding:'7px 12px',border:`1px solid ${RED}`,borderRadius:7,fontSize:13,color:DARK,fontFamily:'Inter,sans-serif'}}/>
                              </div>
                            ))}
                          </div>
                        )}
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                          <div style={{fontSize:12,color:'#aaa'}}>{themes.filter(t=>themeDecisions[t.id]==='approve').length} approved · {themes.filter(t=>themeDecisions[t.id]==='reject').length} flagged · {themes.filter(t=>!themeDecisions[t.id]).length} undecided</div>
                          <button onClick={() => { if(!allThemesDecided){setMsg('❌ Please tick or reject every CX theme before submitting.');return} if(missingThemeInstructions){setMsg('❌ Please add a re-scrape instruction for every rejected theme.');return} submitAuditDecisions(audit) }} disabled={loading}
                            style={{padding:'9px 20px',background:allThemesDecided&&!missingThemeInstructions?GOLD:'#e0e0e0',color:allThemesDecided&&!missingThemeInstructions?DEEP:'#aaa',border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:allThemesDecided?'pointer':'not-allowed',fontFamily:'Inter,sans-serif'}}>
                            {loading?'Submitting...':'Submit decisions →'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* DATA UPLOAD */}
        {section === 'upload' && (
          <div style={{maxWidth:800}}>
            <h1 style={{fontFamily:'Georgia,serif',fontSize:25,fontWeight:700,color:DARK,marginBottom:6}}>Data upload</h1>
            <p style={{fontSize:14,color:BODY_TEXT,marginBottom:24}}>Upload KPI data from any external tool (Awario, Brand24, etc.) as a CSV. Data goes into your approval workflow before reaching the client dashboard.</p>

            {/* Format guide */}
            <div style={{background:'#f9f9f9',border:`1px solid ${BORDER}`,borderRadius:10,padding:'14px 18px',marginBottom:20}}>
              <div style={{fontSize:11,fontWeight:600,color:GOLD,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>Required CSV format</div>
              <code style={{fontSize:12,color:DARK,display:'block',lineHeight:1.8}}>
                kpi_name, score, zone, source<br/>
                awareness, 68, established, Awario export<br/>
                consideration, 45, contested, Awario export<br/>
                usage, 52, contested, Brand24<br/>
                imagery, 61, established, Manual<br/>
                buzz, +12, contested, Awario export
              </code>
              <div style={{fontSize:11,color:'#aaa',marginTop:8}}>kpi_name must be: awareness, consideration, usage, imagery, or buzz. zone and source are optional.</div>
            </div>

            {/* Brand + checkpoint selector */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
              <div>
                <div style={{fontSize:11,fontWeight:600,color:GOLD,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>Brand</div>
                <select value={csvBrandId} onChange={e => setCsvBrandId(e.target.value)} style={{width:'100%',padding:'9px 12px',border:`1px solid ${BORDER}`,borderRadius:8,fontSize:14,color:DARK,background:WHITE,fontFamily:'Inter,sans-serif'}}>
                  <option value="">Select brand</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.brand_name}</option>)}
                </select>
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:600,color:GOLD,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>Time window</div>
                <select value={csvCheckpoint} onChange={e => setCsvCheckpoint(e.target.value)} style={{width:'100%',padding:'9px 12px',border:`1px solid ${BORDER}`,borderRadius:8,fontSize:14,color:DARK,background:WHITE,fontFamily:'Inter,sans-serif'}}>
                  <option value="current">Current</option>
                  <option value="30d">30d</option>
                  <option value="60d">60d</option>
                  <option value="90d">90d</option>
                </select>
              </div>
            </div>

            {/* CSV paste area */}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,fontWeight:600,color:GOLD,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>Paste CSV data</div>
              <textarea
                value={csvText}
                onChange={e => { setCsvText(e.target.value); setCsvPreview([]) }}
                placeholder={'kpi_name, score, zone, source\nawareness, 68, established, Awario\nconsideration, 45, contested, Awario'}
                rows={8}
                style={{width:'100%',padding:'12px 14px',border:`1px solid ${BORDER}`,borderRadius:8,fontSize:13,color:DARK,fontFamily:'monospace',resize:'vertical'}}
              />
            </div>

            <div style={{display:'flex',gap:8,marginBottom:20}}>
              <button onClick={handleCSVPreview} style={{padding:'9px 18px',background:MID_GREEN,color:WHITE,border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
                Preview →
              </button>
              {csvPreview.length > 0 && (
                <button onClick={handleCSVUpload} disabled={csvUploading} style={{padding:'9px 18px',background:GOLD,color:DEEP,border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
                  {csvUploading ? 'Uploading...' : `Upload ${csvPreview.length} rows →`}
                </button>
              )}
            </div>

            {/* Preview table */}
            {csvPreview.length > 0 && (
              <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,overflow:'hidden'}}>
                <div style={{padding:'10px 16px',borderBottom:`1px solid ${BORDER}`,fontSize:11,fontWeight:600,color:GOLD,textTransform:'uppercase',letterSpacing:'0.1em'}}>
                  Preview — {csvPreview.length} rows — will upload as pending_review for {brands.find(b => b.id === csvBrandId)?.brand_name}
                </div>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                  <thead><tr style={{background:'#fafafa'}}>
                    {['KPI','Score','Zone','Source'].map(h => (
                      <th key={h} style={{textAlign:'left',padding:'8px 16px',fontWeight:600,color:'#aaa',fontSize:11,textTransform:'uppercase',letterSpacing:'0.08em',borderBottom:`1px solid ${BORDER}`}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {csvPreview.map((row, i) => (
                      <tr key={i} style={{borderBottom:`1px solid ${BORDER}`}}>
                        <td style={{padding:'8px 16px',color:DARK,fontWeight:600,textTransform:'uppercase',fontSize:11}}>{row.kpi_name}</td>
                        <td style={{padding:'8px 16px',color:DARK,fontFamily:'Georgia,serif',fontSize:16}}>{row.score}</td>
                        <td style={{padding:'8px 16px',color:BODY_TEXT,textTransform:'capitalize'}}>{row.zone || 'auto'}</td>
                        <td style={{padding:'8px 16px',color:'#aaa',fontSize:12}}>{row.source || 'Manual upload'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* SCRAPER */}
        {section === 'scraper' && (
          <div>
            <h1 style={{fontFamily:'Georgia,serif',fontSize:25,fontWeight:700,color:DARK,marginBottom:6}}>Scraper</h1>
            <p style={{fontSize:14,color:BODY_TEXT,marginBottom:24}}>Trigger a fresh data collection run for all brands with paid products. Make sure the local server is running first.</p>

            {/* Run scraper button */}
            <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'24px',marginBottom:24}}>
              <div style={{fontSize:11,fontWeight:600,color:GOLD,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>Run scraper</div>
              <p style={{fontSize:13,color:BODY_TEXT,marginBottom:16,lineHeight:1.6}}>
                Click the button below to trigger a fresh data collection run for all brands with paid products. The scraper runs on the cloud — no VS Code needed.
              </p>
              <div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}>
                <button
                  onClick={async () => {
                    setMsg('')
                    try {
                      const statusRes = await fetch('https://kingsolomonhq-production.up.railway.app/status')
                      const statusData = await statusRes.json()
                      if (statusData.status === 'offline') {
                        setMsg('❌ Local server is not running. Open VS Code terminal and run: py server.py')
                        return
                      }
                      if (statusData.status === 'running') {
                        setMsg('⏳ Scraper is already running. Check back in a few minutes.')
                        return
                      }
                      const res = await fetch('https://kingsolomonhq-production.up.railway.app/trigger', { method: 'POST' })
                      const data = await res.json()
                      if (data.status === 'started') {
                        setMsg('✅ Scraper started. Data will appear in Data approval in 5-10 minutes.')
                      } else if (data.status === 'already_running') {
                        setMsg('⏳ Scraper is already running. Check back in a few minutes.')
                      } else {
                        setMsg(`❌ ${data.message}`)
                      }
                    } catch {
                      setMsg('❌ Could not reach local scraper server. Make sure py server.py is running in VS Code terminal.')
                    }
                  }}
                  style={{padding:'12px 24px',background:DEEP,color:CREAM,border:'none',borderRadius:8,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}
                >▶ Run scraper now</button>
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch('https://kingsolomonhq-production.up.railway.app/status')
                      const data = await res.json()
                      if (data.status === 'running') {
                        setMsg(`⏳ Scraper is running. Recent log: ${data.log?.slice(-3).join(' | ')}`)
                      } else if (data.status === 'idle') {
                        setMsg('✅ Scraper server is online and idle. Ready to run.')
                      } else {
                        setMsg('❌ Local server is not running. Run: py server.py')
                      }
                    } catch {
                      setMsg('❌ Local server is not running. Run: py server.py')
                    }
                  }}
                  style={{padding:'12px 20px',background:'#f5f5f5',color:DARK,border:`1px solid ${BORDER}`,borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}
                >Check status</button>
              </div>
            </div>

            <div style={{fontSize:11,fontWeight:600,color:GOLD,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Per-brand instructions</div>
            <p style={{fontSize:13,color:BODY_TEXT,marginBottom:16}}>Add custom instructions per brand. These are picked up on the next scraper run.</p>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {brands.map(b => (
                <div key={b.id} style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'16px 20px'}}>
                  <div style={{fontSize:14,fontWeight:600,color:DARK,marginBottom:4}}>{b.brand_name}</div>
                  <div style={{fontSize:12,color:'#aaa',marginBottom:10}}>{b.category} · {b.geo || 'IN'}</div>
                  <textarea placeholder="Add scraper instructions for this brand..." value={scraperInstructions[b.id]||''} onChange={e => setScraperInstructions(prev => ({...prev,[b.id]:e.target.value}))} rows={3} style={{width:'100%',padding:'10px 12px',border:`1px solid ${BORDER}`,borderRadius:8,fontSize:13,color:DARK,fontFamily:'Inter,sans-serif',resize:'vertical',marginBottom:8}}/>
                  <div style={{display:'flex',gap:8}}>
                    <button onClick={async () => {
                      const instruction = scraperInstructions[b.id]||''
                      if(!instruction){setMsg('❌ Please add an instruction first.');return}
                      await fetch(`${SUPABASE_URL}/rest/v1/brands?id=eq.${b.id}`,{method:'PATCH',headers:{...headers,'Prefer':'return=minimal'},body:JSON.stringify({scraper_instruction:instruction})})
                      setMsg('✅ Instruction saved. Will be used on next scraper run.')
                    }} style={{padding:'7px 14px',background:GOLD,color:DEEP,border:'none',borderRadius:7,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Save instruction</button>
                  </div>
                </div>
              ))}
              {brands.length === 0 && <div style={{color:'#aaa',fontSize:13}}>No brands yet.</div>}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}