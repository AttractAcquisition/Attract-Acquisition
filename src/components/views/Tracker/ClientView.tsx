import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../lib/auth'
import { formatDate } from '../../../lib/utils'

export default function ClientView() {
  const { metadata_id }    = useAuth()
  const [sprints, setSprints] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!metadata_id) return
    supabase.from('proof_sprints').select('*').eq('client_id', metadata_id).order('created_at', { ascending: false })
      .then(({ data }) => { setSprints(data || []); setLoading(false) })
  }, [metadata_id])

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', paddingBottom: 100 }}>
      <header style={{ marginBottom: 40 }}>
        <h1 style={{ fontFamily: 'Playfair Display', fontSize: 32, fontWeight: 700, marginBottom: 12, color: 'var(--white)' }}>
          Project Timeline
        </h1>
        <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Active Growth Cycles & Result Audits
        </div>
      </header>

      {loading ? <div className="skeleton" style={{ height: 300 }} /> : (
        <div style={{ display: 'grid', gap: 16 }}>
          {sprints.map((s, idx) => {
             const isActive = s.status === 'active'
             return (
               <div key={s.id} style={{
                 padding: '24px', borderRadius: 12, border: `1px solid ${isActive ? 'var(--teal)' : 'var(--border2)'}`,
                 background: isActive ? 'rgba(20, 26, 25, 0.4)' : 'var(--bg2)',
                 position: 'relative', overflow: 'hidden'
               }}>
                 {isActive && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: 'var(--teal)' }} />}
                 
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                   <div>
                     <div style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--teal)', textTransform: 'uppercase', marginBottom: 4 }}>Cycle {s.sprint_number || (sprints.length - idx)}</div>
                     <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--white)' }}>Launched {formatDate(s.start_date)}</div>
                   </div>
                   <div style={{ background: isActive ? 'var(--teal)' : 'var(--bg3)', color: isActive ? 'var(--bg)' : 'var(--grey)', fontSize: 9, fontFamily: 'DM Mono', padding: '4px 10px', borderRadius: 4, textTransform: 'uppercase' }}>
                     {s.status}
                   </div>
                 </div>

                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                    <div style={{ borderLeft: '1px solid var(--border2)', paddingLeft: 16 }}>
                      <div style={{ fontSize: 9, fontFamily: 'DM Mono', color: 'var(--grey)', textTransform: 'uppercase' }}>Leads</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--white)' }}>{s.leads_generated || 0}</div>
                    </div>
                    <div style={{ borderLeft: '1px solid var(--border2)', paddingLeft: 16 }}>
                      <div style={{ fontSize: 9, fontFamily: 'DM Mono', color: 'var(--grey)', textTransform: 'uppercase' }}>Cost / Lead</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--teal)' }}>R{s.cpl?.toFixed(0) || '—'}</div>
                    </div>
                    <div style={{ borderLeft: '1px solid var(--border2)', paddingLeft: 16 }}>
                      <div style={{ fontSize: 9, fontFamily: 'DM Mono', color: 'var(--grey)', textTransform: 'uppercase' }}>Bookings</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--white)' }}>{s.bookings_from_sprint || 0}</div>
                    </div>
                 </div>
               </div>
             )
          })}
        </div>
      )}
    </div>
  )
}