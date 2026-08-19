
import React, { useState, useEffect } from 'react';
import { getPremiumBundles, savePremiumBundle, deletePremiumBundle, getMovies } from './services/dbService';
import { PremiumBundle, Movie } from './types';
import { Layers, Plus, Trash2, Save, X, Search, Check, Filter } from 'lucide-react';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useNotification } from './hooks/useNotification';

export const BundleManagementPage: React.FC = () => {
    const [bundles, setBundles] = useState<PremiumBundle[]>([]);
    const [allMovies, setAllMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { addNotification } = useNotification();

    // Form State
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('');
    const [duration, setDuration] = useState('30');
    const [selectedAnimeIds, setSelectedAnimeIds] = useState<number[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [b, m] = await Promise.all([getPremiumBundles(), getMovies()]);
            setBundles(b);
            setAllMovies(m);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedAnimeIds.length === 0) return alert("Kamida bitta anime tanlang");
        try {
            await savePremiumBundle({
                title,
                price: Number(price),
                duration_days: Number(duration),
                anime_ids: selectedAnimeIds
            });
            addNotification({ type: 'success', title: 'Saqlandi', message: 'To\'plam yaratildi.' });
            setIsModalOpen(false);
            loadData();
            setTitle(''); setPrice(''); setSelectedAnimeIds([]);
        } catch (e) { console.error(e); }
    };

    const toggleAnimeSelection = (id: number) => {
        setSelectedAnimeIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="animate-fade-in space-y-10">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3"> <Layers className="text-orange-500" /> Yakka Premium Jildlar</h1>
                <button onClick={() => setIsModalOpen(true)} className="px-8 py-3 bg-orange-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95"><Plus size={18}/> Yangi Jild Yaratish</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bundles.map(b => (
                    <div key={b.id} className="bg-gray-800/40 border border-gray-700 p-8 rounded-[2.5rem] relative group">
                        <button onClick={() => deletePremiumBundle(b.id).then(loadData)} className="absolute top-6 right-6 text-zinc-600 hover:text-red-500 transition-colors"> <Trash2 size={20}/> </button>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">{b.title}</h3>
                        <p className="text-orange-500 font-black text-lg mb-4">{b.price.toLocaleString()} UZS / {b.duration_days} kun</p>
                        <div className="space-y-2 border-t border-white/5 pt-4">
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">To'plamdagi Animelar ({b.anime_ids.length})</p>
                            <div className="flex flex-wrap gap-2">
                                {b.anime_ids.slice(0, 5).map(id => {
                                    const m = allMovies.find(am => am.id === id);
                                    return m ? <span key={id} className="px-3 py-1 bg-zinc-900 border border-white/5 rounded-lg text-[9px] font-bold text-zinc-400">{m.title}</span> : null;
                                })}
                                {b.anime_ids.length > 5 && <span className="text-[9px] text-zinc-600">...va yana {b.anime_ids.length - 5} ta</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
                    <form onSubmit={handleSave} className="relative bg-[#0a0a0a] border border-white/10 w-full max-w-4xl rounded-[3.5rem] p-10 flex flex-col max-h-[90vh] overflow-hidden animate-slide-in-up">
                        <h2 className="text-3xl font-black uppercase text-white mb-8">Premium To'plam Yaratish</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 overflow-y-auto custom-scrollbar pr-4">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">To'plam Nomi (Title)</label>
                                    <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Masalan: Naruto Fans Pack" className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-5 text-white font-bold" required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Narxi (UZS)</label>
                                        <input value={price} type="number" onChange={e=>setPrice(e.target.value)} className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-5 text-white font-bold" required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Amal muddati (Kun)</label>
                                        <input value={duration} type="number" onChange={e=>setDuration(e.target.value)} className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-5 text-white font-bold" required />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col h-full overflow-hidden">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Animelarni tanlash ({selectedAnimeIds.length})</h4>
                                    <div className="relative">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"/>
                                        <input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Qidirish..." className="bg-zinc-900 border border-white/5 rounded-full py-2 pl-9 pr-4 text-[10px] outline-none focus:border-orange-500"/>
                                    </div>
                                </div>
                                <div className="flex-1 border border-white/5 bg-zinc-900/50 rounded-3xl overflow-y-auto p-4 custom-scrollbar">
                                    <div className="space-y-2">
                                        {allMovies.filter(m => m.title.toLowerCase().includes(searchTerm.toLowerCase())).map(m => (
                                            <div key={m.id} onClick={() => toggleAnimeSelection(m.id!)} className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${selectedAnimeIds.includes(m.id!) ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20' : 'bg-black/40 hover:bg-zinc-800 text-zinc-400'}`}>
                                                <div className="flex items-center gap-3">
                                                    <img src={m.posterUrl} className="w-8 h-10 rounded object-cover"/>
                                                    <span className="text-xs font-bold truncate max-w-[150px]">{m.title}</span>
                                                </div>
                                                {selectedAnimeIds.includes(m.id!) && <Check size={14} />}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-10">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-zinc-900 text-zinc-500 rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95">Bekor qilish</button>
                            <button type="submit" className="flex-1 py-5 bg-orange-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-orange-900/40 active:scale-95 flex items-center justify-center gap-3"><Save size={18}/> Jildni Saqlash</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};
