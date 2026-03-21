function Stub({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, textAlign: 'center', gap: 12 }}>
      <div style={{ fontFamily: 'Playfair Display', fontSize: 28, fontWeight: 700 }}>{title}</div>
      <div style={{ color: 'var(--grey)', fontSize: 14, maxWidth: 400, lineHeight: 1.7 }}>{sub}</div>
      <div style={{ fontFamily: 'DM Mono', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--teal)', marginTop: 8, opacity: 0.6 }}>— Stage 9 —</div>
    </div>
  )
}

export function Portal() { return <Stub title="AA Portal" sub="Client-facing portal. Built in Stage 9 once auth and role-based routing is complete." /> }