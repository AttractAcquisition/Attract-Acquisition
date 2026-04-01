import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../lib/auth'
import { useToast } from '../../../lib/toast'
import { Save, Activity, StickyNote, Target } from 'lucide-react'

export default function DistributionDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [history, setHistory] = useState<any[]>([])
  const [metrics, setMetrics] = useState({
    prospects_scraped: 0,
    prospects_enriched: 0,
    outreach_sent: 0,
    followups_sent: 0,
    mjrs_built: 0,
    mjrs_sent: 0,
    calls_booked: 0,
    notes: ''
  })

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (user?.id) {
      loadTodaysMetrics()
      loadHistory()
    }
  }, [user?.id])

  async function loadTodaysMetrics() {
    if (!user?.id) return
    const { data } = await (supabase.from('distro_metrics' as any))
      .select('*')
      .eq('manager_id', user.id)
      .eq('date_key', today)
      .maybeSingle()

    if (data) {
      setMetrics(prev => ({ ...prev, ...(data as any) }))
    }
  }

  async function loadHistory() {
    if (!user?.id) return
    const { data } = await (supabase.from('distro_metrics' as any))
      .select('date_key, outreach_sent, calls_booked')
      .eq('manager_id', user.id)
      .order('date_key', { ascending: false })
      .limit(7)

    if (data) setHistory([...(data as any[])].reverse())
  }

  async function handleSave() {
    if (!user?.id) return
    
    // Clean up data for upsert
    const payload = {
      manager_id: user.id,
      date_key: today,
      prospects_scraped: metrics.prospects_scraped,
      prospects_enriched: metrics.prospects_enriched,
      outreach_sent: metrics.outreach_sent,
      followups_sent: metrics.followups_sent,
      mjrs_built: metrics.mjrs_built,
      mjrs_sent: metrics.mjrs_sent,
      calls_booked: metrics.calls_booked,
      notes: metrics.notes,
      updated_at: new Date().toISOString()
    }

    const { error } = await (supabase.from('distro_metrics' as any))
      .upsert(payload, { onConflict: 'manager_id,date_key' })

    if (!error) {
      toast('Metrics Synchronized')
      loadHistory()
    } else {
      console.error(error)
      toast('Error saving metrics', 'error')
    }
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 60 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'Playfair Display', fontSize: 28, fontWeight: 700 }}>Ops Commander</h1>
          <p style={{ color: 'var(--grey)', fontSize: 11, fontFamily: 'DM Mono' }}>DISTRIBUTION PERFORMANCE • {today}</p>
        </div>
        <button onClick={handleSave} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Save size={16} /> Save Daily Progress
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, marginBottom: 32 }}>
        {/* KPI INPUTS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
           {Object.keys(metrics).filter(k => k !== 'notes' && k !== 'id' && k !== 'manager_id' && k !== 'date_key' && k !== 'updated_at').map(key => (
             <div key={key} style={{ background: 'var(--bg2)', padding: 16, borderRadius: 10, border: '1px solid var(--border2)' }}>
               <label style={{ display: 'block', fontSize: 9, color: 'var(--grey)', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'DM Mono' }}>
                 {key.replace(/_/g, ' ')}
               </label>
               <input 
                 type="number" 
                 className="input" 
                 value={(metrics as any)[key]} 
                 onChange={e => setMetrics({...metrics, [key]: parseInt(e.target.value) || 0})}
                 style={{ fontSize: 20, fontWeight: 700, background: 'transparent', border: 'none', padding: 0, color: 'var(--white)', width: '100%' }}
               />
             </div>
           ))}
        </div>

        {/* NOTES & QUICK STATS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <StickyNote size={12} color="var(--teal)" />
              <span style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'var(--grey)', textTransform: 'uppercase' }}>Daily Notes</span>
            </div>
            <textarea 
              placeholder="Strategic Notes / Blockers..."
              value={metrics.notes || ''}
              onChange={e => setMetrics({...metrics, notes: e.target.value})}
              style={{ width: '100%', flex: 1, background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 10, padding: 20, color: 'var(--white)', resize: 'none', fontSize: 13 }}
            />
          </div>
          
          <div style={{ background: 'var(--teal-faint)', padding: 20, borderRadius: 10, border: '1px solid var(--teal)' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Target size={12} color="var(--teal)" />
                <div style={{ fontSize: 10, color: 'var(--teal)', fontWeight: 700, textTransform: 'uppercase' }}>Conversion Rate</div>
             </div>
             <div style={{ fontSize: 28, fontWeight: 700 }}>
                {metrics.outreach_sent > 0 ? ((metrics.calls_booked / metrics.outreach_sent) * 100).toFixed(1) : 0}%
             </div>
          </div>
        </div>
      </div>

      {/* 7-DAY TREND CHART */}
      <div style={{ background: 'var(--bg2)', padding: 24, borderRadius: 12, border: '1px solid var(--border2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <Activity size={16} color="var(--teal)" />
          <h3 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'DM Mono' }}>7-Day Outreach Trend</h3>
        </div>
        
        <div style={{ height: 150, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
          {history.length > 0 ? history.map((day, i) => {
            const height = Math.min((day.outreach_sent / 50) * 100, 100) 
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ width: '100%', background: 'var(--teal)', height: `${Math.max(height, 5)}%`, borderRadius: '4px 4px 0 0', opacity: 0.8 }} />
                <span style={{ fontSize: 8, color: 'var(--grey)', fontFamily: 'DM Mono' }}>{day.date_key.split('-')[2]}</span>
              </div>
            )
          }) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--grey)', fontSize: 12, border: '1px dashed var(--border2)', borderRadius: 8 }}>
              Insufficient history for trend data
            </div>
          )}
        </div>
      </div>
    </div>
  )
}