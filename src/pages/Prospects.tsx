import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Prospect } from '../lib/supabase'
import { formatDate, tierLabel, statusBadge } from '../lib/utils'
import { Search, Plus, RefreshCw, X, ChevronRight, Trash2 } from 'lucide-react'
import { useToast } from '../lib/toast'
import { useNavigate } from 'react-router-dom'

const VERTICALS = [
  'Auto Detailing','Vehicle Wrapping','Car Wash','Pet Grooming','Pet Salon',
  'Trailer Manufacturing','Metal Fabrication','Engineering Shop',
  'Home Renovation','Landscaping','Plumbing','Electrical','HVAC',
  'Courier','Logistics','Physiotherapy','Wellness Studio','Dental Clinic',
  'Personal Training','Industrial','Other'
]
const STATUSES = [
  'new','contacted','mjr_sent','mjr_opened','call_booked','call_completed',
  'sprint_active','sprint_complete','results_meeting','closed_won','closed_lost','archived'
]

type SlideTab = 'business' | 'digital' | 'mjr'

export default function Prospects() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filterTier, setFilterTier]           = useState('')
  const [filterStatus, setFilterStatus]     = useState('')
  const [filterVertical, setFilterVertical] = useState('')
  const [selected, setSelected]   = useState<Prospect | null>(null)
  const [slideTab, setSlideTab]   = useState<SlideTab>('business')
  const [showAdd, setShowAdd]     = useState(false)
  const { toast }                  = useToast()
  const navigate                  = useNavigate()

  useEffect(() => { load() }, [filterTier, filterStatus, filterVertical])

  async function load() {
    setLoading(true)
    let q = supabase.from('prospects').select('*').order('icp_total_score', { ascending: false })
    if (filterTier)     q = q.eq('icp_tier', filterTier)
    if (filterStatus)   q = q.eq('status', filterStatus)
    if (filterVertical) q = q.eq('vertical', filterVertical)
    const { data } = await q
    setProspects(data || [])
    setLoading(false)
  }

  const filtered = prospects.filter((p: Prospect) => {
    if (!search) return true
    const q = search.toLowerCase()
    return [p.business_name, p.owner_name, p.suburb, p.vertical].some(f => f?.toLowerCase().includes(q))
  })

  const total = prospects.length
  const tier3 = prospects.filter((p: Prospect) => p.icp_tier === '★★★').length
  const tier2 = prospects.filter((p: Prospect) => p.icp_tier === '★★').length

  function calculateICP(p: any) {
    const score = (Number(p.score_visual_transformability) || 0) +
                  (Number(p.score_ticket_size) || 0) +
                  (Number(p.score_owner_accessibility) || 0) +
                  (Number(p.score_digital_weakness) || 0) +
                  (Number(p.score_growth_hunger) || 0);
    
    let tier = '★';
    if (score >= 20) tier = '★★★';
    else if (score >= 15) tier = '★★';
    
    return { score, tier };
  }

  async function saveField(id: string, field: string, value: any) {
    let updates: any = { [field]: value };

    if (field.startsWith('score_')) {
      const current = prospects.find((p: Prospect) => p.id === id);
      if (current) {
        const { score, tier } = calculateICP({ ...current, [field]: value });
        updates.icp_total_score = score;
        updates.icp_tier = tier;
      }
    }

    const { error } = await supabase.from('prospects').update(updates).eq('id', id)
    if (error) { toast(`Failed to save ${field}`, 'error'); return }
    
    setProspects(prev => prev.map((p: Prospect) => p.id === id ? { ...p, ...updates } : p))
    setSelected(prev => prev ? { ...prev, ...updates } : prev)
  }

  async function deleteProspect(id: string) {
    if (!window.confirm('Permanently delete this prospect?')) return
    const { error } = await supabase.from('prospects').delete().eq('id', id)
    if (error) { toast('Delete failed', 'error'); return }
    setProspects(prev => prev.filter((p: Prospect) => p.id !== id))
    setSelected(null)
    toast('Prospect deleted')
  }

  function openSlide(p: Prospect) {
    setSelected(p)
    setSlideTab('business')
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 28, marginBottom: 20 }}>
        {[
          { label: 'Total',        value: total },
          { label: '★★★ Priority', value: tier3 },
          { label: '★★ Qualified', value: tier2 },
        ].map(k => (
          <div key={k.label} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="stat-num" style={{ fontSize: 24 }}>{k.value}</span>
            <span style={{ fontFamily: 'DM Mono', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--grey)' }}>{k.label}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--grey2)' }} />
          <input className="input" placeholder="Search business, owner, suburb..."
            style={{ paddingLeft: 36 }} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input" style={{ width: 130 }} value={filterTier} onChange={e => setFilterTier(e.target.value)}>
          <option value="">All Tiers</option>
          <option value="★★★">★★★</option>
          <option value="★★">★★</option>
          <option value="★">★</option>
        </select>
        <select className="input" style={{ width: 150 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
        </select>
        <select className="input" style={{ width: 160 }} value={filterVertical} onChange={e => setFilterVertical(e.target.value)}>
          <option value="">All Verticals</option>
          {VERTICALS.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        <button className="btn-secondary" onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={11} /> Refresh
        </button>
        <button className="btn-primary" onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={11} /> Add Prospect
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading
          ? <div style={{ padding: 24 }}>{[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 44, marginBottom: 8 }} />)}</div>
          : (
            <div style={{ overflowX: 'auto' }}>
              <table className="aa-table">
                <thead>
                  <tr>
                    <th>Business</th><th>Vertical</th><th>Suburb</th>
                    <th>ICP Score</th><th>Tier</th><th>Status</th>
                    <th>Added</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p: Prospect) => {
                    const tier = tierLabel(p.icp_tier ?? '')
                    const stat = statusBadge(p.status ?? '')
                    return (
                      <tr key={p.id} onClick={() => openSlide(p)}>
                        <td>
                          <div style={{ fontWeight: 500 }}>{p.business_name}</div>
                          {p.owner_name && <div style={{ fontSize: 12, color: 'var(--grey)' }}>{p.owner_name}</div>}
                        </td>
                        <td style={{ color: 'var(--grey)', fontSize: 13 }}>{p.vertical || '—'}</td>
                        <td style={{ color: 'var(--grey)', fontSize: 13 }}>{p.suburb || '—'}</td>
                        <td>
                          <span style={{ fontFamily: 'DM Mono', fontSize: 13, color: 'var(--teal)' }}>
                            {p.icp_total_score ?? '—'}<span style={{ color: 'var(--grey2)' }}>/25</span>
                          </span>
                        </td>
                        <td><span className={tier.cls} style={{ fontFamily: 'DM Mono', fontSize: 14 }}>{tier.label}</span></td>
                        <td><span className={`badge ${stat.cls}`}>{stat.label}</span></td>
                        <td style={{ color: 'var(--grey)', fontSize: 12 }}>{formatDate(p.created_at)}</td>
                        <td><ChevronRight size={14} color="var(--grey2)" /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        }
      </div>

      {selected && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', justifyContent: 'flex-end' }}>
          <div onClick={() => setSelected(null)} style={{ flex: 1, background: 'rgba(0,0,0,0.5)' }} />
          <div style={{ width: 560, background: 'var(--bg2)', borderLeft: '1px solid var(--border2)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

            <div style={{ padding: '24px 28px 0', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Playfair Display', fontSize: 20, fontWeight: 700, marginBottom: 2 }}>{selected.business_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--grey)', fontFamily: 'DM Mono' }}>
                    {[selected.suburb, selected.city || 'Cape Town'].filter(Boolean).join(' · ')}
                    {selected.icp_tier && <span style={{ marginLeft: 10, color: selected.icp_tier === '★★★' ? 'var(--teal)' : selected.icp_tier === '★★' ? 'var(--amber)' : 'var(--grey)' }}>{selected.icp_tier} · {selected.icp_total_score ?? '—'}/25</span>}
                  </div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--grey)', cursor: 'pointer', padding: 4 }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border2)' }}>
                {([
                  { key: 'business', label: 'Business Info' },
                  { key: 'digital',  label: 'Digital & ICP' },
                  { key: 'mjr',       label: 'MJR & Pipeline' },
                ] as { key: SlideTab; label: string }[]).map(t => (
                  <button key={t.key} onClick={() => setSlideTab(t.key)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Mono', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '10px 16px', color: slideTab === t.key ? 'var(--teal)' : 'var(--grey)', borderBottom: slideTab === t.key ? '2px solid var(--teal)' : '2px solid transparent', marginBottom: -1 }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>

              {slideTab === 'business' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <F label="Business Name *" field="business_name" value={selected.business_name} onSave={(v: string) => saveField(selected.id, 'business_name', v)} />
                    <F label="Owner Name" field="owner_name" value={selected.owner_name} onSave={(v: string) => saveField(selected.id, 'owner_name', v)} />
                    <F label="Phone" field="phone" value={selected.phone} onSave={(v: string) => saveField(selected.id, 'phone', v)} />
                    <F label="WhatsApp" field="whatsapp" value={selected.whatsapp} onSave={(v: string) => saveField(selected.id, 'whatsapp', v)} />
                    <F label="Email" field="email" value={selected.email} onSave={(v: string) => saveField(selected.id, 'email', v)} type="email" />
                    <F label="Website" field="website" value={selected.website} onSave={(v: string) => saveField(selected.id, 'website', v)} />
                    <F label="Suburb" field="suburb" value={selected.suburb} onSave={(v: string) => saveField(selected.id, 'suburb', v)} />
                    <F label="City" field="city" value={selected.city} onSave={(v: string) => saveField(selected.id, 'city', v)} />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <div className="label">Vertical</div>
                    <select className="input" value={selected.vertical || ''} onChange={e => saveField(selected.id, 'vertical', e.target.value)}>
                      <option value="">Select vertical</option>
                      {VERTICALS.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <div className="label">Priority Cohort</div>
                      <select className="input" value={selected.priority_cohort || ''} onChange={e => saveField(selected.id, 'priority_cohort', e.target.value)}>
                        <option value="">None</option>
                        <option value="oct_1_launch">Oct 1 Launch</option>
                        <option value="q4_2026">Q4 2026</option>
                        <option value="q1_2027">Q1 2027</option>
                      </select>
                    </div>
                    <div>
                      <div className="label">Data Source</div>
                      <select className="input" value={selected.data_source || 'manual'} onChange={e => saveField(selected.id, 'data_source', e.target.value)}>
                        <option value="manual">Manual</option>
                        <option value="apify">Apify</option>
                        <option value="referral">Referral</option>
                        <option value="inbound">Inbound</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {slideTab === 'digital' && (
                <>
                  <div className="section-label">Digital Presence</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <F label="Instagram Handle" field="instagram_handle" value={selected.instagram_handle} onSave={(v: string) => saveField(selected.id, 'instagram_handle', v)} />
                    <F label="Followers" field="instagram_followers" value={selected.instagram_followers} onSave={(v: string) => saveField(selected.id, 'instagram_followers', Number(v))} type="number" />
                    <F label="Google Rating" field="google_rating" value={selected.google_rating} onSave={(v: string) => saveField(selected.id, 'google_rating', Number(v))} type="number" />
                    <F label="Review Count" field="google_review_count" value={selected.google_review_count} onSave={(v: string) => saveField(selected.id, 'google_review_count', Number(v))} type="number" />
                    <div style={{ gridColumn: 'span 2' }}>
                      <div className="label">Meta Ads Running</div>
                      <button onClick={() => saveField(selected.id, 'has_meta_ads', !selected.has_meta_ads)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: `1px solid ${selected.has_meta_ads ? 'var(--teal)' : 'var(--border2)'}`, background: selected.has_meta_ads ? 'var(--teal-faint)' : 'var(--bg3)', color: selected.has_meta_ads ? 'var(--teal)' : 'var(--grey)', cursor: 'pointer', fontFamily: 'DM Mono', fontSize: 12, textAlign: 'left' }}>
                        {selected.has_meta_ads ? '✓ Running' : '✗ Not running'}
                      </button>
                    </div>
                  </div>

                  <div className="section-label" style={{ marginTop: 8 }}>ICP Scoring</div>
                  {[
                    { label: 'Visual Transformability', field: 'score_visual_transformability' },
                    { label: 'Ticket Size (R5k+)',       field: 'score_ticket_size' },
                    { label: 'Owner Accessibility',      field: 'score_owner_accessibility' },
                    { label: 'Digital Weakness',          field: 'score_digital_weakness' },
                    { label: 'Growth Hunger',             field: 'score_growth_hunger' },
                  ].map(s => (
                    <div key={s.field}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, color: 'var(--grey)' }}>{s.label}</span>
                        <span style={{ fontFamily: 'DM Mono', fontSize: 13, color: 'var(--teal)' }}>
                          {(selected as any)[s.field] ?? 0}/5
                        </span>
                      </div>
                      <input type="range" min={1} max={5} value={(selected as any)[s.field] || 1}
                        onChange={e => saveField(selected.id, s.field, Number(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--teal)' }} />
                    </div>
                  ))}

                  <div style={{ padding: '12px 14px', background: 'var(--bg3)', borderRadius: 6, border: '1px solid var(--border2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'DM Mono', fontSize: 11, textTransform: 'uppercase', color: 'var(--grey)' }}>Total Score</span>
                    <span style={{ fontFamily: 'DM Mono', fontSize: 18, color: 'var(--teal)' }}>
                      {selected.icp_total_score ?? 0}/25
                      <span style={{ fontSize: 13, marginLeft: 10, color: selected.icp_tier === '★★★' ? 'var(--teal)' : selected.icp_tier === '★★' ? 'var(--amber)' : 'var(--grey)' }}>
                        {selected.icp_tier}
                      </span>
                    </span>
                  </div>
                </>
              )}

              {slideTab === 'mjr' && (
                <>
                  <div className="section-label">Pipeline</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <div className="label">Status</div>
                      <select className="input" value={selected.status ?? ''} onChange={e => saveField(selected.id, 'status', e.target.value)}>
                        {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
                      </select>
                    </div>
                    <div>
                      <div className="label">Assigned To</div>
                      <select className="input" value={selected.assigned_to || 'principal'} onChange={e => saveField(selected.id, 'assigned_to', e.target.value)}>
                        <option value="principal">Principal</option>
                        <option value="va_outreach">VA Outreach</option>
                        <option value="va_delivery">VA Delivery</option>
                      </select>
                    </div>
                  </div>
                  <div className="section-label" style={{ marginTop: 4 }}>MJR Data</div>
                  <F label="Monthly Missed Revenue (R)" field="mjr_estimated_monthly_missed_revenue" value={selected.mjr_estimated_monthly_missed_revenue} onSave={(v: string) => saveField(selected.id, 'mjr_estimated_monthly_missed_revenue', Number(v))} type="number" />
                  <textarea className="input" rows={4} defaultValue={selected.mjr_notes || ''} onBlur={e => saveField(selected.id, 'mjr_notes', e.target.value)} placeholder="MJR Notes..." style={{ resize: 'vertical' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                    <button className="btn-primary" onClick={() => navigate('/studio', { state: { prospect: selected } })}>Generate MJR →</button>
                  </div>
                </>
              )}

              <div style={{ marginTop: 'auto', paddingTop: 20, borderTop: '1px solid var(--border2)' }}>
                <button className="btn-ghost" onClick={() => deleteProspect(selected.id)} style={{ width: '100%', color: '#ff4d4d', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Trash2 size={14} /> Delete Prospect
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => setShowAdd(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
          <div style={{ position: 'relative', background: 'var(--bg2)', padding: 28, width: 480, borderRadius: 8 }}>
             <div style={{ fontFamily: 'Playfair Display', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Add Prospect</div>
             <AddProspectForm onSave={(p: Prospect) => { setProspects([p, ...prospects]); setShowAdd(false); toast('Prospect added') }} onCancel={() => setShowAdd(false)} />
          </div>
        </div>
      )}
    </div>
  )
}

function F({ label, field, value, onSave, type = 'text' }: any) {
  return (
    <div>
      <div className="label">{label}</div>
      <input className="input" type={type} defaultValue={value ?? ''} key={`${field}-${value}`} onBlur={e => { if (String(e.target.value) !== String(value ?? '')) onSave(e.target.value) }} />
    </div>
  )
}

function AddProspectForm({ onSave, onCancel }: any) {
  const [name, setName] = useState('')
  async function save() {
    if (!name) return
    const { data } = await supabase.from('prospects').insert({ business_name: name, status: 'new', city: 'Cape Town' }).select().single()
    if (data) onSave(data)
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input className="input" placeholder="Business Name" value={name} onChange={e => setName(e.target.value)} />
      <button className="btn-primary" onClick={save}>Add Prospect →</button>
      <button className="btn-ghost" onClick={onCancel}>Cancel</button>
    </div>
  )
}
