import { useEffect, useState } from 'react'
import { supabasev } from '../lib/supabase'
import type { MonthlyRevenue } from '../lib/supabase'
import { formatRand, monthLabel } from '../lib/utils'
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function Finance() {
  const [rows, setRows]         = useState<MonthlyRevenue[]>([])
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('monthly_revenue').select('*').order('month').then(({ data }) => {
      setRows(data || [])
      setLoading(false)
    })
  }, [])

  const now = new Date()
  const currentMonth = rows.find(r => {
    return r.month.startsWith(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`)
  })

  const chartData = rows.map(r => ({
    month: monthLabel(r.month.slice(0,7)),
    MRR: r.gross_mrr || 0,
    Target: r.schedule_d_mrr_target || 0,
  }))

  return (
    <div>
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Current MRR',    value: currentMonth?.gross_mrr,        sub: `target ${formatRand(currentMonth?.schedule_d_mrr_target)}` },
          { label: 'Net Profit',     value: null,                            sub: 'this month' },
          { label: 'Principal Draw', value: currentMonth?.principal_draw,   sub: 'this month' },
          { label: 'Trust Deploy',   value: currentMonth?.trust_deployment, sub: 'this month' },
          { label: 'Trust Balance',  value: currentMonth?.trust_balance_end, sub: 'cumulative' },
        ].map(c => (
          <div key={c.label} className="card">
            <span className="label">{c.label}</span>
            {loading
              ? <div className="skeleton" style={{ height: 36, margin: '8px 0' }} />
              : <div className="stat-num" style={{ fontSize: 24, marginTop: 8 }}>{formatRand(c.value)}</div>
            }
            <div style={{ fontSize: 12, color: 'var(--grey)', marginTop: 4, fontFamily: 'DM Mono' }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-label">MRR vs Schedule D — Oct 2026 → Mar 2028</div>
        {loading
          ? <div className="skeleton" style={{ height: 280 }} />
          : (
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--grey)', fontFamily: 'DM Mono' }} />
                <YAxis tickFormatter={v => `R${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: 'var(--grey)', fontFamily: 'DM Mono' }} />
                <Tooltip
                  formatter={(v: any, name: string) => [formatRand(v), name]}
                  contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 4, fontFamily: 'DM Mono', fontSize: 12, color: 'var(--white)' }}
                />
                <Bar dataKey="MRR" fill="var(--teal)" opacity={0.8} />
                <Line type="monotone" dataKey="Target" stroke="var(--grey2)" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          )
        }
      </div>

      {/* Variance table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border2)' }}>
          <div className="section-label" style={{ margin: 0 }}>Schedule D Variance</div>
        </div>
        {loading
          ? <div style={{ padding: 20 }}>{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 44, marginBottom: 8 }} />)}</div>
          : (
            <table className="aa-table">
              <thead>
                <tr>
                  <th>Month</th><th>Target MRR</th><th>Actual MRR</th>
                  <th>Variance</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => {
                  const actual  = r.gross_mrr || 0
                  const target  = r.schedule_d_mrr_target || 0
                  const delta   = actual - target
                  const pct     = target ? Math.round(delta / target * 100) : 0
                  const status  = pct >= -5 ? 'On Track' : pct >= -20 ? 'Behind' : 'At Risk'
                  const color   = pct >= -5 ? 'var(--green)' : pct >= -20 ? 'var(--amber)' : 'var(--red)'
                  return (
                    <>
                      <tr key={r.id} onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
                        <td style={{ fontFamily: 'DM Mono', fontSize: 12 }}>{monthLabel(r.month.slice(0,7))}</td>
                        <td>{formatRand(target)}</td>
                        <td style={{ color: 'var(--teal)' }}>{actual ? formatRand(actual) : <span style={{ color: 'var(--grey2)' }}>—</span>}</td>
                        <td style={{ fontFamily: 'DM Mono', fontSize: 13, color: actual ? (delta >= 0 ? 'var(--green)' : 'var(--red)') : 'var(--grey2)' }}>
                          {actual ? `${delta >= 0 ? '+' : ''}${pct}%` : '—'}
                        </td>
                        <td>
                          <span className="badge" style={{ background: color + '20', color }}>
                            {actual ? status : 'Pending'}
                          </span>
                        </td>
                        <td>
                          <button className="btn-ghost" style={{ fontSize: 10, padding: '4px 10px' }}
                            onClick={e => { e.stopPropagation(); setExpanded(expanded === r.id ? null : r.id) }}>
                            {expanded === r.id ? 'Hide' : 'Update'}
                          </button>
                        </td>
                      </tr>
                      {expanded === r.id && (
                        <tr key={`${r.id}-exp`}>
                          <td colSpan={6} style={{ background: 'var(--bg3)', padding: '20px' }}>
                            <MonthUpdateForm row={r} onSave={updated => {
                              setRows(prev => prev.map(x => x.id === updated.id ? updated : x))
                              setExpanded(null)
                            }} />
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          )
        }
      </div>
    </div>
  )
}

function MonthUpdateForm({ row, onSave }: { row: MonthlyRevenue; onSave: (r: MonthlyRevenue) => void }) {
  const [form, setForm] = useState({
    gross_mrr:             row.gross_mrr || 0,
    principal_draw:        row.principal_draw || 0,
    trust_deployment:      row.trust_deployment || 0,
    trust_balance_end:     row.trust_balance_end || 0,
    personal_cash_balance: row.personal_cash_balance || 0,
  })

  async function save() {
    const { data } = await supabase.from('monthly_revenue').update(form).eq('id', row.id).select().single()
    if (data) onSave(data)
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 14 }}>
        {[
          ['Gross MRR',      'gross_mrr'],
          ['Principal Draw', 'principal_draw'],
          ['Trust Deploy',   'trust_deployment'],
          ['Trust Balance',  'trust_balance_end'],
          ['Personal Cash',  'personal_cash_balance'],
        ].map(([label, field]) => (
          <div key={field}>
            <div className="label">{label}</div>
            <input className="input" type="number" value={(form as any)[field]}
              onChange={e => setForm(prev => ({ ...prev, [field]: Number(e.target.value) }))} />
          </div>
        ))}
      </div>
      <button className="btn-primary" onClick={save}>Save Month →</button>
    </div>
  )
}