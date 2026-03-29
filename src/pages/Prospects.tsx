import { useEffect, useState, useMemo } from 'react'
import { supabase, type Prospect } from '../lib/supabase'
import { 
  Search, Plus, RefreshCw, ChevronRight, X, Save, 
  Calendar as CalendarIcon, CheckCircle2, ChevronLeft, Target 
} from 'lucide-react'
import { useAuth } from '../lib/auth'
import ProspectDetailView from '../components/prospects/ProspectDetailView'
import { useToast } from '../lib/toast'
import { format, subDays, addDays } from 'date-fns'

const STAGES = ['First Touch', 'Positive Response', 'MJR Sent', 'Follow Up', 'Call Booked', 'Sprint Booked']
const DAILY_TARGET = 25;

const ICP_TIERS = [
  { value: '★★★', label: '3 Star (High)' },
  { value: '★★', label: '2 Star (Mid)' },
  { value: '★', label: '1 Star (Low)' },
  { value: 'unscored', label: 'Unscored' }
]

export default function Prospects() {
  const { role, metadata_id } = useAuth()
  const { toast } = useToast()
  
  // Core State
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [search, setSearch] = useState('')
  
  // UI States
  const [selected, setSelected] = useState<Prospect | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form State
  const initialFormState = {
    business_name: '',
    vertical: '',
    suburb: '',
    phone: '',
    website: '',
    pipeline_stage: 'First Touch',
    icp_tier: 'unscored',
    target_date: format(new Date(), 'yyyy-MM-dd')
  }
  const [newProspect, setNewProspect] = useState<Partial<Prospect>>(initialFormState)

  useEffect(() => { load() }, [selectedDate, metadata_id])

  async function load() {
    setLoading(true)
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    
    let { data, error } = await supabase
      .from('prospects')
      .select('*')
      .eq('target_date', dateStr)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
    
    if (error) {
      toast(`Error: ${error.message}`, 'error')
    } else {
      setProspects((data || []).map(p => ({ ...p, pipeline_stage: p.pipeline_stage || 'First Touch' })))
    }
    setLoading(false)
  }

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProspect.business_name) return toast('Business name is required', 'error')
    
    setIsSaving(true)
    const payload = {
      ...newProspect,
      target_date: format(selectedDate, 'yyyy-MM-dd'),
      data_source: 'manual',
      assigned_to: role === 'distribution' ? metadata_id : null
    }

    const { data, error } = await supabase
      .from('prospects')
      .insert([payload])
      .select()

    if (error) {
      toast(`Error: ${error.message}`, 'error')
    } else if (data) {
      toast('Prospect added to daily batch')
      setProspects(prev => [data[0], ...prev])
      setShowAdd(false)
      setNewProspect(initialFormState)
    }
    setIsSaving(false)
  }

  // Daily Progress Stats
  const stats = useMemo(() => {
    const completed = prospects.filter(p => p.pipeline_stage !== 'First Touch').length
    const progress = Math.min((completed / DAILY_TARGET) * 100, 100)
    return { completed, progress }
  }, [prospects])

  const filtered = prospects.filter((p: Prospect) => {
    return !search || [p.business_name, p.owner_name, p.suburb, p.vertical]
      .some(f => f?.toLowerCase().includes(search.toLowerCase()))
  })

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Batch Navigation Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-bg2 border border-border2 rounded-lg p-1">
              <button onClick={() => setSelectedDate(subDays(selectedDate, 1))} className="p-1 hover:text-teal"><ChevronLeft size={20} /></button>
              <div className="px-4 font-semibold flex items-center gap-2">
                <CalendarIcon size={14} className="text-teal" />
                {format(selectedDate, 'EEE, MMM do')}
              </div>
              <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="p-1 hover:text-teal"><ChevronRight size={20} /></button>
            </div>
            {format(selectedDate, 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd') && (
              <button 
                onClick={() => setSelectedDate(new Date())}
                className="text-xs text-teal hover:underline font-mono"
              >
                RETURN TO TODAY
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-3">
           <button className="btn-secondary" onClick={load}><RefreshCw size={14} /> Refresh</button>
           <button className="btn-primary" onClick={() => setShowAdd(true)}><Plus size={14} /> Add Prospect</button>
        </div>
      </div>

      {/* Daily Target Tracker */}
      <div className="card p-6 border-teal/10 bg-teal/5 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full border-2 border-teal/30 flex items-center justify-center text-teal">
              <Target size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg">Daily Outreach Goal</h3>
              <p className="text-sm text-grey">Target: {DAILY_TARGET} personalized messages</p>
            </div>
          </div>
          
          <div className="w-full md:w-64">
            <div className="flex justify-between mb-2 text-xs font-mono">
              <span>PROGRESS</span>
              <span>{stats.completed} / {DAILY_TARGET}</span>
            </div>
            <div className="h-2 w-full bg-bg3 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-teal shadow-[0_0_10px_rgba(0,201,167,0.5)] transition-all duration-700" 
                style={{ width: `${stats.progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-grey" />
        <input 
          className="input w-full pl-11" 
          placeholder="Filter today's batch..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
      </div>

      {/* Main List / Table */}
      <div className="card p-0 overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="p-12 space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-16 w-full bg-white/5 animate-pulse rounded-lg" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-20 text-center">
            <CheckCircle2 size={48} className="mx-auto mb-4 text-grey opacity-20" />
            <h3 className="text-grey font-medium">Clean Slate</h3>
            <p className="text-sm text-grey2">No prospects assigned to this date yet.</p>
          </div>
        ) : (
          <table className="aa-table">
            <thead>
              <tr><th>Business</th><th>Vertical</th><th>Score</th><th>Stage</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map((p: Prospect) => (
                <tr key={p.id} onClick={() => setSelected(p)} className="cursor-pointer group">
                  <td>
                    <div className="font-medium group-hover:text-teal transition-colors">{p.business_name}</div>
                    <div className="text-xs text-grey">{p.suburb}</div>
                  </td>
                  <td className="text-sm text-grey">{p.vertical}</td>
                  <td>
                    <span className="font-mono text-teal text-sm bg-teal/5 px-2 py-1 rounded">
                      {p.icp_total_score || 0}/25
                    </span>
                  </td>
                  <td>
                    <span className={`badge text-[10px] ${p.pipeline_stage !== 'First Touch' ? 'bg-teal/20 text-teal' : 'bg-bg3 text-grey'}`}>
                      {p.pipeline_stage}
                    </span>
                  </td>
                  <td><ChevronRight size={14} className="text-grey opacity-0 group-hover:opacity-100 transition-opacity" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div onClick={() => !isSaving && setShowAdd(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="card relative w-full max-w-lg p-8 z-[101] border-teal/20">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold font-playfair">Add to {format(selectedDate, 'MMM do')} Batch</h3>
              <button onClick={() => setShowAdd(false)} className="hover:text-teal"><X size={20} /></button>
            </div>

            <form onSubmit={handleManualAdd} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-grey block mb-1">BUSINESS NAME *</label>
                <input required className="input w-full" value={newProspect.business_name || ''} onChange={e => setNewProspect({...newProspect, business_name: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-grey block mb-1">VERTICAL</label>
                  <input className="input w-full" value={newProspect.vertical || ''} onChange={e => setNewProspect({...newProspect, vertical: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-mono text-grey block mb-1">TIER</label>
                  <select className="input w-full" value={newProspect.icp_tier || 'unscored'} onChange={e => setNewProspect({...newProspect, icp_tier: e.target.value})}>
                    {ICP_TIERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              <button type="submit" disabled={isSaving} className="btn-primary w-full py-3 mt-4 flex justify-center gap-2">
                {isSaving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                {isSaving ? 'Saving...' : 'Confirm for Today'}
              </button>
            </form>
          </div>
        </div>
      )}

      {selected && (
        <ProspectDetailView 
          prospect={selected} 
          onClose={() => setSelected(null)} 
          onUpdate={(updates) => {
            setProspects(prev => prev.map(p => p.id === selected.id ? { ...p, ...updates } : p))
            setSelected(prev => prev ? { ...prev, ...updates } : null)
          }}
          onDelete={(id) => {
             setProspects(prev => prev.filter(p => p.id !== id))
             setSelected(null)
          }}
        />
      )}
    </div>
  )
}
