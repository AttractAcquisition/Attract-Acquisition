import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'
import { useToast } from '../lib/toast'

interface Setting { key: string; value: string }

const WEBHOOK_FIELDS = [
  { key: 'n8n_run_apify',       label: 'Run Apify Webhook',      placeholder: 'https://your-n8n.railway.app/webhook/run-apify' },
  { key: 'n8n_send_whatsapp',   label: 'Send WhatsApp Webhook',   placeholder: 'https://your-n8n.railway.app/webhook/send-whatsapp' },
  { key: 'n8n_generate_mjr',    label: 'Generate MJR Webhook',    placeholder: 'https://your-n8n.railway.app/webhook/generate-mjr' },
]

const API_FIELDS = [
  { key: 'anthropic_api_key',   label: 'Anthropic API Key',       placeholder: 'sk-ant-...' },
  { key: 'openai_api_key',      label: 'OpenAI API Key',          placeholder: 'sk-...' },
  { key: 'meta_access_token',   label: 'Meta Access Token',       placeholder: 'EAAGm...' },
  { key: 'meta_business_id',    label: 'Meta Business Manager ID',placeholder: '123456789' },
  { key: 'apify_api_token',     label: 'Apify API Token',         placeholder: 'apify_api_...' },
]

export default function SettingsPage() {
  const [settings, setSettings]   = useState<Record<string, string>>({})
  const [visible, setVisible]     = useState<Record<string, boolean>>({})
  const [dbStatus, setDbStatus]   = useState<'checking'|'ok'|'error'>('checking')
  const [saving, setSaving]       = useState(false)
  const [user, setUser]           = useState<any>(null)
  const { toast }                 = useToast()

  useEffect(() => {
    checkDb()
    loadSettings()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  async function checkDb() {
    const { error } = await supabase.from('tasks').select('id').limit(1)
    setDbStatus(error ? 'error' : 'ok')
  }

  async function loadSettings() {
    const { data } = await supabase.from('templates').select('id').limit(1)
    const stored = localStorage.getItem('aa_settings')
    if (stored) {
      try { setSettings(JSON.parse(stored)) } catch {}
    }
  }

  function updateField(key: string, value: string) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  async function saveAll() {
    setSaving(true)
    localStorage.setItem('aa_settings', JSON.stringify(settings))
    await new Promise(r => setTimeout(r, 400))
    setSaving(false)
    toast('Settings saved ✓')
  }

  async function testWebhook(url: string) {
    if (!url) { toast('Enter a webhook URL first', 'error'); return }
    try {
      await fetch(url, { method: 'POST', body: JSON.stringify({ test: true }), headers: { 'Content-Type': 'application/json' } })
      toast('Webhook pinged — check N8N execution history')
    } catch {
      toast('Could not reach webhook URL', 'error')
    }
  }

  function toggleVisible(key: string) {
    setVisible(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div style={{ maxWidth: 680 }}>

      {/* Profile */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-label">Profile</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, background: 'var(--teal)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Mono', fontWeight: 500, fontSize: 14, color: 'var(--bg)', flexShrink: 0 }}>AA</div>
          <div>
            <div style={{ fontWeight: 500, fontSize: 15 }}>Alexander Anderson</div>
            <div style={{ fontSize: 13, color: 'var(--grey)' }}>{user?.email || 'alex@attractacq.com'}</div>
            <div style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>MD · Attract Acquisition (Pty) Ltd</div>
          </div>
        </div>
      </div>

      {/* Connection status */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-label">System Status</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Supabase Database',  status: dbStatus === 'ok', sub: 'attract-acquisition-prod' },
            { label: 'AA OS Version',      status: true, sub: 'v1.0 · March 2026', custom: true },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg3)', borderRadius: 6 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{s.label}</div>
                <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--grey)', marginTop: 2 }}>{s.sub}</div>
              </div>
              {dbStatus === 'checking' && !s.custom
                ? <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--grey)' }}>Checking...</div>
                : s.status
                  ? <CheckCircle size={18} color="var(--green)" />
                  : <XCircle size={18} color="var(--red)" />
              }
            </div>
          ))}
        </div>
      </div>

      {/* API Keys */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-label">API Keys</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {API_FIELDS.map(f => (
            <div key={f.key}>
              <div className="label">{f.label}</div>
              <div style={{ position: 'relative' }}>
                <input className="input" type={visible[f.key] ? 'text' : 'password'}
                  placeholder={f.placeholder} value={settings[f.key] || ''}
                  onChange={e => updateField(f.key, e.target.value)}
                  style={{ paddingRight: 40 }} />
                <button onClick={() => toggleVisible(f.key)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--grey2)' }}>
                  {visible[f.key] ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* N8N Webhooks */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-label">N8N Webhook URLs</div>
        <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--grey)', marginBottom: 14 }}>
          Deploy N8N on Railway, then paste each workflow's webhook URL here.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {WEBHOOK_FIELDS.map(f => (
            <div key={f.key}>
              <div className="label">{f.label}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="input" placeholder={f.placeholder} value={settings[f.key] || ''}
                  onChange={e => updateField(f.key, e.target.value)} style={{ flex: 1 }} />
                <button className="btn-ghost" onClick={() => testWebhook(settings[f.key] || '')}
                  style={{ fontSize: 11, padding: '8px 12px', whiteSpace: 'nowrap' }}>Test</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <button className="btn-primary" onClick={saveAll} disabled={saving}
        style={{ width: '100%', padding: '12px', fontSize: 13 }}>
        {saving ? 'Saving...' : 'Save All Settings →'}
      </button>

      <div style={{ marginTop: 16, fontFamily: 'DM Mono', fontSize: 11, color: 'var(--grey2)', textAlign: 'center' }}>
        API keys stored locally in browser. Never committed to GitHub.
      </div>
    </div>
  )
}