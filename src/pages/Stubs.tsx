function Stub({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, textAlign: 'center', gap: 12 }}>
      <div style={{ fontFamily: 'Playfair Display', fontSize: 28, fontWeight: 700 }}>{title}</div>
      <div style={{ color: 'var(--grey)', fontSize: 14, maxWidth: 400, lineHeight: 1.7 }}>{sub}</div>
      <div style={{ fontFamily: 'DM Mono', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--teal)', marginTop: 8, opacity: 0.6 }}>
        — In progress —
      </div>
    </div>
  )
}

export function Outreach()  { return <Stub title="Outreach" sub="Manage WhatsApp outreach batches, compose messages, track follow-ups and response rates." /> }
export function Clients()   { return <Stub title="Clients" sub="Active retainer clients, health indicators, sprint history and financials per account." /> }
export function Sprints()   { return <Stub title="Proof Sprints" sub="Kanban board of all active 14-day proof sprints. Daily log, ad performance, results meeting prep." /> }
export function Portal()    { return <Stub title="AA Portal" sub="Client-facing portal view. Select any active client to see their live pipeline and Meta Ads performance." /> }
export function Studio()    { return <Stub title="MJR Studio" sub="AI-powered Missed Jobs Report builder. Input prospect data, generate report, copy WhatsApp message." /> }
export function Sops()      { return <Stub title="SOP Library" sub="All Standard Operating Procedures. View, edit, export and version-control every process." /> }
export function Templates() { return <Stub title="Templates" sub="WhatsApp messages, call scripts, contracts, report templates, VA briefs." /> }
export function Capital()   { return <Stub title="Trust & Capital" sub="Personal financial architecture. Savings runway, net worth tracker, trust deployment schedule." /> }
export function SettingsPage() { return <Stub title="Settings" sub="API keys, webhook URLs, Supabase connection, profile and notification preferences." /> }