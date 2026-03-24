import { useEffect, useState } from 'react'
import { supabase, type Prospect } from '../lib/supabase'
import { useToast } from '../lib/toast'
import { RefreshCcw, User, Archive, ArrowUpCircle } from 'lucide-react'
import ProspectDetailView from '../components/prospects/ProspectDetailView'

const STAGES = ['First Touch','Positive Response','MJR Sent','Follow Up','Call Booked','Sprint Booked']

export default function CRM() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'board' | 'archive'>('board')
  const [selected, setSelected] = useState<Prospect | null>(null)
  const { toast } = useToast()

  useEffect(() => { load() }, [view])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('prospects')
      .select<string, Prospect>('*')
      .eq('is_archived', view === 'archive')
      .order('updated_at', { ascending: false })
    
    setProspects((data || []).map(p => ({ ...p, pipeline_stage: p.pipeline_stage || 'First Touch' })))
    setLoading(false)
  }

  async function updateStage(id: string, newStage: string) {
    const { error } = await supabase.from('prospects').update({ 
      pipeline_stage: newStage, 
      updated_at: new Date().toISOString() 
    } as any).eq('id', id)
    
    if (!error) {
      setProspects(prev => prev.map(p => p.id === id ? { ...p, pipeline_stage: newStage } : p))
      toast(`Moved to ${newStage}`)
    }
  }

  async function toggleArchive(id: string, currentStatus: boolean) {
    const newStatus = !currentStatus
    const { error } = await supabase
      .from('prospects')
      .update({ is_archived: newStatus, updated_at: new Date().toISOString() } as any)
      .eq('id', id)

    if (!error) {
      setProspects(prev => prev.filter(p => p.id !== id))
      toast(newStatus ? 'Prospect Archived' : 'Prospect Restored')
    } else {
      toast('Error updating archive status', 'error')
    }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8, background: 'var(--bg2)', padding: 4, borderRadius: 8 }}>
          <button onClick={() => setView('board')} className={view === 'board' ? 'btn-primary' : 'btn-ghost'} style={{fontSize: 11, padding: '6px 12px'}}>Active Pipeline</button>
          <button onClick={() => setView('archive')} className={view === 'archive' ? 'btn-primary' : 'btn-ghost'} style={{fontSize: 11, padding: '6px 12px'}}>Archive</button>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={load} className="btn-ghost">
            <RefreshCcw size={14} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, overflowX: 'auto', flex: 1, paddingBottom: 20 }}>
        {STAGES.map(stage => (
          <div key={stage} style={{ minWidth: 280, width: 280, background: 'var(--bg2)', borderRadius: 10, border: '1px solid var(--border2)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 14, borderBottom: '1px solid var(--border2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'DM Mono', fontSize: 10, textTransform: 'uppercase', color: 'var(--grey)' }}>{stage}</span>
              <span style={{ fontSize: 10, color: 'var(--teal)', background: 'var(--bg3)', padding: '2px 8px', borderRadius: 10 }}>
                {prospects.filter(p => p.pipeline_stage === stage).length}
              </span>
            </div>
            
            <div style={{ padding: 12, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {prospects.filter(p => p.pipeline_stage === stage).map(p => (
                <div key={p.id} className="card" onClick={() => setSelected(p)} 
                  style={{ padding: 14, background: 'var(--bg3)', cursor: 'pointer', border: '1px solid var(--border2)', position: 'relative' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--white)' }}>{p.business_name}</div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleArchive(p.id, !!p.is_archived); }}
                      style={{ background: 'none', border: 'none', color: 'var(--grey2)', cursor: 'pointer', padding: 2 }}
                      title={p.is_archived ? "Restore" : "Archive"}
                    >
                      {p.is_archived ? <ArrowUpCircle size={14} /> : <Archive size={14} />}
                    </button>
                  </div>

                  <div style={{ fontSize: 11, color: 'var(--grey)', marginTop: 4 }}>{p.owner_name || 'No Owner'}</div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 8, borderTop: '1px solid var(--border2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--grey2)', fontSize: 10 }}>
                       <User size={10} /> {p.suburb || 'ZA'}
                    </div>
                    {!p.is_archived && (
                      <select 
                        onClick={e => e.stopPropagation()}
                        style={{ background: 'transparent', border: 'none', color: 'var(--teal)', fontSize: 10, fontFamily: 'DM Mono', cursor: 'pointer' }}
                        value={p.pipeline_stage || 'First Touch'}
                        onChange={(e) => updateStage(p.id, e.target.value)}
                      >
                        {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
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
    </div>
  )
}