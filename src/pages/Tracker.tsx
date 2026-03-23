import { useAuth } from '../lib/auth'
import AdminView    from '../components/views/Tracker/AdminView'
import OperatorView from '../components/views/Tracker/OperatorView'
import ClientView   from '../components/views/Tracker/ClientView'

export default function Tracker() {
  const { role } = useAuth()

  switch (role) {
    case 'admin':    return <AdminView />
    case 'operator': return <OperatorView />
    case 'client':   return <ClientView />
    default:         return null
  }
}
