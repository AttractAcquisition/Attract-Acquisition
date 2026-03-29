import { useEffect, useState, useMemo } from 'react'
import { supabase, type Prospect } from '../lib/supabase'
import { 
  Search, User, Copy, Check, Calendar as CalendarIcon, 
  ChevronLeft, ChevronRight, Target 
} from 'lucide-react'
import { useToast } from '../lib/toast'
import { format, subDays, addDays } from 'date-fns'

interface Template {
  id: string
  title: string
  category: string | null
  content: string | null
  variables: string[] | null
}

const DAILY_TARGET = 25;

export default function Outreach() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProspectId, setSelectedProspectId] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [preview, setPreview] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Load templates once, load prospects when date changes
  useEffect(() => { loadTemplates() }, [])
  useEffect(() => { loadDailyProspects() }, [selectedDate])

  async function loadTemplates() {
    const { data } = await supabase.from('templates').select('*').eq('category', 'whatsapp')
    if (data) {
      setTemplates(data.map(t => ({
        ...t,
        category: t.category ?? null,
        content: t.content ?? '',
        variables: t.variables ?? [],
      })))
    }
  }

  async function loadDailyProspects() {
    setLoading(true)
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    const { data, error } = await supabase
      .from('prospects')
      .select('*')
      .eq('target_date', dateStr)
      .eq('is_archived', false)
      .order('icp_total_score', { ascending: false })

    if (error) {
      toast(`Error: ${error.message}`, 'error')
    } else {
      setProspects((data as Prospect[]) || [])
    }
    setLoading(false)
  }

  // Preview Logic
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
      .replace(/{vertical}/g, (prospect as any)?.vertical ?? '{vertical}')
      .replace(/{suburb}/g, (prospect as any)?.suburb ?? '{suburb}')
  }

  const handleCopy = async () => {
    if (!preview || !selectedProspectId) return
    try {
      await navigator.clipboard.writeText(preview)
      setCopied(true)
      toast('Message copied to clipboard ✓')

      // Fix: Cast update object as any to allow pipeline_stage if not in generated types
      const { error } = await supabase
        .from('prospects')
        .update({ pipeline_stage: 'MJR Sent' } as any) 
        .eq('id', selectedProspectId)

      if (!error) {
        setProspects(prev => prev.map(p => 
          p.id === selectedProspectId ? { ...p, pipeline_stage: 'MJR Sent' } : p
        ))
      }

      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast('Failed to copy', 'error')
    }
  }

  const stats = useMemo(() => {
    const completed = prospects.filter(p => (p as any).pipeline_stage !== 'First Touch').length
    const progress = Math.min((completed / DAILY_TARGET) * 100, 100)
    return { completed, progress }
  }, [prospects])

  const filteredProspects = prospects.filter(p => 
    p.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.owner_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Date Navigation & Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-bg2 border border-border2 rounded-lg p-1">
            <button onClick={() => setSelectedDate(subDays(selectedDate, 1))} className="p-1 hover:text-teal"><ChevronLeft size={20} /></button>
            <div className="px-4 font-semibold flex items-center gap-2 text-sm">
              <CalendarIcon size={14} className="text-teal" />
              {format(selectedDate, 'EEE, MMM do')}
            </div>
            <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="p-1 hover:text-teal"><ChevronRight size={20} /></button>
          </div>
          {format(selectedDate, 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd') && (
            <button onClick={() => setSelectedDate(new Date())} className="text-xs text-teal hover:underline font-mono">RETURN TO TODAY</button>
          )}
        </div>
        <div className="text-grey text-xs font-mono uppercase tracking-widest">Outreach Terminal</div>
      </div>

      {/* Daily Progress */}
      <div className="card p-4 border-teal/10 bg-teal/5">
        <div className="flex justify-between items-center gap-4">
           <div className="flex items-center gap-3">
              <Target size={18} className="text-teal" />
              <span className="text-sm font-bold uppercase tracking-tight">Today's Outreach Progress</span>
           </div>
           <div className="flex items-center gap-4 flex-1 max-w-xs">
              <div className="h-1.5 w-full bg-bg3 rounded-full overflow-hidden">
                <div className="h-full bg-teal transition-all duration-500" style={{ width: `${stats.progress}%` }} />
              </div>
              <span className="text-xs font-mono whitespace-nowrap">{stats.completed} / {DAILY_TARGET}</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: PROSPECT LIST */}
        <div className="space-y-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-grey" />
            <input 
              className="input w-full pl-10 text-sm" 
              placeholder="Search batch..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="h-16 w-full bg-white/5 animate-pulse rounded-lg" />)
            ) : filteredProspects.map(p => (
              <div
                key={p.id}
                onClick={() => setSelectedProspectId(p.id)}
                className={`p-4 cursor-pointer rounded-lg border transition-all ${
                  selectedProspectId === p.id 
                    ? 'border-teal bg-teal/5 shadow-[0_0_15px_rgba(0,242,166,0.1)]' 
                    : 'border-border2 bg-bg2 hover:border-grey'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    (p as any).pipeline_stage !== 'First Touch' ? 'bg-teal/20 text-teal' : 'bg-bg3 text-grey'
                  }`}>
                    { (p as any).pipeline_stage !== 'First Touch' ? <Check size={14} /> : <User size={14} /> }
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className={`text-sm font-bold truncate ${selectedProspectId === p.id ? 'text-teal' : ''}`}>
                      {p.business_name}
                    </div>
                    <div className="text-[10px] text-grey uppercase font-mono truncate">
                      {p.owner_name || 'No Owner'} • {p.suburb}
                    </div>
                  </div>
                  <div className="text-xs font-mono bg-bg3 px-2 py-0.5 rounded text-teal">
                    {p.icp_total_score || 0}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: TEMPLATES & PREVIEW */}
        <div className="flex flex-col gap-6">
          <div className="space-y-3">
            <label className="text-[10px] font-mono text-grey uppercase tracking-widest">Select Template</label>
            <div className="grid grid-cols-1 gap-2">
              {templates.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t)}
                  className={`text-left p-3 rounded border transition-all ${
                    selectedTemplate?.id === t.id ? 'border-teal bg-teal/5' : 'border-border2 bg-bg2'
                  }`}
                >
                  <div className="text-xs font-bold">{t.title}</div>
                  <div className="text-[10px] text-grey line-clamp-1">{t.content?.slice(0, 50)}...</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-[300px]">
            {preview ? (
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-mono text-grey uppercase tracking-widest">Message Preview</label>
                  <button 
                    onClick={handleCopy}
                    className={copied ? "btn-primary text-[10px] py-1 px-3" : "btn-secondary text-[10px] py-1 px-3"}
                  >
                    {copied ? <Check size={12} className="mr-1" /> : <Copy size={12} className="mr-1" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="flex-1 p-6 bg-bg3 border border-border2 rounded-lg text-sm leading-relaxed whitespace-pre-wrap font-sans text-white/90">
                  {preview}
                </div>
              </div>
            ) : (
              <div className="flex-1 border-2 border-dashed border-border2 rounded-lg flex flex-col items-center justify-center p-8 text-center">
                <p className="text-xs text-grey italic leading-relaxed">
                  Select a prospect from today's batch and an outreach template to generate a message.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
