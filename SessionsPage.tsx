
import React, { useState, useEffect } from 'react';
import { getAllSessions, toggleDeviceBlock } from './services/dbService';
import { UserDevice } from './types';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useNotification } from './hooks/useNotification';
import { MonitorIcon } from './components/icons/MonitorIcon';
import { Lock, Unlock, Clock } from 'lucide-react';

export const SessionsPage: React.FC = () => {
    const [sessions, setSessions] = useState<UserDevice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { addNotification } = useNotification();

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        setIsLoading(true);
        try {
            const data = await getAllSessions();
            setSessions(data);
        } catch (e) {
            console.error(e);
            addNotification({ type: 'error', title: 'Xatolik', message: 'Seanslarni yuklab bo\'lmadi' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleBlockToggle = async (id: number, currentStatus: boolean) => {
        try {
            await toggleDeviceBlock(id, !currentStatus);
            setSessions(prev => prev.map(s => s.id === id ? { ...s, is_blocked: !currentStatus } : s));
            addNotification({ 
                type: !currentStatus ? 'warning' : 'success', 
                title: !currentStatus ? 'Bloklandi' : 'Faollashtirildi', 
                message: !currentStatus ? 'Qurilma bloklandi.' : 'Qurilma blokdan chiqarildi.' 
            });
        } catch (e) {
            addNotification({ type: 'error', title: 'Xatolik', message: 'Holatni o\'zgartirib bo\'lmadi.' });
        }
    };

    return (
        <div className="animate-fade-in">
            <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                <MonitorIcon className="w-8 h-8 text-orange-500" />
                Faol Seanslar (Qurilmalar)
            </h1>

            {isLoading ? <LoadingSpinner /> : (
                <div className="bg-gray-800/70 rounded-lg overflow-hidden border border-gray-700">
                    <table className="w-full text-left">
                        <thead className="bg-gray-800 border-b border-gray-700">
                            <tr>
                                <th className="p-4 font-semibold text-gray-300">Foydalanuvchi</th>
                                <th className="p-4 font-semibold text-gray-300">Qurilma (User-Agent)</th>
                                <th className="p-4 font-semibold text-gray-300">Oxirgi faollik</th>
                                <th className="p-4 font-semibold text-gray-300">Holat</th>
                                <th className="p-4 font-semibold text-gray-300">Amallar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {sessions.length === 0 && (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Hozircha faol seanslar yo'q.</td></tr>
                            )}
                            {sessions.map(session => (
                                <tr key={session.id} className="hover:bg-gray-700/50 transition-colors">
                                    <td className="p-4">
                                        <p className="font-bold text-white">{session.profiles?.full_name || 'Noma\'lum'}</p>
                                        <p className="text-xs text-gray-400">{session.profiles?.email}</p>
                                        <span className="text-[10px] uppercase bg-gray-900 px-1.5 rounded text-gray-500 border border-gray-700 mt-1 inline-block">
                                            {session.profiles?.role}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-sm text-gray-300 max-w-xs truncate" title={session.device_name}>
                                            {session.device_name}
                                        </div>
                                        <div className="text-xs text-gray-500 font-mono mt-1">{session.device_id}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 text-gray-300 text-sm">
                                            <Clock size={14} />
                                            {new Date(session.last_active).toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {session.is_blocked ? (
                                            <span className="bg-red-900/50 text-red-300 px-2 py-1 rounded-full text-xs font-bold border border-red-800">BLOKLANGAN</span>
                                        ) : (
                                            <span className="bg-green-900/50 text-green-300 px-2 py-1 rounded-full text-xs font-bold border border-green-800">FAOL</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <button 
                                            onClick={() => handleBlockToggle(session.id, session.is_blocked)}
                                            className={`p-2 rounded-lg transition-colors ${session.is_blocked ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                                            title={session.is_blocked ? "Blokdan chiqarish" : "Qurilmani bloklash"}
                                        >
                                            {session.is_blocked ? <Unlock size={18} /> : <Lock size={18} />}
                                        </button>
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
