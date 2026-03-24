import { useAuth } from '../lib/auth'
import AdminView             from '../components/views/Dashboard/AdminView'
import ClientView            from '../components/views/Dashboard/ClientView'
import DistributionDashboard from '../components/views/Dashboard/DistributionDashboard'
import DeliveryDashboard     from '../components/views/Dashboard/DeliveryDashboard'

export default function Dashboard() {
  const { role } = useAuth()

  switch (role) {
    case 'admin':        
      return <AdminView />
    case 'distribution': 
      return <DistributionDashboard />
    case 'delivery':     
      return <DeliveryDashboard />
    case 'client':       
      return <ClientView />
    default:             
      return (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--grey)' }}>
          Accessing Command Center...
        </div>
      )
  }
}