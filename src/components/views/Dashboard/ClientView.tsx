import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../lib/auth'
import { formatRand } from '../../../lib/utils'
import { 
  Eye, UserCheck, MessageSquare, CalendarCheck, 
  Coins, Phone, MessageCircle, Star, Shield, AlertCircle
} from 'lucide-react'

export default function ClientView() {
  const { metadata_id } = useAuth()
  const [client, setClient] = useState<any>(null)
  const [metrics, setMetrics] = useState<any>(null)
  const [manager, setManager] = useState<any>(null)
  const [review, setReview] = useState({ rating: 5, comment: '' })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function load() {
      // If metadata_id is missing, we stop loading but allow the UI to render
      // so we can show the "Account Pending" state instead of a frozen spinner.
      if (!metadata_id) {
        setLoading(false)
        return
      }
      
      const id = metadata_id

      try {
        // 1. Fetch Client Info
        const { data: clientData } = await supabase
          .from('clients')
          .select('*')
          .eq('id', id)
          .maybeSingle()

        setClient(clientData)

        // 2. Fetch Manager Details using the 'account_manager' column
        if (clientData?.account_manager) {
          const { data: mgrData } = await supabase
            .from('profiles' as any)
            .select('*')
            .eq('id', clientData.account_manager)
            .maybeSingle()
          setManager(mgrData)
        }

        // 3. Fetch Latest Delivery Metrics
        const { data: metricsData } = await supabase
          .from('delivery_metrics' as any)
          .select('*')
          .eq('client_id', id)
          .order('date_key', { ascending: false })
          .limit(1)

        if (metricsData && metricsData.length > 0) {
          setMetrics(metricsData[0])
        }

      } catch (err) {
        console.error("Dashboard Load Error:", err)
      } finally {
        setLoading(false)
      }
    }
    
    load()
  }, [metadata_id])

  async function submitReview() {
    if (!metadata_id || !manager?.id) return
    setSubmitting(true)
    const { error } = await supabase.from('manager_reviews' as any).insert({
      client_id: metadata_id,
      manager_id: manager.id,
      rating: review.rating,
      comment: review.comment
    })

    if (!error) {
      alert('Review submitted. Thank you!')
      setReview({ rating: 5, comment: '' })
    }
    setSubmitting(false)
  }

  // 1. Loading State
  if (loading) return (
    <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Mono', color: 'var(--teal)' }}>
      SYNCING ENGINE...
    </div>
  )

  // 2. Missing Client ID State (The "client1" fix)
  if (!metadata_id) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center', gap: 16 }}>
      <AlertCircle size={40} color="var(--amber)" />
      <h2 style={{ fontFamily: 'Playfair Display', margin: 0 }}>Account Pending Link</h2>
      <p style={{ color: 'var(--grey)', fontSize: 14, maxWidth: 400, lineHeight: 1.6 }}>
        Your user profile is active, but it hasn't been linked to a Business ID yet. 
        Please contact <strong>Attract Acquisition</strong> support to finalize your portal setup.
      </p>
    </div>
  )

  const profileConv = metrics?.profile_visits > 0 
    ? ((metrics.qualified_followers / metrics.profile_visits) * 100).toFixed(2) 
    : "0.00"

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1000, margin: '0 auto', paddingBottom: 60 }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontFamily: 'Playfair Display', fontSize: 32, fontWeight: 700, margin: 0 }}>{client?.business_name || 'Business Portal'}</h1>
          <p style={{ color: 'var(--grey)', fontFamily: 'DM Mono', fontSize: 11, textTransform: 'uppercase', marginTop: 4 }}>
            {client?.tier?.replace('_', ' ') || 'Active Partner'} · Operational Portal
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg2)', padding: '8px 16px', borderRadius: 20, border: '1px solid var(--border2)' }}>
          <div style={{ width: 8, height: 8, background: 'var(--teal)', borderRadius: '50%', boxShadow: '0 0 10px var(--teal)' }} />
          <span style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'var(--teal)', fontWeight: 700 }}>LIVE ENGINE</span>
        </div>
      </div>

      {/* THE LIVE PIPELINE TRACKER */}
      <div className="card" style={{ background: '#0a0f0e', border: '1px solid #1a2522', padding: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}>
          <span style={{ fontSize: 12, fontFamily: 'DM Mono', color: 'var(--grey)', letterSpacing: '0.2em' }}>
            LIVE CLIENT PIPELINE — {client?.business_name?.toUpperCase() || 'CLIENT'}
          </span>
          <span style={{ fontSize: 10, color: 'var(--teal)', fontWeight: 700 }}>● LIVE</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {[
            { label: 'Profile Visits', val: metrics?.profile_visits || 0, icon: Eye, max: 50000 },
            { label: 'Qualified Followers', val: metrics?.qualified_followers || 0, icon: UserCheck, max: 5000 },
            { label: 'DMs Started', val: metrics?.dms_started || 0, icon: MessageSquare, max: 2000 },
            { label: 'Appointments Booked', val: metrics?.appointments_booked || 0, icon: CalendarCheck, max: 200 },
            { label: 'Cash Collected', val: metrics?.cash_collected || 0, icon: Coins, isCash: true, max: 500000 },
          ].map(row => (
            <div key={row.label} style={{ display: 'grid', gridTemplateColumns: '200px 1fr 120px', alignItems: 'center', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <row.icon size={16} color="var(--grey2)" />
                <span style={{ fontSize: 14, color: 'var(--white)', fontWeight: 500 }}>{row.label}</span>
              </div>
              <div style={{ height: 4, background: '#141c1a', borderRadius: 10 }}>
                <div style={{ width: `${Math.min((row.val / row.max) * 100, 100)}%`, height: '100%', background: 'var(--teal)', borderRadius: 10, transition: 'width 1.5s ease' }} />
              </div>
              <div style={{ textAlign: 'right', fontFamily: 'DM Mono', fontSize: 16, fontWeight: 700, color: 'var(--teal)' }}>
                {row.isCash ? formatRand(row.val) : row.val}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginTop: 60, borderTop: '1px solid #141c1a', paddingTop: 40 }}>
           <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--teal)', fontFamily: 'Playfair Display' }}>81%</div>
              <div style={{ fontSize: 10, color: 'var(--grey)', letterSpacing: '0.1em', marginTop: 8 }}>SHOW-UP RATE</div>
           </div>
           <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--teal)', fontFamily: 'Playfair Display' }}>{profileConv}%</div>
              <div style={{ fontSize: 10, color: 'var(--grey)', letterSpacing: '0.1em', marginTop: 8 }}>PROFILE CONVERSION</div>
           </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
        
        {/* IMPLEMENTATION STATUS */}
        <div className="card">
          <div className="section-label">Implementation Status</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
            {['Asset Creation', 'Funnel Installation', 'Lead Scraping', 'Outreach Launch'].map((step, i) => (
              <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: i < 3 ? 1 : 0.4 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: i < 3 ? 'var(--teal)' : 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={12} color={i < 3 ? 'var(--bg)' : 'var(--grey2)'} />
                </div>
                <span style={{ fontSize: 14 }}>{step}</span>
                {i === 2 && <span style={{ fontSize: 9, background: 'rgba(0, 255, 194, 0.1)', color: 'var(--teal)', padding: '2px 8px', borderRadius: 10 }}>ACTIVE</span>}
              </div>
            ))}
          </div>
        </div>

        {/* ACCOUNT MANAGER & FEEDBACK */}
        <div className="card">
          <div className="section-label">Your Account Manager</div>
          {manager ? (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--bg3)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--teal)' }}>
                  {manager.full_name?.charAt(0) || 'M'}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{manager.full_name || 'Assigned Manager'}</div>
                  <div style={{ fontSize: 10, color: 'var(--grey)', textTransform: 'uppercase' }}>Delivery Specialist</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
                <a href={`tel:${manager.phone || ''}`} className="btn-secondary" style={{ display: 'flex', justifyContent: 'center', gap: 8, fontSize: 12, textDecoration: 'none', color: 'inherit', padding: '10px 0', border: '1px solid var(--border2)', borderRadius: 6 }}>
                  <Phone size={14} /> Call
                </a>
                <a href={`https://wa.me/${manager.phone || ''}`} target="_blank" rel="noreferrer" className="btn-secondary" style={{ display: 'flex', justifyContent: 'center', gap: 8, fontSize: 12, textDecoration: 'none', color: 'inherit', padding: '10px 0', border: '1px solid var(--border2)', borderRadius: 6 }}>
                  <MessageCircle size={14} /> WhatsApp
                </a>
              </div>

              <div style={{ borderTop: '1px solid var(--border2)', paddingTop: 20 }}>
                <div style={{ fontSize: 11, color: 'var(--grey)', marginBottom: 12 }}>REVIEW YOUR EXPERIENCE</div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                  {[1,2,3,4,5].map(s => (
                    <Star 
                      key={s} 
                      size={18} 
                      fill={s <= review.rating ? 'var(--teal)' : 'none'} 
                      stroke={s <= review.rating ? 'var(--teal)' : 'var(--grey2)'} 
                      style={{ cursor: 'pointer' }}
                      onClick={() => setReview({...review, rating: s})}
                    />
                  ))}
                </div>
                <textarea 
                  className="input"
                  placeholder="Feedback on today's execution..."
                  value={review.comment}
                  onChange={e => setReview({...review, comment: e.target.value})}
                  style={{ fontSize: 12, minHeight: 80, marginBottom: 10, width: '100%', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 6, padding: 8, color: 'white', outline: 'none' }}
                />
                <button 
                  onClick={submitReview} 
                  disabled={submitting}
                  className="btn-primary" 
                  style={{ width: '100%', fontSize: 12, opacity: submitting ? 0.5 : 1, padding: '12px 0', background: 'var(--teal)', color: 'var(--bg)', border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}
                >
                  {submitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--grey)', fontSize: 12, padding: '20px 0', fontFamily: 'DM Mono' }}>ASSIGNING MANAGER...</div>
          )}
        </div>
      </div>
    </div>
  )
}