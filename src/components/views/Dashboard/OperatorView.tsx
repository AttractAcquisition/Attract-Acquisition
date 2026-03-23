import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { formatDate, catBadgeClass } from '../../../lib/utils'
import { useAuth } from '../../../lib/auth'
import { useToast } from '../../../lib/toast'
import { Users, Zap, CheckSquare } from 'lucide-react'

export default function OperatorView() {
  const { metadata_id }              = useAuth()
  const { toast }                    = useToast()
  const [myProspects, setMyProspects] = useState<any[]>([])
  const [todayTasks, setTodayTasks]   = useState<any[]>([])
  const [activeSprints, setActiveSprints] = useState(0)
  const [loading, setLoading]         = useState(true)

  const todayStr = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!metadata_id) return
    async function load() {
      const [p, t, s] = await Promise.all([
        supabase.from('prospects').select('id, business_name, status, icp_tier')
          .eq('assigned_to', metadata_id!)
          .neq('status', 'archived')
          .order('icp_total_score', { ascending: false })
          .limit(8),
        supabase.from('tasks').select('*')
          .eq('due_date', todayStr)
          .eq('assigned_to', metadata_id!)
          .order('category'),
        supabase.from('proof_sprints').select('id', { count: 'exact' })
          .eq('status', 'active'),
      ])
      setMyProspects(p.data || [])
      setTodayTasks(t.data || [])
      setActiveSprints(s.count || 0)
      setLoading(false)
    }
    load()
  }, [metadata_id])

  async function toggleTask(task: any) {
    const newStatus = task.status === 'complete' ? 'pending' : 'complete'
    const { error } = await supabase.from('tasks').update({
      status: newStatus,
      completed_at: newStatus === 'complete' ? new Date().toISOString() : null,
    }).eq('id', task.id)
    if (error) { toast('Failed to update task', 'error'); return }
    setTodayTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
    toast(newStatus === 'complete' ? 'Task complete ✓' : 'Task reopened', newStatus === 'complete' ? 'success' : 'info')
  }

  const doneTasks  = todayTasks.filter(t => t.status === 'complete').length
  const totalTasks = todayTasks.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { label: 'My Prospects',  value: myProspects.length,  icon: Users,       sub: 'assigned to you' },
          { label: 'Tasks Today',   value: `${doneTasks}/${totalTasks}`, icon: CheckSquare, sub: 'due today' },
          { label: 'Sprints Live',  value: activeSprints,       icon: Zap,         sub: 'active globally' },
        ].map(card => (
          <div key={card.label} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <span className="label">{card.label}</span>
              <card.icon size={14} color="var(--grey2)" />
            </div>
            {loading
              ? <div className="skeleton" style={{ height: 36, width: '60%', marginBottom: 6 }} />
              : <div className="stat-num" style={{ fontSize: 28 }}>{card.value}</div>
            }
            <div style={{ fontSize: 12, color: 'var(--grey)', marginTop: 6, fontFamily: 'DM Mono' }}>{card.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="section-label">Today's To-Do</div>
          {loading
            ? [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 38, marginBottom: 8 }} />)
            : todayTasks.length === 0
              ? <div style={{ color: 'var(--grey)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No tasks due today</div>
              : todayTasks.map(t => (
                <div key={t.id}
                  onClick={() => toggleTask(t)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: '10px 12px', marginBottom: 6, cursor: 'pointer',
                    border: '1px solid var(--border2)', borderRadius: 4,
                    background: t.status === 'complete' ? 'transparent' : 'var(--bg2)',
                    opacity: t.status === 'complete' ? 0.5 : 1, transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--teal-faint)')}
                  onMouseLeave={e => (e.currentTarget.style.background = t.status === 'complete' ? 'transparent' : 'var(--bg2)')}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: 3, flexShrink: 0, marginTop: 1,
                    border: `1.5px solid ${t.status === 'complete' ? 'var(--teal)' : 'var(--grey2)'}`,
                    background: t.status === 'complete' ? 'var(--teal)' : 'transparent',
                  }} />
                  <div style={{ flex: 1, fontSize: 13, textDecoration: t.status === 'complete' ? 'line-through' : 'none', color: 'var(--white)' }}>
                    {t.title}
                  </div>
                  <span className={`badge ${catBadgeClass(t.category || '')}`}>{t.category}</span>
                </div>
              ))
          }
        </div>

        <div className="card">
          <div className="section-label">My Prospects</div>
          {loading
            ? [1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 38, marginBottom: 8 }} />)
            : myProspects.length === 0
              ? <div style={{ color: 'var(--grey)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No prospects assigned yet</div>
              : myProspects.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border2)' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{p.business_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--grey)', fontFamily: 'DM Mono', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{p.status?.replace(/_/g, ' ')}</div>
                  </div>
                  <span style={{ fontFamily: 'DM Mono', fontSize: 13, color: p.icp_tier === '★★★' ? 'var(--teal)' : p.icp_tier === '★★' ? 'var(--amber)' : 'var(--grey)' }}>
                    {p.icp_tier || '—'}
                  </span>
                </div>
              ))
          }
        </div>
      </div>
    </div>
  )
}
