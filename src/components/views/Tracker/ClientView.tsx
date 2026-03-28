import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../lib/auth'
import { formatDate, formatRand } from '../../../lib/utils'
import { Zap, DollarSign, CalendarCheck, TrendingUp } from 'lucide-react'

export default function ClientView() {
  const { metadata_id } = useAuth()
  const [sprints, setSprints] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!metadata_id) { setLoading(false); return }
    supabase
      .from('proof_sprints')
      .select('*')
      .eq('client_id', metadata_id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setSprints(data || []); setLoading(false) })
  }, [metadata_id])

  if (loading) return (
    <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Mono', color: 'var(--teal)' }}>
      SYNCING TIMELINE...
    </div>
  )

  const totalLeads = sprints.reduce((sum, s) => sum + (s.leads_generated || 0), 0)
  const totalBookings = sprints.reduce((sum, s) => sum + (s.bookings_from_sprint || 0), 0)
  const totalRevenue = sprints.reduce((sum, s) => sum + (s.revenue_attributed || 0), 0)
  const cplSprints = sprints.filter(s => (s.cpl || 0) > 0)
  const avgCpl = cplSprints.length > 0
    ? cplSprints.reduce((sum, s) => sum + s.cpl, 0) / cplSprints.length
    : 0

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', paddingBottom: 60 }}>
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'Playfair Display', fontSize: 28, fontWeight: 700, marginBottom: 8, color: 'var(--white)' }}>
          Execution Timeline
        </h1>
        <div style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Growth Cycles & Result Audits — {sprints.length} Sprint{sprints.length !== 1 ? 's' : ''}
        </div>
      </header>

      {/* TOTALS */}
      {sprints.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 32 }}>
          {[
            { label: 'Total Leads', val: totalLeads, icon: Zap, color: 'var(--teal)' },
            { label: 'Total Bookings', val: totalBookings, icon: CalendarCheck, color: 'var(--teal)' },
            { label: 'Avg CPL', val: avgCpl > 0 ? `R${avgCpl.toFixed(0)}` : '—', icon: TrendingUp, color: 'var(--amber)' },
            { label: 'Total Revenue', val: formatRand(totalRevenue), icon: DollarSign, color: 'var(--green)' },
          ].map(item => (
            <div key={item.label} className="card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontFamily: 'DM Mono', fontSize: 9, color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{item.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: item.color }}>{item.val}</div>
                </div>
                <item.icon size={14} color="var(--grey2)" />
              </div>
            </div>
          ))}
        </div>
      )}

      {sprints.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Zap size={40} color="var(--grey2)" style={{ marginBottom: 16 }} />
          <div style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--grey)' }}>
            No sprints launched yet. Your team is preparing your first cycle.
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {sprints.map((s, idx) => {
            const isActive = s.status === 'active'
            const cycleNum = s.sprint_number || (sprints.length - idx)
            return (
              <div key={s.id} style={{
                padding: '28px 32px', borderRadius: 12,
                border: `1px solid ${isActive ? 'var(--teal)' : 'var(--border2)'}`,
                background: isActive ? 'rgba(0,229,195,0.03)' : 'var(--bg2)',
                position: 'relative', overflow: 'hidden',
              }}>
                {isActive && (
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'var(--teal)' }} />
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                  <div>
                    <div style={{ fontFamily: 'DM Mono', fontSize: 9, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 }}>
                      Cycle {cycleNum}
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--white)' }}>
                      Launched {formatDate(s.start_date)}
                    </div>
                  </div>
                  <div style={{
                    background: isActive ? 'var(--teal)' : 'var(--bg3)',
                    color: isActive ? 'var(--bg)' : 'var(--grey)',
                    fontSize: 9, fontFamily: 'DM Mono', padding: '4px 12px',
                    borderRadius: 4, textTransform: 'uppercase',
                  }}>
                    {s.status}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0 }}>
                  {[
                    { label: 'Leads', val: s.leads_generated || 0, color: 'var(--white)' },
                    { label: 'Cost / Lead', val: s.cpl ? `R${Number(s.cpl).toFixed(0)}` : '—', color: 'var(--teal)' },
                    { label: 'Bookings', val: s.bookings_from_sprint || 0, color: 'var(--white)' },
                    { label: 'Ad Spend', val: formatRand(s.actual_ad_spend || 0), color: 'var(--grey)' },
                    { label: 'Revenue', val: formatRand(s.revenue_attributed || 0), color: 'var(--green)' },
                  ].map(item => (
                    <div key={item.label} style={{ borderLeft: '1px solid var(--border2)', paddingLeft: 16 }}>
                      <div style={{ fontSize: 9, fontFamily: 'DM Mono', color: 'var(--grey)', textTransform: 'uppercase', marginBottom: 6 }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: item.color }}>{item.val}</div>
                    </div>
                  ))}
                </div>

                {s.results_meeting_outcome && (
                  <div style={{ marginTop: 20, padding: '12px 16px', background: 'var(--bg3)', borderRadius: 6, border: '1px solid var(--border2)' }}>
                    <div style={{ fontFamily: 'DM Mono', fontSize: 9, color: 'var(--grey)', textTransform: 'uppercase', marginBottom: 6 }}>
                      Results Meeting Outcome
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--white)', lineHeight: 1.6 }}>
                      {s.results_meeting_outcome}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
