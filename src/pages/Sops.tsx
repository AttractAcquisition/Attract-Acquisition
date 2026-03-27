import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Sop } from '../lib/supabase'
import { formatDate } from '../lib/utils'
import { Edit2, ChevronRight, Save, X, Plus, Trash2, GripVertical } from 'lucide-react'
import { useToast } from '../lib/toast'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAuth } from '../lib/auth'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'

const CATEGORIES = ['Cold Outreach', 'Pipeline & Sales', 'Proof Sprint', 'Client Delivery', 'General']
const STATUS_COLORS: Record<string, string> = {
  draft:    'badge-new',
  active:   'badge-clients',
  archived: 'badge-lost',
}

export default function Sops() {
  const { role } = useAuth()
  const [sops, setSops] = useState<Sop[]>([])
  const [selected, setSelected] = useState<Sop | null>(null)
  const [editing, setEditing] = useState(false)
  const [content, setContent] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('')
  const { toast } = useToast()

  const canEdit = role === 'admin'

  useEffect(() => { 
    load() 
  }, [role])

  async function load() {
    let q = supabase.from('sops').select('*').order('sop_number', { ascending: true })

    if (role === 'delivery') {
      q = q.in('category', ['Proof Sprint', 'Client Delivery', 'General'])
    } else if (role === 'distribution') {
      q = q.in('category', ['Cold Outreach', 'Pipeline & Sales', 'General'])
    }

    if (role !== 'admin') {
      q = q.eq('status', 'active')
    }

    const { data } = await q
    
    const normalized: Sop[] = (data || []).map((s: any) => ({
      ...s,
      content: s.content || '',
      version: s.version || '1.0',
      category: s.category || 'General',
      status: s.status || 'draft',
      title: s.title || 'Untitled SOP',
    }))

    setSops(normalized)
  }

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !canEdit) return;

    const items = Array.from(filtered);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update sop_numbers based on new array index
    const updatedSops = items.map((sop, index) => ({
      ...sop,
      sop_number: index + 1
    }));

    // Optimistic UI update
    setSops(prev => {
      const others = prev.filter(p => !items.find(i => i.id === p.id));
      return [...others, ...updatedSops].sort((a, b) => (a.sop_number || 0) - (b.sop_number || 0));
    });

    // Persist to Supabase
    const { error } = await supabase
      .from('sops')
      .upsert(updatedSops.map(s => ({
        id: s.id,
        sop_number: s.sop_number,
        updated_at: new Date().toISOString()
      })));

    if (error) {
      toast('Failed to update order', 'error');
      load(); // Revert on error
    } else {
      toast('Order updated');
    }
  };

  function selectSop(s: Sop) {
    setSelected(s)
    setContent(s.content || '')
    setEditTitle(s.title || '')
    setEditCategory(s.category || 'General')
    setEditing(false)
  }

  async function createNewSop() {
    if (!canEdit) return
    const nextNum = sops.length > 0 ? Math.max(...sops.map(s => s.sop_number || 0)) + 1 : 1
    
    const newSop = {
      title: 'New Strategic SOP',
      category: 'General',
      status: 'draft',
      content: '# New SOP\nStart writing here...',
      sop_number: nextNum,
      version: '1.0',
      last_reviewed_at: new Date().toISOString().split('T')[0]
    }

    const { data, error } = await supabase.from('sops').insert(newSop).select().single()
    if (error) {
      toast('Failed to create SOP', 'error')
      return
    }

    setSops(prev => [...prev, data])
    selectSop(data)
    setEditing(true)
    toast('New Draft Created')
  }

  async function deleteSop() {
    if (!selected || !canEdit) return
    if (!confirm(`Are you sure you want to delete SOP #${selected.sop_number}?`)) return

    const { error } = await supabase.from('sops').delete().eq('id', selected.id)
    if (error) {
      toast('Delete failed', 'error')
      return
    }

    setSops(prev => prev.filter(s => s.id !== selected.id))
    setSelected(null)
    setEditing(false)
    toast('SOP Deleted')
  }

  async function saveContent() {
    if (!selected) return
    setSaving(true)
    
    const updates = {
      content,
      title: editTitle,
      category: editCategory,
      updated_at: new Date().toISOString(), 
      last_reviewed_at: new Date().toISOString().split('T')[0] 
    }

    const { data, error } = await supabase.from('sops')
      .update(updates)
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
    toast('SOP updated ✓')
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
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, height: 'calc(100vh - 120px)' }}>
      {/* Sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4 }}>
          <div style={{ display: 'flex', gap: 16 }}>
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
          {canEdit && (
            <button className="btn-primary" onClick={createNewSop} style={{ padding: '6px', borderRadius: 4 }}>
              <Plus size={18} />
            </button>
          )}
        </div>

        <select className="input" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="sops-list">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {filtered.map((s, index) => (
                    <Draggable key={s.id} draggableId={s.id} index={index} isDragDisabled={!canEdit}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          onClick={() => selectSop(s)}
                          style={{ 
                            ...provided.draggableProps.style,
                            padding: '10px 12px', 
                            borderRadius: 4, 
                            cursor: 'pointer', 
                            border: `1px solid ${selected?.id === s.id ? 'var(--teal)' : 'var(--border2)'}`, 
                            background: snapshot.isDragging ? 'var(--bg3)' : (selected?.id === s.id ? 'var(--teal-faint)' : 'var(--bg2)'), 
                            transition: 'all 0.15s',
                            opacity: snapshot.isDragging ? 0.8 : 1
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            {canEdit && (
                              <div {...provided.dragHandleProps} style={{ cursor: 'grab', color: 'var(--grey2)' }}>
                                <GripVertical size={14} />
                              </div>
                            )}
                            <span style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--grey2)', minWidth: 24 }}>#{String(s.sop_number).padStart(2,'0')}</span>
                            <span style={{ fontSize: 13, fontWeight: 500, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</span>
                            <ChevronRight size={12} color="var(--grey2)" />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: canEdit ? 54 : 32 }}>
                            <span style={{ fontFamily: 'DM Mono', fontSize: 9, color: 'var(--grey2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.category}</span>
                            <span className={`badge ${STATUS_COLORS[s.status!]}`}>{s.status}</span>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>

      {/* Content Area */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selected ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexShrink: 0 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--grey2)' }}>SOP {String(selected.sop_number).padStart(2,'0')}</span>
                  <span className={`badge ${STATUS_COLORS[selected.status!]}`}>{selected.status}</span>
                </div>
                
                {editing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                    <input className="input" value={editTitle} onChange={e => setEditTitle(e.target.value)} style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Playfair Display' }} placeholder="SOP Title" />
                    <select className="input" value={editCategory} onChange={e => setEditCategory(e.target.value)} style={{ width: 'fit-content', fontSize: 11 }}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                ) : (
                  <>
                    <div style={{ fontFamily: 'Playfair Display', fontSize: 22, fontWeight: 700 }}>{selected.title}</div>
                    <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--grey)', marginTop: 4 }}>
                      {selected.category} · v{selected.version || '1.0'} · last reviewed {selected.last_reviewed_at ? formatDate(selected.last_reviewed_at) : 'never'}
                    </div>
                  </>
                )}
              </div>

              {canEdit && (
                <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginLeft: 16 }}>
                  {!editing ? (
                    <>
                      <button className="btn-ghost" onClick={deleteSop} style={{ color: 'var(--red)', padding: '7px' }} title="Delete SOP">
                        <Trash2 size={14} />
                      </button>
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
                  ) : (
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
                placeholder="Write SOP content here (Markdown supported)..." />
            ) : (
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: 8 }}>
                {selected.content ? (
                  <div className="markdown-body" style={{ fontSize: 14, lineHeight: 1.9, color: 'var(--grey)' }}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({node, ...props}) => <h1 style={{ fontSize: 26, fontWeight: 700, marginTop: 20, marginBottom: 12, color: 'var(--white)' }} {...props} />,
                        h2: ({node, ...props}) => <h2 style={{ fontSize: 22, fontWeight: 700, marginTop: 16, marginBottom: 10, color: 'var(--white)' }} {...props} />,
                        h3: ({node, ...props}) => <h3 style={{ fontSize: 18, fontWeight: 600, marginTop: 14, marginBottom: 8, color: 'var(--white)' }} {...props} />,
                        p: ({node, ...props}) => <div style={{ marginBottom: 12 }} {...props} />,
                        ul: ({node, ...props}) => <ul style={{ marginLeft: 24, marginBottom: 12, listStyleType: 'disc' }} {...props} />,
                        ol: ({node, ...props}) => <ol style={{ marginLeft: 24, marginBottom: 12, listStyleType: 'decimal' }} {...props} />,
                        li: ({node, ...props}) => <li style={{ marginBottom: 6 }} {...props} />,
                        code: ({node, inline, children, ...props}: any) => inline ? (
                          <code style={{ background: 'var(--bg)', padding: '2px 6px', borderRadius: 3, fontFamily: 'DM Mono', fontSize: 12, color: 'var(--teal)' }} {...props}>{children}</code>
                        ) : (
                          <pre style={{ background: 'var(--bg)', padding: 12, borderRadius: 4, overflow: 'auto', marginBottom: 12, fontFamily: 'DM Mono', fontSize: 12, whiteSpace: 'pre-wrap' }} {...props}>{children}</pre>
                        ),
                        table: ({node, ...props}) => <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20, border: '1px solid var(--border2)' }} {...props} />,
                        thead: ({node, ...props}) => <thead style={{ background: 'var(--bg2)' }} {...props} />,
                        th: ({node, ...props}) => <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '2px solid var(--border2)', fontWeight: 600, color: 'var(--white)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }} {...props} />,
                        td: ({node, ...props}) => <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border2)', fontSize: 13 }} {...props} />,
                      }}
                    >
                      {selected.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="empty-state" style={{ paddingTop: 40 }}>
                    <h3>No content yet</h3>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <h3 style={{ color: 'var(--grey2)' }}>Select an SOP from the library to view or edit system protocols</h3>
          </div>
        )}
      </div>
    </div>
  )
}
