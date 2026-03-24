import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Sop } from '../lib/supabase'
import { formatDate } from '../lib/utils'
import { Edit2, ChevronRight, Save, X } from 'lucide-react'
import { useToast } from '../lib/toast'
import ReactMarkdown from 'react-markdown'
import { useAuth } from '../lib/auth'

const CATEGORIES = ['Cold Outreach', 'Pipeline & Sales', 'Proof Sprint', 'Client Delivery']
const STATUS_COLORS: Record<string, string> = {
  draft:    'badge-new',
  active:   'badge-clients',
  archived: 'badge-lost',
}

export default function Sops() {
  const { role }                  = useAuth()
  const [sops, setSops]           = useState<Sop[]>([])
  const [selected, setSelected]   = useState<Sop | null>(null)
  const [editing, setEditing]     = useState(false)
  const [content, setContent]     = useState('')
  const [saving, setSaving]       = useState(false)
  const [filter, setFilter]       = useState('')
  const { toast }                 = useToast()

  const canEdit = role === 'admin'

  useEffect(() => { 
    load() 
  }, [role])

async function load() {
  let q = supabase.from('sops').select('*').order('sop_number')

  // Role-Based Category Filtering
  if (role === 'delivery') {
    // Delivery only sees the technical fulfillment categories
    q = q.in('category', ['Proof Sprint', 'Client Delivery', 'General'])
  } else if (role === 'distribution') {
    // Distribution only sees the front-end acquisition categories
    q = q.in('category', ['Cold Outreach', 'Pipeline & Sales', 'General'])
  }

  if (role !== 'admin') {
    // Everyone except Admin only sees 'active' (published) SOPs
    q = q.eq('status', 'active')
  }

  const { data } = await q
  
  // Mapping logic remains the same...
  const normalized: Sop[] = (data || []).map((s: any) => ({
    ...s,
    content: s.content || '',
    version: s.version || '1.0',
    category: s.category || '',
    status: s.status || 'draft',
    title: s.title || 'Untitled SOP',
  }))

  setSops(normalized)
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
      .update({ 
        content, 
        updated_at: new Date().toISOString(), 
        last_reviewed_at: new Date().toISOString().split('T')[0] 
      })
      .eq('id', selected.id)
      .select().single()

    if (error || !data) { 
      toast('Save failed', 'error'); 
      setSaving(false); 
      return 
    }

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

  const filtered     = sops.filter(s => !filter || s.category === filter)
  const activeCount  = sops.filter(s => s.status === 'active').length
  const draftCount   = sops.filter(s => s.status === 'draft').length

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, height: 'calc(100vh - 120px)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 4 }}>
          <div>
            <span className="stat-num" style={{ fontSize: 22 }}>{activeCount}</span>
            <div style={{ fontFamily: 'DM Mono', fontSize: 9, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Active</div>
          </div>
          {canEdit && (
            <div>
              <span className="stat-num" style={{ fontSize: 22, color: 'var(--grey)' }}>{draftCount}</span>
              <div style={{ fontFamily: 'DM Mono', fontSize: 9, color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Draft</div>
            </div>
          )}
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
                <span className={`badge ${STATUS_COLORS[s.status!]}`}>{s.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selected ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexShrink: 0 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--grey2)' }}>SOP {String(selected.sop_number).padStart(2,'0')}</span>
                  <span className={`badge ${STATUS_COLORS[selected.status!]}`}>{selected.status}</span>
                </div>
                <div style={{ fontFamily: 'Playfair Display', fontSize: 22, fontWeight: 700 }}>{selected.title}</div>
                <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--grey)', marginTop: 4 }}>
                  {selected.category} · v{selected.version || '1.0'} · last reviewed {selected.last_reviewed_at ? formatDate(selected.last_reviewed_at) : 'never'}
                </div>
              </div>
              {canEdit && (
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
              )}
            </div>

            {editing && canEdit ? (
              <textarea value={content} onChange={e => setContent(e.target.value)}
                style={{ flex: 1, background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 6, color: 'var(--white)', fontFamily: 'Barlow', fontSize: 14, lineHeight: 1.8, padding: '16px', resize: 'none', outline: 'none' }}
                placeholder="Write SOP content here. Use plain text or Markdown formatting.&#10;&#10;Start with: Purpose, Trigger, Steps (numbered), Outputs, Notes" />
            ) : (
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: 8 }}>
                {selected.content ? (
                  <div style={{ fontSize: 14, lineHeight: 1.9, color: 'var(--grey)' }}>
                    <ReactMarkdown
                      components={{
                        h1: ({node, ...props}) => <h1 style={{ fontSize: 26, fontWeight: 700, marginTop: 20, marginBottom: 12, color: 'var(--white)' }} {...props} />,
                        h2: ({node, ...props}) => <h2 style={{ fontSize: 22, fontWeight: 700, marginTop: 16, marginBottom: 10, color: 'var(--white)' }} {...props} />,
                        h3: ({node, ...props}) => <h3 style={{ fontSize: 18, fontWeight: 600, marginTop: 14, marginBottom: 8, color: 'var(--white)' }} {...props} />,
                        p:  ({node, ...props}) => <p style={{ marginBottom: 12 }} {...props} />,
                        ul: ({node, ...props}) => <ul style={{ marginLeft: 24, marginBottom: 12, listStyleType: 'disc' }} {...props} />,
                        ol: ({node, ...props}) => <ol style={{ marginLeft: 24, marginBottom: 12, listStyleType: 'decimal' }} {...props} />,
                        li: ({node, ...props}) => <li style={{ marginBottom: 6 }} {...props} />,
                        code: ({node, inline, ...props}: any) => inline ? (
                          <code style={{ background: 'var(--bg)', padding: '2px 6px', borderRadius: 3, fontFamily: 'DM Mono', fontSize: 12, color: 'var(--teal)' }} {...props} />
                        ) : (
                          <pre style={{ background: 'var(--bg)', padding: 12, borderRadius: 4, overflow: 'auto', marginBottom: 12, fontFamily: 'DM Mono', fontSize: 12 }} {...props} />
                        ),
                        blockquote: ({node, ...props}) => <blockquote style={{ borderLeft: '4px solid var(--teal)', paddingLeft: 12, marginLeft: 0, marginBottom: 12, color: 'var(--grey2)', fontStyle: 'italic' }} {...props} />,
                        a: ({node, ...props}: any) => <a style={{ color: 'var(--teal)', textDecoration: 'underline' }} {...props} />,
                        hr: ({node, ...props}) => <hr style={{ borderTop: '1px solid var(--border2)', marginBottom: 12, marginTop: 12 }} {...props} />,
                        table: ({node, ...props}) => <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }} {...props} />,
                        th: ({node, ...props}) => <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid var(--border2)', fontWeight: 600 }} {...props} />,
                        td: ({node, ...props}) => <td style={{ padding: 8, borderBottom: '1px solid var(--border2)' }} {...props} />,
                      }}
                    >
                      {selected.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="empty-state" style={{ paddingTop: 40 }}>
                    <h3>No content yet</h3>
                    {canEdit
                      ? <><p>Click Edit to write this SOP.</p><button className="btn-secondary" onClick={() => setEditing(true)}>Write SOP</button></>
                      : <p>This SOP hasn't been written yet. Check back later.</p>
                    }
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <h3>Select an SOP</h3>
            <p>Choose an SOP from the list to read it.</p>
          </div>
        )}
      </div>
    </div>
  )
}