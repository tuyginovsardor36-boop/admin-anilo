
import React, { useState, useEffect, useRef } from 'react';
import { getAllTickets, getTicketMessages, sendMessage, getNews, createNews, deleteNews } from './services/dbService';
import { SupportTicket, TicketMessage, News } from './types';
import { LoadingSpinner } from './components/LoadingSpinner';
import { UserIcon } from './components/icons/UserIcon';
import { Send, Newspaper, MessageSquare, Trash2, Plus } from 'lucide-react';
import { supabase } from './services/supabaseClient';
import { useNotification } from './hooks/useNotification';

export const SupportPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'chat' | 'news'>('chat');
    
    // Chat State
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [activeTicketId, setActiveTicketId] = useState<number | null>(null);
    const [messages, setMessages] = useState<TicketMessage[]>([]);
    const [adminId, setAdminId] = useState<string>('');
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // News State
    const [newsList, setNewsList] = useState<News[]>([]);
    const [newsTitle, setNewsTitle] = useState('');
    const [newsContent, setNewsContent] = useState('');
    const [isAddingNews, setIsAddingNews] = useState(false);

    const { addNotification } = useNotification();

    useEffect(() => {
        const getAdmin = async () => {
            const { data } = await supabase.auth.getUser();
            if (data.user) setAdminId(data.user.id);
        }
        getAdmin();
        loadTickets();
        loadNews();
    }, []);

    useEffect(() => {
        if (activeTicketId) {
            loadMessages(activeTicketId);
            const interval = setInterval(() => loadMessages(activeTicketId, false), 3000); // Poll for new user messages
            return () => clearInterval(interval);
        }
    }, [activeTicketId]);

    const loadTickets = async () => {
        try {
            const data = await getAllTickets();
            setTickets(data);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const loadNews = async () => {
        try {
            const data = await getNews();
            setNewsList(data);
        } catch (e) { console.error(e); }
    };

    const loadMessages = async (ticketId: number, showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const data = await getTicketMessages(ticketId);
            setMessages(data);
            if (showLoading) setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        } catch (e) { console.error(e); }
        if (showLoading) setLoading(false);
    }

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeTicketId) return;
        
        try {
            await sendMessage(activeTicketId, adminId, newMessage, true); // true = sent by admin
            setNewMessage('');
            loadMessages(activeTicketId, false);
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        } catch (e) { console.error(e); }
    };

    const handleCreateNews = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newsTitle || !newsContent) return;
        
        try {
            await createNews(newsTitle, newsContent);
            addNotification({ type: 'success', title: 'Qo\'shildi', message: 'Yangilik muvaffaqiyatli chop etildi.' });
            setNewsTitle('');
            setNewsContent('');
            setIsAddingNews(false);
            loadNews();
        } catch (e: any) {
            addNotification({ type: 'error', title: 'Xatolik', message: e.message || 'Yangilik qo\'shishda xatolik.' });
        }
    };

    const handleDeleteNews = async (id: number) => {
        if (!window.confirm("Ushbu yangilikni o'chirmoqchimisiz?")) return;
        try {
            await deleteNews(id);
            setNewsList(prev => prev.filter(n => n.id !== id));
            addNotification({ type: 'success', title: 'O\'chirildi', message: 'Yangilik o\'chirildi.' });
        } catch (e: any) {
            addNotification({ type: 'error', title: 'Xatolik', message: 'O\'chirishda xatolik.' });
        }
    };

    return (
        <div className="animate-fade-in h-[calc(100vh-100px)] flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-white">Murojaatlar va Yangiliklar</h1>
                
                {/* Tabs */}
                <div className="flex bg-gray-800 rounded-lg p-1">
                    <button 
                        onClick={() => setActiveTab('chat')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${activeTab === 'chat' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        <MessageSquare size={18} />
                        <span>Chat</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('news')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${activeTab === 'news' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        <Newspaper size={18} />
                        <span>Yangiliklar</span>
                    </button>
                </div>
            </div>

            {activeTab === 'chat' && (
                <div className="flex-1 flex bg-gray-800/70 rounded-lg overflow-hidden border border-gray-700">
                    {/* Ticket List (Sidebar) */}
                    <div className="w-1/3 border-r border-gray-700 flex flex-col">
                        <div className="p-4 bg-gray-800 font-semibold text-gray-300 border-b border-gray-700">
                            Barcha Murojaatlar ({tickets.length})
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {tickets.map(ticket => (
                                <div 
                                    key={ticket.id} 
                                    onClick={() => setActiveTicketId(ticket.id)}
                                    className={`p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors ${activeTicketId === ticket.id ? 'bg-gray-700 border-l-4 border-l-orange-500' : ''}`}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-white text-sm">{ticket.profiles?.full_name || 'Foydalanuvchi'}</span>
                                        <span className="text-xs text-gray-500">{new Date(ticket.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-xs text-gray-400">Ticket #{ticket.id}</p>
                                    <div className={`inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full ${ticket.status === 'open' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                        {ticket.status === 'open' ? 'Ochiq' : 'Yopiq'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Chat Window */}
                    <div className="w-2/3 flex flex-col bg-gray-900/50">
                        {activeTicketId ? (
                            <>
                                <div className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
                                    <h3 className="font-bold text-white">Murojaat #{activeTicketId}</h3>
                                    <span className="text-xs text-gray-400">Real vaqtda chat</span>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {messages.length === 0 && <p className="text-center text-gray-500 text-sm">Xabarlar yo'q</p>}
                                    {messages.map(msg => {
                                        const isAdmin = msg.is_admin;
                                        return (
                                            <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`flex gap-2 max-w-[80%] ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
                                                    <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                                                        <UserIcon className="w-4 h-4 text-gray-300" />
                                                    </div>
                                                    <div>
                                                        <div className={`p-3 rounded-lg text-sm ${isAdmin ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                                                            {msg.message}
                                                        </div>
                                                        <p className={`text-[10px] text-gray-500 mt-1 ${isAdmin ? 'text-right' : 'text-left'}`}>
                                                            {new Date(msg.created_at).toLocaleTimeString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                <form onSubmit={handleSend} className="p-4 bg-gray-800 border-t border-gray-700 flex gap-2">
                                    <input 
                                        type="text" 
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        placeholder="Javob yozing..."
                                        className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
                                    />
                                    <button type="submit" className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white">
                                        <Send size={20} />
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-500 flex-col">
                                <div className="bg-gray-800 p-4 rounded-full mb-4">
                                    <UserIcon className="w-8 h-8" />
                                </div>
                                <p>Chatni boshlash uchun chap tomondan murojaatni tanlang.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'news' && (
                <div className="flex-1 overflow-y-auto">
                    <div className="flex justify-end mb-4">
                        <button 
                            onClick={() => setIsAddingNews(!isAddingNews)}
                            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors font-semibold"
                        >
                            <Plus size={20} />
                            {isAddingNews ? "Bekor qilish" : "Yangilik Qo'shish"}
                        </button>
                    </div>

                    {isAddingNews && (
                        <form onSubmit={handleCreateNews} className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-6 animate-fade-in">
                            <h3 className="text-xl font-bold text-white mb-4">Yangi e'lon yozish</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Sarlavha</label>
                                    <input 
                                        type="text" 
                                        value={newsTitle}
                                        onChange={e => setNewsTitle(e.target.value)}
                                        placeholder="Masalan: Saytda texnik ishlar"
                                        required
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Mazmun</label>
                                    <textarea 
                                        value={newsContent}
                                        onChange={e => setNewsContent(e.target.value)}
                                        placeholder="Xabar matnini kiriting..."
                                        required
                                        rows={4}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
                                    />
                                </div>
                                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold">
                                    Chop etish
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="grid gap-4">
                        {newsList.length === 0 && (
                            <div className="text-center py-10 text-gray-500">Hozircha yangiliklar yo'q.</div>
                        )}
                        {newsList.map(news => (
                            <div key={news.id} className="bg-gray-800/50 border border-gray-700 p-5 rounded-xl flex justify-between items-start group hover:border-gray-600 transition-colors">
                                <div>
                                    <h3 className="text-lg font-bold text-orange-400 mb-2">{news.title}</h3>
                                    <p className="text-gray-300 text-sm whitespace-pre-wrap">{news.content}</p>
                                    <p className="text-xs text-gray-500 mt-3">{new Date(news.created_at).toLocaleString()}</p>
                                </div>
                                <button 
                                    onClick={() => handleDeleteNews(news.id)}
                                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                    title="O'chirish"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
