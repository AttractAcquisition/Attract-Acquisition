
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import type { Task } from '../../../lib/supabase'
import { catBadgeClass } from '../../../lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useToast } from '../../../lib/toast'

const MONTHS = [
  { key: '2026-03', label: 'March 2026',     sub: 'Foundation & Roadmap',     milestone: null },
  { key: '2026-04', label: 'April 2026',     sub: 'SOPs & Templates',         milestone: null },
  { key: '2026-05', label: 'May 2026',       sub: 'Systems Build',            milestone: null },
  { key: '2026-06', label: 'June 2026',      sub: 'Prospects & Legal Prep',   milestone: null },
  { key: '2026-07', label: 'July 2026',      sub: 'Italy Prep & Expansion',   milestone: null },
  { key: '2026-08', label: 'August 2026',    sub: 'Brand & Final Systems',    milestone: null },
  { key: '2026-09', label: 'September 2026', sub: 'Lock, Test & Launch Prep', milestone: 'OCT 1 — AA GOES LIVE' },
  { key: '2026-10', label: 'October 2026',   sub: 'Cold Start. First 48h.',   milestone: 'LAUNCH DAY' },
  { key: '2026-11', label: 'November 2026',  sub: 'Trust registered. VA hire.', milestone: null },
  { key: '2026-12', label: 'December 2026',  sub: '5 clients. Cash flow positive.', milestone: '5 CLIENTS' },
  { key: '2027-01', label: 'January 2027',   sub: 'Trust funded. R50k trajectory.', milestone: null },
  { key: '2027-02', label: 'February 2027',  sub: 'VA team expanding.',       milestone: null },
  { key: '2027-03', label: 'March 2027',     sub: 'R50k+ MRR target.',        milestone: 'R50k+ MRR' },
]

const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export default function AdminView() {
  const today       = new Date()
  const todayStr    = today.toISOString().split('T')[0]
  const todayKey    = todayStr.slice(0, 7)
  const initIdx     = Math.max(0, MONTHS.findIndex(m => m.key === todayKey))

  const [monthIdx, setMonthIdx] = useState(initIdx)
  const [tasks, setTasks]       = useState<Task[]>([])
  const [loading, setLoading]   = useState(true)
  const { toast }               = useToast()
  const currentMonth            = MONTHS[monthIdx]

  useEffect(() => { loadTasks() }, [monthIdx])

  async function loadTasks() {
    setLoading(true)
    const { data } = await supabase
      .from('tasks').select('*')
      .eq('month_key', currentMonth.key)
      .order('due_date')
    setTasks(data || [])
    setLoading(false)
  }

  async function toggleTask(task: Task) {
    const newStatus = task.status === 'complete' ? 'pending' : 'complete'
    const { error } = await supabase.from('tasks').update({
      status: newStatus,
      completed_at: newStatus === 'complete' ? new Date().toISOString() : null as string | null,
    }).eq('id', task.id)
    if (error) { toast('Failed to update task', 'error'); return }
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
    toast(newStatus === 'complete' ? 'Task complete ✓' : 'Task reopened', newStatus === 'complete' ? 'success' : 'info')
  }

  const grouped: Record<number, Task[]> = {}
  tasks.forEach(t => {
    const day = new Date(t.due_date + 'T12:00:00').getDate()
    if (!grouped[day]) grouped[day] = []
    grouped[day].push(t)
  })
  const days  = Object.keys(grouped).map(Number).sort((a, b) => a - b)
  const total = tasks.length
  const done  = tasks.filter(t => t.status === 'complete').length
  const pct   = total ? Math.round(done / total * 100) : 0

  function dayName(day: number) {
    const [y, m] = currentMonth.key.split('-').map(s => parseInt(s || '0'))
    return DAY_NAMES[new Date(y, m - 1, day).getDay()]
  }

  function isToday(day: number) {
    const [y, m] = currentMonth.key.split('-').map(s => parseInt(s || '0'))
    return y === today.getFullYear() && m === today.getMonth() + 1 && day === today.getDate()
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button className="btn-ghost" style={{ padding: '8px 12px' }}
            onClick={() => setMonthIdx(i => Math.max(0, i - 1))} disabled={monthIdx === 0}>
            <ChevronLeft size={14} />
          </button>
          <div>
            <div style={{ fontFamily: 'Playfair Display', fontSize: 22, fontWeight: 700 }}>{currentMonth.label}</div>
            <div style={{ fontFamily: 'DM Mono', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--teal)', marginTop: 2 }}>{currentMonth.sub}</div>
          </div>
          <button className="btn-ghost" style={{ padding: '8px 12px' }}
            onClick={() => setMonthIdx(i => Math.min(MONTHS.length - 1, i + 1))} disabled={monthIdx === MONTHS.length - 1}>
            <ChevronRight size={14} />
          </button>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ width: 160, height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
            <div style={{ height: '100%', background: 'var(--teal)', width: `${pct}%`, borderRadius: 2, transition: 'width 0.3s' }} />
          </div>
          <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--grey)' }}>{done}/{total} tasks · {pct}%</div>
        </div>
      </div>

      {currentMonth.milestone && (
        <div style={{ background: 'var(--teal-faint)', border: '1px solid var(--teal-border)', borderRadius: 4, padding: '12px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: 'var(--teal)', fontFamily: 'DM Mono', fontSize: 12 }}>★</span>
          <span style={{ fontFamily: 'DM Mono', fontSize: 11, letterSpacing: '0.1em', color: 'var(--teal)', textTransform: 'uppercase' }}>{currentMonth.milestone}</span>
        </div>
      )}

      {loading
        ? [1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 52, marginBottom: 8 }} />)
        : days.length === 0
          ? <div className="empty-state"><h3>No tasks this month</h3><p>Tasks will appear here once seeded from the master calendar.</p></div>
          : days.map(day => (
            <div key={day} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontFamily: 'DM Mono', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--grey)', whiteSpace: 'nowrap' }}>
                  {dayName(day)} {day}
                </span>
                {isToday(day) && (
                  <span style={{ fontFamily: 'DM Mono', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', background: 'var(--teal)', color: 'var(--bg)', borderRadius: 3, padding: '2px 8px' }}>Today</span>
                )}
                <div style={{ flex: 1, height: 1, background: 'var(--border2)' }} />
              </div>
              {grouped[day].map(task => (
                <div key={task.id} onClick={() => toggleTask(task)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12, padding: '11px 14px', marginBottom: 6,
                    cursor: 'pointer', border: '1px solid var(--border2)', borderRadius: 4,
                    background: task.status === 'complete' ? 'transparent' : 'var(--bg2)',
                    transition: 'background 0.15s', opacity: task.status === 'complete' ? 0.45 : 1,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--teal-faint)')}
                  onMouseLeave={e => (e.currentTarget.style.background = task.status === 'complete' ? 'transparent' : 'var(--bg2)')}
                >
                  <div style={{
                    width: 18, height: 18, borderRadius: 3, flexShrink: 0, marginTop: 1,
                    border: `1.5px solid ${task.status === 'complete' ? 'var(--teal)' : 'var(--grey2)'}`,
                    background: task.status === 'complete' ? 'var(--teal)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                  }}>
                    {task.status === 'complete' && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="#070F0D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <div style={{ flex: 1, fontSize: 14, color: 'var(--white)', lineHeight: 1.5, textDecoration: task.status === 'complete' ? 'line-through' : 'none' }}>
                    {task.title}
                  </div>
                  <span className={`badge ${catBadgeClass(task.category || '')}`} style={{ marginTop: 2 }}>
                    {task.category}
                  </span>
                </div>
              ))}
            </div>
          ))
      }
    </div>
  )
}
