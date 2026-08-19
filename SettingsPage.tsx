
import React, { useState, useEffect } from 'react';
import { ToggleSwitch } from './components/ToggleSwitch';
import { supabase } from './services/supabaseClient';
import { getUserProfile, updateUserProfile, updateUserPassword, updateUserEmail } from './services/dbService';
import { clearAppCache } from './services/cacheService'; // Import cache clear function
import { UserProfile } from './types';
import { useNotification } from './hooks/useNotification';
import { LoadingSpinner } from './components/LoadingSpinner';
import { 
    Mail, Lock, Globe, Bell, Smartphone, Trash2, 
    LogOut, ChevronRight, User, ShieldAlert, CreditCard, 
    HardDrive, Info, AlertTriangle, ArrowLeft, Check
} from 'lucide-react';
import { DashboardSubPage } from './App';

interface SettingsPageProps {
    onNavigate?: (page: DashboardSubPage) => void;
}

const SettingsGroup = ({ title, children }: { title: string, children?: React.ReactNode }) => (
    <div className="mb-8">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-3 px-4">{title}</h3>
        <div className="bg-[#121212] border border-white/5 rounded-3xl overflow-hidden shadow-sm">
            {children}
        </div>
    </div>
);

const SettingsItem = ({ 
    icon, label, value, onClick, isDestructive, toggle, showArrow = true 
}: { 
    icon: React.ReactNode, label: string, value?: string, onClick?: () => void, isDestructive?: boolean, toggle?: React.ReactNode, showArrow?: boolean 
}) => (
    <div 
        onClick={onClick} 
        className={`flex items-center justify-between p-5 bg-[#121212] active:bg-[#1a1a1a] transition-colors ${onClick ? 'cursor-pointer' : ''} border-b border-white/5 last:border-0 group`}
    >
        <div className="flex items-center gap-4">
            <div className={`p-2.5 rounded-xl ${isDestructive ? 'bg-red-500/10 text-red-500' : 'bg-zinc-800 text-zinc-400 group-hover:text-orange-500 group-hover:bg-orange-500/10 transition-colors'}`}>
                {icon}
            </div>
            <span className={`text-sm font-bold ${isDestructive ? 'text-red-500' : 'text-white'}`}>{label}</span>
        </div>
        
        <div className="flex items-center gap-3">
            {value && <span className="text-xs font-medium text-zinc-500">{value}</span>}
            {toggle}
            {showArrow && onClick && !toggle && <ChevronRight size={18} className="text-zinc-600" />}
        </div>
    </div>
);

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const { addNotification } = useNotification();
    const [authEmail, setAuthEmail] = useState('');

    // Modals
    const [activeModal, setActiveModal] = useState<'password' | 'email' | 'language' | null>(null);
    
    // Modal Forms
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setAuthEmail(user.email || '');
                const dbProfile = await getUserProfile(user.id);
                setProfile(dbProfile);
            }
        } catch (e) {
            console.error("Error loading settings:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleUpdate = async (field: 'email_notifications' | 'push_notifications', value: boolean) => {
        if (!profile) return;
        setProfile({ ...profile, [field]: value }); // Optimistic
        try {
            await updateUserProfile(profile.id, { [field]: value });
        } catch (e) {
            setProfile({ ...profile, [field]: !value }); // Revert
            addNotification({ type: 'error', title: 'Xatolik', message: 'Saqlab bo\'lmadi.' });
        }
    };

    const handleLanguageChange = async (value: string) => {
        if (!profile) return;
        try {
            await updateUserProfile(profile.id, { language: value });
            setProfile({ ...profile, language: value });
            addNotification({ type: 'success', title: 'Muvaffaqiyatli', message: 'Til o\'zgartirildi.' });
            setActiveModal(null);
        } catch (e) {
            addNotification({ type: 'error', title: 'Xatolik', message: 'Tilni saqlab bo\'lmadi.' });
        }
    }

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 6) return addNotification({ type: 'warning', title: 'Xatolik', message: 'Parol juda qisqa.' });
        if (newPassword !== confirmPassword) return addNotification({ type: 'warning', title: 'Xatolik', message: 'Parollar mos kelmadi.' });

        setIsSaving(true);
        try {
            await updateUserPassword(newPassword);
            addNotification({ type: 'success', title: 'Muvaffaqiyatli', message: 'Parol yangilandi.' });
            setActiveModal(null);
            setNewPassword(''); setConfirmPassword('');
        } catch (e: any) {
            addNotification({ type: 'error', title: 'Xatolik', message: e.message });
        } finally { setIsSaving(false); }
    }

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateUserEmail(newEmail);
            addNotification({ type: 'info', title: 'Tasdiqlash', message: `Tasdiqlash havolasi ${newEmail} ga yuborildi.` });
            setActiveModal(null);
            setNewEmail('');
        } catch (e: any) {
            addNotification({ type: 'error', title: 'Xatolik', message: e.message });
        } finally { setIsSaving(false); }
    }

    const clearCache = () => {
        // Local storage device ID ni saqlab qolamiz
        const deviceId = localStorage.getItem('anilo_device_id');
        
        clearAppCache(); // Clear new caching system
        
        // Restore essential keys if needed
        if (deviceId) localStorage.setItem('anilo_device_id', deviceId);
        
        addNotification({ type: 'success', title: 'Tozalandi', message: 'Kesh xotira tozalandi. Sahifa yangilanadi.' });
        setTimeout(() => window.location.reload(), 1000);
    };

    const handleDeleteAccount = async () => {
        const confirm = window.prompt("Hisobingizni o'chirish uchun 'DELETE' deb yozing. Bu amalni qaytarib bo'lmaydi.");
        if (confirm === 'DELETE') {
            addNotification({ type: 'info', title: 'So\'rov yuborildi', message: 'Adminlar bilan bog\'laning (Hozircha avtomatik o\'chirish yopiq).' });
        }
    };

    if (loading) return <div className="flex justify-center py-20 bg-[#050505] min-h-screen"><LoadingSpinner /></div>;

    return (
        <div className="min-h-screen bg-[#050505] pb-20 animate-fade-in text-sans">
            
            {/* Header */}
            <div className="sticky top-0 z-30 bg-[#050505]/80 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-3">
                    <button onClick={() => onNavigate?.('more')} className="p-2 -ml-2 rounded-full hover:bg-white/10 text-white">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-2xl font-black text-white uppercase tracking-tight">Sozlamalar</h1>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 pt-6">
                
                {/* Profile Preview */}
                <div className="bg-[#121212] border border-white/5 rounded-[2.5rem] p-6 flex items-center gap-5 mb-8 shadow-2xl relative overflow-hidden" onClick={() => onNavigate?.('profile')}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/10 rounded-full blur-3xl"></div>
                    
                    <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border-2 border-zinc-700 relative z-10">
                        {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <User size={24} className="text-zinc-500"/>}
                    </div>
                    <div className="flex-1 relative z-10">
                        <h2 className="text-lg font-black text-white">{profile?.full_name || 'Foydalanuvchi'}</h2>
                        <p className="text-xs text-zinc-500 font-bold">@{profile?.username}</p>
                    </div>
                    <button className="px-4 py-2 bg-white/5 rounded-xl text-[10px] font-black text-orange-500 uppercase tracking-wider hover:bg-white/10 transition-colors relative z-10">
                        Tahrirlash
                    </button>
                </div>

                {/* Account Settings */}
                <SettingsGroup title="Hisob va Xavfsizlik">
                    <SettingsItem 
                        icon={<Mail size={18}/>} 
                        label="Email manzili" 
                        value={authEmail} 
                        onClick={() => setActiveModal('email')}
                    />
                    <SettingsItem 
                        icon={<Lock size={18}/>} 
                        label="Parolni o'zgartirish" 
                        value="••••••••" 
                        onClick={() => setActiveModal('password')}
                    />
                    <SettingsItem 
                        icon={<ShieldAlert size={18}/>} 
                        label="Faol sessiyalar" 
                        value="Boshqarish"
                        onClick={() => {}} 
                    />
                </SettingsGroup>

                {/* Notifications */}
                <SettingsGroup title="Bildirishnomalar">
                    <SettingsItem 
                        icon={<Bell size={18}/>} 
                        label="Yangi qismlar haqida"
                        showArrow={false}
                        toggle={<ToggleSwitch checked={profile?.email_notifications || false} onChange={v => handleToggleUpdate('email_notifications', v)} />}
                    />
                    <SettingsItem 
                        icon={<Smartphone size={18}/>} 
                        label="Push xabarlar"
                        showArrow={false}
                        toggle={<ToggleSwitch checked={profile?.push_notifications || false} onChange={v => handleToggleUpdate('push_notifications', v)} />}
                    />
                </SettingsGroup>

                {/* App Settings */}
                <SettingsGroup title="Ilova">
                    <SettingsItem 
                        icon={<Globe size={18}/>} 
                        label="Interfeys tili" 
                        value={profile?.language === 'uz' ? "O'zbekcha" : profile?.language === 'ru' ? "Русский" : "English"}
                        onClick={() => setActiveModal('language')}
                    />
                    <SettingsItem 
                        icon={<HardDrive size={18}/>} 
                        label="Keshni tozalash" 
                        value="App Data"
                        onClick={clearCache}
                    />
                </SettingsGroup>

                {/* Danger Zone */}
                <SettingsGroup title="Xavfli hudud">
                    <SettingsItem 
                        icon={<LogOut size={18}/>} 
                        label="Hisobdan chiqish" 
                        isDestructive 
                        onClick={() => supabase.auth.signOut()}
                    />
                    <SettingsItem 
                        icon={<Trash2 size={18}/>} 
                        label="Hisobni o'chirish" 
                        isDestructive 
                        onClick={handleDeleteAccount}
                    />
                </SettingsGroup>

                <div className="text-center pb-8">
                    <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em]">Anilo v2.1.0 (Beta)</p>
                </div>
            </div>

            {/* --- MODALS --- */}

            {/* Password Modal */}
            {activeModal === 'password' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setActiveModal(null)}>
                    <div className="bg-[#121212] border border-white/10 w-full max-w-sm p-6 rounded-[2rem] shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tight">Parolni yangilash</h3>
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <input 
                                type="password" 
                                placeholder="Yangi parol" 
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-orange-500 transition-all text-sm"
                            />
                            <input 
                                type="password" 
                                placeholder="Parolni tasdiqlang" 
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-orange-500 transition-all text-sm"
                            />
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setActiveModal(null)} className="flex-1 py-4 bg-zinc-800 rounded-2xl font-bold text-xs uppercase text-zinc-400 hover:text-white">Bekor</button>
                                <button type="submit" disabled={isSaving} className="flex-1 py-4 bg-orange-600 rounded-2xl font-bold text-xs uppercase text-white hover:bg-orange-500">{isSaving ? '...' : 'Saqlash'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Email Modal */}
            {activeModal === 'email' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setActiveModal(null)}>
                    <div className="bg-[#121212] border border-white/10 w-full max-w-sm p-6 rounded-[2rem] shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Email o'zgartirish</h3>
                        <p className="text-xs text-zinc-500 mb-6 leading-relaxed">Yangi email manzilingizga tasdiqlash kodi yuboriladi.</p>
                        <form onSubmit={handleEmailSubmit} className="space-y-4">
                            <input 
                                type="email" 
                                placeholder="Yangi email" 
                                value={newEmail}
                                onChange={e => setNewEmail(e.target.value)}
                                className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-orange-500 transition-all text-sm"
                            />
                            <button type="submit" disabled={isSaving} className="w-full py-4 bg-orange-600 rounded-2xl font-bold text-xs uppercase text-white hover:bg-orange-500">{isSaving ? '...' : 'Tasdiqlash'}</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Language Modal (Bottom Sheet Style) */}
            {activeModal === 'language' && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setActiveModal(null)}>
                    <div className="bg-[#121212] border-t sm:border border-white/10 w-full max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl animate-slide-in-up" onClick={e => e.stopPropagation()}>
                        <div className="w-12 h-1 bg-zinc-800 rounded-full mx-auto mb-6"></div>
                        <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tight text-center">Tilni tanlang</h3>
                        <div className="space-y-2">
                            {[
                                { code: 'uz', label: 'O\'zbekcha' },
                                { code: 'ru', label: 'Русский' },
                                { code: 'en', label: 'English' }
                            ].map((lang) => (
                                <button 
                                    key={lang.code}
                                    onClick={() => handleLanguageChange(lang.code)}
                                    className={`w-full p-4 rounded-2xl flex items-center justify-between text-sm font-bold uppercase tracking-wide transition-all ${profile?.language === lang.code ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'bg-black text-zinc-400 hover:bg-zinc-900'}`}
                                >
                                    {lang.label}
                                    {profile?.language === lang.code && <Check size={18} />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
