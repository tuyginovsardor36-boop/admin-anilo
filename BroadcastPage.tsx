
import React, { useState, useEffect } from 'react';
import { BroadcastIcon } from './components/icons/BroadcastIcon';
import { PlusIcon } from './components/icons/PlusIcon';
import { DeleteIcon } from './components/icons/DeleteIcon';
import { getBroadcasts, createBroadcast, deleteBroadcast } from './services/dbService';
import { Broadcast } from './types';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useNotification } from './hooks/useNotification';
import { Megaphone, AlertTriangle, Info } from 'lucide-react';

const TypeBadge: React.FC<{ type: string }> = ({ type }) => {
    const styles: any = {
        info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        urgent: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return <span className={`px-2 py-0.5 rounded text-xs border ${styles[type] || styles.info} uppercase font-bold`}>{type}</span>;
};

export const BroadcastPage: React.FC = () => {
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { addNotification } = useNotification();

    // Form
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState<'info' | 'warning' | 'urgent'>('info');
    const [target, setTarget] = useState<'all' | 'premium' | 'user'>('all');

    useEffect(() => {
        loadBroadcasts();
    }, []);

    const loadBroadcasts = async () => {
        setIsLoading(true);
        try {
            const data = await getBroadcasts();
            setBroadcasts(data);
        } catch (e) {
            console.error(e);
            addNotification({ type: 'error', title: 'Xatolik', message: 'Brodkastlarni yuklab bo\'lmadi.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if(!window.confirm("O'chirmoqchimisiz?")) return;
        try {
            await deleteBroadcast(id);
            setBroadcasts(prev => prev.filter(b => b.id !== id));
            addNotification({ type: 'success', title: 'O\'chirildi', message: 'Xabar o\'chirildi.' });
        } catch (e) {
            addNotification({ type: 'error', title: 'Xatolik', message: 'O\'chirishda xatolik.' });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createBroadcast({ title, message, type, target_group: target });
            addNotification({ type: 'success', title: 'Yuborildi', message: 'Brodkast xabari yaratildi.' });
            setIsModalOpen(false);
            setTitle('');
            setMessage('');
            loadBroadcasts();
        } catch (e: any) {
            addNotification({ type: 'error', title: 'Xatolik', message: e.message || 'Yaratishda xatolik.' });
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <BroadcastIcon className="w-8 h-8 text-orange-500" />
                    Brodkast (Xabarnoma)
                </h1>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                    <PlusIcon className="w-5 h-5" />
                    <span>Xabar Yaratish</span>
                </button>
            </div>

            {isLoading ? <LoadingSpinner /> : (
                <div className="grid gap-4">
                    {broadcasts.length === 0 && <p className="text-gray-500 text-center py-10">Hozircha xabarlar yo'q.</p>}
                    {broadcasts.map(item => (
                        <div key={item.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 relative group">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-3">
                                    {item.type === 'urgent' ? <AlertTriangle className="text-red-500" /> : <Megaphone className="text-blue-400" />}
                                    <h3 className="text-lg font-bold text-white">{item.title}</h3>
                                </div>
                                <TypeBadge type={item.type} />
                            </div>
                            <p className="text-gray-300 text-sm mb-3 whitespace-pre-wrap">{item.message}</p>
                            <div className="flex justify-between items-center text-xs text-gray-500 border-t border-gray-700 pt-3">
                                <span>Target: {item.target_group.toUpperCase()}</span>
                                <span>{new Date(item.created_at).toLocaleString()}</span>
                            </div>
                            <button 
                                onClick={() => handleDelete(item.id)}
                                className="absolute top-4 right-4 p-2 bg-gray-700 hover:bg-red-600 text-gray-400 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <DeleteIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-gray-900 border border-orange-500/30 rounded-lg p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold text-white mb-6">Yangi Xabar Yuborish</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Sarlavha</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-orange-500 outline-none"
                                    placeholder="Diqqat, muhim yangilik!"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Xabar Matni</label>
                                <textarea 
                                    required 
                                    rows={4}
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-orange-500 outline-none"
                                    placeholder="Saytda texnik ishlar olib borilmoqda..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Turi</label>
                                    <select 
                                        value={type}
                                        onChange={e => setType(e.target.value as any)}
                                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-orange-500 outline-none"
                                    >
                                        <option value="info">Info (Moviy)</option>
                                        <option value="warning">Warning (Sariq)</option>
                                        <option value="urgent">Urgent (Qizil)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Kimga</label>
                                    <select 
                                        value={target}
                                        onChange={e => setTarget(e.target.value as any)}
                                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-orange-500 outline-none"
                                    >
                                        <option value="all">Barchaga</option>
                                        <option value="premium">Faqat Premium</option>
                                        <option value="user">Faqat Oddiy</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">Bekor qilish</button>
                                <button type="submit" className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold">Yuborish</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
