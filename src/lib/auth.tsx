import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from './supabase'
import type { User, Session } from '@supabase/supabase-js'

type Role = 'admin' | 'operator' | 'client' | null

interface AuthCtx {
  user:    User | null
  session: Session | null
  role:    Role
  clientId: string | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthCtx>({
  user: null, session: null, role: null, clientId: null, loading: true,
  signOut: async () => {},
})

function extractRole(session: Session | null): Role {
  if (!session) return null
  const meta = session.user?.user_metadata || {}
  return (meta.role as Role) || null
}

function extractClientId(session: Session | null): string | null {
  if (!session) return null
  return session.user?.user_metadata?.client_id || null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => {
      setSession(s)
      setLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{
      user:     session?.user ?? null,
      session,
      role:     extractRole(session),
      clientId: extractClientId(session),
      loading,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)