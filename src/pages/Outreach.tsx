import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Prospect } from '../lib/supabase'
import { Search, User, Copy, Check } from 'lucide-react'
import { useToast } from '../lib/toast'

interface Template {
  id: string
  title: string
  category: string | null
  content: string | null
  variables: string[] | null
}

export default function Outreach() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProspectId, setSelectedProspectId] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [preview, setPreview] = useState('')
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [p, t] = await Promise.all([
      supabase
        .from('prospects')
        .select('*')
        .not('status', 'eq', 'closed_won')
        .order('icp_total_score', { ascending: false }),
      supabase.from('templates').select('*').eq('category', 'whatsapp'),
    ])

    // Fix: Cast the data to Prospect[] to resolve the type mismatch
    setProspects((p.data as Prospect[]) || [])
    setTemplates((t.data || []).map(template => ({
      ...template,
      category: template.category ?? null,
      content: template.content ?? '',
      variables: template.variables ?? [],
    })))
  }

  useEffect(() => {
    const prospect = prospects.find(p => p.id === selectedProspectId) || null
    if (selectedTemplate && prospect) {
      setPreview(buildPreview(selectedTemplate, prospect))
    } else {
      setPreview('')
    }
    setCopied(false)
  }, [selectedProspectId, selectedTemplate, prospects])

  function buildPreview(template: Template, prospect: Prospect | null) {
    if (!template?.content) return ''
    return template.content
      .replace(/{business_name}/g, prospect?.business_name ?? '{business_name}')
      .replace(/{owner_name}/g, prospect?.owner_name ?? '{owner_name}')
      .replace(/{vertical}/g, prospect?.vertical ?? '{vertical}')
      .replace(/{suburb}/g, prospect?.suburb ?? '{suburb}')
  }

  const handleCopy = async () => {
    if (!preview) return
    try {
      await navigator.clipboard.writeText(preview)
      setCopied(true)
      toast('Message copied to clipboard ✓')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast('Failed to copy', 'error')
    }
  }

  const filteredProspects = prospects.filter(p => 
    p.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.owner_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="section-label" style={{ margin: 0 }}>Outreach</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        
        {/* PROSPECT SELECTION */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div className="label" style={{ marginBottom: 8 }}>Select Prospect</div>
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--grey)' }} />
              <input 
                className="input" 
                placeholder="Search business..." 
                style={{ paddingLeft: 38 }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '65vh', overflowY: 'auto', paddingRight: 4 }}>
              {filteredProspects.map(p => (
                <div
                  key={p.id}
                  onClick={() => setSelectedProspectId(p.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', borderRadius: 6,
                    border: `1px solid ${selectedProspectId === p.id ? 'var(--teal)' : 'var(--border2)'}`,
                    background: selectedProspectId === p.id ? 'rgba(0, 242, 166, 0.05)' : 'var(--bg2)',
                    transition: 'all 0.1s'
                  }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: selectedProspectId === p.id ? 'var(--teal)' : 'var(--grey)' }}>
                    <User size={14} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: selectedProspectId === p.id ? 'var(--teal)' : 'var(--white)' }}>{p.business_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--grey)', fontFamily: 'DM Mono' }}>{p.owner_name || 'No Owner'} · {p.suburb}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TEMPLATES & PREVIEW */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <div className="label" style={{ marginBottom: 12 }}>Choose Template</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {templates.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t)}
                  style={{
                    textAlign: 'left', padding: '14px 18px', cursor: 'pointer', borderRadius: 6,
                    border: `1px solid ${selectedTemplate?.id === t.id ? 'var(--teal)' : 'var(--border2)'}`,
                    background: selectedTemplate?.id === t.id ? 'rgba(0, 242, 166, 0.05)' : 'var(--bg2)',
                    color: 'inherit'
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{t.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--grey)' }}>{t.content?.slice(0, 70)}...</div>
                </button>
              ))}
            </div>
          </div>

          {preview ? (
            <div style={{ marginTop: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
                <div className="section-label" style={{ margin: 0 }}>Message Preview</div>
                <button 
                  onClick={handleCopy}
                  className={copied ? "btn-primary" : "btn-secondary"}
                  style={{ padding: '6px 12px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6, height: 32 }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy Message'}
                </button>
              </div>
              <div style={{
                background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8,
                padding: 20, fontSize: 14, lineHeight: 1.7, color: 'var(--white)',
                fontFamily: 'Barlow', whiteSpace: 'pre-wrap'
              }}>
                {preview}
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, border: '2px dashed var(--border2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--grey)', fontSize: 13, padding: 40, textAlign: 'center' }}>
              Select a prospect and a template to generate your outreach message.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}