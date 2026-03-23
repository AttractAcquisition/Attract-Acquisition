import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { LogOut } from 'lucide-react'

interface PortalClient {
  id: string
  business_name: string
  owner_name: string
  tier: string
  status: string
  monthly_retainer: number
  monthly_ad_spend: number
  contract_start_date: string
  meta_ad_account_id: string
  last_results_meeting: string
}

interface PortalSprint {
  id: string
  start_date: string
  status: string
  leads_generated: number
  cpl: number
  actual_ad_spend: number
  revenue_attributed: number
  bookings_from_sprint: number
  results_meeting_outcome: string
}

export default function Portal() {
  const { clientId, signOut, user } = useAuth()
  const [client, setClient] = useState<PortalClient | null>(null)
  const [sprints, setSprints] = useState<PortalSprint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (clientId) load()
  }, [clientId])

  async function load() {
    setLoading(true)
    const [c, s] = await Promise.all([
      supabase.from('clients').select('*').eq('id', clientId!).single(),
      supabase.from('proof_sprints').select('*').eq('client_id', clientId!).order('created_at', { ascending: false }),
    ])

    if (c.data) {
      setClient({
        id: c.data.id,
        business_name: c.data.business_name || '',
        owner_name: c.data.owner_name || '',
        tier: c.data.tier || '',
        status: c.data.status || '',
        monthly_retainer: c.data.monthly_retainer || 0,
        monthly_ad_spend: c.data.monthly_ad_spend || 0,
        contract_start_date: c.data.contract_start_date || '',
        meta_ad_account_id: c.data.meta_ad_account_id || '',
        last_results_meeting: c.data.last_results_meeting || ''
      })
    }

    const normalizedSprints: PortalSprint[] = (s.data || []).map((sp: any) => ({
      id: sp.id,
      start_date: sp.start_date || '',
      status: sp.status || '',
      leads_generated: sp.leads_generated || 0,
      cpl: sp.cpl || 0,
      actual_ad_spend: sp.actual_ad_spend || 0,
      revenue_attributed: sp.revenue_attributed || 0,
      bookings_from_sprint: sp.bookings_from_sprint || 0,
      results_meeting_outcome: sp.results_meeting_outcome || ''
    }))
    setSprints(normalizedSprints)

    setLoading(false)
  }

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
          <div style={{ width: 32, height: 32, background: 'var(--teal)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Mono', fontSize: 12, fontWeight: 500, color: 'var(--bg)', flexShrink: 0 }}>
            AA
          </div>
          <div>
            <div style={{ fontWeight: 500, fontSize: 15 }}>{client.business_name}</div>
            <div style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--teal)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {client.tier === 'proof_brand' ? 'Proof Brand' : 'Authority Brand'} · Client Portal
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--grey)' }}>{user?.email}</span>
          <button
            onClick={signOut}
            style={{
              background: 'none',
              border: '1px solid var(--border2)',
              borderRadius: 4,
              padding: '6px 12px',
              cursor: 'pointer',
              color: 'var(--grey)',
              fontFamily: 'DM Mono',
              fontSize: 11,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <LogOut size={12} /> Sign out
          </button>
        </div>
      </div>

      {/* Portal content – add your dashboard here */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
        {/* Placeholder for future dashboard content */}
        <div style={{ color: 'var(--grey)', fontFamily: 'DM Mono', fontSize: 13 }}>
          Welcome back. Your client portal dashboard is under construction.
          <br /><br />
          Current sprints: {sprints.length}
        </div>
      </div>
    </div>
  )
}