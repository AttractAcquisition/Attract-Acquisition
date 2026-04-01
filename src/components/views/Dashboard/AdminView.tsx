import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { formatRand } from '../../../lib/utils'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Users, Zap, DollarSign, Target, ShieldCheck, Activity } from 'lucide-react'

const SCHEDULE_D = [
  { month: 'Oct 26', target: 25000 },  { month: 'Nov 26', target: 25000 },
  { month: 'Dec 26', target: 25000 },  { month: 'Jan 27', target: 55000 },
  { month: 'Feb 27', target: 55000 },  { month: 'Mar 27', target: 55000 },
  { month: 'Apr 27', target: 90000 },  { month: 'May 27', target: 90000 },
  { month: 'Jun 27', target: 90000 },  { month: 'Jul 27', target: 130000 },
  { month: 'Aug 27', target: 130000 }, { month: 'Sep 27', target: 130000 },
  { month: 'Oct 27', target: 168000 }, { month: 'Nov 27', target: 168000 },
  { month: 'Dec 27', target: 168000 }, { month: 'Jan 28', target: 200000 },
  { month: 'Feb 28', target: 200000 }, { month: 'Mar 28', target: 200000 },
]

export default function AdminView() {
  const [clients, setClients]     = useState(0)
  const [mrr, setMrr]             = useState(0)
  const [prospects, setProspects] = useState(0)
  const [topProspects, setTop]    = useState(0)
  const [sprints, setSprints]     = useState(0)
  const [tasks, setTasks]         = useState<any[]>([])
  const [opsManagers, setOps]     = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  
  // Expanded funnel state to match distro_metrics structure
  const [funnel, setFunnel] = useState({
    scraped: 0,
    enriched: 0,
    outreach: 0,
    mjrs: 0,
    calls: 0
  })

  const todayStr = new Date().toISOString().split('T')[0]

  useEffect(() => {
    async function load() {
      try {
        const [c, p, s, t, o, m] = await Promise.all([
          supabase.from('clients').select('monthly_retainer', { count: 'exact' }).eq('status', 'active'),
          supabase.from('prospects').select('icp_tier', { count: 'exact' }).neq('status', 'archived'),
          supabase.from('proof_sprints').select('id', { count: 'exact' }).eq('status', 'active'),
          supabase.from('tasks').select('*').eq('due_date', todayStr).order('category'),
          supabase.from('ops_manager_status' as any).select('*'),
          supabase.from('distro_metrics' as any).select('*').eq('date_key', todayStr)
        ])

        setClients(c.count || 0)
        setMrr((c.data as any[] || []).reduce((sum: number, r: any) => sum + (r.monthly_retainer || 0), 0))
        setProspects(p.count || 0)
        setTop((p.data as any[] || []).filter((r: any) => r.icp_tier === '★★★').length)
        setSprints(s.count || 0)
        setTasks(t.data || [])
        setOps(o.data || [])

        const metricsData = (m.data as any[]) || []
        setFunnel({
          scraped:  metricsData.reduce((acc, curr) => acc + (Number(curr.prospects_scraped) || 0), 0),
          enriched: metricsData.reduce((acc, curr) => acc + (Number(curr.prospects_enriched) || 0), 0),
          outreach: metricsData.reduce((acc, curr) => acc + (Number(curr.outreach_sent) || 0), 0),
          mjrs:     metricsData.reduce((acc, curr) => acc + (Number(curr.mjrs_sent) || 0), 0),
          calls:    metricsData.reduce((acc, curr) => acc + (Number(curr.calls_booked) || 0), 0),
        })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [todayStr])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* KPI Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { label: 'Active Clients',  value: clients,                              icon: Users,       sub: 'target: 5 by Dec 1' },
          { label: 'Monthly MRR',     value: formatRand(mrr),                      icon: DollarSign,  sub: 'vs Schedule D target' },
          { label: 'Open Prospects',  value: `${prospects} (${topProspects} ★★★)`, icon: Activity,    sub: 'ICP-scored pipeline' },
          { label: 'Sprints Live',    value: sprints,                              icon: Zap,         sub: '14-day proof cycles' },
        ].map(card => (
          <div key={card.label} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <span className="label">{card.label}</span>
              <card.icon size={14} color="var(--grey2)" />
            </div>
            {loading
              ? <div className="skeleton" style={{ height: 36, width: '70%', marginBottom: 6 }} />
              : <div className="stat-num" style={{ fontSize: 28 }}>{card.value}</div>
            }
            <div style={{ fontSize: 12, color: 'var(--grey)', marginTop: 6, fontFamily: 'DM Mono', letterSpacing: '0.04em' }}>{card.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16 }}>
        {/* MRR Chart */}
        <div className="card">
          <div className="section-label">MRR vs Schedule D</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={SCHEDULE_D} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--grey)', fontFamily: 'DM Mono' }} />
              <YAxis tickFormatter={(v: number) => `R${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: 'var(--grey)', fontFamily: 'DM Mono' }} />
              <Tooltip
                formatter={(v: any) => [formatRand(v)]}
                contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 4, fontSize: 12, fontFamily: 'DM Mono', color: 'var(--white)' }}
              />
              <Line type="monotone" dataKey="target" stroke="var(--grey2)" strokeDasharray="4 4" strokeWidth={1.5} dot={false} name="Target" />
              <Line type="monotone" dataKey="actual" stroke="var(--teal)" strokeWidth={2} dot={false} name="Actual" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* FULL PIPELINE FUNNEL */}
        <div className="card">
          <div className="section-label">Global Pipeline (Today)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
            {[
              { stage: 'Prospects Scraped', val: funnel.scraped,  target: 200, color: 'var(--grey2)' },
              { stage: 'Data Enriched',     val: funnel.enriched, target: 200, color: 'var(--grey2)' },
              { stage: 'Outreach Sent',     val: funnel.outreach, target: 400, color: 'var(--teal)' },
              { stage: 'MJRs Delivered',    val: funnel.mjrs,     target: 20,  color: 'var(--teal)' },
              { stage: 'Calls Booked',      val: funnel.calls,    target: 10,  color: 'var(--white)' },
            ].map((f) => (
              <div key={f.stage}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--grey)', fontFamily: 'Barlow' }}>{f.stage}</span>
                  <span style={{ fontFamily: 'DM Mono', fontSize: 11, color: f.color }}>
                    {f.val} <span style={{ color: 'var(--grey2)', fontSize: 9 }}>/ {f.target}</span>
                  </span>
                </div>
                <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ 
                    height: '100%', 
                    background: f.color, 
                    borderRadius: 10, 
                    width: `${Math.min((f.val / (f.target || 1)) * 100, 100)}%`,
                    transition: 'width 1s ease'
                  }} />
                </div>
              </div>
            ))}
            
            <div style={{ marginTop: 8, padding: 10, background: 'var(--bg3)', borderRadius: 6, border: '1px solid var(--border2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 9, color: 'var(--grey2)', textTransform: 'uppercase' }}>Conv. Rate</div>
                <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'DM Mono' }}>
                  {funnel.outreach > 0 ? ((funnel.calls / funnel.outreach) * 100).toFixed(1) : 0}%
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 9, color: 'var(--grey2)', textTransform: 'uppercase' }}>Efficiency</div>
                <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'DM Mono', color: 'var(--teal)' }}>
                  {funnel.scraped > 0 ? ((funnel.outreach / funnel.scraped) * 100).toFixed(0) : 0}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
        {/* Task List */}
        <div className="card">
          <div className="section-label">System Tasks</div>
          {loading
            ? [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 32, marginBottom: 8 }} />)
            : tasks.length === 0
              ? <div style={{ color: 'var(--grey)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No tasks today</div>
              : tasks.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
                  <div style={{
                    width: 14, height: 14, borderRadius: 3, flexShrink: 0, marginTop: 2,
                    border: `1.5px solid ${t.status === 'complete' ? 'var(--teal)' : 'var(--grey2)'}`,
                    background: t.status === 'complete' ? 'var(--teal)' : 'transparent',
                  }} />
                  <div style={{ flex: 1, fontSize: 13, color: t.status === 'complete' ? 'var(--grey)' : 'var(--white)' }}>{t.title}</div>
                </div>
              ))
          }
        </div>

        {/* Ops Status Table */}
        <div className="card">
          <div className="section-label">Ops Execution Status</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {opsManagers.map(mgr => {
              const hasTasks = (mgr.total_tasks_assigned || 0) > 0;
              const isDone = hasTasks && (mgr.tasks_completed >= mgr.total_tasks_assigned);
              return (
                <div key={mgr.manager_id} style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                  padding: '14px 16px', background: 'var(--bg3)', borderRadius: 8,
                  border: isDone ? '1px solid var(--teal)' : '1px solid transparent'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                     {mgr.role === 'delivery' ? <Target size={14} color="var(--teal)" /> : <ShieldCheck size={14} color="var(--grey2)" />}
                     <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{mgr.name}</div>
                        <div style={{ fontSize: 9, color: 'var(--grey2)', textTransform: 'uppercase' }}>{mgr.role}</div>
                     </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                     <div style={{ fontSize: 12, fontFamily: 'DM Mono', color: isDone ? 'var(--teal)' : 'var(--white)' }}>
                        {mgr.tasks_completed || 0}/{mgr.total_tasks_assigned || 0}
                     </div>
                     {mgr.last_active && (
                       <div style={{ fontSize: 8, color: 'var(--grey2)' }}>
                         Active: {new Date(mgr.last_active).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </div>
                     )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}