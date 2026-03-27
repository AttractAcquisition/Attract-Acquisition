import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Brain() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'Systems online. I have access to the Attract Acquisition core documentation. How can I help you scale today?' 
    }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // THE BRIDGE: Your specific backend URL
      const BACKEND_URL = 'https://ubiquitous-space-funicular-r4j6v77jwrxj25xqw-8000.app.github.dev';
      
      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          // Header used to help bypass some GitHub Codespace proxy restrictions
          'X-Requested-With': 'XMLHttpRequest' 
        },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      
    } catch (err) {
      console.error("Brain Connection Error:", err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '⚠️ Connection Error: Could not reach the AA Brain. Please verify that the Backend repo is running main.py and Port 8000 is set to PUBLIC in the Ports tab.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', maxWidth: '900px', margin: '0 auto' }}>
      
      {/* Chat History */}
      <div 
        ref={scrollRef}
        style={{ 
          flex: 1, overflowY: 'auto', padding: '20px', 
          background: 'var(--bg2)', border: '1px solid var(--border2)', 
          borderRadius: '8px', marginBottom: '20px',
          display: 'flex', flexDirection: 'column', gap: '16px'
        }}
      >
        {messages.map((m, i) => (
          <div key={i} style={{ 
            display: 'flex', gap: '12px', 
            flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
            alignItems: 'flex-start'
          }}>
            <div style={{ 
              width: '32px', height: '32px', borderRadius: '4px', 
              background: m.role === 'user' ? 'var(--grey2)' : 'var(--teal)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              {m.role === 'user' ? <User size={16} color="var(--bg)" /> : <Bot size={16} color="var(--bg)" />}
            </div>
            <div style={{ 
              maxWidth: '70%', padding: '12px 16px', borderRadius: '8px',
              background: m.role === 'user' ? 'var(--teal-faint)' : 'var(--bg3)',
              border: `1px solid ${m.role === 'user' ? 'var(--teal)' : 'var(--border2)'}`,
              fontFamily: 'Barlow', fontSize: '14px', lineHeight: '1.5',
              color: 'var(--white)', whiteSpace: 'pre-wrap'
            }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: '12px', color: 'var(--teal)', fontFamily: 'DM Mono', fontSize: '12px', paddingLeft: '44px' }}>
            <Sparkles size={14} className="animate-pulse" /> 
            <span>Consulting Attract Acquisition Knowledge Base...</span>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div style={{ display: 'flex', gap: '10px', position: 'relative' }}>
        <input 
          style={{ 
            flex: 1, background: 'var(--bg2)', border: '1px solid var(--border2)', 
            borderRadius: '6px', padding: '14px 16px', color: 'var(--white)',
            fontFamily: 'DM Mono', fontSize: '14px', outline: 'none'
          }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask the AA Brain about acquisition funnels..."
        />
        <button 
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{ 
            background: loading ? 'var(--grey2)' : 'var(--teal)', 
            border: 'none', borderRadius: '6px', 
            padding: '0 20px', cursor: loading ? 'default' : 'pointer', 
            transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <Send size={18} color="var(--bg)" />
        </button>
      </div>
    </div>
  );
}