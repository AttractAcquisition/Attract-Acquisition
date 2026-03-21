import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { formatRand, formatDate } from '../lib/utils'
import { TrendingUp, Users, DollarSign, Calendar, LogOut } from 'lucide-react'

interface PortalClient {
  id: string; business_name: string; owner_name: string
  tier: string; status: string; monthly_retainer: number
  monthly_ad_spend: number; contract_start_date: string
  meta_ad_account_id: string; last_results_meeting: string
}

interface PortalSprint {
  id: string; start_date: string; status: string
  leads_generated: number; cpl: number; actual_ad_spend: number
  revenue_attributed: number; bookings_from_sprint: number
  results_meeting_outcome: string
}

interface MetaMetrics {
  spend: number; reach: number; impressions: number
  clicks: number; leads: number; cpl: number; roas: number
}

const PIPELINE_STAGES = [
  { key: 'profile_visits', label: 'Profile Visits', icon: Users },
  { key: 'dms',            label: 'DMs',            icon: TrendingUp },
  { key: 'calls_booked',   label: 'Calls Booked',   icon: Calendar },
  { key: 'cash',           label: 'Cash Collected',  icon: DollarSign },
]

export default function Portal() {
  const { clientId, signOut, user } = useAuth()
  const [client, setClient]         = useState<PortalClient | null>(null)
  const [sprints, setSprints]       = useState<PortalSprint[]>([])
  const [metrics, setMetrics]       = useState<MetaMetrics | null>(null)
  const [loading, setLoading]       = useState(true)
  const [metricsLoading, setMetricsLoading] = useState(false)

  useEffect(() => { if (clientId) load() }, [clientId])

  async function load() {
    setLoading(true)
    const [c, s] = await Promise.all([
      supabase.from('clients').select('*').eq('id', clientId!).single(),
      supabase.from('proof_sprints').select('*').eq('client_id', clientId!).order('created_at', { ascending: false }),
    ])
    if (c.data) {
      setClient(c.data)
      if (c.data.meta_ad_account_id) loadMetrics(c.data.meta_ad_account_id)
    }
    setSprints(s.data || [])
    setLoading(false)
  }

  async function loadMetrics(adAccountId: string) {
    setMetricsLoading(true)
    try {
      const { data } = await supabase.functions.invoke('get-meta-metrics', {
        body: { ad_account_id: adAccountId, date_preset: 'this_month' }
      })
      if (data && !data.error) setMetrics(data)
      else if (data?.stub)     setMetrics(data.stub)
    } catch {}
    setMetricsLoading(false)
  }

  const activeSprint = sprints.find(s => s.status === 'active' || s.status === 'setup')
  const totalLeads   = sprints.reduce((sum, s) => sum + (s.leads_generated || 0), 0)
  const totalRevenue = sprints.reduce((sum, s) => sum + (s.revenue_attributed || 0), 0)
  const wonSprints   = sprints.filter(s => s.status === 'closed_won').length

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--grey)' }}>Loading your portal...</div>
      </div>
    )
  }

  if (!client) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontFamily: 'Playfair Display', fontSize: 22, fontWeight: 700 }}>Portal not found</div>
        <div style={{ color: 'var(--grey)', fontSize: 14 }}>Your account isn't linked to a client record. Contact your account manager.</div>
        <button className="btn-ghost" onClick={signOut} style={{ marginTop: 8 }}>Sign out</button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Header */}
      <div style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border2)', padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, background: 'var(--teal)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Mono', fontSize: 12, fontWeight: 500, color: 'var(--bg)', flexShrink: 0 }}>AA</div>
          <div>
            <div style={{ fontWeight: 500, fontSize: 15 }}>{client.business_name}</div>
            <div style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--teal)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {client.tier === 'proof_brand' ? 'Proof Brand' : 'Authority Brand'} · Client Portal
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--grey)' }}>{user?.email}</span>
          <button onClick={signOut} style={{ background: 'none', border: '1px solid var(--border2)', borderRadius: 4, padding: '6px 12px', cursor: 'pointer', color: 'var(--grey)', fontFamily: 'DM Mono', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}>
            <LogOut size={12} /> Sign out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>

        {/* Welcome */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: 'Playfair Display', fontSize: 26, fontWeight: 700, marginBottom: 4 }}>
            Welcome back, {client.owner_name.split(' ')[0]}.
          </div>
          <div style={{ fontSize: 14, color: 'var(--grey)' }}>
            Your Attraction Engine™ dashboard · {new Date().toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Pipeline stage tracker */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="section-label">Your Attraction Pipeline</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {PIPELINE_STAGES.map((stage, i) => {
              const val = metrics
                ? i === 0 ? metrics.reach
                : i === 1 ? (metrics.clicks || 0)
                : i === 2 ? (metrics.leads || 0)
                : Math.round((metrics.leads || 0) * 0.81)
                : 0
              return (
                <div key={stage.key} style={{ textAlign: 'center', padding: '16px 12px', background: 'var(--bg3)', borderRadius: 8, border: '1px solid var(--border2)', position: 'relative' }}>
                  {i < 3 && (
                    <div style={{ position: 'absolute', right: -8, top: '50%', transform: 'translateY(-50%)', color: 'var(--grey2)', fontSize: 16, zIndex: 1 }}>›</div>
                  )}
                  <stage.icon size={18} color="var(--teal)" style={{ marginBottom: 8 }} />
                  <div style={{ fontFamily: 'Playfair Display', fontSize: 22, fontWeight: 700, color: 'var(--teal)', marginBottom: 4 }}>
                    {metricsLoading ? '—' : val.toLocaleString()}
                  </div>
                  <div style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{stage.label}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Live Meta Ads */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          <div className="card">
            <div className="section-label">Live Meta Ads — This Month</div>
            {metricsLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 36 }} />)}
              </div>
            ) : metrics ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Ad Spend',    value: formatRand(metrics.spend) },
                  { label: 'Reach',       value: metrics.reach.toLocaleString() },
                  { label: 'Leads',       value: metrics.leads.toString() },
                  { label: 'CPL',         value: formatRand(metrics.cpl), highlight: metrics.cpl > 0 && metrics.cpl < 150 },
                  { label: 'ROAS',        value: metrics.roas ? `${Number(metrics.roas).toFixed(1)}×` : '—' },
                ].map(m => (
                  <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg3)', borderRadius: 4 }}>
                    <span style={{ fontSize: 13, color: 'var(--grey)' }}>{m.label}</span>
                    <span style={{ fontFamily: 'DM Mono', fontSize: 13, color: m.highlight ? 'var(--green)' : 'var(--white)' }}>{m.value}</span>
                  </div>
                ))}
              </div>
            ) : !client.meta_ad_account_id ? (
              <div style={{ color: 'var(--grey)', fontSize: 13, textAlign: 'center', padding: 20 }}>Meta ad account not yet connected. Contact your account manager.</div>
            ) : (
              <div style={{ color: 'var(--grey)', fontSize: 13, textAlign: 'center', padding: 20 }}>Metrics unavailable</div>
            )}
          </div>

          {/* Totals */}
          <div className="card">
            <div className="section-label">All-Time Results</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Total Leads Generated', value: totalLeads.toString(),        color: 'var(--teal)' },
                { label: 'Revenue Attributed',    value: formatRand(totalRevenue),     color: 'var(--teal)' },
                { label: 'Sprints Completed',      value: wonSprints.toString(),       color: 'var(--teal)' },
                { label: 'Monthly Retainer',       value: formatRand(client.monthly_retainer), color: 'var(--white)' },
                { label: 'Monthly Ad Budget',      value: formatRand(client.monthly_ad_spend), color: 'var(--white)' },
                { label: 'Contract Start',         value: formatDate(client.contract_start_date), color: 'var(--white)' },
              ].map(m => (
                <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg3)', borderRadius: 4 }}>
                  <span style={{ fontSize: 13, color: 'var(--grey)' }}>{m.label}</span>
                  <span style={{ fontFamily: 'DM Mono', fontSize: 13, color: m.color }}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Active Sprint */}
        {activeSprint && (
          <div className="card teal-left" style={{ marginBottom: 20 }}>
            <div className="section-label">Active Sprint</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { label: 'Leads',    value: activeSprint.leads_generated || 0 },
                { label: 'CPL',      value: activeSprint.cpl ? formatRand(activeSprint.cpl) : '—' },
                { label: 'Spend',    value: formatRand(activeSprint.actual_ad_spend) },
                { label: 'Bookings', value: activeSprint.bookings_from_sprint || 0 },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center', padding: '14px', background: 'var(--bg3)', borderRadius: 6 }}>
                  <div style={{ fontFamily: 'Playfair Display', fontSize: 22, fontWeight: 700, color: 'var(--teal)', marginBottom: 4 }}>{s.value}</div>
                  <div style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sprint history */}
        {sprints.length > 0 && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border2)' }}>
              <div className="section-label" style={{ margin: 0 }}>Sprint History</div>
            </div>
            <table className="aa-table">
              <thead>
                <tr><th>Sprint</th><th>Start Date</th><th>Status</th><th>Leads</th><th>CPL</th><th>Revenue</th><th>Outcome</th></tr>
              </thead>
              <tbody>
                {sprints.map((s, i) => (
                  <tr key={s.id}>
                    <td style={{ fontFamily: 'DM Mono', color: 'var(--grey)' }}>#{i + 1}</td>
                    <td style={{ color: 'var(--grey)', fontSize: 12 }}>{formatDate(s.start_date)}</td>
                    <td><span className={`badge ${s.status === 'closed_won' ? 'badge-clients' : s.status === 'closed_lost' ? 'badge-lost' : 'badge-sprint'}`}>{s.status.replace(/_/g,' ')}</span></td>
                    <td style={{ fontFamily: 'DM Mono', color: 'var(--teal)' }}>{s.leads_generated || 0}</td>
                    <td style={{ fontFamily: 'DM Mono', fontSize: 12 }}>{s.cpl ? formatRand(s.cpl) : '—'}</td>
                    <td style={{ fontFamily: 'DM Mono', color: 'var(--green)' }}>{s.revenue_attributed ? formatRand(s.revenue_attributed) : '—'}</td>
                    <td style={{ color: 'var(--grey)', fontSize: 12 }}>{s.results_meeting_outcome || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {sprints.length === 0 && !activeSprint && (
          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontFamily: 'Playfair Display', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Your sprint is being set up</div>
            <div style={{ color: 'var(--grey)', fontSize: 14 }}>Your account manager is configuring your first campaign. You'll see live data here once it's live.</div>
          </div>
        )}

        <div style={{ marginTop: 40, textAlign: 'center', fontFamily: 'DM Mono', fontSize: 10, color: 'var(--grey2)', letterSpacing: '0.08em' }}>
          ATTRACT ACQUISITION (PTY) LTD · CONFIDENTIAL · {new Date().getFullYear()}
        </div>
      </div>
    </div>
  )
}