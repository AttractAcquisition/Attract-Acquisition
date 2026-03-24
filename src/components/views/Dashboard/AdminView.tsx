
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { formatRand, formatDate, catBadgeClass } from '../../../lib/utils'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, Users, Zap, DollarSign } from 'lucide-react'

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
  const [outreach, setOutreach]   = useState<any[]>([])
  const [savings, setSavings]     = useState(62000)
  const [loading, setLoading]     = useState(true)

  const todayStr = new Date().toISOString().split('T')[0]

  useEffect(() => {
    async function load() {
      const [c, p, s, t, o] = await Promise.all([
        supabase.from('clients').select('monthly_retainer', { count: 'exact' }).eq('status', 'active'),
        supabase.from('prospects').select('icp_tier', { count: 'exact' }).neq('status', 'archived'),
        supabase.from('proof_sprints').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('tasks').select('*').eq('due_date', todayStr).order('category'),
        supabase.from('outreach_messages').select('*, prospects(business_name)').order('created_at', { ascending: false }).limit(5),
      ])
      setClients(c.count || 0)
      setMrr((c.data || []).reduce((sum: number, r: any) => sum + (r.monthly_retainer || 0), 0))
      setProspects(p.count || 0)
      setTop((p.data || []).filter((r: any) => r.icp_tier === '★★★').length)
      setSprints(s.count || 0)
      setTasks(t.data || [])
      setOutreach(o.data || [])
      setLoading(false)
    }
    load()
  }, [])

  const savingsPct = Math.min(100, Math.round(savings / 158000 * 100))
  const monthsLeft = Math.ceil((158000 - savings) / 62000)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { label: 'Active Clients',  value: clients,                              icon: Users,       sub: 'target: 5 by Dec 1' },
          { label: 'Monthly MRR',     value: formatRand(mrr),                      icon: DollarSign,  sub: 'vs Schedule D target' },
          { label: 'Open Prospects',  value: `${prospects} (${topProspects} ★★★)`, icon: TrendingUp,  sub: 'ICP-scored pipeline' },
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
        <div className="card">
          <div className="section-label">MRR vs Schedule D</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={SCHEDULE_D} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
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

        <div className="card">
          <div className="section-label">Pipeline Funnel</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { stage: 'Contacted',    w: 100 },
              { stage: 'MJR Sent',    w: 80 },
              { stage: 'Call Booked', w: 60 },
              { stage: 'Sprint Live', w: 40 },
              { stage: 'Closed Won',  w: 20 },
            ].map((f, i) => (
              <div key={f.stage}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: 'var(--grey)', fontFamily: 'Barlow' }}>{f.stage}</span>
                  <span style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--teal)' }}>0</span>
                </div>
                <div style={{ height: 5, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--teal)', borderRadius: 2, width: `${f.w}%`, opacity: 0.3 + i * 0.14 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="section-label">Today's Tasks</div>
          {loading
            ? [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 32, marginBottom: 8 }} />)
            : tasks.length === 0
              ? <div style={{ color: 'var(--grey)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No tasks today</div>
              : tasks.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: 3, flexShrink: 0, marginTop: 2,
                    border: `1.5px solid ${t.status === 'complete' ? 'var(--teal)' : 'var(--grey2)'}`,
                    background: t.status === 'complete' ? 'var(--teal)' : 'transparent',
                  }} />
                  <div style={{ flex: 1, fontSize: 13, color: t.status === 'complete' ? 'var(--grey)' : 'var(--white)' }}>{t.title}</div>
                  <span className={`badge ${catBadgeClass(t.category)}`}>{t.category}</span>
                </div>
              ))
          }
        </div>

        <div className="card">
          <div className="section-label">Recent Outreach</div>
          {outreach.length === 0
            ? <div style={{ color: 'var(--grey)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No outreach yet</div>
            : outreach.map(o => (
              <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid var(--border2)' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{o.prospects?.business_name || '—'}</div>
                  <div style={{ fontSize: 11, color: 'var(--grey)', fontFamily: 'DM Mono', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{o.message_type?.replace(/_/g, ' ')}</div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--grey2)', fontFamily: 'DM Mono' }}>{formatDate(o.created_at)}</div>
              </div>
            ))
          }
        </div>

        <div className="card">
          <div className="section-label">Seed Capital Tracker</div>
          <div className="stat-num" style={{ fontSize: 26, marginBottom: 4 }}>{formatRand(savings)}</div>
          <div style={{ fontSize: 12, color: 'var(--grey)', marginBottom: 16, fontFamily: 'DM Mono' }}>of R158,000 target</div>
          <div style={{ height: 5, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ height: '100%', background: 'var(--teal)', borderRadius: 2, width: `${savingsPct}%`, transition: 'width 0.4s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--grey)', marginBottom: 16, fontFamily: 'DM Mono' }}>
            <span>{savingsPct}% complete</span>
            <span>{monthsLeft} months left</span>
          </div>
          <input type="number" className="input" placeholder="Update balance..."
            style={{ fontSize: 13 }}
            onBlur={e => { if (e.target.value) { setSavings(Number(e.target.value)); e.target.value = '' } }}
          />
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--grey)', fontFamily: 'DM Mono' }}>+R62,000/mo accumulation</div>
        </div>
      </div>
    </div>
  )
}
