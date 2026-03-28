import { useState, useRef, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Prospect } from '../lib/supabase'
import {
  Search, Zap, Copy, ExternalLink,
  Download, Printer, CheckCircle, Eye,
  Users, Target
} from 'lucide-react'
import { useToast } from '../lib/toast'

// ─── Types ────────────────────────────────────────────────────────────────────
interface PreviewStats {
  business_name: string
  sector: string
  geography: string
  job_value_range: string
  annual_ltv: string
  estimated_missed: string
  google_reviews: number
  has_instagram: boolean
  running_ads: boolean
}

interface SPOAResult {
  html: string
  preview_stats: PreviewStats
  success: boolean
}

// ─── Components ───────────────────────────────────────────────────────────────
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

  const colour = isGood ? 'var(--teal)' : isBad ? '#FF4444' : '#F59E0B'
  const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 0', borderBottom: '1px solid var(--border2)',
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

function ReportIframe({ html, title, height = 800 }: { html: string; title: string; height?: number }) {
  return (
    <iframe
      key={html}
      title={title}
      srcDoc={html}
      style={{
        width: '100%',
        height,
        border: 'none',
        display: 'block',
        background: '#0D0D0D',
      }}
      sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
    />
  )
}

// ─── Main SPOA Component ────────────────────────────────────────────────────
export default function SPOA() {
  const [search, setSearch] = useState('')
  const [allProspects, setAllProspects] = useState<Prospect[]>([])
  const [filteredProspects, setFilteredProspects] = useState<Prospect[]>([])
  const [selected, setSelected] = useState<Prospect | null>(null)
  const [spoaResult, setSpoaResult] = useState<SPOAResult | null>(null)
  const [generating, setGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const blobUrlRef = useRef<string | null>(null)
  const { toast } = useToast()

  // ── Load Prospects on Mount ─────────────────────────────────────────────────
  useEffect(() => {
    async function loadProspects() {
      const { data } = await supabase
        .from('prospects')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      
      if (data) {
        setAllProspects(data)
        setFilteredProspects(data)
      }
    }
    loadProspects()
  }, [])

  // ── Client-side Filtering ───────────────────────────────────────────────────
  useEffect(() => {
    const q = search.toLowerCase()
    setFilteredProspects(
      allProspects.filter(p => 
        p.business_name.toLowerCase().includes(q) || 
        p.suburb?.toLowerCase().includes(q) ||
        p.vertical?.toLowerCase().includes(q)
      )
    )
  }, [search, allProspects])

  // ── Cleanup Blob URLs ───────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
    }
  }, [])

  // ── Actions ─────────────────────────────────────────────────────────────────
  function selectProspect(p: Prospect) {
    setSelected(p)
    setSpoaResult(null)
    setShowPreview(false)
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }
  }

  async function generateSPOA() {
    if (!selected) { toast('Select a prospect first', 'error'); return }

    setGenerating(true)
    setSpoaResult(null)
    setShowPreview(false)

    // Clear previous blob immediately to avoid memory leaks/stale previews
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

      // ⚡ Invoke Edge Function
      const { data, error } = await supabase.functions.invoke<SPOAResult>('spoa-generator', {
        body: { prospect: selected },
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (error) throw error
      if (!data) throw new Error('No response data received')
      if (!data.success) throw new Error((data as any).error || 'Generation failed')

      const html = data.html?.trim() ?? ''
      if (!html) throw new Error('Empty HTML returned — please regenerate')

      // Create new Blob URL
      const bom = '\uFEFF'
      const blob = new Blob([bom + html], { type: 'text/html;charset=utf-8' })
      blobUrlRef.current = URL.createObjectURL(blob)

      setSpoaResult(data)
      setShowPreview(true)

      // Update CRM record with delivery timestamp
      const { error: updateError } = await supabase
        .from('prospects')
        .update({ spoa_delivered_at: new Date().toISOString() })
        .eq('id', selected.id)

      if (updateError) console.warn('[SPOA] CRM timestamp update failed:', updateError.message)

      toast('SPOA generated successfully ✓', 'success')

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('[SPOA Studio] generateSPOA error:', msg)
      toast(msg || 'Generation failed — check API logs', 'error')
    } finally {
      setGenerating(false)
    }
  }

  const openInNewTab = useCallback(() => {
    if (!blobUrlRef.current) return
    window.open(blobUrlRef.current, '_blank', 'noopener')
  }, [])

  const downloadHTML = useCallback(() => {
    if (!spoaResult?.html || !selected) return
    const bom = '\uFEFF'
    const blob = new Blob([bom + spoaResult.html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const name = selected.business_name.replace(/[^a-zA-Z0-9]/g, '_')

    a.href = url
    a.download = `SPOA_${name}_${new Date().toISOString().slice(0, 10)}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast('SPOA HTML downloaded ✓', 'success')
  }, [spoaResult, selected, toast])

  const printReport = useCallback(() => {
    if (!blobUrlRef.current) return
    const win = window.open(blobUrlRef.current, '_blank', 'noopener')
    if (win) {
      win.onload = () => {
        win.focus()
        // Small delay to ensure styles/images within the iframe doc are painted
        setTimeout(() => win.print(), 500)
      }
    }
  }, [])

  const copyFullHTML = useCallback(() => {
    if (!spoaResult?.html) return
    navigator.clipboard.writeText(spoaResult.html).then(() => {
      toast('Full HTML copied to clipboard ✓', 'success')
    })
  }, [spoaResult, toast])

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '320px 1fr',
      gap: 24,
      height: 'calc(100vh - 100px)',
    }}>
      {/* Pulse Animation Definition */}
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>

      {/* ── LEFT PANEL: PROSPECT EXPLORER ───────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={16} style={{ color: 'var(--teal)' }} />
            <div className="section-label" style={{ margin: 0 }}>Prospect Explorer</div>
          </div>
          
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{
              position: 'absolute', left: 12, top: '50%',
              transform: 'translateY(-50%)', color: 'var(--grey2)',
            }} />
            <input
              className="input"
              placeholder="Search by name, suburb..."
              style={{ paddingLeft: 34, fontSize: 13 }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div style={{ 
            flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, paddingRight: 4 
          }}>
            {filteredProspects.length === 0 ? (
              <div style={{ color: 'var(--grey2)', fontSize: 12, textAlign: 'center', marginTop: 20, fontFamily: 'DM Mono' }}>
                No prospects found
              </div>
            ) : (
              filteredProspects.map(p => (
                <div
                  key={p.id}
                  onClick={() => selectProspect(p)}
                  style={{
                    padding: '12px', cursor: 'pointer', borderRadius: 6,
                    background: selected?.id === p.id ? 'var(--teal-faint)' : 'var(--bg3)',
                    border: `1px solid ${selected?.id === p.id ? 'var(--teal-border)' : 'var(--border2)'}`,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: selected?.id === p.id ? 'var(--teal)' : 'var(--white)', marginBottom: 2 }}>
                    {p.business_name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--grey)', fontFamily: 'DM Mono' }}>
                    {p.vertical} · {p.suburb}
                  </div>
                  {p.icp_tier && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, fontFamily: 'DM Mono' }}>
                      <span style={{ color: 'var(--teal)' }}>TIER {p.icp_tier}</span>
                      <span style={{ color: 'var(--grey2)' }}>{p.icp_total_score}/25 pts</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL: WORKSPACE ──────────────────────────────────────────── */}
      <div style={{ overflowY: 'auto', paddingRight: 8 }}>
        {!selected ? (
          <div className="empty-state" style={{ height: '100%', minHeight: 400 }}>
            <Target size={40} style={{ color: 'var(--border2)', marginBottom: 16 }} />
            <h2 style={{ fontFamily: 'Playfair Display', margin: '0 0 12px 0' }}>SPOA Workspace</h2>
            <p style={{ color: 'var(--grey)', maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.5 }}>
              Select a prospect from the explorer to review their data and generate a complete, branded Strategic Plan of Action (SPOA).
            </p>
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 8,
              textAlign: 'left', background: 'var(--bg3)', padding: '16px 20px', 
              borderRadius: 6, fontSize: 12, color: 'var(--grey)', width: '100%', maxWidth: 400
            }}>
              <div style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--teal)', textTransform: 'uppercase', marginBottom: 6 }}>
                SPOA Output Includes:
              </div>
              <div style={{ display: 'flex', gap: 8 }}><span style={{ color: 'var(--teal)' }}>·</span> Custom Acquisition Funnel Map</div>
              <div style={{ display: 'flex', gap: 8 }}><span style={{ color: 'var(--teal)' }}>·</span> Step-by-Step Execution Sequence</div>
              <div style={{ display: 'flex', gap: 8 }}><span style={{ color: 'var(--teal)' }}>·</span> ROI & Lead Cost Projections</div>
              <div style={{ display: 'flex', gap: 8 }}><span style={{ color: 'var(--teal)' }}>·</span> "No-Brainer" Closing Offer</div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', padding: '24px' }}>
              <div>
                <h1 style={{ fontFamily: 'Playfair Display', fontSize: 28, margin: 0, color: 'var(--white)' }}>
                  {selected.business_name}
                </h1>
                <p style={{ color: 'var(--grey)', margin: '6px 0 0 0', fontFamily: 'DM Mono', fontSize: 12 }}>
                  {selected.vertical} // {selected.suburb}
                </p>
              </div>
              
              <button
                className="btn-primary"
                onClick={generateSPOA}
                disabled={generating}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '14px 24px', fontSize: 14, height: 'fit-content'
                }}
              >
                <Zap size={16} />
                {generating ? 'Drafting Strategy...' : 'Generate SPOA →'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: spoaResult && !generating ? '1fr' : '350px 1fr', gap: 20 }}>
              
              {!spoaResult && (
                <div className="card" style={{ padding: 24 }}>
                  <div className="section-label" style={{ marginBottom: 16 }}>Target Audit Data</div>
                  <GapBadge label="Google Reviews" value={selected.google_review_count || 0} />
                  <GapBadge label="Star Rating" value={selected.google_rating ? `${selected.google_rating}★` : 'Unrated'} />
                  <GapBadge
                    label="Instagram"
                    value={selected.instagram_handle ? `@${selected.instagram_handle}` : 'None'}
                  />
                  <GapBadge label="Meta Ads Active" value={!!selected.has_meta_ads} />
                  <GapBadge label="Last Post" value={selected.instagram_last_post_date || '—'} />
                  
                  {selected.mjr_notes && (
                    <div style={{ marginTop: 20, padding: 14, background: 'var(--bg2)', borderRadius: 6 }}>
                      <div style={{ fontSize: 10, color: 'var(--teal)', fontFamily: 'DM Mono', marginBottom: 8, textTransform: 'uppercase' }}>
                        Analyst Notes
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--grey)', lineHeight: 1.6 }}>
                        {selected.mjr_notes}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {generating && (
                  <div className="card" style={{ textAlign: 'center', padding: '60px 40px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontFamily: 'Playfair Display', fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
                      Mapping Acquisition Strategy...
                    </div>
                    <div style={{ color: 'var(--grey2)', fontSize: 13, marginBottom: 32 }}>
                      Claude is designing a custom funnel for {selected.business_name}, structuring the deployment phases, and calculating ROI logic.
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{
                          width: 10, height: 10, borderRadius: '50%',
                          background: 'var(--teal)', opacity: 0.6,
                          animation: `pulse-dot 1.4s ease-in-out ${i * 0.2}s infinite`,
                        }} />
                      ))}
                    </div>
                    <div style={{ marginTop: 32, fontSize: 11, color: 'var(--grey2)', fontFamily: 'DM Mono' }}>
                      Typically takes 45–60 seconds. Do not refresh.
                    </div>
                  </div>
                )}

                {spoaResult && !generating && (
                  <>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                      padding: '16px 20px', borderRadius: 8,
                      background: 'rgba(0,201,167,0.08)', border: '1px solid rgba(0,201,167,0.25)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <CheckCircle size={20} style={{ color: 'var(--teal)', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--white)' }}>
                            Strategic Plan Compiled Successfully
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--grey)', fontFamily: 'DM Mono', marginTop: 4 }}>
                            {spoaResult.preview_stats.sector} · Generated at {new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button className="btn-primary" onClick={openInNewTab} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', fontSize: 12 }}>
                          <ExternalLink size={14} /> Open
                        </button>
                        <button className="btn-secondary" onClick={printReport} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', fontSize: 12 }}>
                          <Printer size={14} /> Save PDF
                        </button>
                        <button className="btn-secondary" onClick={() => setShowPreview(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', fontSize: 12 }}>
                          <Eye size={14} /> {showPreview ? 'Hide' : 'Preview'}
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                      <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
                        <div style={{ fontFamily: 'Playfair Display', fontSize: 24, fontWeight: 700, color: '#FF4444', marginBottom: 6 }}>
                          {spoaResult.preview_stats.estimated_missed}
                        </div>
                        <div style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          Target Recapture
                        </div>
                      </div>
                      <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
                        <div style={{ fontFamily: 'Playfair Display', fontSize: 24, fontWeight: 700, color: 'var(--teal)', marginBottom: 6 }}>
                          {spoaResult.preview_stats.annual_ltv}
                        </div>
                        <div style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          Annual LTV / Client
                        </div>
                      </div>
                      <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
                        <div style={{ fontFamily: 'Playfair Display', fontSize: 24, fontWeight: 700, color: 'var(--white)', marginBottom: 6 }}>
                          {spoaResult.preview_stats.job_value_range}
                        </div>
                        <div style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          Avg Job Value
                        </div>
                      </div>
                    </div>

                    <div className="card" style={{ borderLeft: '3px solid var(--teal)', padding: '20px' }}>
                      <div className="section-label" style={{ marginBottom: 16 }}>Delivery Sequence (SOP 03)</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <div style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--teal)', fontWeight: 600 }}>01</div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)', marginBottom: 4 }}>Save Document</div>
                            <div style={{ fontSize: 11, color: 'var(--grey)', lineHeight: 1.5 }}>Click "Save PDF" above. Choose "Save as PDF" in the system dialog.</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <div style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--teal)', fontWeight: 600 }}>02</div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)', marginBottom: 4 }}>Follow-Up Timing</div>
                            <div style={{ fontSize: 11, color: 'var(--grey)', lineHeight: 1.5 }}>Send only after the prospect has viewed and responded to the MJR hook.</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <div style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--teal)', fontWeight: 600 }}>03</div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)', marginBottom: 4 }}>Send Asset</div>
                            <div style={{ fontSize: 11, color: 'var(--grey)', lineHeight: 1.5 }}>Drop the SPOA in WhatsApp. Push for the closing discovery call.</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                      <button className="btn-secondary" onClick={generateSPOA} style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center' }}>
                        <Zap size={13} /> Regenerate SPOA
                      </button>
                      <button className="btn-secondary" onClick={downloadHTML} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 24px' }}>
                        <Download size={13} /> Source HTML
                      </button>
                      <button className="btn-secondary" onClick={copyFullHTML} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 24px' }}>
                        <Copy size={13} /> Copy HTML
                      </button>
                    </div>

                    {showPreview && (
                      <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border2)', marginTop: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg2)', borderBottom: '1px solid var(--border2)' }}>
                          <div style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            Live SPOA Preview
                          </div>
                        </div>
                        <ReportIframe html={spoaResult.html} title="SPOA Preview" />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
