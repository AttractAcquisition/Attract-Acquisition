import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ToastProvider } from './lib/toast'
import { AuthProvider, useAuth } from './lib/auth'
import Layout       from './components/Layout'
import RoleWrapper  from './components/RoleWrapper'

// Pages
import Login        from './pages/Login'
import Portal       from './pages/Portal'
import Dashboard    from './pages/Dashboard'
import Tracker      from './pages/Tracker'
import Prospects    from './pages/Prospects'
import Scraper      from './pages/Scraper'
import Outreach     from './pages/Outreach'
import Clients      from './pages/Clients'
import Sprints      from './pages/Sprints'
import SprintDetail from './pages/SprintDetail'
import Studio       from './pages/Studio'
import Sops         from './pages/Sops'
import Templates    from './pages/Templates'
import Finance      from './pages/Finance'
import Capital      from './pages/Capital'
import SettingsPage from './pages/Settings'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading, role } = useAuth()
  const location = useLocation()

  if (loading) return <div className="loading-screen">Loading...</div>
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />

  // Client Isolation: Clients only see /portal
  if (role === 'client' && location.pathname !== '/portal') {
    return <Navigate to="/portal" replace />
  }

  // Admin/Operator Isolation: They stay away from /portal
  if (role !== 'client' && location.pathname === '/portal') {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

function RootRedirect() {
  const { role, loading } = useAuth()
  if (loading) return null
  return role === 'client' ? <Navigate to="/portal" replace /> : <Navigate to="/dashboard" replace />
}

function AppRoutes() {
  const { session } = useAuth()

  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={session ? <RootRedirect /> : <Login />} />

      {/* Client Portal — Standalone (No Sidebar) */}
      <Route path="/portal" element={
        <RequireAuth>
          <Portal />
        </RequireAuth>
      } />

      {/* Internal OS — With Sidebar Layout */}
      <Route path="/" element={
        <RequireAuth>
          <Layout />
        </RequireAuth>
      }>
        <Route index element={<RootRedirect />} />
        
        {/* Shared Routes (Admin + Operator) */}
        <Route path="dashboard"   element={<Dashboard />} />
        <Route path="tracker"     element={<Tracker />} />
        <Route path="prospects"   element={<Prospects />} />
        <Route path="outreach"    element={<Outreach />} />
        <Route path="clients"     element={<Clients />} />
        <Route path="sprints"     element={<Sprints />} />
        <Route path="sprints/:id" element={<SprintDetail />} />
        <Route path="studio"      element={<Studio />} />
        <Route path="sops"        element={<Sops />} />
        <Route path="templates"   element={<Templates />} />

        {/* Admin ONLY Routes — Using RoleWrapper for Security */}
        <Route path="scraper" element={<RoleWrapper allowedRoles={['admin']}><Scraper /></RoleWrapper>} />
        <Route path="finance" element={<RoleWrapper allowedRoles={['admin']}><Finance /></RoleWrapper>} />
        <Route path="capital" element={<RoleWrapper allowedRoles={['admin']}><Capital /></RoleWrapper>} />
        <Route path="settings" element={<RoleWrapper allowedRoles={['admin']}><SettingsPage /></RoleWrapper>} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<RootRedirect />} />
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
