import { NavLink, useLocation, Outlet } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard, CalendarCheck, Users, MessageSquare, Briefcase,
  Zap, Monitor, FileText, BookOpen, FileCode, BarChart3, Wallet,
  Settings, Menu, X, Plus
} from 'lucide-react'

const NAV = [
  { section: 'Overview', items: [
    { label: 'Dashboard',         path: '/dashboard', icon: LayoutDashboard },
    { label: 'Execution Tracker', path: '/tracker',   icon: CalendarCheck },
  ]},
  { section: 'Pipeline', items: [
    { label: 'Prospects', path: '/prospects', icon: Users },
    { label: 'Outreach',  path: '/outreach',  icon: MessageSquare },
    { label: 'Clients',   path: '/clients',   icon: Briefcase },
  ]},
  { section: 'Delivery', items: [
    { label: 'Proof Sprints', path: '/sprints', icon: Zap },
    { label: 'AA Portal',     path: '/portal',  icon: Monitor },
  ]},
  { section: 'Build', items: [
    { label: 'MJR Studio',  path: '/studio',    icon: FileText },
    { label: 'SOP Library', path: '/sops',      icon: BookOpen },
    { label: 'Templates',   path: '/templates', icon: FileCode },
  ]},
  { section: 'Finance', items: [
    { label: 'MRR Dashboard',   path: '/finance', icon: BarChart3 },
    { label: 'Trust & Capital', path: '/capital', icon: Wallet },
  ]},
  { section: 'Settings', items: [
    { label: 'Settings', path: '/settings', icon: Settings },
  ]},
]

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard', '/tracker': 'Execution Tracker',
  '/prospects': 'Prospects', '/outreach': 'Outreach', '/clients': 'Clients',
  '/sprints': 'Proof Sprints', '/portal': 'AA Portal', '/studio': 'MJR Studio',
  '/sops': 'SOP Library', '/templates': 'Templates', '/finance': 'MRR Dashboard',
  '/capital': 'Trust & Capital', '/settings': 'Settings',
}

export default function Layout() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] || 'AA OS'

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
      }}>
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border2)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, background: 'var(--teal)', borderRadius: 3,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'DM Mono', fontWeight: 500, fontSize: 13, color: 'var(--bg)',
          }}>AA</div>
          <div>
            <div style={{ fontFamily: 'DM Mono', fontSize: 11, letterSpacing: '0.08em', color: 'var(--white)', lineHeight: 1.2 }}>Attract</div>
            <div style={{ fontFamily: 'DM Mono', fontSize: 11, letterSpacing: '0.08em', color: 'var(--grey)', lineHeight: 1.2 }}>Acquisition</div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '12px 0' }}>
          {NAV.map(group => (
            <div key={group.section} style={{ marginBottom: 4 }}>
              <div style={{
                fontFamily: 'DM Mono', fontSize: 9, letterSpacing: '0.2em',
                textTransform: 'uppercase', color: 'var(--grey2)',
                padding: '10px 16px 4px',
              }}>{group.section}</div>
              {group.items.map(item => (
                <NavLink key={item.path} to={item.path}
                  onClick={() => setOpen(false)}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 16px', textDecoration: 'none',
                    fontFamily: 'Barlow', fontSize: 13, fontWeight: 400,
                    color: isActive ? 'var(--teal)' : 'var(--grey)',
                    background: isActive ? 'var(--teal-faint)' : 'transparent',
                    borderLeft: isActive ? '2px solid var(--teal)' : '2px solid transparent',
                    transition: 'all 0.15s',
                  })}>
                  <item.icon size={14} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border2)' }}>
          <div style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--grey2)', letterSpacing: '0.08em' }}>
            AA OS v1.0 · Mar 2026
          </div>
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
            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
              <Plus size={12} /> Quick Add
            </button>
            <div style={{
              width: 32, height: 32, background: 'var(--teal)', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'DM Mono', fontSize: 12, color: 'var(--bg)', fontWeight: 500,
            }}>AA</div>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: '28px' }} className="page-fade">
          <Outlet />
        </main>
      </div>
    </div>
  )
}