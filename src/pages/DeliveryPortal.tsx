import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { PortalTask, PortalDocument, PortalMessage } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'
import {
  Users, CheckSquare, FileText, MessageSquare,
  Upload, Send, Plus, Check, Clock,
} from 'lucide-react'

type Tab = 'tasks' | 'documents' | 'messages'

interface ClientRow {
  id: string
  business_name: string | null
  owner_name: string | null
}

export default function DeliveryPortal() {
  const { user, metadata_id } = useAuth()
  const { toast } = useToast()

  const [clients, setClients] = useState<ClientRow[]>([])
  const [clientsLoading, setClientsLoading] = useState(true)
  const [selected, setSelected] = useState<ClientRow | null>(null)
  const [tab, setTab] = useState<Tab>('tasks')

  // Tasks
  const [tasks, setTasks] = useState<PortalTask[]>([])
  const [tasksLoading, setTasksLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDesc, setTaskDesc] = useState('')
  const [taskDue, setTaskDue] = useState('')
  const [addingTask, setAddingTask] = useState(false)

  // Documents
  const [documents, setDocuments] = useState<PortalDocument[]>([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Messages
  const [messages, setMessages] = useState<PortalMessage[]>([])
  const [msgLoading, setMsgLoading] = useState(false)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  // ── Load managed clients ──
  // Mirrors the exact logic from Clients.tsx: .eq('account_manager', metadata_id)
  useEffect(() => {
    if (!metadata_id) { setClientsLoading(false); return }
    supabase
      .from('clients')
      .select('id, business_name, owner_name')
      .eq('account_manager', metadata_id)
      .order('business_name', { ascending: true })
      .then(({ data, error }) => {
        if (error) toast(error.message, 'error')
        setClients((data as ClientRow[]) || [])
        setClientsLoading(false)
      })
  }, [metadata_id])

  // ── Reload portal data when a client is selected ──
  useEffect(() => {
    if (!selected) return
    loadTasks()
    loadDocuments()
    loadMessages()
  }, [selected?.id])

  // ── Realtime: new messages for selected client ──
  useEffect(() => {
    if (!selected) return
    const channel = supabase
      .channel(`portal_messages_mgr_${selected.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'portal_messages', filter: `client_id=eq.${selected.id}` },
        (payload) => setMessages(prev => [...prev, payload.new as PortalMessage])
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [selected?.id])

  async function loadTasks() {
    if (!selected) return
    setTasksLoading(true)
    const { data, error } = await supabase
      .from('portal_tasks')
      .select('*')
      .eq('client_id', selected.id)
      .order('created_at', { ascending: false })
    if (error) toast(error.message, 'error')
    setTasks(data || [])
    setTasksLoading(false)
  }

  async function loadDocuments() {
    if (!selected) return
    setDocsLoading(true)
    const { data, error } = await supabase
      .from('portal_documents')
      .select('*')
      .eq('client_id', selected.id)
      .order('created_at', { ascending: false })
    if (error) toast(error.message, 'error')
    setDocuments(data || [])
    setDocsLoading(false)
  }

  async function loadMessages() {
    if (!selected) return
    setMsgLoading(true)
    const { data, error } = await supabase
      .from('portal_messages')
      .select('*')
      .eq('client_id', selected.id)
      .order('created_at', { ascending: true })
    if (error) toast(error.message, 'error')
    setMessages(data || [])
    setMsgLoading(false)
  }

  function selectClient(client: ClientRow) {
    setSelected(client)
    setTab('tasks')
    setShowForm(false)
    setTaskTitle(''); setTaskDesc(''); setTaskDue('')
    setReply('')
  }

  async function addTask() {
    if (!taskTitle.trim() || !selected || !user || !metadata_id) return
    setAddingTask(true)
    const { data, error } = await supabase
      .from('portal_tasks')
      .insert({
        client_id:   selected.id,
        manager_id:  metadata_id,
        title:       taskTitle.trim(),
        description: taskDesc.trim() || null,
        due_date:    taskDue || null,
        status:      'pending',
      })
      .select()
      .single()
    if (error) { toast(error.message, 'error'); setAddingTask(false); return }
    setTasks(prev => [data, ...prev])
    setTaskTitle(''); setTaskDesc(''); setTaskDue('')
    setShowForm(false)
    toast('Task assigned', 'success')
    setAddingTask(false)
  }

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !selected || !user || !metadata_id) return
    setUploading(true)
    const filePath = `${selected.id}/${file.name}`

    const { error: storageError } = await supabase.storage
      .from('client_portal')
      .upload(filePath, file, { upsert: true })
    if (storageError) { toast(storageError.message, 'error'); setUploading(false); return }

    const { data, error: dbError } = await supabase
      .from('portal_documents')
      .insert({
        client_id:   selected.id,
        manager_id:  metadata_id,
        file_name:   file.name,
        file_path:   filePath,
        uploaded_by: user.id,
      })
      .select()
      .single()
    if (dbError) { toast(dbError.message, 'error'); setUploading(false); return }

    toast(`${file.name} uploaded`, 'success')
    setDocuments(prev => [data, ...prev])
    setUploading(false)
    e.target.value = ''
  }

  async function sendReply() {
    if (!reply.trim() || !selected || !user || !metadata_id) return
    setSending(true)
    const { error } = await supabase
      .from('portal_messages')
      .insert({
        client_id:    selected.id,
        manager_id:   metadata_id,
        message_text: reply.trim(),
        sender_id:    user.id,
      })
    if (error) toast(error.message, 'error')
    else setReply('')
    setSending(false)
  }

  // ── Shared styles ──
  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: '7px 18px', borderRadius: 6, border: 'none', cursor: 'pointer',
    fontFamily: 'DM Mono', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em',
    background: active ? 'var(--teal)' : 'var(--bg3)',
    color: active ? 'var(--bg)' : 'var(--grey)',
  })

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 14px', borderRadius: 6,
    border: '1px solid var(--border2)', background: 'var(--bg2)',
    color: 'var(--white)', fontFamily: 'Barlow', fontSize: 13,
    marginBottom: 10, boxSizing: 'border-box', outline: 'none',
  }

  const statusChip = (status: string | null): React.CSSProperties => ({
    fontFamily: 'DM Mono', fontSize: 9, textTransform: 'uppercase',
    padding: '3px 10px', borderRadius: 4, whiteSpace: 'nowrap',
    background: status === 'completed' ? 'rgba(0,229,195,0.12)' : status === 'in_progress' ? 'rgba(255,200,0,0.12)' : 'var(--bg3)',
    color: status === 'completed' ? 'var(--teal)' : status === 'in_progress' ? 'var(--amber)' : 'var(--grey)',
  })

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 80px)', overflow: 'hidden' }}>

      {/* ── SIDEBAR ── */}
      <div style={{
        width: 240, flexShrink: 0, borderRight: '1px solid var(--border2)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ padding: '4px 20px 16px', borderBottom: '1px solid var(--border2)' }}>
          <div style={{ fontFamily: 'DM Mono', fontSize: 9, color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
            My Clients
          </div>
          <div style={{ fontFamily: 'Playfair Display', fontSize: 18, fontWeight: 700, color: 'var(--white)' }}>
            Delivery Portal
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {clientsLoading ? (
            <div style={{ padding: '16px 20px', fontFamily: 'DM Mono', fontSize: 10, color: 'var(--grey)' }}>
              Loading...
            </div>
          ) : clients.length === 0 ? (
            <div style={{ padding: '24px 20px' }}>
              <Users size={20} color="var(--grey2)" style={{ marginBottom: 8 }} />
              <div style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--grey)', lineHeight: 1.5 }}>
                No clients assigned as account manager yet.
              </div>
            </div>
          ) : clients.map(client => (
            <button
              key={client.id}
              onClick={() => selectClient(client)}
              style={{
                width: '100%', textAlign: 'left', padding: '10px 20px',
                border: 'none', cursor: 'pointer',
                background: selected?.id === client.id ? 'rgba(0,229,195,0.07)' : 'transparent',
                borderRight: `2px solid ${selected?.id === client.id ? 'var(--teal)' : 'transparent'}`,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: selected?.id === client.id ? 'var(--teal)' : 'var(--white)', marginBottom: 2 }}>
                {client.business_name || 'Unnamed Client'}
              </div>
              <div style={{ fontFamily: 'DM Mono', fontSize: 9, color: 'var(--grey)', textTransform: 'uppercase' }}>
                {client.owner_name || '—'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN PANEL ── */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 0 40px 32px' }}>
        {!selected ? (
          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
            <Users size={40} color="var(--grey2)" />
            <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--grey)' }}>
              Select a client to manage their portal
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 700 }}>

            {/* Client header */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: 'DM Mono', fontSize: 9, color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                Managing
              </div>
              <h1 style={{ fontFamily: 'Playfair Display', fontSize: 24, fontWeight: 700, color: 'var(--white)', margin: 0 }}>
                {selected.business_name}
              </h1>
              {selected.owner_name && (
                <div style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--grey)', marginTop: 4 }}>
                  {selected.owner_name}
                </div>
              )}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              <button style={tabBtn(tab === 'tasks')} onClick={() => setTab('tasks')}>
                <CheckSquare size={11} style={{ marginRight: 6, verticalAlign: 'middle' }} />Tasks
              </button>
              <button style={tabBtn(tab === 'documents')} onClick={() => setTab('documents')}>
                <FileText size={11} style={{ marginRight: 6, verticalAlign: 'middle' }} />Documents
              </button>
              <button style={tabBtn(tab === 'messages')} onClick={() => setTab('messages')}>
                <MessageSquare size={11} style={{ marginRight: 6, verticalAlign: 'middle' }} />Messages
              </button>
            </div>

            {/* ── TASKS ── */}
            {tab === 'tasks' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
                  <button
                    onClick={() => setShowForm(v => !v)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 16px', borderRadius: 6, border: 'none',
                      background: 'var(--teal)', color: 'var(--bg)',
                      fontFamily: 'DM Mono', fontSize: 10, textTransform: 'uppercase', cursor: 'pointer',
                    }}
                  >
                    <Plus size={12} />Assign Task
                  </button>
                </div>

                {showForm && (
                  <div className="card" style={{ padding: '20px 24px', marginBottom: 18 }}>
                    <div style={{ fontFamily: 'DM Mono', fontSize: 9, color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
                      New Task
                    </div>
                    <input
                      value={taskTitle}
                      onChange={e => setTaskTitle(e.target.value)}
                      placeholder="Task title *"
                      style={inputStyle}
                    />
                    <textarea
                      value={taskDesc}
                      onChange={e => setTaskDesc(e.target.value)}
                      placeholder="Description (optional)"
                      rows={3}
                      style={{ ...inputStyle, resize: 'vertical' }}
                    />
                    <input
                      type="date"
                      value={taskDue}
                      onChange={e => setTaskDue(e.target.value)}
                      style={{ ...inputStyle, marginBottom: 14 }}
                    />
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setShowForm(false)}
                        style={{
                          padding: '7px 16px', borderRadius: 6, cursor: 'pointer',
                          border: '1px solid var(--border2)', background: 'transparent',
                          color: 'var(--grey)', fontFamily: 'DM Mono', fontSize: 10, textTransform: 'uppercase',
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={addTask}
                        disabled={addingTask || !taskTitle.trim()}
                        style={{
                          padding: '7px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
                          background: 'var(--teal)', color: 'var(--bg)',
                          fontFamily: 'DM Mono', fontSize: 10, textTransform: 'uppercase',
                          opacity: addingTask || !taskTitle.trim() ? 0.6 : 1,
                        }}
                      >
                        {addingTask ? 'Saving...' : 'Save Task'}
                      </button>
                    </div>
                  </div>
                )}

                {tasksLoading ? (
                  <div style={{ padding: '40px 0', textAlign: 'center', fontFamily: 'DM Mono', fontSize: 10, color: 'var(--teal)' }}>
                    LOADING...
                  </div>
                ) : tasks.length === 0 ? (
                  <div style={{ padding: '40px 0', textAlign: 'center' }}>
                    <CheckSquare size={32} color="var(--grey2)" style={{ marginBottom: 10 }} />
                    <div style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--grey)' }}>No tasks yet. Assign one above.</div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: 10 }}>
                    {tasks.map(task => (
                      <div key={task.id} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{
                          width: 20, height: 20, borderRadius: 4, flexShrink: 0, marginTop: 2,
                          background: task.status === 'completed' ? 'var(--teal)' : 'var(--bg3)',
                          border: `2px solid ${task.status === 'completed' ? 'var(--teal)' : 'var(--border2)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {task.status === 'completed' && <Check size={11} color="var(--bg)" />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: 13, fontWeight: 600,
                            color: task.status === 'completed' ? 'var(--grey)' : 'var(--white)',
                            textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                          }}>
                            {task.title}
                          </div>
                          {task.description && (
                            <div style={{ fontSize: 12, color: 'var(--grey)', marginTop: 3, lineHeight: 1.4 }}>
                              {task.description}
                            </div>
                          )}
                          {task.due_date && (
                            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Clock size={9} color="var(--grey)" />
                              <span style={{ fontFamily: 'DM Mono', fontSize: 9, color: 'var(--grey)', textTransform: 'uppercase' }}>
                                Due {new Date(task.due_date).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div style={statusChip(task.status)}>{(task.status ?? 'pending').replace('_', ' ')}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── DOCUMENTS ── */}
            {tab === 'documents' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
                  <label style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '8px 18px', borderRadius: 6, cursor: uploading ? 'default' : 'pointer',
                    background: 'var(--teal)', color: 'var(--bg)',
                    fontFamily: 'DM Mono', fontSize: 10, textTransform: 'uppercase',
                    opacity: uploading ? 0.6 : 1,
                  }}>
                    <Upload size={12} />
                    {uploading ? 'Uploading...' : 'Upload File'}
                    <input type="file" style={{ display: 'none' }} onChange={uploadFile} disabled={uploading} />
                  </label>
                </div>

                {docsLoading ? (
                  <div style={{ padding: '40px 0', textAlign: 'center', fontFamily: 'DM Mono', fontSize: 10, color: 'var(--teal)' }}>
                    LOADING...
                  </div>
                ) : documents.length === 0 ? (
                  <div style={{ padding: '40px 0', textAlign: 'center' }}>
                    <FileText size={32} color="var(--grey2)" style={{ marginBottom: 10 }} />
                    <div style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--grey)' }}>No documents for this client yet.</div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: 10 }}>
                    {documents.map(doc => (
                      <div key={doc.id} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <FileText size={16} color="var(--grey2)" style={{ flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)' }}>{doc.file_name}</div>
                          <div style={{ fontFamily: 'DM Mono', fontSize: 9, color: 'var(--grey)', marginTop: 3 }}>
                            {new Date(doc.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{ fontFamily: 'DM Mono', fontSize: 9, color: 'var(--teal)', padding: '3px 10px', background: 'rgba(0,229,195,0.08)', borderRadius: 4 }}>
                          Uploaded
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── MESSAGES ── */}
            {tab === 'messages' && (
              <div>
                <div style={{
                  height: 400, overflowY: 'auto', padding: '8px 0', marginBottom: 14,
                  display: 'flex', flexDirection: 'column', gap: 10,
                }}>
                  {msgLoading ? (
                    <div style={{ textAlign: 'center', fontFamily: 'DM Mono', fontSize: 10, color: 'var(--teal)', paddingTop: 40 }}>
                      LOADING...
                    </div>
                  ) : messages.length === 0 ? (
                    <div style={{ textAlign: 'center', paddingTop: 60 }}>
                      <MessageSquare size={32} color="var(--grey2)" style={{ marginBottom: 10 }} />
                      <div style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--grey)' }}>No messages yet. Start the thread.</div>
                    </div>
                  ) : messages.map(msg => {
                    const isOwn = msg.sender_id === user?.id
                    return (
                      <div key={msg.id} style={{ display: 'flex', flexDirection: isOwn ? 'row-reverse' : 'row', gap: 10 }}>
                        <div style={{
                          maxWidth: '70%', padding: '10px 14px', borderRadius: 10,
                          background: isOwn ? 'rgba(0,229,195,0.12)' : 'var(--bg3)',
                          border: `1px solid ${isOwn ? 'var(--teal)' : 'var(--border2)'}`,
                        }}>
                          <div style={{ fontFamily: 'DM Mono', fontSize: 8, color: isOwn ? 'var(--teal)' : 'var(--grey)', textTransform: 'uppercase', marginBottom: 4 }}>
                            {isOwn ? 'You' : 'Client'}
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--white)', lineHeight: 1.5 }}>{msg.message_text}</div>
                          <div style={{ fontFamily: 'DM Mono', fontSize: 8, color: 'var(--grey)', marginTop: 4 }}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }}
                    placeholder="Reply to client..."
                    style={{
                      flex: 1, padding: '10px 16px', borderRadius: 8,
                      border: '1px solid var(--border2)',
                      background: 'var(--bg2)', color: 'var(--white)',
                      fontFamily: 'Barlow', fontSize: 13, outline: 'none',
                    }}
                  />
                  <button
                    onClick={sendReply}
                    disabled={sending || !reply.trim()}
                    style={{
                      padding: '10px 18px', borderRadius: 8, border: 'none',
                      background: 'var(--teal)', color: 'var(--bg)', cursor: 'pointer',
                      opacity: sending || !reply.trim() ? 0.5 : 1,
                      display: 'flex', alignItems: 'center',
                    }}
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  )
}
