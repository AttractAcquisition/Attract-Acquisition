// src/pages/Studio.tsx
import { useState, useRef, useCallback, useEffect } from 'react'
import { supabase }     from '../lib/supabase'
import type { Prospect } from '../lib/supabase'
import { formatRand }   from '../lib/utils'
import {
  Search, Zap, Copy, ExternalLink,
  Download, Printer, FileText, CheckCircle, Eye,
} from 'lucide-react'
import { useToast } from '../lib/toast'

// ─── Types ────────────────────────────────────────────────────────────────────
interface PreviewStats {
  business_name:    string
  sector:           string
  geography:        string
  job_value_range:  string
  annual_ltv:       string
  estimated_missed: string
  google_reviews:   number
  has_instagram:    boolean
  running_ads:      boolean
}

interface MJRResult {
  html:          string
  preview_stats: PreviewStats
  success:       boolean
}

// ─── Gap badge ────────────────────────────────────────────────────────────────
function GapBadge({ label, value }: { label: string; value: boolean | number | string }) {
  const isGood =
    value === true ||
    value === 'yes' ||
    (typeof value === 'number' && value >= 50)
  const isBad =
    value === false ||
    value === 'no' ||
    value === 0 ||
    (typeof value === 'number' && value < 10)

  const colour = isGood
    ? 'var(--teal)'
    : isBad
    ? '#FF4444'
    : '#F59E0B'

  const display =
    typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '6px 0', borderBottom: '1px solid var(--border2)',
    }}>
      <span style={{
        color: 'var(--grey)', fontFamily: 'DM Mono', fontSize: 10,
        textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>
        {label}
      </span>
      <span style={{ color: colour, fontFamily: 'DM Mono', fontSize: 11, fontWeight: 500 }}>
        {display}
      </span>
    </div>
  )
}

// ─── Sandboxed iframe renderer ────────────────────────────────────────────────
// Uses srcDoc so the browser parses the full HTML document cleanly,
// completely isolated from the parent app's CSS and dark-mode styles.
function ReportIframe({
  html,
  title,
  height = 700,
}: {
  html:    string
  title:   string
  height?: number
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Write via document.open/write for maximum compatibility
  // (avoids 4MB srcdoc attribute limit in some browsers)
  useEffect(() => {
    const frame = iframeRef.current
    if (!frame) return

    // Wait for the iframe element to be ready
    const write = () => {
      try {
        const doc = frame.contentDocument ?? frame.contentWindow?.document
        if (!doc) return
        doc.open()
        doc.write(html)
        doc.close()
      } catch (err) {
        // Cross-origin fallback — shouldn't happen with blob: but guard anyway
        console.warn('[ReportIframe] document.write failed, falling back to srcDoc', err)
        frame.srcdoc = html
      }
    }

    if (frame.contentDocument?.readyState === 'complete') {
      write()
    } else {
      frame.addEventListener('load', write, { once: true })
      // Trigger the load event by setting a blank src
      if (!frame.src) frame.src = 'about:blank'
    }
  }, [html])

  return (
    <iframe
      ref={iframeRef}
      title={title}
      style={{ width: '100%', height, border: 'none', display: 'block', background: '#0D0D0D' }}
      // Allow scripts for Google Fonts @import and font loading
      // allow-popups-to-escape-sandbox so print dialog works
      sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
    />
  )
}

// ─── Main Studio component ────────────────────────────────────────────────────
export default function Studio() {
  const [search,       setSearch]       = useState('')
  const [prospects,    setProspects]    = useState<Prospect[]>([])
  const [selected,     setSelected]     = useState<Prospect | null>(null)
  const [mjrResult,    setMjrResult]    = useState<MJRResult | null>(null)
  const [generating,   setGenerating]   = useState(false)
  const [showPreview,  setShowPreview]  = useState(false)
  const blobUrlRef                      = useRef<string | null>(null)
  const { toast }                       = useToast()

  // ── Cleanup blob URLs on unmount ────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
      }
    }
  }, [])

  // ── Search ──────────────────────────────────────────────────────────────────
  async function searchProspects(q: string) {
    setSearch(q)
    if (q.length < 2) { setProspects([]); return }

    const { data } = await supabase
      .from('prospects')
      .select('*')
      .or(`business_name.ilike.%${q}%,owner_name.ilike.%${q}%,suburb.ilike.%${q}%`)
      .limit(8)

    setProspects(data || [])
  }

  function selectProspect(p: Prospect) {
    setSelected(p)
    setProspects([])
    setSearch(p.business_name)
    setMjrResult(null)
    setShowPreview(false)

    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }
  }

  // ── Generate MJR ────────────────────────────────────────────────────────────
  async function generateMJR() {
    if (!selected) { toast('Select a prospect first', 'error'); return }

    setGenerating(true)
    setMjrResult(null)
    setShowPreview(false)

    // Clean up previous blob URL
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast('Session expired — please sign in again', 'error')
        setGenerating(false)
        return
      }

      const { data, error } = await supabase.functions.invoke<MJRResult>('generate-mjr', {
        body:    { prospect: selected },
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (error) throw error
      if (!data)         throw new Error('No response data received')
      if (!data.success) throw new Error((data as unknown as { error: string }).error || 'Generation failed')

      // ── Validate HTML ─────────────────────────────────────────────────────
      const html = data.html?.trim() ?? ''

      if (!html) {
        throw new Error('Empty HTML returned — please regenerate')
      }
      if (!html.toLowerCase().startsWith('<!doctype') && !html.toLowerCase().startsWith('<html')) {
        throw new Error(`Unexpected response format. Preview the raw HTML to debug.`)
      }

      // ── Build Blob URL for "Open in New Tab" and "Print" ─────────────────
      // Use UTF-8 BOM to ensure correct encoding
      const bom  = '\uFEFF'
      const blob = new Blob([bom + html], { type: 'text/html;charset=utf-8' })
      blobUrlRef.current = URL.createObjectURL(blob)

      setMjrResult(data)

      // ── Update CRM ────────────────────────────────────────────────────────
      await supabase
        .from('prospects')
        .update({ mjr_delivered_at: new Date().toISOString() })
        .eq('id', selected.id)

      toast('MJR generated successfully ✓', 'success')

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('[Studio] generateMJR error:', msg)
      toast(msg || 'Generation failed — check Anthropic API key in Supabase secrets', 'error')
    }

    setGenerating(false)
  }

  // ── Report actions ───────────────────────────────────────────────────────────
  const openInNewTab = useCallback(() => {
    if (!blobUrlRef.current) return
    window.open(blobUrlRef.current, '_blank', 'noopener')
  }, [])

  const downloadHTML = useCallback(() => {
    if (!mjrResult?.html || !selected) return

    const bom  = '\uFEFF'
    const blob = new Blob([bom + mjrResult.html], { type: 'text/html;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    const name = selected.business_name.replace(/[^a-zA-Z0-9]/g, '_')

    a.href     = url
    a.download = `MJR_${name}_${new Date().toISOString().slice(0, 10)}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast('HTML report downloaded ✓', 'success')
  }, [mjrResult, selected, toast])

  const printReport = useCallback(() => {
    if (!blobUrlRef.current) return
    const win = window.open(blobUrlRef.current, '_blank', 'noopener')
    if (win) {
      // Give fonts time to load before triggering print
      win.addEventListener('load', () => {
        setTimeout(() => win.print(), 800)
      })
    }
  }, [])

  const copyFullHTML = useCallback(() => {
    if (!mjrResult?.html) return
    navigator.clipboard.writeText(mjrResult.html).then(() => {
      toast('Full HTML copied to clipboard ✓', 'success')
    })
  }, [mjrResult, toast])

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '300px 1fr',
      gap: 20,
      minHeight: 'calc(100vh - 120px)',
    }}>

      {/* ── LEFT PANEL ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Search */}
        <div className="card">
          <div className="section-label">Select Prospect</div>

          <div style={{ position: 'relative', marginBottom: 12 }}>
            <Search size={13} style={{
              position: 'absolute', left: 12, top: '50%',
              transform: 'translateY(-50%)', color: 'var(--grey2)',
            }} />
            <input
              className="input"
              placeholder="Search name, suburb, sector..."
              style={{ paddingLeft: 36 }}
              value={search}
              onChange={e => searchProspects(e.target.value)}
            />
          </div>

          {prospects.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
              {prospects.map(p => (
                <div
                  key={p.id}
                  onClick={() => selectProspect(p)}
                  style={{
                    padding: '9px 12px', cursor: 'pointer', borderRadius: 4,
                    background: 'var(--bg3)', border: '1px solid var(--border2)',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--teal)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border2)' }}
                >
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{p.business_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--grey)', fontFamily: 'DM Mono' }}>
                    {p.vertical} · {p.suburb}
                  </div>
                </div>
              ))}
            </div>
          )}

          {selected && (
            <div style={{
              background: 'var(--teal-faint)', border: '1px solid var(--teal-border)',
              borderRadius: 6, padding: '12px 14px',
            }}>
              <div style={{
                fontFamily: 'DM Mono', fontSize: 10, color: 'var(--teal)',
                textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6,
              }}>
                Selected Prospect
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>
                {selected.business_name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--grey)' }}>
                {selected.vertical} · {selected.suburb}
              </div>
              {selected.icp_tier && (
                <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--teal)', marginTop: 6 }}>
                  ICP: {selected.icp_tier} · {selected.icp_total_score}/25
                </div>
              )}
              {selected.mjr_estimated_monthly_missed_revenue && (
                <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: '#F59E0B', marginTop: 2 }}>
                  Est. missed: {formatRand(selected.mjr_estimated_monthly_missed_revenue)}/mo
                </div>
              )}
            </div>
          )}
        </div>

        {/* Data inputs */}
        <div className="card">
          <div className="section-label">Data Inputs</div>
          {selected ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <GapBadge label="Google Reviews" value={selected.google_review_count || 0} />
              <GapBadge label="Star Rating"    value={selected.google_rating ? `${selected.google_rating}★` : 'Unrated'} />
              <GapBadge
                label="Instagram"
                value={
                  selected.instagram_handle
                    ? `@${selected.instagram_handle} · ${(selected.instagram_followers || 0).toLocaleString()} followers`
                    : 'None'
                }
              />
              <GapBadge label="Meta Ads"  value={!!selected.has_meta_ads} />
              <GapBadge label="Last Post" value={selected.instagram_last_post_date || '—'} />
              {selected.mjr_notes && (
                <div style={{
                  marginTop: 10, padding: 10, background: 'var(--bg3)',
                  borderRadius: 4, fontSize: 12, color: 'var(--grey)', lineHeight: 1.6,
                }}>
                  <div style={{
                    fontFamily: 'DM Mono', fontSize: 9, color: 'var(--teal)',
                    textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4,
                  }}>
                    Notes / USP
                  </div>
                  {selected.mjr_notes}
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: 'var(--grey2)', fontSize: 12, fontFamily: 'DM Mono' }}>
              Select a prospect to see their data
            </div>
          )}
        </div>

        {/* Generate button */}
        <button
          className="btn-primary"
          onClick={generateMJR}
          disabled={generating || !selected}
          style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 8, padding: '14px',
          }}
        >
          <Zap size={14} />
          {generating ? 'Generating MJR...' : 'Generate MJR →'}
        </button>

        {/* Report actions */}
        {mjrResult && !generating && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{
              fontFamily: 'DM Mono', fontSize: 9, color: 'var(--teal)',
              textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center',
            }}>
              Report Ready
            </div>

            <button
              className="btn-primary"
              onClick={openInNewTab}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <ExternalLink size={13} /> Open in New Tab
            </button>

            <button
              className="btn-secondary"
              onClick={printReport}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <Printer size={13} /> Print / Save as PDF
            </button>

            <button
              className="btn-secondary"
              onClick={downloadHTML}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <Download size={13} /> Download HTML
            </button>

            <button
              className="btn-secondary"
              onClick={() => setShowPreview(v => !v)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <Eye size={13} /> {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>

            <button
              className="btn-secondary"
              onClick={copyFullHTML}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 6, opacity: 0.7,
              }}
            >
              <Copy size={12} /> Copy HTML Source
            </button>
          </div>
        )}
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Generating */}
        {generating && (
          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <div style={{
              fontFamily: 'Playfair Display', fontSize: 22,
              fontWeight: 700, marginBottom: 8,
            }}>
              Building Missed Jobs Report...
            </div>
            <div style={{ color: 'var(--grey)', fontSize: 13, fontFamily: 'DM Mono', marginBottom: 4 }}>
              {selected?.business_name} · {selected?.suburb}
            </div>
            <div style={{ color: 'var(--grey2)', fontSize: 12, marginBottom: 24 }}>
              Researching local market, identifying competitors, calculating missed revenue
            </div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--teal)', opacity: 0.6,
                  animation: `pulse-dot 1.4s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
            <div style={{ marginTop: 24, fontSize: 11, color: 'var(--grey2)', fontFamily: 'DM Mono' }}>
              Typically 30–60 seconds — full market research in progress
            </div>
          </div>
        )}

        {/* Empty state */}
        {!mjrResult && !generating && (
          <div className="empty-state">
            <FileText size={32} style={{ color: 'var(--mid-grey)', marginBottom: 12 }} />
            <h3>MJR Studio</h3>
            <p style={{ maxWidth: 380 }}>
              Select a prospect from the CRM, review their digital data, then click Generate MJR.
              Claude will research the local market and build a complete, branded 30-Day Missed Jobs Report
              ready to deliver via WhatsApp.
            </p>
            <div style={{
              marginTop: 20, display: 'flex', flexDirection: 'column', gap: 6,
              textAlign: 'left', background: 'var(--bg3)',
              padding: '14px 18px', borderRadius: 6, fontSize: 12, color: 'var(--grey)',
            }}>
              <div style={{
                fontFamily: 'DM Mono', fontSize: 9, color: 'var(--teal)',
                textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4,
              }}>
                What gets generated
              </div>
              {[
                'Cover page with live-researched missed revenue stats',
                'Section 01 — Dynamic local demand analysis + suburb table',
                'Section 02 — Real named competitors in target suburb',
                'Section 03 — Specific pipeline gap audit with figures',
                'Section 04 — Step-by-step missed revenue calculation',
                'Section 05 — Priority action plan with revenue impact',
                'Proof of system + Next Step / Sprint CTA',
              ].map(item => (
                <div key={item} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--teal)', marginTop: 1 }}>·</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Report ready */}
        {mjrResult && !generating && (
          <>
            {/* Success banner */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 18px', borderRadius: 8,
              background: 'rgba(0,201,167,0.08)', border: '1px solid rgba(0,201,167,0.25)',
            }}>
              <CheckCircle size={16} style={{ color: 'var(--teal)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--white)' }}>
                  MJR ready for {mjrResult.preview_stats.business_name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--grey)', fontFamily: 'DM Mono', marginTop: 2 }}>
                  {mjrResult.preview_stats.sector} · {mjrResult.preview_stats.geography} ·
                  Generated {new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button
                  className="btn-primary"
                  onClick={openInNewTab}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', fontSize: 12 }}
                >
                  <ExternalLink size={12} /> Open Report
                </button>
                <button
                  className="btn-secondary"
                  onClick={printReport}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', fontSize: 12 }}
                >
                  <Printer size={12} /> PDF
                </button>
              </div>
            </div>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                {
                  label:  'Est. Missed Revenue',
                  value:  mjrResult.preview_stats.estimated_missed,
                  colour: '#FF4444',
                },
                {
                  label:  'Annual LTV / Client',
                  value:  mjrResult.preview_stats.annual_ltv,
                  colour: 'var(--teal)',
                },
                {
                  label:  'Avg Job Value',
                  value:  mjrResult.preview_stats.job_value_range,
                  colour: 'var(--white)',
                },
              ].map(stat => (
                <div key={stat.label} className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
                  <div style={{
                    fontFamily: 'Playfair Display', fontSize: 20,
                    fontWeight: 700, color: stat.colour, marginBottom: 4,
                  }}>
                    {stat.value}
                  </div>
                  <div style={{
                    fontFamily: 'DM Mono', fontSize: 9, color: 'var(--grey)',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                  }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Digital presence audit */}
            <div className="card">
              <div className="section-label" style={{ marginBottom: 12 }}>
                Digital Presence Audit — Input to Report
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  {
                    label:  'Google Reviews',
                    status: mjrResult.preview_stats.google_reviews >= 50
                      ? 'ok'
                      : mjrResult.preview_stats.google_reviews >= 10
                      ? 'warn'
                      : 'crit',
                    value: `${mjrResult.preview_stats.google_reviews} reviews`,
                    note:  mjrResult.preview_stats.google_reviews < 10
                      ? 'Critical — invisible in local search'
                      : mjrResult.preview_stats.google_reviews < 50
                      ? 'Below local pack threshold'
                      : 'Healthy review base',
                  },
                  {
                    label:  'Instagram',
                    status: mjrResult.preview_stats.has_instagram ? 'ok' : 'crit',
                    value:  mjrResult.preview_stats.has_instagram ? 'Active' : 'None',
                    note:   mjrResult.preview_stats.has_instagram
                      ? 'Profile exists'
                      : 'Critical — zero visual proof distribution',
                  },
                  {
                    label:  'Meta Ads',
                    status: mjrResult.preview_stats.running_ads ? 'ok' : 'crit',
                    value:  mjrResult.preview_stats.running_ads ? 'Running' : 'Not running',
                    note:   mjrResult.preview_stats.running_ads
                      ? 'Ads active'
                      : 'Critical — no paid demand capture',
                  },
                  {
                    label:  'Paid Social Channel',
                    status: mjrResult.preview_stats.running_ads ? 'ok' : 'open',
                    value:  mjrResult.preview_stats.running_ads ? 'Occupied' : 'Open',
                    note:   mjrResult.preview_stats.running_ads
                      ? 'Has paid presence'
                      : 'Opportunity — channel uncontested',
                  },
                ].map(item => {
                  const colour   = item.status === 'ok'   ? 'var(--teal)'
                                 : item.status === 'warn' ? '#F59E0B'
                                 : item.status === 'open' ? '#F59E0B'
                                 : '#FF4444'
                  const bgColour = item.status === 'ok'   ? 'rgba(0,201,167,0.06)'
                                 : item.status === 'warn' ? 'rgba(245,158,11,0.06)'
                                 : item.status === 'open' ? 'rgba(245,158,11,0.06)'
                                 : 'rgba(255,68,68,0.06)'
                  return (
                    <div
                      key={item.label}
                      style={{
                        padding: '10px 12px', borderRadius: 6,
                        background: bgColour, border: `1px solid ${colour}33`,
                      }}
                    >
                      <div style={{
                        fontFamily: 'DM Mono', fontSize: 9, color: colour,
                        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3,
                      }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--white)', marginBottom: 2 }}>
                        {item.value}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--grey)' }}>{item.note}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Delivery guide */}
            <div className="card" style={{ borderLeft: '3px solid var(--teal)' }}>
              <div className="section-label" style={{ marginBottom: 10 }}>
                Delivery Instructions — SOP 02 / SOP 01
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  {
                    step:   '01',
                    label:  'Open in New Tab',
                    action: 'Click "Open Report" above. Review all sections and verify figures before sending.',
                    icon:   <ExternalLink size={11} />,
                  },
                  {
                    step:   '02',
                    label:  'Save as PDF',
                    action: 'In the open tab, press Cmd+P (Mac) or Ctrl+P (Windows). Select "Save as PDF". Save with client name.',
                    icon:   <Printer size={11} />,
                  },
                  {
                    step:   '03',
                    label:  'WhatsApp delivery',
                    action: 'Send warm framing message first. Then send the PDF. Voice note within 1 hour referencing the missed revenue figure. See SOP 01 / SOP 02 for full sequence.',
                    icon:   <Copy size={11} />,
                  },
                ].map(item => (
                  <div key={item.step} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--teal)', minWidth: 20 }}>
                      {item.step}
                    </div>
                    <div>
                      <div style={{
                        fontSize: 12, fontWeight: 500, color: 'var(--white)',
                        marginBottom: 2, display: 'flex', alignItems: 'center', gap: 5,
                      }}>
                        {item.icon} {item.label}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--grey)', lineHeight: 1.5 }}>
                        {item.action}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Regenerate row */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn-secondary"
                onClick={generateMJR}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  flex: 1, justifyContent: 'center',
                }}
              >
                <Zap size={12} /> Regenerate Report
              </button>
              <button
                className="btn-secondary"
                onClick={downloadHTML}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Download size={12} /> Download HTML
              </button>
            </div>
          </>
        )}

        {/* ── Inline iframe preview ─────────────────────────────────────── */}
        {showPreview && mjrResult && (
          <div style={{
            borderRadius: 8, overflow: 'hidden',
            border: '1px solid var(--border2)',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 14px', background: 'var(--bg2)',
              borderBottom: '1px solid var(--border2)',
            }}>
              <div style={{
                fontFamily: 'DM Mono', fontSize: 10, color: 'var(--teal)',
                textTransform: 'uppercase', letterSpacing: '0.1em',
              }}>
                Report Preview — {mjrResult.preview_stats.business_name}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={openInNewTab}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--grey)', display: 'flex', alignItems: 'center',
                    gap: 4, fontSize: 11,
                  }}
                >
                  <ExternalLink size={11} /> Full screen
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--grey)', fontSize: 18, lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* KEY FIX: ReportIframe uses document.write to inject HTML cleanly,
                completely isolated from the parent app's global styles */}
            <ReportIframe
              html={mjrResult.html}
              title={`MJR Preview — ${mjrResult.preview_stats.business_name}`}
              height={700}
            />
          </div>
        )}
      </div>
    </div>
  )
}