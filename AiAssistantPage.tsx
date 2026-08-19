
import React, { useState, useRef, useEffect } from 'react';
import { Message, Sender } from './types';
import { ChatMessageItem } from './components/ChatMessageItem';
import { Send, Bot, Trash2, Zap, ExternalLink, RefreshCw, Sparkles } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { getMovies } from './services/dbService';

export const AiAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: "Salom! Men Anilo.uz aqlli yordamchisiman. 🤖\n\nSizga sayt, yangi animelar yoki loyiha haqida ma'lumot bera olaman. Google Search orqali dunyo yangiliklarini ham bilaman!",
      sender: Sender.Bot,
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [groundingLinks, setGroundingLinks] = useState<any[]>([]);
  const [siteMovies, setSiteMovies] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Saytdagi bor animelar ro'yxatini yuklab olish
    getMovies().then(movies => {
        const titles = movies.slice(0, 50).map(m => m.title).join(', ');
        setSiteMovies(titles);
    });
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      text: userText,
      sender: Sender.User,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    setGroundingLinks([]);

    try {
      // Use process.env.API_KEY directly as required
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userText,
        config: {
          tools: [{ googleSearch: {} }],
          systemInstruction: `Siz Anilo.uz anime portalining rasmiy AI yordamchisiz. 
          
          SAYTDA MAVJUD ANIMELAR: ${siteMovies}
          
          KO'RSATMALAR:
          1. Foydalanuvchi saytdagi animelar haqida so'rasa, yuqoridagi ro'yxatdan foydalaning.
          2. Agar ro'yxatda yo'q narsani so'rashsa yoki umumiy ma'lumot kerak bo'lsa, Google Search (grounding) orqali eng so'nggi ma'lumotlarni toping.
          3. Loyiha asoschilari: Firdavs Abdurazzoqov (CEO) va Sardor Tuyginov (Creator/CTO).
          4. Premium narxlar: 1 oy - 9,999 so'm, 3 oy - 28,500 so'm, 1 yil - 90,000 so'm.
          5. Javoblaringiz samimiy va o'zbek tilida bo'lsin.`,
        },
      });

      const textOutput = response.text || "Xatolik yuz berdi.";
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: textOutput,
        sender: Sender.Bot,
        timestamp: Date.now()
      };

      // Extract Grounding Metadata for source links
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
          const links = chunks.filter((c: any) => c.web).map((c: any) => c.web);
          setGroundingLinks(links);
      }
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, {
        id: 'err', 
        text: "Kechirasiz, xizmatda vaqtincha uzilish bo'ldi. Iltimos, qayta urinib ko'ring.", 
        sender: Sender.Bot, 
        timestamp: Date.now(), 
        isError: true
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-[#050505] animate-fade-in relative overflow-hidden">
      {/* Header */}
      <div className="flex-none p-4 border-b border-white/5 bg-black/80 backdrop-blur-md z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                  <Bot size={20} className="text-white" />
              </div>
              <div>
                  <h2 className="font-black text-white text-sm uppercase tracking-tight">Anilo GPT</h2>
                  <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Powered by Gemini 3</p>
              </div>
          </div>
          <button onClick={() => setMessages([messages[0]])} className="p-2 text-zinc-500 hover:text-red-500 transition-colors" title="Chatni tozalash"><Trash2 size={18} /></button>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide pb-20">
        {messages.map((msg) => (
          <ChatMessageItem key={msg.id} message={msg} />
        ))}
        
        {/* Grounding Links UI */}
        {groundingLinks.length > 0 && !isTyping && (
            <div className="ml-9 p-4 bg-blue-950/20 border border-blue-500/20 rounded-2xl animate-fade-in">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Zap size={12}/> Manbalar:
                </p>
                <div className="space-y-2">
                    {groundingLinks.map((link, i) => (
                        <a key={i} href={link.uri} target="_blank" rel="noreferrer" className="flex items-center justify-between p-2 bg-black/40 rounded-lg hover:bg-black transition-all border border-white/5 group">
                            <span className="text-xs text-zinc-300 truncate pr-4">{link.title}</span>
                            <ExternalLink size={12} className="text-zinc-600 group-hover:text-blue-400" />
                        </a>
                    ))}
                </div>
            </div>
        )}

        {isTyping && (
          <div className="flex justify-start animate-fade-in ml-9">
             <div className="bg-zinc-900 border border-white/5 px-4 py-3 rounded-2xl flex items-center space-x-1.5">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input */}
      <div className="flex-none p-4 bg-black border-t border-white/5 pb-safe">
        <form onSubmit={handleSend} className="relative flex items-center gap-2 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            placeholder="Anime haqida so'rang..."
            className="w-full pl-5 pr-12 py-4 bg-zinc-900 border border-white/10 rounded-2xl focus:border-blue-500 outline-none text-sm text-white"
          />
          <button type="submit" disabled={!input.trim() || isTyping} className="absolute right-2 p-2.5 bg-blue-600 text-white rounded-xl active:scale-95 shadow-lg shadow-blue-600/20">
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
