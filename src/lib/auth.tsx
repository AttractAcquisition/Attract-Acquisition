import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase } from './supabase'
import type { User, Session } from '@supabase/supabase-js'

// 1. Expand the Role type to include your new business departments
export type Role = 'admin' | 'client' | 'distribution' | 'delivery' | null

interface AuthCtx {
  user:        User | null
  session:     Session | null
  role:        Role
  clientId:    string | null
  metadata_id: string | null
  loading:     boolean
  signOut:     () => Promise<void>
}

const AuthContext = createContext<AuthCtx>({
  user: null, session: null, role: null, clientId: null,
  metadata_id: null, loading: true,
  signOut: async () => {},
})

function extractRole(session: Session | null): Role {
  if (!session) return null
  const meta = session.user?.user_metadata || {}
  // Cast the metadata string to our new Role type
  return (meta.role as Role) || null
}

function extractClientId(session: Session | null): string | null {
  if (!session) return null
  return session.user?.user_metadata?.client_id || null
}

function extractMetadataId(session: Session | null, role: Role): string | null {
  if (!session) return null
  
  // If they are a client, we need their specific Client UUID to filter data
  if (role === 'client') {
    return session.user?.user_metadata?.client_id || null
  }
  
  // For Admin, Distribution, and Delivery, we use their Auth User ID 
  // so they only see data assigned to their specific account
  return session.user?.id || null
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

  const role     = extractRole(session)
  const clientId = extractClientId(session)

  return (
    <AuthContext.Provider value={{
      user:        session?.user ?? null,
      session,
      role,
      clientId,
      metadata_id: extractMetadataId(session, role),
      loading,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)