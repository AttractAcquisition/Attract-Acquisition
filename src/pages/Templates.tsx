import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/utils'
import { Plus, Copy, Save } from 'lucide-react'
import { useToast } from '../lib/toast'

// Updated interface to match Supabase's nullable return types
interface Template { 
  id: string; 
  created_at: string | null; 
  updated_at: string | null; 
  title: string; 
  category: string | null; 
  content: string | null; 
  variables: string[] | null; 
  char_count: number | null 
}

const CATEGORIES = [
  { key: 'whatsapp',     label: 'WhatsApp' },
  { key: 'call_script',  label: 'Call Scripts' },
  { key: 'contract',     label: 'Contracts' },
  { key: 'report',       label: 'Report Templates' },
  { key: 'va_brief',     label: 'VA Briefs' },
]

export default function Templates() {
  const [templates, setTemplates]   = useState<Template[]>([])
  const [catFilter, setCatFilter]   = useState('whatsapp')
  const [selected, setSelected]     = useState<Template | null>(null)
  const [editForm, setEditForm]     = useState({ title: '', category: 'whatsapp', content: '' })
  const [isNew, setIsNew]           = useState(false)
  const [saving, setSaving]         = useState(false)
  const { toast }                   = useToast()

  useEffect(() => { load() }, [catFilter])

  async function load() {
    const { data } = await supabase
      .from('templates')
      .select('*')
      .eq('category', catFilter)
      .order('updated_at', { ascending: false })
    
    setTemplates((data as Template[]) || [])
    setSelected(null)
    setIsNew(false)
  }

  function selectTemplate(t: Template) {
    setSelected(t)
    setEditForm({ 
      title: t.title || '', 
      category: t.category || 'whatsapp', 
      content: t.content || '' 
    })
    setIsNew(false)
  }

  function newTemplate() {
    setSelected(null)
    setEditForm({ title: '', category: catFilter, content: '' })
    setIsNew(true)
  }

  async function save() {
    if (!editForm.title || !editForm.content) { 
      toast('Title and content required', 'error')
      return 
    }
    setSaving(true)
    
    const payload = { 
      ...editForm, 
      char_count: editForm.content.length, 
      updated_at: new Date().toISOString() 
    }

    if (isNew) {
      const { data, error } = await supabase.from('templates').insert(payload).select().single()
      if (error || !data) { 
        toast('Failed to save', 'error')
        setSaving(false)
        return 
      }
      setTemplates(prev => [data as Template, ...prev])
      setSelected(data as Template)
      setIsNew(false)
    } else if (selected) {
      const { data, error } = await supabase.from('templates').update(payload).eq('id', selected.id).select().single()
      if (error || !data) { 
        toast('Failed to save', 'error')
        setSaving(false)
        return 
      }
      setTemplates(prev => prev.map(t => t.id === data.id ? (data as Template) : t))
      setSelected(data as Template)
    }
    setSaving(false)
    toast('Template saved ✓')
  }

  function copyToClipboard() {
    if (!editForm.content) return
    navigator.clipboard.writeText(editForm.content)
    toast('Copied to clipboard')
  }

  const charCount = editForm.content?.length || 0
  const charColor = charCount > 1024 ? 'var(--red)' : charCount > 900 ? 'var(--amber)' : 'var(--grey)'

  const vars = [...new Set(editForm.content?.match(/\{[^}]+\}/g) || [])]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, height: 'calc(100vh - 120px)' }}>
      {/* Left panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Category tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {CATEGORIES.map(c => (
            <button key={c.key} onClick={() => setCatFilter(c.key)}
              style={{ background: catFilter === c.key ? 'var(--teal-faint)' : 'transparent', border: `1px solid ${catFilter === c.key ? 'var(--teal-border)' : 'transparent'}`, borderRadius: 4, padding: '9px 12px', textAlign: 'left', cursor: 'pointer', fontFamily: 'Barlow', fontSize: 13, color: catFilter === c.key ? 'var(--teal)' : 'var(--grey)', transition: 'all 0.15s' }}>
              {c.label}
              <span style={{ float: 'right', fontFamily: 'DM Mono', fontSize: 11, color: 'var(--grey2)' }}>
                {templates.filter(t => t.category === c.key).length || ''}
              </span>
            </button>
          ))}
        </div>

        <button className="btn-secondary" onClick={newTemplate} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Plus size={12} /> New Template
        </button>

        {/* Template list */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {templates.map(t => (
            <div key={t.id} onClick={() => selectTemplate(t)}
              style={{ padding: '10px 12px', borderRadius: 4, cursor: 'pointer', border: `1px solid ${selected?.id === t.id ? 'var(--teal)' : 'var(--border2)'}`, background: selected?.id === t.id ? 'var(--teal-faint)' : 'var(--bg2)', transition: 'all 0.15s' }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3 }}>{t.title}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--grey2)' }}>{t.char_count || 0} chars</span>
                <span style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--grey2)' }}>{formatDate(t.updated_at || t.created_at || '')}</span>
              </div>
            </div>
          ))}
          {templates.length === 0 && (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--grey)', fontSize: 12, fontFamily: 'DM Mono' }}>No templates in this category</div>
          )}
        </div>
      </div>

      {/* Right editor */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {(selected || isNew) ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, marginRight: 16 }}>
                <div className="label">Template Title</div>
                <input className="input" placeholder="e.g. Cold Intro — WhatsApp" value={editForm.title} onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))} />
              </div>
              <div style={{ width: 160 }}>
                <div className="label">Category</div>
                <select className="input" value={editForm.category} onChange={e => setEditForm(prev => ({ ...prev, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
            </div>

            {vars.length > 0 && (
              <div>
                <div className="label">Variable Tags</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {vars.map(v => <span key={v} className="pill">{v}</span>)}
                </div>
              </div>
            )}

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div className="label" style={{ margin: 0 }}>Content</div>
                <span style={{ fontFamily: 'DM Mono', fontSize: 11, color: charColor }}>{charCount} / 1024 chars {charCount > 1024 ? '⚠ over WhatsApp limit' : ''}</span>
              </div>
              <textarea className="input" rows={12}
                placeholder="Write your template here. Use {business_name}, {owner_name}, {vertical}, {suburb} as variable placeholders."
                value={editForm.content}
                onChange={e => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                style={{ flex: 1, fontFamily: 'DM Mono', fontSize: 13, lineHeight: 1.7, resize: 'none' }} />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-primary" onClick={save} disabled={saving} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Save size={12} /> {saving ? 'Saving...' : 'Save Template'}
              </button>
              <button className="btn-secondary" onClick={copyToClipboard} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Copy size={12} /> Copy
              </button>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <h3>Select a template</h3>
            <p>Choose a template from the list to edit it, or create a new one.</p>
            <button className="btn-primary" onClick={newTemplate}>New Template</button>
          </div>
        )}
      </div>
    </div>
  )
}