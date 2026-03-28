import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ToastProvider } from './lib/toast'
import { AuthProvider, useAuth } from './lib/auth'
import RoleWrapper   from './components/RoleWrapper'
import Layout        from './components/Layout'
import Login         from './pages/Login'
import Portal         from './pages/Portal'
import Dashboard     from './pages/Dashboard'
import Tracker       from './pages/Tracker'
import Prospects     from './pages/Prospects'
import CRM           from './pages/crm' 
import Finance       from './pages/Finance'
import IncomeTracking from './pages/IncomeTracking' 
import Outreach      from './pages/Outreach'
import Sprints       from './pages/Sprints'
import SprintDetail  from './pages/SprintDetail'
import Templates     from './pages/Templates'
import Sops          from './pages/Sops'
import Studio        from './pages/Studio'
import Clients       from './pages/Clients'
import Scraper       from './pages/Scraper'
import AdminControl from './pages/AdminControl'
import AuthorityBrand from './pages/AuthorityBrand'
import ProofBrand     from './pages/ProofBrand'
import DistributionDashboard from './components/views/Dashboard/DistributionDashboard'
import DeliveryDashboard from './components/views/Dashboard/DeliveryDashboard'
import DistributionTracker from './components/views/Tracker/DistributionTracker'
import DeliveryTracker from './components/views/Tracker/DeliveryTracker'
import Documents from './pages/Documents'
import Brain     from './pages/Brain'
import ChatPage  from './pages/ChatPage'
import MJRPdfGenerator from './pages/html'
import SPOA from './pages/SPOA'

function RequireAuth({ children }: { children: React.ReactNode }) {
  // Add 'role' here 
  const { session, loading, role } = useAuth() 
  const location = useLocation()

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--grey)', letterSpacing: '0.08em' }}>Loading...</div>
    </div>
  )

  if (!session) return <Navigate to="/login" state={{ from: location }} replace />
  
  // Now 'role' is defined and these checks will work
  if (role === 'client' && location.pathname !== '/portal') return <Navigate to="/portal" replace />
  if (role !== 'client' && location.pathname === '/portal') return <Navigate to="/dashboard" replace />

  return <>{children}</>
}

function RootRedirect() {
  const { role, loading } = useAuth()
  if (loading) return null
  if (role === 'distribution') return <Navigate to="/distribution" replace />
  if (role === 'delivery') return <Navigate to="/delivery-dash" replace />
  return <Navigate to="/dashboard" replace />
}

function AppRoutes() {
  const { loading } = useAuth()

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--grey)' }}>Loading...</div>
    </div>
  )

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/portal" element={<RequireAuth><Portal /></RequireAuth>} />

      <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
        <Route index element={<RootRedirect />} />

        {/* --- CORE SYSTEM --- */}
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="tracker"   element={<RoleWrapper allowedRoles={['admin']}><Tracker /></RoleWrapper>} />
        <Route path="admin"     element={<RoleWrapper allowedRoles={['admin']}><AdminControl /></RoleWrapper>} />
        
        {/* --- REPOSITORY & DOCS --- */}
        <Route path="documents" element={
          <RoleWrapper allowedRoles={['admin']}><Documents /></RoleWrapper>
        } />

        {/* --- OPS DASHBOARDS --- */}
        <Route path="distribution" element={
          <RoleWrapper allowedRoles={['admin', 'distribution']}><DistributionDashboard /></RoleWrapper>
        } />
        <Route path="delivery-dash" element={
          <RoleWrapper allowedRoles={['admin', 'delivery']}><DeliveryDashboard /></RoleWrapper>
        } />

        {/* --- TRACKERS --- */}
        <Route path="distro-tracker" element={
          <RoleWrapper allowedRoles={['admin', 'distribution']}><DistributionTracker /></RoleWrapper>
        } />
        <Route path="delivery-tracker" element={
          <RoleWrapper allowedRoles={['admin', 'delivery']}><DeliveryTracker /></RoleWrapper>
        } />

        {/* --- GROWTH & CRM --- */}
        <Route path="crm"        element={<RoleWrapper allowedRoles={['admin', 'distribution']}><CRM /></RoleWrapper>} />
        <Route path="prospects" element={<RoleWrapper allowedRoles={['admin', 'distribution']}><Prospects /></RoleWrapper>} />
        <Route path="outreach"  element={<RoleWrapper allowedRoles={['admin', 'distribution']}><Outreach /></RoleWrapper>} />
        <Route path="scraper"   element={<RoleWrapper allowedRoles={['admin', 'distribution']}><Scraper /></RoleWrapper>} />

        {/* --- BRAND & ASSETS --- */}
        <Route path="authority" element={<RoleWrapper allowedRoles={['admin', 'delivery', 'distribution']}><AuthorityBrand /></RoleWrapper>} />
        <Route path="proof"      element={<RoleWrapper allowedRoles={['admin', 'delivery', 'distribution']}><ProofBrand /></RoleWrapper>} />
        <Route path="templates" element={<RoleWrapper allowedRoles={['admin', 'delivery', 'distribution']}><Templates /></RoleWrapper>} />
        <Route path="studio"     element={<RoleWrapper allowedRoles={['admin', 'delivery', 'distribution']}><Studio /></RoleWrapper>} />
        <Route path="sops"      element={<Sops />} />
        
        {/* --- PDF GENERATION --- */}
        <Route path="mjr-generator" element={<RoleWrapper allowedRoles={['admin', 'distribution']}><MJRPdfGenerator /></RoleWrapper>} />
        <Route path="spoa" element={<RoleWrapper allowedRoles={['admin', 'distribution']}>
    <SPOA />
  </RoleWrapper>
} />

        {/* --- AI TOOLS --- */}
        <Route path="brain" element={<RoleWrapper allowedRoles={['admin', 'distribution', 'delivery']}><Brain /></RoleWrapper>} />
        <Route path="chat"  element={<RoleWrapper allowedRoles={['admin', 'distribution', 'delivery']}><ChatPage /></RoleWrapper>} />

        {/* --- FULFILLMENT & FINANCE --- */}
        <Route path="clients"    element={<RoleWrapper allowedRoles={['admin', 'delivery', 'client']}><Clients /></RoleWrapper>} />
        <Route path="sprints"    element={<RoleWrapper allowedRoles={['admin', 'delivery', 'client']}><Sprints /></RoleWrapper>} />
        <Route path="sprints/:id" element={<RoleWrapper allowedRoles={['admin', 'delivery', 'client']}><SprintDetail /></RoleWrapper>} />
        <Route path="income"    element={<RoleWrapper allowedRoles={['admin']}><IncomeTracking /></RoleWrapper>} />
        <Route path="finance"    element={<RoleWrapper allowedRoles={['admin']}><Finance /></RoleWrapper>} />    
      </Route>

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
