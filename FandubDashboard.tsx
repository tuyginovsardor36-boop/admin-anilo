
import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import { UserProfile, FandubUpload, FandubChannel, FandubEarning, FandubWithdrawal } from './types';
import { 
    getUserProfile, getFandubChannel, updateFandubChannel, 
    getFandubUploads, uploadPoster, uploadVideo, 
    deleteFandubUpload, getFandubEarnings, getFandubWithdrawals, 
    requestFandubWithdrawal, updateFandubUpload, getFandubStatsSummary,
    getLiveStreams, normalizeUrl
} from './services/dbService';
import { 
    Mic, Film, Settings, LayoutGrid, Eye, Edit3, 
    Trash2, Clock, CheckCircle, XCircle, Plus, Activity, 
    TrendingUp, Wallet, ArrowUpRight, BarChart3, Globe, 
    Instagram, Send, Save, ChevronRight, Share2, Info, BarChart2
} from 'lucide-react';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useNotification } from './hooks/useNotification';
import { AddFandubUploadModal } from './components/AddFandubUploadModal';

const StatusBadge = ({ status, comment }: { status: string, comment?: string }) => {
    switch (status) {
        case 'approved': return <span className="bg-green-600/20 text-green-400 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-green-500/30 flex items-center gap-1"><CheckCircle size={10}/> Faol</span>;
        case 'rejected': return <span className="bg-red-600/20 text-red-400 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-red-500/30 flex items-center gap-1" title={comment}><XCircle size={10}/> Rad etilgan</span>;
        default: return <span className="bg-yellow-600/20 text-yellow-400 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-yellow-500/30 flex items-center gap-1 animate-pulse"><Clock size={10}/> Kutilmoqda</span>;
    }
};

export const FandubDashboard: React.FC = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [channel, setChannel] = useState<FandubChannel | null>(null);
    const [myUploads, setMyUploads] = useState<FandubUpload[]>([]);
    const [earnings, setEarnings] = useState<FandubEarning[]>([]);
    const [withdrawals, setWithdrawals] = useState<FandubWithdrawal[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [isLive, setIsLive] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'analytics' | 'wallet' | 'settings'>('overview');
    
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [editingProject, setEditingProject] = useState<any>(null);
    const { addNotification } = useNotification();

    const [wAmount, setWAmount] = useState('');
    const [wCard, setWCard] = useState('');
    const [wHolder, setWHolder] = useState('');

    const currentBalance = channel?.balance_usd || 0;

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const [p, c, u, streams] = await Promise.all([
                getUserProfile(user.id),
                getFandubChannel(user.id),
                getFandubUploads(user.id),
                getLiveStreams()
            ]);
            setProfile(p as UserProfile);
            setChannel(c);
            setMyUploads(u || []);
            setIsLive(streams.some(s => s.streamer_id === user.id));
            if (c) { 
                const [e, w, s] = await Promise.all([
                    getFandubEarnings(c.id),
                    getFandubWithdrawals(c.id),
                    getFandubStatsSummary(c.id)
                ]);
                setEarnings(e);
                setWithdrawals(w);
                setStats(s);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!channel || !profile) return;
        const amt = Number(wAmount);
        if (amt < 10 || amt > channel.balance_usd) return addNotification({ type: 'error', title: 'Xatolik', message: 'Summa noto\'g\'ri (Min $10)' });
        
        try {
            await requestFandubWithdrawal(channel.id, profile.id, amt, wCard, wHolder);
            addNotification({ type: 'success', title: 'So\'rov yuborildi', message: '24 soat ichida ko\'rib chiqiladi.' });
            setWAmount(''); setWCard(''); setWHolder('');
            loadData();
        } catch (e: any) { addNotification({ type: 'error', title: 'Xatolik', message: e.message }); }
    };

    const handleUpdateSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!channel) return;
        try {
            await updateFandubChannel(channel.id, { 
                name: channel.name, 
                bio: channel.bio, 
                social_links: channel.social_links 
            });
            addNotification({ type: 'success', title: 'Saqlandi', message: 'Kanal ma\'lumotlari yangilandi.' });
        } catch (e) { console.error(e); }
    };

    const handleEditProject = (project: FandubUpload) => {
        setEditingProject({
            id: project.id,
            title: project.title,
            year: project.year,
            genre: project.genre,
            desc: project.description,
            access: project.access_type,
            tags: project.tags,
            is_series: project.is_series,
            posterUrl: project.poster_url,
            posterType: 'url',
            episodes: project.episodes
        });
        setIsUploadModalOpen(true);
    };

    const handleSaveProject = async (data: any) => {
        setIsUploading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !channel) return;

            let posterUrl = data.posterUrl;
            let posterId = data.posterId;
            if (data.posterType === 'file' && data.posterFile) {
                const res = await uploadPoster(data.posterFile);
                posterUrl = res.url;
                posterId = res.id;
            }

            const processedEpisodes = await Promise.all(data.episodes.map(async (ep: any) => {
                if (ep.type === 'file' && ep.source instanceof File) {
                    const res = await uploadVideo(ep.source);
                    return { title: ep.title, source: normalizeUrl(res.url), video_id: res.id };
                }
                return { title: ep.title, source: normalizeUrl(ep.source), video_id: ep.video_id };
            }));

            const payload = {
                title: data.title,
                description: data.desc,
                poster_url: normalizeUrl(posterUrl),
                poster_id: posterId,
                genre: data.genre,
                year: data.year,
                access_type: data.access,
                episodes: processedEpisodes,
                tags: data.tags,
                is_series: data.is_series,
                video_url: normalizeUrl(processedEpisodes[0]?.source || ''),
                video_id: processedEpisodes[0]?.video_id || '',
                status: 'pending'
            };

            if (data.id) {
                await updateFandubUpload(data.id, payload);
                addNotification({ type: 'success', title: 'Yangilandi', message: 'Loyiha qayta moderatsiyaga yuborildi.' });
            } else {
                await supabase.from('fandub_uploads').insert({ ...payload, user_id: user.id, channel_id: channel.id });
                addNotification({ type: 'success', title: 'Yuborildi', message: 'Yangi loyiha moderatsiyaga yuborildi.' });
            }

            setIsUploadModalOpen(false);
            setEditingProject(null);
            loadData();
        } catch (e: any) { addNotification({ type: 'error', title: 'Xatolik', message: e.message }); }
        finally { setIsUploading(false); }
    };

    const handleDeleteProject = async (id: number) => {
        if (!window.confirm("Haqiqatan ham o'chirmoqchimisiz?")) return;
        try {
            await deleteFandubUpload(id);
            addNotification({ type: 'warning', title: 'O\'chirildi', message: 'Loyiha o\'chirildi.' });
            loadData();
        } catch (e) { console.error(e); }
    };

    const navItems = [
        { id: 'overview', label: 'Studio', icon: <LayoutGrid size={18}/> },
        { id: 'content', label: 'Animelar', icon: <Film size={18}/> },
        { id: 'analytics', label: 'Tahlil', icon: <BarChart2 size={18}/> },
        { id: 'wallet', label: 'Hamyon', icon: <Wallet size={18}/> },
        { id: 'settings', label: 'Sozlama', icon: <Settings size={18}/> },
    ];

    if (loading) return <div className="h-screen flex items-center justify-center bg-[#050505]"><LoadingSpinner /></div>;

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col lg:flex-row pb-24 lg:pb-0 font-sans">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-72 bg-[#0a0a0a] border-r border-white/5 p-6 flex-col sticky top-0 h-screen">
                <div className="flex flex-col items-center mb-10">
                    <div className="w-24 h-24 rounded-3xl p-1 bg-gradient-to-tr from-purple-600 via-orange-500 to-red-600 mb-4 shadow-2xl relative">
                        <div className="w-full h-full rounded-[1.3rem] bg-black overflow-hidden border-2 border-black">
                            <img src={channel?.avatar_url || profile?.avatar_url || ''} className="w-full h-full object-cover" alt="" />
                        </div>
                        {channel?.is_verified && <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1 border-2 border-black"><CheckCircle size={14} fill="white" className="text-blue-500"/></div>}
                        {isLive && <div className="absolute -top-1 -left-1 bg-red-600 text-[8px] font-black px-2 py-0.5 rounded-full border-2 border-black animate-pulse">LIVE</div>}
                    </div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-center truncate w-full px-2">{channel?.name}</h3>
                    <p className="text-[8px] font-black text-zinc-600 tracking-widest mt-1 uppercase">Ijodkor</p>
                </div>
                <nav className="space-y-1">
                    {navItems.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === tab.id ? 'bg-orange-600 text-white shadow-xl shadow-orange-900/20 translate-x-2' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </nav>
                <div className="mt-auto">
                    <button onClick={() => window.location.href = '/'} className="w-full py-4 bg-zinc-900 text-zinc-500 rounded-2xl font-black uppercase text-[9px] tracking-widest border border-white/5 hover:text-white transition-all">Studio-dan chiqish</button>
                </div>
            </aside>

            {/* Mobile Bottom Nav - Z-INDEX OSHIRILDI (z-50 -> z-[150]) */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[150] bg-[#0a0a0a]/98 backdrop-blur-2xl border-t border-white/10 h-20 flex justify-around items-center px-2 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
                {navItems.map(tab => (
                    <button 
                        key={tab.id} 
                        onClick={() => {
                            setActiveTab(tab.id as any);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }} 
                        className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all active:scale-90 ${activeTab === tab.id ? 'text-orange-500' : 'text-zinc-500'}`}
                    >
                        <div className={`p-2 rounded-xl transition-all ${activeTab === tab.id ? 'bg-orange-500/10 scale-110' : ''}`}>
                            {tab.icon}
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-tighter">{tab.label}</span>
                    </button>
                ))}
            </nav>

            <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto custom-scrollbar">
                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
                        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                            <div>
                                <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">Studio Overview</h1>
                                <p className="text-zinc-500 text-xs mt-2 border-l-2 border-orange-600 pl-3 uppercase tracking-widest font-black">Xush kelibsiz, {profile?.full_name?.split(' ')[0]}!</p>
                            </div>
                            <button onClick={() => { setEditingProject(null); setIsUploadModalOpen(true); }} className="w-full sm:w-auto px-8 py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"><Plus size={18}/> Yangi Loyiha</button>
                        </header>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[2rem] hover:border-orange-500/30 transition-all">
                                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-3">Ko'rishlar</p>
                                <h3 className="text-2xl md:text-4xl font-black">{(channel?.total_views || 0).toLocaleString()}</h3>
                                <p className="text-[8px] text-green-400 font-bold mt-2 flex items-center gap-1"><Activity size={10}/> LIVE</p>
                            </div>
                            <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[2rem]">
                                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-3">Muxlislar</p>
                                <h3 className="text-2xl md:text-4xl font-black">{(channel?.subscriber_count || 0).toLocaleString()}</h3>
                            </div>
                            <div className="bg-orange-600/10 border border-orange-500/20 p-6 rounded-[2rem]">
                                <p className="text-[8px] font-black text-orange-400 uppercase tracking-widest mb-3">Balans (USD)</p>
                                <h3 className="text-2xl md:text-4xl font-black text-orange-500">${currentBalance.toFixed(2)}</h3>
                            </div>
                            <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[2rem]">
                                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-3">Animelar</p>
                                <h3 className="text-2xl md:text-4xl font-black">{myUploads.length}</h3>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-6 md:p-8">
                                <h4 className="text-base font-black uppercase tracking-tight mb-6 flex items-center gap-3"><TrendingUp className="text-green-500" size={18}/> Daromadlar</h4>
                                <div className="space-y-3">
                                    {earnings.slice(0, 5).map(e => (
                                        <div key={e.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-transparent hover:border-white/10 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-green-600/20 rounded-lg flex items-center justify-center text-green-500"><ArrowUpRight size={14}/></div>
                                                <div className="min-w-0"><p className="text-xs font-bold text-white uppercase truncate">{e.source}</p><p className="text-[8px] text-zinc-600 uppercase">{new Date(e.created_at).toLocaleDateString()}</p></div>
                                            </div>
                                            <span className="text-green-400 font-black text-sm">+$ {e.amount.toFixed(3)}</span>
                                        </div>
                                    ))}
                                    {earnings.length === 0 && <p className="text-center py-10 text-zinc-800 uppercase font-black text-[9px]">Tarix bo'sh</p>}
                                </div>
                            </div>
                            <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-6 md:p-8">
                                <h4 className="text-base font-black uppercase tracking-tight mb-6 flex items-center gap-3"><BarChart3 className="text-blue-500" size={18}/> Top Animelar</h4>
                                <div className="space-y-3">
                                    {myUploads.slice(0, 5).sort((a,b)=> (b.view_count||0) - (a.view_count||0)).map(m => (
                                        <div key={m.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-2xl border border-white/5">
                                            <img src={m.poster_url} className="w-10 h-14 rounded-xl object-cover" alt="" />
                                            <div className="flex-1 min-w-0"><p className="text-xs font-black text-white uppercase truncate">{m.title}</p><p className="text-[9px] text-zinc-500 mt-1 flex items-center gap-1"><Eye size={10}/> {(m.view_count || 0).toLocaleString()}</p></div>
                                            <div className="h-1 w-16 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-orange-500" style={{ width: `${Math.min(100, (m.view_count || 0) / 100)}%` }}></div></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'content' && (
                    <div className="animate-fade-in space-y-6 max-w-7xl mx-auto">
                        <div className="flex justify-between items-center">
                            <h2 className="text-3xl font-black uppercase tracking-tighter">Barcha Loyihalarim</h2>
                            <span className="px-4 py-1.5 bg-zinc-900 border border-white/5 rounded-full text-[10px] font-black text-zinc-500 uppercase">{myUploads.length} TA</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {myUploads.map(up => (
                                <div key={up.id} className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-5 space-y-5 group hover:border-orange-500/30 transition-all">
                                    <div className="flex gap-4">
                                        <img src={up.poster_url} className="w-24 h-32 rounded-2xl object-cover shadow-2xl" alt="" />
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-black text-white uppercase truncate tracking-tight">{up.title}</h4>
                                            <p className="text-[8px] font-black text-zinc-600 uppercase mt-1">{up.genre.split(',')[0]} • {up.year}</p>
                                            <div className="mt-4"><StatusBadge status={up.status} comment={up.admin_comment} /></div>
                                            <div className="mt-3 flex items-center gap-2 text-blue-500 font-black text-xs"><Eye size={12}/> {(up.view_count || 0).toLocaleString()}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 pt-4 border-t border-white/5">
                                        <button onClick={() => handleEditProject(up)} className="flex-1 py-3 bg-white/5 text-zinc-300 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-orange-600 hover:text-white transition-all"><Edit3 size={14}/> Tahrir</button>
                                        <button onClick={() => handleDeleteProject(up.id)} className="flex-1 py-3 bg-red-600/10 text-red-500 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition-all"><Trash2 size={14}/> O'chirish</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div className="animate-fade-in space-y-8 max-w-7xl mx-auto">
                        <h2 className="text-3xl font-black uppercase tracking-tighter">Batafsil Tahlil</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-8 min-h-[400px] flex flex-col">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-10 flex items-center justify-between">Haftalik Ko'rishlar <Clock size={16}/></h4>
                                <div className="flex-1 flex items-end gap-3 sm:gap-6 px-2">
                                    {[30, 60, 40, 85, 55, 75, 45].map((h, i) => (
                                        <div key={i} className="flex-1 bg-zinc-900 rounded-t-2xl relative group hover:bg-orange-600 transition-all" style={{ height: `${h}%` }}>
                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black text-[9px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap">{(h*254).toLocaleString()}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between mt-6 px-2 text-[9px] font-black text-zinc-700 uppercase tracking-widest">
                                    <span>Du</span><span>Se</span><span>Ch</span><span>Pa</span><span>Ju</span><span>Sha</span><span>Yak</span>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="bg-gradient-to-br from-blue-600/20 to-transparent border border-blue-500/20 p-8 rounded-[2.5rem]">
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Oylik O'sish</p>
                                    <h4 className="text-3xl font-black text-white">+12.5%</h4>
                                    <p className="text-xs text-zinc-500 mt-4 leading-relaxed">Kanalingiz o'tgan oyga qaraganda tezroq rivojlanmoqda.</p>
                                </div>
                                <div className="bg-gradient-to-br from-green-600/20 to-transparent border border-green-500/20 p-8 rounded-[2.5rem]">
                                    <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-2">Taxminiy Daromad</p>
                                    <h4 className="text-3xl font-black text-white">$ {stats?.lastMonthEarnings?.toFixed(2) || '0.00'}</h4>
                                    <p className="text-xs text-zinc-500 mt-4">Oxirgi 30 kun ichida tushgan mablag'.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'wallet' && (
                    <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 max-w-7xl mx-auto">
                        <div className="space-y-8">
                             <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-10 rounded-[3rem] shadow-3xl relative overflow-hidden">
                                 <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                 <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em] mb-4">Hozirgi Balans</p>
                                 <h3 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-12">$ {currentBalance.toFixed(2)}</h3>
                                 <div className="grid grid-cols-2 gap-4">
                                     <div className="bg-black/20 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 text-center"><p className="text-[8px] font-black uppercase text-white/50 tracking-widest mb-1">Yechilgan</p><p className="text-xl font-black text-white">$ {channel?.total_withdrawn?.toFixed(2) || '0.00'}</p></div>
                                     <div className="bg-black/20 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 text-center"><p className="text-[8px] font-black uppercase text-white/50 tracking-widest mb-1">Kutilmoqda</p><p className="text-xl font-black text-white">$ 0.00</p></div>
                                 </div>
                             </div>
                             <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-8 md:p-12 shadow-3xl">
                                 <h4 className="text-xl font-black uppercase tracking-tight text-white mb-10 border-l-4 border-purple-600 pl-6">Pul Yechish</h4>
                                 <form onSubmit={handleWithdraw} className="space-y-8">
                                     <div><label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-4 mb-2 block">Summa (USD)</label><div className="relative"><div className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-purple-500">$</div><input type="number" min="10" step="0.01" value={wAmount} onChange={e=>setWAmount(e.target.value)} placeholder="0.00" className="w-full bg-black border border-white/10 rounded-3xl py-6 pl-14 pr-8 text-white font-black text-3xl outline-none focus:border-purple-600" required /></div></div>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-2"><label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-4">Karta Raqami</label><input value={wCard} onChange={e=>setWCard(e.target.value)} placeholder="8600 ...." className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-5 text-white font-mono tracking-widest outline-none focus:border-purple-600" required /></div><div className="space-y-2"><label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-4">F.I.SH</label><input value={wHolder} onChange={e=>setWHolder(e.target.value)} placeholder="ISM FAMILIYA" className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-5 text-white uppercase font-black text-xs tracking-widest outline-none focus:border-purple-600" required /></div></div>
                                     <button type="submit" className="w-full py-6 bg-purple-600 text-white rounded-3xl font-black uppercase text-xs tracking-[0.3em] shadow-2xl hover:bg-purple-500 transition-all active:scale-95">So'rov yuborish</button>
                                 </form>
                             </div>
                        </div>
                        <div className="bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 h-fit shadow-2xl">
                            <h4 className="text-xl font-black uppercase tracking-tight text-white mb-8 border-l-4 border-blue-600 pl-4">To'lov Tarixi</h4>
                            <div className="space-y-4">
                                {withdrawals.map(w => (
                                    <div key={w.id} className="p-6 bg-white/5 rounded-[2rem] border border-white/5 flex justify-between items-center group hover:bg-white/10 transition-all">
                                        <div className="flex items-center gap-4"><div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:scale-110 transition-transform"><Clock size={20}/></div><div><p className="text-lg font-black text-white">$ {w.amount.toFixed(2)}</p><p className="text-[8px] text-zinc-600 font-mono">**** {w.card_number.slice(-4)} • {new Date(w.created_at).toLocaleDateString()}</p></div></div>
                                        <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${w.status==='approved' ? 'bg-green-600/10 text-green-500 border-green-500/20' : w.status==='rejected' ? 'bg-red-600/10 text-red-500 border-red-500/20' : 'bg-yellow-600/10 text-yellow-400 border-yellow-500/20'}`}>{w.status}</div>
                                    </div>
                                ))}
                                {withdrawals.length === 0 && <p className="text-center py-20 text-zinc-800 uppercase font-black text-[9px]">Tarix bo'sh</p>}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="animate-fade-in max-w-4xl mx-auto">
                        <div className="bg-[#0a0a0a] border border-white/10 rounded-[3.5rem] p-8 md:p-14 shadow-3xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-orange-600/5 rounded-full blur-[100px]"></div>
                            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white mb-10 border-l-4 border-orange-600 pl-8">Studio Sozlamalari</h2>
                            <form onSubmit={handleUpdateSettings} className="space-y-8">
                                <div className="space-y-3"><label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-4">Studio Nomi</label><input value={channel?.name || ''} onChange={e=>setChannel(channel?{...channel, name:e.target.value}:null)} className="w-full bg-zinc-900 border border-white/10 rounded-[2rem] p-6 text-white font-black text-xl md:text-2xl uppercase focus:border-orange-600 outline-none transition-all" /></div>
                                <div className="space-y-3"><label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-4">Studio Bio</label><textarea value={channel?.bio || ''} onChange={e=>setChannel(channel?{...channel, bio:e.target.value}:null)} className="w-full bg-zinc-900 border border-white/10 rounded-[2rem] p-8 text-white text-base h-48 resize-none font-medium leading-relaxed outline-none focus:border-orange-600 transition-all" placeholder="Studio faoliyati haqida..." /></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2"><label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-4 flex items-center gap-2"><Send size={12} className="text-blue-500"/> Telegram</label><input value={channel?.social_links?.telegram || ''} onChange={e=>setChannel(channel?{...channel, social_links:{...channel.social_links, telegram:e.target.value}}:null)} className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-5 text-white text-xs font-mono" placeholder="t.me/kanal" /></div>
                                    <div className="space-y-2"><label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-4 flex items-center gap-2"><Instagram size={12} className="text-pink-500"/> Instagram</label><input value={channel?.social_links?.instagram || ''} onChange={e=>setChannel(channel?{...channel, social_links:{...channel.social_links, instagram:e.target.value}}:null)} className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-5 text-white text-xs font-mono" placeholder="instagram.com/user" /></div>
                                </div>
                                <button type="submit" className="w-full py-6 bg-orange-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.4em] shadow-2xl hover:bg-orange-500 transition-all active:scale-95 flex items-center justify-center gap-4"><Save size={24}/> Saqlash</button>
                            </form>
                        </div>
                    </div>
                )}
            </main>

            {isUploadModalOpen && <AddFandubUploadModal initialData={editingProject} onClose={() => { setIsUploadModalOpen(false); setEditingProject(null); }} onSave={handleSaveProject} isUploading={isUploading} />}
        </div>
    );
};
