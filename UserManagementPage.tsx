
import React, { useState, useEffect } from 'react';
import { UserIcon } from './components/icons/UserIcon';
import { EditIcon } from './components/icons/EditIcon';
import { DeleteIcon } from './components/icons/DeleteIcon';
import { EnterIcon } from './components/icons/EnterIcon';
import { UserProfile } from './types';
import { getAllUsers, deleteUser, deleteFandubChannel } from './services/dbService';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useNotification } from './hooks/useNotification';
import { MicOff, Trash2, ShieldCheck, XCircle } from 'lucide-react';
import { supabase } from './services/supabaseClient';

interface UserManagementPageProps {
    onImpersonate?: (userId: string) => void;
}

const StatusBadge: React.FC<{ role: string }> = ({ role }) => {
    const colorClasses: Record<string, string> = {
        'admin': 'bg-red-500/20 text-red-400',
        'owner': 'bg-purple-500/20 text-purple-400',
        'manager': 'bg-yellow-500/20 text-yellow-400',
        'user': 'bg-blue-500/20 text-blue-400',
    };
    return <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border border-white/5 ${colorClasses[role] || 'bg-gray-500/20 text-gray-400'}`}>{role}</span>;
}

export const UserManagementPage: React.FC<UserManagementPageProps> = ({ onImpersonate }) => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { addNotification } = useNotification();

    useEffect(() => { loadUsers(); }, []);

    const loadUsers = async () => {
        try {
            const data = await getAllUsers();
            const { data: channels } = await supabase.from('fandub_channels').select('id, user_id');
            const channelMap = new Set(channels?.map(c => c.user_id));
            
            setUsers(data.map(u => ({ ...u, has_channel: channelMap.has(u.id) })) as any);
            setIsLoading(false);
        } catch (e) { console.error(e); }
    };

    const handleDeleteChannel = async (userId: string) => {
        if (!window.confirm("DIQQAT! Ushbu foydalanuvchining KANALINI o'chirmoqchimisiz? Barcha yuklangan animelar va daromadlar ham o'chib ketadi! Bu amalni ortga qaytarib bo'lmaydi.")) return;
        
        try {
            const { data: channel } = await supabase.from('fandub_channels').select('id').eq('user_id', userId).maybeSingle();
            if (channel) {
                await deleteFandubChannel(channel.id);
                addNotification({ type: 'success', title: 'O\'chirildi', message: 'Kanal butunlay yo\'q qilindi.' });
                loadUsers();
            } else {
                addNotification({ type: 'warning', title: 'Xato', message: 'Ushbu foydalanuvchida kanal topilmadi.' });
            }
        } catch (e) {
            addNotification({ type: 'error', title: 'Xatolik', message: 'Kanalni o\'chirib bo\'lmadi.' });
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (!window.confirm("Hisobni butunlay o'chirmoqchimisiz?")) return;
        try {
            await deleteUser(id);
            setUsers(users.filter(u => u.id !== id));
            addNotification({ type: 'success', title: 'O\'chirildi', message: 'Foydalanuvchi o\'chirildi.' });
        } catch (e) { console.error(e); }
    };

    return (
        <div className="animate-fade-in pb-20">
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-10">Foydalanuvchilar</h1>

            {isLoading ? <LoadingSpinner /> : (
                <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] overflow-hidden shadow-3xl">
                    <table className="w-full text-left">
                        <thead className="bg-[#111] text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">
                            <tr>
                                <th className="p-6">Foydalanuvchi</th>
                                <th className="p-6">Email</th>
                                <th className="p-6">Rol</th>
                                <th className="p-6">Balans</th>
                                <th className="p-6">Sana</th>
                                <th className="p-6 text-right">Harakatlar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {users.map(user => (
                                <tr key={user.id} className="group hover:bg-white/5 transition-all">
                                    <td className="p-6 flex items-center gap-5">
                                        <div className="relative">
                                            <img src={user.avatar_url || ''} className="w-12 h-12 rounded-2xl object-cover bg-zinc-800" alt="" />
                                            {user.is_online && <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-[#0a0a0a] rounded-full animate-pulse"></span>}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-white uppercase tracking-tight">{user.full_name || 'Anonymous'}</p>
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase">@{user.username || 'user'}</p>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <p className="text-xs font-bold text-zinc-400 lowercase truncate max-w-[150px]">{user.email}</p>
                                    </td>
                                    <td className="p-6"><StatusBadge role={user.role} /></td>
                                    <td className="p-6 font-black text-white text-sm">{(user.balance || 0).toLocaleString()} <span className="text-orange-500 text-[10px]">UZS</span></td>
                                    <td className="p-6 text-[10px] font-bold text-zinc-500 uppercase">{new Date(user.created_at).toLocaleDateString()}</td>
                                    <td className="p-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            {onImpersonate && (
                                                <button onClick={() => onImpersonate(user.id)} className="p-3 bg-white/5 hover:bg-green-600 text-zinc-500 hover:text-white rounded-2xl transition-all shadow-xl" title="Profilga kirish"><EnterIcon className="w-5 h-5"/></button>
                                            )}
                                            {(user as any).has_channel && (
                                                <button onClick={() => handleDeleteChannel(user.id)} className="flex items-center gap-2 px-4 py-3 bg-orange-600/10 hover:bg-orange-600 text-orange-500 hover:text-white rounded-2xl transition-all shadow-xl font-black text-[9px] uppercase tracking-widest" title="Kanalni o'chirish">
                                                    <MicOff size={16}/> <span>Kanalni o'chirish</span>
                                                </button>
                                            )}
                                            <button onClick={() => handleDeleteUser(user.id)} className="p-3 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-2xl transition-all shadow-xl"><Trash2 size={18}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
