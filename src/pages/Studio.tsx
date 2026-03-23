import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Prospect } from '../lib/supabase'
import { formatRand } from '../lib/utils'
import { Search, Zap, Copy } from 'lucide-react'
import { useToast } from '../lib/toast'

interface MJRReport {
  opportunity: string
  competitors: string
  cost: string
  observations: string
  next_step: string
  full_report: string
}

export default function Studio() {
  const [search, setSearch]         = useState('')
  const [prospects, setProspects]   = useState<Prospect[]>([])
  const [selected, setSelected]     = useState<Prospect | null>(null)
  const [report, setReport]         = useState<MJRReport | null>(null)
  const [generating, setGenerating] = useState(false)
  const [whatsappMsg, setWhatsappMsg] = useState('')
  const { toast }                   = useToast()

  async function searchProspects(q: string) {
    setSearch(q)
    if (q.length < 2) { setProspects([]); return }
    const { data } = await supabase.from('prospects').select('*')
      .or(`business_name.ilike.%${q}%,owner_name.ilike.%${q}%,suburb.ilike.%${q}%`)
      .limit(8)
    setProspects(data || [])
  }

  async function generateMJR() {
    if (!selected) { toast('Select a prospect first', 'error'); return }
    setGenerating(true)
    setReport(null)
    setWhatsappMsg('')

    try {
      const { data, error } = await supabase.functions.invoke('generate-mjr', {
        body: { prospect: selected }
      })
      if (error) throw error
      setReport(data.report)
      buildWhatsAppMessage(data.report, selected)
      await supabase.from('prospects').update({ mjr_delivered_at: new Date().toISOString() }).eq('id', selected.id)
      toast('MJR generated ✓')
    } catch (e) {
      toast('Generation failed — check Anthropic API key in Supabase secrets', 'error')
      console.error(e)
    }
    setGenerating(false)
  }

  function buildWhatsAppMessage(r: MJRReport, p: Prospect) {
    const firstName = p.owner_name?.split(' ')[0] || 'there'
    const msg = `Hi ${firstName} — here's the Missed Jobs Report for ${p.business_name}.

${r.opportunity?.slice(0, 200)}...

The full report breaks down exactly what this costs monthly and what your competitors are doing differently.

Happy to walk you through it on a 15-minute call — no pitch, just the data. Worth it?`
    setWhatsappMsg(msg)
  }

  async function generateOutreachMessage() {
    if (!selected) { toast('Select a prospect first', 'error'); return }
    try {
      const { data } = await supabase.functions.invoke('generate-outreach', {
        body: { prospect: selected, message_type: 'cold_intro' }
      })
      if (data?.message) {
        navigator.clipboard.writeText(data.message)
        toast('Personalised message copied to clipboard ✓')
      }
    } catch {
      toast('Generation failed', 'error')
    }
  }

  function copySection(text: string, label: string) {
    navigator.clipboard.writeText(text)
    toast(`${label} copied`)
  }

  function copyWhatsApp() {
    navigator.clipboard.writeText(whatsappMsg)
    toast('WhatsApp delivery message copied ✓')
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, minHeight: 'calc(100vh - 120px)' }}>

      {/* Left — Prospect selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="card">
          <div className="section-label">Select Prospect</div>
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--grey2)' }} />
            <input className="input" placeholder="Search by name, suburb..."
              style={{ paddingLeft: 36 }} value={search}
              onChange={e => searchProspects(e.target.value)} />
          </div>

          {prospects.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
              {prospects.map(p => (
                <div key={p.id} onClick={() => { setSelected(p); setProspects([]); setSearch(p.business_name); setReport(null) }}
                  style={{ padding: '9px 12px', cursor: 'pointer', borderRadius: 4, background: 'var(--bg3)', border: '1px solid var(--border2)', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--teal)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border2)')}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{p.business_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--grey)', fontFamily: 'DM Mono' }}>{p.vertical} · {p.suburb}</div>
                </div>
              ))}
            </div>
          )}

          {selected && (
            <div style={{ background: 'var(--teal-faint)', border: '1px solid var(--teal-border)', borderRadius: 6, padding: '12px 14px' }}>
              <div style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Selected</div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{selected.business_name}</div>
              <div style={{ fontSize: 12, color: 'var(--grey)' }}>{selected.vertical} · {selected.suburb}</div>
              {selected.icp_tier && <div style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--teal)', marginTop: 6 }}>ICP: {selected.icp_tier} · {selected.icp_total_score}/25</div>}
              {selected.mjr_estimated_monthly_missed_revenue && (
                <div style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--amber)', marginTop: 2 }}>
                  Est. missed: {formatRand(selected.mjr_estimated_monthly_missed_revenue)}/mo
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card">
          <div className="section-label">Data Inputs</div>
          {selected ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              {[
                { label: 'Google Rating', value: selected.google_rating ? `${selected.google_rating} ★ (${selected.google_review_count} reviews)` : '—' },
                { label: 'Instagram', value: selected.instagram_handle ? `@${selected.instagram_handle} · ${selected.instagram_followers?.toLocaleString() || 0} followers` : '—' },
                { label: 'Last Post', value: selected.instagram_last_post_date || '—' },
                { label: 'Meta Ads', value: selected.has_meta_ads ? 'Running' : 'Not running' },
              ].map(f => (
                <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--grey)', fontFamily: 'DM Mono', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{f.label}</span>
                  <span style={{ color: 'var(--white)' }}>{f.value}</span>
                </div>
              ))}
              {selected.mjr_notes && (
                <div style={{ marginTop: 8, padding: 10, background: 'var(--bg3)', borderRadius: 4, fontSize: 12, color: 'var(--grey)', lineHeight: 1.6 }}>
                  {selected.mjr_notes}
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: 'var(--grey2)', fontSize: 12, fontFamily: 'DM Mono' }}>Select a prospect to see their data</div>
          )}
        </div>

        <button className="btn-primary" onClick={generateMJR}
          disabled={generating || !selected}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px' }}>
          <Zap size={14} />
          {generating ? 'Generating...' : 'Generate MJR →'}
        </button>

        {selected && !generating && (
          <button className="btn-secondary" onClick={generateOutreachMessage}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Copy size={12} /> Generate Outreach Message
          </button>
        )}
      </div>

      {/* Right — Report output */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {generating && (
          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontFamily: 'Playfair Display', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Generating MJR...</div>
            <div style={{ color: 'var(--grey)', fontSize: 14, fontFamily: 'DM Mono' }}>Claude is analysing the prospect data</div>
            <div style={{ marginTop: 20, display: 'flex', gap: 6, justifyContent: 'center' }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--teal)', opacity: 0.6, animation: `pulse-dot 1.4s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}

        {!report && !generating && (
          <div className="empty-state">
            <h3>MJR Studio</h3>
            <p>Select a prospect, review their data, then click Generate MJR. The AI will build a personalised Missed Jobs Report using their digital presence data and local market demand figures.</p>
          </div>
        )}

        {report && (
          <>
            {/* Report sections */}
            {[
              { key: 'opportunity', label: 'The Opportunity', color: 'var(--teal)' },
              { key: 'competitors', label: 'What Competitors Are Doing', color: 'var(--amber)' },
              { key: 'cost',        label: 'What This Costs Monthly', color: 'var(--red)' },
              { key: 'observations',label: 'What We Observed', color: 'var(--grey)' },
              { key: 'next_step',   label: 'The Next Step', color: 'var(--teal)' },
            ].map(s => (
              <div key={s.key} className="card" style={{ borderLeft: `3px solid ${s.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontFamily: 'DM Mono', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: s.color }}>{s.label}</div>
                  <button onClick={() => copySection((report as any)[s.key], s.label)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--grey2)' }}>
                    <Copy size={13} />
                  </button>
                </div>
                <div style={{ fontSize: 14, color: 'var(--white)', lineHeight: 1.8 }}>{(report as any)[s.key]}</div>
              </div>
            ))}

            {/* WhatsApp delivery message */}
            {whatsappMsg && (
              <div className="card glow">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div className="section-label" style={{ margin: 0 }}>WhatsApp Delivery Message</div>
                  <button className="btn-primary" onClick={copyWhatsApp} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
                    <Copy size={12} /> Copy Message
                  </button>
                </div>
                <div style={{ background: 'var(--bg3)', borderRadius: 6, padding: 14, fontSize: 13, color: 'var(--white)', lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: 'Barlow' }}>
                  {whatsappMsg}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-primary" onClick={() => copySection(report.full_report, 'Full report')}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Copy size={12} /> Copy Full Report
              </button>
              <button className="btn-secondary" onClick={generateMJR}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Zap size={12} /> Regenerate
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}