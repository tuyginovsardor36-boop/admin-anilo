
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { 
    Users, Film, CreditCard, MessageSquare, TrendingUp, AlertCircle, 
    Check, X as XIcon, Eye, RefreshCw, Lock, Unlock, Layers, Sparkles, Terminal
} from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import { getDashboardStats, getPendingFandubUploads, approveFandubUpload, rejectFandubUpload, toggleBlockFandub } from '../services/dbService';
import { runAiServerManager, isAiPilotEnabled, setAiPilotEnabled } from '../services/aiGuardService';
import { FandubUpload } from '../types';
import { useNotification } from '../hooks/useNotification';

export const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [pendingUploads, setPendingUploads] = useState<FandubUpload[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // AI Guard State
    const [isAiPilotActive, setIsAiPilotActive] = useState(isAiPilotEnabled());
    const [aiLogs, setAiLogs] = useState<{time: string, msg: string, type: 'info'|'action'}[]>([]);
    const [isAiThinking, setIsAiThinking] = useState(false);

    const { addNotification } = useNotification();

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setRefreshing(true);
        try {
            const [d, u] = await Promise.all([
                getDashboardStats(),
                getPendingFandubUploads()
            ]);
            setStats(d);
            setPendingUploads(u);
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
        addNotification({ 
            type: 'info', 
            title: 'AI Pilot', 
            message: newState ? 'AI Pilot tizimi faollashtirildi.' : 'AI Pilot o\'chirildi.' 
        });
    };

    const handleRunAiGuard = async () => {
        setIsAiThinking(true);
        // Create context from current dashboard state
        const context = `
            Hozirgi holat: ${pendingUploads.length} ta tasdiqlanmagan fandub bor.
            Pending Fandublar: ${pendingUploads.map(u => `${u.title} (${u.description})`).join(', ')}
            Statistika: ${stats?.users} foydalanuvchi, ${stats?.payments} to'lov.
        `;
        
        const result = await runAiServerManager(context);
        if (result) {
            const newLogs: {time: string, msg: string, type: 'info'|'action'}[] = [];
            
            result.actions.forEach(a => {
                newLogs.push({ 
                    time: new Date().toLocaleTimeString(), 
                    msg: a, 
                    type: 'action' as const 
                });
            });

            if (result.analysis) {
                newLogs.push({ 
                    time: new Date().toLocaleTimeString(), 
                    msg: result.analysis, 
                    type: 'info' as const 
                });
            }

            setAiLogs(prev => [...newLogs, ...prev].slice(0, 15));
            if (result.actions.length > 0) loadData(); // Refresh if AI changed something
        }
        setIsAiThinking(false);
    };

    const handleApprove = async (id: number) => {
        if(!window.confirm("Tasdiqlashni istaysizmi? Anime katalogda faollashadi.")) return;
        try {
            await approveFandubUpload(id);
            addNotification({ type: 'success', title: 'Tasdiqlandi', message: 'Anime katalogga qo\'shildi.' });
            loadData();
        } catch (e) { console.error(e); }
    };

    const handleBlock = async (id: number, currentBlocked: boolean) => {
        if(!window.confirm(currentBlocked ? "Blokdan chiqarishni istaysizmi?" : "Ushbu animeni bloklashni istaysizmi?")) return;
        try {
            await toggleBlockFandub(id, !currentBlocked);
            addNotification({ type: 'info', title: !currentBlocked ? 'Bloklandi' : 'Ochildi', message: 'Muvaffaqiyatli.' });
            loadData();
        } catch (e) { console.error(e); }
    };

    if (loading) return <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>;

    const cards = [
        { label: 'Jami Foydalanuvchilar', value: stats?.users || 0, icon: <Users className="text-blue-500" />, color: 'from-blue-500/10 to-transparent' },
        { label: 'Barcha Animelar', value: stats?.movies || 0, icon: <Film className="text-orange-500" />, color: 'from-orange-500/10 to-transparent' },
        { label: 'Tasdiqlangan To\'lovlar', value: stats?.payments || 0, icon: <CreditCard className="text-green-500" />, color: 'from-green-500/10 to-transparent' },
        { label: 'Ochiq Murojaatlar', value: stats?.tickets || 0, icon: <MessageSquare className="text-red-500" />, color: 'from-red-500/10 to-transparent' },
    ];

    return (
        <div className="animate-fade-in space-y-10 pb-10">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
                <div className="flex gap-4">
                    {/* AI GUARD CONTROLLER */}
                    <div className={`flex items-center gap-3 p-1.5 pr-4 rounded-full border transition-all duration-500 ${isAiPilotActive ? 'bg-indigo-600/20 border-indigo-500' : 'bg-zinc-800 border-zinc-700'}`}>
                        <button 
                            onClick={handleToggleAiPilot}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isAiPilotActive ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/50' : 'bg-zinc-700 text-zinc-400'}`}
                        >
                            <Sparkles size={18} className={isAiPilotActive ? 'animate-pulse' : ''} />
                        </button>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest leading-none">AI Pilot</span>
                            <span className={`text-[9px] font-bold ${isAiPilotActive ? 'text-indigo-400' : 'text-zinc-500'}`}>{isAiPilotActive ? 'ACTIVE' : 'OFF'}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* AI TERMINAL MONITOR */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {cards.map((card, i) => (
                        <div key={i} className={`bg-gray-800/40 border border-gray-700 p-6 rounded-2xl bg-gradient-to-br ${card.color}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-gray-900/50 rounded-xl">{card.icon}</div>
                                <TrendingUp className="text-gray-600 w-4 h-4" />
                            </div>
                            <p className="text-gray-400 text-sm font-medium">{card.label}</p>
                            <h3 className="text-3xl font-bold text-white mt-1">{card.value.toLocaleString()}</h3>
                        </div>
                    ))}
                </div>

                {/* AI LIVE LOGS */}
                <div className="bg-black/40 border border-zinc-800 rounded-2xl p-6 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-black uppercase text-zinc-500 tracking-widest flex items-center gap-2">
                            <Terminal size={14} className="text-indigo-500" /> AI Server Guard Log
                        </h3>
                        <button 
                            onClick={handleRunAiGuard}
                            disabled={isAiThinking}
                            className={`p-1.5 rounded-lg transition-all ${isAiThinking ? 'bg-indigo-500 text-white animate-spin' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                        >
                            <RefreshCw size={14} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3 font-mono text-[10px] custom-scrollbar min-h-[150px]">
                        {aiLogs.length === 0 && <p className="text-zinc-700 italic">Tizim nazorat qilinmoqda...</p>}
                        {aiLogs.map((log, i) => (
                            <div key={i} className={`p-2 rounded border ${log.type === 'action' ? 'bg-indigo-900/20 border-indigo-500/30 text-indigo-300' : 'bg-zinc-900/50 border-zinc-800 text-zinc-500'}`}>
                                <span className="opacity-50">[{log.time}]</span> {log.msg}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-orange-600/10 border border-orange-500/20 p-8 rounded-3xl flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2"> <Layers className="text-orange-500" /> Yakka Premium To'plamlar</h2>
                    <p className="text-zinc-500 text-sm mt-1">Eksklyuziv animelar uchun maxsus jildlar va tariflar yarating.</p>
                </div>
                <button className="px-8 py-3 bg-orange-600 hover:bg-orange-500 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all shadow-xl shadow-orange-900/20">Boshqarish</button>
            </div>
            
            <div className="bg-gray-800/40 border border-gray-700 rounded-3xl p-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="text-yellow-500" />
                        <h2 className="text-xl font-bold text-white uppercase tracking-tight">Fandub Moderatsiyasi ({pendingUploads.length})</h2>
                    </div>
                    <button onClick={loadData} disabled={refreshing} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full text-white transition-all">
                        <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''}/>
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-900/50 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
                            <tr>
                                <th className="p-5">Anime</th>
                                <th className="p-5">Ijodkor</th>
                                <th className="p-5">Status</th>
                                <th className="p-5 text-right">Amallar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {pendingUploads.map(up => (
                                <tr key={up.id} className="group hover:bg-gray-800/50 transition-all">
                                    <td className="p-5 flex items-center gap-4">
                                        <img src={up.poster_url} className="w-10 h-14 rounded object-cover shadow-lg" alt="" />
                                        <div className="min-w-0">
                                            <p className="text-white font-bold truncate">{up.title}</p>
                                            <p className="text-[10px] text-zinc-500 font-mono uppercase">{up.genre}</p>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <p className="text-sm text-purple-400 font-bold">{(up as any).fandub_channels?.name || 'Ijodkor'}</p>
                                    </td>
                                    <td className="p-5">
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${up.status === 'approved' ? 'bg-green-600/20 text-green-400' : 'bg-yellow-600/20 text-yellow-400'}`}>{up.status}</span>
                                        {up.is_blocked && <span className="ml-2 px-2 py-0.5 bg-red-600/20 text-red-400 rounded text-[8px] font-black uppercase">BLOKLANGAN</span>}
                                    </td>
                                    <td className="p-5 text-right space-x-2">
                                        {up.status === 'pending' && <button onClick={() => handleApprove(up.id)} className="p-2 bg-green-600 hover:bg-green-500 text-white rounded-lg"><Check size={16} /></button>}
                                        <button onClick={() => handleBlock(up.id, !!up.is_blocked)} className={`p-2 rounded-lg ${up.is_blocked ? 'bg-orange-600' : 'bg-red-600 hover:bg-red-500'} text-white transition-all`}>
                                            {up.is_blocked ? <Unlock size={16}/> : <Lock size={16}/>}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
