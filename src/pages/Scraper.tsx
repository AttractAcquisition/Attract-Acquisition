import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Play, CheckCircle, Plus, Loader2 } from 'lucide-react'
import { useToast } from '../lib/toast'

const VERTICALS = [
  'Auto Detailing', 'Vehicle Wrapping', 'Car Wash', 'Pet Grooming', 'Pet Salon',
  'Trailer Manufacturing', 'Metal Fabrication', 'Engineering Shop',
  'Home Renovation', 'Landscaping', 'Plumbing', 'Electrical', 'HVAC',
  'Courier / Logistics', 'Physio / Wellness', 'Dental Clinic', 'Personal Training',
]

const CAPE_TOWN_SUBURBS = [
  'Cape Town CBD', 'Woodstock', 'Salt River', 'Observatory', 'Mowbray',
  'Rondebosch', 'Claremont', 'Wynberg', 'Retreat', 'Mitchells Plain',
  'Bellville', 'Parow', 'Goodwood', 'Pinelands', 'Paarl', 'Stellenbosch',
  'Somerset West', 'Strand', 'Gordon\'s Bay', 'Kuils River',
  'Brackenfell', 'Kraaifontein', 'Milnerton', 'Table View', 'Bloubergstrand',
  'Hout Bay', 'Constantia', 'Tokai', 'Muizenberg', 'Simon\'s Town',
]

interface ScraperResult {
  business_name: string
  vertical: string
  suburb: string
  address: string
  phone: string
  website: string
  google_rating: number | null
  google_review_count: number
  saved?: boolean
}

export default function Scraper() {
  const [vertical, setVertical] = useState('')
  const [customVertical, setCustom] = useState('')
  const [suburb, setSuburb] = useState('')
  const [city, setCity] = useState('Cape Town')
  const [maxResults, setMaxResults] = useState(30)
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<ScraperResult[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const activeVertical = customVertical.trim() || vertical

  async function runScraper() {
    if (!activeVertical) {
      toast('Select or enter a vertical first', 'error')
      return
    }

    setRunning(true)
    setResults([])
    setSelected(new Set())

    try {
      const { data, error } = await supabase.functions.invoke('run-apify', {
        body: { 
          vertical: activeVertical, 
          city, 
          suburb, 
          max_results: maxResults 
        }
      })

      console.log("🔍 Full response from Edge Function:", data) // ← remove after testing

      if (error) throw error

      const prospects: ScraperResult[] = data?.prospects || data || []

      if (prospects.length === 0) {
        toast('No businesses found', 'warning')
      } else {
        setResults(prospects)
        setSelected(new Set(prospects.map((_, i) => i)))
        toast(`✅ ${prospects.length} businesses loaded`, 'success')
      }

    } catch (e: any) {
      console.error(e)
      toast(`Scraper error: ${e.message || e}`, 'error')
    } finally {
      setRunning(false)
    }
  }

  async function saveSelected() {
    const toSave = results.filter((_, i) => selected.has(i))
    if (toSave.length === 0) { toast('Select at least one business', 'error'); return }
    setSaving(true)

    const { data: existing } = await supabase.from('prospects').select('business_name')
    const existingNames = new Set((existing || []).map((p: any) => p.business_name.toLowerCase()))
    const newProspects = toSave.filter(p => !existingNames.has(p.business_name.toLowerCase()))
    const dupeCount = toSave.length - newProspects.length

    if (newProspects.length > 0) {
      const { error } = await supabase.from('prospects').insert(
        newProspects.map(p => ({ ...p, status: 'new', data_source: 'apify' }))
      )
      if (error) { toast('Save failed', 'error'); setSaving(false); return }
    }

    setResults(prev => prev.map((r, i) => selected.has(i) ? { ...r, saved: true } : r))
    setSaving(false)
    toast(`${newProspects.length} prospects saved${dupeCount > 0 ? ` · ${dupeCount} duplicates skipped` : ''} ✓`)
  }

  function toggleAll() {
    if (selected.size === results.length) setSelected(new Set())
    else setSelected(new Set(results.map((_, i) => i)))
  }

  function toggleOne(i: number) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Controls - Original UI */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card">
            <div className="section-label">Scraper Settings</div>

            <div style={{ marginBottom: 12 }}>
              <div className="label">Vertical</div>
              <select className="input" value={vertical} onChange={e => { setVertical(e.target.value); setCustom('') }}>
                <option value="">Select vertical...</option>
                {VERTICALS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div className="label">Or enter custom vertical</div>
              <input className="input" placeholder="e.g. Swimming Pool Cleaning"
                value={customVertical} onChange={e => { setCustom(e.target.value); setVertical('') }} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <div className="label">City</div>
              <input className="input" value={city} onChange={e => setCity(e.target.value)} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <div className="label">Suburb (optional — narrows results)</div>
              <select className="input" value={suburb} onChange={e => setSuburb(e.target.value)}>
                <option value="">All Cape Town</option>
                {CAPE_TOWN_SUBURBS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div className="label">Max Results: {maxResults}</div>
              <input type="range" min={10} max={100} step={10} value={maxResults}
                onChange={e => setMaxResults(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--teal)' }} />
            </div>

            <button className="btn-primary" onClick={runScraper} disabled={running || !activeVertical}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14 }}>
              {running ? <Loader2 className="animate-spin" size={16} /> : <Play size={14} />}
              {running ? 'Scraping... (up to 2 min)' : `Run Apify Scraper →`}
            </button>
          </div>

          {/* Stats + Save */}
          {results.length > 0 && (
            <div className="card">
              <div className="section-label">Run Summary</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>Businesses found: {results.length}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>Selected to save: {selected.size}</div>
              </div>
              <button className="btn-primary" onClick={saveSelected} disabled={saving || selected.size === 0}>
                <Plus size={12} />
                {saving ? 'Saving...' : `Save ${selected.size} to Prospects →`}
              </button>
            </div>
          )}
        </div>

        {/* Results */}
        <div>
          {results.length === 0 && !running && (
            <div className="empty-state">
              <h3>Apify Scraper</h3>
              <p>Select a vertical and location, then run the scraper. Results load directly into your prospects table. Takes 1–2 minutes.</p>
            </div>
          )}

          {running && (
            <div className="text-center py-12">
              <Loader2 className="animate-spin mx-auto" size={48} />
              <p className="mt-4">Apify is scraping Google Maps...</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="card">
              <button onClick={toggleAll} className="text-sm text-teal-600 hover:underline mb-3">
                {selected.size === results.length ? 'Deselect all' : 'Select all'}
              </button>
              {results.map((r, i) => (
                <div key={i} onClick={() => toggleOne(i)}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    padding: 12, 
                    background: selected.has(i) ? 'var(--teal-faint)' : 'transparent', 
                    cursor: 'pointer',
                    borderBottom: '1px solid #eee'
                  }}>
                  <div>{r.business_name}</div>
                  {r.saved && <CheckCircle size={18} color="var(--green)" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}