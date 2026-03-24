import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import type { Task } from '../../../lib/supabase'
import { ChevronLeft, ChevronRight, CheckCircle2, Circle } from 'lucide-react'
import { useToast } from '../../../lib/toast'

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
    const { data } = await supabase.from('tasks').select('*').eq('month_key', currentMonth.key).order('due_date')
    setTasks(data || [])
    setLoading(false)
  }

  async function toggleTask(task: Task) {
    const newStatus = task.status === 'complete' ? 'pending' : 'complete'
    const { error } = await supabase.from('tasks').update({
      status: newStatus,
      completed_at: newStatus === 'complete' ? new Date().toISOString() : null
    }).eq('id', task.id)
    
    if (error) { toast('Update failed', 'error'); return }
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
    toast(newStatus === 'complete' ? 'Task complete ✓' : 'Task reopened', 'success')
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

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', paddingBottom: 100 }}>
      <header style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <button className="btn-ghost" onClick={() => setMonthIdx(i => Math.max(0, i - 1))}><ChevronLeft size={18} /></button>
            <h1 style={{ fontFamily: 'Playfair Display', fontSize: 32, fontWeight: 700, color: 'var(--white)' }}>{currentMonth.label}</h1>
            <button className="btn-ghost" onClick={() => setMonthIdx(i => Math.min(MONTHS.length - 1, i + 1))}><ChevronRight size={18} /></button>
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--teal)', fontSize: 11, fontFamily: 'DM Mono', textTransform: 'uppercase' }}>
               {currentMonth.sub}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right', minWidth: 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--grey)', textTransform: 'uppercase' }}>Monthly Progress</span>
                <span style={{ fontFamily: 'DM Mono', fontSize: 14, color: 'var(--teal)' }}>{pct}%</span>
            </div>
            <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'var(--teal)', width: `${pct}%`, transition: 'width 0.6s ease' }} />
            </div>
        </div>
      </header>

      {loading ? <div className="skeleton" style={{ height: 400 }} /> : (
        days.map(day => (
          <section key={day} style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <span style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--grey)', textTransform: 'uppercase' }}>Day {day}</span>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, var(--border2), transparent)' }} />
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {grouped[day].map(task => {
                const isCompleted = task.status === 'complete'
                return (
                  <div key={task.id} onClick={() => toggleTask(task)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 18, padding: '16px 20px',
                      background: isCompleted ? 'transparent' : 'var(--bg2)',
                      border: `1px solid ${isCompleted ? 'var(--teal-faint)' : 'var(--border2)'}`,
                      borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s'
                    }}>
                    {isCompleted ? <CheckCircle2 size={20} color="var(--teal)" /> : <Circle size={20} color="var(--grey2)" />}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, color: isCompleted ? 'var(--grey)' : 'var(--white)', textDecoration: isCompleted ? 'line-through' : 'none' }}>{task.title}</div>
                      <div style={{ fontSize: 9, color: 'var(--teal)', fontFamily: 'DM Mono', textTransform: 'uppercase', marginTop: 4 }}>{task.category}</div>
                    </div>
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