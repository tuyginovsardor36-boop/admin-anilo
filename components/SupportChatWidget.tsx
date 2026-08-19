
import React, { useState, useEffect, useRef } from 'react';
import { createTicket, getMyTickets, getTicketMessages, sendMessage, getNews } from '../services/dbService';
import { supabase } from '../services/supabaseClient';
import { TicketMessage, SupportTicket, News } from '../types';
import { Send, X, MessageSquare, Newspaper, History, ChevronLeft } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';

// Icons
const ChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
  </svg>
);

type ViewState = 'menu' | 'news' | 'chat' | 'history';

export const SupportChatWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<ViewState>('menu');
    const [user, setUser] = useState<any>(null);
    const [activeTicketId, setActiveTicketId] = useState<number | null>(null);
    
    // Data States
    const [messages, setMessages] = useState<TicketMessage[]>([]);
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [newsList, setNewsList] = useState<News[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const getUser = async () => {
            const { data } = await supabase.auth.getUser();
            setUser(data.user);
        };
        getUser();
    }, []);

    useEffect(() => {
        if (isOpen && view === 'history' && user) loadTickets();
        if (isOpen && view === 'news') loadNews();
        if (isOpen && view === 'chat' && activeTicketId) loadMessages(activeTicketId);
    }, [isOpen, view, activeTicketId, user]);

    // Poll for new messages if chat is open
    useEffect(() => {
        let interval: any;
        if (isOpen && view === 'chat' && activeTicketId) {
            interval = setInterval(() => loadMessages(activeTicketId, false), 5000);
        }
        return () => clearInterval(interval);
    }, [isOpen, view, activeTicketId]);

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
            if (showLoading) setTimeout(scrollToBottom, 100);
        } catch (e) { console.error(e); }
        if (showLoading) setLoading(false);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleStartChat = async () => {
        if (!user) {
             alert("Chatdan foydalanish uchun tizimga kiring.");
             return;
        }
        // Check for open ticket first
        const myTickets = await getMyTickets(user.id);
        const openTicket = myTickets.find(t => t.status === 'open');
        
        if (openTicket) {
            setActiveTicketId(openTicket.id);
            setView('chat');
        } else {
            // Create new
            setLoading(true);
            try {
                const newTicket = await createTicket(user.id);
                setActiveTicketId(newTicket.id);
                setView('chat');
            } catch (e) { 
                console.error(e); 
                alert("Murojaat yaratishda xatolik. Iltimos, sahifani yangilang.");
            }
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
            scrollToBottom();
        } catch (e) { console.error(e); }
    };

    const openHistoryTicket = (ticketId: number) => {
        setActiveTicketId(ticketId);
        setView('chat');
    };

    const handleBack = () => {
        if (view === 'chat') {
            setActiveTicketId(null);
            // If came from history, go back to history, else menu
            setView('menu'); 
        } else {
            setView('menu');
        }
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-16 h-16 bg-orange-600 hover:bg-orange-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 z-50 animate-bounce"
            >
                <ChatIcon />
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-80 md:w-96 h-[500px] bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 animate-fade-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-600 to-red-600 p-4 flex justify-between items-center text-white">
                <div className="flex items-center gap-2">
                    {view !== 'menu' && (
                        <button onClick={handleBack} className="p-1 hover:bg-white/20 rounded-full">
                            <ChevronLeft size={20} />
                        </button>
                    )}
                    <h3 className="font-bold text-lg">Yordam Markazi</h3>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-full">
                    <X size={20} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-gray-800 relative">
                
                {/* MENU VIEW */}
                {view === 'menu' && (
                    <div className="p-6 flex flex-col gap-4 h-full justify-center">
                        <button onClick={() => setView('news')} className="flex items-center gap-4 p-4 bg-gray-700 hover:bg-gray-600 rounded-xl transition-all group">
                            <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Newspaper size={24} />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-white">Yangiliklar</p>
                                <p className="text-xs text-gray-400">Saytdagi o'zgarishlar</p>
                            </div>
                        </button>
                        
                        <button onClick={handleStartChat} className="flex items-center gap-4 p-4 bg-gray-700 hover:bg-gray-600 rounded-xl transition-all group">
                            <div className="w-12 h-12 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <MessageSquare size={24} />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-white">Bog'lanish (Chat)</p>
                                <p className="text-xs text-gray-400">Admin bilan yozishish</p>
                            </div>
                        </button>

                        <button onClick={() => setView('history')} className="flex items-center gap-4 p-4 bg-gray-700 hover:bg-gray-600 rounded-xl transition-all group">
                            <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <History size={24} />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-white">Murojaatlar Tarixi</p>
                                <p className="text-xs text-gray-400">Eski suhbatlar</p>
                            </div>
                        </button>
                    </div>
                )}

                {/* NEWS VIEW */}
                {view === 'news' && (
                    <div className="p-4 space-y-4">
                        <h2 className="text-xl font-bold text-white mb-4">So'nggi Yangiliklar</h2>
                        {loading ? <LoadingSpinner /> : (
                            <>
                                {newsList.length === 0 && <p className="text-gray-500 text-center">Yangiliklar yo'q.</p>}
                                {newsList.map(news => (
                                    <div key={news.id} className="bg-gray-700 p-4 rounded-lg">
                                        <h4 className="font-bold text-orange-400">{news.title}</h4>
                                        <p className="text-sm text-gray-300 mt-2">{news.content}</p>
                                        <p className="text-xs text-gray-500 mt-2 text-right">{new Date(news.created_at).toLocaleDateString()}</p>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                )}

                {/* HISTORY VIEW */}
                {view === 'history' && (
                    <div className="p-4 space-y-2">
                        <h2 className="text-xl font-bold text-white mb-4">Mening Murojaatlarim</h2>
                        {loading ? <LoadingSpinner /> : (
                            <>
                                {tickets.length === 0 && <p className="text-gray-500 text-center">Murojaatlar tarixi bo'sh.</p>}
                                {tickets.map(t => (
                                    <button key={t.id} onClick={() => openHistoryTicket(t.id)} className="w-full bg-gray-700 p-3 rounded-lg text-left hover:bg-gray-600 transition-colors">
                                        <div className="flex justify-between">
                                            <span className="font-bold text-white text-sm">Murojaat #{t.id}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${t.status === 'open' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>{t.status === 'open' ? 'Ochiq' : 'Yopiq'}</span>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">{new Date(t.created_at).toLocaleDateString()}</p>
                                    </button>
                                ))}
                            </>
                        )}
                    </div>
                )}

                {/* CHAT VIEW */}
                {view === 'chat' && (
                    <div className="flex flex-col h-full">
                        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                            {loading && messages.length === 0 && <LoadingSpinner />}
                            {messages.length === 0 && !loading && <p className="text-gray-500 text-center text-sm mt-10">Xabarlar yo'q. Birinchi bo'lib yozing!</p>}
                            {messages.map((msg) => {
                                const isMe = !msg.is_admin;
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] p-3 rounded-xl text-sm ${isMe ? 'bg-orange-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                                            {msg.message}
                                            <p className="text-[9px] opacity-50 text-right mt-1">{new Date(msg.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                                        </div>
                                    </div>
                                )
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                        <form onSubmit={handleSendMessage} className="p-3 bg-gray-900 border-t border-gray-700 flex gap-2">
                            <input 
                                type="text" 
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                placeholder="Xabar yozing..."
                                className="flex-1 bg-gray-800 border border-gray-700 rounded-full px-4 py-2 text-sm text-white focus:ring-1 focus:ring-orange-500 focus:outline-none"
                            />
                            <button type="submit" disabled={!newMessage.trim()} className="p-2 bg-orange-600 hover:bg-orange-700 rounded-full text-white disabled:opacity-50">
                                <Send size={18} />
                            </button>
                        </form>
                    </div>
                )}

            </div>
        </div>
    );
};
