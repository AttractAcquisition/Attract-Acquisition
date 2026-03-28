import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { CheckCircle2, Circle, ChevronRight, ChevronDown, Loader2, Gift } from 'lucide-react'
import { useToast } from '../lib/toast'

const TIER_NAME = 'Authority Brand'

// ─── Type Definitions ──────────────────────────────────────────────────────────

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

// ─── Authority Brand Step Definitions ─────────────────────────────────────────

const AUTHORITY_BRAND_STEPS: StepDef[] = [
  {
    id: 1,
    title: 'Authority Onboarding Call + Brand Direction Brief',
    value: 'R5,500',
    solves: 'Installing a human element without a clear voice, character, or positioning direction',
    description:
      'Before a Brand Avatar is sourced or a UGC creator is briefed, a dedicated Authority Onboarding session maps the brand\'s on-camera direction. What voice does the brand need? What sector knowledge should be communicated? What personality should the audience associate with this business? The answers define the brief that makes every piece of human-led content coherent — not just a collection of videos with a face in them. This session produces the Brand Direction Document that governs all authority content going forward.',
    tools: ['Brand Direction Brief', 'AA Client Portal', 'AA Studio'],
    items: [
      'Authority onboarding call completed',
      'Brand voice and on-camera direction defined',
      'Sector knowledge areas identified and documented',
      'Personality and character brief written',
      'Brand Direction Document produced and filed',
      'Proof Brand performance baseline documented (guarantee measurement reference)',
    ],
  },
  {
    id: 2,
    title: 'Brand Avatar or UGC Creator — Sourcing, Onboarding & Direction',
    value: 'R12,000',
    solves: 'Needing a human presence without the owner appearing on camera',
    description:
      'The core mechanism of the Authority Brand. Two implementation paths — both deliver the human element required for authority content production. Brand Avatar: a professional on-camera representative sourced through AA\'s talent partner network — briefed, directed, trained, and filmed to represent the brand with conviction. Directed by AA Studio, scripted by AA Studio, produced to broadcast standard. UGC Creator Framework: creators are sourced, briefed with an AA-produced creator brief, and integrated into the existing content system. Multiple creators can be used simultaneously to test different angles and audience resonances.',
    tools: ['AA Talent Partner Network', 'AA Studio Direction', 'AA CRM'],
    items: [
      'Implementation path confirmed (Brand Avatar or UGC Creator)',
      'Creator brief produced from Brand Direction Document',
      'Brand Avatar sourced through talent partner network (if Avatar path)',
      'Avatar onboarded and briefed with full brand direction (if Avatar path)',
      'UGC creators sourced and contracted (if UGC path)',
      'UGC creator brief produced and delivered (if UGC path)',
      'Initial content filmed and reviewed with client',
      'Creator / Avatar direction approved by client',
      'Production schedule integrated into bi-weekly delivery cycle',
    ],
  },
  {
    id: 3,
    title: 'Authority Nurture Positioning — Upgraded',
    value: 'R6,500',
    solves: 'Nurture content that builds credibility but not trust, familiarity, or relationship',
    description:
      'The Proof Brand\'s nurture positioning document is upgraded with authority-level content architecture. The existing credibility framework is expanded with educational reels, opinion content, sector insight posts, and process explainers — all delivered through the Brand Avatar or UGC system. The nurture layer now moves a warm prospect from "they do good work" to "I feel like I know this business and trust their expertise." This is the shift from credibility to authority.',
    tools: ['Updated Nurture Positioning Doc', 'AA Studio', 'Meta Nurture Campaigns'],
    items: [
      'Proof Brand nurture document reviewed and audited',
      'Educational reels strategy defined and added to nurture doc',
      'Opinion content framework documented',
      'Sector insight post strategy defined',
      'Process explainer content plan created',
      'Updated Nurture Positioning Document produced and filed',
      'Upgraded nurture campaigns rebuilt in Meta Ads Manager',
      'Human-led content integrated into nurture rotation',
      'Campaigns approved by client and live',
    ],
  },
  {
    id: 4,
    title: 'Authority Attraction Positioning — Upgraded',
    value: 'R6,500',
    solves: 'TOF content that earns views but not followers, saves, or algorithmic distribution',
    description:
      'The attraction layer is upgraded from proof-only to authority-first. Video view campaigns are now viable — the cheapest and most scalable way to build warm audiences on Meta. Hook content, sector-relevant opinion pieces, and "insider knowledge" posts are added to the attraction layer. The content now generates not just awareness but engagement, follows, and saves — all signals that tell the algorithm to distribute it further at no additional cost.',
    tools: ['Updated Attraction Doc', 'Meta Video View Campaigns', 'AA Studio Reels Production'],
    items: [
      'Proof Brand attraction document reviewed and audited',
      'Hook content strategy defined and added to attraction doc',
      'Sector-relevant opinion piece framework created',
      '"Insider knowledge" post strategy documented',
      'Video view campaign objective set up in Meta Ads Manager',
      'Engagement campaign objective set up in Meta Ads Manager',
      'Updated Attraction Positioning Document produced and filed',
      'First authority attraction content batch produced in AA Studio',
      'Campaigns approved by client and live',
    ],
  },
  {
    id: 5,
    title: 'Authority Conversion Positioning — Upgraded',
    value: 'R6,500',
    solves: 'Conversion content that asks for the booking but hasn\'t built the relationship that makes saying yes easy',
    description:
      'The conversion positioning layer is upgraded with human-led objection-handling content, testimonial framing videos, and direct-to-camera booking CTAs — all delivered by the Brand Avatar or UGC framework. A prospect who has watched 4–6 videos featuring a recognisable face they trust converts at a materially higher rate than one who has only seen static before/after content. The conversion document is rebuilt to incorporate this mechanism into every campaign cycle.',
    tools: ['Updated Conversion Doc', 'Meta Conversion Campaigns', 'AA Studio'],
    items: [
      'Proof Brand conversion document reviewed and audited',
      'Human-led objection-handling content scripted',
      'Testimonial framing video concepts created',
      'Direct-to-camera booking CTA scripts written',
      'Primary objection and hesitation updated in conversion doc',
      'Updated Conversion Positioning Document produced and filed',
      'Conversion campaigns rebuilt with human-led content',
      'Campaigns approved by client and live',
    ],
  },
  {
    id: 6,
    title: 'Bi-Weekly Avatar Content Production Cycle',
    value: 'R8,000 / month',
    solves: 'Having a Brand Avatar or UGC creator with no consistent production structure to activate them',
    description:
      'A dedicated Avatar production cycle is integrated into the existing bi-weekly delivery cadence. Every two weeks: AA Studio reviews prior campaign performance, writes new scripts based on what\'s converting, briefs the Avatar or UGC creator, films or collects content, edits to brand standard, and schedules within the campaign structure. The Brand Avatar is never left to improvise — every piece of content is scripted, directed, and purposeful. Week 1 of every cycle: review + script + film. Week 2: edit + approve + launch.',
    tools: ['AA Studio Direction', 'Avatar Brief Templates', 'AA Portal Approval Flow'],
    items: [
      'Week 1: Prior cycle performance reviewed and documented',
      'Week 1: New scripts written based on what\'s converting',
      'Week 1: Avatar / UGC creator briefed with new scripts',
      'Week 1: Content filmed or collected from creator',
      'Week 2: Content edited to brand standard in AA Studio',
      'Week 2: Content sent for client approval via AA Portal',
      'Week 2: Approved content scheduled and launched in campaigns',
    ],
  },
  {
    id: 7,
    title: 'Full Funnel Paid Media — 5 Campaign Objectives',
    value: 'R10,000',
    solves: 'Only running lead-gen campaigns when video view and engagement campaigns compound ROI at lower cost',
    description:
      'The Proof Brand runs three campaign objectives. The Authority Brand expands to five: Awareness (broad reach), Video Views (cheapest warm audience building), Engagement (algorithm distribution signals), Nurture Retargeting (warm audiences who\'ve watched), and Conversion (hot audiences ready to book). Each objective feeds the next. Video view campaigns build the pool that engagement campaigns activate, that nurture campaigns convert, that conversion campaigns close. The full funnel — running simultaneously — compounds the performance of every individual layer.',
    tools: ['Meta Ads Manager', '5-Objective Campaign Structure', 'AA Studio Creatives'],
    items: [
      'Awareness campaign live (broad reach objective)',
      'Video Views campaign live (cheapest warm audience building)',
      'Engagement campaign live (algorithm distribution signals)',
      'Nurture Retargeting campaign live (warm audiences who\'ve watched)',
      'Conversion campaign live (hot audiences ready to book)',
      'All 5 campaigns targeting correct local radius',
      'CPL and CPV monitoring set up across all objectives',
      'Full funnel structure reviewed and approved by client',
    ],
  },
  {
    id: 8,
    title: 'Priority Account Management + Monthly Strategy Call',
    value: 'R7,500 / month',
    solves: 'Scaling a more complex content system without dedicated strategic oversight',
    description:
      'Authority Brand clients receive priority account management — a dedicated account manager with a smaller client load, faster response times, and a monthly strategy call to review brand positioning, content direction, and campaign scaling decisions. The monthly call covers: what\'s compounding, what to kill, where to increase ad spend, and whether the Avatar or UGC direction needs adjustment. At this level, the brand is a strategic asset — and it is managed accordingly.',
    tools: ['Priority AM Assignment', 'Monthly Strategy Call', 'AA Portal Advanced Reporting'],
    items: [
      'Priority AM assigned with reduced client load',
      'Faster response time SLA confirmed with client',
      'Monthly strategy call scheduled (recurring calendar invite)',
      'AA Portal advanced reporting configured',
      'Month 1 strategy call completed — content direction and ad spend reviewed',
      'Client briefed on priority AM structure and escalation process',
    ],
  },
  {
    id: 9,
    title: 'Authority Orientation Call + Full System Go-Live',
    value: 'R3,000',
    solves: 'Launching upgraded campaigns without aligning on the expanded strategy and Avatar integration',
    description:
      'Before any authority content goes live, a dedicated orientation call confirms the Brand Avatar or UGC framework is operational, all positioning documents have been upgraded, the five-campaign structure is approved, and the first 14-day authority cycle is ready to launch. The client sees the full upgraded plan before a single piece of content is published. Nothing launches without sign-off. The go-live is a clear before and after for the brand\'s positioning in the market.',
    tools: ['AA Client Portal', 'Launch Checklist', 'Avatar Go-Live Brief'],
    items: [
      'Brand Avatar or UGC framework confirmed operational',
      'All 3 upgraded positioning documents (Attract / Nurture / Convert) approved',
      '5-campaign structure reviewed and signed off by client',
      'First 14-day authority cycle content ready and staged',
      'Avatar / UGC content approved for launch',
      'AA Portal advanced reporting confirmed live',
      'Client sign-off received on full upgraded system',
      'Authority engine launched — go-live date confirmed',
    ],
  },
]

// ─── Bonus Definitions ─────────────────────────────────────────────────────────

const AUTHORITY_BRAND_BONUSES: BonusDef[] = [
  {
    id: 'bonus-1',
    stepId: 11,
    title: 'Avatar Script Library — First 12 Scripts',
    value: 'R4,500',
    description:
      'The first 12 Brand Avatar or UGC scripts produced before go-live — covering three content categories: educational hooks, objection-handling, and direct conversion CTAs. Four scripts per category, each tested against a different psychological trigger for the sector\'s specific audience. The Avatar never steps in front of a camera without a fully produced script. These 12 scripts form the content foundation for the first two months of authority content.',
    items: [
      'Educational hook scripts 1–4 written (sector-specific triggers)',
      'Objection-handling scripts 5–8 written',
      'Direct conversion CTA scripts 9–12 written',
      'All 12 scripts reviewed for sector relevance and brand voice',
      'Script library delivered to client via AA Portal',
    ],
  },
  {
    id: 'bonus-2',
    stepId: 12,
    title: 'Profile Authority Rebuild — Highlights, Bio & Link Page',
    value: 'R3,000',
    description:
      'The Instagram profile is rebuilt to reflect the authority positioning — not just the proof brand. New bio positioning that signals category expertise. Highlights rebuilt to include a "Start Here" brand introduction sequence, an FAQ highlight, and a social proof highlight. The link-in-bio page updated with authority-level copy and a refined conversion path. A profile that says "credible business" is replaced by one that says "the expert in this space."',
    items: [
      'Bio repositioned to signal category expertise',
      '"Start Here" brand introduction highlight created',
      'FAQ highlight created and populated',
      'Social proof highlight created and populated',
      'Link-in-bio page updated with authority-level copy',
      'Refined conversion path confirmed live',
      'Profile authority rebuild approved by client',
    ],
  },
  {
    id: 'bonus-3',
    stepId: 13,
    title: 'First Authority Content Drop — 6 Pre-Production Posts',
    value: 'R3,500',
    description:
      'Before the authority engine goes live, six authority posts are produced, approved, and ready to publish — creating an immediate visual and content shift on the profile. The audience sees the upgrade on Day 1. The first six posts establish the new content tone, introduce the Avatar or UGC voice, and signal to existing followers that the brand has moved to a new level. No cold-start. No adjustment period. Momentum from launch.',
    items: [
      'Post 1 — Authority / educational content: created and captioned',
      'Post 2 — Authority / educational content: created and captioned',
      'Post 3 — Avatar / UGC introduction post: created and captioned',
      'Post 4 — Opinion / sector insight post: created and captioned',
      'Post 5 — Objection-handling post: created and captioned',
      'Post 6 — Brand positioning / category leadership: created and captioned',
      'All 6 posts approved by client',
      'All 6 posts published to profile',
    ],
  },
  {
    id: 'bonus-4',
    stepId: 14,
    title: 'Sector Authority Positioning Workshop — 1 Session',
    value: 'R4,000',
    description:
      'A dedicated 60-minute positioning session maps the intellectual territory the brand will own in its local sector — the specific opinions, insights, and knowledge that no competitor can credibly replicate. What does this business know about its sector that clients don\'t? That knowledge is the authority content framework. This session extracts it and turns it into a 6-month content direction brief that powers every educational and opinion piece the Avatar produces.',
    items: [
      '60-minute positioning session completed',
      'Unique sector knowledge areas extracted and documented',
      'Competitor positioning gaps identified',
      'Brand\'s ownable intellectual territory defined',
      '6-month content direction brief produced from session',
      'Workshop output delivered to client via AA Portal',
    ],
  },
]

// ─── Component ─────────────────────────────────────────────────────────────────

export default function AuthorityBrand() {
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

      for (const step of AUTHORITY_BRAND_STEPS) {
        step.items.forEach((item, idx) => {
          rows.push({ client_id: client.id, title: item, position: step.id * 1000 + idx, is_completed: false, notes: '' })
        })
        rows.push({ client_id: client.id, title: '__notes__', position: step.id * 1000 + 999, is_completed: false, notes: '' })
      }

      for (const bonus of AUTHORITY_BRAND_BONUSES) {
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

  const allItems = deliverables.filter(d => d.position % 1000 !== 999)
  const totalCompleted = allItems.filter(d => d.is_completed).length
  const totalItems = allItems.length
  const overallPct = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0

  const completedSteps = AUTHORITY_BRAND_STEPS.filter(s => {
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
                    {completedSteps} / {AUTHORITY_BRAND_STEPS.length} STEPS
                  </div>
                </div>
              </div>
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

              {AUTHORITY_BRAND_STEPS.map(step => {
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
                    <button
                      onClick={() => toggleExpand(step.id)}
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

                        <div style={{
                          marginBottom: 12, fontSize: 11, lineHeight: 1.5,
                          color: 'var(--grey)', fontFamily: 'DM Mono',
                          padding: '8px 12px', background: 'var(--bg2)', borderRadius: 6,
                          borderLeft: '2px solid var(--teal-dark)',
                        }}>
                          <span style={{ color: 'var(--grey2)', marginRight: 6 }}>SOLVES:</span>
                          {step.solves}
                        </div>

                        <p style={{ fontSize: 12, color: 'var(--grey)', lineHeight: 1.65, marginBottom: 16 }}>
                          {step.description}
                        </p>

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
                  R15,000 Value
                </span>
              </div>

              {/* ── Bonus Cards ── */}
              {AUTHORITY_BRAND_BONUSES.map(bonus => {
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
                        background: isComplete ? 'var(--teal)' : 'var(--bg3)', flexShrink: 0,
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

              <div style={{ height: 24 }} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
