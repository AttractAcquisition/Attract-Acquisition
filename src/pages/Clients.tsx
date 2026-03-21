import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Client } from '../lib/supabase'
import { formatRand, formatDate } from '../lib/utils'
import { Plus, X, AlertTriangle, TrendingUp, ChevronRight } from 'lucide-react'
import { useToast } from '../lib/toast'

const TIERS = [
  { value: 'proof_brand',     label: 'Proof Brand',     setup: 18000, retainer: 10000 },
  { value: 'authority_brand', label: 'Authority Brand', setup: 25000, retainer: 17000 },
]

export default function Clients() {
  const [clients, setClients]     = useState<Client[]>([])
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState<Client | null>(null)
  const [showNew, setShowNew]     = useState(false)
  const [tab, setTab]             = useState<'overview'|'sprints'|'notes'>('overview')
  const { toast }                 = useToast()

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false })
    setClients(data || [])
    setLoading(false)
  }

  async function createClient(form: any) {
    const { data, error } = await supabase.from('clients').insert({ ...form, status: 'active' }).select().single()
    if (error || !data) { toast('Failed to create client', 'error'); return }
    setClients(prev => [data, ...prev])
    setShowNew(false)
    toast('Client added ✓')
  }

  async function updateClient(id: string, updates: Partial<Client>) {
    const { data, error } = await supabase.from('clients').update(updates).eq('id', id).select().single()
    if (error || !data) { toast('Update failed', 'error'); return }
    setClients(prev => prev.map(c => c.id === id ? data : c))
    setSelected(data)
    toast('Updated ✓')
  }

  async function toggleFlag(id: string, field: 'churn_risk_flag' | 'upsell_ready_flag', current: boolean) {
    await updateClient(id, { [field]: !current })
  }

  const active   = clients.filter(c => c.status === 'active')
  const mrr      = active.reduce((sum, c) => sum + (c.monthly_retainer || 0), 0)
  const churnRisk = active.filter(c => c.churn_risk_flag).length
  const upsellReady = active.filter(c => c.upsell_ready_flag).length

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Active Clients',  value: active.length,        sub: 'on retainer' },
          { label: 'Monthly MRR',     value: formatRand(mrr),      sub: 'combined retainers' },
          { label: 'Churn Risk',      value: churnRisk,            sub: 'needs attention', color: churnRisk > 0 ? 'var(--red)' : undefined },
          { label: 'Upsell Ready',    value: upsellReady,          sub: 'authority brand candidates', color: upsellReady > 0 ? 'var(--amber)' : undefined },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="label">{s.label}</div>
            <div className="stat-num" style={{ fontSize: 26, marginTop: 8, color: s.color || 'var(--teal)' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--grey)', marginTop: 4, fontFamily: 'DM Mono' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Client cards grid */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="section-label" style={{ margin: 0 }}>Active Accounts</div>
        <button className="btn-primary" onClick={() => setShowNew(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={12} /> Add Client
        </button>
      </div>

      {loading
        ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 160 }} />)}
          </div>
        : clients.length === 0
          ? (
            <div className="empty-state">
              <h3>No clients yet</h3>
              <p>Add your first client manually or convert a closed-won prospect from the Prospects page.</p>
              <button className="btn-primary" onClick={() => setShowNew(true)}>Add First Client</button>
            </div>
          )
          : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {clients.map(c => (
                <div key={c.id} className="card"
                  onClick={() => { setSelected(c); setTab('overview') }}
                  style={{ cursor: 'pointer', borderTop: `2px solid ${c.churn_risk_flag ? 'var(--red)' : c.upsell_ready_flag ? 'var(--amber)' : 'var(--teal)'}`, transition: 'opacity 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 2 }}>{c.business_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--grey)' }}>{c.owner_name}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {c.churn_risk_flag && <AlertTriangle size={14} color="var(--red)" />}
                      {c.upsell_ready_flag && <TrendingUp size={14} color="var(--amber)" />}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {c.tier === 'proof_brand' ? 'Proof Brand' : 'Authority Brand'}
                    </span>
                    <span className={`badge ${c.status === 'active' ? 'badge-clients' : c.status === 'churned' ? 'badge-lost' : 'badge-new'}`}>
                      {c.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--border2)' }}>
                    <div>
                      <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--grey)' }}>Retainer</div>
                      <div style={{ fontFamily: 'DM Mono', fontSize: 14, color: 'var(--teal)' }}>{formatRand(c.monthly_retainer)}/mo</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--grey)' }}>Since</div>
                      <div style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--white)' }}>{formatDate(c.contract_start_date || c.created_at)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
      }

      {/* Client detail slide-over */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', justifyContent: 'flex-end' }}>
          <div onClick={() => setSelected(null)} style={{ flex: 1, background: 'rgba(0,0,0,0.5)' }} />
          <div style={{ width: 540, background: 'var(--bg2)', borderLeft: '1px solid var(--border2)', overflowY: 'auto', padding: 28 }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: 'Playfair Display', fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{selected.business_name}</div>
                <div style={{ fontSize: 13, color: 'var(--grey)' }}>{selected.owner_name}</div>
                {selected.whatsapp && <div style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--teal)', marginTop: 2 }}>{selected.whatsapp}</div>}
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--grey)', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            {/* Flags */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <button onClick={() => toggleFlag(selected.id, 'churn_risk_flag', !!selected.churn_risk_flag)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontFamily: 'DM Mono', border: `1px solid ${selected.churn_risk_flag ? 'var(--red)' : 'var(--border2)'}`, background: selected.churn_risk_flag ? 'rgba(226,75,74,0.1)' : 'transparent', color: selected.churn_risk_flag ? 'var(--red)' : 'var(--grey)' }}>
                <AlertTriangle size={12} /> Churn Risk
              </button>
              <button onClick={() => toggleFlag(selected.id, 'upsell_ready_flag', !!selected.upsell_ready_flag)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontFamily: 'DM Mono', border: `1px solid ${selected.upsell_ready_flag ? 'var(--amber)' : 'var(--border2)'}`, background: selected.upsell_ready_flag ? 'rgba(239,159,39,0.1)' : 'transparent', color: selected.upsell_ready_flag ? 'var(--amber)' : 'var(--grey)' }}>
                <TrendingUp size={12} /> Upsell Ready
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border2)' }}>
              {(['overview','sprints','notes'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Mono', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '8px 14px', color: tab === t ? 'var(--teal)' : 'var(--grey)', borderBottom: tab === t ? '2px solid var(--teal)' : '2px solid transparent', marginBottom: -1 }}>
                  {t}
                </button>
              ))}
            </div>

            {tab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { label: 'Tier', value: selected.tier === 'proof_brand' ? 'Proof Brand' : 'Authority Brand' },
                    { label: 'Status', value: selected.status },
                    { label: 'Setup Fee', value: formatRand(selected.setup_fee) },
                    { label: 'Monthly Retainer', value: formatRand(selected.monthly_retainer) },
                    { label: 'Monthly Ad Spend', value: formatRand(selected.monthly_ad_spend) },
                    { label: 'Contract Start', value: formatDate(selected.contract_start_date) },
                    { label: 'Last Results Meeting', value: formatDate(selected.last_results_meeting) },
                    { label: 'Account Manager', value: selected.account_manager || 'Principal' },
                  ].map(f => (
                    <div key={f.label} style={{ background: 'var(--bg3)', borderRadius: 4, padding: '10px 12px' }}>
                      <div style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{f.label}</div>
                      <div style={{ fontSize: 13, color: 'var(--white)' }}>{f.value || '—'}</div>
                    </div>
                  ))}
                </div>

                {selected.meta_ad_account_id && (
                  <div style={{ background: 'var(--bg3)', borderRadius: 4, padding: '10px 12px' }}>
                    <div style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Meta Ad Account ID</div>
                    <div style={{ fontSize: 13, color: 'var(--teal)', fontFamily: 'DM Mono' }}>{selected.meta_ad_account_id}</div>
                  </div>
                )}

                <div>
                  <div className="label">Update Status</div>
                  <select className="input" value={selected.status}
                    onChange={e => updateClient(selected.id, { status: e.target.value as any })}>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="churned">Churned</option>
                    <option value="upsold">Upsold</option>
                  </select>
                </div>

                <div>
                  <div className="label">Meta Ad Account ID</div>
                  <input className="input" placeholder="act_123456789"
                    defaultValue={selected.meta_ad_account_id || ''}
                    onBlur={e => { if (e.target.value !== selected.meta_ad_account_id) updateClient(selected.id, { meta_ad_account_id: e.target.value }) }} />
                </div>

                <div>
                  <div className="label">Last Results Meeting Date</div>
                  <input className="input" type="date"
                    defaultValue={selected.last_results_meeting || ''}
                    onBlur={e => updateClient(selected.id, { last_results_meeting: e.target.value })} />
                </div>
              </div>
            )}

            {tab === 'sprints' && <ClientSprints clientId={selected.id} />}

            {tab === 'notes' && (
              <div>
                <div className="label">Account Notes</div>
                <textarea className="input" rows={12}
                  placeholder="Client preferences, key decisions, relationship notes, delivery context..."
                  defaultValue={selected.notes || ''}
                  onBlur={e => updateClient(selected.id, { notes: e.target.value })}
                  style={{ resize: 'vertical', lineHeight: 1.7 }} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Client Modal */}
      {showNew && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => setShowNew(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
          <div style={{ position: 'relative', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 8, padding: 28, width: 480, zIndex: 1, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontFamily: 'Playfair Display', fontSize: 20, fontWeight: 700 }}>Add Client</div>
              <button onClick={() => setShowNew(false)} style={{ background: 'none', border: 'none', color: 'var(--grey)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <NewClientForm onSave={createClient} onCancel={() => setShowNew(false)} />
          </div>
        </div>
      )}
    </div>
  )
}

function ClientSprints({ clientId }: { clientId: string }) {
  const [sprints, setSprints] = useState<any[]>([])
  useEffect(() => {
    supabase.from('proof_sprints').select('*').eq('client_id', clientId).order('created_at', { ascending: false }).then(({ data }) => setSprints(data || []))
  }, [clientId])

  if (sprints.length === 0) return <div style={{ color: 'var(--grey)', fontSize: 13, textAlign: 'center', padding: 24 }}>No sprints for this client yet.</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {sprints.map(s => {
        const cpl = s.cpl || 0
        const cplColor = cpl === 0 ? 'var(--grey)' : cpl < 150 ? 'var(--green)' : cpl < 300 ? 'var(--amber)' : 'var(--red)'
        return (
          <div key={s.id} style={{ background: 'var(--bg3)', borderRadius: 6, padding: '12px 14px', border: '1px solid var(--border2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--grey)', textTransform: 'uppercase' }}>Sprint {s.sprint_number || 1}</span>
              <span className={`badge ${s.status === 'closed_won' ? 'badge-clients' : s.status === 'closed_lost' ? 'badge-lost' : 'badge-new'}`}>{s.status}</span>
            </div>
            <div style={{ display: 'flex', gap: 20, fontSize: 13 }}>
              <div><span style={{ color: 'var(--grey)' }}>Leads: </span><span style={{ color: 'var(--white)' }}>{s.leads_generated || 0}</span></div>
              <div><span style={{ color: 'var(--grey)' }}>CPL: </span><span style={{ color: cplColor, fontFamily: 'DM Mono' }}>{cpl > 0 ? `R${cpl.toFixed(0)}` : '—'}</span></div>
              <div><span style={{ color: 'var(--grey)' }}>Spend: </span><span style={{ color: 'var(--white)' }}>R{(s.actual_ad_spend || 0).toFixed(0)}</span></div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function NewClientForm({ onSave, onCancel }: { onSave: (f: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    business_name: '', owner_name: '', phone: '', whatsapp: '', email: '',
    tier: 'proof_brand', setup_fee: 18000, monthly_retainer: 10000,
    monthly_ad_spend: 5000, contract_start_date: new Date().toISOString().split('T')[0],
    meta_ad_account_id: '', account_manager: 'principal',
  })

  function onTierChange(tier: string) {
    const t = TIERS.find(x => x.value === tier)!
    setForm(prev => ({ ...prev, tier, setup_fee: t.setup, monthly_retainer: t.retainer }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
      {[
        { label: 'Business Name *', field: 'business_name', placeholder: 'e.g. Cape Town Auto Detailing' },
        { label: 'Owner Name *',    field: 'owner_name',    placeholder: 'e.g. John Smith' },
        { label: 'WhatsApp',        field: 'whatsapp',      placeholder: '+27 82 000 0000' },
        { label: 'Email',           field: 'email',         placeholder: 'owner@business.co.za' },
      ].map(f => (
        <div key={f.field}>
          <div className="label">{f.label}</div>
          <input className="input" placeholder={f.placeholder} value={(form as any)[f.field]}
            onChange={e => setForm(prev => ({ ...prev, [f.field]: e.target.value }))} />
        </div>
      ))}

      <div>
        <div className="label">Tier</div>
        <select className="input" value={form.tier} onChange={e => onTierChange(e.target.value)}>
          {TIERS.map(t => <option key={t.value} value={t.value}>{t.label} — R{t.setup.toLocaleString()} setup + R{t.retainer.toLocaleString()}/mo</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <div className="label">Setup Fee (R)</div>
          <input className="input" type="number" value={form.setup_fee} onChange={e => setForm(prev => ({ ...prev, setup_fee: Number(e.target.value) }))} />
        </div>
        <div>
          <div className="label">Monthly Retainer (R)</div>
          <input className="input" type="number" value={form.monthly_retainer} onChange={e => setForm(prev => ({ ...prev, monthly_retainer: Number(e.target.value) }))} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <div className="label">Monthly Ad Spend (R)</div>
          <input className="input" type="number" value={form.monthly_ad_spend} onChange={e => setForm(prev => ({ ...prev, monthly_ad_spend: Number(e.target.value) }))} />
        </div>
        <div>
          <div className="label">Contract Start</div>
          <input className="input" type="date" value={form.contract_start_date} onChange={e => setForm(prev => ({ ...prev, contract_start_date: e.target.value }))} />
        </div>
      </div>

      <div>
        <div className="label">Meta Ad Account ID</div>
        <input className="input" placeholder="act_123456789 (add later if unknown)" value={form.meta_ad_account_id}
          onChange={e => setForm(prev => ({ ...prev, meta_ad_account_id: e.target.value }))} />
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button className="btn-primary" onClick={() => onSave(form)} disabled={!form.business_name || !form.owner_name} style={{ flex: 1 }}>Add Client →</button>
        <button className="btn-ghost" onClick={onCancel} style={{ flex: 1 }}>Cancel</button>
      </div>
    </div>
  )
}