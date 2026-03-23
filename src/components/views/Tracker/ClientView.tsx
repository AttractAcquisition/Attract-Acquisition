import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../lib/auth'
import { formatDate } from '../../../lib/utils'

export default function ClientView() {
  const { metadata_id }    = useAuth()
  const [sprints, setSprints] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!metadata_id) return
    supabase
      .from('proof_sprints').select('*')
      .eq('client_id', metadata_id!)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setSprints(data || []); setLoading(false) })
  }, [metadata_id])

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ fontFamily: 'Playfair Display', fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Your Project Timeline</div>
      <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--grey)', letterSpacing: '0.06em', marginBottom: 28 }}>
        Sprint progress and milestones for your account
      </div>

      {loading
        ? [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 72, marginBottom: 10 }} />)
        : sprints.length === 0
          ? (
            <div className="empty-state">
              <h3>No sprints yet</h3>
              <p>Your project timeline will appear here once your first sprint is launched.</p>
            </div>
          )
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sprints.map((s, idx) => {
                const cpl      = s.cpl || 0
                const cplColor = cpl === 0 ? 'var(--grey)' : cpl < 150 ? 'var(--green)' : cpl < 300 ? 'var(--amber)' : 'var(--red)'
                const isActive = s.status === 'active'
                return (
                  <div key={s.id} style={{
                    padding: '16px 18px', borderRadius: 6,
                    border: `1px solid ${isActive ? 'var(--teal)' : 'var(--border2)'}`,
                    background: isActive ? 'var(--teal-faint)' : 'var(--bg2)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: isActive ? 'var(--teal)' : 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
                          Sprint {s.sprint_number || (sprints.length - idx)} {isActive ? '· ACTIVE' : ''}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--white)' }}>
                          Started {formatDate(s.start_date)}
                        </div>
                      </div>
                      <span className={`badge ${s.status === 'active' ? 'badge-sprint' : s.status === 'closed_won' ? 'badge-won' : 'badge-new'}`}>
                        {s.status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
                      <div>
                        <div style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--grey2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Leads</div>
                        <div style={{ fontFamily: 'DM Mono', fontSize: 16, color: 'var(--white)' }}>{s.leads_generated || 0}</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--grey2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Cost / Lead</div>
                        <div style={{ fontFamily: 'DM Mono', fontSize: 16, color: cplColor }}>{cpl > 0 ? `R${cpl.toFixed(0)}` : '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--grey2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Ad Spend</div>
                        <div style={{ fontFamily: 'DM Mono', fontSize: 16, color: 'var(--white)' }}>R{(s.actual_ad_spend || 0).toFixed(0)}</div>
                      </div>
                      {s.bookings_from_sprint > 0 && (
                        <div>
                          <div style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--grey2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Bookings</div>
                          <div style={{ fontFamily: 'DM Mono', fontSize: 16, color: 'var(--teal)' }}>{s.bookings_from_sprint}</div>
                        </div>
                      )}
                    </div>
                    {s.results_meeting_outcome && (
                      <div style={{ marginTop: 10, fontSize: 12, color: 'var(--grey)', fontStyle: 'italic', borderTop: '1px solid var(--border2)', paddingTop: 10 }}>
                        {s.results_meeting_outcome}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
      }
    </div>
  )
}
