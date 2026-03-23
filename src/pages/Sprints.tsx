import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatRand } from '../lib/utils'
import { Plus, X } from 'lucide-react'
import { useToast } from '../lib/toast'
import { useNavigate } from 'react-router-dom'

interface Sprint {
  id: string; created_at: string; client_id: string; start_date: string
  status: string; client_ad_budget: number; actual_ad_spend: number
  leads_generated: number; cpl: number; results_meeting_date: string
  client_name: string; vertical: string
}

interface Client { id: string; business_name: string; tier: string }

const COLUMNS = [
  { key: 'setup',           label: 'Setup',           sub: 'Days 1–3' },
  { key: 'active',          label: 'Running',         sub: 'Days 4–13' },
  { key: 'results_meeting', label: 'Results Meeting', sub: 'Day 14–15' },
  { key: 'closed_won',      label: 'Won',             sub: '' },
  { key: 'closed_lost',     label: 'Lost',            sub: '' },
]

function dayX(startDate: string) {
  const diff = Math.floor((Date.now() - new Date(startDate).getTime()) / 86400000) + 1
  return Math.max(1, Math.min(diff, 14))
}

function cplColor(cpl: number) {
  if (!cpl || cpl === 0) return 'var(--grey2)'
  if (cpl < 150) return 'var(--green)'
  if (cpl < 300) return 'var(--amber)'
  return 'var(--red)'
}

export default function Sprints() {
  const [sprints, setSprints]   = useState<Sprint[]>([])
  const [clients, setClients]   = useState<Client[]>([])
  const [showNew, setShowNew]   = useState(false)
  const [dragId, setDragId]     = useState<string | null>(null)
  const [loading, setLoading]   = useState(true)
  const { toast }               = useToast()
  const navigate                = useNavigate()

  useEffect(() => {
    supabase.from('proof_sprints').select('*').order('created_at', { ascending: false }).then(({ data }) => { setSprints(data || []); setLoading(false) })
    supabase.from('clients').select('id, business_name, tier').eq('status', 'active').then(({ data }) => setClients(data || []))
  }, [])

  async function moveSprint(id: string, status: string) {
    await supabase.from('proof_sprints').update({ status }).eq('id', id)
    setSprints(prev => prev.map(s => s.id === id ? { ...s, status } : s))
    toast('Sprint moved')
  }

  async function createSprint(form: { client_id: string; start_date: string; client_ad_budget: number; client_name: string; vertical: string }) {
    const { data, error } = await supabase.from('proof_sprints').insert({ ...form, status: 'setup', sprint_number: 1 }).select().single()
    if (error || !data) { toast('Failed to create sprint', 'error'); return }
    setSprints(prev => [data, ...prev])
    setShowNew(false)
    toast('Sprint created ✓')
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 24 }}>
          {[
            { label: 'Active sprints', value: sprints.filter(s => s.status === 'active' || s.status === 'setup').length },
            { label: 'Won this month',  value: sprints.filter(s => s.status === 'closed_won').length },
          ].map(s => (
            <div key={s.label}>
              <div className="stat-num" style={{ fontSize: 26 }}>{s.value}</div>
              <div style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
            </div>
          ))}
        </div>
        <button className="btn-primary" onClick={() => setShowNew(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={12} /> New Sprint
        </button>
      </div>

      {/* Kanban */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, alignItems: 'start' }}>
        {COLUMNS.map(col => (
          <div key={col.key}
            onDragOver={e => e.preventDefault()}
            onDrop={async () => { if (dragId) { await moveSprint(dragId, col.key); setDragId(null) } }}
            style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 8, padding: 12, minHeight: 300 }}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: 'DM Mono', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--white)' }}>{col.label}</div>
              {col.sub && <div style={{ fontFamily: 'DM Mono', fontSize: 9, color: 'var(--grey2)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>{col.sub}</div>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sprints.filter(s => s.status === col.key).map(sprint => {
                const day = dayX(sprint.start_date)
                const cpl = sprint.cpl || 0
                return (
                  <div key={sprint.id} draggable onDragStart={() => setDragId(sprint.id)}
                    onClick={() => navigate(`/sprints/${sprint.id}`)}
                    style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 6, padding: '12px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--teal)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border2)')}>
                    <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 4 }}>{sprint.client_name || 'Unnamed Client'}</div>
                    {sprint.vertical && <div style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{sprint.vertical}</div>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--teal)' }}>Day {day}/14</span>
                      {cpl > 0 && (
                        <span style={{ fontFamily: 'DM Mono', fontSize: 11, color: cplColor(cpl), background: cplColor(cpl) + '15', padding: '2px 7px', borderRadius: 3 }}>
                          CPL {formatRand(cpl)}
                        </span>
                      )}
                    </div>
                    {sprint.leads_generated > 0 && (
                      <div style={{ marginTop: 6, fontFamily: 'DM Mono', fontSize: 11, color: 'var(--grey)' }}>{sprint.leads_generated} leads</div>
                    )}
                  </div>
                )
              })}
              {sprints.filter(s => s.status === col.key).length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--grey2)', fontSize: 12, fontFamily: 'DM Mono' }}>Empty</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* New Sprint Modal */}
      {showNew && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => setShowNew(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
          <div style={{ position: 'relative', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 8, padding: 28, width: 440, zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontFamily: 'Playfair Display', fontSize: 20, fontWeight: 700 }}>New Proof Sprint</div>
              <button onClick={() => setShowNew(false)} style={{ background: 'none', border: 'none', color: 'var(--grey)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <NewSprintForm clients={clients} onSave={createSprint} onCancel={() => setShowNew(false)} />
          </div>
        </div>
      )}
    </div>
  )
}

function NewSprintForm({ clients, onSave, onCancel }: { clients: Client[]; onSave: (f: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState({ client_id: '', client_name: '', vertical: '', start_date: new Date().toISOString().split('T')[0], client_ad_budget: 1500 })

  function onClientChange(id: string) {
    const c = clients.find(x => x.id === id)
    setForm(prev => ({ ...prev, client_id: id, client_name: c?.business_name || '' }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div className="label">Client</div>
        <select className="input" value={form.client_id} onChange={e => onClientChange(e.target.value)}>
          <option value="">Select active client</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
        </select>
        {clients.length === 0 && <div style={{ fontSize: 12, color: 'var(--grey)', marginTop: 4, fontFamily: 'DM Mono' }}>No active clients yet — or enter name manually below</div>}
      </div>
      <div>
        <div className="label">Client Name (if no active client yet)</div>
        <input className="input" placeholder="e.g. Cape Town Auto Detailing" value={form.client_name} onChange={e => setForm(prev => ({ ...prev, client_name: e.target.value }))} />
      </div>
      <div>
        <div className="label">Vertical</div>
        <input className="input" placeholder="e.g. Auto Detailing" value={form.vertical} onChange={e => setForm(prev => ({ ...prev, vertical: e.target.value }))} />
      </div>
      <div>
        <div className="label">Start Date</div>
        <input className="input" type="date" value={form.start_date} onChange={e => setForm(prev => ({ ...prev, start_date: e.target.value }))} />
      </div>
      <div>
        <div className="label">Client Ad Budget (R)</div>
        <input className="input" type="number" value={form.client_ad_budget} onChange={e => setForm(prev => ({ ...prev, client_ad_budget: Number(e.target.value) }))} />
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button className="btn-primary" onClick={() => onSave(form)} style={{ flex: 1 }}>Create Sprint →</button>
        <button className="btn-ghost" onClick={onCancel} style={{ flex: 1 }}>Cancel</button>
      </div>
    </div>
  )
}