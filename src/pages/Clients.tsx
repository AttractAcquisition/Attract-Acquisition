import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Client, Prospect } from '../lib/supabase'
import { formatRand, formatDate } from '../lib/utils'
import { Plus, X, AlertTriangle, TrendingUp, Search } from 'lucide-react'
import { useToast } from '../lib/toast'

const TIERS = [
  { value: 'proof_brand',     label: 'Proof Brand',     setup: 18000, retainer: 10000 },
  { value: 'authority_brand', label: 'Authority Brand', setup: 25000, retainer: 17000 },
]

type SlideTab = 'overview' | 'sprints' | 'notes'

export default function Clients() {
  const [clients, setClients]     = useState<Client[]>([])
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState<Client | null>(null)
  const [slideTab, setSlideTab]   = useState<SlideTab>('overview')
  const [showNew, setShowNew]     = useState(false)
  const [importProspect, setImportProspect] = useState<Prospect | null>(null)
  const { toast }                 = useToast()
  const location                  = useLocation()

  useEffect(() => {
    load()
    // Handle "Convert to Client" navigation from Prospects
    if (location.state?.importProspect) {
      setImportProspect(location.state.importProspect)
      setShowNew(true)
    }
  }, [])

  async function load() {
    const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false })
    setClients(data || [])
    setLoading(false)
  }

  async function createClient(form: any, prospectId?: string) {
    const { data, error } = await supabase.from('clients').insert({ ...form, status: 'active', prospect_id: prospectId || null }).select().single()
    if (error || !data) { toast('Failed to create client', 'error'); return }
    if (prospectId) {
      await supabase.from('prospects').update({ status: 'closed_won' }).eq('id', prospectId)
    }
    setClients(prev => [data, ...prev])
    setShowNew(false)
    setImportProspect(null)
    toast('Client added ✓')
  }

  async function saveField(id: string, field: string, value: any) {
    const { data, error } = await supabase.from('clients').update({ [field]: value }).eq('id', id).select().single()
    if (error || !data) { toast(`Failed to save ${field}`, 'error'); return }
    setClients(prev => prev.map(c => c.id === id ? data : c))
    setSelected(data)
  }

  async function toggleFlag(id: string, field: 'churn_risk_flag' | 'upsell_ready_flag', current: boolean) {
    await saveField(id, field, !current)
  }

  const active      = clients.filter(c => c.status === 'active')
  const mrr         = active.reduce((sum, c) => sum + (c.monthly_retainer || 0), 0)
  const churnRisk   = active.filter(c => c.churn_risk_flag).length
  const upsellReady = active.filter(c => c.upsell_ready_flag).length

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Active Clients', value: active.length,   sub: 'on retainer' },
          { label: 'Monthly MRR',    value: formatRand(mrr), sub: 'combined retainers' },
          { label: 'Churn Risk',     value: churnRisk,       sub: 'needs attention',            color: churnRisk > 0 ? 'var(--red)' : undefined },
          { label: 'Upsell Ready',   value: upsellReady,     sub: 'authority brand candidates', color: upsellReady > 0 ? 'var(--amber)' : undefined },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="label">{s.label}</div>
            <div className="stat-num" style={{ fontSize: 26, marginTop: 8, color: s.color || 'var(--teal)' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--grey)', marginTop: 4, fontFamily: 'DM Mono' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="section-label" style={{ margin: 0 }}>Active Accounts</div>
        <button className="btn-primary" onClick={() => { setImportProspect(null); setShowNew(true) }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
              <p>Add your first client manually or convert a prospect using "Convert to Client" from the Prospects page.</p>
              <button className="btn-primary" onClick={() => setShowNew(true)}>Add First Client</button>
            </div>
          )
          : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {clients.map(c => (
                <div key={c.id} className="card"
                  onClick={() => { setSelected(c); setSlideTab('overview') }}
                  style={{ cursor: 'pointer', borderTop: `2px solid ${c.churn_risk_flag ? 'var(--red)' : c.upsell_ready_flag ? 'var(--amber)' : 'var(--teal)'}` }}
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
                      {c.tier === 'proof_brand' ? 'Proof Brand' : c.tier === 'authority_brand' ? 'Authority Brand' : '—'}
                    </span>
                    <span className={`badge ${c.status === 'active' ? 'badge-clients' : c.status === 'churned' ? 'badge-lost' : 'badge-new'}`}>{c.status}</span>
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

      {/* Client slide-over */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', justifyContent: 'flex-end' }}>
          <div onClick={() => setSelected(null)} style={{ flex: 1, background: 'rgba(0,0,0,0.5)' }} />
          <div style={{ width: 560, background: 'var(--bg2)', borderLeft: '1px solid var(--border2)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

            <div style={{ padding: '24px 28px 0', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: 'Playfair Display', fontSize: 20, fontWeight: 700, marginBottom: 2 }}>{selected.business_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--grey)' }}>{selected.owner_name}</div>
                  {selected.whatsapp && <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--teal)', marginTop: 2 }}>{selected.whatsapp}</div>}
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--grey)', cursor: 'pointer' }}><X size={18} /></button>
              </div>

              {/* Flags */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <button onClick={() => toggleFlag(selected.id, 'churn_risk_flag', !!selected.churn_risk_flag)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontFamily: 'DM Mono', border: `1px solid ${selected.churn_risk_flag ? 'var(--red)' : 'var(--border2)'}`, background: selected.churn_risk_flag ? 'rgba(226,75,74,0.1)' : 'transparent', color: selected.churn_risk_flag ? 'var(--red)' : 'var(--grey)' }}>
                  <AlertTriangle size={11} /> Churn Risk
                </button>
                <button onClick={() => toggleFlag(selected.id, 'upsell_ready_flag', !!selected.upsell_ready_flag)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontFamily: 'DM Mono', border: `1px solid ${selected.upsell_ready_flag ? 'var(--amber)' : 'var(--border2)'}`, background: selected.upsell_ready_flag ? 'rgba(239,159,39,0.1)' : 'transparent', color: selected.upsell_ready_flag ? 'var(--amber)' : 'var(--grey)' }}>
                  <TrendingUp size={11} /> Upsell Ready
                </button>
              </div>

              <div style={{ display: 'flex', borderBottom: '1px solid var(--border2)' }}>
                {(['overview','sprints','notes'] as SlideTab[]).map(t => (
                  <button key={t} onClick={() => setSlideTab(t)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Mono', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '8px 16px', color: slideTab === t ? 'var(--teal)' : 'var(--grey)', borderBottom: slideTab === t ? '2px solid var(--teal)' : '2px solid transparent', marginBottom: -1 }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>

              {slideTab === 'overview' && (
                <>
                  <div className="section-label">Contact</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <CF label="Business Name" field="business_name" value={selected.business_name} onSave={v => saveField(selected.id, 'business_name', v)} />
                    <CF label="Owner Name" field="owner_name" value={selected.owner_name} onSave={v => saveField(selected.id, 'owner_name', v)} />
                    <CF label="Phone" field="phone" value={selected.phone} onSave={v => saveField(selected.id, 'phone', v)} />
                    <CF label="WhatsApp" field="whatsapp" value={selected.whatsapp} onSave={v => saveField(selected.id, 'whatsapp', v)} />
                    <CF label="Email" field="email" value={selected.email} onSave={v => saveField(selected.id, 'email', v)} type="email" />
                  </div>

                  <div className="section-label" style={{ marginTop: 4 }}>Contract</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <div className="label">Tier</div>
                      <select className="input" value={selected.tier || ''}
                        onChange={e => saveField(selected.id, 'tier', e.target.value)}>
                        <option value="">Select tier</option>
                        {TIERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <div className="label">Status</div>
                      <select className="input" value={selected.status ?? ''}
                        onChange={e => saveField(selected.id, 'status', e.target.value)}>
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="churned">Churned</option>
                        <option value="upsold">Upsold</option>
                      </select>
                    </div>
                    <CF label="Setup Fee (R)" field="setup_fee" value={selected.setup_fee} onSave={v => saveField(selected.id, 'setup_fee', Number(v))} type="number" />
                    <CF label="Monthly Retainer (R)" field="monthly_retainer" value={selected.monthly_retainer} onSave={v => saveField(selected.id, 'monthly_retainer', Number(v))} type="number" />
                    <CF label="Monthly Ad Spend (R)" field="monthly_ad_spend" value={selected.monthly_ad_spend} onSave={v => saveField(selected.id, 'monthly_ad_spend', Number(v))} type="number" />
                    <div>
                      <div className="label">Contract Start</div>
                      <input className="input" type="date" defaultValue={selected.contract_start_date || ''}
                        key={`start-${selected.id}`}
                        onBlur={e => saveField(selected.id, 'contract_start_date', e.target.value)} />
                    </div>
                    <div>
                      <div className="label">Contract End</div>
                      <input className="input" type="date" defaultValue={selected.contract_end_date || ''}
                        key={`end-${selected.id}`}
                        onBlur={e => saveField(selected.id, 'contract_end_date', e.target.value)} />
                    </div>
                    <div>
                      <div className="label">Last Results Meeting</div>
                      <input className="input" type="date" defaultValue={selected.last_results_meeting || ''}
                        key={`meeting-${selected.id}`}
                        onBlur={e => saveField(selected.id, 'last_results_meeting', e.target.value)} />
                    </div>
                  </div>

                  <div className="section-label" style={{ marginTop: 4 }}>Meta & Delivery</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <CF label="Meta Ad Account ID" field="meta_ad_account_id" value={selected.meta_ad_account_id} onSave={v => saveField(selected.id, 'meta_ad_account_id', v)} placeholder="act_123456789" />
                    <CF label="Meta Pixel ID" field="meta_pixel_id" value={selected.meta_pixel_id as any} onSave={v => saveField(selected.id, 'meta_pixel_id', v)} />
                    <div>
                      <div className="label">Account Manager</div>
                      <select className="input" value={selected.account_manager || 'principal'}
                        onChange={e => saveField(selected.id, 'account_manager', e.target.value)}>
                        <option value="principal">Principal</option>
                        <option value="va_delivery">VA Delivery</option>
                      </select>
                    </div>
                    <CF label="Delivery VA" field="client_delivery_va" value={selected.client_delivery_va} onSave={v => saveField(selected.id, 'client_delivery_va', v)} placeholder="VA name" />
                  </div>
                </>
              )}

              {slideTab === 'sprints' && <ClientSprints clientId={selected.id} />}

              {slideTab === 'notes' && (
                <div>
                  <div className="label">Account Notes</div>
                  <textarea className="input" rows={14}
                    placeholder="Client preferences, key decisions, relationship notes, delivery context..."
                    defaultValue={selected.notes || ''}
                    key={`notes-${selected.id}`}
                    onBlur={e => saveField(selected.id, 'notes', e.target.value)}
                    style={{ resize: 'vertical', lineHeight: 1.7 }} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {showNew && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => { setShowNew(false); setImportProspect(null) }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
          <div style={{ position: 'relative', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 8, padding: 28, width: 500, zIndex: 1, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontFamily: 'Playfair Display', fontSize: 20, fontWeight: 700 }}>Add Client</div>
              <button onClick={() => { setShowNew(false); setImportProspect(null) }} style={{ background: 'none', border: 'none', color: 'var(--grey)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <NewClientForm
              initialProspect={importProspect}
              onSave={createClient}
              onCancel={() => { setShowNew(false); setImportProspect(null) }} />
          </div>
        </div>
      )}
    </div>
  )
}

function CF({ label, field, value, onSave, type = 'text', placeholder = '' }: {
  label: string; field: string; value: any; onSave: (v: string) => void
  type?: string; placeholder?: string
}) {
  return (
    <div>
      <div className="label">{label}</div>
      <input className="input" type={type} placeholder={placeholder}
        defaultValue={value ?? ''}
        key={`${field}-${value}`}
        onBlur={e => { if (String(e.target.value) !== String(value ?? '')) onSave(e.target.value) }} />
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

function NewClientForm({ initialProspect, onSave, onCancel }: {
  initialProspect?: Prospect | null
  onSave: (form: any, prospectId?: string) => void
  onCancel: () => void
}) {
  const [mode, setMode]       = useState<'manual' | 'import'>(initialProspect ? 'import' : 'manual')
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [search, setSearch]   = useState('')
  const [pickedProspect, setPickedProspect] = useState<Prospect | null>(initialProspect || null)
  const [form, setForm]       = useState({
    business_name:      initialProspect?.business_name || '',
    owner_name:         initialProspect?.owner_name    || '',
    phone:              initialProspect?.phone          || '',
    whatsapp:           initialProspect?.whatsapp       || '',
    email:              initialProspect?.email          || '',
    tier:               'proof_brand',
    setup_fee:          18000,
    monthly_retainer:   10000,
    monthly_ad_spend:   5000,
    contract_start_date: new Date().toISOString().split('T')[0],
    meta_ad_account_id: '',
    account_manager:    'principal',
  })

  async function searchProspects(q: string) {
    setSearch(q)
    if (q.length < 2) { setProspects([]); return }
    const { data } = await supabase.from('prospects').select('*')
      .or(`business_name.ilike.%${q}%,owner_name.ilike.%${q}%`)
      .neq('status', 'closed_won')
      .limit(8)
    setProspects(data || [])
  }

  function selectProspect(p: Prospect) {
    setPickedProspect(p)
    setForm(prev => ({
      ...prev,
      business_name: p.business_name,
      owner_name:    p.owner_name || '',
      phone:         p.phone      || '',
      whatsapp:      p.whatsapp   || '',
      email:         p.email      || '',
    }))
    setProspects([])
    setSearch(p.business_name)
  }

  function onTierChange(tier: string) {
    const t = TIERS.find(x => x.value === tier)!
    setForm(prev => ({ ...prev, tier, setup_fee: t.setup, monthly_retainer: t.retainer }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--bg3)', borderRadius: 6, padding: 4 }}>
        {(['manual','import'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            style={{ flex: 1, padding: '8px', borderRadius: 4, border: 'none', cursor: 'pointer', fontFamily: 'DM Mono', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', background: mode === m ? 'var(--teal)' : 'transparent', color: mode === m ? 'var(--bg)' : 'var(--grey)', transition: 'all 0.15s' }}>
            {m === 'manual' ? 'Manual Entry' : 'Import from Prospect'}
          </button>
        ))}
      </div>

      {/* Import search */}
      {mode === 'import' && (
        <div>
          <div className="label">Search Prospects</div>
          <div style={{ position: 'relative' }}>
            <Search size={12} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--grey2)' }} />
            <input className="input" placeholder="Type to search prospects..."
              style={{ paddingLeft: 34 }} value={search}
              onChange={e => searchProspects(e.target.value)} />
          </div>
          {prospects.length > 0 && (
            <div style={{ border: '1px solid var(--border2)', borderRadius: 6, marginTop: 4, overflow: 'hidden' }}>
              {prospects.map(p => (
                <div key={p.id} onClick={() => selectProspect(p)}
                  style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border2)', background: 'var(--bg3)', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--teal-faint)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg3)')}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{p.business_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--grey)', fontFamily: 'DM Mono' }}>{p.vertical} · {p.suburb} · {p.icp_tier}</div>
                </div>
              ))}
            </div>
          )}
          {pickedProspect && (
            <div style={{ padding: '10px 14px', background: 'var(--teal-faint)', border: '1px solid var(--teal-border)', borderRadius: 6, marginTop: 6, fontSize: 12, color: 'var(--teal)', fontFamily: 'DM Mono' }}>
              ✓ Importing: {pickedProspect.business_name}
            </div>
          )}
        </div>
      )}

      {/* Form fields — always shown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[
          { label: 'Business Name *', field: 'business_name' },
          { label: 'Owner Name *',    field: 'owner_name' },
          { label: 'WhatsApp',        field: 'whatsapp' },
          { label: 'Email',           field: 'email' },
        ].map(f => (
          <div key={f.field}>
            <div className="label">{f.label}</div>
            <input className="input" value={(form as any)[f.field]}
              onChange={e => setForm(prev => ({ ...prev, [f.field]: e.target.value }))} />
          </div>
        ))}
      </div>

      <div>
        <div className="label">Tier</div>
        <select className="input" value={form.tier} onChange={e => onTierChange(e.target.value)}>
          {TIERS.map(t => <option key={t.value} value={t.value}>{t.label} — R{t.setup.toLocaleString()} setup + R{t.retainer.toLocaleString()}/mo</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div className="label">Setup Fee (R)</div>
          <input className="input" type="number" value={form.setup_fee}
            onChange={e => setForm(prev => ({ ...prev, setup_fee: Number(e.target.value) }))} />
        </div>
        <div>
          <div className="label">Monthly Retainer (R)</div>
          <input className="input" type="number" value={form.monthly_retainer}
            onChange={e => setForm(prev => ({ ...prev, monthly_retainer: Number(e.target.value) }))} />
        </div>
        <div>
          <div className="label">Monthly Ad Spend (R)</div>
          <input className="input" type="number" value={form.monthly_ad_spend}
            onChange={e => setForm(prev => ({ ...prev, monthly_ad_spend: Number(e.target.value) }))} />
        </div>
        <div>
          <div className="label">Contract Start</div>
          <input className="input" type="date" value={form.contract_start_date}
            onChange={e => setForm(prev => ({ ...prev, contract_start_date: e.target.value }))} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button className="btn-primary"
          onClick={() => onSave(form, pickedProspect?.id)}
          disabled={!form.business_name || !form.owner_name}
          style={{ flex: 1 }}>
          Add Client →
        </button>
        <button className="btn-ghost" onClick={onCancel} style={{ flex: 1 }}>Cancel</button>
      </div>
    </div>
  )
}