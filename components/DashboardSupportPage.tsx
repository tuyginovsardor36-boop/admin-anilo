import React, { useState, useEffect, useRef } from 'react';
import { createTicket, getMyTickets, getTicketMessages, sendMessage, getNews } from '../services/dbService';
import { supabase } from '../services/supabaseClient';
import { TicketMessage, SupportTicket, News } from '../types';
import { Send, ArrowLeft, MessageSquare, Newspaper, History, Clock } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';

interface DashboardSupportPageProps {
    onBack: () => void;
}

export const DashboardSupportPage: React.FC<DashboardSupportPageProps> = ({ onBack }) => {
    const [view, setView] = useState<'menu' | 'news' | 'chat' | 'history'>('menu');
    const [user, setUser] = useState<any>(null);
    const [activeTicketId, setActiveTicketId] = useState<number | null>(null);
    
    const [messages, setMessages] = useState<TicketMessage[]>([]);
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [newsList, setNewsList] = useState<News[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setUser(data.user));
    }, []);

    useEffect(() => {
        if (view === 'history' && user) loadTickets();
        if (view === 'news') loadNews();
        if (view === 'chat' && activeTicketId) {
            loadMessages(activeTicketId);
            const interval = setInterval(() => loadMessages(activeTicketId, false), 5000);
            return () => clearInterval(interval);
        }
    }, [view, activeTicketId, user]);

    const loadTickets = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await getMyTickets(user.id);
            setTickets(data);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const loadNews = async () => {
        setLoading(true);
        try {
            const data = await getNews();
            setNewsList(data);
        } catch (e) { console.error(e); }
        setLoading(false);
    }

    const loadMessages = async (ticketId: number, showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const data = await getTicketMessages(ticketId);
            setMessages(data);
            if (showLoading) setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        } catch (e) { console.error(e); }
        if (showLoading) setLoading(false);
    };

    const handleStartChat = async () => {
        if (!user) return alert("Avval kiring");
        const myTickets = await getMyTickets(user.id);
        const openTicket = myTickets.find(t => t.status === 'open');
        
        if (openTicket) {
            setActiveTicketId(openTicket.id);
            setView('chat');
        } else {
            setLoading(true);
            try {
                const newTicket = await createTicket(user.id);
                setActiveTicketId(newTicket.id);
                setView('chat');
            } catch (e) { console.error(e); }
            setLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeTicketId || !user) return;
        try {
            await sendMessage(activeTicketId, user.id, newMessage, false);
            setNewMessage('');
            loadMessages(activeTicketId, false);
        } catch (e) { console.error(e); }
    };

    return (
        <div className="animate-fade-in space-y-8 pb-10">
            <div className="flex items-center gap-6">
                <button onClick={onBack} className="w-12 h-12 bg-white/5 hover:bg-orange-600 rounded-full flex items-center justify-center text-white transition-all active:scale-90">
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h2 className="text-3xl font-black text-white">Yordam Markazi</h2>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Support & Feedback</p>
                </div>
            </div>

            <div className="bg-white/5 border border-white/5 rounded-[3rem] overflow-hidden min-h-[500px] flex flex-col shadow-2xl">
                {view === 'menu' && (
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 p-10">
                        <button onClick={() => setView('news')} className="group flex flex-col items-center justify-center p-8 bg-white/5 rounded-[2.5rem] hover:bg-blue-600 transition-all text-center">
                            <Newspaper size={48} className="mb-6 group-hover:scale-110 transition-transform" />
                            <p className="text-xl font-bold">Yangiliklar</p>
                            <p className="text-xs opacity-50 mt-2">Platforma e'lonlari</p>
                        </button>
                        <button onClick={handleStartChat} className="group flex flex-col items-center justify-center p-8 bg-orange-600 rounded-[2.5rem] hover:bg-orange-500 transition-all text-center shadow-2xl shadow-orange-600/20">
                            <MessageSquare size={48} className="mb-6 group-hover:scale-110 transition-transform text-white" />
                            <p className="text-xl font-black text-white">Jonli Chat</p>
                            <p className="text-xs text-white/70 mt-2">Admin bilan muloqot</p>
                        </button>
                        <button onClick={() => setView('history')} className="group flex flex-col items-center justify-center p-8 bg-white/5 rounded-[2.5rem] hover:bg-purple-600 transition-all text-center">
                            <History size={48} className="mb-6 group-hover:scale-110 transition-transform" />
                            <p className="text-xl font-bold">Arxiv</p>
                            <p className="text-xs opacity-50 mt-2">Eski murojaatlar</p>
                        </button>
                    </div>
                )}

                {view === 'news' && (
                    <div className="flex-1 p-8 space-y-4 overflow-y-auto max-h-[600px]">
                         <button onClick={() => setView('menu')} className="text-orange-500 font-bold flex items-center gap-2 mb-6"> <ArrowLeft size={16}/> Menyuga qaytish</button>
                         {loading ? <LoadingSpinner /> : newsList.map(news => (
                             <div key={news.id} className="bg-white/5 p-6 rounded-[2rem] border border-white/5">
                                 <h4 className="text-xl font-black text-orange-500 mb-2">{news.title}</h4>
                                 <p className="text-gray-300 leading-relaxed">{news.content}</p>
                                 <p className="text-[10px] text-gray-500 mt-4 uppercase font-bold flex items-center gap-2"> <Clock size={12}/> {new Date(news.created_at).toLocaleDateString()}</p>
                             </div>
                         ))}
                    </div>
                )}

                {view === 'history' && (
                    <div className="flex-1 p-8 space-y-4">
                        <button onClick={() => setView('menu')} className="text-orange-500 font-bold flex items-center gap-2 mb-6"> <ArrowLeft size={16}/> Menyuga qaytish</button>
                        <div className="grid gap-3">
                            {tickets.map(t => (
                                <button key={t.id} onClick={() => { setActiveTicketId(t.id); setView('chat'); }} className="w-full bg-white/5 p-5 rounded-2xl flex justify-between items-center hover:bg-white/10 transition-all border border-white/5">
                                    <div className="text-left">
                                        <p className="font-bold text-white">Murojaat #{t.id}</p>
                                        <p className="text-xs text-gray-500 mt-1">{new Date(t.created_at).toLocaleString()}</p>
                                    </div>
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${t.status === 'open' ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'}`}>{t.status === 'open' ? 'Ochiq' : 'Yopiq'}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {view === 'chat' && (
                    <div className="flex-1 flex flex-col h-[600px] bg-black/40">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center">
                            <button onClick={() => setView('menu')} className="text-white/50 hover:text-white flex items-center gap-2 font-bold"> <ArrowLeft size={18}/> Orqaga</button>
                            <span className="font-black text-xs uppercase tracking-widest text-orange-500">Murojaat #{activeTicketId}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {messages.map(m => (
                                <div key={m.id} className={`flex ${m.is_admin ? 'justify-start' : 'justify-end'}`}>
                                    <div className={`max-w-[80%] p-4 rounded-[1.5rem] text-sm ${m.is_admin ? 'bg-white/10 text-white rounded-tl-none' : 'bg-orange-600 text-white rounded-br-none'}`}>
                                        {m.message}
                                        <p className="text-[9px] opacity-40 mt-2 text-right">{new Date(m.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        <form onSubmit={handleSendMessage} className="p-6 bg-white/5 border-t border-white/5 flex gap-4">
                            <input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Muammoingizni yozing..." className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white outline-none focus:border-orange-500 transition-all"/>
                            <button type="submit" disabled={!newMessage.trim()} className="w-14 h-14 bg-orange-600 text-white rounded-2xl flex items-center justify-center hover:bg-orange-500 transition-all disabled:opacity-50 active:scale-90"><Send size={20}/></button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};