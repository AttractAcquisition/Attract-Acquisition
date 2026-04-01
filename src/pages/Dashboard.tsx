import { useAuth } from '../lib/auth'
import AdminView             from '../components/views/Dashboard/AdminView'
import ClientView            from '../components/views/Dashboard/ClientView'
import DistributionDashboard from '../components/views/Dashboard/DistributionDashboard'
import DeliveryDashboard     from '../components/views/Dashboard/DeliveryDashboard'

export default function Dashboard() {
  const { role, loading } = useAuth()

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', fontFamily: 'DM Mono', fontSize: 12, color: 'var(--grey)' }}>
      Initializing...
    </div>
  )

  switch (role) {
    case 'admin':        return <AdminView />
    case 'distribution': return <DistributionDashboard />
    case 'delivery':     return <DeliveryDashboard />
    case 'client':       return <ClientView />
    default:             return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--grey)', fontFamily: 'DM Mono', fontSize: 12 }}>
        No dashboard configured for this role.
      </div>
    )
  }
}