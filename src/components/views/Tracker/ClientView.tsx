import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import type { PortalTask, PortalDocument, PortalMessage } from '../../../lib/supabase'
import { useAuth } from '../../../lib/auth'
import { useToast } from '../../../lib/toast'
import {
  CheckSquare, FileText, MessageSquare,
  Upload, Download, Check, Clock, Send,
} from 'lucide-react'

type Tab = 'tasks' | 'documents' | 'messages'

export default function ClientView() {
  const { metadata_id, user } = useAuth()
  const { toast } = useToast()
  const [tab, setTab] = useState<Tab>('tasks')

  // The account manager UUID — required for inserts that need manager_id
  const [managerId, setManagerId] = useState<string | null>(null)

  // Tasks
  const [tasks, setTasks] = useState<PortalTask[]>([])
  const [tasksLoading, setTasksLoading] = useState(true)

  // Documents
  const [documents, setDocuments] = useState<PortalDocument[]>([])
  const [docsLoading, setDocsLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  // Messages
  const [messages, setMessages] = useState<PortalMessage[]>([])
  const [msgLoading, setMsgLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Resolve the account_manager UUID for this client (needed for NOT NULL manager_id inserts)
  useEffect(() => {
    if (!metadata_id) return
    supabase
      .from('clients')
      .select('account_manager')
      .eq('id', metadata_id)
      .single()
      .then(({ data }) => {
        if (data?.account_manager) setManagerId(data.account_manager)
      })
  }, [metadata_id])

  // Fetch tasks
  useEffect(() => {
    if (!metadata_id) { setTasksLoading(false); return }
    supabase
      .from('portal_tasks')
      .select('*')
      .eq('client_id', metadata_id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) toast(error.message, 'error')
        setTasks(data || [])
        setTasksLoading(false)
      })
  }, [metadata_id])

  // Fetch documents
  useEffect(() => {
    if (!metadata_id) { setDocsLoading(false); return }
    supabase
      .from('portal_documents')
      .select('*')
      .eq('client_id', metadata_id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) toast(error.message, 'error')
        setDocuments(data || [])
        setDocsLoading(false)
      })
  }, [metadata_id])

  // Fetch messages + realtime subscription
  useEffect(() => {
    if (!metadata_id) { setMsgLoading(false); return }

    supabase
      .from('portal_messages')
      .select('*')
      .eq('client_id', metadata_id)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) toast(error.message, 'error')
        setMessages(data || [])
        setMsgLoading(false)
      })

    const channel = supabase
      .channel(`portal_messages_client_${metadata_id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'portal_messages', filter: `client_id=eq.${metadata_id}` },
        (payload) => setMessages(prev => [...prev, payload.new as PortalMessage])
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [metadata_id])

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function toggleTaskStatus(task: PortalTask) {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed'
    const { error } = await supabase
      .from('portal_tasks')
      .update({ status: nextStatus })
      .eq('id', task.id)
      .eq('client_id', metadata_id!)
    if (error) { toast(error.message, 'error'); return }
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: nextStatus } : t))
    toast(`Task marked ${nextStatus}`, 'success')
  }

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !metadata_id || !user) return
    setUploading(true)
    const filePath = `${metadata_id}/${file.name}`

    const { error: storageError } = await supabase.storage
      .from('client_portal')
      .upload(filePath, file, { upsert: true })
    if (storageError) { toast(storageError.message, 'error'); setUploading(false); return }

    const { data, error: dbError } = await supabase
      .from('portal_documents')
      .insert({
        client_id:   metadata_id,
        manager_id:  managerId ?? user.id,
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

  async function downloadFile(doc: PortalDocument) {
    const { data, error } = await supabase.storage.from('client_portal').download(doc.file_path)
    if (error || !data) { toast('Download failed', 'error'); return }
    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url; a.download = doc.file_name; a.click()
    URL.revokeObjectURL(url)
  }

  async function sendMessage() {
    if (!newMessage.trim() || !metadata_id || !user) return
    setSending(true)
    const { error } = await supabase
      .from('portal_messages')
      .insert({
        client_id:    metadata_id,
        manager_id:   managerId ?? user.id,
        message_text: newMessage.trim(),
        sender_id:    user.id,
      })
    if (error) toast(error.message, 'error')
    else setNewMessage('')
    setSending(false)
  }

  // ── Shared styles ──
  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: '8px 20px', borderRadius: 6, border: 'none', cursor: 'pointer',
    fontFamily: 'DM Mono', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em',
    background: active ? 'var(--teal)' : 'var(--bg3)',
    color: active ? 'var(--bg)' : 'var(--grey)',
  })

  const statusChip = (status: string | null): React.CSSProperties => ({
    fontFamily: 'DM Mono', fontSize: 9, textTransform: 'uppercase',
    padding: '3px 10px', borderRadius: 4, whiteSpace: 'nowrap',
    background: status === 'completed' ? 'rgba(0,229,195,0.12)' : status === 'in_progress' ? 'rgba(255,200,0,0.12)' : 'var(--bg3)',
    color: status === 'completed' ? 'var(--teal)' : status === 'in_progress' ? 'var(--amber)' : 'var(--grey)',
  })

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', paddingBottom: 60 }}>
      <header style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Playfair Display', fontSize: 28, fontWeight: 700, marginBottom: 8, color: 'var(--white)' }}>
          Client Portal
        </h1>
        <div style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Tasks · Documents · Messages
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        <button style={tabBtn(tab === 'tasks')} onClick={() => setTab('tasks')}>
          <CheckSquare size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} />Tasks
        </button>
        <button style={tabBtn(tab === 'documents')} onClick={() => setTab('documents')}>
          <FileText size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} />Documents
        </button>
        <button style={tabBtn(tab === 'messages')} onClick={() => setTab('messages')}>
          <MessageSquare size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} />Messages
        </button>
      </div>

      {/* ── TASKS ── */}
      {tab === 'tasks' && (
        tasksLoading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', fontFamily: 'DM Mono', fontSize: 11, color: 'var(--teal)' }}>
            LOADING TASKS...
          </div>
        ) : tasks.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <CheckSquare size={36} color="var(--grey2)" style={{ marginBottom: 12 }} />
            <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--grey)' }}>No tasks assigned yet.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {tasks.map(task => (
              <div key={task.id} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <button
                  onClick={() => toggleTaskStatus(task)}
                  style={{
                    width: 22, height: 22, borderRadius: 4, flexShrink: 0, marginTop: 2,
                    border: `2px solid ${task.status === 'completed' ? 'var(--teal)' : 'var(--border2)'}`,
                    background: task.status === 'completed' ? 'var(--teal)' : 'transparent',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {task.status === 'completed' && <Check size={12} color="var(--bg)" />}
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 600,
                    color: task.status === 'completed' ? 'var(--grey)' : 'var(--white)',
                    textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                  }}>
                    {task.title}
                  </div>
                  {task.description && (
                    <div style={{ fontSize: 12, color: 'var(--grey)', marginTop: 4, lineHeight: 1.5 }}>
                      {task.description}
                    </div>
                  )}
                  {task.due_date && (
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={10} color="var(--grey)" />
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
        )
      )}

      {/* ── DOCUMENTS ── */}
      {tab === 'documents' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <label style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '8px 18px', borderRadius: 6, cursor: uploading ? 'default' : 'pointer',
              background: 'var(--teal)', color: 'var(--bg)',
              fontFamily: 'DM Mono', fontSize: 11, textTransform: 'uppercase',
              opacity: uploading ? 0.6 : 1,
            }}>
              <Upload size={12} />
              {uploading ? 'Uploading...' : 'Upload File'}
              <input type="file" style={{ display: 'none' }} onChange={uploadFile} disabled={uploading} />
            </label>
          </div>

          {docsLoading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', fontFamily: 'DM Mono', fontSize: 11, color: 'var(--teal)' }}>
              LOADING DOCUMENTS...
            </div>
          ) : documents.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <FileText size={36} color="var(--grey2)" style={{ marginBottom: 12 }} />
              <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--grey)' }}>No documents uploaded yet.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {documents.map(doc => (
                <div key={doc.id} className="card" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <FileText size={16} color="var(--grey2)" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)' }}>{doc.file_name}</div>
                    <div style={{ fontFamily: 'DM Mono', fontSize: 9, color: 'var(--grey)', marginTop: 3 }}>
                      {new Date(doc.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => downloadFile(doc)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 14px', borderRadius: 6,
                      border: '1px solid var(--border2)', background: 'transparent',
                      cursor: 'pointer', fontFamily: 'DM Mono', fontSize: 10,
                      color: 'var(--grey)', textTransform: 'uppercase',
                    }}
                  >
                    <Download size={11} />Download
                  </button>
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
            height: 420, overflowY: 'auto', padding: '8px 0', marginBottom: 14,
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            {msgLoading ? (
              <div style={{ textAlign: 'center', fontFamily: 'DM Mono', fontSize: 11, color: 'var(--teal)', paddingTop: 40 }}>
                LOADING MESSAGES...
              </div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: 60 }}>
                <MessageSquare size={36} color="var(--grey2)" style={{ marginBottom: 12 }} />
                <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--grey)' }}>
                  No messages yet. Start the conversation.
                </div>
              </div>
            ) : messages.map(msg => {
              const isOwn = msg.sender_id === user?.id
              return (
                <div key={msg.id} style={{ display: 'flex', flexDirection: isOwn ? 'row-reverse' : 'row', gap: 10 }}>
                  <div style={{
                    maxWidth: '70%', padding: '10px 14px', borderRadius: 10,
                    background: isOwn ? 'var(--teal)' : 'var(--bg3)',
                    color: isOwn ? 'var(--bg)' : 'var(--white)',
                  }}>
                    <div style={{ fontSize: 13, lineHeight: 1.5 }}>{msg.message_text}</div>
                    <div style={{
                      fontFamily: 'DM Mono', fontSize: 9, marginTop: 4, textAlign: 'right',
                      color: isOwn ? 'rgba(0,0,0,0.45)' : 'var(--grey)',
                    }}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder="Type a message..."
              style={{
                flex: 1, padding: '10px 16px', borderRadius: 8,
                border: '1px solid var(--border2)',
                background: 'var(--bg2)', color: 'var(--white)',
                fontFamily: 'Barlow', fontSize: 13, outline: 'none',
              }}
            />
            <button
              onClick={sendMessage}
              disabled={sending || !newMessage.trim()}
              style={{
                padding: '10px 18px', borderRadius: 8, border: 'none',
                background: 'var(--teal)', color: 'var(--bg)', cursor: 'pointer',
                opacity: sending || !newMessage.trim() ? 0.5 : 1,
                display: 'flex', alignItems: 'center',
              }}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
