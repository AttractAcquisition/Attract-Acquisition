import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import type { Task } from '../../../lib/supabase'
import { useAuth } from '../../../lib/auth'
import { useToast } from '../../../lib/toast'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  CheckCircle2, 
  Circle,
  User
} from 'lucide-react'

const MONTHS = [
  { key: '2026-03', label: 'March 2026',     sub: 'Foundation & Roadmap' },
  { key: '2026-04', label: 'April 2026',     sub: 'SOPs & Templates' },
  { key: '2026-05', label: 'May 2026',       sub: 'Systems Build' },
  { key: '2026-06', label: 'June 2026',      sub: 'Prospects & Legal Prep' },
  { key: '2026-07', label: 'July 2026',      sub: 'Italy Prep & Expansion' },
  { key: '2026-08', label: 'August 2026',    sub: 'Brand & Final Systems' },
  { key: '2026-09', label: 'September 2026', sub: 'Lock, Test & Launch Prep' },
  { key: '2026-10', label: 'October 2026',   sub: 'Cold Start. First 48h.' },
]

const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export default function OperatorView() {
  const { metadata_id }  = useAuth()
  const { toast }        = useToast()
  
  const today            = new Date()
  const todayStr         = today.toISOString().split('T')[0]
  const todayKey         = todayStr.slice(0, 7)
  const initIdx          = Math.max(0, MONTHS.findIndex(m => m.key === todayKey))

  const [monthIdx, setMonthIdx] = useState(initIdx)
  const [tasks, setTasks]       = useState<Task[]>([])
  const [loading, setLoading]   = useState(true)
  
  const currentMonth            = MONTHS[monthIdx]

  useEffect(() => {
    if (metadata_id) loadTasks()
  }, [monthIdx, metadata_id])

  async function loadTasks() {
    setLoading(true)
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('month_key', currentMonth.key)
      .eq('assigned_to', metadata_id!)
      .order('due_date')
    
    if (error) {
      console.error('Error loading tasks:', error)
      setLoading(false)
      return
    }

    setTasks(data || [])
    setLoading(false)
  }

  async function toggleTask(task: Task) {
    const isDone = task.status === 'complete'
    const newStatus = isDone ? 'pending' : 'complete'
    
    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t))

    const { error } = await supabase
      .from('tasks')
      .update({
        status: newStatus,
        completed_at: newStatus === 'complete' ? new Date().toISOString() : null,
      })
      .eq('id', task.id)

    if (error) {
      // Revert UI on error
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t))
      toast('Failed to update progress', 'error')
      return
    }

    toast(newStatus === 'complete' ? 'Protocol verified ✓' : 'Task reopened', newStatus === 'complete' ? 'success' : 'info')
  }

  // Stats calculation
  const total = tasks.length
  const done  = tasks.filter(t => t.status === 'complete').length
  const pct   = total ? Math.round((done / total) * 100) : 0

  const grouped: Record<number, Task[]> = {}
  tasks.forEach(t => {
    const day = new Date(t.due_date + 'T12:00:00').getDate()
    if (!grouped[day]) grouped[day] = []
    grouped[day].push(t)
  })
  const days = Object.keys(grouped).map(Number).sort((a, b) => a - b)

  function dayName(day: number) {
    const [y, m] = currentMonth.key.split('-').map(s => parseInt(s || '0'))
    return DAY_NAMES[new Date(y, m - 1, day).getDay()]
  }

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', paddingBottom: 100 }}>
      {/* VELOCITY HEADER */}
      <header style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <button 
              className="btn-ghost" 
              style={{ padding: '4px' }}
              onClick={() => setMonthIdx(i => Math.max(0, i - 1))} 
              disabled={monthIdx === 0}
            >
              <ChevronLeft size={20} />
            </button>
            <h1 style={{ fontFamily: 'Playfair Display', fontSize: 32, fontWeight: 700, color: 'var(--white)' }}>
              {currentMonth.label}
            </h1>
            <button 
              className="btn-ghost" 
              style={{ padding: '4px' }}
              onClick={() => setMonthIdx(i => Math.min(MONTHS.length - 1, i + 1))} 
              disabled={monthIdx === MONTHS.length - 1}
            >
              <ChevronRight size={20} />
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--grey)', fontSize: 11, fontFamily: 'DM Mono', textTransform: 'uppercase' }}>
              <User size={13} className="text-teal" /> Personal Roadmap
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--teal)', fontSize: 11, fontFamily: 'DM Mono', textTransform: 'uppercase' }}>
              {currentMonth.sub}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right', minWidth: 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--grey)', textTransform: 'uppercase' }}>Completion Rate</span>
                <span style={{ fontFamily: 'DM Mono', fontSize: 14, color: 'var(--teal)' }}>{pct}%</span>
            </div>
            <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'var(--teal)', width: `${pct}%`, transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }} />
            </div>
        </div>
      </header>

      {loading ? (
        <div className="skeleton" style={{ height: 400, borderRadius: 12 }} />
      ) : days.length === 0 ? (
        <div className="empty-state" style={{ padding: '60px 0', textAlign: 'center', border: '1px dashed var(--border2)', borderRadius: 12 }}>
          <h3 style={{ color: 'var(--grey)', fontFamily: 'DM Mono', fontSize: 14 }}>No assignments found for this period</h3>
        </div>
      ) : (
        days.map(day => (
          <section key={day} style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={14} style={{ color: 'var(--teal)' }} />
                <h2 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--white)', fontFamily: 'DM Mono', fontWeight: 600 }}>
                  {dayName(day)} {day}
                </h2>
              </div>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, var(--border2), transparent)' }} />
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              {grouped[day].map(task => {
                const isCompleted = task.status === 'complete'
                return (
                  <div key={task.id} 
                    onClick={() => toggleTask(task)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 18, padding: '18px 24px',
                      background: isCompleted ? 'rgba(20, 26, 25, 0.4)' : 'var(--bg2)',
                      border: `1px solid ${isCompleted ? 'var(--teal-faint)' : 'var(--border2)'}`, 
                      borderRadius: 10,
                      cursor: 'pointer', transition: 'all 0.25s ease',
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

                    <div>
                      {isCompleted ? 
                        <CheckCircle2 size={20} color="var(--teal)" strokeWidth={2.5} /> : 
                        <Circle size={20} color="var(--grey2)" strokeWidth={1.5} />
                      }
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontSize: 15, 
                        color: isCompleted ? 'var(--grey)' : 'var(--white)',
                        textDecoration: isCompleted ? 'line-through' : 'none',
                        transition: 'color 0.2s'
                      }}>
                        {task.title}
                      </div>
                      <div style={{ 
                        fontSize: 9, 
                        color: isCompleted ? 'var(--grey2)' : 'var(--teal)', 
                        fontFamily: 'DM Mono', 
                        textTransform: 'uppercase', 
                        marginTop: 4,
                        letterSpacing: '0.05em'
                      }}>
                        {task.category}
                      </div>
                    </div>

                    {isCompleted && (
                      <span style={{ fontFamily: 'DM Mono', fontSize: 9, color: 'var(--teal)', opacity: 0.6, textTransform: 'uppercase' }}>
                        Logged
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