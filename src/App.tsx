import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ToastProvider } from './lib/toast'
import { AuthProvider, useAuth } from './lib/auth'
import RoleWrapper   from './components/RoleWrapper'
import Layout        from './components/Layout'
import Login         from './pages/Login'
import Portal        from './pages/Portal'
import Dashboard     from './pages/Dashboard'
import Tracker       from './pages/Tracker'
import Prospects     from './pages/Prospects'
import Finance       from './pages/Finance'
import Outreach      from './pages/Outreach'
import Sprints       from './pages/Sprints'
import SprintDetail  from './pages/SprintDetail'
import Templates     from './pages/Templates'
import Capital       from './pages/Capital'
import Sops          from './pages/Sops'
import SettingsPage  from './pages/Settings'
import Studio        from './pages/Studio'
import Clients       from './pages/Clients'
import Scraper       from './pages/Scraper'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--grey)', letterSpacing: '0.08em' }}>Loading...</div>
    </div>
  )

  if (!session) return <Navigate to="/login" state={{ from: location }} replace />

  return <>{children}</>
}

function RootRedirect() {
  const { role, loading } = useAuth()
  if (loading) return null
  return <Navigate to="/dashboard" replace />
}

function AppRoutes() {
  const { session, loading } = useAuth()

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--grey)' }}>Loading...</div>
    </div>
  )

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={session ? <RootRedirect /> : <Login />} />

      {/* Legacy portal – kept for backward compatibility, redirects to dashboard */}
      <Route path="/portal" element={
        <RequireAuth><Portal /></RequireAuth>
      } />

      {/* All authenticated users use Layout */}
      <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
        <Route index element={<RootRedirect />} />

        {/* Available to all roles */}
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="tracker"   element={<Tracker />} />
        <Route path="sprints"   element={<Sprints />} />
        <Route path="sprints/:id" element={<SprintDetail />} />
        <Route path="sops"      element={<Sops />} />

        {/* Admin + Operator only */}
        <Route path="prospects" element={
          <RoleWrapper allowedRoles={['admin','operator']}>
            <Prospects />
          </RoleWrapper>
        } />
        <Route path="outreach" element={
          <RoleWrapper allowedRoles={['admin','operator']}>
            <Outreach />
          </RoleWrapper>
        } />
        <Route path="clients" element={
          <RoleWrapper allowedRoles={['admin','operator','client']}>
            <Clients />
          </RoleWrapper>
        } />
        <Route path="studio" element={
          <RoleWrapper allowedRoles={['admin','operator']}>
            <Studio />
          </RoleWrapper>
        } />
        <Route path="templates" element={
          <RoleWrapper allowedRoles={['admin','operator']}>
            <Templates />
          </RoleWrapper>
        } />

        {/* Admin only */}
        <Route path="scraper" element={
          <RoleWrapper allowedRoles={['admin']}>
            <Scraper />
          </RoleWrapper>
        } />
        <Route path="finance" element={
          <RoleWrapper allowedRoles={['admin']}>
            <Finance />
          </RoleWrapper>
        } />
        <Route path="capital" element={
          <RoleWrapper allowedRoles={['admin']}>
            <Capital />
          </RoleWrapper>
        } />
        <Route path="settings" element={
          <RoleWrapper allowedRoles={['admin']}>
            <SettingsPage />
          </RoleWrapper>
        } />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
