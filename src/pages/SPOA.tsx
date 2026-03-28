import { useState, useRef, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Prospect } from '../lib/supabase'
import {
  Search, Zap,
  Download, Printer, Eye,
  Users, Target, ShieldCheck
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
  error?: string
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

  // ── Load Prospects ──────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadProspects() {
      const { data } = await supabase
        .from('prospects')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      
      if (data) {
        setAllProspects(data as Prospect[])
        setFilteredProspects(data as Prospect[])
      }
    }
    loadProspects()
  }, [])

  // ── Search Filtering ────────────────────────────────────────────────────────
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

  // ── Cleanup ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
    }
  }, [])

  // ── Logic ───────────────────────────────────────────────────────────────────
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

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Session expired')

      const { data, error } = await supabase.functions.invoke<SPOAResult>('spoa-generator', {
        body: { prospect: selected },
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (error) throw error
      if (!data?.success || !data.html) throw new Error(data?.error || 'Generation failed')

      // Create Blob for preview/printing
      const bom = '\uFEFF'
      const blob = new Blob([bom + data.html], { type: 'text/html;charset=utf-8' })
      blobUrlRef.current = URL.createObjectURL(blob)

      setSpoaResult(data)
      setShowPreview(true)

      // Update CRM timestamp
      await supabase
        .from('prospects')
        .update({ spoa_delivered_at: new Date().toISOString() } as any)
        .eq('id', selected.id)

      toast('SPOA compiled successfully ✓', 'success')
    } catch (e: any) {
      console.error('[SPOA] Error:', e.message)
      toast(e.message || 'Check connection to edge functions', 'error')
    } finally {
      setGenerating(false)
    }
  }

  const downloadHTML = useCallback(() => {
    if (!spoaResult?.html || !selected) return
    const blob = new Blob(['\uFEFF' + spoaResult.html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `SPOA_${selected.business_name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.html`
    a.click()
    URL.revokeObjectURL(url)
  }, [spoaResult, selected])

  const printReport = useCallback(() => {
    if (!blobUrlRef.current) return
    const win = window.open(blobUrlRef.current, '_blank')
    if (win) {
      win.onload = () => {
        win.focus()
        setTimeout(() => { win.print(); }, 500)
      }
    }
  }, [])

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, height: 'calc(100vh - 100px)',
    }}>
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>

      {/* Sidebar: Prospect List */}
      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={16} style={{ color: 'var(--teal)' }} />
          <div className="section-label" style={{ margin: 0 }}>Prospect Explorer</div>
        </div>
        
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--grey2)' }} />
          <input
            className="input"
            placeholder="Search name or suburb..."
            style={{ paddingLeft: 34, fontSize: 13 }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filteredProspects.map(p => (
            <div
              key={p.id}
              onClick={() => selectProspect(p)}
              style={{
                padding: '12px', cursor: 'pointer', borderRadius: 6,
                background: selected?.id === p.id ? 'var(--teal-faint)' : 'var(--bg3)',
                border: `1px solid ${selected?.id === p.id ? 'var(--teal-border)' : 'var(--border2)'}`,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: selected?.id === p.id ? 'var(--teal)' : 'var(--white)', marginBottom: 2 }}>
                {p.business_name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--grey)', fontFamily: 'DM Mono' }}>
                {p.vertical} · {p.suburb}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Workspace */}
      <div style={{ overflowY: 'auto', paddingRight: 8 }}>
        {!selected ? (
          <div className="empty-state" style={{ height: '100%' }}>
            <Target size={40} style={{ color: 'var(--border2)', marginBottom: 16 }} />
            <h2 style={{ fontFamily: 'Playfair Display' }}>SPOA Studio</h2>
            <p style={{ color: 'var(--grey)', maxWidth: 400 }}>Select a prospect to generate their legally binding Strategic Plan of Action.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Header Card */}
            <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px' }}>
              <div>
                <h1 style={{ fontFamily: 'Playfair Display', fontSize: 28, margin: 0 }}>{selected.business_name}</h1>
                <p style={{ color: 'var(--grey)', margin: '6px 0 0 0', fontFamily: 'DM Mono', fontSize: 12 }}>
                  {selected.vertical} // {selected.suburb}
                </p>
              </div>
              <button
                className="btn-primary"
                onClick={generateSPOA}
                disabled={generating}
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <Zap size={16} />
                {generating ? 'Compiling Strategy...' : 'Execute SPOA Generation →'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: spoaResult ? '1fr' : '350px 1fr', gap: 20 }}>
              {/* Audit View (Hidden when SPOA is active) */}
              {!spoaResult && (
                <div className="card" style={{ padding: 24 }}>
                  <div className="section-label" style={{ marginBottom: 16 }}>Infrastructure Audit</div>
                  <GapBadge label="Google Reviews" value={selected.google_review_count || 0} />
                  <GapBadge label="Star Rating" value={selected.google_rating ? `${selected.google_rating}★` : 'Unrated'} />
                  <GapBadge label="Instagram" value={selected.instagram_handle ? `@${selected.instagram_handle}` : 'None'} />
                  <GapBadge label="Meta Ads Active" value={!!selected.has_meta_ads} />
                  {selected.mjr_notes && (
                    <div style={{ marginTop: 20, padding: 14, background: 'var(--bg2)', borderRadius: 6 }}>
                      <div style={{ fontSize: 10, color: 'var(--teal)', fontFamily: 'DM Mono', marginBottom: 8 }}>ANALYSIS NOTES</div>
                      <div style={{ fontSize: 12, color: 'var(--grey)', lineHeight: 1.6 }}>{selected.mjr_notes}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Result View */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {generating && (
                  <div className="card" style={{ textAlign: 'center', padding: '80px 40px' }}>
                    <div style={{ fontFamily: 'Playfair Display', fontSize: 24, marginBottom: 16 }}>Structuring Acquisition Engine...</div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{
                          width: 10, height: 10, borderRadius: '50%', background: 'var(--teal)',
                          animation: `pulse-dot 1.4s ease-in-out ${i * 0.2}s infinite`,
                        }} />
                      ))}
                    </div>
                  </div>
                )}

                {spoaResult && !generating && (
                  <>
                    {/* Success Toolbar */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '16px 20px', borderRadius: 8, background: 'rgba(0,201,167,0.08)', border: '1px solid var(--teal-border)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <ShieldCheck size={20} style={{ color: 'var(--teal)' }} />
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>Strategic Plan Compiled</div>
                          <div style={{ fontSize: 11, color: 'var(--grey)', fontFamily: 'DM Mono' }}>Version 1.0 // South African Law Compliant</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button className="btn-secondary" onClick={printReport} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                          <Printer size={14} /> Print / Save PDF
                        </button>
                        <button className="btn-secondary" onClick={() => setShowPreview(!showPreview)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                          <Eye size={14} /> {showPreview ? 'Hide' : 'Preview'}
                        </button>
                        <button className="btn-primary" onClick={downloadHTML} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                          <Download size={14} /> Source
                        </button>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                      <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
                        <div style={{ fontFamily: 'Playfair Display', fontSize: 24, fontWeight: 700, color: '#FF4444' }}>{spoaResult.preview_stats.estimated_missed}</div>
                        <div style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--grey)', marginTop: 4 }}>REVENUE GAP</div>
                      </div>
                      <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
                        <div style={{ fontFamily: 'Playfair Display', fontSize: 24, fontWeight: 700, color: 'var(--teal)' }}>{spoaResult.preview_stats.annual_ltv}</div>
                        <div style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--grey)', marginTop: 4 }}>ANNUAL LTV</div>
                      </div>
                      <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
                        <div style={{ fontFamily: 'Playfair Display', fontSize: 24, fontWeight: 700 }}>{spoaResult.preview_stats.job_value_range}</div>
                        <div style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--grey)', marginTop: 4 }}>AVG JOB VALUE</div>
                      </div>
                    </div>

                    {/* SOP Steps */}
                    <div className="card" style={{ borderLeft: '3px solid var(--teal)', padding: '24px' }}>
                      <div className="section-label" style={{ marginBottom: 20 }}>SOP 03 — Delivery Sequence</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <div style={{ fontFamily: 'DM Mono', color: 'var(--teal)', fontWeight: 'bold' }}>01</div>
                          <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--off-white)' }}>
                            <span style={{ fontWeight: 600, display: 'block', color: 'var(--white)' }}>Verification</span>
                            Review Schedule A for geographic and sector accuracy.
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <div style={{ fontFamily: 'DM Mono', color: 'var(--teal)', fontWeight: 'bold' }}>02</div>
                          <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--off-white)' }}>
                            <span style={{ fontWeight: 600, display: 'block', color: 'var(--white)' }}>Legal Signature</span>
                            Obtain signature from authorized representative (Party B).
                          </div>
                        </div>
                      </div>
                    </div>

                    {showPreview && (
                      <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border2)', marginTop: 8 }}>
                        <ReportIframe html={spoaResult.html} title="SPOA Live Preview" />
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
