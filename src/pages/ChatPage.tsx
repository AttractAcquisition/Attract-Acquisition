// src/pages/ChatPage.tsx
import React, { useState, useRef, useEffect } from 'react' // Added React import for JSX namespace
import { 
  Send, 
  Bot, 
  User, 
  Zap, 
  BookOpen, 
  MessageSquare, 
  Sparkles,
  RefreshCw
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface SOPPrompt {
  id: string
  label: string
  // Changed from JSX.Element to React.ReactNode for better compatibility
  icon: React.ReactNode 
  prompt: string
}

// ─── Constants ────────────────────────────────────────────────────────────────
const SOP_PROMPTS: SOPPrompt[] = [
  { 
    id: 'outreach', 
    label: 'Outreach Script', 
    icon: <Zap size={14} />, 
    prompt: "Generate a personalized 3-step WhatsApp outreach sequence for a high-ticket service business based on their Google Review gap." 
  },
  { 
    id: 'funnel', 
    label: 'Funnel Audit', 
    icon: <Sparkles size={14} />, 
    prompt: "Review a standard acquisition funnel for an industrial service brand and identify where most leads are dropping off." 
  },
  { 
    id: 'sop', 
    label: 'Write SOP', 
    icon: <BookOpen size={14} />, 
    prompt: "Write a clear, step-by-step SOP for a Virtual Assistant to handle MJR delivery and lead follow-up." 
  },
  { 
    id: 'objection', 
    label: 'Handle Objection', 
    icon: <MessageSquare size={14} />, 
    prompt: "How should I respond to a creator who says 'I don't want to sell to my audience'?" 
  }
]

// ─── Main Component ───────────────────────────────────────────────────────────
const ChatPage = () => {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "System online. How can I assist with your acquisition funnels or SOPs today?" }
  ])
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = async (overrideText?: string) => {
    const textToSend = overrideText || input
    if (!textToSend.trim() || loading) return

    const userMsg: Message = { role: 'user', content: textToSend }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || ''
      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content }),
      })

      if (!response.ok) throw new Error(`Server responded with ${response.status}`)

      const data = await response.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch (err) {
      console.error('ChatPage connection error:', err)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '⚠️ Connection Error: Ensure VITE_BACKEND_URL is active and reachable.' 
      }])
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: "Chat cleared. Ready for new instructions." }])
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '280px 1fr',
      gap: 24,
      height: 'calc(100vh - 120px)',
    }}>
      
      {/* ── LEFT PANEL: SOP SHORTCUTS ───────────────────────────────────────── */}
      <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookOpen size={16} style={{ color: 'var(--teal)' }} />
          <div className="section-label" style={{ margin: 0 }}>SOP Library</div>
        </div>
        
        <p style={{ fontSize: 11, color: 'var(--grey)', lineHeight: 1.5, marginBottom: 8 }}>
          Use these quick-prompts to generate assets based on your brand standards.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SOP_PROMPTS.map(sop => (
            <button
              key={sop.id}
              onClick={() => sendMessage(sop.prompt)}
              disabled={loading}
              className="btn-secondary"
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                textAlign: 'left', padding: '12px', fontSize: 12,
                justifyContent: 'flex-start', background: 'var(--bg3)'
              }}
            >
              <span style={{ color: 'var(--teal)' }}>{sop.icon}</span>
              {sop.label}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border2)' }}>
          <button 
            onClick={clearChat}
            style={{ 
              background: 'transparent', border: 'none', color: 'var(--grey2)', 
              fontSize: 11, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' 
            }}
          >
            <RefreshCw size={12} /> Clear Session
          </button>
        </div>
      </div>

      {/* ── RIGHT PANEL: CHAT INTERFACE ─────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 16 }}>
        
        {/* Messages Area */}
        <div 
          className="card" 
          ref={scrollRef}
          style={{ 
            flex: 1, overflowY: 'auto', padding: 24, 
            display: 'flex', flexDirection: 'column', gap: 20,
            background: 'var(--bg1)'
          }}
        >
          {messages.map((m, i) => (
            <div key={i} style={{
              display: 'flex', 
              gap: 16,
              alignItems: 'flex-start',
              flexDirection: m.role === 'user' ? 'row-reverse' : 'row'
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: m.role === 'user' ? 'var(--teal)' : 'var(--bg3)',
                border: `1px solid ${m.role === 'user' ? 'var(--teal)' : 'var(--border2)'}`,
                flexShrink: 0
              }}>
                {m.role === 'user' ? <User size={16} color="black" /> : <Bot size={16} color="var(--teal)" />}
              </div>
              
              <div style={{
                maxWidth: '80%',
                padding: '12px 16px',
                borderRadius: 8,
                fontSize: 14,
                lineHeight: 1.6,
                background: m.role === 'user' ? 'var(--bg3)' : 'transparent',
                border: m.role === 'user' ? '1px solid var(--border2)' : 'none',
                color: m.role === 'user' ? 'var(--white)' : 'var(--grey)',
                whiteSpace: 'pre-wrap'
              }}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RefreshCw size={16} className="animate-spin-fast" style={{ color: 'var(--teal)' }} />
              </div>
              <span style={{ fontSize: 12, color: 'var(--grey2)', fontFamily: 'DM Mono' }}>Thinking...</span>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="card" style={{ padding: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
          <input
            className="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your instruction (e.g. Optimize this lead sequence)..."
            style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 14 }}
            disabled={loading}
          />
          <button 
            className="btn-primary" 
            onClick={() => sendMessage()} 
            disabled={loading || !input.trim()}
            style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {loading ? <RefreshCw size={14} className="animate-spin-fast" /> : <Send size={14} />}
            Execute
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-fast {
          animation: spin 0.8s linear infinite;
        }
      `}</style>
    </div>
  )
}

export default ChatPage
