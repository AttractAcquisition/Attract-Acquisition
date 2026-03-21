import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from './lib/toast'
import Layout      from './components/Layout'
import Dashboard   from './pages/Dashboard'
import Tracker     from './pages/Tracker'
import Prospects   from './pages/Prospects'
import Finance     from './pages/Finance'
import Outreach    from './pages/Outreach'
import Sprints     from './pages/Sprints'
import SprintDetail from './pages/SprintDetail'
import Templates   from './pages/Templates'
import Capital     from './pages/Capital'
import Sops        from './pages/Sops'
import SettingsPage from './pages/Settings'
import { Clients, Portal, Studio } from './pages/Stubs'

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"   element={<Dashboard />} />
            <Route path="tracker"     element={<Tracker />} />
            <Route path="prospects"   element={<Prospects />} />
            <Route path="outreach"    element={<Outreach />} />
            <Route path="clients"     element={<Clients />} />
            <Route path="sprints"     element={<Sprints />} />
            <Route path="sprints/:id" element={<SprintDetail />} />
            <Route path="portal"      element={<Portal />} />
            <Route path="studio"      element={<Studio />} />
            <Route path="sops"        element={<Sops />} />
            <Route path="templates"   element={<Templates />} />
            <Route path="finance"     element={<Finance />} />
            <Route path="capital"     element={<Capital />} />
            <Route path="settings"    element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}