import { useAuth } from '../lib/auth'
import type { ReactNode } from 'react'
import { ShieldAlert, Home } from 'lucide-react'

interface RoleWrapperProps {
  allowedRoles: string[]
  children: ReactNode
}

export default function RoleWrapper({ allowedRoles, children }: RoleWrapperProps) {
  const { role, loading } = useAuth()

  // 1. LOADING STATE
  // While we fetch the session from Supabase
  if (loading) {
    return (
      <div style={{
        minHeight: '60vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 36, height: 36, border: '2px solid var(--border2)',
            borderTop: '2px solid var(--teal)', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--grey)', letterSpacing: '0.08em' }}>
            VERIFYING ENCRYPTED ACCESS...
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // 2. PERMISSION CHECK
  // We use a manual UI return here instead of <Navigate /> to stop infinite redirect loops.
  const hasAccess = role && allowedRoles.includes(role);

  if (!hasAccess) {
    return (
      <div style={{
        height: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        padding: '0 40px',
        textAlign: 'center'
      }}>
        <div style={{ 
          background: 'rgba(255, 170, 0, 0.05)', 
          padding: '40px 30px', 
          borderRadius: 16, 
          border: '1px solid rgba(255, 170, 0, 0.2)',
          maxWidth: 440,
          width: '100%'
        }}>
          <ShieldAlert size={44} color="var(--amber)" style={{ marginBottom: 20 }} />
          
          <h2 style={{ 
            fontFamily: 'Playfair Display', 
            fontSize: 26, 
            margin: '0 0 12px 0', 
            color: 'white',
            fontWeight: 700 
          }}>
            Access Restricted
          </h2>
          
          <p style={{ 
            fontSize: 14, 
            color: 'var(--grey)', 
            lineHeight: 1.6, 
            margin: '0 0 24px 0' 
          }}>
            Your current role <span style={{ color: 'var(--teal)', fontWeight: 600 }}>"{role || 'Guest'}"</span> does not have the required permissions to view this sector.
          </p>

          <div style={{ 
            fontFamily: 'DM Mono', 
            fontSize: 9, 
            background: 'rgba(0,0,0,0.3)', 
            padding: '10px 14px', 
            borderRadius: 6, 
            color: 'var(--grey2)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            border: '1px solid var(--border2)'
          }}>
            Required Roles: {allowedRoles.length > 0 ? allowedRoles.join(', ') : 'SYSTEM_ADMIN'}
          </div>
        </div>

        <a href="/#/dashboard" style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 11, 
          color: 'var(--teal)', 
          textDecoration: 'none', 
          border: '1px solid var(--teal)', 
          padding: '12px 24px', 
          borderRadius: 6,
          fontFamily: 'DM Mono',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          transition: 'all 0.2s',
          background: 'transparent'
        }}>
          <Home size={14} /> Return to Command Center
        </a>
      </div>
    );
  }

  // 3. ACCESS GRANTED
  return <>{children}</>
}
