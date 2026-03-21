import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Sop } from '../lib/supabase'
import { formatDate } from '../lib/utils'
import { Edit2, ChevronRight, Save, X } from 'lucide-react'
import { useToast } from '../lib/toast'

const CATEGORIES = ['Cold Outreach', 'Pipeline & Sales', 'Proof Sprint', 'Client Delivery']
const STATUS_COLORS: Record<string, string> = {
  draft:    'badge-new',
  active:   'badge-clients',
  archived: 'badge-lost',
}

export default function Sops() {
  const [sops, setSops]         = useState<Sop[]>([])
  const [selected, setSelected] = useState<Sop | null>(null)
  const [editing, setEditing]   = useState(false)
  const [content, setContent]   = useState('')
  const [saving, setSaving]     = useState(false)
  const [filter, setFilter]     = useState('')
  const { toast }               = useToast()

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('sops').select('*').order('sop_number')
    setSops(data || [])
  }

  function selectSop(s: Sop) {
    setSelected(s)
    setContent(s.content || '')
    setEditing(false)
  }

  async function saveContent() {
    if (!selected) return
    setSaving(true)
    const { data, error } = await supabase.from('sops')
      .update({ content, updated_at: new Date().toISOString(), last_reviewed_at: new Date().toISOString().split('T')[0] })
      .eq('id', selected.id).select().single()
    if (error || !data) { toast('Save failed', 'error'); setSaving(false); return }
    setSops(prev => prev.map(s => s.id === data.id ? data : s))
    setSelected(data)
    setEditing(false)
    setSaving(false)
    toast('SOP saved ✓')
  }

  async function setStatus(status: string) {
    if (!selected) return
    const { data } = await supabase.from('sops').update({ status }).eq('id', selected.id).select().single()
    if (data) {
      setSops(prev => prev.map(s => s.id === data.id ? data : s))
      setSelected(data)
      toast(`Status set to ${status}`)
    }
  }

  const filtered = sops.filter(s => !filter || s.category === filter)
  const activeCount = sops.filter(s => s.status === 'active').length
  const draftCount  = sops.filter(s => s.status === 'draft').length

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, height: 'calc(100vh - 120px)' }}>
      {/* Left panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 4 }}>
          <div><span className="stat-num" style={{ fontSize: 22 }}>{activeCount}</span><div style={{ fontFamily: 'DM Mono', fontSize: 9, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Active</div></div>
          <div><span className="stat-num" style={{ fontSize: 22, color: 'var(--grey)' }}>{draftCount}</span><div style={{ fontFamily: 'DM Mono', fontSize: 9, color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Draft</div></div>
        </div>

        <select className="input" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {filtered.map(s => (
            <div key={s.id} onClick={() => selectSop(s)}
              style={{ padding: '10px 12px', borderRadius: 4, cursor: 'pointer', border: `1px solid ${selected?.id === s.id ? 'var(--teal)' : 'var(--border2)'}`, background: selected?.id === s.id ? 'var(--teal-faint)' : 'var(--bg2)', transition: 'all 0.15s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--grey2)', minWidth: 24 }}>#{String(s.sop_number).padStart(2,'0')}</span>
                <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{s.title}</span>
                <ChevronRight size={12} color="var(--grey2)" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 32 }}>
                <span style={{ fontFamily: 'DM Mono', fontSize: 9, color: 'var(--grey2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.category}</span>
                <span className={`badge ${STATUS_COLORS[s.status] || 'badge-new'}`}>{s.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right editor */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selected ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexShrink: 0 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--grey2)' }}>SOP {String(selected.sop_number).padStart(2,'0')}</span>
                  <span className={`badge ${STATUS_COLORS[selected.status]}`}>{selected.status}</span>
                </div>
                <div style={{ fontFamily: 'Playfair Display', fontSize: 22, fontWeight: 700 }}>{selected.title}</div>
                <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--grey)', marginTop: 4 }}>
                  {selected.category} · v{selected.version || '1.0'} · last reviewed {selected.last_reviewed_at ? formatDate(selected.last_reviewed_at) : 'never'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {!editing && (
                  <>
                    {selected.status === 'draft' && (
                      <button className="btn-primary" onClick={() => setStatus('active')} style={{ fontSize: 11, padding: '7px 14px' }}>Publish →</button>
                    )}
                    {selected.status === 'active' && (
                      <button className="btn-ghost" onClick={() => setStatus('archived')} style={{ fontSize: 11, padding: '7px 14px' }}>Archive</button>
                    )}
                    <button className="btn-secondary" onClick={() => setEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                      <Edit2 size={11} /> Edit
                    </button>
                  </>
                )}
                {editing && (
                  <>
                    <button className="btn-primary" onClick={saveContent} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                      <Save size={11} /> {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button className="btn-ghost" onClick={() => { setEditing(false); setContent(selected.content || '') }} style={{ fontSize: 11 }}>
                      <X size={11} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {editing ? (
              <textarea value={content} onChange={e => setContent(e.target.value)}
                style={{ flex: 1, background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 6, color: 'var(--white)', fontFamily: 'Barlow', fontSize: 14, lineHeight: 1.8, padding: '16px', resize: 'none', outline: 'none' }}
                placeholder="Write SOP content here. Use plain text or Markdown formatting.&#10;&#10;Start with: Purpose, Trigger, Steps (numbered), Outputs, Notes" />
            ) : (
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {selected.content ? (
                  <div style={{ fontSize: 14, lineHeight: 1.9, color: 'var(--white)', whiteSpace: 'pre-wrap', fontFamily: 'Barlow' }}>
                    {selected.content}
                  </div>
                ) : (
                  <div className="empty-state" style={{ paddingTop: 40 }}>
                    <h3>No content yet</h3>
                    <p>Click Edit to write this SOP. Start with the trigger, steps, and expected output.</p>
                    <button className="btn-secondary" onClick={() => setEditing(true)}>Write SOP</button>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <h3>Select an SOP</h3>
            <p>Choose an SOP from the list to read or edit it. 12 SOPs are pre-loaded — publish them as you write each one.</p>
          </div>
        )}
      </div>
    </div>
  )
}