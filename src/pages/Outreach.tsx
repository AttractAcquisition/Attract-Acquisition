import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Prospect } from '../lib/supabase'
import { formatDate, statusBadge } from '../lib/utils'
import { Send, RefreshCw } from 'lucide-react'
import { useToast } from '../lib/toast'
import React from 'react'

interface Template {
  id: string
  title: string
  category: string | null
  content: string | null
  variables: string[] | null
}

interface OutreachMsg {
  id: string
  created_at: string | null
  prospect_id: string
  message_type: string | null
  message_body: string | null
  response_received: boolean | null
  outcome: string | null
  follow_up_count: number | null
  prospects?: { business_name: string | null } | null
  batch_id?: string | null
  channel?: string | null
  last_contact?: string | null
  sent_at?: string | null
  sent_by?: string | null
}

export default function Outreach() {
  const [tab, setTab] = useState<'compose' | 'followups' | 'log'>('compose')
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [messages, setMessages] = useState<OutreachMsg[]>([])
  const [selectedProspects, setSelectedProspects] = useState<string[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [preview, setPreview] = useState('')
  const [sending, setSending] = useState(false)
  const [followups, setFollowups] = useState<Prospect[]>([])
  const [expandedObj, setExpandedObj] = useState<string | null>(null)
  const [objTemplate, setObjTemplate] = useState<Template | null>(null)
  const [stats, setStats] = useState({ sent: 0, responses: 0, calls: 0 })
  const { toast } = useToast()

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    const [p, t, m, fu] = await Promise.all([
      supabase
        .from('prospects')
        .select('*')
        .in('status', ['new', 'contacted'])
        .order('icp_total_score', { ascending: false }),
      supabase.from('templates').select('*').eq('category', 'whatsapp'),
      supabase
        .from('outreach_messages')
        .select('*, prospects(business_name)')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase.from('prospects').select('*').in('status', ['contacted']),
    ])

    // Null-safe sets
    setProspects(p.data || [])
    setTemplates((t.data || []).map(template => ({
      ...template,
      category: template.category ?? null,
      content: template.content ?? '',
      variables: template.variables ?? [],
    })))
setMessages((m.data || []).map(msg => ({
  ...msg,
  prospect_id: msg.prospect_id ?? '',  // ← force string
  created_at: msg.created_at ?? null,
  message_type: msg.message_type ?? null,
  message_body: msg.message_body ?? null,
  response_received: msg.response_received ?? false,
  outcome: msg.outcome ?? null,
  follow_up_count: msg.follow_up_count ?? 0,
  prospects: msg.prospects
    ? { business_name: msg.prospects.business_name ?? '' }
    : { business_name: '' },
  batch_id: msg.batch_id ?? null,
  channel: msg.channel ?? null,
  last_contact: msg.last_contact ?? null,
  sent_at: msg.sent_at ?? null,
  sent_by: msg.sent_by ?? null,
  response_text: msg.response_text ?? null, // if exists
})))
    setFollowups(fu.data || [])

    // Stats
    const msgs = m.data || []
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    setStats({
      sent: msgs.filter(x => x.created_at && x.created_at > weekAgo).length,
      responses: msgs.filter(x => !!x.response_received).length,
      calls: msgs.filter(x => x.outcome === 'positive').length,
    })
  }

  function buildPreview(template: Template, prospect: Prospect | null) {
    if (!template?.content) return ''
    return template.content
      .replace(/{business_name}/g, prospect?.business_name ?? '{business_name}')
      .replace(/{owner_name}/g, prospect?.owner_name ?? '{owner_name}')
      .replace(/{vertical}/g, prospect?.vertical ?? '{vertical}')
      .replace(/{suburb}/g, prospect?.suburb ?? '{suburb}')
  }

  function onTemplateSelect(t: Template) {
    setSelectedTemplate(t)
    const first = prospects.find(p => selectedProspects.includes(p.id)) || null
    setPreview(buildPreview(t, first))
  }

  function onProspectToggle(id: string) {
    setSelectedProspects(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  async function sendBatch() {
    if (!selectedTemplate || selectedProspects.length === 0) {
      toast('Select prospects and a template', 'error')
      return
    }
    setSending(true)
    const batchId = `batch_${Date.now()}`
    const inserts = selectedProspects.map(pid => {
      const p = prospects.find(x => x.id === pid)!
      return {
        prospect_id: pid,
        batch_id: batchId,
        message_type: 'cold_intro',
        channel: 'whatsapp',
        message_body: buildPreview(selectedTemplate, p),
        sent_at: new Date().toISOString(),
        sent_by: 'principal',
        response_received: false,
        last_contact: new Date().toISOString(),
      }
    })
    const { error } = await supabase.from('outreach_messages').insert(inserts)
    if (error) {
      toast('Send failed', 'error')
      setSending(false)
      return
    }
    await supabase.from('prospects').update({ status: 'contacted' }).in('id', selectedProspects)
    toast(`Batch of ${selectedProspects.length} logged ✓`)
    setSelectedProspects([])
    setSending(false)
    loadAll()
  }

  async function sendFollowup(prospect: Prospect) {
    const ft = templates.find(t => t.title.includes('48h')) || templates[0]
    if (!ft) {
      toast('No follow-up template found', 'error')
      return
    }
    await supabase.from('outreach_messages').insert({
      prospect_id: prospect.id,
      message_type: 'followup_48h',
      channel: 'whatsapp',
      message_body: buildPreview(ft, prospect),
      sent_at: new Date().toISOString(),
      sent_by: 'principal',
      response_received: false,
      last_contact: new Date().toISOString(),
    })
    toast(`Follow-up logged for ${prospect.business_name}`)
    loadAll()
  }

  async function markOutcome(msgId: string, outcome: string) {
    await supabase.from('outreach_messages').update({ response_received: true, outcome }).eq('id', msgId)
    setMessages(prev =>
      prev.map(m => (m.id === msgId ? { ...m, response_received: true, outcome } : m))
    )
    if (outcome === 'objection') {
      const t = templates.find(x => x.title.includes('Objection'))
      if (t) {
        setObjTemplate(t)
        setExpandedObj(msgId)
      }
    }
    toast('Response logged')
  }

  const tabs: { key: typeof tab; label: string }[] = [
    { key: 'compose', label: 'Compose Batch' },
    { key: 'followups', label: `Follow-ups Due (${followups.length})` },
    { key: 'log', label: 'Response Log' },
  ]

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'flex', gap: 28, marginBottom: 24 }}>
        {[
          { label: 'Sent this week', value: stats.sent },
          { label: 'Responses', value: stats.responses },
          { label: 'Calls booked', value: stats.calls },
          { label: 'Response rate', value: stats.sent ? `${Math.round((stats.responses / stats.sent) * 100)}%` : '0%' },
        ].map(s => (
          <div key={s.label} className="card" style={{ flex: 1, padding: '14px 18px' }}>
            <div className="label">{s.label}</div>
            <div className="stat-num" style={{ fontSize: 26, marginTop: 6 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border2)', paddingBottom: 0 }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'DM Mono',
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '10px 16px',
              color: tab === t.key ? 'var(--teal)' : 'var(--grey)',
              borderBottom: tab === t.key ? '2px solid var(--teal)' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Compose tab */}
      {tab === 'compose' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Prospects list */}
          <div>
            <div className="section-label">Select Prospects</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 420, overflowY: 'auto' }}>
              {prospects.map(p => (
                <div
                  key={p.id}
                  onClick={() => onProspectToggle(p.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    cursor: 'pointer',
                    borderRadius: 4,
                    border: `1px solid ${selectedProspects.includes(p.id) ? 'var(--teal)' : 'var(--border2)'}`,
                    background: selectedProspects.includes(p.id) ? 'var(--teal-faint)' : 'var(--bg2)',
                  }}
                >
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 3,
                      border: `1.5px solid ${selectedProspects.includes(p.id) ? 'var(--teal)' : 'var(--grey2)'}`,
                      background: selectedProspects.includes(p.id) ? 'var(--teal)' : 'transparent',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{p.business_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--grey)', fontFamily: 'DM Mono' }}>
                      {p.vertical} · {p.suburb}
                    </div>
                  </div>
                  <span style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--teal)' }}>{p.icp_tier}</span>
                </div>
              ))}
              {prospects.length === 0 && <div style={{ color: 'var(--grey)', fontSize: 13, textAlign: 'center', padding: 20 }}>No prospects available. Add prospects first.</div>}
            </div>
            <div style={{ marginTop: 10, fontFamily: 'DM Mono', fontSize: 11, color: 'var(--grey)' }}>{selectedProspects.length} selected</div>
          </div>

          {/* Templates & Preview */}
          <div>
            <div className="section-label">Choose Template</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              {templates.map(t => (
                <div
                  key={t.id}
                  onClick={() => onTemplateSelect(t)}
                  style={{
                    padding: '10px 14px',
                    cursor: 'pointer',
                    borderRadius: 4,
                    border: `1px solid ${selectedTemplate?.id === t.id ? 'var(--teal)' : 'var(--border2)'}`,
                    background: selectedTemplate?.id === t.id ? 'var(--teal-faint)' : 'var(--bg2)',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{t.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--grey)', marginTop: 2 }}>{t.content?.slice(0, 60)}...</div>
                </div>
              ))}
            </div>

            {preview && (
              <>
                <div className="section-label">Preview</div>
                <div
                  style={{
                    background: 'var(--bg3)',
                    border: '1px solid var(--border2)',
                    borderRadius: 6,
                    padding: 14,
                    fontSize: 13,
                    lineHeight: 1.7,
                    color: 'var(--white)',
                    marginBottom: 16,
                    fontFamily: 'Barlow',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {preview}
                </div>
              </>
            )}

            <button
              className="btn-primary"
              onClick={sendBatch}
              disabled={sending || selectedProspects.length === 0 || !selectedTemplate}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <Send size={13} /> {sending ? 'Logging...' : `Log Batch (${selectedProspects.length} prospects)`}
            </button>
          </div>
        </div>
      )}

      {/* Follow-ups tab */}
      {tab === 'followups' && (
        <div>
          <div className="section-label">Prospects Due for Follow-up</div>
          {followups.length === 0 ? (
            <div className="empty-state">
              <h3>No follow-ups due</h3>
              <p>Contacted prospects will appear here after 48h with no response.</p>
            </div>
          ) : (
            followups.map(p => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '12px 16px',
                  border: '1px solid var(--border2)',
                  borderRadius: 4,
                  marginBottom: 6,
                  background: 'var(--bg2)',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{p.business_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--grey)', fontFamily: 'DM Mono' }}>
                    {p.vertical} · {p.suburb}
                  </div>
                </div>
                <span className={`badge ${statusBadge(p.status ?? '').cls}`}>{statusBadge(p.status ?? '').label}</span>
                <button className="btn-secondary" onClick={() => sendFollowup(p)} style={{ fontSize: 11, padding: '7px 14px' }}>
                  Send Follow-up
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Response Log tab */}
      {tab === 'log' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="section-label" style={{ margin: 0 }}>Response Log</div>
            <button className="btn-ghost" onClick={loadAll} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
              <RefreshCw size={11} /> Refresh
            </button>
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="aa-table">
              <thead><tr><th>Business</th><th>Type</th><th>Sent</th><th>Response</th><th>Action</th></tr></thead>
              <tbody>
                {messages.map(m => (
                  <React.Fragment key={m.id}>
                    <tr>
                      <td style={{ fontWeight: 500 }}>{m.prospects?.business_name || '—'}</td>
                      <td>
                        <span style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {m.message_type?.replace(/_/g, ' ') || '—'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--grey)', fontSize: 12 }}>{formatDate(m.created_at ?? '')}</td>
                      <td>
                        {m.response_received
                          ? <span className={`badge ${m.outcome === 'positive' ? 'badge-clients' : m.outcome === 'objection' ? 'badge-capital' : 'badge-lost'}`}>{m.outcome}</span>
                          : <span className="badge badge-new">Pending</span>
                        }
                      </td>
                      <td>
                        {!m.response_received && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            {['positive', 'objection', 'no_interest'].map(o => (
                              <button
                                key={o}
                                className="btn-ghost"
                                onClick={() => markOutcome(m.id, o)}
                                style={{ fontSize: 10, padding: '4px 8px', textTransform: 'capitalize' }}
                              >
                                {o.replace('_', ' ')}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>

                    {expandedObj === m.id && objTemplate && (
                      <tr>
                        <td colSpan={5} style={{ background: 'var(--bg3)', fontFamily: 'DM Mono', fontSize: 11, padding: 14 }}>
                          <div style={{ marginBottom: 8, fontWeight: 500 }}>Objection Response Template:</div>
                          <div>{buildPreview(objTemplate, prospects.find(p => p.id === m.prospect_id) ?? null)}</div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}