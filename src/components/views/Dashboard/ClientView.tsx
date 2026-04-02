import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../lib/auth'
import { formatRand, formatDate } from '../../../lib/utils'
import {
  Eye, UserCheck, MessageSquare, CalendarCheck,
  Coins, Phone, MessageCircle, Star, AlertCircle,
  Zap, DollarSign, Target
} from 'lucide-react'

export default function ClientView() {
  const { metadata_id } = useAuth()
  const [client, setClient] = useState<any>(null)
  const [metrics, setMetrics] = useState<any>(null)
  const [manager, setManager] = useState<any>(null)
  const [sprints, setSprints] = useState<any[]>([])
  const [review, setReview] = useState({ rating: 5, comment: '' })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function load() {
      if (!metadata_id) { setLoading(false); return }
      try {
        const [clientRes, metricsRes, sprintsRes] = await Promise.all([
          supabase.from('clients').select('*').eq('id', metadata_id).maybeSingle(),
          supabase.from('delivery_metrics' as any).select('*').eq('client_id', metadata_id)
            .order('date_key', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('proof_sprints').select('*').eq('client_id', metadata_id)
            .order('created_at', { ascending: false }),
        ])

        const clientData = clientRes.data
        setClient(clientData)
        setMetrics(metricsRes.data)
        setSprints(sprintsRes.data || [])

        if (clientData?.account_manager) {
          setManager({
            id: clientData.account_manager,
            full_name: clientData.account_manager_name ?? 'Your Account Manager',
            phone: null,
          })
        }
      } catch (err) {
        console.error('Dashboard load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [metadata_id])

  async function submitReview() {
    if (!metadata_id || !manager?.id) return
    setSubmitting(true)
    await supabase.from('manager_reviews' as any).insert({
      client_id: metadata_id,
      manager_id: manager.id,
      rating: review.rating,
      comment: review.comment,
    })
    setReview({ rating: 5, comment: '' })
    setSubmitting(false)
  }

  if (loading) return (
    <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Mono', color: 'var(--teal)' }}>
      SYNCING ENGINE...
    </div>
  )

  if (!metadata_id) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center', gap: 16 }}>
      <AlertCircle size={40} color="var(--amber)" />
      <h2 style={{ fontFamily: 'Playfair Display', margin: 0 }}>Account Pending Link</h2>
      <p style={{ color: 'var(--grey)', fontSize: 14, maxWidth: 400, lineHeight: 1.6 }}>
        Your profile is active but not linked to a business record. Contact Attract Acquisition.
      </p>
    </div>
  )

  const activeSprint = sprints.find(s => s.status === 'active')
  const completedSprints = sprints.filter(s => s.status !== 'active')
  const totalLeads = sprints.reduce((sum, s) => sum + (s.leads_generated || 0), 0)
  const totalBookings = sprints.reduce((sum, s) => sum + (s.bookings_from_sprint || 0), 0)
  const totalRevenue = sprints.reduce((sum, s) => sum + (s.revenue_attributed || 0), 0)
  const profileConv = metrics?.profile_visits > 0
    ? ((metrics.qualified_followers / metrics.profile_visits) * 100).toFixed(1)
    : '0.0'
  const tierLabel = client?.tier === 'proof_brand'
    ? 'Proof Brand'
    : client?.tier === 'authority_brand'
    ? 'Authority Brand'
    : (client?.tier || 'Active')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1100, margin: '0 auto', paddingBottom: 60 }}>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontFamily: 'Playfair Display', fontSize: 30, fontWeight: 700, margin: 0 }}>
            {client?.business_name || 'Business Portal'}
          </h1>
          <p style={{ color: 'var(--grey)', fontFamily: 'DM Mono', fontSize: 11, textTransform: 'uppercase', marginTop: 4, letterSpacing: '0.1em' }}>
            {tierLabel} · {client?.status || 'Active'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg2)', padding: '8px 16px', borderRadius: 20, border: '1px solid var(--border2)' }}>
          <div style={{ width: 8, height: 8, background: 'var(--teal)', borderRadius: '50%', boxShadow: '0 0 8px var(--teal)' }} />
          <span style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'var(--teal)' }}>
            LIVE ENGINE · {metrics?.date_key || 'PENDING INPUT'}
          </span>
        </div>
      </div>

      {/* KPI SUMMARY ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { label: 'Total Leads', value: totalLeads, icon: Target, color: 'var(--teal)' },
          { label: 'Total Bookings', value: totalBookings, icon: CalendarCheck, color: 'var(--teal)' },
          { label: 'Revenue Attributed', value: formatRand(totalRevenue), icon: DollarSign, color: 'var(--green)' },
          { label: 'Sprint Cycles', value: sprints.length, icon: Zap, color: 'var(--amber)' },
        ].map(kpi => (
          <div key={kpi.label} className="card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontFamily: 'DM Mono', fontSize: 9, color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>{kpi.label}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: kpi.color, fontFamily: 'Playfair Display' }}>{kpi.value}</div>
              </div>
              <kpi.icon size={18} color="var(--grey2)" />
            </div>
          </div>
        ))}
      </div>

      {/* ACTIVE SPRINT BANNER */}
      {activeSprint && (
        <div style={{ background: 'rgba(0,229,195,0.04)', border: '1px solid var(--teal)', borderRadius: 12, padding: '24px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontFamily: 'DM Mono', fontSize: 9, color: 'var(--teal)', letterSpacing: '0.2em', marginBottom: 4, textTransform: 'uppercase' }}>
                Active Sprint — Cycle {activeSprint.sprint_number || sprints.indexOf(activeSprint) + 1}
              </div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Launched {formatDate(activeSprint.start_date)}</div>
            </div>
            <div style={{ background: 'var(--teal)', color: 'var(--bg)', fontFamily: 'DM Mono', fontSize: 9, padding: '4px 14px', borderRadius: 4, letterSpacing: '0.1em' }}>LIVE</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0 }}>
            {[
              { label: 'Leads', val: activeSprint.leads_generated || 0, color: 'var(--white)' },
              { label: 'Cost / Lead', val: activeSprint.cpl ? `R${activeSprint.cpl.toFixed(0)}` : '—', color: 'var(--teal)' },
              { label: 'Bookings', val: activeSprint.bookings_from_sprint || 0, color: 'var(--white)' },
              { label: 'Ad Spend', val: formatRand(activeSprint.actual_ad_spend || 0), color: 'var(--grey)' },
              { label: 'Revenue', val: formatRand(activeSprint.revenue_attributed || 0), color: 'var(--green)' },
            ].map(item => (
              <div key={item.label} style={{ borderLeft: '1px solid var(--teal-border)', paddingLeft: 16 }}>
                <div style={{ fontFamily: 'DM Mono', fontSize: 9, color: 'var(--grey)', textTransform: 'uppercase', marginBottom: 6 }}>{item.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: item.color }}>{item.val}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LIVE PIPELINE — daily metrics input by account manager */}
      <div className="card" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <div style={{ fontFamily: 'DM Mono', fontSize: 9, color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 4 }}>Daily Pipeline</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>Live Acquisition Metrics</div>
          </div>
          <span style={{ fontSize: 10, color: metrics?.date_key ? 'var(--teal)' : 'var(--grey)', fontFamily: 'DM Mono' }}>
            ● {metrics?.date_key ? `UPDATED ${metrics.date_key}` : 'WAITING FOR INPUT'}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {[
            { label: 'Profile Visits', val: metrics?.profile_visits || 0, icon: Eye, max: 1000 },
            { label: 'Qualified Followers', val: metrics?.qualified_followers || 0, icon: UserCheck, max: 100 },
            { label: 'DMs Started', val: metrics?.dms_started || 0, icon: MessageSquare, max: 50 },
            { label: 'Appointments Booked', val: metrics?.appointments_booked || 0, icon: CalendarCheck, max: 10 },
            { label: 'Cash Collected', val: metrics?.cash_collected || 0, icon: Coins, isCash: true, max: 50000 },
          ].map(row => (
            <div key={row.label} style={{ display: 'grid', gridTemplateColumns: '220px 1fr 140px', alignItems: 'center', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <row.icon size={14} color="var(--grey2)" />
                <span style={{ fontSize: 13, color: 'var(--white)', fontWeight: 500 }}>{row.label}</span>
              </div>
              <div style={{ height: 3, background: 'var(--bg3)', borderRadius: 10 }}>
                <div style={{
                  width: `${Math.min((row.val / row.max) * 100, 100)}%`,
                  height: '100%', background: 'var(--teal)', borderRadius: 10, transition: 'width 1.2s ease'
                }} />
              </div>
              <div style={{ textAlign: 'right', fontFamily: 'DM Mono', fontSize: 15, fontWeight: 700, color: 'var(--teal)' }}>
                {row.isCash ? formatRand(row.val) : row.val}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginTop: 36, borderTop: '1px solid var(--border2)', paddingTop: 28 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--teal)', fontFamily: 'Playfair Display' }}>
              {metrics?.appointments_booked > 0 ? '81%' : '—'}
            </div>
            <div style={{ fontSize: 9, color: 'var(--grey)', letterSpacing: '0.15em', marginTop: 6, fontFamily: 'DM Mono', textTransform: 'uppercase' }}>Show-up Rate</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--teal)', fontFamily: 'Playfair Display' }}>{profileConv}%</div>
            <div style={{ fontSize: 9, color: 'var(--grey)', letterSpacing: '0.15em', marginTop: 6, fontFamily: 'DM Mono', textTransform: 'uppercase' }}>Profile Conversion</div>
          </div>
        </div>
        {metrics?.notes && (
          <div style={{ marginTop: 20, padding: '12px 16px', background: 'var(--bg3)', borderRadius: 8, border: '1px solid var(--border2)' }}>
            <div style={{ fontFamily: 'DM Mono', fontSize: 9, color: 'var(--grey)', marginBottom: 6, textTransform: 'uppercase' }}>Manager Note</div>
            <div style={{ fontSize: 13, color: 'var(--white)', lineHeight: 1.5 }}>{metrics.notes}</div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>

        {/* SPRINT HISTORY */}
        <div className="card">
          <div style={{ fontFamily: 'DM Mono', fontSize: 9, color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 16 }}>Sprint History</div>
          {completedSprints.length === 0 ? (
            <div style={{ color: 'var(--grey)', fontSize: 13, padding: '12px 0', fontFamily: 'DM Mono' }}>No completed sprints yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 80px 80px', gap: 8, padding: '0 0 8px', borderBottom: '1px solid var(--border2)', marginBottom: 6 }}>
                {['Cycle', 'Launched', 'Leads', 'Booked'].map(h => (
                  <div key={h} style={{ fontFamily: 'DM Mono', fontSize: 9, color: 'var(--grey2)', textTransform: 'uppercase' }}>{h}</div>
                ))}
              </div>
              {completedSprints.slice(0, 6).map((s, idx) => (
                <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 80px 80px', gap: 8, padding: '10px 0', borderBottom: '1px solid var(--border2)', alignItems: 'center' }}>
                  <div style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--teal)' }}>#{s.sprint_number || completedSprints.length - idx}</div>
                  <div style={{ fontSize: 12, color: 'var(--grey)' }}>{formatDate(s.start_date)}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{s.leads_generated || 0}</div>
                  <div style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>{s.bookings_from_sprint || 0}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ACCOUNT MANAGER */}
        <div className="card">
          <div style={{ fontFamily: 'DM Mono', fontSize: 9, color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 16 }}>Account Manager</div>
          {manager ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--bg3)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--teal)', fontSize: 18, flexShrink: 0 }}>
                  {manager.full_name?.charAt(0) || 'M'}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{manager.full_name}</div>
                  <div style={{ fontSize: 10, color: 'var(--grey)', textTransform: 'uppercase', fontFamily: 'DM Mono' }}>Delivery Specialist</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
                <a href={`tel:${manager.phone || ''}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 12, textDecoration: 'none', color: 'var(--grey)', padding: '10px 0', border: '1px solid var(--border2)', borderRadius: 6 }}>
                  <Phone size={13} /> Call
                </a>
                <a href={`https://wa.me/${(manager.phone || '').replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 12, textDecoration: 'none', color: 'var(--grey)', padding: '10px 0', border: '1px solid var(--border2)', borderRadius: 6 }}>
                  <MessageCircle size={13} /> WhatsApp
                </a>
              </div>
              <div style={{ borderTop: '1px solid var(--border2)', paddingTop: 16 }}>
                <div style={{ fontSize: 10, color: 'var(--grey)', fontFamily: 'DM Mono', marginBottom: 10, textTransform: 'uppercase' }}>Rate Your Experience</div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} size={16}
                      fill={s <= review.rating ? 'var(--teal)' : 'none'}
                      stroke={s <= review.rating ? 'var(--teal)' : 'var(--grey2)'}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setReview({ ...review, rating: s })}
                    />
                  ))}
                </div>
                <textarea
                  className="input"
                  placeholder="Leave feedback..."
                  value={review.comment}
                  onChange={e => setReview({ ...review, comment: e.target.value })}
                  style={{ fontSize: 12, minHeight: 70, marginBottom: 10, width: '100%', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 6, padding: 8, color: 'white', resize: 'vertical', boxSizing: 'border-box' }}
                />
                <button onClick={submitReview} disabled={submitting} className="btn-primary" style={{ width: '100%', fontSize: 12, opacity: submitting ? 0.5 : 1 }}>
                  {submitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--grey)', fontSize: 12, padding: '20px 0', fontFamily: 'DM Mono' }}>ASSIGNING MANAGER...</div>
          )}
        </div>
      </div>

      {/* CONTRACT DETAILS */}
      <div className="card">
        <div style={{ fontFamily: 'DM Mono', fontSize: 9, color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 16 }}>Contract Details</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {[
            { label: 'Monthly Retainer', val: formatRand(client?.monthly_retainer || 0) },
            { label: 'Monthly Ad Spend', val: formatRand(client?.monthly_ad_spend || 0) },
            { label: 'Contract Start', val: client?.contract_start_date ? formatDate(client.contract_start_date) : '—' },
            { label: 'Service Tier', val: tierLabel },
          ].map(item => (
            <div key={item.label}>
              <div style={{ fontFamily: 'DM Mono', fontSize: 9, color: 'var(--grey)', textTransform: 'uppercase', marginBottom: 6 }}>{item.label}</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{item.val}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
