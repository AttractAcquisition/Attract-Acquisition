import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleLogin() {
    if (!email || !password) { setError('Email and password required'); return }
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) { setError(err.message); setLoading(false) }
    // On success: onAuthStateChange fires → App.tsx redirects by role
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 400,
        background: 'var(--bg2)', border: '1px solid var(--border2)',
        borderRadius: 12, padding: 40,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }}>
          <div style={{
            width: 40, height: 40, background: 'var(--teal)', borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'DM Mono', fontWeight: 500, fontSize: 14, color: 'var(--bg)',
          }}>AA</div>
          <div>
            <div style={{ fontFamily: 'Playfair Display', fontSize: 20, fontWeight: 700 }}>Attract Acquisition</div>
            <div style={{ fontFamily: 'DM Mono', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--grey)', marginTop: 1 }}>Operating System</div>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: 'Playfair Display', fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Sign in</div>
          <div style={{ fontSize: 13, color: 'var(--grey)' }}>Access your AA OS dashboard</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div className="label">Email</div>
            <input className="input" type="email" placeholder="you@attractacq.com"
              value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          </div>
          <div>
            <div className="label">Password</div>
            <input className="input" type="password" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          </div>

          {error && (
            <div style={{ fontSize: 12, color: 'var(--red)', fontFamily: 'DM Mono', padding: '8px 12px', background: 'rgba(226,75,74,0.08)', borderRadius: 4, border: '1px solid rgba(226,75,74,0.2)' }}>
              {error}
            </div>
          )}

          <button className="btn-primary" onClick={handleLogin} disabled={loading}
            style={{ width: '100%', padding: 14, marginTop: 4, fontSize: 13 }}>
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </div>

        <div style={{ marginTop: 24, fontFamily: 'DM Mono', fontSize: 10, color: 'var(--grey2)', textAlign: 'center', letterSpacing: '0.06em' }}>
          ATTRACT ACQUISITION (PTY) LTD · PRIVATE
        </div>
      </div>
    </div>
  )
}