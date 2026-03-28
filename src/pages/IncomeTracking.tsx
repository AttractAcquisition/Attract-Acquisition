import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { 
  TrendingUp, TrendingDown, DollarSign, 
  Calendar, Filter, Plus, ArrowUpRight, 
  ArrowDownLeft, BarChart3, PieChart
} from 'lucide-react'
import { useToast } from '../lib/toast'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Transaction {
  id: string
  created_at: string
  amount: number
  category: string
  type: 'income' | 'expense'
  description: string
  date: string
}

type ViewType = 'monthly' | 'weekly' | 'daily'

// ─── Sub-Components ───────────────────────────────────────────────────────────
function StatCard({ title, amount, type }: { title: string; amount: number; type: 'income' | 'expense' | 'net' }) {
  const isNet = type === 'net'
  const color = type === 'income' || (isNet && amount >= 0) ? 'var(--teal)' : '#FF4444'
  const Icon = type === 'income' ? ArrowUpRight : type === 'expense' ? ArrowDownLeft : DollarSign

  return (
    <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'var(--grey)', textTransform: 'uppercase' }}>{title}</span>
        <Icon size={14} style={{ color }} />
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'Playfair Display', color: 'var(--white)' }}>
        R {amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function IncomeTracking() {
  const [view, setView] = useState<ViewType>('monthly')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchTransactions()
  }, [])

  async function fetchTransactions() {
    setLoading(true)
    const { data, error } = await supabase
      .from('ledger') // Ensure this table exists in your Supabase
      .select('*')
      .order('date', { ascending: false })

    if (error) {
      toast('Failed to load financial data', 'error')
    } else {
      setTransactions(data || [])
    }
    setLoading(false)
  }

  // ─── Calculations ───────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0)
    const expenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0)
    return { income, expenses, net: income - expenses }
  }, [transactions])

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
      
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontFamily: 'Playfair Display', fontSize: 32, margin: 0 }}>Capital Flow</h1>
          <p style={{ color: 'var(--grey)', fontFamily: 'DM Mono', fontSize: 12, marginTop: 4 }}>
            Attract Acquisition // Financial Intelligence Unit
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: 12, background: 'var(--bg3)', padding: 4, borderRadius: 8, border: '1px solid var(--border2)' }}>
          {(['daily', 'weekly', 'monthly'] as ViewType[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: '6px 16px', borderRadius: 6, fontSize: 11, fontFamily: 'DM Mono', textTransform: 'uppercase',
                background: view === v ? 'var(--teal)' : 'transparent',
                color: view === v ? 'var(--bg1)' : 'var(--grey)',
                border: 'none', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Top Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        <StatCard title="Total Revenue" amount={stats.income} type="income" />
        <StatCard title="Total Expenses" amount={stats.expenses} type="expense" />
        <StatCard title="Net Profit" amount={stats.net} type="net" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 24 }}>
        
        {/* Visual Representation Placeholder */}
        <div className="card" style={{ minHeight: 400, display: 'flex', flexDirection: 'column', padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div className="section-label">Cashflow Visualization ({view})</div>
            <BarChart3 size={16} style={{ color: 'var(--teal)' }} />
          </div>
          
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 12, padding: '20px 0' }}>
            {/* Mock Chart Bars - In a real app, you'd map your aggregated data here */}
            {[40, 70, 45, 90, 65, 80, 95].map((h, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column-reverse', gap: 4, height: '100%' }}>
                <div style={{ 
                  height: `${h}%`, background: 'var(--teal)', borderRadius: '4px 4px 0 0', 
                  opacity: 0.8, position: 'relative' 
                }} />
                <div style={{ height: `${h/3}%`, background: '#FF4444', borderRadius: '2px', opacity: 0.6 }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--grey2)', fontSize: 10, fontFamily: 'DM Mono' }}>
            <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span>
          </div>
        </div>

        {/* Categories / Quick Entry */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ padding: 20 }}>
            <button className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Plus size={16} /> Record Transaction
            </button>
          </div>

          <div className="card" style={{ padding: 20, flex: 1 }}>
            <div className="section-label" style={{ marginBottom: 16 }}>Expense Distribution</div>
            {/* Simple CSS-based category list */}
            {['Ads', 'Software', 'Infrastructure', 'Content'].map(cat => (
              <div key={cat} style={{ padding: '12px 0', borderBottom: '1px solid var(--border2)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--white)' }}>{cat}</span>
                <span style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--grey)' }}>32%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction Ledger */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="section-label" style={{ margin: 0 }}>Transaction Ledger</div>
          <Filter size={14} style={{ color: 'var(--grey)' }} />
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border2)' }}>
              <th style={tableHeaderStyle}>Date</th>
              <th style={tableHeaderStyle}>Description</th>
              <th style={tableHeaderStyle}>Category</th>
              <th style={tableHeaderStyle}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length > 0 ? transactions.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid var(--border2)' }}>
                <td style={tableCellStyle}>{new Date(t.date).toLocaleDateString()}</td>
                <td style={{ ...tableCellStyle, color: 'var(--white)', fontWeight: 500 }}>{t.description}</td>
                <td style={tableCellStyle}><span style={categoryBadgeStyle}>{t.category}</span></td>
                <td style={{ ...tableCellStyle, color: t.type === 'income' ? 'var(--teal)' : '#FF4444', textAlign: 'right', fontFamily: 'DM Mono' }}>
                  {t.type === 'income' ? '+' : '-'} R {t.amount.toLocaleString()}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} style={{ padding: 40, textAlign: 'center', color: 'var(--grey2)', fontSize: 12 }}>
                  No financial data recorded for this period.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const tableHeaderStyle: React.CSSProperties = {
  padding: '12px 24px',
  fontSize: 10,
  fontFamily: 'DM Mono',
  color: 'var(--grey)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
}

const tableCellStyle: React.CSSProperties = {
  padding: '16px 24px',
  fontSize: 13,
  color: 'var(--grey)'
}

const categoryBadgeStyle: React.CSSProperties = {
  background: 'var(--bg2)',
  padding: '4px 8px',
  borderRadius: 4,
  fontSize: 10,
  fontFamily: 'DM Mono',
  color: 'var(--teal)',
  border: '1px solid var(--teal-border)'
}
