import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Client, Prospect } from '../lib/supabase'
import { formatRand, formatDate } from '../lib/utils'
import { Plus, X, AlertTriangle, TrendingUp, Search } from 'lucide-react'
import { useToast } from '../lib/toast'
import { useAuth } from '../lib/auth'

// Constants aligned with SQL CHECK constraints
const TIERS = [
  { value: 'Proof Sprint',     label: 'Proof Sprint',     setup: 15000, retainer: 8000 },
  { value: 'Proof Brand',      label: 'Proof Brand',      setup: 18000, retainer: 10000 },
  { value: 'Authority Brand',  label: 'Authority Brand',  setup: 25000, retainer: 17000 },
  { value: 'Consulting',       label: 'Consulting',       setup: 0,     retainer: 5000 },
]

type SlideTab = 'overview' | 'sprints' | 'notes'

export default function Clients() {
  const { role, metadata_id }         = useAuth()
  const [clients, setClients]         = useState<Client[]>([])
  const [loading, setLoading]         = useState(true)
  const [selected, setSelected]       = useState<Client | null>(null)
  const [slideTab, setSlideTab]       = useState<SlideTab>('overview')
  const [showNew, setShowNew]         = useState(false)
  const [importProspect, setImportProspect] = useState<Prospect | null>(null)
  const [deliveryUsers]   = useState<{ id: string; email: string }[]>([])
  const { toast }                     = useToast()
  const location                      = useLocation()

  useEffect(() => {
    load()
    if (location.state?.importProspect) {
      setImportProspect(location.state.importProspect)
      setShowNew(true)
    }
    // NOTE: Growth Operator dropdown requires a staff table.
    // profiles table is deprecated. deliveryUsers stays empty until staff table is provisioned.
  }, [metadata_id, role])

  async function load() {
    setLoading(true)
    let q = supabase.from('clients').select('*').order('created_at', { ascending: false })

    // Delivery Ops: Filter by assigned UUID
    if (role === 'delivery' && metadata_id) {
      q = q.eq('account_manager', metadata_id)
    }
    
    // Client Portal: Filter by their own ID
    if (role === 'client' && metadata_id) {
      q = q.eq('id', metadata_id)
    }

    const { data } = await q
    setClients(data || [])
    setLoading(false)
  }

  async function createClient(form: any, prospectId?: string) {
    const insertData: any = { ...form, status: 'active', prospect_id: prospectId || null }
    
    // Auto-assign to the creator if they are a delivery user
    if (role === 'delivery' && metadata_id) {
      insertData.account_manager = metadata_id
    }

    const { data, error } = await supabase.from('clients').insert(insertData).select().single()
    if (error || !data) { 
        console.error(error)
        toast('Failed to create client. Check tier casing.', 'error')
        return 
    }

    if (prospectId) {
      await supabase.from('prospects').update({ status: 'closed_won' }).eq('id', prospectId)
    }

    setClients(prev => [data, ...prev])
    setShowNew(false)
    setImportProspect(null)
    toast('Client added ✓')
  }

  async function saveField(id: string, field: string, value: any) {
  // 1. Basic Validation
  if (field === 'tier' && !value) {
    toast("Please select a valid tier", "error");
    return;
  }

  // 2. Perform the update
  // We use .select() to get the updated data back, but handle it as an array to avoid the "single object" error
  const { data, error } = await supabase
    .from('clients')
    .update({ [field]: value })
    .eq('id', id)
    .select();

  if (error) {
    console.error("Update failed:", error);
    toast(`Failed to save: ${error.message}`, 'error');
    return;
  }

  // 3. Update the local state
  if (data && data.length > 0) {
    const updatedClient = data[0];
    setClients(prev => prev.map(c => c.id === id ? updatedClient : c));
    setSelected(updatedClient);
    toast(`${field} updated ✓`);
  } else {
    // If update worked but no data came back (common with some RLS setups)
    // We manually update the local state so the UI stays snappy
    setClients(prev => prev.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
    if (selected && selected.id === id) {
      setSelected({ ...selected, [field]: value });
    }
    toast(`${field} saved ✓`);
  }
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
      {/* Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Active Clients', value: active.length,   sub: 'on retainer' },
          { label: 'Monthly MRR',    value: formatRand(mrr), sub: 'combined retainers' },
          { label: 'Churn Risk',     value: churnRisk,       sub: 'needs attention',            color: churnRisk > 0 ? 'var(--red)' : undefined },
          { label: 'Upsell Ready',   value: upsellReady,     sub: 'authority candidates',       color: upsellReady > 0 ? 'var(--amber)' : undefined },
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
        {role !== 'client' && (
          <button className="btn-primary" onClick={() => { setImportProspect(null); setShowNew(true) }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={12} /> Add Client
          </button>
        )}
      </div>

      {loading
        ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 160 }} />)}
          </div>
        : clients.length === 0
          ? (
            <div className="empty-state">
              <h3>No clients yet</h3>
              <p>Add your first client manually or convert a prospect using "Convert to Client".</p>
              {role !== 'client' && <button className="btn-primary" onClick={() => setShowNew(true)}>Add First Client</button>}
            </div>
          )
          : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {clients.map(c => (
                <div key={c.id} className="card"
                  onClick={() => { setSelected(c); setSlideTab('overview') }}
                  style={{ cursor: 'pointer', borderTop: `2px solid ${c.churn_risk_flag ? 'var(--red)' : c.upsell_ready_flag ? 'var(--amber)' : 'var(--teal)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{c.business_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--grey)' }}>{c.owner_name}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {c.churn_risk_flag && <AlertTriangle size={14} color="var(--red)" />}
                      {c.upsell_ready_flag && <TrendingUp size={14} color="var(--amber)" />}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {c.tier || '—'}
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

      {/* Slide-over Detail View */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', justifyContent: 'flex-end' }}>
          <div onClick={() => setSelected(null)} style={{ flex: 1, background: 'rgba(0,0,0,0.5)' }} />
          <div style={{ width: 560, background: 'var(--bg2)', borderLeft: '1px solid var(--border2)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

            <div style={{ padding: '24px 28px 0', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: 'Playfair Display', fontSize: 22, fontWeight: 700, marginBottom: 2 }}>{selected.business_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--grey)' }}>{selected.owner_name}</div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--grey)', cursor: 'pointer' }}><X size={18} /></button>
              </div>

              {role === 'admin' && (
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
              )}

              <div style={{ display: 'flex', borderBottom: '1px solid var(--border2)' }}>
                {(['overview','sprints','notes'] as SlideTab[]).map(t => (
                  <button key={t} onClick={() => setSlideTab(t)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Mono', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '12px 16px', color: slideTab === t ? 'var(--teal)' : 'var(--grey)', borderBottom: slideTab === t ? '2px solid var(--teal)' : '2px solid transparent', marginBottom: -1 }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>

              {slideTab === 'overview' && (
                <>
                  <div className="section-label">Contact Details</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <CF label="Business Name" field="business_name" value={selected.business_name} onSave={v => saveField(selected.id, 'business_name', v)} />
                    <CF label="Owner Name" field="owner_name" value={selected.owner_name} onSave={v => saveField(selected.id, 'owner_name', v)} />
                    <CF label="Phone" field="phone" value={selected.phone} onSave={v => saveField(selected.id, 'phone', v)} />
                    <CF label="WhatsApp" field="whatsapp" value={selected.whatsapp} onSave={v => saveField(selected.id, 'whatsapp', v)} />
                    <CF label="Email" field="email" value={selected.email} onSave={v => saveField(selected.id, 'email', v)} type="email" />
                  </div>

                  {role !== 'client' && (
                    <>
                      <div className="section-label" style={{ marginTop: 8 }}>Contract & Tier</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <div className="label">Fulfillment Tier</div>
                          <select className="input" value={selected.tier || ''}
                            onChange={e => saveField(selected.id, 'tier', e.target.value)}>
                            <option value="">Select tier</option>
                            {TIERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <div className="label">Client Status</div>
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
                        <CF label="Ad Spend Budget (R)" field="monthly_ad_spend" value={selected.monthly_ad_spend} onSave={v => saveField(selected.id, 'monthly_ad_spend', Number(v))} type="number" />
                        <div>
                          <div className="label">Contract Start</div>
                          <input className="input" type="date" defaultValue={selected.contract_start_date || ''} onBlur={e => saveField(selected.id, 'contract_start_date', e.target.value)} />
                        </div>
                      </div>

                      <div className="section-label" style={{ marginTop: 8 }}>Internal Operations</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <CF label="Meta Ad Account ID" field="meta_ad_account_id" value={selected.meta_ad_account_id} onSave={v => saveField(selected.id, 'meta_ad_account_id', v)} placeholder="act_..." />
                        <div>
                          <div className="label">Growth Operator</div>
                          <select className="input" value={selected.account_manager || ''}
                            onChange={e => saveField(selected.id, 'account_manager', e.target.value)}>
                            <option value="">— Unassigned —</option>
                            {deliveryUsers.map(u => (
                              <option key={u.id} value={u.id}>{u.email}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {slideTab === 'sprints' && <ClientSprints clientId={selected.id} accountManager={selected.account_manager} />}

              {slideTab === 'notes' && (
                <div>
                  <div className="label">Account Notes</div>
                  <textarea className="input" rows={16}
                    placeholder="Strategy notes, client goals, and specific delivery constraints..."
                    defaultValue={selected.notes || ''}
                    onBlur={e => saveField(selected.id, 'notes', e.target.value)}
                    style={{ resize: 'vertical', lineHeight: 1.7 }} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Client Modal */}
      {showNew && role !== 'client' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => { setShowNew(false); setImportProspect(null) }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
          <div style={{ position: 'relative', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 12, padding: 32, width: 500, zIndex: 1, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontFamily: 'Playfair Display', fontSize: 24, fontWeight: 700 }}>Initialize Client</div>
              <button onClick={() => { setShowNew(false); setImportProspect(null) }} style={{ background: 'none', border: 'none', color: 'var(--grey)', cursor: 'pointer' }}><X size={20} /></button>
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

function dayX(startDate: string) {
  return Math.max(1, Math.min(Math.floor((Date.now() - new Date(startDate).getTime()) / 86400000) + 1, 14))
}

function ClientSprints({ clientId, accountManager }: { clientId: string; accountManager: string | null }) {
  const { role, metadata_id } = useAuth()
  const { toast } = useToast()
  const canEdit = role === 'admin' || (role === 'delivery' && metadata_id === accountManager)

  const [sprints, setSprints] = useState<any[]>([])
  const [activeSprint, setActiveSprint] = useState<any | null>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [showLogForm, setShowLogForm] = useState(false)
  const [logForm, setLogForm] = useState({ reach: 0, impressions: 0, link_clicks: 0, leads: 0, spend: 0, notes: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadSprints() }, [clientId])

  async function loadSprints() {
    const { data } = await supabase.from('proof_sprints').select('*').eq('client_id', clientId).order('created_at', { ascending: false })
    const all = data || []
    setSprints(all)
    const active = all.find((s: any) => s.status === 'active') || null
    setActiveSprint(active)
    if (active) loadLogs(active.id)
  }

  async function loadLogs(sprintId: string) {
    const { data } = await supabase.from('sprint_daily_log').select('*').eq('sprint_id', sprintId).order('log_date')
    setLogs((data || []).map((l: any) => ({
      ...l,
      day_number: l.day_number ?? dayX(l.log_date || new Date().toISOString()),
      reach: l.reach ?? 0, impressions: l.impressions ?? 0,
      link_clicks: l.link_clicks ?? 0, leads: l.leads ?? 0,
      spend: l.spend ?? 0, notes: l.notes ?? ''
    })))
  }

  async function addLog() {
    if (!activeSprint) return
    setSaving(true)
    const today = new Date().toISOString().split('T')[0]
    const dayNum = dayX(activeSprint.start_date)

    const { error } = await supabase.from('sprint_daily_log').upsert(
      { sprint_id: activeSprint.id, log_date: today, day_number: dayNum, ...logForm },
      { onConflict: 'sprint_id,log_date' }
    )

    if (error) { toast('Failed to save log', 'error'); setSaving(false); return }

    const totalSpend = logs.reduce((sum: number, l: any) => sum + (l.spend ?? 0), 0) + (logForm.spend ?? 0)
    const totalLeads = logs.reduce((sum: number, l: any) => sum + (l.leads ?? 0), 0) + (logForm.leads ?? 0)
    const newCpl = totalLeads > 0 ? totalSpend / totalLeads : 0

    await supabase.from('proof_sprints').update({ actual_ad_spend: totalSpend, leads_generated: totalLeads, cpl: newCpl }).eq('id', activeSprint.id)

    toast('Daily log saved ✓')
    setSaving(false)
    setShowLogForm(false)
    setLogForm({ reach: 0, impressions: 0, link_clicks: 0, leads: 0, spend: 0, notes: '' })
    loadSprints()
  }

  async function saveDay7(field: 'day7_notes' | 'day7_sentiment', value: string) {
    if (!activeSprint) return
    await supabase.from('proof_sprints').update({ [field]: value }).eq('id', activeSprint.id)
    setActiveSprint((prev: any) => prev ? { ...prev, [field]: value } : prev)
  }

  if (sprints.length === 0) return <div style={{ color: 'var(--grey)', fontSize: 13, textAlign: 'center', padding: 32 }}>No sprints for this client.</div>

  const totalSpend = logs.reduce((sum: number, l: any) => sum + (l.spend ?? 0), 0)
  const totalLeads = logs.reduce((sum: number, l: any) => sum + (l.leads ?? 0), 0)
  const cpl = totalLeads > 0 ? totalSpend / totalLeads : 0
  const cplColor = cpl === 0 ? 'var(--grey)' : cpl < 150 ? 'var(--teal)' : cpl < 300 ? 'var(--amber)' : 'var(--red)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Completed sprint summary cards */}
      {sprints.filter((s: any) => s.status !== 'active').map((s: any) => {
        const sCpl = s.cpl || 0
        const sCplColor = sCpl === 0 ? 'var(--grey)' : sCpl < 150 ? 'var(--teal)' : sCpl < 300 ? 'var(--amber)' : 'var(--red)'
        return (
          <div key={s.id} style={{ background: 'var(--bg3)', borderRadius: 8, padding: 16, border: '1px solid var(--border2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--grey)', textTransform: 'uppercase' }}>Sprint {s.sprint_number || 1}</span>
              <span className={`badge ${s.status === 'closed_won' ? 'badge-clients' : 'badge-lost'}`}>{s.status}</span>
            </div>
            <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
              <div><span style={{ color: 'var(--grey)' }}>Leads: </span><span style={{ color: 'var(--white)' }}>{s.leads_generated || 0}</span></div>
              <div><span style={{ color: 'var(--grey)' }}>CPL: </span><span style={{ color: sCplColor, fontFamily: 'DM Mono' }}>{sCpl > 0 ? `R${sCpl.toFixed(0)}` : '—'}</span></div>
              <div><span style={{ color: 'var(--grey)' }}>Spend: </span><span style={{ color: 'var(--white)' }}>R{(s.actual_ad_spend || 0).toFixed(0)}</span></div>
            </div>
          </div>
        )
      })}

      {/* Active sprint — read-only for non-editors */}
      {activeSprint && !canEdit && (
        <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: 16, border: '1px solid var(--teal)' }}>
          <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--teal)', textTransform: 'uppercase', marginBottom: 8 }}>Active Sprint {activeSprint.sprint_number || 1}</div>
          <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
            <div><span style={{ color: 'var(--grey)' }}>Leads: </span><span style={{ color: 'var(--white)' }}>{totalLeads}</span></div>
            <div><span style={{ color: 'var(--grey)' }}>CPL: </span><span style={{ color: cplColor, fontFamily: 'DM Mono' }}>{cpl > 0 ? `R${cpl.toFixed(0)}` : '—'}</span></div>
            <div><span style={{ color: 'var(--grey)' }}>Spend: </span><span style={{ color: 'var(--white)' }}>{formatRand(totalSpend)}</span></div>
          </div>
        </div>
      )}

      {/* Active sprint — full management for admin / assigned delivery user */}
      {activeSprint && canEdit && (
        <>
          {/* Active Sprint Stats */}
          <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: 16, border: '1px solid var(--teal)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Active · Sprint {activeSprint.sprint_number || 1}</div>
                <div style={{ fontSize: 12, color: 'var(--grey)', marginTop: 2 }}>Started {formatDate(activeSprint.start_date)}</div>
              </div>
              <div style={{ fontFamily: 'DM Mono', fontSize: 24, fontWeight: 500, color: 'var(--teal)' }}>
                Day {dayX(activeSprint.start_date)}<span style={{ fontSize: 14, color: 'var(--grey)' }}>/14</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { label: 'Spend', value: formatRand(totalSpend) },
                { label: 'Leads', value: totalLeads, color: 'var(--white)' },
                { label: 'CPL', value: cpl > 0 ? formatRand(cpl) : '—', color: cplColor },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--grey)', textTransform: 'uppercase' }}>{s.label}</div>
                  <div style={{ fontFamily: 'DM Mono', fontSize: 16, color: s.color || 'var(--teal)', marginTop: 4 }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Log */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div className="section-label" style={{ margin: 0 }}>Daily Log</div>
              <button className="btn-primary" onClick={() => setShowLogForm(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px' }}>
                <Plus size={11} /> Add Today's Log
              </button>
            </div>

            {showLogForm && (
              <div style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 6, padding: 14, marginBottom: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 10 }}>
                  {[{ label: 'Reach', field: 'reach' }, { label: 'Impressions', field: 'impressions' }, { label: 'Clicks', field: 'link_clicks' }, { label: 'Leads', field: 'leads' }, { label: 'Spend (R)', field: 'spend' }].map(f => (
                    <div key={f.field}>
                      <div className="label">{f.label}</div>
                      <input className="input" type="number" value={(logForm as any)[f.field] ?? 0} onChange={e => setLogForm(prev => ({ ...prev, [f.field]: Number(e.target.value) || 0 }))} />
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div className="label">Notes</div>
                  <input className="input" placeholder="Observations, optimisations made..." value={logForm.notes ?? ''} onChange={e => setLogForm(prev => ({ ...prev, notes: e.target.value }))} />
                </div>
                <button className="btn-primary" onClick={addLog} disabled={saving}>{saving ? 'Saving...' : 'Save Log Entry →'}</button>
              </div>
            )}

            {logs.length === 0 ? (
              <div style={{ color: 'var(--grey)', fontSize: 13, textAlign: 'center', padding: 16 }}>No log entries yet.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="aa-table">
                  <thead><tr><th>Day</th><th>Date</th><th>Leads</th><th>Spend</th><th>CPL</th><th>Notes</th></tr></thead>
                  <tbody>
                    {logs.map((l: any) => (
                      <tr key={l.id}>
                        <td style={{ fontFamily: 'DM Mono', color: 'var(--teal)' }}>Day {l.day_number ?? '?'}</td>
                        <td style={{ color: 'var(--grey)', fontSize: 12 }}>{formatDate(l.log_date)}</td>
                        <td style={{ color: 'var(--teal)', fontFamily: 'DM Mono' }}>{l.leads ?? 0}</td>
                        <td>{formatRand(l.spend ?? 0)}</td>
                        <td style={{ fontFamily: 'DM Mono', color: cplColor }}>{l.leads && l.leads > 0 ? formatRand((l.spend ?? 0) / l.leads) : '—'}</td>
                        <td style={{ color: 'var(--grey)', fontSize: 12 }}>{l.notes ?? ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Day 7 Check-in */}
          <div className="card">
            <div className="section-label">Day 7 Check-in</div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
              <div>
                <div className="label">Notes from Day 7 call</div>
                <textarea className="input" rows={3} placeholder="Client feedback, questions raised, sentiment notes..." defaultValue={activeSprint.day7_notes ?? ''} onBlur={e => saveDay7('day7_notes', e.target.value)} style={{ resize: 'vertical' }} />
              </div>
              <div>
                <div className="label">Client Sentiment</div>
                <select className="input" value={activeSprint.day7_sentiment ?? ''} onChange={e => saveDay7('day7_sentiment', e.target.value)}>
                  <option value="">Not recorded</option>
                  <option value="satisfied">Satisfied</option>
                  <option value="neutral">Neutral</option>
                  <option value="concerned">Concerned</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Meeting Prep */}
          <div className="card">
            <div className="section-label">Results Meeting Prep</div>
            <div style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 6, padding: 14, marginBottom: 14, fontSize: 13, color: 'var(--grey)', lineHeight: 1.8 }}>
              <div style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Auto-populated from sprint data</div>
              <div>Ad spend: <span style={{ color: 'var(--white)' }}>{formatRand(totalSpend)}</span></div>
              <div>Leads generated: <span style={{ color: 'var(--white)' }}>{totalLeads}</span></div>
              <div>CPL: <span style={{ color: cplColor }}>{cpl > 0 ? formatRand(cpl) : '—'}</span></div>
              <div>Days run: <span style={{ color: 'var(--white)' }}>{dayX(activeSprint.start_date)} of 14</span></div>
              <div>Client sentiment (Day 7): <span style={{ color: 'var(--white)' }}>{activeSprint.day7_sentiment || 'Not recorded'}</span></div>
            </div>
            <div>
              <div className="label">Editable Talking Points</div>
              <textarea
                className="input"
                rows={5}
                placeholder={"1. Lead with the numbers\n2. Frame CPL against industry average\n3. Show full system capacity\n4. Present Proof Brand investment\n5. Close with the guarantee"}
                defaultValue={activeSprint.talking_points ?? ''}
                onBlur={async e => {
                  await supabase.from('proof_sprints').update({ talking_points: e.target.value }).eq('id', activeSprint.id)
                }}
                style={{ resize: 'vertical', fontFamily: 'DM Mono', fontSize: 12 }}
              />
            </div>
            <SprintReportButton sprintId={activeSprint.id} sprint={activeSprint} logs={logs} />
          </div>
        </>
      )}
    </div>
  )
}

function SprintReportButton({ sprintId, sprint, logs }: { sprintId: string; sprint: any; logs: any[] }) {
  const [report, setReport] = useState('')
  const [generating, setGenerating] = useState(false)
  const { toast } = useToast()

  async function generate() {
    setGenerating(true)
    setReport('')
    try {
      const { data, error } = await supabase.functions.invoke('generate-sprint-report', { body: { sprint, logs } })
      if (error) throw error
      setReport(data.report)
      await supabase.from('proof_sprints').update({ talking_points: data.report }).eq('id', sprintId)
      toast('Results report generated ✓')
    } catch {
      toast('Generation failed — check Supabase Edge Functions', 'error')
    }
    setGenerating(false)
  }

  return (
    <div style={{ marginTop: 12 }}>
      <button className="btn-primary" onClick={generate} disabled={generating} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        {generating ? 'Generating...' : '✦ Generate Results Report →'}
      </button>
      {report && (
        <div style={{ marginTop: 14, background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 6, padding: 16, fontSize: 13, color: 'var(--white)', lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>
          {report}
        </div>
      )}
    </div>
  )
}

function NewClientForm({ initialProspect, onSave, onCancel }: {
  initialProspect?: Prospect | null
  onSave: (form: any, prospectId?: string) => void
  onCancel: () => void
}) {
  const [mode, setMode]             = useState<'manual' | 'import'>(initialProspect ? 'import' : 'manual')
  const [prospects, setProspects]   = useState<Prospect[]>([])
  const [search, setSearch]         = useState('')
  const [pickedProspect, setPickedProspect] = useState<Prospect | null>(initialProspect || null)
  const [form, setForm]             = useState({
    business_name:       initialProspect?.business_name || '',
    owner_name:          initialProspect?.owner_name    || '',
    phone:               initialProspect?.phone         || '',
    whatsapp:            initialProspect?.whatsapp      || '',
    email:               initialProspect?.email         || '',
    tier:                'Proof Brand', 
    setup_fee:           18000,
    monthly_retainer:    10000,
    monthly_ad_spend:    5000,
    contract_start_date: new Date().toISOString().split('T')[0],
    meta_ad_account_id:  '',
    account_manager:     null,
  })

  async function searchProspects(q: string) {
    setSearch(q)
    if (q.length < 2) { setProspects([]); return }
    const { data } = await supabase.from('prospects').select('*')
      .or(`business_name.ilike.%${q}%,owner_name.ilike.%${q}%`)
      .neq('status', 'closed_won')
      .limit(6)
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
      <div style={{ display: 'flex', gap: 4, background: 'var(--bg3)', borderRadius: 8, padding: 4, marginBottom: 8 }}>
        {(['manual','import'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            style={{ flex: 1, padding: '10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'DM Mono', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', background: mode === m ? 'var(--teal)' : 'transparent', color: mode === m ? 'var(--bg)' : 'var(--grey)', transition: 'all 0.2s' }}>
            {m === 'manual' ? 'Manual' : 'Import'}
          </button>
        ))}
      </div>

      {mode === 'import' && (
        <div style={{ marginBottom: 12 }}>
          <div className="label">Prospect Source</div>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--grey2)' }} />
            <input className="input" placeholder="Search by business or name..."
              style={{ paddingLeft: 38 }} value={search}
              onChange={e => searchProspects(e.target.value)} />
          </div>
          {prospects.length > 0 && (
            <div style={{ border: '1px solid var(--border2)', borderRadius: 8, marginTop: 8, background: 'var(--bg3)', maxHeight: 200, overflowY: 'auto' }}>
              {prospects.map(p => (
                <div key={p.id} onClick={() => selectProspect(p)}
                  style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border2)', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{p.business_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--grey)' }}>{p.owner_name}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div className="label">Business Name *</div>
          <input className="input" value={form.business_name} onChange={e => setForm(p => ({ ...p, business_name: e.target.value }))} />
        </div>
        <div>
          <div className="label">Owner Name *</div>
          <input className="input" value={form.owner_name} onChange={e => setForm(p => ({ ...p, owner_name: e.target.value }))} />
        </div>
      </div>

      <div>
        <div className="label">Fulfillment Tier</div>
        <select className="input" value={form.tier} onChange={e => onTierChange(e.target.value)}>
          {TIERS.map(t => <option key={t.value} value={t.value}>{t.label} — R{t.setup.toLocaleString()}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div className="label">Contract Start</div>
          <input className="input" type="date" value={form.contract_start_date} onChange={e => setForm(p => ({ ...p, contract_start_date: e.target.value }))} />
        </div>
        <div>
          <div className="label">Ad Account ID</div>
          <input className="input" placeholder="act_..." value={form.meta_ad_account_id} onChange={e => setForm(p => ({ ...p, meta_ad_account_id: e.target.value }))} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <button className="btn-primary" style={{ flex: 1, padding: '14px' }}
          disabled={!form.business_name || !form.owner_name}
          onClick={() => onSave(form, pickedProspect?.id)}>
          Onboard Client →
        </button>
        <button className="btn-ghost" style={{ flex: 1 }} onClick={onCancel}>Discard</button>
      </div>
    </div>
  )
}