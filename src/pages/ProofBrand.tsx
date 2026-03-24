import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { CheckCircle2, Circle, ChevronRight, Loader2 } from 'lucide-react'
import { useToast } from '../lib/toast'

const TIER_NAME = 'Proof Brand'
const DEFAULT_STEPS = ['Brand Strategy', 'Visual Identity', 'Social Proof Setup']

export default function ProofBrand() {
  const { role, user } = useAuth()
  const { toast } = useToast()
  const [clients, setClients] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<any | null>(null)
  const [deliverables, setDeliverables] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchingSteps, setFetchingSteps] = useState(false)

  useEffect(() => { loadClients() }, [role, user])

  async function loadClients() {
    let q = supabase.from('clients').select('*').eq('tier', TIER_NAME)
    
    // Safety check: only filter by account_manager if the user ID exists
    if (role === 'delivery' && user?.id) {
      q = q.eq('account_manager', user.id)
    }
    
    const { data } = await q
    setClients(data || [])
    setLoading(false)
  }

  async function selectClient(client: any) {
    setSelectedClient(client)
    setFetchingSteps(true)
    
    // Using 'as any' because the table was created manually in SQL
    let { data } = await (supabase.from('client_deliverables' as any))
      .select('*')
      .eq('client_id', client.id)
      .order('position', { ascending: true })

    if (!data || data.length === 0) {
      const newSteps = DEFAULT_STEPS.map((title, i) => ({
        client_id: client.id,
        title,
        position: i,
        is_completed: false
      }))
      const { data: created } = await (supabase.from('client_deliverables' as any)).insert(newSteps).select()
      data = created
    }
    setDeliverables(data || [])
    setFetchingSteps(false)
  }

  async function toggleStep(stepId: string, currentStatus: boolean) {
    const { error } = await (supabase.from('client_deliverables' as any))
      .update({ is_completed: !currentStatus, updated_at: new Date().toISOString() })
      .eq('id', stepId)

    if (!error) {
      setDeliverables(prev => prev.map(s => s.id === stepId ? { ...s, is_completed: !currentStatus } : s))
      toast('Progress saved')
    }
  }

  async function updateNote(stepId: string, notes: string) {
    await (supabase.from('client_deliverables' as any))
      .update({ notes, updated_at: new Date().toISOString() })
      .eq('id', stepId)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--grey)' }}>
      <Loader2 className="spin" size={24} />
      <span style={{ marginLeft: 12, fontFamily: 'DM Mono', fontSize: 12 }}>Loading {TIER_NAME} Pipeline...</span>
    </div>
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, height: 'calc(100vh - 140px)' }}>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
        <h3 style={{ fontSize: 11, fontFamily: 'DM Mono', textTransform: 'uppercase', color: 'var(--grey)', marginBottom: 12 }}>{TIER_NAME} Clients</h3>
        {clients.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--grey2)', padding: 20, textAlign: 'center' }}>No clients in this tier.</div>
        ) : clients.map(c => (
          <div key={c.id} onClick={() => selectClient(c)}
            style={{ 
              padding: '14px 16px', borderRadius: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              border: `1px solid ${selectedClient?.id === c.id ? 'var(--teal)' : 'var(--border2)'}`,
              background: selectedClient?.id === c.id ? 'var(--bg3)' : 'var(--bg2)', transition: '0.2s'
            }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{c.business_name}</div>
              <div style={{ fontSize: 10, color: 'var(--grey2)', marginTop: 2 }}>{c.contact_name}</div>
            </div>
            <ChevronRight size={14} color={selectedClient?.id === c.id ? 'var(--teal)' : 'var(--border2)'} />
          </div>
        ))}
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
        {selectedClient ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border2)' }}>
              <h2 style={{ fontSize: 22, fontFamily: 'Playfair Display', fontWeight: 700 }}>{selectedClient.business_name}</h2>
              <p style={{ color: 'var(--teal)', fontSize: 11, fontFamily: 'DM Mono', marginTop: 4 }}>DELIVERY TRACKER · {TIER_NAME.toUpperCase()}</p>
            </div>

            {fetchingSteps ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="spin" /></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
                {deliverables.map((step) => (
                  <div key={step.id} style={{ display: 'flex', gap: 16, padding: 20, background: 'var(--bg2)', borderRadius: 12, border: '1px solid var(--border2)' }}>
                    <button 
                      onClick={() => toggleStep(step.id, step.is_completed)} 
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: step.is_completed ? 'var(--teal)' : 'var(--grey2)' }}
                    >
                      {step.is_completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                    </button>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8, color: step.is_completed ? 'var(--grey2)' : 'var(--white)' }}>
                        {step.title}
                      </div>
                      <textarea 
                        placeholder="Add internal delivery notes, links, or updates..."
                        defaultValue={step.notes}
                        onBlur={(e) => updateNote(step.id, e.target.value)}
                        style={{ 
                          width: '100%', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 6, 
                          padding: 12, color: 'var(--white)', fontSize: 12, fontFamily: 'Barlow', resize: 'vertical', minHeight: 60
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--grey2)', gap: 12 }}>
            <div style={{ padding: 20, borderRadius: '50%', background: 'var(--bg2)' }}><CheckCircle2 size={32} /></div>
            <p style={{ fontSize: 13 }}>Select a client to manage their {TIER_NAME} deliverables.</p>
          </div>
        )}
      </div>
    </div>
  )
}