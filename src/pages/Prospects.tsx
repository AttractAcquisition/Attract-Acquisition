import { useEffect, useState, useMemo } from 'react'
import { supabase, type Prospect } from '../lib/supabase'
import { Search, Plus, RefreshCw, ChevronRight, X, Save } from 'lucide-react'
import { useAuth } from '../lib/auth'
import ProspectDetailView from '../components/prospects/ProspectDetailView'
import { useToast } from '../lib/toast'

const STAGES = ['First Touch', 'Positive Response', 'MJR Sent', 'Follow Up', 'Call Booked', 'Sprint Booked']
const ICP_TIERS = [
  { value: '★★★', label: '3 Star (High)' },
  { value: '★★', label: '2 Star (Mid)' },
  { value: '★', label: '1 Star (Low)' },
  { value: 'unscored', label: 'Unscored' }
]

export default function Prospects() {
  const { role, metadata_id } = useAuth()
  const { toast } = useToast()
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  
  // Filter States
  const [filterStage, setFilterStage] = useState('')
  const [filterVertical, setFilterVertical] = useState('')
  const [filterSuburb, setFilterSuburb] = useState('')
  const [filterTier, setFilterTier] = useState('')

  const [selected, setSelected] = useState<Prospect | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Initial Form State
  const initialFormState = {
    business_name: '',
    vertical: '',
    suburb: '',
    phone: '',
    website: '',
    pipeline_stage: 'First Touch',
    icp_tier: 'unscored'
  }

  const [newProspect, setNewProspect] = useState<Partial<Prospect>>(initialFormState)

  useEffect(() => { load() }, [metadata_id])

  async function load() {
  setLoading(true)
  let q = supabase
    .from('prospects')
    .select<string, Prospect>('*')
    .eq('is_archived', false) // <--- Add this line here
    .order('created_at', { ascending: false })
  
  if (role === 'distribution' && metadata_id) q = q.eq('assigned_to', metadata_id)

  const { data } = await q
  setProspects((data || []).map(p => ({ ...p, pipeline_stage: p.pipeline_stage || 'First Touch' })))
  setLoading(false)
}

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProspect.business_name) return toast('Business name is required', 'error')
    
    setIsSaving(true)
    
    // Explicitly casting to ensure TypeScript knows business_name exists
    const payload = {
      business_name: newProspect.business_name,
      vertical: newProspect.vertical || '',
      suburb: newProspect.suburb || '',
      phone: newProspect.phone || '',
      website: newProspect.website || '',
      pipeline_stage: newProspect.pipeline_stage || 'First Touch',
      icp_tier: newProspect.icp_tier || 'unscored',
      data_source: 'manual',
      assigned_to: role === 'distribution' ? metadata_id : null
    }

    const { data, error } = await supabase
      .from('prospects')
      .insert([payload])
      .select()

    if (error) {
      toast(`Error: ${error.message}`, 'error')
    } else if (data) {
      toast('Prospect added successfully')
      setProspects(prev => [data[0], ...prev])
      setShowAdd(false)
      setNewProspect(initialFormState)
    }
    setIsSaving(false)
  }

  const verticals = useMemo(() => Array.from(new Set(prospects.map(p => p.vertical).filter(Boolean))).sort(), [prospects])
  const suburbs = useMemo(() => Array.from(new Set(prospects.map(p => p.suburb).filter(Boolean))).sort(), [prospects])

  const filtered = prospects.filter((p: Prospect) => {
    const matchesSearch = !search || [p.business_name, p.owner_name, p.suburb, p.vertical].some(f => f?.toLowerCase().includes(search.toLowerCase()))
    const matchesStage = !filterStage || p.pipeline_stage === filterStage
    const matchesVertical = !filterVertical || p.vertical === filterVertical
    const matchesSuburb = !filterSuburb || p.suburb === filterSuburb
    const matchesTier = !filterTier || p.icp_tier === filterTier
    return matchesSearch && matchesStage && matchesVertical && matchesSuburb && matchesTier
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontFamily: 'Playfair Display' }}>Prospect Pipeline</h2>
        <div style={{ display: 'flex', gap: 10 }}>
           <button className="btn-secondary" onClick={load}><RefreshCw size={11} /> Refresh</button>
           <button className="btn-primary" onClick={() => setShowAdd(true)}><Plus size={11} /> Add Prospect</button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: 20, padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--grey2)' }} />
            <input className="input" placeholder="Search..." style={{ paddingLeft: 36, width: '100%' }} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input" value={filterStage} onChange={e => setFilterStage(e.target.value)}>
            <option value="">All Stages</option>
            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="input" value={filterVertical} onChange={e => setFilterVertical(e.target.value)}>
            <option value="">All Verticals</option>
            {verticals.map(v => <option key={v} value={v!}>{v}</option>)}
          </select>
          <select className="input" value={filterSuburb} onChange={e => setFilterSuburb(e.target.value)}>
            <option value="">All Suburbs</option>
            {suburbs.map(s => <option key={s} value={s!}>{s}</option>)}
          </select>
          <select className="input" value={filterTier} onChange={e => setFilterTier(e.target.value)}>
            <option value="">All Tiers</option>
            {ICP_TIERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? <div style={{ padding: 24 }} className="skeleton" /> : (
          <table className="aa-table">
            <thead>
              <tr><th>Business</th><th>Vertical</th><th>Score</th><th>Stage</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map((p: Prospect) => {
                return (
                  <tr key={p.id} onClick={() => setSelected(p)} style={{ cursor: 'pointer' }}>
                    <td><div style={{ fontWeight: 500 }}>{p.business_name}</div><div style={{ fontSize: 12, color: 'var(--grey)' }}>{p.suburb}</div></td>
                    <td style={{ color: 'var(--grey)', fontSize: 13 }}>{p.vertical}</td>
                    <td><span style={{ fontFamily: 'DM Mono', color: 'var(--teal)' }}>{p.icp_total_score || 0}/25</span></td>
                    <td><span className="badge" style={{ background: 'var(--bg3)', color: 'var(--teal)', fontSize: 10 }}>{p.pipeline_stage}</span></td>
                    <td><ChevronRight size={14} color="var(--grey2)" /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={() => !isSaving && setShowAdd(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(7, 15, 13, 0.8)', backdropFilter: 'blur(4px)' }} />
          <div className="card" style={{ position: 'relative', width: '100%', maxWidth: 500, padding: 24, zIndex: 101 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontFamily: 'Playfair Display' }}>Add New Prospect</h3>
              <button onClick={() => setShowAdd(false)} className="btn-ghost" style={{ padding: 4 }}><X size={18} /></button>
            </div>

            <form onSubmit={handleManualAdd} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="label">Business Name *</label>
                <input required className="input" value={newProspect.business_name || ''} onChange={e => setNewProspect({...newProspect, business_name: e.target.value})} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="label">Vertical</label>
                  <input className="input" value={newProspect.vertical || ''} onChange={e => setNewProspect({...newProspect, vertical: e.target.value})} placeholder="e.g. Plumbing" />
                </div>
                <div>
                  <label className="label">Suburb</label>
                  <input className="input" value={newProspect.suburb || ''} onChange={e => setNewProspect({...newProspect, suburb: e.target.value})} placeholder="e.g. Claremont" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="label">Phone</label>
                  <input className="input" value={newProspect.phone || ''} onChange={e => setNewProspect({...newProspect, phone: e.target.value})} />
                </div>
                <div>
                  <label className="label">Tier</label>
                  <select className="input" value={newProspect.icp_tier || 'unscored'} onChange={e => setNewProspect({...newProspect, icp_tier: e.target.value})}>
                    {ICP_TIERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Website</label>
                <input className="input" value={newProspect.website || ''} onChange={e => setNewProspect({...newProspect, website: e.target.value})} placeholder="https://..." />
              </div>

              <button type="submit" className="btn-primary" disabled={isSaving} style={{ marginTop: 10, width: '100%', display: 'flex', justifyContent: 'center', gap: 8 }}>
                <Save size={14} /> {isSaving ? 'Saving...' : 'Create Prospect'}
              </button>
            </form>
          </div>
        </div>
      )}

      {selected && (
        <ProspectDetailView 
          prospect={selected} 
          onClose={() => setSelected(null)} 
          onUpdate={(updates) => {
            setProspects(prev => prev.map(p => p.id === selected.id ? { ...p, ...updates } : p))
            setSelected(prev => prev ? { ...prev, ...updates } : null)
          }}
          onDelete={(id) => {
             setProspects(prev => prev.filter(p => p.id !== id))
             setSelected(null)
          }}
        />
      )}
    </div>
  )
}