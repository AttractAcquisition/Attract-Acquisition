import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ToastProvider } from './lib/toast'
import { useAuth } from './lib/auth'

import Layout       from './components/Layout'
import Login        from './pages/Login'
import Portal       from './pages/Portal'
import Dashboard    from './pages/Dashboard'
import Tracker      from './pages/Tracker'
import Prospects    from './pages/Prospects'
import Finance      from './pages/Finance'
import Outreach     from './pages/Outreach'
import Sprints      from './pages/Sprints'
import SprintDetail from './pages/SprintDetail'
import Templates    from './pages/Templates'
import Capital      from './pages/Capital'
import Sops         from './pages/Sops'
import SettingsPage from './pages/Settings'
import Studio       from './pages/Studio'
import Clients      from './pages/Clients'
import Scraper      from './pages/Scraper'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading, role } = useAuth()
  const location = useLocation()

  if (loading) return null
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />

  // Client users must stay on portal
  if (role === 'client' && location.pathname !== '/portal') return <Navigate to="/portal" replace />

  // Admin/operator must not access portal route
  if (role !== 'client' && location.pathname === '/portal') return <Navigate to="/dashboard" replace />

  return <>{children}</>
}

function RootRedirect() {
  const { role, loading } = useAuth()
  if (loading) return null
  if (role === 'client') return <Navigate to="/portal" replace />
  return <Navigate to="/dashboard" replace />
}

export default function AppRoutes() {
  const { session } = useAuth()

  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={session ? <RootRedirect /> : <Login />} />

          {/* Client portal — no sidebar */}
          <Route path="/portal" element={<RequireAuth><Portal /></RequireAuth>} />

          {/* Admin + Operator — with sidebar */}
          <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
            <Route index element={<RootRedirect />} />
            <Route path="dashboard"   element={<Dashboard />} />
            <Route path="tracker"     element={<Tracker />} />
            <Route path="prospects"   element={<Prospects />} />
            <Route path="scraper"     element={<Scraper />} />
            <Route path="outreach"    element={<Outreach />} />
            <Route path="clients"     element={<Clients />} />
            <Route path="sprints"     element={<Sprints />} />
            <Route path="sprints/:id" element={<SprintDetail />} />
            <Route path="studio"      element={<Studio />} />
            <Route path="sops"        element={<Sops />} />
            <Route path="templates"   element={<Templates />} />
            <Route path="finance"     element={<Finance />} />
            <Route path="capital"     element={<Capital />} />
            <Route path="settings"    element={<SettingsPage />} />
          </Route>
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  )
}
