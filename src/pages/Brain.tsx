import { useState, useEffect, useRef } from 'react';
import { useToast } from '../lib/toast';
import { 
  Send, Bot, User, 
  Brain as BrainIcon, Loader2, 
  Terminal, ShieldCheck 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// --- Types ---
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// --- Markdown Styling (Emerald/Dark Theme) ---
const mdComponents = {
  h1: ({ children }: any) => <h1 style={{ color: 'var(--teal)', fontFamily: 'Playfair Display', fontSize: '1.4em', margin: '12px 0 6px' }}>{children}</h1>,
  h2: ({ children }: any) => <h2 style={{ color: 'var(--teal)', fontFamily: 'Playfair Display', fontSize: '1.2em', margin: '10px 0 5px' }}>{children}</h2>,
  table: ({ children }: any) => <table style={{ borderCollapse: 'collapse', width: '100%', margin: '10px 0', fontSize: '13px' }}>{children}</table>,
  th: ({ children }: any) => <th style={{ border: '1px solid var(--border2)', padding: '6px 10px', background: 'var(--bg2)', color: 'var(--teal)', textAlign: 'left', fontFamily: 'DM Mono', fontSize: '11px', textTransform: 'uppercase' }}>{children}</th>,
  td: ({ children }: any) => <td style={{ border: '1px solid var(--border2)', padding: '6px 10px', color: 'var(--white)' }}>{children}</td>,
  code: ({ inline, children }: any) => inline ? 
    <code style={{ background: 'var(--bg3)', color: 'var(--teal)', padding: '1px 5px', borderRadius: '3px', fontFamily: 'DM Mono' }}>{children}</code> :
    <pre style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '6px', padding: '12px', overflowX: 'auto' }}>
      <code style={{ fontFamily: 'DM Mono', color: 'var(--white)' }}>{children}</code>
    </pre>
};

export default function Brain() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '# Systems Online\nI am connected to the **Attract Acquisition** knowledge base. How can I assist your operations today?' }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://ubiquitous-space-funicular-r4j6v77jwrxj25xqw-8000.app.github.dev';
      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) throw new Error('Intelligence relay failure.');

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err: any) {
      toast(err.message || "Connection Error", "error");
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ **System Alert:** Connection to the neural backend was interrupted.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', display: 'flex', flexDirection: 'column', gap: '24px', padding: '0 20px' }}>
      
      {/* Header Section - Synced with MJR Generator Style */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--border2)', paddingBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <BrainIcon size={20} color="var(--teal)" />
            <span style={{ fontFamily: 'DM Mono', fontSize: '11px', color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              Central Intelligence Unit
            </span>
          </div>
          <h1 style={{ fontFamily: 'Playfair Display', fontSize: '32px', fontWeight: 700, color: 'var(--white)', margin: 0 }}>
            The AA Brain
          </h1>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'DM Mono', fontSize: '20px', color: 'var(--white)' }}>v3.1</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
             <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--teal)', boxShadow: '0 0 8px var(--teal)' }} />
             <div style={{ fontFamily: 'DM Mono', fontSize: '9px', color: 'var(--grey2)', textTransform: 'uppercase' }}>Neural Link: Active</div>
          </div>
        </div>
      </div>

      {/* Main Interface Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '650px', padding: 0, overflow: 'hidden', background: 'var(--bg1)' }}>
        
        {/* Chat History Area */}
        <div 
          ref={scrollRef} 
          style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '32px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '24px',
            background: 'linear-gradient(to bottom, var(--bg1), var(--bg2))'
          }}
        >
          {messages.map((m, i) => (
            <div key={i} style={{ 
              display: 'flex', 
              gap: '20px', 
              flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
              alignItems: 'flex-start'
            }}>
              <div style={{ 
                width: '36px', 
                height: '36px', 
                borderRadius: '6px', 
                background: m.role === 'user' ? 'var(--bg3)' : 'var(--teal)', 
                border: m.role === 'user' ? '1px solid var(--border2)' : 'none',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {m.role === 'user' ? <User size={18} color="var(--white)" /> : <Bot size={18} color="var(--bg1)" />}
              </div>
              <div style={{ 
                maxWidth: '85%', 
                padding: m.role === 'user' ? '14px 20px' : '0', 
                background: m.role === 'user' ? 'var(--bg3)' : 'transparent', 
                borderRadius: '12px', 
                color: 'var(--white)', 
                fontSize: '14px',
                lineHeight: '1.7',
                border: m.role === 'user' ? '1px solid var(--border2)' : 'none'
              }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{m.content}</ReactMarkdown>
              </div>
            </div>
          ))}
          
          {loading && (
            <div style={{ display: 'flex', gap: '12px', color: 'var(--teal)', fontFamily: 'DM Mono', fontSize: '11px', paddingLeft: '56px', alignItems: 'center' }}>
              <Loader2 size={14} className="spin" />
              <span style={{ letterSpacing: '0.1em' }}>PROCESSING INPUT...</span>
            </div>
          )}
        </div>

        {/* Action Bar (Input Area) */}
        <div style={{ 
          padding: '24px 32px', 
          background: 'var(--bg3)', 
          borderTop: '1px solid var(--border2)',
          display: 'flex',
          gap: '16px',
          alignItems: 'center'
        }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input 
              className="input" 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleSend()} 
              placeholder="Ask the Brain to draft SOPs, scripts, or audit funnels..." 
              style={{ 
                width: '100%',
                background: 'var(--bg1)', 
                border: '1px solid var(--border2)',
                padding: '16px 20px',
                paddingLeft: '45px',
                fontSize: '14px',
                color: 'var(--white)'
              }} 
              disabled={loading}
            />
            <Terminal size={16} color="var(--grey2)" style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)' }} />
          </div>
          
          <button 
            className="btn-primary" 
            onClick={() => handleSend()} 
            disabled={loading || !input.trim()}
            style={{ 
              height: '52px', 
              padding: '0 28px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              fontSize: '13px',
              letterSpacing: '0.05em'
            }}
          >
            {loading ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
            {loading ? 'BUSY' : 'EXECUTE'}
          </button>
        </div>
      </div>

      {/* Footer Meta */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--grey2)', fontFamily: 'DM Mono', fontSize: '9px' }}>
          <ShieldCheck size={12} /> ENCRYPTED NEURAL RELAY
        </div>
        <p style={{ fontFamily: 'DM Mono', fontSize: '9px', color: 'var(--grey2)', textTransform: 'uppercase', margin: 0 }}>
          Authorized Admin Access Only // Attract Acquisition © 2026
        </p>
      </div>
    </div>
  );
}
