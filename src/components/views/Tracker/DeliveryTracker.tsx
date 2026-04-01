import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../lib/auth'
import { useToast } from '../../../lib/toast'
import { CheckCircle2, Circle, Calendar, CheckSquare, ShieldCheck } from 'lucide-react'

const getWeekKey = (date: Date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo}`;
};

const DELIVERY_TASKS = {
  daily: [
    { id: 'del_metrics', label: 'Update Daily Pipeline Metrics per Client', cat: 'reporting' },
    { id: 'del_sprints', label: 'Review Active Proof Sprints for Blockers', cat: 'ops' },
    { id: 'del_content', label: 'Review & Approve Content in MJR Studio', cat: 'quality' },
    { id: 'del_whatsapp', label: 'Clear Client Support / Strategy WhatsApps', cat: 'retention' },
  ],
  weekly: [
    { id: 'w_client_calls', label: 'Conduct Weekly Strategy Syncs', cat: 'retention' },
    { id: 'w_ad_spend', label: 'Audit Meta Ad Spend & CPA Efficiency', cat: 'performance' },
    { id: 'w_case_study', label: 'Identify Potential Case Studies / Wins', cat: 'growth' },
  ],
  monthly: [
    { id: 'm_churn_audit', label: 'Risk Assessment & Retention Strategy', cat: 'strategy' },
    { id: 'm_billing', label: 'Verify Retainer Renewals & Ad Budgeting', cat: 'finance' },
  ]
}

export default function DeliveryTracker() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [progress, setProgress] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().split('T')[0]
  const weekKey = getWeekKey(new Date())
  const monthKey = new Date().toISOString().slice(0, 7)

  useEffect(() => {
    if (user?.id) loadProgress()
    else setLoading(false)
  }, [user?.id])

  async function loadProgress() {
    if (!user?.id) { setLoading(false); return }
    setLoading(true)
    try {
      const { data, error } = await (supabase.from('delivery_progress' as any))
        .select('task_id, is_completed')
        .eq('manager_id', user.id)
        .in('date_key', [today, weekKey, monthKey])

      if (!error && data) {
        const map: Record<string, boolean> = {}
        data.forEach((item: any) => { map[item.task_id] = item.is_completed })
        setProgress(map)
      }
    } finally {
      setLoading(false)
    }
  }

  async function toggleTask(taskId: string, frequency: string) {
    if (!user?.id) return
    const isDone = !!progress[taskId]
    const newStatus = !isDone
    let activeKey = frequency === 'weekly' ? weekKey : frequency === 'monthly' ? monthKey : today

    setProgress(prev => ({ ...prev, [taskId]: newStatus }))

    const { error } = await (supabase.from('delivery_progress' as any)).upsert({
      manager_id: user.id,
      task_id: taskId,
      date_key: activeKey,
      is_completed: newStatus,
      updated_at: new Date().toISOString()
    }, { onConflict: 'manager_id,task_id,date_key' })

    if (error) {
      setProgress(prev => ({ ...prev, [taskId]: isDone }))
      toast('Failed to save progress', 'error')
      return
    }
    toast(newStatus ? 'Protocol followed ✓' : 'Task reopened', newStatus ? 'success' : 'info')
  }

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', paddingBottom: 100 }}>
      {/* HEADER SECTION */}
      <header style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontFamily: 'Playfair Display', fontSize: 32, fontWeight: 700, marginBottom: 12, color: 'var(--white)' }}>
            Delivery Execution
          </h1>
          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--grey)', fontSize: 11, fontFamily: 'DM Mono', textTransform: 'uppercase' }}>
              <Calendar size={13} className="text-teal" /> {today}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--grey)', fontSize: 11, fontFamily: 'DM Mono', textTransform: 'uppercase' }}>
              <ShieldCheck size={13} className="text-teal" /> Delivery Ops
            </div>
          </div>
        </div>
      </header>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
           {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12, opacity: 0.1 }} />)}
        </div>
      ) : (
        Object.entries(DELIVERY_TASKS).map(([frequency, list]) => (
          <section key={frequency} style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckSquare size={14} style={{ color: 'var(--teal)' }} />
                <h2 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--white)', fontFamily: 'DM Mono', fontWeight: 600 }}>
                  {frequency} Operations
                </h2>
              </div>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, var(--border2), transparent)' }} />
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              {list.map(task => {
                const isCompleted = !!progress[task.id]
                return (
                  <div key={task.id} 
                    onClick={() => toggleTask(task.id, frequency)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 18, padding: '20px 24px',
                      background: isCompleted ? 'rgba(20, 26, 25, 0.4)' : 'var(--bg2)',
                      border: `1px solid ${isCompleted ? 'var(--teal-faint)' : 'var(--border2)'}`, 
                      borderRadius: 10,
                      cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative', overflow: 'hidden'
                    }}
                    onMouseEnter={e => {
                      if(!isCompleted) {
                        e.currentTarget.style.borderColor = 'var(--teal)';
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = isCompleted ? 'var(--teal-faint)' : 'var(--border2)';
                      e.currentTarget.style.transform = 'translateX(0px)';
                    }}
                  >
                    {!isCompleted && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'var(--teal)', opacity: 0.5 }} />}

                    <div style={{ transition: 'transform 0.2s' }}>
                      {isCompleted ? 
                        <CheckCircle2 size={22} color="var(--teal)" strokeWidth={2.5} /> : 
                        <Circle size={22} color="var(--grey2)" strokeWidth={1.5} />
                      }
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontSize: 15, 
                        fontWeight: 500,
                        color: isCompleted ? 'var(--grey)' : 'var(--white)',
                        textDecoration: isCompleted ? 'line-through' : 'none',
                        transition: 'color 0.2s'
                      }}>
                        {task.label}
                      </div>
                      <div style={{ 
                        fontSize: 9, 
                        color: isCompleted ? 'var(--grey2)' : 'var(--teal)', 
                        fontFamily: 'DM Mono', 
                        textTransform: 'uppercase', 
                        marginTop: 6,
                        letterSpacing: '0.05em',
                        opacity: 0.7 
                      }}>
                        {task.cat}
                      </div>
                    </div>

                    {isCompleted && (
                      <span style={{ fontFamily: 'DM Mono', fontSize: 9, color: 'var(--teal)', opacity: 0.6, textTransform: 'uppercase' }}>
                        Operationalized
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        ))
      )}
    </div>
  )
}