import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Sop, AppFile } from '../lib/supabase'
import { formatDate } from '../lib/utils'
import { Edit2, ChevronRight, Save, X, Plus, Trash2, GripVertical, Upload, FileText, File, FileCode } from 'lucide-react'
import { useToast } from '../lib/toast'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAuth } from '../lib/auth'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import type { DropResult, DroppableProvided, DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd'

const CATEGORIES = ['Outreach & Pipeline', 'Missed Jobs Report', 'Strategic Plan of Action', 'Proof Sprint', 'Proof Brand', 'Authority Brand', 'General', 'Admin']
const STATUS_COLORS: Record<string, string> = {
  draft: 'badge-new',
  active: 'badge-clients',
  archived: 'badge-lost',
}

export default function Sops() {
  const { role, user } = useAuth()
  const [sops, setSops] = useState<Sop[]>([])
  const [selected, setSelected] = useState<Sop | null>(null)
  const [editing, setEditing] = useState(false)
  const [content, setContent] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('')
  const { toast } = useToast()

  const [associatedFiles, setAssociatedFiles] = useState<AppFile[]>([])
  const [uploading, setUploading] = useState(false)

  const canEdit = role === 'admin'

  useEffect(() => {
    load()
  }, [role])

  async function load() {
    let q = supabase.from('sops').select('*').order('sop_number', { ascending: true })

    if (role === 'delivery') {
      q = q.in('category', ['Proof Sprint', 'Proof Brand', 'Authority Brand', 'General'])
    } else if (role === 'distribution') {
      q = q.in('category', ['Outreach & Pipeline', 'Missed Jobs Report', 'Strategic Plan of Action', 'General'])
    }

    if (role !== 'admin') {
      q = q.eq('status', 'active')
    }

    const { data: sopsData } = await q

    const normalizedSops: Sop[] = (sopsData || []).map(s => ({
      ...s,
      content: s.content || '',
      version: s.version || '1.0',
      category: s.category || 'General',
      status: s.status || 'draft',
      title: s.title || 'Untitled SOP',
      files: [], 
    }))

    const { data: filesData, error: filesError } = await supabase
      .from('app_files')
      .select('*')

    if (filesError) {
      console.error('Error fetching files:', filesError)
      toast('Failed to load associated files', 'error')
    }

    const sopsWithFiles = normalizedSops.map(sop => ({
      ...sop,
      files: (filesData || []).filter(file => file.associated_sop_id === sop.id)
    }))

    setSops(sopsWithFiles)
  }

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !canEdit) return

    const items = Array.from(filtered)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    const updatedSops = items.map((sop, index) => ({
      ...sop,
      sop_number: index + 1
    }))

    setSops(prev => {
      const others = prev.filter(p => !updatedSops.some(f => f.id === p.id))
      const combined = [...others, ...updatedSops]
      combined.sort((a, b) => (a.sop_number || 0) - (b.sop_number || 0))
      return combined
    })

    // Stripping 'files' before upsert as it's a joined relation, not a column
    const sopsForDb = updatedSops.map(({ files, ...rest }) => ({
        ...rest,
        updated_at: new Date().toISOString()
    }))

    const { error } = await supabase
      .from('sops')
      .upsert(sopsForDb, { onConflict: 'id' })

    if (error) {
      toast('Failed to update order', 'error')
      load()
    } else {
      toast('Order updated')
    }
  }

  function selectSop(s: Sop) {
    setSelected(s)
    setContent(s.content || '')
    setEditTitle(s.title || '')
    setEditCategory(s.category || 'General')
    setEditing(false)
    setAssociatedFiles(s.files || [])
  }

  async function createNewSop() {
    if (!canEdit) return
    const nextNum = sops.length > 0 ? Math.max(...sops.map(s => s.sop_number || 0)) + 1 : 1

    const newSopData = {
      title: 'New Strategic SOP',
      category: 'General',
      status: 'draft',
      content: '# New SOP\nStart writing here...',
      sop_number: nextNum,
      version: '1.0',
      last_reviewed_at: new Date().toISOString().split('T')[0]
    }

    const { data, error } = await supabase.from('sops').insert(newSopData).select().single()
    if (error || !data) {
      toast('Failed to create SOP', 'error')
      return
    }

    const createdSop: Sop = { ...data, files: [] }
    setSops(prev => [...prev, createdSop])
    selectSop(createdSop)
    setEditing(true)
    toast('New Draft Created')
  }

  async function deleteSop() {
    if (!selected || !canEdit) return
    if (!confirm(`Are you sure you want to delete SOP #${selected.sop_number}? This will also delete all associated files.`)) return

    for (const file of associatedFiles) {
      await handleFileDelete(file)
    }

    const { error } = await supabase.from('sops').delete().eq('id', selected.id)
    if (error) {
      toast('Delete failed', 'error')
      return
    }

    setSops(prev => prev.filter(s => s.id !== selected.id))
    setSelected(null)
    setEditing(false)
    setAssociatedFiles([])
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
      toast('Save failed', 'error')
      setSaving(false)
      return
    }

    const updatedSop: Sop = { ...data, files: associatedFiles }
    setSops(prev => prev.map(s => s.id === updatedSop.id ? updatedSop : s))
    setSelected(updatedSop)
    setEditing(false)
    setSaving(false)
    toast('SOP updated ✓')
  }

  async function setStatus(status: string) {
    if (!selected) return
    const { data } = await supabase.from('sops').update({ status }).eq('id', selected.id).select().single()
    if (data) {
      const updatedSop: Sop = { ...data, files: associatedFiles }
      setSops(prev => prev.map(s => s.id === updatedSop.id ? updatedSop : s))
      setSelected(updatedSop)
      toast(`Status set to ${status}`)
    }
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    if (!selected || !canEdit || !event.target.files || event.target.files.length === 0) return

    setUploading(true)
    const file = event.target.files[0]
    const fileExtension = file.name.split('.').pop()
    const fileName = `${Date.now()}-${file.name}`
    const filePath = `sop_files/${selected.id}/${fileName}`

    try {
      const { error: storageError } = await supabase.storage
        .from('sop-files') // Updated bucket name
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (storageError) throw storageError

      const { data: publicUrlData } = supabase.storage
        .from('sop-files') // Updated bucket name
        .getPublicUrl(filePath)

      if (!publicUrlData || !publicUrlData.publicUrl) throw new Error("Could not get public URL for file.")

      const { data: fileDbData, error: fileDbError } = await supabase
        .from('app_files')
        .insert({
          file_name: file.name,
          file_path: publicUrlData.publicUrl,
          file_type: file.type || `application/${fileExtension}`,
          associated_sop_id: selected.id,
          uploaded_by: user?.id,
        })
        .select()
        .single()

      if (fileDbError) throw fileDbError
      if (!fileDbData) throw new Error("No data returned after file DB insert.")

      const newFile: AppFile = fileDbData
      setAssociatedFiles(prev => [...prev, newFile])
      setSelected(prev => prev ? { ...prev, files: [...(prev.files || []), newFile] } : null)
      setSops(prev => prev.map(s => s.id === selected.id ? { ...s, files: [...(s.files || []), newFile] } : s))
      toast('File uploaded successfully! ✓')

    } catch (error: any) {
      console.error('File upload error:', error)
      toast(`File upload failed: ${error.message}`, 'error')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  async function handleFileDelete(fileToDelete: AppFile) {
    if (!canEdit) return
    if (!confirm(`Are you sure you want to delete "${fileToDelete.file_name}"?`)) return

    try {
      // Updated split to match the correct bucket name in the URL
      const pathSegments = fileToDelete.file_path.split('/sop-files/') 
      if (pathSegments.length < 2) throw new Error('Invalid file path for deletion.')
      const pathInBucket = pathSegments[1]

      const { error: storageError } = await supabase.storage
        .from('sop-files') // Updated bucket name
        .remove([pathInBucket])

      if (storageError) throw storageError

      const { error: fileDbError } = await supabase
        .from('app_files')
        .delete()
        .eq('id', fileToDelete.id)

      if (fileDbError) throw fileDbError

      setAssociatedFiles(prev => prev.filter(f => f.id !== fileToDelete.id))
      setSelected(prev => prev ? { ...prev, files: (prev.files || []).filter(f => f.id !== fileToDelete.id) } : null)
      setSops(prev => prev.map(s => s.id === selected?.id ? { ...s, files: (s.files || []).filter(f => f.id !== fileToDelete.id) } : s))
      toast('File deleted successfully!')

    } catch (error: any) {
      console.error('File deletion error:', error)
      toast(`File deletion failed: ${error.message}`, 'error')
    }
  }

  const filtered = sops.filter(s => !filter || s.category === filter)
  const activeCount = sops.filter(s => s.status === 'active').length
  const draftCount = sops.filter(s => s.status === 'draft').length

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, height: 'calc(100vh - 120px)' }}>
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
              {(provided: DroppableProvided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {filtered.map((s, index) => (
                    <Draggable key={s.id} draggableId={s.id} index={index} isDragDisabled={!canEdit}>
                      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
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
                      {/* NEW HTML Upload Button */}
                      <label className="btn-ghost" style={{ cursor: uploading ? 'wait' : 'pointer', padding: '7px', color: 'var(--teal)' }} title="Upload HTML File">
                        <FileCode size={14} />
                        <input type="file" accept="text/html" style={{ display: 'none' }} onChange={handleFileUpload} disabled={uploading} />
                      </label>

                      {/* NEW PDF Upload Button */}
                      <label className="btn-ghost" style={{ cursor: uploading ? 'wait' : 'pointer', padding: '7px', color: 'var(--red)' }} title="Upload PDF File">
                        <FileText size={14} />
                        <input type="file" accept="application/pdf" style={{ display: 'none' }} onChange={handleFileUpload} disabled={uploading} />
                      </label>

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

            {canEdit && selected && editing && (
              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, padding: '10px', background: 'var(--bg3)', borderRadius: 6, border: '1px solid var(--border2)' }}>
                <label htmlFor="file-upload" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '7px 14px', fontSize: 11 }}>
                  <Upload size={11} /> {uploading ? 'Uploading...' : 'Upload File'}
                </label>
                <input
                  id="file-upload"
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  style={{ display: 'none' }}
                  accept="application/pdf, text/html"
                />
                <span style={{ fontSize: 12, color: 'var(--grey)' }}>Attach PDF or HTML files to this SOP</span>
              </div>
            )}

            {editing && canEdit ? (
              <textarea value={content} onChange={e => setContent(e.target.value)}
                style={{ flex: 1, background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 6, color: 'var(--white)', fontFamily: 'Barlow', fontSize: 14, lineHeight: 1.8, padding: '16px', resize: 'none', outline: 'none' }}
                placeholder="Write SOP content here..." />
            ) : (
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: 8 }}>
                {selected.content ? (
                  <div className="markdown-body" style={{ fontSize: 14, lineHeight: 1.9, color: 'var(--grey)' }}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({node,...props}) => <h1 style={{ fontSize: 26, fontWeight: 700, marginTop: 20, marginBottom: 12, color: 'var(--white)' }} {...props} />,
                        h2: ({node,...props}) => <h2 style={{ fontSize: 22, fontWeight: 700, marginTop: 16, marginBottom: 10, color: 'var(--white)' }} {...props} />,
                        h3: ({node,...props}) => <h3 style={{ fontSize: 18, fontWeight: 600, marginTop: 14, marginBottom: 8, color: 'var(--white)' }} {...props} />,
                        p: ({node,...props}) => <div style={{ marginBottom: 12 }} {...props} />,
                        ul: ({node,...props}) => <ul style={{ marginLeft: 24, marginBottom: 12, listStyleType: 'disc' }} {...props} />,
                        ol: ({node,...props}) => <ol style={{ marginLeft: 24, marginBottom: 12, listStyleType: 'decimal' }} {...props} />,
                        li: ({node,...props}) => <li style={{ marginBottom: 6 }} {...props} />,
                        code: ({node, inline, children,...props}: any) => inline ? (
                          <code style={{ background: 'var(--bg)', padding: '2px 6px', borderRadius: 3, fontFamily: 'DM Mono', fontSize: 12, color: 'var(--teal)' }} {...props}>{children}</code>
                        ) : (
                          <pre style={{ background: 'var(--bg)', padding: 12, borderRadius: 4, overflow: 'auto', marginBottom: 12, fontFamily: 'DM Mono', fontSize: 12, whiteSpace: 'pre-wrap' }} {...props}>{children}</pre>
                        ),
                        table: ({node,...props}) => <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20, border: '1px solid var(--border2)' }} {...props} />,
                        thead: ({node,...props}) => <thead style={{ background: 'var(--bg2)' }} {...props} />,
                        th: ({node,...props}) => <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '2px solid var(--border2)', fontWeight: 600, color: 'var(--white)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }} {...props} />,
                        td: ({node,...props}) => <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border2)', fontSize: 13 }} {...props} />,
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

{associatedFiles.length > 0 && (
                  <div style={{ marginTop: 30, paddingTop: 20, borderTop: '1px solid var(--border2)' }}>
                    <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 15, color: 'var(--white)' }}>Associated Files</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {associatedFiles.map(file => (
                        <div key={file.id} style={{ display: 'flex', alignItems: 'center', background: 'var(--bg2)', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border2)' }}>
                          
                          {/* UPDATED ICON LOGIC */}
                          {file.file_type === 'application/pdf' ? (
                            <FileText size={16} style={{ marginRight: 8, color: 'var(--red)' }} />
                          ) : file.file_type === 'text/html' ? (
                            <FileCode size={16} style={{ marginRight: 8, color: 'var(--teal)' }} />
                          ) : (
                            <File size={16} style={{ marginRight: 8, color: 'var(--blue)' }} />
                          )}
                          {/* END UPDATED ICON LOGIC */}

                          <a
                            href={file.file_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ flex: 1, color: 'var(--teal)', textDecoration: 'none', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            title={`Open ${file.file_name}`}
                          >
                            {file.file_name}
                          </a>
                          {canEdit && (
                            <button
                              className="btn-ghost"
                              onClick={() => handleFileDelete(file)}
                              style={{ marginLeft: 10, color: 'var(--red)', padding: '4px', lineHeight: 1 }}
                              title="Delete File"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <h3 style={{ color: 'var(--grey2)' }}>Select an SOP from the library</h3>
          </div>
        )}
      </div>
    </div>
  )
}
