'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Competitor {
  id: string
  name: string
}

export default function CampaignSetup() {
  const router = useRouter()
  const supabase = createClient()

  const [brandId, setBrandId] = useState<string | null>(null)
  const [pageLoading, setPageLoading] = useState(true)

  // Campaign fields
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [channels, setChannels] = useState('')
  const [budget, setBudget] = useState('')
  const [objective, setObjective] = useState('')

  // Measurement mode
  const [measurementMode, setMeasurementMode] = useState<'auto' | 'manual'>('manual')
  const [preOffset, setPreOffset] = useState('3')
  const [midOffset, setMidOffset] = useState('')
  const [postOffset, setPostOffset] = useState('3')

  // Competitors
  const [existingCompetitors, setExistingCompetitors] = useState<Competitor[]>([])
  const [selectedCompetitorIds, setSelectedCompetitorIds] = useState<string[]>([])
  const [newCompetitorName, setNewCompetitorName] = useState('')

  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: brand, error: brandError } = await supabase
        .from('brands')
        .select('id, competitor_1, competitor_2, competitor_3')
        .eq('user_id', user.id)
        .maybeSingle()

      if (brandError || !brand) { router.push('/brand-setup'); return }
      setBrandId(brand.id)

      // Load existing competitors for this brand
      const { data: comps } = await supabase
        .from('competitors')
        .select('id, name')
        .eq('brand_id', brand.id)
        .order('name')

      if (comps && comps.length > 0) {
        setExistingCompetitors(comps)
      } else {
        // No competitors saved yet — seed suggestions from brand-setup, but don't save until used
        const suggestions = [brand.competitor_1, brand.competitor_2, brand.competitor_3]
          .filter(Boolean)
          .map((name, i) => ({ id: `suggestion-${i}`, name: name as string }))
        setExistingCompetitors(suggestions)
      }

      setPageLoading(false)
    }
    init()
  }, [])

  const toggleCompetitor = (id: string) => {
    setSelectedCompetitorIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const handleAddNewCompetitor = () => {
    if (!newCompetitorName.trim()) return
    const tempId = `new-${Date.now()}`
    setExistingCompetitors(prev => [...prev, { id: tempId, name: newCompetitorName.trim() }])
    setSelectedCompetitorIds(prev => [...prev, tempId])
    setNewCompetitorName('')
  }

  const handleSave = async () => {
    setError('')

    if (!name.trim()) { setError('Campaign name is required.'); return }
    if (!startDate || !endDate) { setError('Start and end dates are required.'); return }
    if (new Date(endDate) < new Date(startDate)) { setError('End date cannot be before start date.'); return }
    if (!channels.trim()) { setError('Please list at least one channel.'); return }
    if (!budget) { setError('Budget is required.'); return }
    if (!objective.trim()) { setError('Objective is required.'); return }
    if (selectedCompetitorIds.length === 0) { setError('Select or add at least one competitor to benchmark against.'); return }
    if (!brandId) { setError('Brand not found. Please complete brand setup first.'); return }

    setSaving(true)

    // Step 1: resolve competitors — real ones (uuid) vs ones that need to be created
    // "suggestion-" and "new-" prefixed ids are not real DB rows yet
    const resolvedCompetitorIds: string[] = []

    for (const id of selectedCompetitorIds) {
      const comp = existingCompetitors.find(c => c.id === id)
      if (!comp) continue

      if (id.startsWith('suggestion-') || id.startsWith('new-')) {
        // Create this competitor in the DB now
        const { data: created, error: createError } = await supabase
          .from('competitors')
          .insert({ brand_id: brandId, name: comp.name })
          .select('id')
          .single()

        if (createError) {
          // Likely a duplicate name race — try to fetch the existing one instead
          const { data: existing } = await supabase
            .from('competitors')
            .select('id')
            .eq('brand_id', brandId)
            .ilike('name', comp.name)
            .maybeSingle()
          if (existing) resolvedCompetitorIds.push(existing.id)
        } else if (created) {
          resolvedCompetitorIds.push(created.id)
        }
      } else {
        resolvedCompetitorIds.push(id)
      }
    }

    // Step 2: create the campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert({
        brand_id: brandId,
        name: name.trim(),
        start_date: startDate,
        end_date: endDate,
        channels: channels.trim(),
        budget: parseFloat(budget),
        objective: objective.trim(),
        measurement_mode: measurementMode,
        pre_offset_days: measurementMode === 'auto' && preOffset ? parseInt(preOffset) : null,
        mid_offset_days: measurementMode === 'auto' && midOffset ? parseInt(midOffset) : null,
        post_offset_days: measurementMode === 'auto' && postOffset ? parseInt(postOffset) : null,
      })
      .select('id')
      .single()

    if (campaignError || !campaign) {
      setError(campaignError?.message || 'Failed to create campaign. Please try again.')
      setSaving(false)
      return
    }

    // Step 3: link competitors to this campaign
    if (resolvedCompetitorIds.length > 0) {
      const links = resolvedCompetitorIds.map(competitor_id => ({
        campaign_id: campaign.id,
        competitor_id
      }))
      const { error: linkError } = await supabase.from('campaign_competitors').insert(links)
      if (linkError) {
        setError('Campaign created, but linking competitors failed: ' + linkError.message)
        setSaving(false)
        return
      }
    }

    router.push('/dashboard')
  }

  if (pageLoading) {
    return (
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#0F2318'}}>
        <div style={{color:'#C9A84C'}}>Loading...</div>
      </div>
    )
  }

  const inputStyle = {
    width:'100%',
    background:'rgba(255,255,255,0.04)',
    border:'1px solid rgba(255,255,255,0.12)',
    borderRadius:8,
    padding:'12px 16px',
    color:'#F5F0E8',
    fontSize:15,
    outline:'none' as const,
  }

  const labelStyle = {
    display:'block' as const,
    fontSize:12,
    fontWeight:600,
    color:'#C9A84C',
    letterSpacing:'0.08em',
    textTransform:'uppercase' as const,
    marginBottom:8,
  }

  return (
    <div style={{minHeight:'100vh',background:'#0F2318',padding:'40px 24px'}}>
      <div style={{maxWidth:640,margin:'0 auto'}}>

        {/* Header */}
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:40}}>
          <svg width="28" height="22" viewBox="0 0 56 44" fill="none"><path d="M4 36L12 14L22 26L28 6L34 26L44 14L52 36H4Z" fill="#C9A84C"/><rect x="4" y="36" width="48" height="6" rx="2" fill="#A07830"/></svg>
          <div style={{display:'flex',flexDirection:'column',lineHeight:1.1}}>
            <span style={{fontFamily:'Georgia,serif',fontSize:16,fontWeight:700,color:'#F5F0E8',letterSpacing:'0.1em'}}>KING SOLOMON</span>
            <span style={{fontSize:10,color:'#C9A84C',letterSpacing:'0.08em'}}>Consumer intelligence that tells you why.</span>
          </div>
        </div>

        {/* Card */}
        <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:16,padding:'40px 48px'}}>
          <h1 style={{fontFamily:'Georgia,serif',fontSize:28,fontWeight:700,color:'#F5F0E8',marginBottom:8}}>New campaign</h1>
          <p style={{fontSize:14,color:'#C8C2B6',marginBottom:32,lineHeight:1.6}}>Set up a campaign so King Solomon can track its impact on your brand scores.</p>

          {error && (
            <div style={{background:'rgba(232,120,120,0.1)',border:'1px solid rgba(232,120,120,0.3)',borderRadius:8,padding:'12px 16px',marginBottom:24}}>
              <p style={{color:'#e87878',fontSize:13,lineHeight:1.5}}>{error}</p>
            </div>
          )}

          {/* Campaign Name */}
          <div style={{marginBottom:24}}>
            <label style={labelStyle}>Campaign Name</label>
            <input type="text" placeholder="e.g. Monsoon Launch 2026" value={name}
              onChange={e => setName(e.target.value)} style={inputStyle} />
          </div>

          {/* Dates */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:24}}>
            <div>
              <label style={labelStyle}>Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>End Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inputStyle} />
            </div>
          </div>

          {/* Channels */}
          <div style={{marginBottom:24}}>
            <label style={labelStyle}>Channels</label>
            <input type="text" placeholder="e.g. Meta, Google, PR, Influencer" value={channels}
              onChange={e => setChannels(e.target.value)} style={inputStyle} />
            <p style={{fontSize:12,color:'rgba(197,194,186,0.5)',marginTop:6}}>Comma-separated. Type freely — no fixed list.</p>
          </div>

          {/* Budget + Objective */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:24}}>
            <div>
              <label style={labelStyle}>Budget (₹)</label>
              <input type="number" placeholder="e.g. 500000" value={budget}
                onChange={e => setBudget(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Objective</label>
              <input type="text" placeholder="e.g. Awareness push" value={objective}
                onChange={e => setObjective(e.target.value)} style={inputStyle} />
            </div>
          </div>

          {/* Competitors */}
          <div style={{marginBottom:24}}>
            <label style={labelStyle}>Competitors to benchmark</label>
            <p style={{fontSize:12,color:'#C8C2B6',marginBottom:12}}>Pick who you're measuring against for this campaign — it can differ from other campaigns.</p>

            {existingCompetitors.length > 0 && (
              <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:12}}>
                {existingCompetitors.map(c => {
                  const selected = selectedCompetitorIds.includes(c.id)
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCompetitor(c.id)}
                      style={{
                        padding:'8px 14px',
                        borderRadius:20,
                        fontSize:13,
                        cursor:'pointer',
                        border: selected ? '1px solid #C9A84C' : '1px solid rgba(255,255,255,0.12)',
                        background: selected ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.04)',
                        color: selected ? '#C9A84C' : '#C8C2B6',
                      }}
                    >
                      {selected ? '✓ ' : ''}{c.name}
                    </button>
                  )
                })}
              </div>
            )}

            <div style={{display:'flex',gap:8}}>
              <input
                type="text"
                placeholder="Add a new competitor"
                value={newCompetitorName}
                onChange={e => setNewCompetitorName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddNewCompetitor() } }}
                style={{...inputStyle, flex:1}}
              />
              <button
                type="button"
                onClick={handleAddNewCompetitor}
                style={{padding:'0 20px',borderRadius:8,border:'1px solid rgba(255,255,255,0.12)',background:'rgba(255,255,255,0.04)',color:'#F5F0E8',fontSize:14,cursor:'pointer'}}
              >
                Add
              </button>
            </div>
          </div>

          {/* Measurement Mode */}
          <div style={{marginBottom:24}}>
            <label style={labelStyle}>Measurement Mode</label>
            <p style={{fontSize:12,color:'#C8C2B6',marginBottom:12}}>Auto schedules KPI snapshots for you. Manual lets you trigger them whenever you choose.</p>
            <div style={{display:'flex',gap:10}}>
              {(['manual','auto'] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setMeasurementMode(mode)}
                  style={{
                    flex:1,
                    padding:'12px',
                    borderRadius:8,
                    fontSize:14,
                    fontWeight:600,
                    cursor:'pointer',
                    textTransform:'capitalize',
                    border: measurementMode === mode ? '1px solid #C9A84C' : '1px solid rgba(255,255,255,0.12)',
                    background: measurementMode === mode ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.04)',
                    color: measurementMode === mode ? '#C9A84C' : '#C8C2B6',
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Auto mode offsets */}
          {measurementMode === 'auto' && (
            <div style={{marginBottom:24,padding:'20px',background:'rgba(201,168,76,0.06)',border:'1px solid rgba(201,168,76,0.2)',borderRadius:10}}>
              <p style={{fontSize:12,fontWeight:600,color:'#C9A84C',marginBottom:14,letterSpacing:'0.05em',textTransform:'uppercase'}}>Wave timing</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
                <div>
                  <label style={{...labelStyle,fontSize:11}}>Pre (days before start)</label>
                  <input type="number" min="0" value={preOffset} onChange={e => setPreOffset(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{...labelStyle,fontSize:11}}>Mid (days after start)</label>
                  <input type="number" min="0" placeholder="e.g. 7" value={midOffset} onChange={e => setMidOffset(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{...labelStyle,fontSize:11}}>Post (days after end)</label>
                  <input type="number" min="0" value={postOffset} onChange={e => setPostOffset(e.target.value)} style={inputStyle} />
                </div>
              </div>
            </div>
          )}

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{width:'100%',background:'#C9A84C',color:'#0F2318',border:'none',borderRadius:8,padding:'14px',fontSize:15,fontWeight:600,cursor:'pointer',marginTop:8}}
          >
            {saving ? 'Creating campaign...' : 'Create campaign'}
          </button>
        </div>
      </div>
    </div>
  )
}