import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Prospect } from '../lib/supabase'
import { formatDate, tierLabel, statusBadge } from '../lib/utils'
import { Search, Plus, RefreshCw, X, ChevronRight } from 'lucide-react'
import { useToast } from '../lib/toast'

const VERTICALS = ['Auto Detailing','Pet Grooming','Trailer Manufacturing','Home Renovation','Landscaping','Plumbing','Electrical','HVAC','Personal Fitness','Industrial','Logistics','Other']
const STATUSES  = ['new','contacted','mjr_sent','call_booked','sprint_active','closed_won','closed_lost','archived']

export default function Prospects() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filterTier, setFilterTier]         = useState('')
  const [filterStatus, setFilterStatus]     = useState('')
  const [filterVertical, setFilterVertical] = useState('')
  const [selected, setSelected]   = useState<Prospect | null>(null)
  const [showAdd, setShowAdd]     = useState(false)
  const { toast }                 = useToast()

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

  const filtered = prospects.filter(p => {
    if (!search) return true
    const q = search.toLowerCase()
    return [p.business_name, p.owner_name, p.suburb, p.vertical].some(f => f?.toLowerCase().includes(q))
  })

  const total    = prospects.length
  const tier3    = prospects.filter(p => p.icp_tier === '★★★').length
  const tier2    = prospects.filter(p => p.icp_tier === '★★').length

  async function updateScore(id: string, field: string, val: number) {
    await supabase.from('prospects').update({ [field]: val }).eq('id', id)
    setProspects(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p))
    setSelected(prev => prev ? { ...prev, [field]: val } : prev)
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from('prospects').update({ status }).eq('id', id)
    if (error) { toast('Update failed', 'error'); return }
    setProspects(prev => prev.map(p => p.id === id ? { ...p, status: status as any } : p))
    setSelected(prev => prev ? { ...prev, status: status as any } : prev)
    toast('Status updated')
  }

  return (
    <div>
      {/* KPI bar */}
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

      {/* Controls */}
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

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading
          ? <div style={{ padding: 24 }}>{[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 44, marginBottom: 8 }} />)}</div>
          : filtered.length === 0
            ? (
              <div className="empty-state">
                <h3>No prospects yet</h3>
                <p>Add your first prospect or run Apify to scrape Cape Town businesses.</p>
                <button className="btn-primary" onClick={() => setShowAdd(true)}>Add Prospect</button>
              </div>
            )
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
                    {filtered.map(p => {
                      const tier = tierLabel(p.icp_tier)
                      const stat = statusBadge(p.status)
                      return (
                        <tr key={p.id} onClick={() => setSelected(p)}>
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

      {/* Slide-over */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', justifyContent: 'flex-end' }}>
          <div onClick={() => setSelected(null)} style={{ flex: 1, background: 'rgba(0,0,0,0.5)' }} />
          <div style={{ width: 480, background: 'var(--bg2)', borderLeft: '1px solid var(--border2)', overflowY: 'auto', padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <div style={{ fontFamily: 'Playfair Display', fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{selected.business_name}</div>
                <div style={{ fontSize: 13, color: 'var(--grey)' }}>{selected.suburb}, {selected.city || 'Cape Town'}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--grey)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div className="section-label">ICP Scoring</div>
            {[
              { label: 'Visual Transformability', field: 'score_visual_transformability' },
              { label: 'Ticket Size (R5k+)',       field: 'score_ticket_size' },
              { label: 'Owner Accessibility',      field: 'score_owner_accessibility' },
              { label: 'Digital Weakness',         field: 'score_digital_weakness' },
              { label: 'Growth Hunger',            field: 'score_growth_hunger' },
            ].map(s => (
              <div key={s.field} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: 'var(--grey)' }}>{s.label}</span>
                  <span style={{ fontFamily: 'DM Mono', fontSize: 13, color: 'var(--teal)' }}>
                    {(selected as any)[s.field] ?? '—'}/5
                  </span>
                </div>
                <input type="range" min={1} max={5} value={(selected as any)[s.field] || 1}
                  onChange={e => updateScore(selected.id, s.field, Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--teal)' }}
                />
              </div>
            ))}

            <div style={{ padding: '12px 0', borderTop: '1px solid var(--border2)', borderBottom: '1px solid var(--border2)', marginBottom: 20, marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'DM Mono', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--grey)' }}>Total Score</span>
                <span style={{ fontFamily: 'DM Mono', fontSize: 16, color: 'var(--teal)' }}>
                  {selected.icp_total_score ?? '—'}/25 · {tierLabel(selected.icp_tier).label}
                </span>
              </div>
            </div>

            <div className="section-label">Pipeline Status</div>
            <select className="input" style={{ marginBottom: 20 }}
              value={selected.status} onChange={e => updateStatus(selected.id, e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
            </select>

            <div className="section-label">MJR Data</div>
            <div style={{ marginBottom: 8 }}>
              <div className="label">Estimated monthly missed revenue</div>
              <input className="input" type="number" placeholder="R 0"
                defaultValue={selected.mjr_estimated_monthly_missed_revenue || ''}
                onBlur={async e => {
                  if (!e.target.value) return
                  await supabase.from('prospects').update({ mjr_estimated_monthly_missed_revenue: Number(e.target.value) }).eq('id', selected.id)
                  toast('MJR data saved')
                }}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <div className="label">Observable gap / notes</div>
              <textarea className="input" rows={3} placeholder="What did you observe about their digital presence?"
                defaultValue={selected.mjr_notes || ''}
                onBlur={async e => {
                  await supabase.from('prospects').update({ mjr_notes: e.target.value }).eq('id', selected.id)
                }}
                style={{ resize: 'vertical' }}
              />
            </div>

            <button className="btn-primary" style={{ width: '100%', marginBottom: 10 }}>
              Generate MJR →
            </button>
            {selected.status === 'closed_won' && (
              <button className="btn-secondary" style={{ width: '100%' }}>Move to Client →</button>
            )}
          </div>
        </div>
      )}

      {/* Add Prospect Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => setShowAdd(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
          <div style={{ position: 'relative', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 8, padding: 28, width: 480, zIndex: 1 }}>
            <div style={{ fontFamily: 'Playfair Display', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Add Prospect</div>
            <AddProspectForm onSave={p => { setProspects(prev => [p, ...prev]); setShowAdd(false); toast('Prospect added') }} onCancel={() => setShowAdd(false)} />
          </div>
        </div>
      )}
    </div>
  )
}

// Add Prospect Form Component
function AddProspectForm({ onSave, onCancel }: { onSave: (p: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState({ business_name: '', owner_name: '', vertical: '', suburb: '', phone: '', whatsapp: '' })
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!form.business_name) return
    setSaving(true)
    const { data, error } = await supabase.from('prospects').insert({ ...form, status: 'new', city: 'Cape Town' }).select().single()
    setSaving(false)
    if (error || !data) return
    onSave(data)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[
        { label: 'Business Name *', field: 'business_name', placeholder: 'e.g. Cape Town Auto Detailing' },
        { label: 'Owner Name',      field: 'owner_name',    placeholder: 'e.g. John Smith' },
        { label: 'Suburb',          field: 'suburb',        placeholder: 'e.g. Woodstock' },
        { label: 'Phone',           field: 'phone',         placeholder: '+27 82 000 0000' },
        { label: 'WhatsApp',        field: 'whatsapp',      placeholder: '+27 82 000 0000' },
      ].map(f => (
        <div key={f.field}>
          <div className="label">{f.label}</div>
          <input className="input" placeholder={f.placeholder} value={(form as any)[f.field]}
            onChange={e => setForm(prev => ({ ...prev, [f.field]: e.target.value }))} />
        </div>
      ))}
      <div>
        <div className="label">Vertical</div>
        <select className="input" value={form.vertical} onChange={e => setForm(prev => ({ ...prev, vertical: e.target.value }))}>
          <option value="">Select vertical</option>
          {VERTICALS.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button className="btn-primary" onClick={save} disabled={saving || !form.business_name} style={{ flex: 1 }}>
          {saving ? 'Saving...' : 'Add Prospect →'}
        </button>
        <button className="btn-ghost" onClick={onCancel} style={{ flex: 1 }}>Cancel</button>
      </div>
    </div>
  )
}