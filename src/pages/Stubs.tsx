function Stub({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, textAlign: 'center', gap: 12 }}>
      <div style={{ fontFamily: 'Playfair Display', fontSize: 28, fontWeight: 700 }}>{title}</div>
      <div style={{ color: 'var(--grey)', fontSize: 14, maxWidth: 400, lineHeight: 1.7 }}>{sub}</div>
      <div style={{ fontFamily: 'DM Mono', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--teal)', marginTop: 8, opacity: 0.6 }}>— In progress —</div>
    </div>
  )
}

export function Clients() { return <Stub title="Clients" sub="Active retainer clients, health indicators, sprint history and financials per account." /> }
export function Portal()  { return <Stub title="AA Portal" sub="Client-facing portal view. Select any active client to see their live pipeline and Meta Ads performance." /> }
export function Studio()  { return <Stub title="MJR Studio" sub="AI-powered Missed Jobs Report builder. Input prospect data, generate report, copy WhatsApp message." /> }