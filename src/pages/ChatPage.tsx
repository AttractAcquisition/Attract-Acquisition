import { useState } from 'react';

const ChatPage = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content }),
      });

      if (!response.ok) throw new Error(`Server responded with ${response.status}`);

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      console.error('ChatPage connection error:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Could not reach the backend. Check that VITE_BACKEND_URL is set and the server is running.' }]);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-[#07100e] text-white rounded-xl shadow-md">
      <div className="h-96 overflow-y-auto mb-4 p-4 border border-emerald-900 rounded">
        {messages.map((m, i) => (
          <div key={i} className={`mb-2 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
            <span className={`inline-block p-2 rounded ${m.role === 'user' ? 'bg-emerald-700' : 'bg-gray-800'}`}>
              {m.content}
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 p-2 bg-black border border-emerald-900 rounded"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask the Brain..."
        />
        <button onClick={sendMessage} className="bg-emerald-600 px-4 py-2 rounded">Send</button>
      </div>
    </div>
  );
};

export default ChatPage;
