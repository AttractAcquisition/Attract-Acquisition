import { useAuth } from '../lib/auth'
import type { ReactNode } from 'react'
import { AlertCircle, ShieldAlert, Home } from 'lucide-react'

interface RoleWrapperProps {
  allowedRoles: string[]
  children: ReactNode
}

export default function RoleWrapper({ allowedRoles, children }: RoleWrapperProps) {
  const { role, loading } = useAuth()

  // 1. LOADING STATE
  if (loading) {
    return (
      <div style={{
        minHeight: '60vh', display: 'flex', alignItems: 'center',
        justify-content: 'center',
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
          padding: 30, 
          borderRadius: 16, 
          border: '1px solid rgba(255, 170, 0, 0.2)',
          maxWidth: 400
        }}>
          <ShieldAlert size={40} color="var(--amber)" style={{ marginBottom: 16 }} />
          
          <h2 style={{ 
            fontFamily: 'Playfair Display', 
            fontSize: 24, 
            margin: '0 0 10px 0', 
            color: 'white' 
          }}>
            Access Restricted
          </h2>
          
          <p style={{ 
            fontSize: 13, 
            color: 'var(--grey)', 
            lineHeight: 1.6, 
            margin: '0 0 20px 0' 
          }}>
            Your current role <span style={{ color: 'var(--teal)', fontWeight: 600 }}>"{role || 'Guest'}"</span> does not have the required permissions to view this sector.
          </p>

          <div style={{ 
            fontFamily: 'DM Mono', 
            fontSize: 9, 
            background: 'var(--bg)', 
            padding: '8px 12px', 
            borderRadius: 4, 
            color: 'var(--grey2)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}>
            Required Roles: {allowedRoles.length > 0 ? allowedRoles.join(', ') : 'ADMIN_ONLY'}
          </div>
        </div>

        <a href="/#/dashboard" style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 11, 
          color: 'var(--teal)', 
          textDecoration: 'none', 
          border: '1px solid var(--teal)', 
          padding: '10px 20px', 
          borderRadius: 4,
          fontFamily: 'DM Mono',
          textTransform: 'uppercase',
          transition: 'all 0.2s'
        }}>
          <Home size={14} /> Return to Command Center
        </a>
      </div>
    );
  }

  // 3. ACCESS GRANTED
  return <>{children}</>
}
