import { useAuth } from '../lib/auth'
import AdminView           from '../components/views/Tracker/AdminView'
import ClientView          from '../components/views/Tracker/ClientView'
import DistributionTracker from '../components/views/Tracker/DistributionTracker'
import DeliveryTracker     from '../components/views/Tracker/DeliveryTracker'

export default function Tracker() {
  const { role } = useAuth()

  switch (role) {
    case 'admin':        
      return <AdminView />
    case 'distribution': 
      return <DistributionTracker />
    case 'delivery':     
      return <DeliveryTracker />
    case 'client':       
      return <ClientView />
    default:             
      return (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--grey)' }}>
          Loading Protocols...
        </div>
      )
  }
}