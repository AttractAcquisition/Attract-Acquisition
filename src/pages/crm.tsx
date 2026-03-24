import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../lib/toast'
import { Archive, RefreshCcw } from 'lucide-react'

const STAGES = [
  'First Touch',
  'Positive Response',
  'MJR Sent',
  'Follow Up',
  'Call Booked',
  'Sprint Booked'
]

export default function CRM() {
  const [prospects, setProspects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'board' | 'archive'>('board')
  const { toast } = useToast()

  useEffect(() => { 
    load() 
  }, [view])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('prospects')
      .select('*')
      .eq('is_archived', view === 'archive')
      .order('updated_at', { ascending: false })
    
    if (error) {
      toast('Failed to load pipeline', 'error')
    } else {
      setProspects(data || [])
    }
    setLoading(false)
  }

  async function updateStage(id: string, newStage: string) {
    const { error } = await supabase
      .from('prospects')
      .update({ 
        pipeline_stage: newStage, 
        updated_at: new Date().toISOString() 
      } as any)
      .eq('id', id)
    
    if (error) {
      toast('Update failed', 'error')
    } else {
      setProspects(prev => prev.map(p => p.id === id ? { ...p, pipeline_stage: newStage } : p))
      toast(`Moved to ${newStage}`)
    }
  }

  async function toggleArchive(id: string, status: boolean) {
    const { error } = await supabase
      .from('prospects')
      .update({ is_archived: status } as any)
      .eq('id', id)
    
    if (error) {
      toast('Action failed', 'error')
    } else {
      setProspects(prev => prev.filter(p => p.id !== id))
      toast(status ? 'Moved to Archive' : 'Restored to Board')
    }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8, background: 'var(--bg2)', padding: 4, borderRadius: 8, border: '1px solid var(--border2)' }}>
          <button 
            onClick={() => setView('board')} 
            className={view === 'board' ? 'btn-primary' : 'btn-ghost'}
            style={{ fontSize: 11, padding: '6px 12px' }}
          >
            Active Pipeline
          </button>
          <button 
            onClick={() => setView('archive')} 
            className={view === 'archive' ? 'btn-primary' : 'btn-ghost'}
            style={{ fontSize: 11, padding: '6px 12px' }}
          >
            Archive
          </button>
        </div>
        <button onClick={load} className="btn-ghost" style={{ padding: 8 }}>
          <RefreshCcw size={14} className={loading ? 'spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16, flex: 1 }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="skeleton" style={{ height: '70vh', borderRadius: 8, opacity: 0.5 }} />
          ))}
        </div>
      ) : view === 'board' ? (
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 20, flex: 1, alignItems: 'flex-start' }}>
          {STAGES.map(stage => (
            <div key={stage} style={{ minWidth: 280, width: 280, background: 'var(--bg2)', borderRadius: 10, display: 'flex', flexDirection: 'column', border: '1px solid var(--border2)', maxHeight: '80vh' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'DM Mono', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--grey)' }}>{stage}</span>
                <span style={{ fontFamily: 'DM Mono', fontSize: 10, background: 'var(--bg3)', padding: '2px 8px', borderRadius: 10, color: 'var(--teal)' }}>
                  {prospects.filter(p => p.pipeline_stage === stage).length}
                </span>
              </div>
              
              <div style={{ padding: 12, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {prospects.filter(p => p.pipeline_stage === stage).map(p => (
                  <div key={p.id} className="card" style={{ padding: 14, background: 'var(--bg3)', transition: 'transform 0.1s' }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, color: 'var(--white)' }}>{p.business_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--grey)', marginBottom: 12, fontFamily: 'Barlow' }}>{p.owner_name || 'No Owner Listed'}</div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 10, borderTop: '1px solid var(--border2)' }}>
                      <button 
                        onClick={() => toggleArchive(p.id, true)} 
                        style={{ background: 'none', border: 'none', color: 'var(--grey2)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        title="Archive Prospect"
                      >
                        <Archive size={14} />
                      </button>
                      
                      <select 
                        style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 4, color: 'var(--teal)', fontSize: 10, fontFamily: 'DM Mono', cursor: 'pointer', padding: '2px 4px' }}
                        value={p.pipeline_stage}
                        onChange={(e) => updateStage(p.id, e.target.value)}
                      >
                        {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
                {prospects.filter(p => p.pipeline_stage === stage).length === 0 && (
                  <div style={{ padding: 20, textAlign: 'center', fontSize: 11, color: 'var(--grey2)', border: '1px dashed var(--border2)', borderRadius: 8 }}>
                    No prospects here
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', background: 'var(--bg3)', borderBottom: '1px solid var(--border2)' }}>
                <th style={{ padding: '14px 20px', fontSize: 11, color: 'var(--grey)', textTransform: 'uppercase', fontFamily: 'DM Mono' }}>Business Name</th>
                <th style={{ padding: '14px 20px', fontSize: 11, color: 'var(--grey)', textTransform: 'uppercase', fontFamily: 'DM Mono' }}>Last Known Stage</th>
                <th style={{ padding: '14px 20px', fontSize: 11, color: 'var(--grey)', textTransform: 'uppercase', fontFamily: 'DM Mono', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {prospects.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: 40, textAlign: 'center', color: 'var(--grey)' }}>Archive is empty.</td>
                </tr>
              ) : prospects.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border2)' }}>
                  <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 500 }}>{p.business_name}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'var(--grey)', background: 'var(--bg3)', padding: '2px 8px', borderRadius: 4 }}>
                      {p.pipeline_stage}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <button 
                      onClick={() => toggleArchive(p.id, false)} 
                      className="btn-ghost" 
                      style={{ padding: '6px 12px', fontSize: 11, color: 'var(--teal)' }}
                    >
                      Restore to Board
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}