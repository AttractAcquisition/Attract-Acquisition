import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../lib/auth'
import { useToast } from '../../../lib/toast'
import { Save, Users, TrendingUp, DollarSign, MessageSquare, UserPlus, Eye, StickyNote } from 'lucide-react'

export default function DeliveryDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [clients, setClients] = useState<any[]>([])
  const [metrics, setMetrics] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)

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
    
    // Bypass strict type check for the new table
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

  if (loading) return <div style={{ color: 'var(--grey)', fontFamily: 'DM Mono', fontSize: 12 }}>Initializing Pipeline...</div>

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 100 }}>
      <header style={{ marginBottom: 40 }}>
        <h1 style={{ fontFamily: 'Playfair Display', fontSize: 32, fontWeight: 700 }}>Client Success Hub</h1>
        <p style={{ color: 'var(--grey)', fontSize: 11, fontFamily: 'DM Mono', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Delivery Ops Management • {today}
        </p>
      </header>

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