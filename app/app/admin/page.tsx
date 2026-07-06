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

type Section = 'payments' | 'clients' | 'approval' | 'scraper'

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [section, setSection] = useState<Section>('payments')
  const [orders, setOrders] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [pendingKpis, setPendingKpis] = useState<any[]>([])
  const [pendingAudits, setPendingAudits] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [clientOrders, setClientOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [rejectionNotes, setRejectionNotes] = useState<Record<string, string>>({})
  const [scraperInstructions, setScraperInstructions] = useState<Record<string, string>>({})

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
    const res = await fetch(`${SUPABASE_URL}/rest/v1/kpi_snapshots?select=*&status=eq.pending_review&order=created_at.desc`, { headers })
    const data = await res.json()
    setPendingKpis(Array.isArray(data) ? data : [])
  }

  const fetchPendingAudits = async () => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/cx_audits?select=*&status=eq.pending_review&order=created_at.desc`, { headers })
    const data = await res.json()
    setPendingAudits(Array.isArray(data) ? data : [])
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

  const markPaid = async (orderId: string) => {
    await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`, {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ status: 'paid' })
    })
    setMsg('✅ Order marked as paid.')
    fetchOrders()
  }

  const approveKpi = async (kpiId: string, brandId: string) => {
    setLoading(true)
    await fetch(`${SUPABASE_URL}/rest/v1/kpi_snapshots?id=eq.${kpiId}`, {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        status: 'published',
        approved_at: new Date().toISOString(),
      })
    })
    // Check if all KPIs for this brand are now published — if so set iq_report_ready
    const res = await fetch(`${SUPABASE_URL}/rest/v1/kpi_snapshots?brand_id=eq.${brandId}&status=eq.pending_review&select=id`, { headers })
    const remaining = await res.json()
    if (Array.isArray(remaining) && remaining.length === 0) {
      await fetch(`${SUPABASE_URL}/rest/v1/brands?id=eq.${brandId}`, {
        method: 'PATCH',
        headers: { ...headers, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ iq_report_ready: true })
      })
      setMsg('✅ KPI approved. All KPIs published — IQ report unlocked for client.')
    } else {
      setMsg('✅ KPI approved and published to client dashboard.')
    }
    fetchPendingKpis()
    setLoading(false)
  }

  const rejectKpi = async (kpiId: string) => {
    const note = rejectionNotes[kpiId] || ''
    if (!note) { setMsg('❌ Please add a re-scrape instruction before rejecting.'); return }
    setLoading(true)
    await fetch(`${SUPABASE_URL}/rest/v1/kpi_snapshots?id=eq.${kpiId}`, {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        status: 'rejected',
        rejection_note: note,
        scraper_instruction: note,
      })
    })
    setMsg('✅ Flagged for re-scrape. Instruction saved. Client sees data being prepared.')
    fetchPendingKpis()
    setLoading(false)
  }

  const approveAudit = async (auditId: string, brandId: string) => {
    setLoading(true)
    await fetch(`${SUPABASE_URL}/rest/v1/cx_audits?id=eq.${auditId}`, {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ status: 'published' })
    })
    await fetch(`${SUPABASE_URL}/rest/v1/brands?id=eq.${brandId}`, {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ eye_report_ready: true })
    })
    setMsg('✅ Eye audit approved. Dashboard and report unlocked for client.')
    fetchPendingAudits()
    setLoading(false)
  }

  const rejectAudit = async (auditId: string) => {
    const note = rejectionNotes[auditId] || ''
    if (!note) { setMsg('❌ Please add a re-scrape instruction before rejecting.'); return }
    setLoading(true)
    await fetch(`${SUPABASE_URL}/rest/v1/cx_audits?id=eq.${auditId}`, {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        status: 'pending_review',
        notes: note,
      })
    })
    setMsg('✅ Flagged for re-scrape. Client sees data being prepared.')
    fetchPendingAudits()
    setLoading(false)
  }

  const getBrandName = (brandId: string) => brands.find(b => b.id === brandId)?.brand_name || brandId.slice(0, 8)

  if (!authed) return (
    <div style={{minHeight:'100vh',background:DEEP,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <style>{`*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{font-family:'Inter',sans-serif}`}</style>
      <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:'40px 36px',width:320,textAlign:'center'}}>
        <div style={{fontSize:32,color:GOLD,marginBottom:12}}>♛</div>
        <div style={{fontFamily:'Georgia,serif',fontSize:18,fontWeight:700,color:CREAM,marginBottom:4}}>Admin Panel</div>
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
          ['scraper','🔍 Scraper'],
        ] as const).map(([key, label]) => (
          <div
            key={key}
            onClick={() => { setSection(key); setSelectedClient(null); setMsg('') }}
            style={{padding:'10px 16px',fontSize:13,color:section===key?CREAM:CREAM_DIM,borderLeft:section===key?`2px solid ${GOLD}`:'2px solid transparent',background:section===key?'rgba(201,168,76,0.08)':'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'space-between'}}
          >
            <span>{label}</span>
            {key === 'approval' && pendingKpis.length + pendingAudits.length > 0 && (
              <span style={{background:RED,color:WHITE,fontSize:10,fontWeight:700,padding:'1px 6px',borderRadius:20}}>{pendingKpis.length + pendingAudits.length}</span>
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
            <p style={{fontSize:14,color:BODY_TEXT,marginBottom:20}}>All orders. Click a client row to see their full purchase history.</p>
            <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,overflow:'hidden'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                <thead>
                  <tr style={{background:'#fafafa'}}>
                    {['Email','Plan','Product','Status','Amount','Date','Action'].map(h => (
                      <th key={h} style={{textAlign:'left',padding:'10px 16px',fontWeight:600,color:'#aaa',fontSize:11,textTransform:'uppercase',letterSpacing:'0.08em',borderBottom:`1px solid ${BORDER}`}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} style={{borderBottom:`1px solid ${BORDER}`}}>
                      <td style={{padding:'10px 16px',color:DARK}}>{o.email}</td>
                      <td style={{padding:'10px 16px',color:BODY_TEXT}}>{o.plan_name}</td>
                      <td style={{padding:'10px 16px',fontSize:11,fontWeight:600,color:o.product==='eye'?MID_GREEN:GOLD,textTransform:'uppercase'}}>{o.product}</td>
                      <td style={{padding:'10px 16px'}}>
                        <span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:20,background:o.status==='paid'?'rgba(95,198,138,0.1)':'rgba(232,120,120,0.1)',color:o.status==='paid'?'#1a6b1a':'#7a1a1a'}}>{o.status}</span>
                      </td>
                      <td style={{padding:'10px 16px',color:BODY_TEXT}}>{o.currency==='INR'?`Rs ${o.amount_inr?.toLocaleString('en-IN')}`:`$${o.amount_usd}`}</td>
                      <td style={{padding:'10px 16px',color:'#aaa',fontSize:12}}>{new Date(o.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</td>
                      <td style={{padding:'10px 16px'}}>
                        {o.status !== 'paid' && (
                          <button onClick={() => markPaid(o.id)} style={{fontSize:11,padding:'4px 10px',borderRadius:6,background:GOLD,color:DEEP,border:'none',cursor:'pointer',fontFamily:'Inter,sans-serif',fontWeight:600}}>Mark paid</button>
                        )}
                      </td>
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
                  <div
                    key={b.id}
                    onClick={() => { setSelectedClient(b); fetchClientOrders(b.user_id) }}
                    style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'18px 20px',cursor:'pointer',transition:'box-shadow 0.15s'}}
                  >
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

        {/* CLIENT DETAIL VIEW */}
        {(section === 'clients' || section === 'payments') && selectedClient && (
          <div>
            <button onClick={() => setSelectedClient(null)} style={{fontSize:13,color:GOLD,background:'none',border:'none',cursor:'pointer',marginBottom:16,fontFamily:'Inter,sans-serif'}}>← Back</button>
            <h1 style={{fontFamily:'Georgia,serif',fontSize:25,fontWeight:700,color:DARK,marginBottom:4}}>{selectedClient.brand_name}</h1>
            <p style={{fontSize:14,color:BODY_TEXT,marginBottom:20}}>{selectedClient.category} · vs {[selectedClient.competitor_1,selectedClient.competitor_2,selectedClient.competitor_3].filter(Boolean).join(', ')}</p>

            <div style={{fontSize:11,fontWeight:600,color:GOLD,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Purchase history</div>
            <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,overflow:'hidden',marginBottom:24}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                <thead>
                  <tr style={{background:'#fafafa'}}>
                    {['Plan','Product','Status','Amount','Date'].map(h => (
                      <th key={h} style={{textAlign:'left',padding:'10px 16px',fontWeight:600,color:'#aaa',fontSize:11,textTransform:'uppercase',letterSpacing:'0.08em',borderBottom:`1px solid ${BORDER}`}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clientOrders.map(o => (
                    <tr key={o.id} style={{borderBottom:`1px solid ${BORDER}`}}>
                      <td style={{padding:'10px 16px',color:DARK}}>{o.plan_name}</td>
                      <td style={{padding:'10px 16px',fontSize:11,fontWeight:600,color:o.product==='eye'?MID_GREEN:GOLD,textTransform:'uppercase'}}>{o.product}</td>
                      <td style={{padding:'10px 16px'}}>
                        <span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:20,background:o.status==='paid'?'rgba(95,198,138,0.1)':'rgba(232,120,120,0.1)',color:o.status==='paid'?'#1a6b1a':'#7a1a1a'}}>{o.status}</span>
                      </td>
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
              {[
                {label:'Brand ID',val:selectedClient.id},
                {label:'User ID',val:selectedClient.user_id},
                {label:'IQ report ready',val:selectedClient.iq_report_ready ? '✅ Yes' : '⬜ No'},
                {label:'Eye report ready',val:selectedClient.eye_report_ready ? '✅ Yes' : '⬜ No'},
              ].map(f => (
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
            <p style={{fontSize:14,color:BODY_TEXT,marginBottom:20}}>Review all pending data before it reaches clients. Approve to publish. Add re-scrape instructions to flag for re-collection. Clients see only "data being prepared" until you approve.</p>

            {/* IQ pending */}
            <div style={{marginBottom:32}}>
              <div style={{fontSize:11,fontWeight:600,color:GOLD,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>
                Solomon's IQ — Pending review ({pendingKpis.length})
              </div>
              {pendingKpis.length === 0 ? (
                <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'24px',textAlign:'center',color:'#aaa',fontSize:13}}>No pending IQ scores. All clear.</div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  {pendingKpis.map(kpi => (
                    <div key={kpi.id} style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'16px 20px'}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                        <div>
                          <span style={{fontSize:13,fontWeight:600,color:DARK}}>{getBrandName(kpi.brand_id)}</span>
                          <span style={{fontSize:11,color:'#aaa',marginLeft:8}}>{kpi.checkpoint} · {new Date(kpi.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</span>
                        </div>
                        <span style={{fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:20,background:'rgba(201,168,76,0.1)',color:AMBER}}>Pending review</span>
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8,marginBottom:12}}>
                        {KPI_NAMES.map(k => (
                          <div key={k} style={{background:'#f9f9f9',borderRadius:8,padding:'8px 10px',textAlign:'center'}}>
                            <div style={{fontSize:9,fontWeight:600,color:GOLD,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4}}>{k}</div>
                            <div style={{fontSize:18,fontWeight:700,color:DARK,fontFamily:'Georgia,serif'}}>{kpi.kpi_name === k ? kpi.score : '--'}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{display:'flex',gap:8,alignItems:'flex-start'}}>
                        <input
                          placeholder="Re-scrape instruction (required to flag for re-collection)..."
                          value={rejectionNotes[kpi.id] || ''}
                          onChange={e => setRejectionNotes(prev => ({...prev, [kpi.id]: e.target.value}))}
                          style={{flex:1,padding:'8px 12px',border:`1px solid ${BORDER}`,borderRadius:7,fontSize:13,color:DARK,fontFamily:'Inter,sans-serif'}}
                        />
                        <button onClick={() => approveKpi(kpi.id, kpi.brand_id)} disabled={loading} style={{padding:'8px 16px',background:GREEN,color:WHITE,border:'none',borderRadius:7,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif',whiteSpace:'nowrap'}}>✓ Approve</button>
                        <button onClick={() => rejectKpi(kpi.id)} disabled={loading} style={{padding:'8px 16px',background:'#f5f5f5',color:DARK,border:`1px solid ${BORDER}`,borderRadius:7,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif',whiteSpace:'nowrap'}}>↻ Re-scrape</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Eye pending */}
            <div>
              <div style={{fontSize:11,fontWeight:600,color:MID_GREEN,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>
                Solomon's Eye — Pending review ({pendingAudits.length})
              </div>
              {pendingAudits.length === 0 ? (
                <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'24px',textAlign:'center',color:'#aaa',fontSize:13}}>No pending Eye audits. All clear.</div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  {pendingAudits.map(audit => (
                    <div key={audit.id} style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'16px 20px'}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                        <div>
                          <span style={{fontSize:13,fontWeight:600,color:DARK}}>{getBrandName(audit.brand_id)}</span>
                          <span style={{fontSize:11,color:'#aaa',marginLeft:8}}>{audit.category_type} · Benchmark {audit.benchmark} · {new Date(audit.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</span>
                        </div>
                        <span style={{fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:20,background:'rgba(31,74,47,0.1)',color:MID_GREEN}}>Pending review</span>
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:12}}>
                        {[
                          {label:'Overall CX NPS',val:audit.overall_cx_nps},
                          {label:'Total signals',val:audit.total_signals?.toLocaleString()},
                          {label:'Audit type',val:audit.audit_type},
                        ].map(f => (
                          <div key={f.label} style={{background:'#f9f9f9',borderRadius:8,padding:'8px 10px'}}>
                            <div style={{fontSize:9,fontWeight:600,color:MID_GREEN,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4}}>{f.label}</div>
                            <div style={{fontSize:16,fontWeight:700,color:DARK,fontFamily:'Georgia,serif'}}>{f.val || '--'}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{display:'flex',gap:8,alignItems:'flex-start'}}>
                        <input
                          placeholder="Re-scrape instruction (required to flag for re-collection)..."
                          value={rejectionNotes[audit.id] || ''}
                          onChange={e => setRejectionNotes(prev => ({...prev, [audit.id]: e.target.value}))}
                          style={{flex:1,padding:'8px 12px',border:`1px solid ${BORDER}`,borderRadius:7,fontSize:13,color:DARK,fontFamily:'Inter,sans-serif'}}
                        />
                        <button onClick={() => approveAudit(audit.id, audit.brand_id)} disabled={loading} style={{padding:'8px 16px',background:GREEN,color:WHITE,border:'none',borderRadius:7,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif',whiteSpace:'nowrap'}}>✓ Approve</button>
                        <button onClick={() => rejectAudit(audit.id)} disabled={loading} style={{padding:'8px 16px',background:'#f5f5f5',color:DARK,border:`1px solid ${BORDER}`,borderRadius:7,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif',whiteSpace:'nowrap'}}>↻ Re-scrape</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SCRAPER INSTRUCTIONS */}
        {section === 'scraper' && (
          <div>
            <h1 style={{fontFamily:'Georgia,serif',fontSize:25,fontWeight:700,color:DARK,marginBottom:6}}>Scraper instructions</h1>
            <p style={{fontSize:14,color:BODY_TEXT,marginBottom:20}}>Add per-brand instructions for the scraper. These are reviewed by you before execution — the scraper never runs automatically without your confirmation.</p>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {brands.map(b => (
                <div key={b.id} style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'16px 20px'}}>
                  <div style={{fontSize:14,fontWeight:600,color:DARK,marginBottom:4}}>{b.brand_name}</div>
                  <div style={{fontSize:12,color:'#aaa',marginBottom:10}}>{b.category}</div>
                  <textarea
                    placeholder="Add scraper instructions for this brand — e.g. focus on app store reviews, weight YouTube comments higher, exclude sponsored content..."
                    value={scraperInstructions[b.id] || ''}
                    onChange={e => setScraperInstructions(prev => ({...prev, [b.id]: e.target.value}))}
                    rows={3}
                    style={{width:'100%',padding:'10px 12px',border:`1px solid ${BORDER}`,borderRadius:8,fontSize:13,color:DARK,fontFamily:'Inter,sans-serif',resize:'vertical',marginBottom:8}}
                  />
                  <div style={{display:'flex',gap:8}}>
                    <button
                      onClick={async () => {
                        const instruction = scraperInstructions[b.id] || ''
                        if (!instruction) { setMsg('❌ Please add an instruction first.'); return }
                        await fetch(`${SUPABASE_URL}/rest/v1/brands?id=eq.${b.id}`, {
                          method: 'PATCH',
                          headers: { ...headers, 'Prefer': 'return=minimal' },
                          body: JSON.stringify({ scraper_instruction: instruction })
                        })
                        setMsg('✅ Instruction saved. Awaiting your confirmation before scraper runs.')
                      }}
                      style={{padding:'7px 14px',background:GOLD,color:DEEP,border:'none',borderRadius:7,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}
                    >
                      Save instruction
                    </button>
                    <span style={{fontSize:11,color:'#aaa',alignSelf:'center'}}>Scraper will not run until you confirm execution separately.</span>
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