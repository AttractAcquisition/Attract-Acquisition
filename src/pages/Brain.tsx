import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, BookOpen, Zap, MessageSquare, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// --- Types ---
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// --- SOP Quick Prompts ---
const SOP_PROMPTS = [
  { id: 'outreach', label: 'Outreach Script', icon: <Zap size={14} />, prompt: "Generate a personalized 3-step WhatsApp outreach sequence for a high-ticket service business." },
  { id: 'funnel', label: 'Funnel Audit', icon: <Sparkles size={14} />, prompt: "Review a standard acquisition funnel for an industrial service brand." },
  { id: 'sop', label: 'Write SOP', icon: <BookOpen size={14} />, prompt: "Write a step-by-step SOP for a Virtual Assistant to handle MJR delivery." },
];

// --- Markdown Styling ---
const mdComponents = {
  h1: ({ children }: any) => <h1 style={{ color: 'var(--teal)', fontFamily: 'Playfair Display', fontSize: '1.4em', margin: '12px 0 6px' }}>{children}</h1>,
  h2: ({ children }: any) => <h2 style={{ color: 'var(--teal)', fontFamily: 'Playfair Display', fontSize: '1.2em', margin: '10px 0 5px' }}>{children}</h2>,
  table: ({ children }: any) => <table style={{ borderCollapse: 'collapse', width: '100%', margin: '10px 0', fontSize: '13px' }}>{children}</table>,
  th: ({ children }: any) => <th style={{ border: '1px solid var(--border2)', padding: '6px 10px', background: 'var(--bg2)', color: 'var(--teal)', textAlign: 'left', fontFamily: 'DM Mono', fontSize: '11px', textTransform: 'uppercase' }}>{children}</th>,
  td: ({ children }: any) => <td style={{ border: '1px solid var(--border2)', padding: '6px 10px', color: 'var(--white)' }}>{children}</td>,
  code: ({ inline, children }: any) => inline ? 
    <code style={{ background: 'var(--bg)', color: 'var(--teal)', padding: '1px 5px', borderRadius: '3px', fontFamily: 'DM Mono' }}>{children}</code> :
    <pre style={{ background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: '6px', padding: '12px', overflowX: 'auto' }}>
      <code style={{ fontFamily: 'DM Mono', color: 'var(--white)' }}>{children}</code>
    </pre>
};

export default function Brain() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '# Systems Online\nI have access to the **Attract Acquisition** core documentation. How can I help you scale today?' }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async (override?: string) => {
    const text = override || input;
    if (!text.trim() || loading) return;

    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);

    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://ubiquitous-space-funicular-r4j6v77jwrxj25xqw-8000.app.github.dev';
      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ **Connection Error:** Backend unreachable.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px', height: 'calc(100vh - 140px)' }}>
      
      {/* Sidebar */}
      <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="section-label">SOP Shortcuts</div>
        {SOP_PROMPTS.map(sop => (
          <button key={sop.id} onClick={() => handleSend(sop.prompt)} className="btn-secondary" style={{ display: 'flex', gap: '8px', fontSize: '12px', textAlign: 'left' }}>
            {sop.icon} {sop.label}
          </button>
        ))}
      </div>

      {/* Main Chat */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '20px', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: '8px', marginBottom: '16px' }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '4px', background: m.role === 'user' ? 'var(--grey2)' : 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div style={{ maxWidth: '80%', padding: '12px 16px', background: m.role === 'user' ? 'var(--bg3)' : 'transparent', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--white)', fontSize: '14px' }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{m.content}</ReactMarkdown>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <input className="input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Ask the Brain..." style={{ flex: 1 }} />
          <button className="btn-primary" onClick={() => handleSend()} disabled={loading}><Send size={18} /></button>
        </div>
      </div>
    </div>
  );
}
