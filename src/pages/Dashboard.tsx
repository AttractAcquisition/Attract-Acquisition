import { useAuth } from '../lib/auth'
import AdminView    from '../components/views/Dashboard/AdminView'
import OperatorView from '../components/views/Dashboard/OperatorView'
import ClientView   from '../components/views/Dashboard/ClientView'

export default function Dashboard() {
  const { role } = useAuth()

  switch (role) {
    case 'admin':    return <AdminView />
    case 'operator': return <OperatorView />
    case 'client':   return <ClientView />
    default:         return null
  }
}
