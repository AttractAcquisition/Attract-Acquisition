import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatRand, monthLabel } from '../lib/utils'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface CapitalRow {
  id: string
  month: string
  personal_cash_balance: number | null
  trust_balance_end: number | null
  schedule_d_mrr_target: number | null
  gross_mrr: number | null
  principal_draw: number | null
  trust_deployment: number | null
  notes: string | null
}

const TRUST_SCHEDULE = [
  { month: 'Q1 2027', target: 15000,  purpose: 'VA hire + tool costs' },
  { month: 'Q2 2027', target: 25000,  purpose: 'Meta Ads expansion' },
  { month: 'Q3 2027', target: 40000,  purpose: 'Italy transition costs' },
  { month: 'Q4 2027', target: 60000,  purpose: 'LLC equity + operations' },
  { month: 'Q1 2028', target: 100000, purpose: 'R200k MRR infrastructure' },
]

export default function Capital() {
  const [rows, setRows]       = useState<CapitalRow[]>([])
  const [loading, setLoading] = useState(true)
  const [savings, setSavings] = useState(62000)
  const [form, setForm]       = useState({ month: '', personal_cash_balance: 0, trust_balance_end: 0 })
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    supabase.from('monthly_revenue').select('*').order('month').then(({ data }) => {
      setRows(data || [])
      setLoading(false)
      if (data && data.length > 0) {
        const latest = data.filter(r => r.personal_cash_balance !== null).slice(-1)[0]
        if (latest?.personal_cash_balance !== null) setSavings(latest.personal_cash_balance)
      }
    })
  }, [])

  const savingsPct    = Math.min(100, Math.round(savings / 158000 * 100))
  const monthsLeft    = Math.max(0, Math.ceil((158000 - savings) / 62000))
  const trustBalance  = rows.filter(r => r.trust_balance_end).slice(-1)[0]?.trust_balance_end || 0
  const llcEquity     = 0
  const netWorth      = savings + trustBalance + llcEquity

  const chartData = rows.map(r => ({
    month: monthLabel(r.month.slice(0, 7)),
    Cash:  r.personal_cash_balance || 0,
    Trust: r.trust_balance_end || 0,
  }))

  async function updateMonth() {
    if (!form.month) return
    setSaving(true)
    await supabase.from('monthly_revenue')
      .upsert({ month: form.month + '-01', personal_cash_balance: form.personal_cash_balance, trust_balance_end: form.trust_balance_end }, { onConflict: 'month' })
    const { data } = await supabase.from('monthly_revenue').select('*').order('month')
    setRows(data || [])
    setSavings(form.personal_cash_balance ?? savings)
    setSaving(false)
  }

  return (
    <div>
      {/* Net worth cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Personal Cash',  value: savings,      sub: 'current balance' },
          { label: 'Trust Balance',  value: trustBalance, sub: 'cumulative deployed' },
          { label: 'LLC Equity',     value: llcEquity,    sub: 'estimated valuation' },
          { label: 'Total Net Worth',value: netWorth,     sub: 'combined', teal: true },
        ].map(c => (
          <div key={c.label} className={`card${c.teal ? ' teal-top' : ''}`}>
            <div className="label">{c.label}</div>
            {loading
              ? <div className="skeleton" style={{ height: 32, margin: '8px 0' }} />
              : <div className="stat-num" style={{ fontSize: 24, marginTop: 8 }}>{formatRand(c.value)}</div>
            }
            <div style={{ fontSize: 12, color: 'var(--grey)', marginTop: 4, fontFamily: 'DM Mono' }}>{c.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Savings runway */}
        <div className="card">
          <div className="section-label">Seed Capital Runway</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
            <div className="stat-num" style={{ fontSize: 30 }}>{formatRand(savings)}</div>
            <div style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--grey)' }}>of R158,000</div>
          </div>
          <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
            <div style={{ height: '100%', background: 'var(--teal)', borderRadius: 3, width: `${savingsPct}%`, transition: 'width 0.4s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'DM Mono', fontSize: 12, color: 'var(--grey)', marginBottom: 20 }}>
            <span>{savingsPct}% accumulated</span>
            <span>{monthsLeft} months to target</span>
          </div>
          <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--grey2)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>+R62,000/mo accumulation rate</div>
          <div style={{ borderTop: '1px solid var(--border2)', paddingTop: 14 }}>
            <div style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Deployment Plan</div>
            {[
              { item: 'VA hire (Month 2)',        amount: 8000 },
              { item: 'Meta Ads seed (Month 1)',  amount: 15000 },
              { item: 'Tools + subscriptions',   amount: 5000 },
              { item: 'Operating buffer',        amount: 20000 },
              { item: 'Trust registration',      amount: 8000 },
              { item: 'LLC / CIPC registration', amount: 3000 },
            ].map(d => (
              <div key={d.item} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: 'var(--grey)' }}>{d.item}</span>
                <span style={{ fontFamily: 'DM Mono', color: 'var(--white)' }}>{formatRand(d.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly update form */}
        <div className="card">
          <div className="section-label">Update Monthly Balances</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div className="label">Month</div>
              <input className="input" type="month" value={form.month} onChange={e => setForm(prev => ({ ...prev, month: e.target.value }))} />
            </div>
            <div>
              <div className="label">Personal Cash Balance (R)</div>
              <input className="input" type="number" placeholder="0" value={form.personal_cash_balance || ''}
                onChange={e => setForm(prev => ({ ...prev, personal_cash_balance: Number(e.target.value) }))} />
            </div>
            <div>
              <div className="label">Trust Balance (R)</div>
              <input className="input" type="number" placeholder="0" value={form.trust_balance_end || ''}
                onChange={e => setForm(prev => ({ ...prev, trust_balance_end: Number(e.target.value) }))} />
            </div>
            <button className="btn-primary" onClick={updateMonth} disabled={saving || !form.month}>
              {saving ? 'Saving...' : 'Update Balances →'}
            </button>
          </div>

          <div style={{ borderTop: '1px solid var(--border2)', marginTop: 20, paddingTop: 16 }}>
            <div className="section-label">Recent History</div>
            {rows.filter(r => r.personal_cash_balance || r.trust_balance_end).slice(-5).reverse().map(r => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                <span style={{ fontFamily: 'DM Mono', color: 'var(--grey)', fontSize: 11 }}>{monthLabel(r.month.slice(0,7))}</span>
                <span style={{ color: 'var(--white)' }}>{formatRand(r.personal_cash_balance)}</span>
                <span style={{ color: 'var(--teal)' }}>{formatRand(r.trust_balance_end)} trust</span>
              </div>
            ))}
            {rows.filter(r => r.personal_cash_balance || r.trust_balance_end).length === 0 &&
              <div style={{ color: 'var(--grey)', fontSize: 12, fontFamily: 'DM Mono' }}>No balance history yet</div>
            }
          </div>
        </div>
      </div>

      {/* Net worth chart */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-label">Net Worth Trajectory</div>
        {loading
          ? <div className="skeleton" style={{ height: 200 }} />
          : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--grey)', fontFamily: 'DM Mono' }} />
                <YAxis tickFormatter={v => `R${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: 'var(--grey)', fontFamily: 'DM Mono' }} />
                <Tooltip formatter={(v: any, n: any) => [formatRand(v), String(n ?? 'Value')]}
                  contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 4, fontFamily: 'DM Mono', fontSize: 12, color: 'var(--white)' }} />
                <Area type="monotone" dataKey="Cash"  stroke="var(--teal)"   fill="rgba(0,229,195,0.1)"  strokeWidth={2} />
                <Area type="monotone" dataKey="Trust" stroke="var(--amber)"  fill="rgba(239,159,39,0.08)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )
        }
      </div>

      {/* Trust deployment schedule */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border2)' }}>
          <div className="section-label" style={{ margin: 0 }}>Trust Deployment Schedule</div>
        </div>
        <table className="aa-table">
          <thead><tr><th>Quarter</th><th>Target Deploy</th><th>Actual</th><th>Variance</th><th>Purpose</th></tr></thead>
          <tbody>
            {TRUST_SCHEDULE.map(t => (
              <tr key={t.month}>
                <td style={{ fontFamily: 'DM Mono', fontSize: 12 }}>{t.month}</td>
                <td>{formatRand(t.target)}</td>
                <td style={{ color: 'var(--grey2)' }}>—</td>
                <td style={{ color: 'var(--grey2)' }}>—</td>
                <td style={{ color: 'var(--grey)', fontSize: 13 }}>{t.purpose}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}