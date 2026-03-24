import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../lib/auth'
import { formatDate } from '../../../lib/utils'
import { Zap, TrendingUp, Calendar } from 'lucide-react'

export default function ClientView() {
  const { metadata_id }     = useAuth()
  const [sprints, setSprints]     = useState<any[]>([])
  const [client, setClient]       = useState<any>(null)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    if (!metadata_id) return
    async function load() {
      const [c, s] = await Promise.all([
        supabase.from('clients').select('*').eq('id', metadata_id!).single(),
        supabase.from('proof_sprints').select('*').eq('client_id', metadata_id!).order('created_at', { ascending: false }),
      ])
      setClient(c.data || null)
      setSprints(s.data || [])
      setLoading(false)
    }
    load()
  }, [metadata_id])

  const activeSprints = sprints.filter(s => s.status === 'active')
  const totalLeads    = sprints.reduce((sum, s) => sum + (s.leads_generated || 0), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {client && (
        <div style={{ padding: '14px 18px', background: 'var(--bg2)', borderRadius: 8, border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, background: 'var(--teal)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Mono', fontWeight: 500, fontSize: 14, color: 'var(--bg)', flexShrink: 0 }}>
            {client.business_name?.slice(0,2).toUpperCase() || 'AA'}
          </div>
          <div>
            <div style={{ fontFamily: 'Playfair Display', fontSize: 18, fontWeight: 700 }}>{client.business_name}</div>
            <div style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--teal)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {client.tier === 'proof_brand' ? 'Proof Brand' : 'Authority Brand'} · Active Client
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { label: 'Active Sprints',  value: activeSprints.length, icon: Zap,        sub: 'currently running' },
          { label: 'Total Leads',     value: totalLeads,            icon: TrendingUp, sub: 'across all sprints' },
          { label: 'Sprint History',  value: sprints.length,        icon: Calendar,   sub: 'completed cycles' },
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

      <div className="card">
        <div className="section-label">Proof Sprint History</div>
        {loading
          ? [1,2].map(i => <div key={i} className="skeleton" style={{ height: 64, marginBottom: 10 }} />)
          : sprints.length === 0
            ? (
              <div className="empty-state">
                <h3>No sprints yet</h3>
                <p>Your first proof sprint will appear here once it's launched.</p>
              </div>
            )
            : sprints.map(s => {
              const cpl      = s.cpl || 0
              const cplColor = cpl === 0 ? 'var(--grey)' : cpl < 150 ? 'var(--green)' : cpl < 300 ? 'var(--amber)' : 'var(--red)'
              return (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border2)' }}>
                  <div>
                    <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--grey)', textTransform: 'uppercase', marginBottom: 4 }}>
                      Sprint {s.sprint_number || 1} · {formatDate(s.start_date)}
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                      <span><span style={{ color: 'var(--grey)' }}>Leads: </span><span style={{ color: 'var(--white)' }}>{s.leads_generated || 0}</span></span>
                      <span><span style={{ color: 'var(--grey)' }}>CPL: </span><span style={{ color: cplColor, fontFamily: 'DM Mono' }}>{cpl > 0 ? `R${cpl.toFixed(0)}` : '—'}</span></span>
                      <span><span style={{ color: 'var(--grey)' }}>Spend: </span><span>R{(s.actual_ad_spend || 0).toFixed(0)}</span></span>
                    </div>
                  </div>
                  <span className={`badge ${s.status === 'active' ? 'badge-sprint' : s.status === 'closed_won' ? 'badge-won' : 'badge-new'}`}>
                    {s.status}
                  </span>
                </div>
              )
            })
        }
      </div>
    </div>
  )
}
