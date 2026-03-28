import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { 
  DollarSign, 
  Filter, Plus, ArrowUpRight, 
  ArrowDownLeft, BarChart3, X
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

const CATEGORIES = ['Ads', 'Software', 'Infrastructure', 'Content', 'Contractor', 'Setup Fee', 'Subscription']

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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { toast } = useToast()

  // Form State
  const [formData, setFormData] = useState({
    amount: '',
    type: 'income',
    category: 'Subscription',
    description: '',
    date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    fetchTransactions()
  }, [])

  async function fetchTransactions() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('ledger') 
        .select('*')
        .order('date', { ascending: false })

      if (error) throw error
      setTransactions((data as unknown as Transaction[]) || [])
    } catch (error: any) {
      toast({ title: 'Fetch Error', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  async function handleAddTransaction(e: React.FormEvent) {
    e.preventDefault()
    try {
      const { error } = await supabase.from('ledger').insert([{
        amount: parseFloat(formData.amount),
        type: formData.type,
        category: formData.category,
        description: formData.description,
        date: formData.date
      }])

      if (error) throw error
      
      toast({ title: 'Success', description: 'Transaction recorded.', variant: 'success' })
      setIsModalOpen(false)
      setFormData({ amount: '', type: 'income', category: 'Subscription', description: '', date: new Date().toISOString().split('T')[0] })
      fetchTransactions()
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  // ─── Calculations ───────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0)
    const expenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0)
    return { income, expenses, net: income - expenses }
  }, [transactions])

  const categoryShare = useMemo(() => {
    const totalExp = stats.expenses || 1
    return CATEGORIES.map(cat => {
      const val = transactions.filter(t => t.type === 'expense' && t.category === cat).reduce((acc, t) => acc + t.amount, 0)
      return { name: cat, percent: Math.round((val / totalExp) * 100) }
    }).filter(c => c.percent > 0)
  }, [transactions, stats.expenses])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40, opacity: loading ? 0.7 : 1 }}>
      
      {/* Header */}
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

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        <StatCard title="Total Revenue" amount={stats.income} type="income" />
        <StatCard title="Total Expenses" amount={stats.expenses} type="expense" />
        <StatCard title="Net Profit" amount={stats.net} type="net" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 24 }}>
        
        {/* Visualization */}
        <div className="card" style={{ minHeight: 400, display: 'flex', flexDirection: 'column', padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div className="section-label">Cashflow Visualization ({view})</div>
            <BarChart3 size={16} style={{ color: 'var(--teal)' }} />
          </div>
          
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 12, padding: '20px 0' }}>
            {[40, 70, 45, 90, 65, 80, 95].map((h, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column-reverse', gap: 4, height: '100%' }}>
                <div style={{ height: `${h}%`, background: 'var(--teal)', borderRadius: '4px 4px 0 0', opacity: 0.8 }} />
                <div style={{ height: `${h/3}%`, background: '#FF4444', borderRadius: '2px', opacity: 0.6 }} />
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ padding: 20 }}>
            <button 
              className="btn-primary" 
              onClick={() => setIsModalOpen(true)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <Plus size={16} /> Record Transaction
            </button>
          </div>

          <div className="card" style={{ padding: 20, flex: 1 }}>
            <div className="section-label" style={{ marginBottom: 16 }}>Expense Distribution</div>
            {categoryShare.length > 0 ? categoryShare.map(cat => (
              <div key={cat.name} style={{ padding: '12px 0', borderBottom: '1px solid var(--border2)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--white)' }}>{cat.name}</span>
                <span style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--grey)' }}>{cat.percent}%</span>
              </div>
            )) : (
              <div style={{ fontSize: 11, color: 'var(--grey2)', textAlign: 'center', marginTop: 20 }}>No expenses tracked</div>
            )}
          </div>
        </div>
      </div>

      {/* Ledger Table */}
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
              <th style={tableHeaderStyle} className="text-right">Amount</th>
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
                  No financial data recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div style={modalOverlayStyle}>
          <div className="card" style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'Playfair Display', margin: 0 }}>New Transaction</h2>
              <X size={20} onClick={() => setIsModalOpen(false)} style={{ cursor: 'pointer', color: 'var(--grey)' }} />
            </div>
            
            <form onSubmit={handleAddTransaction} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Amount (ZAR)</label>
                <input type="number" step="0.01" required value={formData.amount} 
                  onChange={e => setFormData({...formData, amount: e.target.value})} style={inputStyle} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Type</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} style={inputStyle}>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Category</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} style={inputStyle}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>Description</label>
                <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={inputStyle} />
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>Date</label>
                <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} style={inputStyle} />
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: 12 }}>Post to Ledger</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const tableHeaderStyle: React.CSSProperties = { padding: '12px 24px', fontSize: 10, fontFamily: 'DM Mono', color: 'var(--grey)', textTransform: 'uppercase' }
const tableCellStyle: React.CSSProperties = { padding: '16px 24px', fontSize: 13, color: 'var(--grey)' }
const categoryBadgeStyle: React.CSSProperties = { background: 'var(--bg2)', padding: '4px 8px', borderRadius: 4, fontSize: 10, fontFamily: 'DM Mono', color: 'var(--teal)', border: '1px solid var(--teal-border)' }
const modalOverlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }
const modalContentStyle: React.CSSProperties = { width: '100%', maxWidth: 450, padding: 32, background: 'var(--bg1)', border: '1px solid var(--border2)' }
const inputGroupStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 }
const labelStyle: React.CSSProperties = { fontSize: 10, fontFamily: 'DM Mono', color: 'var(--grey)', textTransform: 'uppercase' }
const inputStyle: React.CSSProperties = { background: 'var(--bg2)', border: '1px solid var(--border2)', color: 'white', padding: '10px', borderRadius: 6, fontSize: 13, fontFamily: 'inherit' }
