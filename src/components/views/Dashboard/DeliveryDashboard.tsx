import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../lib/auth'
import { useToast } from '../../../lib/toast'
import { Save, Users, TrendingUp, DollarSign, MessageSquare, UserPlus, Eye, StickyNote, Plus, X, CheckSquare } from 'lucide-react'

export default function DeliveryDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [clients, setClients] = useState<any[]>([])
  const [metrics, setMetrics] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)

  // Task assignment form state
  const [showTaskForm, setShowTaskForm] = useState(false)
  // selectedClientId holds clients.id (Business ID) — NOT profiles.id
  const [selectedClientId, setSelectedClientId] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDesc, setTaskDesc] = useState('')
  const [taskDue, setTaskDue] = useState('')
  const [savingTask, setSavingTask] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (user?.id) loadDashboardData()
    else setLoading(false)
  }, [user?.id])

  async function loadDashboardData() {
    try {
      const { data: clientData } = await supabase
        .from('clients')
        .select('id, business_name')
        .eq('account_manager', user!.id)

      if (clientData) {
        setClients(clientData)

        const { data: existingMetrics } = await supabase
          .from('delivery_metrics' as any)
          .select('*')
          .eq('manager_id', user!.id)
          .eq('date_key', today)

        const metricsMap: Record<string, any> = {}
        clientData.forEach(c => {
          const existing = (existingMetrics as any[])?.find(m => m.client_id === c.id)
          metricsMap[c.id] = existing || {
            profile_visits: 0,
            qualified_followers: 0,
            dms_started: 0,
            appointments_booked: 0,
            cash_collected: 0,
            notes: ''
          }
        })
        setMetrics(metricsMap)
      }
    } finally {
      setLoading(false)
    }
  }

  const updateMetric = (clientId: string, field: string, value: any) => {
    setMetrics(prev => ({
      ...prev,
      [clientId]: { ...prev[clientId], [field]: value }
    }))
  }

  async function handleSave(clientId: string) {
    const data = metrics[clientId]
    const { error } = await supabase.from('delivery_metrics' as any).upsert({
      client_id: clientId,
      manager_id: user!.id,
      date_key: today,
      ...data,
      updated_at: new Date().toISOString()
    }, { onConflict: 'client_id,date_key' })

    if (!error) toast(`Synced: ${clients.find(c => c.id === clientId)?.business_name}`)
    else toast('Error syncing data', 'error')
  }

  async function assignTask() {
    if (!taskTitle.trim() || !selectedClientId || !user) return
    setSavingTask(true)
    const { error } = await supabase.from('portal_tasks').insert({
      client_id:   selectedClientId,  // clients.id (Business ID) — source of truth
      manager_id:  user.id,           // delivery user's profiles.id ✓
      title:       taskTitle.trim(),
      description: taskDesc.trim() || null,
      due_date:    taskDue || null,
      status:      'pending',
    })
    if (error) {
      toast(error.message, 'error')
    } else {
      toast(`Task assigned to ${clients.find(c => c.id === selectedClientId)?.business_name} ✓`, 'success')
      setTaskTitle('')
      setTaskDesc('')
      setTaskDue('')
      setSelectedClientId('')
      setShowTaskForm(false)
    }
    setSavingTask(false)
  }

  function resetTaskForm() {
    setShowTaskForm(false)
    setSelectedClientId('')
    setTaskTitle('')
    setTaskDesc('')
    setTaskDue('')
  }

  if (loading) return <div style={{ color: 'var(--grey)', fontFamily: 'DM Mono', fontSize: 12 }}>Initializing Pipeline...</div>

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 100 }}>
      <header style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontFamily: 'Playfair Display', fontSize: 32, fontWeight: 700 }}>Client Success Hub</h1>
          <p style={{ color: 'var(--grey)', fontSize: 11, fontFamily: 'DM Mono', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Delivery Ops Management • {today}
          </p>
        </div>
        <button
          onClick={() => setShowTaskForm(v => !v)}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px' }}
        >
          <Plus size={13} /> Assign Task
        </button>
      </header>

      {/* ── Task Assignment Form ── */}
      {showTaskForm && (
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 12,
          padding: '24px 28px', marginBottom: 32,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckSquare size={16} color="var(--teal)" />
              <span style={{ fontFamily: 'DM Mono', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--white)' }}>
                New Client Task
              </span>
            </div>
            <button onClick={resetTaskForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--grey)' }}>
              <X size={16} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            {/* ClientSelect — value is client.id from clients table */}
            <div>
              <div style={{ fontSize: 10, color: 'var(--grey)', textTransform: 'uppercase', fontFamily: 'DM Mono', marginBottom: 6 }}>
                Client *
              </div>
              <select
                className="input"
                value={selectedClientId}
                onChange={e => setSelectedClientId(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">Select client...</option>
                {clients.map(c => (
                  // value is c.id (clients.id / Business ID), never profiles.id
                  <option key={c.id} value={c.id}>
                    {c.business_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div style={{ fontSize: 10, color: 'var(--grey)', textTransform: 'uppercase', fontFamily: 'DM Mono', marginBottom: 6 }}>
                Due Date
              </div>
              <input
                type="date"
                className="input"
                value={taskDue}
                onChange={e => setTaskDue(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: 'var(--grey)', textTransform: 'uppercase', fontFamily: 'DM Mono', marginBottom: 6 }}>
              Task Title *
            </div>
            <input
              className="input"
              placeholder="e.g. Review ad creative before Thursday"
              value={taskTitle}
              onChange={e => setTaskTitle(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: 'var(--grey)', textTransform: 'uppercase', fontFamily: 'DM Mono', marginBottom: 6 }}>
              Description
            </div>
            <textarea
              className="input"
              rows={3}
              placeholder="Optional context or instructions..."
              value={taskDesc}
              onChange={e => setTaskDesc(e.target.value)}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={resetTaskForm} className="btn-ghost" style={{ padding: '9px 18px' }}>
              Cancel
            </button>
            <button
              onClick={assignTask}
              disabled={savingTask || !taskTitle.trim() || !selectedClientId}
              className="btn-primary"
              style={{ padding: '9px 18px', opacity: savingTask || !taskTitle.trim() || !selectedClientId ? 0.6 : 1 }}
            >
              {savingTask ? 'Saving...' : 'Assign Task →'}
            </button>
          </div>
        </div>
      )}

      {/* ── Client Metric Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
        {clients.map(client => (
          <div key={client.id} style={{ background: 'var(--bg2)', borderRadius: 16, border: '1px solid var(--border2)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Users size={16} color="var(--teal)" />
                <span style={{ fontWeight: 700, fontSize: 16 }}>{client.business_name}</span>
              </div>
              <button onClick={() => handleSave(client.id)} className="btn-primary" style={{ padding: '6px 12px', fontSize: 11 }}>
                <Save size={12} style={{ marginRight: 6 }} /> Sync
              </button>
            </div>

            <div style={{ padding: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <MetricInput icon={<Eye size={12}/>} label="Profile Visits" val={metrics[client.id]?.profile_visits} onChange={(v: number) => updateMetric(client.id, 'profile_visits', v)} />
                <MetricInput icon={<UserPlus size={12}/>} label="Qual. Followers" val={metrics[client.id]?.qualified_followers} onChange={(v: number) => updateMetric(client.id, 'qualified_followers', v)} />
                <MetricInput icon={<MessageSquare size={12}/>} label="DMs Started" val={metrics[client.id]?.dms_started} onChange={(v: number) => updateMetric(client.id, 'dms_started', v)} />
                <MetricInput icon={<TrendingUp size={12}/>} label="Appts Booked" val={metrics[client.id]?.appointments_booked} onChange={(v: number) => updateMetric(client.id, 'appointments_booked', v)} />
              </div>

              <div style={{ background: 'var(--bg3)', padding: 16, borderRadius: 10, border: '1px solid var(--border2)', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <DollarSign size={12} color="var(--teal)" />
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--grey)', textTransform: 'uppercase' }}>Cash Collected</span>
                </div>
                <input
                  type="number"
                  className="input"
                  value={metrics[client.id]?.cash_collected}
                  onChange={e => updateMetric(client.id, 'cash_collected', parseFloat(e.target.value) || 0)}
                  style={{ fontSize: 24, fontWeight: 800, color: 'var(--white)', width: '100%', background: 'transparent', border: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <StickyNote size={12} color="var(--grey)" />
                  <span style={{ fontSize: 10, color: 'var(--grey)', textTransform: 'uppercase' }}>Client-Specific Notes</span>
                </div>
                <textarea
                  className="input"
                  rows={3}
                  value={metrics[client.id]?.notes}
                  onChange={e => updateMetric(client.id, 'notes', e.target.value)}
                  style={{ fontSize: 12, lineHeight: '1.5', resize: 'none', background: 'var(--bg3)' }}
                  placeholder="Blockers, wins, or focus areas for this client..."
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MetricInput({ label, val, onChange, icon }: { label: string, val: number, onChange: (v: number) => void, icon: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg3)', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ color: 'var(--grey)' }}>{icon}</span>
        <label style={{ fontSize: 9, color: 'var(--grey)', textTransform: 'uppercase', fontWeight: 600 }}>{label}</label>
      </div>
      <input
        type="number"
        className="input"
        value={val}
        onChange={e => onChange(parseInt(e.target.value) || 0)}
        style={{ fontSize: 18, fontWeight: 700, width: '100%', background: 'transparent', border: 'none', padding: 0 }}
      />
    </div>
  )
}
