import { useEffect, useState } from 'react'
import { supabase, type Prospect } from '../lib/supabase'
import { tierLabel } from '../lib/utils'
import { Search, Plus, RefreshCw, ChevronRight } from 'lucide-react'
import { useAuth } from '../lib/auth'
import ProspectDetailView from '../components/prospects/ProspectDetailView'

const STAGES = ['First Touch', 'Positive Response', 'MJR Sent', 'Follow Up', 'Call Booked', 'Sprint Booked']

export default function Prospects() {
  const { role, metadata_id }     = useAuth()
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filterStage, setFilterStage] = useState('')
  const [selected, setSelected]   = useState<Prospect | null>(null)
  const [showAdd, setShowAdd]     = useState(false)

  useEffect(() => { load() }, [filterStage, metadata_id])

  async function load() {
    setLoading(true)
    // Cast query to use local Prospect type to bypass outdated database.types.ts
    let q = supabase
      .from('prospects')
      .select<string, Prospect>('*')
      .order('icp_total_score', { ascending: false })
    
    if (role === 'operator' && metadata_id) q = q.eq('assigned_to', metadata_id) 
    if (filterStage)    q = q.eq('pipeline_stage', filterStage)

    const { data } = await q
    
    const formattedData: Prospect[] = (data || []).map(p => ({
      ...p,
      pipeline_stage: p.pipeline_stage || 'First Touch'
    }))

    setProspects(formattedData)
    setLoading(false)
  }

  const filtered = prospects.filter((p: Prospect) => {
    if (!search) return true
    const q = search.toLowerCase()
    return [p.business_name, p.owner_name, p.suburb, p.vertical].some(f => f?.toLowerCase().includes(q))
  })

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--grey2)' }} />
          <input className="input" placeholder="Search..." style={{ paddingLeft: 36 }} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        
        <select className="input" style={{ width: 150 }} value={filterStage} onChange={e => setFilterStage(e.target.value)}>
          <option value="">All Stages</option>
          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <button className="btn-secondary" onClick={load}><RefreshCw size={11} /></button>
        <button className="btn-primary" onClick={() => setShowAdd(true)}><Plus size={11} /> Add Prospect</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? <div style={{ padding: 24 }} className="skeleton" /> : (
          <table className="aa-table">
            <thead>
              <tr><th>Business</th><th>Vertical</th><th>Score</th><th>Stage</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map((p: Prospect) => {
                const tier = tierLabel(p.icp_tier ?? '') 
                return (
                  <tr key={p.id} onClick={() => setSelected(p)} style={{ cursor: 'pointer' }}>
                    <td><div style={{ fontWeight: 500 }}>{p.business_name}</div><div style={{ fontSize: 12, color: 'var(--grey)' }}>{p.suburb}</div></td>
                    <td style={{ color: 'var(--grey)', fontSize: 13 }}>{p.vertical}</td>
                    <td><span style={{ fontFamily: 'DM Mono', color: 'var(--teal)' }}>{p.icp_total_score}/25 <span style={{fontSize: 10, color: 'var(--grey)'}}>{tier.label}</span></span></td>
                    <td>
                      <span className="badge" style={{ background: 'var(--bg3)', color: 'var(--teal)', border: '1px solid var(--border2)', fontSize: 10 }}>
                        {p.pipeline_stage || 'First Touch'}
                      </span>
                    </td>
                    <td><ChevronRight size={14} color="var(--grey2)" /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <ProspectDetailView 
          prospect={selected} 
          onClose={() => setSelected(null)} 
          onUpdate={(updates) => {
            setProspects((prev: Prospect[]) => prev.map(p => p.id === selected.id ? { ...p, ...updates } : p))
            setSelected((prev: Prospect | null) => prev ? { ...prev, ...updates } : null)
          }}
          onDelete={(id) => {
             setProspects((prev: Prospect[]) => prev.filter(p => p.id !== id))
             setSelected(null)
          }}
        />
      )}

      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => setShowAdd(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
          <div style={{ position: 'relative', background: 'var(--bg2)', padding: 28, width: 480, borderRadius: 8 }}>
             <button className="btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}