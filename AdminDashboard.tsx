
import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import { 
    Users, Film, CreditCard, MessageSquare, TrendingUp, AlertCircle, 
    Check, X as XIcon, Eye, RefreshCw, Lock, Unlock, Layers, Sparkles, Terminal, Activity, ArrowUpRight
} from 'lucide-react';
import { LoadingSpinner } from './components/LoadingSpinner';
import { getDashboardStats, getPendingFandubUploads, approveFandubUpload, rejectFandubUpload, toggleBlockFandub, getAllUsers, getPaymentRequests } from './services/dbService';
import { runAiServerManager, isAiPilotEnabled, setAiPilotEnabled } from './services/aiGuardService';
import { FandubUpload, UserProfile, PaymentRequestDB } from './types';
import { useNotification } from './hooks/useNotification';

const StatCard: React.FC<{ label: string, value: number, icon: React.ReactNode, color: string }> = ({ label, value, icon, color }) => (
    <div className="relative group bg-[#0a0a0a] border border-white/5 p-6 rounded-[2.5rem] overflow-hidden hover:border-orange-500/30 transition-all duration-500">
        <div className={`absolute -right-6 -top-6 w-32 h-32 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 rounded-full blur-3xl transition-opacity`}></div>
        
        <div className="flex justify-between items-start mb-6">
            <div className={`p-4 bg-black/50 border border-white/5 rounded-2xl group-hover:scale-110 transition-transform duration-500 shadow-xl`}>
                {icon}
            </div>
            <ArrowUpRight className="text-zinc-800 group-hover:text-orange-500 transition-colors" size={20} />
        </div>
        
        <h3 className="text-3xl font-black text-white tracking-tighter mb-1">{value.toLocaleString()}</h3>
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{label}</p>
    </div>
);

export const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [pendingUploads, setPendingUploads] = useState<FandubUpload[]>([]);
    const [recentUsers, setRecentUsers] = useState<UserProfile[]>([]);
    const [recentPayments, setRecentPayments] = useState<PaymentRequestDB[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    const [isAiPilotActive, setIsAiPilotActive] = useState(isAiPilotEnabled());
    const [aiLogs, setAiLogs] = useState<{time: string, msg: string, type: 'info'|'action'}[]>([]);
    const [isAiThinking, setIsAiThinking] = useState(false);

    const { addNotification } = useNotification();

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setRefreshing(true);
        try {
            const [d, u, users, payments] = await Promise.all([
                getDashboardStats(),
                getPendingFandubUploads(),
                getAllUsers(),
                getPaymentRequests()
            ]);
            setStats(d);
            setPendingUploads(u);
            setRecentUsers(users.slice(0, 5));
            setRecentPayments(payments.slice(0, 5));
        } catch (e) { console.error(e); }
        finally { 
            setLoading(false); 
            setRefreshing(false);
        }
    };

    const handleToggleAiPilot = () => {
        const newState = !isAiPilotActive;
        setIsAiPilotActive(newState);
        setAiPilotEnabled(newState);
        addNotification({ type: 'info', title: 'AI Pilot', message: newState ? 'AI Pilot tizimi faollashtirildi.' : 'AI Pilot o\'chirildi.' });
    };

    const handleRunAiGuard = async () => {
        setIsAiThinking(true);
        const context = `Hozirgi holat: ${pendingUploads.length} ta tasdiqlanmagan fandub. Statistika: ${stats?.users} users.`;
        const result = await runAiServerManager(context);
        if (result) {
            const newLogs: any[] = [];
            result.actions.forEach(a => newLogs.push({ time: new Date().toLocaleTimeString(), msg: a, type: 'action' }));
            if (result.analysis) newLogs.push({ time: new Date().toLocaleTimeString(), msg: result.analysis, type: 'info' });
            setAiLogs(prev => [...newLogs, ...prev].slice(0, 15));
            if (result.actions.length > 0) loadData();
        }
        setIsAiThinking(false);
    };

    if (loading) return <div className="h-full flex items-center justify-center py-20"><LoadingSpinner /></div>;

    return (
        <div className="animate-fade-in space-y-10 pb-20 max-w-7xl mx-auto">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Xush Kelibsiz!</h1>
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-[9px] mt-2 border-l-2 border-orange-600 pl-3">Tizim nazorati va moderatsiya paneli</p>
                </div>
                
                <div className="flex gap-4">
                    <div className={`flex items-center gap-4 p-1 pr-4 rounded-2xl border transition-all duration-500 ${isAiPilotActive ? 'bg-orange-600/10 border-orange-500/50' : 'bg-zinc-900 border-white/5'}`}>
                        <button 
                            onClick={handleToggleAiPilot}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isAiPilotActive ? 'bg-orange-600 text-white shadow-xl shadow-orange-500/50' : 'bg-zinc-800 text-zinc-500'}`}
                        >
                            <Sparkles size={16} className={isAiPilotActive ? 'animate-pulse' : ''} />
                        </button>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase tracking-widest text-white">AI Server Guard</span>
                            <span className={`text-[8px] font-bold ${isAiPilotActive ? 'text-orange-500' : 'text-zinc-600'}`}>{isAiPilotActive ? 'ACTIVE MONITORING' : 'STANDBY'}</span>
                        </div>
                    </div>
                </div>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <StatCard label="Jami Foydalanuvchi" value={stats?.users || 0} icon={<Users size={20} className="text-blue-500" />} color="from-blue-600 to-transparent" />
                <StatCard label="Anime Katalog" value={stats?.movies || 0} icon={<Film size={20} className="text-orange-500" />} color="from-orange-600 to-transparent" />
                <StatCard label="To'lovlar (Jami)" value={stats?.payments || 0} icon={<CreditCard size={20} className="text-green-500" />} color="from-green-600 to-transparent" />
                <StatCard label="Ochiq Ticketlar" value={stats?.tickets || 0} icon={<MessageSquare size={20} className="text-red-500" />} color="from-red-600 to-transparent" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* MODERATION TABLE */}
                <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden shadow-xl">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#0d0d0d]">
                        <div className="flex items-center gap-3">
                            <Activity className="text-orange-500" size={16}/>
                            <h2 className="text-lg font-black uppercase tracking-tight text-white">Fandub Moderatsiyasi</h2>
                        </div>
                        <span className="px-2 py-0.5 bg-zinc-900 rounded-full text-[9px] font-black text-zinc-500 uppercase tracking-widest">{pendingUploads.length} TA KUTILMOQDA</span>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#151515] text-zinc-400 text-[9px] font-black uppercase tracking-[0.2em] border-b border-white/10">
                                <tr>
                                    <th className="p-4">Ma'lumot</th>
                                    <th className="p-4">Studio</th>
                                    <th className="p-4 text-right">Amal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {pendingUploads.length === 0 ? (
                                    <tr><td colSpan={3} className="p-12 text-center text-zinc-700 font-black uppercase text-[10px] tracking-widest">Kutilayotgan loyihalar yo'q</td></tr>
                                ) : pendingUploads.map(up => (
                                    <tr key={up.id} className="group hover:bg-white/[0.03] transition-all">
                                        <td className="p-4 flex items-center gap-3">
                                            <img src={up.poster_url} className="w-10 h-14 rounded-lg object-cover shadow-xl border border-white/10" alt="" />
                                            <div>
                                                <p className="text-xs font-bold text-white uppercase tracking-tight truncate max-w-[120px]">{up.title}</p>
                                                <p className="text-[9px] font-bold text-zinc-500 uppercase mt-0.5">{up.genre.split(',')[0]} • {up.year}</p>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <span className="w-1 h-1 rounded-full bg-purple-600"></span>
                                                <p className="text-[10px] font-bold text-purple-300 uppercase">{(up as any).fandub_channels?.name || 'Ijodkor'}</p>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => approveFandubUpload(up.id).then(loadData)} className="p-2 bg-green-900/20 hover:bg-green-600 text-green-500 hover:text-white rounded-xl transition-all shadow-md border border-green-500/20"><Check size={14}/></button>
                                                <button onClick={() => toggleBlockFandub(up.id, true).then(loadData)} className="p-3 bg-red-900/20 hover:bg-red-600 text-red-500 hover:text-white rounded-xl transition-all shadow-md border border-red-500/20"><XIcon size={14}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* AI LOGS TERMINAL */}
                <div className="bg-black border border-white/5 rounded-3xl p-6 flex flex-col shadow-xl h-full min-h-[400px]">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                        <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] flex items-center gap-2">
                            <Terminal size={14} className="text-orange-500" /> AI Server Terminal
                        </h3>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-2 font-mono text-[9px] custom-scrollbar">
                        {aiLogs.length === 0 && <p className="text-zinc-800 animate-pulse italic">Tizim holati tekshirilmoqda...</p>}
                        {aiLogs.map((log, i) => (
                            <div key={i} className={`p-2 rounded-xl border ${log.type === 'action' ? 'bg-orange-600/10 border-orange-500/20 text-orange-400' : 'bg-zinc-900/50 border-white/5 text-zinc-600'}`}>
                                <div className="flex justify-between items-center mb-0.5">
                                    <span className="opacity-40 uppercase font-black text-[7px]">{log.type}</span>
                                    <span className="opacity-30">{log.time}</span>
                                </div>
                                <p className="leading-relaxed">{log.msg}</p>
                            </div>
                        ))}
                    </div>

                    <button 
                        onClick={handleRunAiGuard}
                        disabled={isAiThinking}
                        className={`mt-4 w-full py-3 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all flex items-center justify-center gap-2 border ${isAiThinking ? 'bg-orange-600/20 border-orange-500/50 text-orange-500 animate-pulse' : 'bg-white/5 border-white/10 text-zinc-500 hover:text-white hover:bg-white/10'}`}
                    >
                        {isAiThinking ? <RefreshCw className="animate-spin" size={12}/> : <Sparkles size={12}/>}
                        {isAiThinking ? 'AI TAHLIL QILMOQDA' : 'MANUAL AI CHECK'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* RECENT USERS */}
                <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden shadow-xl">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#0d0d0d]">
                        <div className="flex items-center gap-3">
                            <Users className="text-blue-500" size={16}/>
                            <h2 className="text-lg font-black uppercase tracking-tight text-white">Yangi Foydalanuvchilar</h2>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#151515] text-zinc-400 text-[9px] font-black uppercase tracking-[0.2em] border-b border-white/10">
                                <tr>
                                    <th className="p-4">Foydalanuvchi</th>
                                    <th className="p-4">Sana</th>
                                    <th className="p-4">Rol</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {recentUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-white/[0.03] transition-all">
                                        <td className="p-4 flex items-center gap-3">
                                            <img src={user.avatar_url || ''} className="w-8 h-8 rounded-lg object-cover bg-zinc-800" alt="" />
                                            <div>
                                                <p className="text-xs font-bold text-white uppercase truncate max-w-[100px]">{user.full_name || 'Anonymous'}</p>
                                                <p className="text-[9px] font-bold text-zinc-600 uppercase">@{user.username || 'user'}</p>
                                            </div>
                                        </td>
                                        <td className="p-4 text-[9px] font-bold text-zinc-500 uppercase">{new Date(user.created_at).toLocaleDateString()}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${user.role === 'owner' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* RECENT PAYMENTS */}
                <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden shadow-xl">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#0d0d0d]">
                        <div className="flex items-center gap-3">
                            <CreditCard className="text-green-500" size={16}/>
                            <h2 className="text-lg font-black uppercase tracking-tight text-white">So'nggi To'lovlar</h2>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#151515] text-zinc-400 text-[9px] font-black uppercase tracking-[0.2em] border-b border-white/10">
                                <tr>
                                    <th className="p-4">Foydalanuvchi</th>
                                    <th className="p-4">Summa</th>
                                    <th className="p-4">Holat</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {recentPayments.map(pay => (
                                    <tr key={pay.id} className="hover:bg-white/[0.03] transition-all">
                                        <td className="p-4">
                                            <p className="text-xs font-bold text-white uppercase truncate max-w-[100px]">{pay.profiles?.full_name || 'Foydalanuvchi'}</p>
                                            <p className="text-[9px] font-bold text-zinc-600 uppercase">{new Date(pay.created_at).toLocaleDateString()}</p>
                                        </td>
                                        <td className="p-4 font-bold text-green-500 text-xs">{pay.amount.toLocaleString()} <span className="text-[8px]">UZS</span></td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${pay.status === 'approved' ? 'bg-green-500/20 text-green-400' : pay.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                                                {pay.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
