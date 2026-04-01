import { NavLink, useLocation, Outlet, useNavigate } from 'react-router-dom'
import { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'
import { supabase } from '../lib/supabase'
import { ROUTE_CONFIG } from '../lib/route-config'

const VERTICALS = [
  'Auto Detailing', 'Vehicle Wrapping', 'Car Wash', 'Pet Grooming', 'Pet Salon',
  'Trailer Manufacturing', 'Metal Fabrication', 'Engineering Shop',
  'Home Renovation', 'Landscaping', 'Plumbing', 'Electrical', 'HVAC',
  'Courier', 'Logistics', 'Physiotherapy', 'Wellness Studio',
  'Dental Clinic', 'Personal Training', 'Industrial', 'Other'
];

export default function Layout() {
  const [open, setOpen] = useState(false)
  const { role } = useAuth()
  const location = useLocation()
  const isClient = role === 'client'

 const navGroups = useMemo(() => {
    if (isClient) return [{
      section: 'Overview',
      items: [
        { label: 'Live Pipeline', path: '/dashboard', icon: ROUTE_CONFIG.dashboard.icon },
        { label: 'Execution Tracker', path: '/tracker', icon: ROUTE_CONFIG.tracker.icon }
      ]
    }];

    const groups: Record<string, any[]> = {};

    Object.entries(ROUTE_CONFIG).forEach(([path, config]) => {
      // Skip hidden utility routes and entries the current role can't access
      if (config.hidden) return;
      if (!config.roles || !config.roles.includes(role || '')) return;
      if (!groups[config.section]) groups[config.section] = [];
      groups[config.section].push({ ...config, path: `/${path}` });
    });

    return Object.entries(groups).map(([section, items]) => ({ section, items }));
  }, [role, isClient]);
  
  const currentTitle = useMemo(() => {
    const path = location.pathname.split('/')[1];
    if (isClient) {
      if (path === 'dashboard') return 'Dashboard'
      if (path === 'tracker') return 'Execution Tracker'
    }
    return ROUTE_CONFIG[path]?.label || 'AA OS';
  }, [location, isClient]);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
      {open && <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }} />}

      <aside style={{
        width: 240, flexShrink: 0, background: 'var(--bg2)', borderRight: '1px solid var(--border2)',
        display: 'flex', flexDirection: 'column', height: '100vh', position: 'fixed', zIndex: 50
      }}>
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border2)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: 'var(--teal)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Mono', color: 'var(--bg)' }}>AA</div>
          <div>
            <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--white)' }}>Attract</div>
            <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--grey)' }}>{isClient ? 'Client Portal' : 'Acquisition'}</div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          {navGroups.map(group => (
            <div key={group.section} style={{ marginBottom: 4 }}>
              <div style={{ fontFamily: 'DM Mono', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--grey2)', padding: '10px 16px 4px' }}>{group.section}</div>
              {group.items.map(item => (
                <NavLink key={item.path} to={item.path} onClick={() => setOpen(false)}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', textDecoration: 'none', fontFamily: 'Barlow', fontSize: 13,
                    color: isActive ? 'var(--teal)' : 'var(--grey)', background: isActive ? 'var(--teal-faint)' : 'transparent',
                    borderLeft: isActive ? '2px solid var(--teal)' : '2px solid transparent'
                  })}>
                  <item.icon size={14} /> {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border2)' }}>
           <SignOutButton />
        </div>
      </aside>

      <div style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <header style={{ height: 56, background: 'var(--bg2)', borderBottom: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: 'Playfair Display', fontSize: 18, fontWeight: 700 }}>{currentTitle}</span>
          </div>
          {!isClient && <QuickAddButton />}
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function SignOutButton() {
  const { signOut, user } = useAuth()
  return (
    <div>
      {user?.email && (
        <div style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--grey2)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user.email}
        </div>
      )}
      <button onClick={signOut}
        style={{ width: '100%', background: 'none', border: '1px solid var(--border2)', borderRadius: 4, padding: '7px 10px', cursor: 'pointer', fontFamily: 'DM Mono', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--grey)', textAlign: 'left', transition: 'all 0.15s' }}>
        Sign Out
      </button>
    </div>
  )
}

function QuickAddButton() {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<'prospect' | 'client' | 'sprint' | null>(null)
  const { toast } = useToast()
  const { role, metadata_id } = useAuth()
  const navigate = useNavigate()

  const options = [
    { key: 'prospect' as const, label: 'Add Prospect', sub: 'New lead to score and outreach' },
    { key: 'client' as const, label: 'Add Client', sub: 'New retainer account' },
    { key: 'sprint' as const, label: 'New Sprint', sub: '14-day proof campaign' },
  ]

  async function saveProspect(form: any) {
    const insertData: any = { ...form, status: 'new', city: 'Cape Town' }
    if (role === 'distribution' && metadata_id) {
      insertData.assigned_to = metadata_id
    }
    const { error } = await supabase.from('prospects').insert(insertData)
    if (error) { toast('Failed to save prospect', 'error'); return }
    toast('Prospect added ✓')
    setOpen(false); setType(null)
    navigate('/prospects')
  }

  async function saveClient(form: any) {
    const insertData: any = { ...form, status: 'active' }
    if (role === 'delivery' && metadata_id) {
      insertData.account_manager = metadata_id
    }
    const { error } = await supabase.from('clients').insert(insertData)
    if (error) { toast('Failed to save client', 'error'); return }
    toast('Client added ✓')
    setOpen(false); setType(null)
    navigate('/clients')
  }

  async function saveSprint(form: any) {
    const insertData: any = { ...form, status: 'setup', sprint_number: 1 }
    if (role === 'client' && metadata_id) {
      insertData.client_id = metadata_id
    }
    const { error } = await supabase.from('proof_sprints').insert(insertData)
    if (error) { toast('Failed to create sprint', 'error'); return }
    toast('Sprint created ✓')
    setOpen(false); setType(null)
    navigate('/sprints')
  }

  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
        <Plus size={12} /> Quick Add
      </button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => { setOpen(false); setType(null) }}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)' }} />
          <div style={{ position: 'relative', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 10, padding: 28, width: 460, zIndex: 1, maxHeight: '90vh', overflowY: 'auto' }}>

            {!type && (
              <>
                <div style={{ fontFamily: 'Playfair Display', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Quick Add</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {options.map(o => (
                    <div key={o.key} onClick={() => setType(o.key)}
                      style={{ padding: '14px 16px', cursor: 'pointer', borderRadius: 6, border: '1px solid var(--border2)', background: 'var(--bg3)', transition: 'border-color 0.15s' }}>
                      <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 2 }}>{o.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--grey)' }}>{o.sub}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {type === 'prospect' && (
              <>
                <div style={{ fontFamily: 'Playfair Display', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Add Prospect</div>
                <QuickProspectForm onSave={saveProspect} onBack={() => setType(null)} />
              </>
            )}

            {type === 'client' && (
              <>
                <div style={{ fontFamily: 'Playfair Display', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Add Client</div>
                <QuickClientForm onSave={saveClient} onBack={() => setType(null)} />
              </>
            )}

            {type === 'sprint' && (
              <>
                <div style={{ fontFamily: 'Playfair Display', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>New Sprint</div>
                <QuickSprintForm onSave={saveSprint} onBack={() => setType(null)} />
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function QuickProspectForm({ onSave, onBack }: { onSave: (f: any) => void; onBack: () => void }) {
  const [form, setForm] = useState({ business_name: '', owner_name: '', vertical: '', suburb: '', phone: '' })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[
        { f: 'business_name', l: 'Business Name *', p: 'e.g. Cape Town Auto Detailing' },
        { f: 'owner_name', l: 'Owner Name', p: 'e.g. John Smith' },
        { f: 'suburb', l: 'Suburb', p: 'e.g. Woodstock' },
        { f: 'phone', l: 'Phone', p: '+27 82 000 0000' },
      ].map(x => (
        <div key={x.f}>
          <div className="label">{x.l}</div>
          <input className="input" placeholder={x.p} value={(form as any)[x.f]}
            onChange={e => setForm(p => ({ ...p, [x.f]: e.target.value }))} />
        </div>
      ))}
      <div>
        <div className="label">Vertical</div>
        <select className="input" value={form.vertical} onChange={e => setForm(p => ({ ...p, vertical: e.target.value }))}>
          <option value="">Select vertical</option>
          {VERTICALS.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        <button className="btn-primary" onClick={() => onSave(form)} disabled={!form.business_name} style={{ flex: 1 }}>Save →</button>
        <button className="btn-ghost" onClick={onBack} style={{ flex: 1 }}>Back</button>
      </div>
    </div>
  )
}

function QuickClientForm({ onSave, onBack }: { onSave: (f: any) => void; onBack: () => void }) {
  const [form, setForm] = useState({
    business_name: '', owner_name: '', whatsapp: '',
    tier: 'proof_brand', setup_fee: 18000, monthly_retainer: 10000,
    contract_start_date: new Date().toISOString().split('T')[0],
  })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[
        { f: 'business_name', l: 'Business Name *', p: '' },
        { f: 'owner_name', l: 'Owner Name *', p: '' },
        { f: 'whatsapp', l: 'WhatsApp', p: '+27 82 000 0000' },
      ].map(x => (
        <div key={x.f}>
          <div className="label">{x.l}</div>
          <input className="input" placeholder={x.p} value={(form as any)[x.f]}
            onChange={e => setForm(p => ({ ...p, [x.f]: e.target.value }))} />
        </div>
      ))}
      <div>
        <div className="label">Tier</div>
        <select className="input" value={form.tier}
          onChange={e => setForm(p => ({
            ...p, tier: e.target.value,
            setup_fee: e.target.value === 'proof_brand' ? 18000 : 25000,
            monthly_retainer: e.target.value === 'proof_brand' ? 10000 : 17000,
          }))}>
          <option value="proof_brand">Proof Brand — R18k + R10k/mo</option>
          <option value="authority_brand">Authority Brand — R25k + R17k/mo</option>
        </select>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        <button className="btn-primary" onClick={() => onSave(form)} disabled={!form.business_name || !form.owner_name} style={{ flex: 1 }}>Save →</button>
        <button className="btn-ghost" onClick={onBack} style={{ flex: 1 }}>Back</button>
      </div>
    </div>
  )
}

function QuickSprintForm({ onSave, onBack }: { onSave: (f: any) => void; onBack: () => void }) {
  const [form, setForm] = useState({
    client_name: '', vertical: '',
    start_date: new Date().toISOString().split('T')[0],
    client_ad_budget: 1500,
  })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[
        { f: 'client_name', l: 'Client Name *', p: 'e.g. Cape Town Auto Detailing' },
        { f: 'vertical', l: 'Vertical', p: 'e.g. Auto Detailing' },
      ].map(x => (
        <div key={x.f}>
          <div className="label">{x.l}</div>
          <input className="input" placeholder={x.p} value={(form as any)[x.f]}
            onChange={e => setForm(p => ({ ...p, [x.f]: e.target.value }))} />
        </div>
      ))}
      <div>
        <div className="label">Start Date</div>
        <input className="input" type="date" value={form.start_date}
          onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} />
      </div>
      <div>
        <div className="label">Ad Budget (R)</div>
        <input className="input" type="number" value={form.client_ad_budget}
          onChange={e => setForm(p => ({ ...p, client_ad_budget: Number(e.target.value) }))} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        <button className="btn-primary" onClick={() => onSave(form)} disabled={!form.client_name} style={{ flex: 1 }}>Create Sprint →</button>
        <button className="btn-ghost" onClick={onBack} style={{ flex: 1 }}>Back</button>
      </div>
    </div>
  )
}
