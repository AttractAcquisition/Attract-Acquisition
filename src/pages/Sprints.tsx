import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { CheckCircle2, Circle, ChevronRight, ChevronDown, Loader2, Gift, Zap, ExternalLink } from 'lucide-react'
import { useToast } from '../lib/toast'

const TIER_NAME = 'Proof Sprint'

// ─── Type Definitions ──────────────────────────────────────────────────────────

interface StepDef {
  id: number
  phase: 1 | 2
  title: string
  value: string
  solves: string
  description: string
  tools: string[]
  items: string[]
}

interface BonusDef {
  id: string
  stepId: number   // stepId 11–14 for bonuses
  title: string
  value: string
  description: string
  items: string[]
}

// ─── DB Position Encoding ──────────────────────────────────────────────────────
// Step items:  step.id * 1000 + item_index  (0–998)
// Step notes:  step.id * 1000 + 999
// Bonus items: bonus.stepId * 1000 + item_index  (stepId 11–14)
// New-format rows always have position >= 1000

// ─── Sprint Step Definitions ───────────────────────────────────────────────────

const SPRINT_STEPS: StepDef[] = [
  // ── PHASE 1: SPRINT SETUP ──────────────────────────────────────────────────
  {
    id: 1,
    phase: 1,
    title: 'Business Intelligence & Positioning Lock',
    value: 'R2,500',
    solves: 'Running generic ads that represent nobody and convert nobody',
    description:
      'Before a creative is built or a campaign is structured, we collect every input needed to represent the business accurately: services, average job value, location radius, unique positioning, and the best proof images available. Internally, we extract the core transformation type, primary buying trigger, top three customer intents, and the dominant competitor angle in the area. A single dominant positioning formula is locked before anything goes to market.',
    tools: ['AA Brief Form', 'Market Research', 'Competitor Analysis'],
    items: [
      'AA Brief Form completed in full',
      'Services, average job value, and location radius documented',
      'Proof images collected from client',
      'Core transformation type identified (visual / functional / emotional)',
      'Primary buying trigger locked (urgent / aesthetic / preventative / status)',
      'Top 3 customer intents documented',
      'Dominant competitor angle in area researched and noted',
      'Single dominant positioning formula locked',
    ],
  },
  {
    id: 2,
    phase: 1,
    title: 'AA Studio Proof Ad Production',
    value: 'R3,500',
    solves: 'Ads that fail to stop scroll or communicate capability in the first frame',
    description:
      'Before/after images are transformed into high-converting visual proof ads through the AA Studio production pipeline. Every ad is structured around a three-frame psychological sequence: Frame 1 — the raw, imperfect before state. Frame 2 — the clean, desirable after. Frame 3 — an outcome-driven overlay that eliminates the top objection in a single line. These are the primary weapons of the Sprint — not decorative content.',
    tools: ['AA Studio', 'Before/After Framework', 'Outcome Copy'],
    items: [
      'Before/after images received and approved for production',
      'Frame 1 (raw, imperfect before state) produced',
      'Frame 2 (clean, desirable after) produced',
      'Frame 3 outcome-driven overlay copy written',
      'Top objection identified and addressed in Frame 3 overlay',
      'Primary proof ad completed and reviewed',
      'Minimum 2 creative variants finalised in AA Studio',
    ],
  },
  {
    id: 3,
    phase: 1,
    title: 'AdCreative.ai Variant Suite',
    value: 'R1,500',
    solves: 'Single-creative tests that produce no actionable data on angle or format',
    description:
      'Alongside the AA Studio proof ads, a controlled variant suite is produced via AdCreative.ai to test angle variation at volume: pain-based ads (what the problem costs), outcome-based ads (what the result looks like), and offer-based ads (what the next step is). Every variant is constrained to the positioning lock. We enter the market with minimum four creatives, ensuring data from the first seven days reflects angle performance, not just spend volume.',
    tools: ['AdCreative.ai', 'Pain-Based Variants', 'Offer-Based Variants'],
    items: [
      'Pain-based ad variant produced (what the problem costs)',
      'Outcome-based ad variant produced (what the result looks like)',
      'Offer-based ad variant produced (what the next step is)',
      'All variants reviewed against the positioning lock',
      'Minimum 4 creatives total ready for market entry',
      'AdCreative.ai account configured and assets exported',
    ],
  },
  {
    id: 4,
    phase: 1,
    title: 'Lead Magnet Asset Creation',
    value: 'R2,000',
    solves: "Losing lower-intent demand that isn't ready to message yet",
    description:
      "Not every prospect who sees the ad is ready to send a message on Day 1. The lead magnet captures this lower-intent demand through a value-first asset — a format selected based on the vertical: Price Guide, Buyer's Checklist, Common Mistakes to Avoid, or a Before-You-Hire guide. Each lead magnet increases perceived expertise, pre-frames the buying decision, and drives a form submission into the pipeline.",
    tools: ['Claude Build', 'Meta Instant Form', 'AA Pipeline'],
    items: [
      "Lead magnet format selected for vertical (Price Guide / Checklist / Mistakes / Hire Guide)",
      'Lead magnet content written and designed',
      'Meta Instant Form created with name, phone, and service interest fields',
      'Form tested — submissions confirmed routing correctly',
      'Lead magnet connected to AA Pipeline',
      'Submission notification and handling set up',
    ],
  },
  {
    id: 5,
    phase: 1,
    title: 'Dual-Campaign Meta Structure',
    value: 'R4,500',
    solves: 'Single-objective ads that capture one intent layer and miss all others',
    description:
      'Two structured campaigns are built and launched simultaneously. Campaign 01 — Direct to Conversion (WhatsApp Conversations objective): high-intent prospects sent directly to WhatsApp with a frictionless keyword trigger. Campaign 02 — Lead Magnet (Leads objective): undecided buyers captured via the lead magnet form. Targeting is generated using the AA Targeting Prompt — specific radius, refined interest stack, age range, and exclusion list built for the buyer profile.',
    tools: ['Meta Ads Manager', 'Conversations Objective', 'Leads Objective', 'AA Targeting System'],
    items: [
      'Campaign 01 created — WhatsApp Conversations objective',
      'Campaign 01 targeting configured (radius, interests, age, exclusion list)',
      'WhatsApp keyword trigger set up and tested end-to-end',
      'Campaign 02 created — Leads objective (lead magnet)',
      'Campaign 02 targeting configured using AA Targeting Prompt output',
      'Both campaigns reviewed against ICP before launch',
      'Client approval obtained — both campaigns approved for go-live',
    ],
  },
  {
    id: 6,
    phase: 1,
    title: 'WhatsApp Conversion Flow Setup',
    value: 'R1,500',
    solves: 'Inbound messages that die unanswered and never become bookings',
    description:
      "This is where money is made — not in the ads. Before the first campaign goes live, the WhatsApp conversion flow is set up and tested: auto-first response, qualification sequence (job type, urgency, location), and a structured close toward a price discussion or booking slot. Rules are non-negotiable: no paragraphs, no delays over five minutes, every message moves toward a booking.",
    tools: ['WhatsApp Business', 'DM Script Framework', 'Qualifier Sequence'],
    items: [
      'WhatsApp Business account verified and configured',
      'Auto-first response message written and active',
      'Qualification sequence scripted (job type, urgency, location)',
      'Structured close toward price discussion or booking written',
      '5-minute response rule briefed to client',
      'Full flow tested end-to-end before Day 1',
      'DM script framework delivered to client',
    ],
  },
  // ── PHASE 2: SPRINT DELIVERY ───────────────────────────────────────────────
  {
    id: 7,
    phase: 2,
    title: 'Daily Performance Tracking — Every Metric, Every Day',
    value: 'R3,000',
    solves: "Running campaigns blind with no signal on what's working and what's wasting budget",
    description:
      'Every day of the Sprint — no exceptions — six metrics are tracked: daily spend, CPM, CTR, cost per message, cost per lead, DMs started, and leads generated. Days 1–3 are a stabilisation phase: ads exit learning, flows are checked for breakages, and no premature changes are made. This is not passive monitoring — it is active surveillance from Day 1.',
    tools: ['Meta Ads Manager', 'Daily Tracking Log', 'AA Dashboard'],
    items: [
      'Daily tracking log active from Day 1',
      'Six core metrics tracked: spend, CPM, CTR, cost per message, cost per lead, DMs/leads',
      'Days 1–3 stabilisation protocol documented and followed',
      'Flow breakage check completed within the first 72 hours',
      'No premature changes made before stabilisation phase ends',
      'Day 14 tracking complete — full 14-day dataset recorded',
    ],
  },
  {
    id: 8,
    phase: 2,
    title: 'Kill/Scale Optimisation Cycles',
    value: 'R2,000',
    solves: 'Budget bleeding into dead creatives and missed scaling opportunities on winners',
    description:
      'Two structured optimisation cycles run during the Sprint. First Optimisation (Days 4–7): kill rules enforced — CPL over R120 killed, no messages after R300 spend killed, CTR under 1% replaced. Scale rules executed — cost per message under R40 means budget increase. Acceleration Phase (Days 8–14): winning creatives doubled down, underperformers cut aggressively, 1–2 new creatives introduced if the data warrants it.',
    tools: ['Kill Rules Protocol', 'Scale Rules Protocol', 'Creative Rotation'],
    items: [
      'First Optimisation review completed (Days 4–7)',
      'Kill rule applied: CPL >R120 creatives paused',
      'Kill rule applied: no messages after R300 spend paused',
      'Kill rule applied: CTR <1% creatives replaced',
      'Scale rule applied: cost per message <R40 → budget increased',
      'Acceleration Phase executed (Days 8–14)',
      '1–2 new creatives introduced in Acceleration Phase where data warrants',
    ],
  },
  {
    id: 9,
    phase: 2,
    title: 'Day 7 Mid-Sprint Demand Signal Report',
    value: 'R750',
    solves: 'Running blind for 14 days with no interim read on where the market is going',
    description:
      'At Day 7, a structured mid-sprint check-in is delivered directly to the client via WhatsApp: total spend to date, DMs started, leads generated, and an honest early signal read — "Early signs are strong / mixed / weak." This tells you whether the second half of the Sprint should accelerate or pivot, and how the WhatsApp conversion flow is performing.',
    tools: ['WhatsApp Report', 'Mid-Sprint Brief', 'Demand Signal Read'],
    items: [
      'Day 7 performance data compiled (spend, DMs, leads)',
      'Demand signal read determined (strong / mixed / weak)',
      'WhatsApp conversion flow performance assessed',
      'Response sequence breakdown identified and flagged if present',
      'Day 7 report delivered to client via WhatsApp',
      'Client response and sentiment recorded',
    ],
  },
  {
    id: 10,
    phase: 2,
    title: 'End-of-Sprint Results + Demand Proof Document',
    value: 'R2,000',
    solves: 'Walking away from 14 days of data with nothing documented and no strategic direction',
    description:
      'At Day 13, a complete results document is prepared: total spend, total inbound (DMs + leads combined), cost per result, booking rate, and early revenue if cash has been collected. This document answers one question with evidence: does real, measurable online demand exist for this service in this area? If yes, the document frames the next step — the Proof Brand install — and the R2,500 deposit transfers as credit.',
    tools: ['Results Report', 'Demand Proof Document', 'Proof Brand Brief'],
    items: [
      'Day 13 full dataset compiled — all daily logs reviewed',
      'Total spend, total inbound (DMs + leads), and cost per result calculated',
      'Booking rate and early revenue documented',
      'Demand proof determination made (demand confirmed / inconclusive / negative)',
      'Demand Proof Document completed and filed',
      'Next step framed and presented to client',
      'R2,500 deposit credit noted if proceeding to Proof Brand',
    ],
  },
]

// ─── Bonus Definitions ─────────────────────────────────────────────────────────

const SPRINT_BONUSES: BonusDef[] = [
  {
    id: 'bonus-1',
    stepId: 11,
    title: 'Full Deposit Credited to Proof Brand',
    value: 'R2,500',
    description:
      "When the Sprint proves demand — and the client decides to install the full engine — the R2,500 deposit transfers in full against the Proof Brand setup fee. The deposit is not a sunk expense. It is a stake in what comes next.",
    items: [
      'Sprint demand proof confirmed',
      'Client decision to proceed to Proof Brand documented',
      'R2,500 deposit credit applied to Proof Brand setup fee',
      'Credit transfer confirmed to client in writing',
    ],
  },
  {
    id: 'bonus-2',
    stepId: 12,
    title: 'Market Exclusivity Lock — Area Locked',
    value: 'Priceless',
    description:
      "Attract Acquisition operates a strict one-client-per-area-per-service model. From the moment the SPOA is signed, no competing business in the client's niche within their geography will be taken on. The window to lock closes the moment someone else in the same suburb signs first.",
    items: [
      'SPOA signed — exclusivity lock active from sign date',
      'Client niche and geography recorded in exclusivity register',
      'Competing businesses in area confirmed as unavailable',
      'Client notified of exclusivity lock status',
    ],
  },
  {
    id: 'bonus-3',
    stepId: 13,
    title: 'Strategic Plan of Action (SPOA) Document',
    value: 'R1,500',
    description:
      'Before the Sprint launches, a fully structured SPOA is produced: current market context, competitor landscape, identified pipeline gaps, strategic objectives, and projected impact ranges based on average job value and local demand data. The client owns this document regardless of what they decide after the Sprint.',
    items: [
      'Market context researched and documented',
      'Competitor landscape mapped for client area',
      'Pipeline gaps identified and noted',
      'Strategic objectives defined',
      'Projected impact ranges calculated (based on AJV and local demand data)',
      'SPOA document completed and delivered to client',
    ],
  },
  {
    id: 'bonus-4',
    stepId: 14,
    title: 'WhatsApp DM Qualifier Script — Your Sector',
    value: 'R1,000',
    description:
      'A tested, sector-specific DM qualifier script is built and handed to the client before Day 1. Every inbound message gets handled through a proven framework: auto-first response, qualification questions, urgency and location capture, and a structured move toward a booking or price discussion.',
    items: [
      'Sector-specific qualifier script written',
      'Auto-first response message scripted',
      'Qualification questions written (urgency, location, service type)',
      'Move-toward-booking framework embedded in script',
      'Script rules embedded (no long paragraphs, no delays, always advance)',
      'Script handed to client before Day 1',
    ],
  },
]

// ─── Component ─────────────────────────────────────────────────────────────────

export default function ProofSprint() {
  const { role, user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [clients, setClients] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<any | null>(null)
  const [deliverables, setDeliverables] = useState<any[]>([])
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([1]))
  const [loading, setLoading] = useState(true)
  const [fetchingSteps, setFetchingSteps] = useState(false)

  useEffect(() => { loadClients() }, [role, user])

  async function loadClients() {
    let q = supabase.from('clients').select('*').eq('tier', TIER_NAME)
    if (role === 'delivery' && user?.id) {
      q = q.eq('account_manager', user.id)
    }
    const { data } = await q
    setClients(data || [])
    setLoading(false)
  }

  async function selectClient(client: any) {
    setSelectedClient(client)
    setFetchingSteps(true)
    setExpandedSteps(new Set([1]))

    let { data } = await (supabase.from('client_deliverables' as any))
      .select('*')
      .eq('client_id', client.id)
      .order('position', { ascending: true })

    const hasNewFormat = data && data.some((d: any) => d.position >= 1000)

    if (!hasNewFormat) {
      const rows: any[] = []

      for (const step of SPRINT_STEPS) {
        step.items.forEach((item, idx) => {
          rows.push({ client_id: client.id, title: item, position: step.id * 1000 + idx, is_completed: false, notes: '' })
        })
        rows.push({ client_id: client.id, title: '__notes__', position: step.id * 1000 + 999, is_completed: false, notes: '' })
      }

      for (const bonus of SPRINT_BONUSES) {
        bonus.items.forEach((item, idx) => {
          rows.push({ client_id: client.id, title: item, position: bonus.stepId * 1000 + idx, is_completed: false, notes: '' })
        })
        rows.push({ client_id: client.id, title: '__notes__', position: bonus.stepId * 1000 + 999, is_completed: false, notes: '' })
      }

      const { data: created } = await (supabase.from('client_deliverables' as any)).insert(rows).select()
      data = created
    }

    setDeliverables((data || []).filter((d: any) => d.position >= 1000))
    setFetchingSteps(false)
  }

  async function toggleItem(itemId: string, currentStatus: boolean) {
    const { error } = await (supabase.from('client_deliverables' as any))
      .update({ is_completed: !currentStatus, updated_at: new Date().toISOString() })
      .eq('id', itemId)
    if (!error) {
      setDeliverables(prev => prev.map(d => d.id === itemId ? { ...d, is_completed: !currentStatus } : d))
    }
  }

  async function saveNotes(stepId: number, notes: string) {
    const notesRow = deliverables.find(d => d.position === stepId * 1000 + 999)
    if (!notesRow) return
    await (supabase.from('client_deliverables' as any))
      .update({ notes, updated_at: new Date().toISOString() })
      .eq('id', notesRow.id)
    setDeliverables(prev => prev.map(d => d.id === notesRow.id ? { ...d, notes } : d))
    toast('Notes saved')
  }

  function getStepData(stepId: number) {
    const items = deliverables.filter(d => d.position >= stepId * 1000 && d.position < stepId * 1000 + 999)
    const notesRow = deliverables.find(d => d.position === stepId * 1000 + 999)
    const completed = items.filter(i => i.is_completed).length
    return { items, notesRow, completed, total: items.length }
  }

  function toggleExpand(stepId: number) {
    setExpandedSteps(prev => {
      const next = new Set(prev)
      next.has(stepId) ? next.delete(stepId) : next.add(stepId)
      return next
    })
  }

  async function openSprintData() {
    if (!selectedClient) return
    const { data } = await supabase
      .from('proof_sprints')
      .select('id')
      .eq('client_name', selectedClient.business_name)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    if (data?.id) {
      navigate(`/sprints/${data.id}`)
    } else {
      toast('No active sprint found for this client — create one via Quick Add', 'error')
    }
  }

  const allItems = deliverables.filter(d => d.position % 1000 !== 999)
  const totalCompleted = allItems.filter(d => d.is_completed).length
  const totalItems = allItems.length
  const overallPct = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0

  const completedSteps = SPRINT_STEPS.filter(s => {
    const { completed, total } = getStepData(s.id)
    return total > 0 && completed === total
  }).length

  const phase1Steps = SPRINT_STEPS.filter(s => s.phase === 1)
  const phase2Steps = SPRINT_STEPS.filter(s => s.phase === 2)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--grey)' }}>
      <Loader2 className="spin" size={24} />
      <span style={{ marginLeft: 12, fontFamily: 'DM Mono', fontSize: 12 }}>Loading {TIER_NAME} Pipeline...</span>
    </div>
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, height: 'calc(100vh - 140px)' }}>

      {/* ── Client List ── */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
        <h3 style={{ fontSize: 11, fontFamily: 'DM Mono', textTransform: 'uppercase', color: 'var(--grey)', marginBottom: 12 }}>
          {TIER_NAME} Clients
        </h3>
        {clients.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--grey2)', padding: 20, textAlign: 'center' }}>
            No clients in this tier.
          </div>
        ) : clients.map(c => (
          <div
            key={c.id}
            onClick={() => selectClient(c)}
            style={{
              padding: '14px 16px', borderRadius: 8, cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              border: `1px solid ${selectedClient?.id === c.id ? 'var(--teal)' : 'var(--border2)'}`,
              background: selectedClient?.id === c.id ? 'var(--bg3)' : 'var(--bg2)',
              transition: '0.2s',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{c.business_name}</div>
              <div style={{ fontSize: 10, color: 'var(--grey2)', marginTop: 2 }}>{c.owner_name}</div>
            </div>
            <ChevronRight size={14} color={selectedClient?.id === c.id ? 'var(--teal)' : 'var(--border2)'} />
          </div>
        ))}
      </div>

      {/* ── Delivery Workspace ── */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

        {!selectedClient ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--grey2)', gap: 12 }}>
            <div style={{ padding: 20, borderRadius: '50%', background: 'var(--bg2)' }}>
              <Zap size={32} color="var(--teal)" />
            </div>
            <p style={{ fontSize: 13 }}>Select a client to manage their {TIER_NAME} deliverables.</p>
          </div>

        ) : fetchingSteps ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--grey)' }}>
            <Loader2 className="spin" size={20} />
            <span style={{ fontFamily: 'DM Mono', fontSize: 12 }}>Loading deliverables...</span>
          </div>

        ) : (
          <>
            {/* ── Client Header ── */}
            <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border2)', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h2 style={{ fontSize: 22, fontFamily: 'Playfair Display', fontWeight: 700 }}>
                    {selectedClient.business_name}
                  </h2>
                  <p style={{ color: 'var(--teal)', fontSize: 11, fontFamily: 'DM Mono', marginTop: 4 }}>
                    DELIVERY TRACKER · {TIER_NAME.toUpperCase()}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <button
                    onClick={openSprintData}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                      background: 'none', border: '1px solid var(--border2)', borderRadius: 6,
                      cursor: 'pointer', fontFamily: 'DM Mono', fontSize: 10, color: 'var(--grey)',
                      textTransform: 'uppercase', letterSpacing: '0.06em', transition: '0.15s',
                    }}
                  >
                    <ExternalLink size={11} /> Live Sprint Data
                  </button>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--teal)', fontFamily: 'DM Mono', lineHeight: 1 }}>
                      {overallPct}%
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--grey)', fontFamily: 'DM Mono', marginTop: 4 }}>
                      {totalCompleted} / {totalItems} ITEMS
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--grey2)', fontFamily: 'DM Mono', marginTop: 2 }}>
                      {completedSteps} / {SPRINT_STEPS.length} STEPS
                    </div>
                  </div>
                </div>
              </div>
              {/* Progress Bar */}
              <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  width: `${overallPct}%`, height: '100%',
                  background: 'linear-gradient(90deg, var(--teal-dark), var(--teal))',
                  borderRadius: 99, transition: 'width 0.4s ease',
                }} />
              </div>
            </div>

            {/* ── Steps List ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

              {/* Phase 1 Divider */}
              <PhaseDivider
                phase={1}
                label="Sprint Setup"
                sublabel="Complete in ≤72 hours"
                value="R15,000"
                steps={phase1Steps}
                getStepData={getStepData}
              />

              {phase1Steps.map(step => (
                <StepCard
                  key={step.id}
                  step={step}
                  isExpanded={expandedSteps.has(step.id)}
                  onToggle={() => toggleExpand(step.id)}
                  dbData={getStepData(step.id)}
                  onToggleItem={toggleItem}
                  onSaveNotes={saveNotes}
                />
              ))}

              {/* Phase 2 Divider */}
              <PhaseDivider
                phase={2}
                label="Sprint Delivery"
                sublabel="14 days active management"
                value="R7,750"
                steps={phase2Steps}
                getStepData={getStepData}
              />

              {phase2Steps.map(step => (
                <StepCard
                  key={step.id}
                  step={step}
                  isExpanded={expandedSteps.has(step.id)}
                  onToggle={() => toggleExpand(step.id)}
                  dbData={getStepData(step.id)}
                  onToggleItem={toggleItem}
                  onSaveNotes={saveNotes}
                />
              ))}

              {/* Bonuses Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, marginBottom: 6 }}>
                <Gift size={13} color="var(--teal)" />
                <span style={{
                  fontSize: 10, fontFamily: 'DM Mono', textTransform: 'uppercase',
                  color: 'var(--grey)', letterSpacing: '0.08em', whiteSpace: 'nowrap',
                }}>
                  Included Bonuses — No Extra Charge
                </span>
                <div style={{ flex: 1, height: 1, background: 'var(--border2)' }} />
                <span style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--teal)', whiteSpace: 'nowrap' }}>
                  R5,000+ Value
                </span>
              </div>

              {/* Bonus Cards */}
              {SPRINT_BONUSES.map(bonus => {
                const { items: dbItems, notesRow, completed, total } = getStepData(bonus.stepId)
                const isExpanded = expandedSteps.has(bonus.stepId)
                const isComplete = total > 0 && completed === total

                return (
                  <div
                    key={bonus.id}
                    style={{
                      border: `1px solid ${isComplete ? 'rgba(0,229,195,0.4)' : 'rgba(255,170,0,0.2)'}`,
                      borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.2s',
                    }}
                  >
                    <button
                      onClick={() => toggleExpand(bonus.stepId)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                        padding: '13px 16px',
                        background: isComplete ? 'rgba(0,229,195,0.04)' : 'rgba(255,170,0,0.03)',
                        border: 'none', cursor: 'pointer', textAlign: 'left',
                      }}
                    >
                      <div style={{
                        minWidth: 34, height: 34, borderRadius: 7,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isComplete ? 'var(--teal)' : 'rgba(255,170,0,0.12)',
                        color: isComplete ? 'var(--bg)' : 'var(--amber)',
                        fontSize: 12, flexShrink: 0,
                      }}>
                        <Gift size={14} />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 13, fontWeight: 600,
                          color: isComplete ? 'var(--grey)' : 'var(--white)',
                          display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                          {bonus.title}
                          {isComplete && <CheckCircle2 size={13} color="var(--teal)" />}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        <span style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--amber)' }}>
                          {bonus.value}
                        </span>
                        <span style={{
                          fontSize: 10, fontFamily: 'DM Mono',
                          color: completed === total && total > 0 ? 'var(--teal)' : 'var(--grey2)',
                          background: 'var(--bg3)', padding: '3px 8px', borderRadius: 4,
                          border: '1px solid var(--border2)',
                        }}>
                          {completed}/{total}
                        </span>
                        {isExpanded
                          ? <ChevronDown size={14} color="var(--grey)" />
                          : <ChevronRight size={14} color="var(--grey)" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div style={{ padding: '16px 16px 18px', borderTop: '1px solid var(--border2)', background: 'var(--bg)' }}>
                        <p style={{ fontSize: 12, color: 'var(--grey)', lineHeight: 1.65, marginBottom: 16 }}>
                          {bonus.description}
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
                          {bonus.items.map((itemLabel, idx) => {
                            const dbItem = dbItems.find(d => d.position === bonus.stepId * 1000 + idx)
                            if (!dbItem) return null
                            return (
                              <div
                                key={idx}
                                onClick={() => toggleItem(dbItem.id, dbItem.is_completed)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 10,
                                  cursor: 'pointer', padding: '8px 10px', borderRadius: 6,
                                  background: dbItem.is_completed ? 'rgba(0,229,195,0.05)' : 'var(--bg2)',
                                  border: `1px solid ${dbItem.is_completed ? 'rgba(0,229,195,0.18)' : 'var(--border2)'}`,
                                  transition: '0.15s', userSelect: 'none',
                                }}
                              >
                                <span style={{ color: dbItem.is_completed ? 'var(--teal)' : 'var(--grey2)', flexShrink: 0 }}>
                                  {dbItem.is_completed ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                                </span>
                                <span style={{
                                  fontSize: 13,
                                  color: dbItem.is_completed ? 'var(--grey2)' : 'var(--white)',
                                  textDecoration: dbItem.is_completed ? 'line-through' : 'none',
                                }}>
                                  {itemLabel}
                                </span>
                              </div>
                            )
                          })}
                        </div>

                        <textarea
                          key={notesRow?.id}
                          placeholder="Add delivery notes, links, or internal updates..."
                          defaultValue={notesRow?.notes || ''}
                          onBlur={(e) => saveNotes(bonus.stepId, e.target.value)}
                          style={{
                            width: '100%', background: 'var(--bg2)', border: '1px solid var(--border2)',
                            borderRadius: 6, padding: 12, color: 'var(--white)',
                            fontSize: 12, fontFamily: 'Barlow', resize: 'vertical', minHeight: 60,
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Phase Divider ─────────────────────────────────────────────────────────────

function PhaseDivider({
  phase, label, sublabel, value, steps, getStepData
}: {
  phase: number
  label: string
  sublabel: string
  value: string
  steps: StepDef[]
  getStepData: (id: number) => { completed: number; total: number }
}) {
  const phaseCompleted = steps.filter(s => {
    const { completed, total } = getStepData(s.id)
    return total > 0 && completed === total
  }).length
  const isPhaseComplete = phaseCompleted === steps.length

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      marginTop: phase === 1 ? 0 : 14, marginBottom: 6,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: isPhaseComplete ? 'rgba(0,229,195,0.08)' : 'var(--bg3)',
        border: `1px solid ${isPhaseComplete ? 'rgba(0,229,195,0.3)' : 'var(--border2)'}`,
        borderRadius: 5, padding: '4px 10px', flexShrink: 0,
      }}>
        <Zap size={11} color={isPhaseComplete ? 'var(--teal)' : 'var(--grey2)'} />
        <span style={{
          fontSize: 9, fontFamily: 'DM Mono', textTransform: 'uppercase',
          color: isPhaseComplete ? 'var(--teal)' : 'var(--grey2)', letterSpacing: '0.1em',
        }}>
          Phase {phase} — {label}
        </span>
      </div>
      <span style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'var(--grey2)', whiteSpace: 'nowrap' }}>
        {sublabel}
      </span>
      <div style={{ flex: 1, height: 1, background: 'var(--border2)' }} />
      <span style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--grey)', whiteSpace: 'nowrap' }}>
        {value}
      </span>
    </div>
  )
}

// ─── Step Card ─────────────────────────────────────────────────────────────────

function StepCard({
  step, isExpanded, onToggle, dbData, onToggleItem, onSaveNotes
}: {
  step: StepDef
  isExpanded: boolean
  onToggle: () => void
  dbData: { items: any[]; notesRow: any; completed: number; total: number }
  onToggleItem: (id: string, current: boolean) => void
  onSaveNotes: (stepId: number, notes: string) => void
}) {
  const { items: dbItems, notesRow, completed, total } = dbData
  const isComplete = total > 0 && completed === total

  return (
    <div style={{
      border: `1px solid ${isComplete ? 'rgba(0,229,195,0.4)' : 'var(--border2)'}`,
      borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.2s',
    }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: '13px 16px',
          background: isComplete ? 'rgba(0,229,195,0.04)' : 'var(--bg2)',
          border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div style={{
          minWidth: 34, height: 34, borderRadius: 7,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isComplete ? 'var(--teal)' : 'var(--bg3)',
          color: isComplete ? 'var(--bg)' : 'var(--grey)',
          fontSize: 11, fontFamily: 'DM Mono', fontWeight: 600, flexShrink: 0,
        }}>
          {String(step.id).padStart(2, '0')}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 600,
            color: isComplete ? 'var(--grey)' : 'var(--white)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            {step.title}
            {isComplete && <CheckCircle2 size={13} color="var(--teal)" />}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--grey2)' }}>
            {step.value}
          </span>
          <span style={{
            fontSize: 10, fontFamily: 'DM Mono',
            color: completed === total && total > 0 ? 'var(--teal)' : 'var(--grey2)',
            background: 'var(--bg3)', padding: '3px 8px', borderRadius: 4,
            border: '1px solid var(--border2)',
          }}>
            {completed}/{total}
          </span>
          {isExpanded
            ? <ChevronDown size={14} color="var(--grey)" />
            : <ChevronRight size={14} color="var(--grey)" />}
        </div>
      </button>

      {isExpanded && (
        <div style={{ padding: '16px 16px 18px', borderTop: '1px solid var(--border2)', background: 'var(--bg)' }}>

          {/* Solves Banner */}
          <div style={{
            marginBottom: 12, fontSize: 11, lineHeight: 1.5,
            color: 'var(--grey)', fontFamily: 'DM Mono',
            padding: '8px 12px', background: 'var(--bg2)', borderRadius: 6,
            borderLeft: '2px solid var(--teal-dark)',
          }}>
            <span style={{ color: 'var(--grey2)', marginRight: 6 }}>SOLVES:</span>
            {step.solves}
          </div>

          {/* Description */}
          <p style={{ fontSize: 12, color: 'var(--grey)', lineHeight: 1.65, marginBottom: 16 }}>
            {step.description}
          </p>

          {/* Checklist Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
            {step.items.map((itemLabel, idx) => {
              const dbItem = dbItems.find(d => d.position === step.id * 1000 + idx)
              if (!dbItem) return null
              return (
                <div
                  key={idx}
                  onClick={() => onToggleItem(dbItem.id, dbItem.is_completed)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    cursor: 'pointer', padding: '8px 10px', borderRadius: 6,
                    background: dbItem.is_completed ? 'rgba(0,229,195,0.05)' : 'var(--bg2)',
                    border: `1px solid ${dbItem.is_completed ? 'rgba(0,229,195,0.18)' : 'var(--border2)'}`,
                    transition: '0.15s', userSelect: 'none',
                  }}
                >
                  <span style={{ color: dbItem.is_completed ? 'var(--teal)' : 'var(--grey2)', flexShrink: 0 }}>
                    {dbItem.is_completed ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                  </span>
                  <span style={{
                    fontSize: 13,
                    color: dbItem.is_completed ? 'var(--grey2)' : 'var(--white)',
                    textDecoration: dbItem.is_completed ? 'line-through' : 'none',
                  }}>
                    {itemLabel}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Tool Badges */}
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
            {step.tools.map(tool => (
              <span key={tool} style={{
                fontSize: 10, fontFamily: 'DM Mono', padding: '3px 8px',
                borderRadius: 4, background: 'var(--bg3)', color: 'var(--grey)',
                border: '1px solid var(--border2)',
              }}>
                {tool}
              </span>
            ))}
          </div>

          {/* Step Notes */}
          <textarea
            key={notesRow?.id}
            placeholder="Add delivery notes, links, or internal updates..."
            defaultValue={notesRow?.notes || ''}
            onBlur={(e) => onSaveNotes(step.id, e.target.value)}
            style={{
              width: '100%', background: 'var(--bg2)', border: '1px solid var(--border2)',
              borderRadius: 6, padding: 12, color: 'var(--white)',
              fontSize: 12, fontFamily: 'Barlow', resize: 'vertical', minHeight: 60,
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}
    </div>
  )
}
