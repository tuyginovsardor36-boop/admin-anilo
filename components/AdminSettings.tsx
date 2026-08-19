
import React, { useState, useEffect } from 'react';
import { getAppConfig, updateAppConfig, getSocialLinks, addSocialLink, deleteSocialLink } from '../services/dbService';
import { useNotification } from '../hooks/useNotification';
import { LoadingSpinner } from './LoadingSpinner';
import { 
    CreditCard, Save, RefreshCw, Database, Copy, 
    Info, Link as LinkIcon, Trash2, Clock, Globe,
    Instagram, Send, Youtube, Facebook, Plus
} from 'lucide-react';
import { SocialLink } from '../types';

export const AdminSettings: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { addNotification } = useNotification();

    const [cardNumber, setCardNumber] = useState('');
    const [cardHolder, setCardHolder] = useState('');
    const [price1Month, setPrice1Month] = useState('');
    const [price3Month, setPrice3Month] = useState('');
    const [price6Month, setPrice6Month] = useState('');
    const [price1Year, setPrice1Year] = useState('');
    const [freeTrialMinutes, setFreeTrialMinutes] = useState('');
    
    // Social Links States
    const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
    const [newSocialPlatform, setNewSocialPlatform] = useState<SocialLink['platform']>('instagram');
    const [newSocialUrl, setNewSocialUrl] = useState('');
    const [newSocialLabel, setNewSocialLabel] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const config = await getAppConfig();
            setCardNumber(config['card_number'] || '8600 0000 0000 0000');
            setCardHolder(config['card_holder'] || 'ANILO UZ');
            setPrice1Month(config['price_1_oy'] || '9999');
            setPrice3Month(config['price_3_oy'] || '28500');
            setPrice6Month(config['price_6_oy'] || '51000');
            setPrice1Year(config['price_1_yil'] || '90000');
            setFreeTrialMinutes(config['free_trial_minutes'] || '60');

            const links = await getSocialLinks();
            setSocialLinks(links);
        } catch (error) {
            addNotification({ type: 'error', title: 'Xatolik', message: 'Sozlamalarni yuklab bo\'lmadi' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateAppConfig('card_number', cardNumber);
            await updateAppConfig('card_holder', cardHolder.toUpperCase());
            await updateAppConfig('price_1_oy', price1Month);
            await updateAppConfig('price_3_oy', price3Month);
            await updateAppConfig('price_6_oy', price6Month);
            await updateAppConfig('price_1_yil', price1Year);
            await updateAppConfig('free_trial_minutes', freeTrialMinutes);
            addNotification({ type: 'success', title: 'Saqlandi', message: 'Sozlamalar yangilandi.' });
        } catch (error) {
            addNotification({ type: 'error', title: 'Xatolik', message: 'Saqlashda xatolik.' });
        } finally {
            setSaving(false);
        }
    };

    const handleAddSocialLink = async () => {
        if (!newSocialUrl || !newSocialLabel) {
            addNotification({ type: 'warning', title: 'Diqqat', message: 'Nom va havolani kiriting.' });
            return;
        }
        try {
            await addSocialLink({ platform: newSocialPlatform, url: newSocialUrl, label: newSocialLabel });
            addNotification({ type: 'success', title: 'Qo\'shildi', message: 'Ijtimoiy tarmoq havolasi saqlandi.' });
            setNewSocialUrl(''); 
            setNewSocialLabel('');
            // Refresh links
            const links = await getSocialLinks();
            setSocialLinks(links);
        } catch (e) {
            addNotification({ type: 'error', title: 'Xatolik', message: 'Havolani qo\'shib bo\'lmadi.' });
        }
    };

    const handleDeleteSocialLink = async (id: number) => {
        if(!window.confirm("Ushbu havolani o'chirmoqchimisiz?")) return;
        try {
            await deleteSocialLink(id);
            setSocialLinks(prev => prev.filter(l => l.id !== id));
            addNotification({ type: 'success', title: 'O\'chirildi', message: 'Havola olib tashlandi.' });
        } catch (e) {
            addNotification({ type: 'error', title: 'Xatolik', message: 'O\'chirishda xatolik.' });
        }
    };

    const getSocialIcon = (platform: string) => {
        switch(platform) {
            case 'instagram': return <Instagram size={20} className="text-pink-500" />;
            case 'telegram': return <Send size={20} className="text-blue-400" />;
            case 'youtube': return <Youtube size={20} className="text-red-500" />;
            case 'facebook': return <Facebook size={20} className="text-blue-600" />;
            default: return <Globe size={20} className="text-zinc-400" />;
        }
    };

    const sqlCode = `-- 1. PROFILES RLS ... (existing code)`;

    if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

    return (
        <div className="animate-fade-in max-w-5xl mx-auto pb-32 space-y-12">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Tizim Sozlamalari</h1>
                    <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest mt-1">Platforma va Ijtimoiy havolalar</p>
                </div>
                <button onClick={loadSettings} className="p-4 bg-[#111] border border-white/5 rounded-2xl text-zinc-500 hover:text-white transition-all active:scale-95 shadow-xl">
                    <RefreshCw size={20} />
                </button>
            </div>

            {/* IJODIY TARMOQLAR BO'LIMI */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/5 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="flex items-center gap-4 mb-10">
                    <div className="p-3 bg-blue-600/20 rounded-2xl text-blue-500"><LinkIcon size={24}/></div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Ijtimoiy Tarmoqlar va Havolalar</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Add Form */}
                    <div className="lg:col-span-1 space-y-5 bg-white/5 p-6 rounded-[2rem] border border-white/5">
                        <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest mb-4 flex items-center gap-2"> <Plus size={14}/> Yangi Havola</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4 mb-2 block">Platforma</label>
                                <select 
                                    value={newSocialPlatform} 
                                    onChange={e => setNewSocialPlatform(e.target.value as any)}
                                    className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-blue-500"
                                >
                                    <option value="instagram">Instagram</option>
                                    <option value="telegram">Telegram</option>
                                    <option value="youtube">YouTube</option>
                                    <option value="facebook">Facebook</option>
                                    <option value="globe">Boshqa (Web)</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4 mb-2 block">Nomi (Label)</label>
                                <input 
                                    value={newSocialLabel} 
                                    onChange={e => setNewSocialLabel(e.target.value)}
                                    placeholder="Masalan: Asosiy kanal"
                                    className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4 mb-2 block">Havola (URL)</label>
                                <input 
                                    value={newSocialUrl} 
                                    onChange={e => setNewSocialUrl(e.target.value)}
                                    placeholder="https://..."
                                    className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-blue-500"
                                />
                            </div>

                            <button 
                                onClick={handleAddSocialLink}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-900/20 transition-all active:scale-95"
                            >
                                Ro'yxatga Qo'shish
                            </button>
                        </div>
                    </div>

                    {/* Links List */}
                    <div className="lg:col-span-2 space-y-4 h-full overflow-y-auto max-h-[450px] pr-2 custom-scrollbar">
                        {socialLinks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white/2 rounded-[2.5rem] border border-dashed border-zinc-800">
                                <LinkIcon size={48} className="text-zinc-800 mb-4" />
                                <p className="text-zinc-600 font-bold uppercase tracking-widest text-[10px]">Havolalar mavjud emas</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {socialLinks.map(link => (
                                    <div key={link.id} className="group bg-[#0d0d0d] border border-white/5 p-5 rounded-[1.8rem] flex items-center justify-between hover:border-orange-500/50 transition-all shadow-lg">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center border border-white/5">
                                                {getSocialIcon(link.platform)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-black text-white uppercase truncate">{link.label}</p>
                                                <p className="text-[9px] text-zinc-500 font-mono truncate">{link.url}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteSocialLink(link.id)}
                                            className="p-3 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition-all opacity-0 group-hover:opacity-100 shadow-xl"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-8 md:p-12 shadow-2xl">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-orange-600/20 rounded-2xl text-orange-500"><CreditCard size={24}/></div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">To'lov Ma'lumotlari</h2>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase ml-4">Rasmiy Karta</label>
                                <input value={cardNumber} onChange={e=>setCardNumber(e.target.value)} placeholder="Karta raqami" className="w-full bg-black border border-white/5 rounded-2xl p-5 text-white font-mono text-lg" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase ml-4">Ega Nomi</label>
                                <input value={cardHolder} onChange={e=>setCardHolder(e.target.value)} placeholder="Karta egasi" className="w-full bg-black border border-white/5 rounded-2xl p-5 text-white uppercase font-bold" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-8 md:p-12 shadow-2xl">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-yellow-600/20 rounded-2xl text-yellow-500"><Clock size={24}/></div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Premium Narxlar</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-600 uppercase ml-4">1 OY (UZS)</label>
                                <input type="number" value={price1Month} onChange={e=>setPrice1Month(e.target.value)} className="w-full bg-black border border-white/5 rounded-2xl p-4 text-white font-bold" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-600 uppercase ml-4">3 OY (UZS)</label>
                                <input type="number" value={price3Month} onChange={e=>setPrice3Month(e.target.value)} className="w-full bg-black border border-white/5 rounded-2xl p-4 text-white font-bold" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-600 uppercase ml-4">6 OY (UZS)</label>
                                <input type="number" value={price6Month} onChange={e=>setPrice6Month(e.target.value)} className="w-full bg-black border border-white/5 rounded-2xl p-4 text-white font-bold" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-600 uppercase ml-4">1 YIL (UZS)</label>
                                <input type="number" value={price1Year} onChange={e=>setPrice1Year(e.target.value)} className="w-full bg-black border border-white/5 rounded-2xl p-4 text-white font-bold" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button type="submit" disabled={saving} className="px-16 py-6 bg-orange-600 hover:bg-orange-500 text-white font-black uppercase text-xs tracking-[0.3em] rounded-3xl shadow-2xl shadow-orange-900/40 transition-all active:scale-95 disabled:opacity-50">
                        {saving ? <LoadingSpinner /> : 'Global Sozlamalarni Saqlash'}
                    </button>
                </div>
            </form>
        </div>
    );
};
