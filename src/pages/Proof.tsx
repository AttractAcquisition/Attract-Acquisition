import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { CheckCircle2, Circle, ChevronRight, ChevronDown, Loader2, Gift } from 'lucide-react'
import { useToast } from '../lib/toast'

const TIER_NAME = 'Proof Brand'

// ─── Step & Bonus Type Definitions ────────────────────────────────────────────

interface StepDef {
  id: number
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

// ─── Proof Brand Step Definitions ─────────────────────────────────────────────

const PROOF_BRAND_STEPS: StepDef[] = [
  {
    id: 1,
    title: 'Client Onboarding & Infrastructure Audit',
    value: 'R4,500',
    solves: 'Starting without clarity → wasted build time and misdirected spend',
    description:
      'A dedicated onboarding call collects every asset, access credential, and strategic input needed before a single piece of infrastructure is built. Sector, target client profile, average job value, conversion objective, and brand voice are locked in. Nothing is built on assumptions — everything built after this point is specific to the business, the city, and the market.',
    tools: ['AA Client Portal', 'Onboarding Brief'],
    items: [
      'Onboarding call completed',
      'AA Client Portal account created and client invited',
      'Onboarding Brief completed in full',
      'Sector and target client profile documented',
      'Average job value and conversion objective confirmed',
      'Brand voice and tone documented',
      'All access credentials collected (Meta, Instagram, WhatsApp)',
    ],
  },
  {
    id: 2,
    title: 'Conversion Infrastructure Build',
    value: 'R6,000',
    solves: 'Traffic arriving with nowhere to go and no reason to act',
    description:
      'Conversion infrastructure is optimised end-to-end for the specific conversion objective — WhatsApp enquiries, website form submissions, or direct DM bookings. A conversion landing page is built using the brand, proof, and psychology-driven copy that speaks directly to the specific fears and desires of the local target client. Every element is A/B tested from Week 1.',
    tools: ['AA Client Portal', 'Lovable Landing Page', 'WhatsApp Business'],
    items: [
      'Conversion objective confirmed (WhatsApp / Form / DM)',
      'Landing page copy written and approved by client',
      'Landing page built on Lovable and live',
      'WhatsApp Business profile configured',
      'Conversion tracking pixels installed and verified',
      'A/B test variant 1 created',
      'A/B test variant 2 created',
    ],
  },
  {
    id: 3,
    title: 'Attraction Positioning Document + Campaign',
    value: 'R5,500',
    solves: "Cold audiences who don't know you exist and don't trust you yet",
    description:
      "A master Attraction document is built that defines the top-of-funnel content strategy — credibility-driven proof content that builds awareness and trust with cold local audiences. Every attraction post and ad is designed to answer one question in a cold prospect's mind: \"Does this business do great work?\" Job documentation, process footage, results, and proof of quality — systematised and distributed at volume.",
    tools: ['AA Studio', 'Meta Ads Manager', 'AA Client Portal'],
    items: [
      'Attraction Positioning Document created and filed',
      'Top-of-funnel content strategy defined',
      'First batch of attraction content produced in AA Studio',
      'Attraction campaign created in Meta Ads Manager',
      'Local radius and audience targeting configured',
      'Creative variant 1 built and uploaded',
      'Creative variant 2 built and uploaded',
      'Campaign approved by client and set live',
    ],
  },
  {
    id: 4,
    title: 'Nurture Positioning Document + Campaign',
    value: 'R5,500',
    solves: "Warm audiences who've seen you but haven't committed",
    description:
      "A master Nurture document structures the middle-of-funnel content — credibility-driven posts and ads that retarget warm audiences who've already engaged with the profile or ads. People who see the work once and leave are expensive to re-acquire cold. The nurture campaign keeps the brand visible and trust compounding with people who are already interested — so when they're ready to book, this is the only name they think of.",
    tools: ['AA Studio', 'Meta Retargeting', 'AA Client Portal'],
    items: [
      'Nurture Positioning Document created and filed',
      'Middle-of-funnel content strategy defined',
      'Warm audience retargeting pools built in Meta',
      'Nurture retargeting campaign created in Meta Ads Manager',
      'Retargeting pixels confirmed firing correctly',
      'Creative variant 1 built and uploaded',
      'Creative variant 2 built and uploaded',
      'Campaign approved by client and set live',
    ],
  },
  {
    id: 5,
    title: 'Conversion Positioning Document + Campaign',
    value: 'R5,500',
    solves: "Warm audiences who want to book but haven't been asked in the right way",
    description:
      "A master Conversion document drives the bottom-of-funnel — psychologically sequenced content and ads built to move a warm prospect from consideration to commitment. Every conversion campaign is structured around the specific decision-making psychology of the target client — their primary objection, their deepest hesitation, and the exact proof point that converts them. This is where revenue is made.",
    tools: ['AA Studio', 'Meta Conversion Ads', 'AA Client Portal'],
    items: [
      'Conversion Positioning Document created and filed',
      'Primary client objection and hesitation documented',
      'Key proof point that converts identified and written',
      'Conversion ad copy written and approved',
      'Conversion campaign created in Meta Ads Manager',
      'Creative variant 1 built and uploaded',
      'Creative variant 2 built and uploaded',
      'Campaign approved by client and set live',
    ],
  },
  {
    id: 6,
    title: 'DM → Booking → Cash Conversion Flow',
    value: 'R4,000',
    solves: 'Enquiries that die in the DMs and never become booked appointments',
    description:
      'A fully documented DM qualifier and booking sequence is installed and coached from Week 1. Every inbound message is handled through a proven framework: qualifier questions that filter serious leads from window-shoppers → appointment booking → confirmation message → show-up follow-up the day before. The account manager manages DMs alongside the client for the first 48 hours of each new campaign cycle — coaching in real time until the flow is second nature.',
    tools: ['WhatsApp Business', 'DM Script Framework', 'AA Client Portal'],
    items: [
      'DM qualifier sequence documented and shared with client',
      'Appointment booking message scripted',
      'Booking confirmation message written',
      'Day-before show-up follow-up written',
      'Client briefed on full DM flow before launch',
      '48-hour AM DM co-management session completed',
      'Client confirmed self-sufficient on DM flow',
    ],
  },
  {
    id: 7,
    title: 'Full Meta Ad Campaign Structure — 3 Objectives',
    value: 'R8,000',
    solves: 'One-dimensional ad spending with no sequenced funnel logic',
    description:
      'Three coordinated campaign objectives run simultaneously: Attraction (awareness + reach), Nurture (engagement + retargeting), and Conversion (lead gen + direct response). Each campaign is hyper-targeted to the local radius with audiences built from the specific client profile. Minimum two creative variants per campaign. CPL monitored weekly. Underperformers killed at 7 days. New variants tested in every bi-weekly cycle.',
    tools: ['Meta Ads Manager', 'AA Studio Creatives', 'Master Ad Script Pack'],
    items: [
      'Attraction campaign live (awareness + reach objective)',
      'Nurture / retargeting campaign live (engagement objective)',
      'Conversion campaign live (lead gen + direct response objective)',
      'All three campaigns targeting correct local radius',
      'Audience profiles built from client ICP document',
      'Minimum 2 creative variants live per campaign (6 total)',
      'CPL monitoring dashboard set up',
      '7-day underperformer kill rule documented and confirmed with client',
    ],
  },
  {
    id: 8,
    title: 'AA Client Portal — Live Pipeline Dashboard',
    value: 'R3,500',
    solves: 'Having no visibility into what the marketing is actually producing',
    description:
      'The live pipeline is set up, populated, and updated by the account manager every 24 hours. From the moment the engine is live: Profile Visits → DMs Started → Qualified Leads → Appointments Booked → Cash Collected. The client will know, in real time, exactly which campaign is producing revenue. No guessing. No waiting for a monthly report. The data is live. The answer is always available.',
    tools: ['AA Portal', 'Daily AM Updates', 'Meta Ads Integration'],
    items: [
      'AA Client Portal pipeline configured for client',
      'All 5 pipeline stages set up (Visits → DMs → Leads → Booked → Cash)',
      'Meta Ads data integration connected and verified',
      'Daily AM update schedule confirmed',
      'Client portal access granted and login confirmed',
      'First pipeline data entry logged by AM',
    ],
  },
  {
    id: 9,
    title: 'Bi-Weekly Optimisation Cycle — Every Month',
    value: 'R6,000 / month',
    solves: 'Campaigns that run flat with no improvement and no accountability',
    description:
      'Every two weeks: all campaign performance reviewed, underperforming creative killed, the next 14-day campaign cycle built and approved via the AA Portal, and inbound DMs and engagement managed throughout the test period. The system never stagnates — it optimises on every cycle. Content is produced, approved via the AA Portal, and live before the next cycle begins. Week 1: Optimise, Build & Approve. Week 2: Test and convert.',
    tools: ['AA Studio', 'AA Portal Approval Flow', 'AA CRM'],
    items: [
      'Week 1: All campaign performance reviewed and documented',
      'Week 1: Underperforming creatives identified and killed',
      'Week 1: Next 14-day cycle content built in AA Studio',
      'Week 1: New content sent for client approval via portal',
      'Week 1: Approved content scheduled and ready',
      'Week 2: New creative variants live and in test',
      'Week 2: DM engagement managed and reported in portal',
    ],
  },
  {
    id: 10,
    title: 'Client Orientation Call + Engine Go-Live',
    value: 'R2,500',
    solves: 'Launching before the client understands the system and can maximise it',
    description:
      "Before a single campaign goes live, a dedicated orientation call confirms everything is in place: positioning documents approved, conversion infrastructure live, ad creatives reviewed, and DM flow understood. The client gives explicit permission to launch — and the engine goes live only when they're fully confident in the system. No surprises. No confusion. A clear launch moment with full visibility from Day 1.",
    tools: ['AA Client Portal', 'Launch Checklist'],
    items: [
      'All 3 positioning documents (Attract / Nurture / Convert) approved by client',
      'Conversion landing page confirmed live',
      'WhatsApp Business and DM flow confirmed operational',
      'All ad creatives reviewed and signed off by client',
      'DM → Booking flow walkthrough completed with client',
      'AA Portal orientation completed — client knows how to read dashboard',
      'Client gives explicit go-live permission',
      'Engine launched — Day 1 start date confirmed',
    ],
  },
]

// ─── Bonus Definitions ─────────────────────────────────────────────────────────

const PROOF_BRAND_BONUSES: BonusDef[] = [
  {
    id: 'bonus-1',
    stepId: 11,
    title: 'Master Ad Script Pack — Your Sector',
    value: 'R3,500',
    description:
      "A full library of proven ad scripts, hooks, and CTA frameworks written specifically for the client's sector. Not generic ad templates — sector-specific psychological triggers calibrated to the exact fears, desires, and decision-making patterns of the local target client. Updated every cycle based on what's converting.",
    items: [
      'Sector-specific ad scripts written (minimum 5)',
      'Hook library created (minimum 10 hooks)',
      'CTA frameworks documented',
      'Script pack delivered to client via AA Portal',
    ],
  },
  {
    id: 'bonus-2',
    stepId: 12,
    title: 'Instagram Profile Full Rebuild',
    value: 'R2,500',
    description:
      'Bio rewrite, highlights structure, pinned post strategy, and link-in-bio page — all built to convert profile visitors into DM enquiries before a single ad fires. The profile is rebuilt to function as a conversion asset, not just an aesthetic one.',
    items: [
      'Bio rewritten with conversion intent',
      'Highlights structure created and populated',
      'Pinned post strategy set',
      'Link-in-bio page built and live',
      'Profile rebuild approved by client',
    ],
  },
  {
    id: 'bonus-3',
    stepId: 13,
    title: 'Proof Content Foundation — First 6 Posts',
    value: 'R3,000',
    description:
      "The first six proof posts for the profile are built, captioned, and approved before the engine goes live. No ads run to an empty or inconsistent profile. The brand is ready to receive traffic from Day 1. These posts form the credibility foundation that all subsequent content builds on.",
    items: [
      'Post 1 — Job documentation / result: created and captioned',
      'Post 2 — Job documentation / result: created and captioned',
      'Post 3 — Process / behind-the-scenes: created and captioned',
      'Post 4 — Proof / testimonial: created and captioned',
      'Post 5 — Authority / expertise: created and captioned',
      'Post 6 — Brand intro / credibility: created and captioned',
      'All 6 posts approved by client',
      'All 6 posts published to profile',
    ],
  },
  {
    id: 'bonus-4',
    stepId: 14,
    title: '48-Hour AM DM Co-Management',
    value: 'R2,000',
    description:
      'At every new campaign launch, the account manager manages the DM inbox alongside the client for the first 48 hours — coaching in real time on how to handle each enquiry, apply the qualifier sequence, and book the appointment. This is the fastest way to make the DM flow second nature. Most clients are self-sufficient within the first cycle.',
    items: [
      'Launch day DM co-management session completed',
      'Real-time coaching on qualifier sequence delivered',
      'Appointment booking flow demonstrated and coached',
      'Client confirmed self-sufficient on DM handling',
    ],
  },
]

// ─── Component ─────────────────────────────────────────────────────────────────

export default function ProofBrand() {
  const { role, user } = useAuth()
  const { toast } = useToast()
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

    // Detect if new-format rows exist (position >= 1000)
    const hasNewFormat = data && data.some((d: any) => d.position >= 1000)

    if (!hasNewFormat) {
      const rows: any[] = []

      for (const step of PROOF_BRAND_STEPS) {
        step.items.forEach((item, idx) => {
          rows.push({ client_id: client.id, title: item, position: step.id * 1000 + idx, is_completed: false, notes: '' })
        })
        rows.push({ client_id: client.id, title: '__notes__', position: step.id * 1000 + 999, is_completed: false, notes: '' })
      }

      for (const bonus of PROOF_BRAND_BONUSES) {
        bonus.items.forEach((item, idx) => {
          rows.push({ client_id: client.id, title: item, position: bonus.stepId * 1000 + idx, is_completed: false, notes: '' })
        })
        rows.push({ client_id: client.id, title: '__notes__', position: bonus.stepId * 1000 + 999, is_completed: false, notes: '' })
      }

      const { data: created } = await (supabase.from('client_deliverables' as any)).insert(rows).select()
      data = created
    }

    // Only keep new-format rows in state
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

  // Overall progress across all checklist items
  const allItems = deliverables.filter(d => d.position % 1000 !== 999)
  const totalCompleted = allItems.filter(d => d.is_completed).length
  const totalItems = allItems.length
  const overallPct = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0

  // Count completed steps (all items done)
  const completedSteps = PROOF_BRAND_STEPS.filter(s => {
    const { completed, total } = getStepData(s.id)
    return total > 0 && completed === total
  }).length

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
              <CheckCircle2 size={32} />
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
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--teal)', fontFamily: 'DM Mono', lineHeight: 1 }}>
                    {overallPct}%
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--grey)', fontFamily: 'DM Mono', marginTop: 4 }}>
                    {totalCompleted} / {totalItems} ITEMS
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--grey2)', fontFamily: 'DM Mono', marginTop: 2 }}>
                    {completedSteps} / {PROOF_BRAND_STEPS.length} STEPS
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

              {PROOF_BRAND_STEPS.map(step => {
                const { items: dbItems, notesRow, completed, total } = getStepData(step.id)
                const isExpanded = expandedSteps.has(step.id)
                const isComplete = total > 0 && completed === total

                return (
                  <div
                    key={step.id}
                    style={{
                      border: `1px solid ${isComplete ? 'rgba(0,229,195,0.4)' : 'var(--border2)'}`,
                      borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.2s',
                    }}
                  >
                    {/* Step Header Button */}
                    <button
                      onClick={() => toggleExpand(step.id)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                        padding: '13px 16px',
                        background: isComplete ? 'rgba(0,229,195,0.04)' : 'var(--bg2)',
                        border: 'none', cursor: 'pointer', textAlign: 'left',
                      }}
                    >
                      {/* Step Number Pill */}
                      <div style={{
                        minWidth: 34, height: 34, borderRadius: 7,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isComplete ? 'var(--teal)' : 'var(--bg3)',
                        color: isComplete ? 'var(--bg)' : 'var(--grey)',
                        fontSize: 11, fontFamily: 'DM Mono', fontWeight: 600, flexShrink: 0,
                      }}>
                        {String(step.id).padStart(2, '0')}
                      </div>

                      {/* Title */}
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

                      {/* Value + Progress + Chevron */}
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

                    {/* Step Body */}
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
                                onClick={() => toggleItem(dbItem.id, dbItem.is_completed)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 10,
                                  cursor: 'pointer', padding: '8px 10px', borderRadius: 6,
                                  background: dbItem.is_completed ? 'rgba(0,229,195,0.05)' : 'var(--bg2)',
                                  border: `1px solid ${dbItem.is_completed ? 'rgba(0,229,195,0.18)' : 'var(--border2)'}`,
                                  transition: '0.15s',
                                  userSelect: 'none',
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
                          onBlur={(e) => saveNotes(step.id, e.target.value)}
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

              {/* ── Bonuses Divider ── */}
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
                  R11,000 Value
                </span>
              </div>

              {/* ── Bonus Cards ── */}
              {PROOF_BRAND_BONUSES.map(bonus => {
                const { items: dbItems, notesRow, completed, total } = getStepData(bonus.stepId)
                const isExpanded = expandedSteps.has(bonus.stepId)
                const isComplete = total > 0 && completed === total

                return (
                  <div
                    key={bonus.id}
                    style={{
                      border: `1px solid ${isComplete ? 'rgba(0,229,195,0.4)' : 'var(--border2)'}`,
                      borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.2s',
                    }}
                  >
                    <button
                      onClick={() => toggleExpand(bonus.stepId)}
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
                        flexShrink: 0,
                      }}>
                        <Gift size={14} color={isComplete ? 'var(--bg)' : 'var(--teal)'} />
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
                        <span style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--grey2)' }}>
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
                                  transition: '0.15s',
                                  userSelect: 'none',
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
                          placeholder="Add delivery notes..."
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

              {/* Bottom padding */}
              <div style={{ height: 24 }} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
