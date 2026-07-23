'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const CATEGORIES = [
  'FMCG — Food and Beverage',
  'FMCG — Personal Care',
  'Health and Wellness',
  'Health Tech',
  'Food Tech',
  'Consumer App',
  'D2C — Fashion',
  'D2C — Home',
  'Financial Services',
  'Education Tech',
  'Travel and Hospitality',
  'Automotive',
  'Real Estate',
  'Other',
]

const REGIONS = [
  { value: 'IN', label: 'India' },
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'AU', label: 'Australia' },
  { value: 'SG', label: 'Southeast Asia' },
  { value: 'GLOBAL', label: 'Global' },
]

export default function BrandSetup() {
  const router = useRouter()
  const [brandName, setBrandName] = useState('')
  const [category, setCategory] = useState('')
  const [geo, setGeo] = useState('IN')
  const [categoryType, setCategoryType] = useState('LIHI')
  const [competitors, setCompetitors] = useState(['', '', '', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/login')
      else setUserEmail(data.user.email || '')
    })
  }, [router])

  const handleCompetitor = (index: number, value: string) => {
    const updated = [...competitors]
    updated[index] = value
    setCompetitors(updated)
  }

  const handleSave = async () => {
    if (!brandName.trim()) { setError('Brand name is required'); return }
    if (!category) { setError('Please select a category'); return }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { error } = await supabase.from('brands').upsert({
      user_id: user.id,
      brand_name: brandName.trim(),
      category,
      geo,
      category_type: categoryType,
      competitor_1: competitors[0].trim() || null,
      competitor_2: competitors[1].trim() || null,
      competitor_3: competitors[2].trim() || null,
      competitor_4: competitors[3].trim() || null,
      competitor_5: competitors[4].trim() || null,
      competitor_6: competitors[5].trim() || null,
      competitor_7: competitors[6].trim() || null,
      competitor_8: competitors[7].trim() || null,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard')
  }

  return (
    <div style={{minHeight:'100vh',background:'#0F2318',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 24px'}}>

      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:48}}>
        <svg width="28" height="22" viewBox="0 0 56 44" fill="none"><path d="M4 36L12 14L22 26L28 6L34 26L44 14L52 36H4Z" fill="#C9A84C"/><rect x="4" y="36" width="48" height="6" rx="2" fill="#A07830"/></svg>
        <div style={{display:'flex',flexDirection:'column',lineHeight:1.1}}>
          <span style={{fontFamily:'Georgia,serif',fontSize:16,fontWeight:700,color:'#F5F0E8',letterSpacing:'0.1em'}}>KING SOLOMON</span>
          <span style={{fontSize:10,color:'#C9A84C',letterSpacing:'0.08em'}}>Consumer intelligence that tells you why.</span>
        </div>
      </div>

      <div style={{width:'100%',maxWidth:600,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:16,padding:'40px 48px'}}>
        <p style={{fontSize:11,fontWeight:600,letterSpacing:'0.15em',textTransform:'uppercase',color:'#C9A84C',marginBottom:12}}>Brand setup</p>
        <h1 style={{fontFamily:'Georgia,serif',fontSize:28,fontWeight:700,color:'#F5F0E8',marginBottom:8}}>Tell us about your brand</h1>
        <p style={{fontSize:14,color:'#C8C2B6',marginBottom:32,lineHeight:1.6}}>King Solomon uses this to calibrate signals and benchmark against the right competitive set.</p>

        {error && <p style={{color:'#e87878',fontSize:13,marginBottom:16}}>{error}</p>}

        {/* Brand Name */}
        <div style={{marginBottom:20}}>
          <label style={{display:'block',fontSize:12,fontWeight:600,color:'#C9A84C',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:8}}>Brand name</label>
          <input type="text" placeholder="e.g. Mamaearth" value={brandName} onChange={e => setBrandName(e.target.value)}
            style={{width:'100%',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:8,padding:'12px 16px',color:'#F5F0E8',fontSize:15,outline:'none'}}/>
        </div>

        {/* Category */}
        <div style={{marginBottom:20}}>
          <label style={{display:'block',fontSize:12,fontWeight:600,color:'#C9A84C',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:8}}>Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)}
            style={{width:'100%',background:'#1B4D35',border:'1px solid rgba(255,255,255,0.12)',borderRadius:8,padding:'12px 16px',color:category?'#F5F0E8':'#C8C2B6',fontSize:15,outline:'none'}}>
            <option value="" disabled>Select your category</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Primary Market */}
        <div style={{marginBottom:20}}>
          <label style={{display:'block',fontSize:12,fontWeight:600,color:'#C9A84C',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:6}}>Primary market</label>
          <p style={{fontSize:12,color:'#C8C2B6',marginBottom:8}}>King Solomon will pull signals from this region by default.</p>
          <select value={geo} onChange={e => setGeo(e.target.value)}
            style={{width:'100%',background:'#1B4D35',border:'1px solid rgba(255,255,255,0.12)',borderRadius:8,padding:'12px 16px',color:'#F5F0E8',fontSize:15,outline:'none'}}>
            {REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        {/* Brand type */}
        <div style={{marginBottom:20}}>
          <label style={{display:'block',fontSize:12,fontWeight:600,color:'#C9A84C',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:6}}>Brand involvement type</label>
          <p style={{fontSize:12,color:'#C8C2B6',marginBottom:10}}>LIHI — Low involvement, high interest (FMCG, D2C). HILI — High involvement, low impulse (Health Tech, Financial Services).</p>
          <div style={{display:'flex',gap:10}}>
            {['LIHI','HILI'].map(t => (
              <button key={t} onClick={() => setCategoryType(t)}
                style={{flex:1,padding:'10px',borderRadius:8,border:`1px solid ${categoryType===t?'#C9A84C':'rgba(255,255,255,0.12)'}`,background:categoryType===t?'rgba(201,168,76,0.15)':'rgba(255,255,255,0.04)',color:categoryType===t?'#C9A84C':'#C8C2B6',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Competitors */}
        <div style={{marginBottom:32}}>
          <label style={{display:'block',fontSize:12,fontWeight:600,color:'#C9A84C',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:4}}>
            Competitors <span style={{color:'rgba(197,194,186,0.4)',fontWeight:400,textTransform:'none',letterSpacing:0}}>(up to 8 — aim for 90% of category conversation)</span>
          </label>
          <p style={{fontSize:12,color:'#C8C2B6',marginBottom:12}}>King Solomon benchmarks your signals against these brands. More competitors = more accurate category proxy.</p>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            {competitors.map((c, i) => (
              <input key={i} type="text" placeholder={`Competitor ${i + 1}`} value={c} onChange={e => handleCompetitor(i, e.target.value)}
                style={{width:'100%',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:8,padding:'10px 14px',color:'#F5F0E8',fontSize:14,outline:'none'}}/>
            ))}
          </div>
        </div>

        <button onClick={handleSave} disabled={loading}
          style={{width:'100%',background:'#C9A84C',color:'#0F2318',border:'none',borderRadius:8,padding:'14px',fontSize:15,fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
          {loading ? 'Saving...' : 'Save and go to dashboard →'}
        </button>
      </div>

      <p style={{marginTop:24,fontSize:12,color:'rgba(197,194,186,0.3)'}}>{userEmail}</p>
    </div>
  )
}