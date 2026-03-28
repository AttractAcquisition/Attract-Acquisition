import { NavLink, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { useState, useMemo } from 'react'
import { Menu, X, Plus, BrainIcon } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'
import { supabase } from '../lib/supabase'
import { ROUTE_CONFIG } from '../lib/route-config'

export default function Layout() {
  const [open, setOpen] = useState(false)
  const { role, user } = useAuth()
  const location = useLocation()
  const isClient = role === 'client'

  // Automatically Group Navigation based on ROUTE_CONFIG
  const navGroups = useMemo(() => {
    if (isClient) return [{
      section: 'Overview',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: ROUTE_CONFIG.dashboard.icon },
        { label: 'Execution Tracker', path: '/delivery-tracker', icon: ROUTE_CONFIG['delivery-tracker'].icon }
      ]
    }];

    const groups: Record<string, any[]> = {};
    
    Object.entries(ROUTE_CONFIG).forEach(([path, config]) => {
      if (!config.roles || config.roles.includes(role || '')) {
        if (!groups[config.section]) groups[config.section] = [];
        groups[config.section].push({ ...config, path: `/${path}` });
      }
    });

    return Object.entries(groups).map(([section, items]) => ({ section, items }));
  }, [role, isClient]);

  const currentTitle = useMemo(() => {
    const path = location.pathname.split('/')[1];
    return ROUTE_CONFIG[path]?.label || 'AA OS';
  }, [location]);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
      {/* Mobile Overlay */}
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
// ... [Keep your existing SignOutButton and QuickAddButton code here]
