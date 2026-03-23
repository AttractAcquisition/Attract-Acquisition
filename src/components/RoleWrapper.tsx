import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../lib/auth'

interface RoleWrapperProps {
  allowedRoles: string[]
  children: ReactNode
}

export default function RoleWrapper({ allowedRoles, children }: RoleWrapperProps) {
  const { role, loading } = useAuth()

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
            Verifying access...
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
