import { useState } from 'react';
import { Message } from '../types';

export default function AgentPanel() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'agent', content: 'Salom! Qanday yordam bera olaman?' }
  ]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: 'user', content: input }]);
    setInput('');
    // Simulate agent response
    setTimeout(() => {
        setMessages(prev => [...prev, { role: 'agent', content: 'Tushundim, davom etamiz...' }]);
    }, 1000);
  };

  return (
    <div className="w-1/4 border-r p-4 flex flex-col bg-white">
      <select className="mb-4 p-2 border rounded">
        <option>Gemini 1.5 Pro</option>
        <option>Gemini 2.0 Flash</option>
        <option>Gemini 3.5 Pro</option>
      </select>
      <div className="flex-1 bg-slate-50 rounded-lg border border-slate-200 p-4 overflow-y-auto mb-4 space-y-2">
        {messages.map((msg, i) => (
          <div key={i} className={`p-2 rounded ${msg.role === 'user' ? 'bg-blue-100 text-right' : 'bg-white border'}`}>
            {msg.content}
          </div>
        ))}
      </div>
      <input 
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        className="p-3 border border-slate-300 rounded-lg outline-none" 
        placeholder="Type a message..." 
      />
    </div>
  );
}
