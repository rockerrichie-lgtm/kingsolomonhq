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

const SUPABASE_URL = 'https://alrwyeenxeuxgkcskkes.supabase.co'
const ADMIN_PASSWORD = 'ks-admin-2026'
const CX_THEMES = ['Product', 'Experience', 'Customer Service', 'Pricing', 'Collections']
const KPI_NAMES = ['awareness', 'consideration', 'usage', 'imagery', 'buzz']

type Section = 'orders' | 'clients' | 'eye' | 'iq'

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [section, setSection] = useState<Section>('orders')
  const [orders, setOrders] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const [eyeBrandId, setEyeBrandId] = useState('')
  const [eyeUserId, setEyeUserId] = useState('')
  const [overallNps, setOverallNps] = useState('')
  const [totalSignals, setTotalSignals] = useState('')
  const [benchmark, setBenchmark] = useState('45')
  const [categoryType, setCategoryType] = useState('LIHI')
  const [eyeVerdict, setEyeVerdict] = useState('')
  const [themeData, setThemeData] = useState(
    CX_THEMES.map(t => ({ theme: t, nps_score: '', signal_count: '', dropout_rate: '', top_concern: '', sentiment: 'neutral' }))
  )

  const [iqBrandId, setIqBrandId] = useState('')
  const [iqCheckpoint, setIqCheckpoint] = useState('current')
  const [kpiData, setKpiData] = useState(
    KPI_NAMES.map(k => ({ kpi_name: k, score: '', zone: 'contested', movement: '' }))
  )

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

  const fetchClients = async () => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/brands?select=*&order=created_at.desc`, { headers })
    const data = await res.json()
    setClients(Array.isArray(data) ? data : [])
    setBrands(Array.isArray(data) ? data : [])
  }

  useEffect(() => {
    if (authed) {
      fetchOrders()
      fetchClients()
    }
  }, [authed])

  const markPaid = async (orderId: string) => {
    await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`, {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ status: 'paid' })
    })
    setMsg('Order marked as paid.')
    fetchOrders()
  }

  const submitEye = async () => {
    setLoading(true)
    setMsg('')
    try {
      const auditRes = await fetch(`${SUPABASE_URL}/rest/v1/cx_audits`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify({
          brand_id: eyeBrandId,
          user_id: eyeUserId,
          audit_type: 'standard',
          status: 'ready',
          audit_date: new Date().toISOString(),
          overall_cx_nps: parseInt(overallNps),
          total_signals: parseInt(totalSignals),
          benchmark: parseInt(benchmark),
          category_type: categoryType,
        })
      })
      const audit = await auditRes.json()
      const auditId = Array.isArray(audit) ? audit[0].id : audit.id

      const themeRows = themeData
        .filter(t => t.nps_score !== '')
        .map(t => ({
          audit_id: auditId,
          brand_id: eyeBrandId,
          theme: t.theme,
          nps_score: parseInt(t.nps_score),
          signal_count: parseInt(t.signal_count) || null,
          dropout_rate: parseFloat(t.dropout_rate) || null,
          top_concern: t.top_concern || null,
          sentiment: t.sentiment,
          confidence: 'standard',
        }))

      if (themeRows.length > 0) {
        await fetch(`${SUPABASE_URL}/rest/v1/cx_theme_scores`, {
          method: 'POST',
          headers: { ...headers, 'Prefer': 'return=minimal' },
          body: JSON.stringify(themeRows)
        })
      }

      if (eyeVerdict) {
        await fetch(`${SUPABASE_URL}/rest/v1/cx_verdicts`, {
          method: 'POST',
          headers: { ...headers, 'Prefer': 'return=minimal' },
          body: JSON.stringify({
            audit_id: auditId,
            brand_id: eyeBrandId,
            narrative: eyeVerdict,
            mystery_audit_triggered: false,
            status: 'ready',
          })
        })
      }

      setMsg('✅ Eye audit submitted. Customer dashboard updated.')
    } catch (e) {
      setMsg('❌ Error submitting audit.')
      console.error(e)
    }
    setLoading(false)
  }

  const submitIQ = async () => {
    setLoading(true)
    setMsg('')
    try {
      const rows = kpiData
        .filter(k => k.score !== '')
        .map(k => ({
          brand_id: iqBrandId,
          kpi_name: k.kpi_name,
          score: parseInt(k.score),
          zone: k.zone,
          movement: k.movement ? parseInt(k.movement) : null,
          snapshot_type: 'brand_level',
          checkpoint: iqCheckpoint,
          confidence_level: 'high',
          sources_count: 14,
          last_updated: new Date().toISOString(),
        }))

      await fetch(`${SUPABASE_URL}/rest/v1/kpi_snapshots`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=minimal' },
        body: JSON.stringify(rows)
      })

      setMsg('✅ IQ scores submitted. Customer dashboard updated.')
    } catch (e) {
      setMsg('❌ Error submitting IQ scores.')
      console.error(e)
    }
    setLoading(false)
  }

  if (!authed) return (
    <div style={{minHeight:'100vh',background:DEEP,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <style>{`*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; } body { font-family: 'Inter', sans-serif; }`}</style>
      <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:'40px 36px',width:320,textAlign:'center'}}>
        <div style={{fontSize:32,color:GOLD,marginBottom:12}}>♛</div>
        <div style={{fontFamily:'Georgia,serif',fontSize:18,fontWeight:700,color:CREAM,marginBottom:4}}>Admin Panel</div>
        <div style={{fontSize:12,color:CREAM_DIM,marginBottom:24}}>King Solomon — internal only</div>
        <input
          type="password"
          placeholder="Admin password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { if (password === ADMIN_PASSWORD) { setAuthed(true) } else { setMsg('Wrong password') } } }}
          style={{width:'100%',padding:'10px 14px',borderRadius:8,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.06)',color:CREAM,fontSize:14,marginBottom:12,fontFamily:'Inter,sans-serif'}}
        />
        <button
          onClick={() => { if (password === ADMIN_PASSWORD) { setAuthed(true) } else { setMsg('Wrong password') } }}
          style={{width:'100%',padding:'10px',background:GOLD,color:DEEP,border:'none',borderRadius:8,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}
        >
          Enter
        </button>
        {msg && <div style={{marginTop:12,fontSize:12,color:RED}}>{msg}</div>}
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#f9f9f9',display:'flex'}}>
      <style>{`*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; } body { font-family: 'Inter', sans-serif; }`}</style>

      <div style={{width:200,background:DEEP,display:'flex',flexDirection:'column',position:'fixed',top:0,left:0,bottom:0,zIndex:50}}>
        <div style={{padding:'20px 16px',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
          <div style={{fontSize:10,color:GOLD,fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase'}}>King Solomon</div>
          <div style={{fontSize:12,color:CREAM_DIM,marginTop:2}}>Admin panel</div>
        </div>
        {([['orders','📋 Orders'],['clients','🏢 Clients'],['eye','👁 Eye data entry'],['iq','📊 IQ score entry']] as const).map(([key,label]) => (
          <div
            key={key}
            onClick={() => setSection(key)}
            style={{padding:'10px 16px',fontSize:13,color:section===key?CREAM:CREAM_DIM,borderLeft:section===key?`2px solid ${GOLD}`:'2px solid transparent',background:section===key?'rgba(201,168,76,0.08)':'transparent',cursor:'pointer'}}
          >
            {label}
          </div>
        ))}
        <div style={{marginTop:'auto',padding:'12px 16px',borderTop:'1px solid rgba(255,255,255,0.07)'}}>
          <button onClick={() => setAuthed(false)} style={{fontSize:11,color:CREAM_DIM,background:'none',border:'none',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Sign out</button>
        </div>
      </div>

      <div style={{flex:1,marginLeft:200,padding:32}}>

        {msg && (
          <div style={{padding:'10px 16px',borderRadius:8,background:msg.startsWith('✅')?'rgba(95,198,138,0.1)':'rgba(232,120,120,0.1)',border:`1px solid ${msg.startsWith('✅')?'rgba(95,198,138,0.3)':'rgba(232,120,120,0.3)'}`,fontSize:13,color:msg.startsWith('✅')?'#1a6b1a':'#7a1a1a',marginBottom:20}}>
            {msg}
          </div>
        )}

        {section === 'orders' && (
          <div>
            <h1 style={{fontFamily:'Georgia,serif',fontSize:25,fontWeight:700,color:DARK,marginBottom:20}}>Orders</h1>
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

        {section === 'clients' && (
          <div>
            <h1 style={{fontFamily:'Georgia,serif',fontSize:25,fontWeight:700,color:DARK,marginBottom:20}}>Clients</h1>
            <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,overflow:'hidden'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                <thead>
                  <tr style={{background:'#fafafa'}}>
                    {['Brand','Category','Competitors','Brand ID','User ID'].map(h => (
                      <th key={h} style={{textAlign:'left',padding:'10px 16px',fontWeight:600,color:'#aaa',fontSize:11,textTransform:'uppercase',letterSpacing:'0.08em',borderBottom:`1px solid ${BORDER}`}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clients.map(c => (
                    <tr key={c.id} style={{borderBottom:`1px solid ${BORDER}`}}>
                      <td style={{padding:'10px 16px',color:DARK,fontWeight:600}}>{c.brand_name}</td>
                      <td style={{padding:'10px 16px',color:BODY_TEXT}}>{c.category}</td>
                      <td style={{padding:'10px 16px',color:BODY_TEXT,fontSize:12}}>{[c.competitor_1,c.competitor_2,c.competitor_3].filter(Boolean).join(', ')}</td>
                      <td style={{padding:'10px 16px',color:'#aaa',fontSize:11,fontFamily:'monospace'}}>{c.id?.slice(0,8)}...</td>
                      <td style={{padding:'10px 16px',color:'#aaa',fontSize:11,fontFamily:'monospace'}}>{c.user_id?.slice(0,8)}...</td>
                    </tr>
                  ))}
                  {clients.length === 0 && <tr><td colSpan={5} style={{padding:'24px',textAlign:'center',color:'#aaa',fontSize:13}}>No clients yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {section === 'eye' && (
          <div style={{maxWidth:800}}>
            <h1 style={{fontFamily:'Georgia,serif',fontSize:25,fontWeight:700,color:DARK,marginBottom:4}}>Eye data entry</h1>
            <p style={{fontSize:14,color:BODY_TEXT,marginBottom:24}}>Enter CX audit results. Submitting updates the customer dashboard instantly.</p>

            <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'20px 24px',marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:600,color:GOLD,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Select brand</div>
              <select
                value={eyeBrandId}
                onChange={e => {
                  const b = brands.find((br: any) => br.id === e.target.value)
                  setEyeBrandId(e.target.value)
                  setEyeUserId(b?.user_id || '')
                }}
                style={{width:'100%',padding:'9px 12px',border:`1px solid ${BORDER}`,borderRadius:8,fontSize:14,color:DARK,background:WHITE,fontFamily:'Inter,sans-serif'}}
              >
                <option value="">Select a brand</option>
                {brands.map((b: any) => <option key={b.id} value={b.id}>{b.brand_name} — {b.category}</option>)}
              </select>
            </div>

            <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'20px 24px',marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:600,color:GOLD,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Audit overview</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:12}}>
                {[
                  {label:'Overall CX NPS',val:overallNps,set:setOverallNps,ph:'+32'},
                  {label:'Total signals',val:totalSignals,set:setTotalSignals,ph:'1240'},
                  {label:'Benchmark',val:benchmark,set:setBenchmark,ph:'45'},
                  {label:'Category type',val:categoryType,set:setCategoryType,ph:'LIHI'},
                ].map(f => (
                  <div key={f.label}>
                    <div style={{fontSize:11,color:BODY_TEXT,marginBottom:4}}>{f.label}</div>
                    <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} style={{width:'100%',padding:'8px 10px',border:`1px solid ${BORDER}`,borderRadius:7,fontSize:13,color:DARK,fontFamily:'Inter,sans-serif'}}/>
                  </div>
                ))}
              </div>
            </div>

            <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'20px 24px',marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:600,color:GOLD,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Theme scores</div>
              {themeData.map((t, i) => (
                <div key={t.theme} style={{borderBottom:`1px solid ${BORDER}`,paddingBottom:14,marginBottom:14}}>
                  <div style={{fontSize:13,fontWeight:600,color:DARK,marginBottom:8}}>{t.theme}</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr',gap:10}}>
                    {[
                      {label:'NPS score',key:'nps_score',ph:'+41'},
                      {label:'Signals',key:'signal_count',ph:'320'},
                      {label:'Drop-off %',key:'dropout_rate',ph:'8.2'},
                      {label:'Sentiment',key:'sentiment',ph:'positive'},
                      {label:'Top concern',key:'top_concern',ph:'App crashes...'},
                    ].map(f => (
                      <div key={f.key}>
                        <div style={{fontSize:10,color:'#aaa',marginBottom:3}}>{f.label}</div>
                        <input
                          value={(t as any)[f.key]}
                          onChange={e => {
                            const updated = [...themeData]
                            updated[i] = {...updated[i], [f.key]: e.target.value}
                            setThemeData(updated)
                          }}
                          placeholder={f.ph}
                          style={{width:'100%',padding:'6px 8px',border:`1px solid ${BORDER}`,borderRadius:6,fontSize:12,color:DARK,fontFamily:'Inter,sans-serif'}}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'20px 24px',marginBottom:20}}>
              <div style={{fontSize:11,fontWeight:600,color:GOLD,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Solomon&apos;s Eye Verdict</div>
              <textarea
                value={eyeVerdict}
                onChange={e => setEyeVerdict(e.target.value)}
                placeholder="Write the full verdict narrative here..."
                rows={5}
                style={{width:'100%',padding:'10px 14px',border:`1px solid ${BORDER}`,borderRadius:8,fontSize:14,color:DARK,fontFamily:'Inter,sans-serif',resize:'vertical'}}
              />
            </div>

            <button onClick={submitEye} disabled={loading||!eyeBrandId} style={{padding:'12px 28px',background:loading?'rgba(201,168,76,0.5)':GOLD,color:DEEP,border:'none',borderRadius:8,fontSize:14,fontWeight:600,cursor:loading?'not-allowed':'pointer',fontFamily:'Inter,sans-serif'}}>
              {loading ? 'Submitting...' : 'Submit Eye audit →'}
            </button>
          </div>
        )}

        {section === 'iq' && (
          <div style={{maxWidth:800}}>
            <h1 style={{fontFamily:'Georgia,serif',fontSize:25,fontWeight:700,color:DARK,marginBottom:4}}>IQ score entry</h1>
            <p style={{fontSize:14,color:BODY_TEXT,marginBottom:24}}>Enter KPI scores manually. Submitting updates the customer dashboard instantly.</p>

            <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'20px 24px',marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:600,color:GOLD,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Select brand and time window</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>
                  <div style={{fontSize:11,color:BODY_TEXT,marginBottom:4}}>Brand</div>
                  <select value={iqBrandId} onChange={e => setIqBrandId(e.target.value)} style={{width:'100%',padding:'9px 12px',border:`1px solid ${BORDER}`,borderRadius:8,fontSize:14,color:DARK,background:WHITE,fontFamily:'Inter,sans-serif'}}>
                    <option value="">Select a brand</option>
                    {brands.map((b: any) => <option key={b.id} value={b.id}>{b.brand_name}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{fontSize:11,color:BODY_TEXT,marginBottom:4}}>Time window</div>
                  <select value={iqCheckpoint} onChange={e => setIqCheckpoint(e.target.value)} style={{width:'100%',padding:'9px 12px',border:`1px solid ${BORDER}`,borderRadius:8,fontSize:14,color:DARK,background:WHITE,fontFamily:'Inter,sans-serif'}}>
                    <option value="current">Current</option>
                    <option value="30d">30d</option>
                    <option value="60d">60d</option>
                    <option value="90d">90d</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:12,padding:'20px 24px',marginBottom:20}}>
              <div style={{fontSize:11,fontWeight:600,color:GOLD,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>KPI scores</div>
              {kpiData.map((k, i) => (
                <div key={k.kpi_name} style={{borderBottom:`1px solid ${BORDER}`,paddingBottom:14,marginBottom:14}}>
                  <div style={{fontSize:13,fontWeight:600,color:DARK,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.06em'}}>{k.kpi_name}</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
                    {[
                      {label:'Score (0–100)',key:'score',ph:'72'},
                      {label:'Zone',key:'zone',ph:'established'},
                      {label:'Movement (pts)',key:'movement',ph:'+4'},
                    ].map(f => (
                      <div key={f.key}>
                        <div style={{fontSize:10,color:'#aaa',marginBottom:3}}>{f.label}</div>
                        <input
                          value={(k as any)[f.key]}
                          onChange={e => {
                            const updated = [...kpiData]
                            updated[i] = {...updated[i], [f.key]: e.target.value}
                            setKpiData(updated)
                          }}
                          placeholder={f.ph}
                          style={{width:'100%',padding:'7px 10px',border:`1px solid ${BORDER}`,borderRadius:6,fontSize:13,color:DARK,fontFamily:'Inter,sans-serif'}}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button onClick={submitIQ} disabled={loading||!iqBrandId} style={{padding:'12px 28px',background:loading?'rgba(201,168,76,0.5)':GOLD,color:DEEP,border:'none',borderRadius:8,fontSize:14,fontWeight:600,cursor:loading?'not-allowed':'pointer',fontFamily:'Inter,sans-serif'}}>
              {loading ? 'Submitting...' : 'Submit IQ scores →'}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}