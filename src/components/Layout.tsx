import { NavLink, useLocation, Outlet } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard, CalendarCheck, Users, MessageSquare, Briefcase,
  Zap, FileText, BookOpen, FileCode, BarChart3, Wallet,
  Settings, Menu, X, Plus, Search, Shield
} from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'
import { supabase } from '../lib/supabase'

const ADMIN_OPERATOR_NAV = [
  {
    section: 'Overview',
    items: [
      { label: 'Dashboard',         path: '/dashboard', icon: LayoutDashboard, roles: ['admin','operator'] },
      { label: 'Execution Tracker', path: '/tracker',   icon: CalendarCheck,   roles: ['admin','operator'] },
    ],
  },
  {
    section: 'Pipeline',
    items: [
      { label: 'Prospects',  path: '/prospects', icon: Users,         roles: ['admin','operator'] },
      { label: 'Scraper',    path: '/scraper',   icon: Search,        roles: ['admin'] },
      { label: 'Outreach',   path: '/outreach',  icon: MessageSquare, roles: ['admin','operator'] },
      { label: 'Clients',    path: '/clients',   icon: Briefcase,     roles: ['admin','operator'] },
    ],
  },
  {
    section: 'Delivery',
    items: [
      { label: 'Proof Sprints', path: '/sprints', icon: Zap,      roles: ['admin','operator'] },
      { label: 'MJR Studio',   path: '/studio',  icon: FileText,  roles: ['admin','operator'] },
    ],
  },
  {
    section: 'Build',
    items: [
      { label: 'SOP Library', path: '/sops',      icon: BookOpen,  roles: ['admin','operator'] },
      { label: 'Templates',   path: '/templates', icon: FileCode,  roles: ['admin','operator'] },
    ],
  },
  {
    section: 'Finance',
    items: [
      { label: 'MRR Dashboard',   path: '/finance', icon: BarChart3, roles: ['admin'] },
      { label: 'Trust & Capital', path: '/capital', icon: Wallet,    roles: ['admin'] },
    ],
  },
  {
  section: 'System',
  items: [
    { label: 'Command Center', path: '/admin', icon: Shield, roles: ['admin'] }
  ]
  },
  {
    section: 'Settings',
    items: [
      { label: 'Settings', path: '/settings', icon: Settings, roles: ['admin'] },
    ],
  },
]

const CLIENT_NAV = [
  {
    section: 'Overview',
    items: [
      { label: 'Dashboard',         path: '/dashboard', icon: LayoutDashboard },
      { label: 'Execution Tracker', path: '/tracker',   icon: CalendarCheck   },
    ],
  },
  {
    section: 'My Project',
    items: [
      { label: 'Proof Sprints', path: '/sprints', icon: Zap      },
      { label: 'SOP Library',  path: '/sops',    icon: BookOpen  },
    ],
  },
]

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/tracker':   'Execution Tracker',
  '/prospects': 'Prospects',
  '/scraper':   'Scraper',
  '/outreach':  'Outreach',
  '/clients':   'Clients',
  '/sprints':   'Proof Sprints',
  '/studio':    'MJR Studio',
  '/sops':      'SOP Library',
  '/templates': 'Templates',
  '/finance':   'MRR Dashboard',
  '/capital':   'Trust & Capital',
  '/settings':  'Settings',
}

const VERTICALS = [
  'Auto Detailing','Vehicle Wrapping','Car Wash','Pet Grooming','Pet Salon',
  'Trailer Manufacturing','Metal Fabrication','Engineering Shop',
  'Home Renovation','Landscaping','Plumbing','Electrical','HVAC',
  'Courier','Logistics','Physiotherapy','Wellness Studio',
  'Dental Clinic','Personal Training','Industrial','Other'
]

export default function Layout() {
  const [open, setOpen] = useState(false)
  const { role }        = useAuth()
  const location        = useLocation()

  const basePath = '/' + location.pathname.split('/')[1]
  const title    = location.pathname.startsWith('/sprints/') && location.pathname !== '/sprints'
    ? 'Sprint Detail'
    : PAGE_TITLES[basePath] || 'AA OS'

  const isClient = role === 'client'

  const navGroups = isClient
    ? CLIENT_NAV
    : ADMIN_OPERATOR_NAV
        .map(group => ({
          ...group,
          items: group.items.filter(item => item.roles.includes(role || '')),
        }))
        .filter(group => group.items.length > 0)

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {open && (
        <div onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }} />
      )}

      <aside style={{
        width: 240, flexShrink: 0, background: 'var(--bg2)',
        borderRight: '1px solid var(--border2)', display: 'flex',
        flexDirection: 'column', height: '100vh', overflowY: 'auto',
        position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 50,
        transition: 'transform 0.2s',
      }}>

        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border2)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, background: 'var(--teal)', borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'DM Mono', fontWeight: 500, fontSize: 13, color: 'var(--bg)',
            flexShrink: 0,
          }}>AA</div>
          <div>
            <div style={{ fontFamily: 'DM Mono', fontSize: 11, letterSpacing: '0.08em', color: 'var(--white)', lineHeight: 1.2 }}>Attract</div>
            <div style={{ fontFamily: 'DM Mono', fontSize: 11, letterSpacing: '0.08em', color: 'var(--grey)', lineHeight: 1.2 }}>
              {isClient ? 'Client Portal' : 'Acquisition'}
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '12px 0' }}>
          {navGroups.map(group => (
            <div key={group.section} style={{ marginBottom: 4 }}>
              <div style={{
                fontFamily: 'DM Mono', fontSize: 9, letterSpacing: '0.2em',
                textTransform: 'uppercase', color: 'var(--grey2)',
                padding: '10px 16px 4px',
              }}>{group.section}</div>
              {group.items.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setOpen(false)}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 16px', textDecoration: 'none',
                    fontFamily: 'Barlow', fontSize: 13,
                    color: isActive ? 'var(--teal)' : 'var(--grey)',
                    background: isActive ? 'var(--teal-faint)' : 'transparent',
                    borderLeft: isActive ? '2px solid var(--teal)' : '2px solid transparent',
                    transition: 'all 0.15s',
                  })}
                >
                  <item.icon size={14} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border2)' }}>
          <div style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--grey2)', letterSpacing: '0.08em', marginBottom: 8 }}>
            AA OS v1.0 · Mar 2026
          </div>
          <SignOutButton />
        </div>
      </aside>

      <div style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

        <header style={{
          height: 56, background: 'var(--bg2)', borderBottom: '1px solid var(--border2)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setOpen(o => !o)}
              style={{ background: 'none', border: 'none', color: 'var(--grey)', cursor: 'pointer' }}>
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
            <span style={{ fontFamily: 'Playfair Display', fontSize: 18, fontWeight: 700 }}>{title}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {!isClient && <QuickAddButton />}
            <div style={{
              width: 32, height: 32, background: 'var(--teal)', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'DM Mono', fontSize: 12, color: 'var(--bg)', fontWeight: 500,
            }}>AA</div>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: '28px 28px' }} className="page-fade">
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
        style={{ width: '100%', background: 'none', border: '1px solid var(--border2)', borderRadius: 4, padding: '7px 10px', cursor: 'pointer', fontFamily: 'DM Mono', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--grey)', textAlign: 'left', transition: 'color 0.15s, border-color 0.15s' }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--red)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(226,75,74,0.3)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--grey)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border2)' }}>
        Sign Out
      </button>
    </div>
  )
}

function QuickAddButton() {
  const [open, setOpen]   = useState(false)
  const [type, setType]   = useState<'prospect' | 'client' | 'sprint' | null>(null)
  const { toast }         = useToast()
  const { role, metadata_id } = useAuth()

  const options = [
    { key: 'prospect' as const, label: 'Add Prospect', sub: 'New lead to score and outreach' },
    { key: 'client'   as const, label: 'Add Client',   sub: 'New retainer account' },
    { key: 'sprint'   as const, label: 'New Sprint',   sub: '14-day proof campaign' },
  ]

  async function saveProspect(form: any) {
    const insertData: any = { ...form, status: 'new', city: 'Cape Town' }
    if (role === 'operator' && metadata_id) {
      insertData.assigned_to = metadata_id
    }
    const { error } = await supabase.from('prospects').insert(insertData)
    if (error) { toast('Failed to save prospect', 'error'); return }
    toast('Prospect added ✓')
    setOpen(false); setType(null)
    window.location.href = '/prospects'
  }

  async function saveClient(form: any) {
    const insertData: any = { ...form, status: 'active' }
    if (role === 'operator' && metadata_id) {
      insertData.account_manager = metadata_id
    }
    const { error } = await supabase.from('clients').insert(insertData)
    if (error) { toast('Failed to save client', 'error'); return }
    toast('Client added ✓')
    setOpen(false); setType(null)
    window.location.href = '/clients'
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
    window.location.href = '/sprints'
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
                      style={{ padding: '14px 16px', cursor: 'pointer', borderRadius: 6, border: '1px solid var(--border2)', background: 'var(--bg3)', transition: 'border-color 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--teal)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border2)')}>
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
        { f: 'owner_name',    l: 'Owner Name',       p: 'e.g. John Smith' },
        { f: 'suburb',        l: 'Suburb',            p: 'e.g. Woodstock' },
        { f: 'phone',         l: 'Phone',             p: '+27 82 000 0000' },
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
        { f: 'owner_name',    l: 'Owner Name *',     p: '' },
        { f: 'whatsapp',      l: 'WhatsApp',          p: '+27 82 000 0000' },
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
            setup_fee:        e.target.value === 'proof_brand' ? 18000 : 25000,
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
        { f: 'vertical',    l: 'Vertical',       p: 'e.g. Auto Detailing' },
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
