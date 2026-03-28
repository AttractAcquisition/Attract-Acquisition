// src/pages/Studio.tsx
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
// Matches the "preview_stats" object in generate-mjr.ts
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

interface MJRResult {
  html: string
  preview_stats: PreviewStats
  success: boolean
}

// ─── Components ───────────────────────────────────────────────────────────────
function GapBadge({ label, value }: { label: string; value: boolean | number | string }) {
  const isGood = value === true || (typeof value === 'number' && value >= 30)
  const isBad = value === false || value === 0 || (typeof value === 'number' && value < 10)

  const colour = isGood ? 'var(--teal)' : isBad ? '#FF4444' : '#F59E0B'
  const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 0', borderBottom: '1px solid var(--border2)',
    }}>
      <span style={{ color: 'var(--grey)', fontFamily: 'DM Mono', fontSize: 10, textTransform: 'uppercase' }}>
        {label}
      </span>
      <span style={{ color: colour, fontFamily: 'DM Mono', fontSize: 11, fontWeight: 500 }}>
        {display}
      </span>
    </div>
  )
}

function ReportIframe({ html }: { html: string }) {
  return (
    <iframe
      key={html.length} // Force refresh on new content
      srcDoc={html}
      style={{ width: '100%', height: '800px', border: 'none', background: '#0D0D0D' }}
      sandbox="allow-same-origin allow-scripts allow-popups"
    />
  )
}

export default function Studio() {
  const [search, setSearch] = useState('')
  const [allProspects, setAllProspects] = useState<Prospect[]>([])
  const [filteredProspects, setFilteredProspects] = useState<Prospect[]>([])
  const [selected, setSelected] = useState<Prospect | null>(null)
  const [mjrResult, setMjrResult] = useState<MJRResult | null>(null)
  const [generating, setGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const blobUrlRef = useRef<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('prospects').select('*').order('created_at', { ascending: false }).limit(100)
      if (data) { setAllProspects(data); setFilteredProspects(data) }
    }
    load()
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFilteredProspects(allProspects.filter(p => 
      p.business_name.toLowerCase().includes(q) || p.suburb?.toLowerCase().includes(q)
    ))
  }, [search, allProspects])

  async function generateMJR() {
    if (!selected) return
    setGenerating(true)
    setMjrResult(null)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const { data, error } = await supabase.functions.invoke<MJRResult>('generate-mjr', {
        body: { prospect: selected },
        headers: { Authorization: `Bearer ${session?.access_token}` }
      })

      if (error || !data?.success) throw new Error(error?.message || 'Assembling failed')

      // Create blob for PDF/External printing
      const blob = new Blob(['\uFEFF' + data.html], { type: 'text/html;charset=utf-8' })
      blobUrlRef.current = URL.createObjectURL(blob)
      
      setMjrResult(data)
      setShowPreview(true)
      toast('MJR Compiled ✓', 'success')
      
      await supabase.from('prospects').update({ mjr_delivered_at: new Date().toISOString() }).eq('id', selected.id)
    } catch (e: any) {
      toast(e.message, 'error')
    } finally {
      setGenerating(false)
    }
  }

  const printReport = () => {
    const win = window.open(blobUrlRef.current!, '_blank')
    win?.addEventListener('load', () => setTimeout(() => win.print(), 500))
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, height: 'calc(100vh - 120px)' }}>
      
      {/* Sidebar */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Users size={16} color="var(--teal)" />
          <span className="section-label">Prospect Explorer</span>
        </div>
        <input 
          className="input" 
          placeholder="Search..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          style={{ fontSize: 13 }}
        />
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredProspects.map(p => (
            <div 
              key={p.id} 
              onClick={() => { setSelected(p); setMjrResult(null); }}
              className={`prospect-card ${selected?.id === p.id ? 'active' : ''}`}
              style={{
                padding: 12, borderRadius: 8, cursor: 'pointer',
                background: selected?.id === p.id ? 'var(--teal-faint)' : 'var(--bg3)',
                border: `1px solid ${selected?.id === p.id ? 'var(--teal-border)' : 'var(--border2)'}`
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 13 }}>{p.business_name}</div>
              <div style={{ fontSize: 11, color: 'var(--grey)', fontFamily: 'DM Mono' }}>{p.suburb}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Workspace */}
      <div style={{ overflowY: 'auto' }}>
        {!selected ? (
          <div className="empty-state">
            <Target size={40} color="var(--border2)" />
            <h2 style={{ fontFamily: 'Playfair Display', marginTop: 16 }}>Ready for Generation</h2>
            <p>Select a prospect to begin the digital audit.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Control Bar */}
            <div className="card" style={{ display: 'flex', justifyContent: 'space-between', padding: 24 }}>
              <div>
                <h1 style={{ fontFamily: 'Playfair Display', margin: 0 }}>{selected.business_name}</h1>
                <p style={{ color: 'var(--grey)', fontSize: 12, fontFamily: 'DM Mono' }}>{selected.suburb} // {selected.vertical}</p>
              </div>
              <button className="btn-primary" onClick={generateMJR} disabled={generating}>
                <Zap size={16} /> {generating ? 'Researching...' : 'Generate MJR'}
              </button>
            </div>

            {mjrResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                  <div className="card" style={{ textAlign: 'center', padding: 20 }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--red)' }}>{mjrResult.preview_stats.estimated_missed}</div>
                    <div className="section-label">Est. Missed / Mo</div>
                  </div>
                  <div className="card" style={{ textAlign: 'center', padding: 20 }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--teal)' }}>{mjrResult.preview_stats.annual_ltv}</div>
                    <div className="section-label">Annual LTV</div>
                  </div>
                  <div className="card" style={{ textAlign: 'center', padding: 20 }}>
                    <div style={{ fontSize: 24, fontWeight: 700 }}>{mjrResult.preview_stats.job_value_range}</div>
                    <div className="section-label">Avg Job Value</div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 12 }}>
                  <button className="btn-secondary" style={{ flex: 1 }} onClick={printReport}><Printer size={14} /> Save as PDF</button>
                  <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowPreview(!showPreview)}><Eye size={14} /> {showPreview ? 'Hide' : 'Preview'}</button>
                  <button className="btn-secondary" onClick={() => navigator.clipboard.writeText(mjrResult.html)}><Copy size={14} /></button>
                </div>

                {showPreview && <ReportIframe html={mjrResult.html} />}
              </div>
            ) : (
              <div className="card" style={{ padding: 24 }}>
                <div className="section-label" style={{ marginBottom: 16 }}>Current Audit Context</div>
                <GapBadge label="Google Reviews" value={selected.google_review_count || 0} />
                <GapBadge label="Star Rating" value={selected.google_rating || 0} />
                <GapBadge label="Meta Ads" value={!!selected.has_meta_ads} />
                <GapBadge label="Instagram" value={selected.instagram_handle ? 'Active' : 'Missing'} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
