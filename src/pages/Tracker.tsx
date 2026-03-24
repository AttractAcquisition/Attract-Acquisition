import { useAuth } from '../lib/auth'
import AdminView           from '../components/views/Tracker/AdminView'
import OperatorView        from '../components/views/Tracker/OperatorView'
import ClientView          from '../components/views/Tracker/ClientView'
import DistributionTracker from '../components/views/Tracker/DistributionTracker' // Add this

export default function Tracker() {
  const { role } = useAuth()

  switch (role) {
    case 'admin':        return <AdminView />
    case 'distribution': return <DistributionTracker /> // New view for Distro Ops
    case 'delivery':
    case 'operator':     return <OperatorView />
    case 'client':       return <ClientView />
    default:             return null
  }
}