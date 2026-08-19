
import React, { useState, useEffect } from 'react';
import { DashboardSubPage, Page } from './App';
import { ProfilePage } from './ProfilePage';
import { SettingsPage } from './SettingsPage';
import { HistoryPage } from './HistoryPage';
import { DashboardHomePage } from './DashboardHomePage';
import { Movie, UserRole, SocialLink } from './types';
import { AccountPage } from './AccountPage';
import { BillingPage } from './BillingPage';
import { SavedPage } from './SavedPage';
import { DashboardSupportPage } from './components/DashboardSupportPage';
import { SubscriptionPlans } from './components/SubscriptionPlans';
import { getSocialLinks } from './services/dbService';
import { 
    LogOut, Settings, CreditCard, History, ShieldCheck, 
    Instagram, Send, Youtube, Facebook, MessageCircle, 
    Globe, ExternalLink, Mic, Star, LayoutGrid, ChevronRight
} from 'lucide-react';

interface DashboardPageProps {
  currentPage: DashboardSubPage;
  onNavigate: (page: DashboardSubPage) => void;
  onMainNavigate: (page: Page) => void;
  onSearch: (query: string) => void;
  onLogout: () => void;
  onMovieClick: (movie: Movie) => void;
  currentRole: UserRole;
  onSwitchRole: (role: UserRole) => void;
  viewUserId?: string | null;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ 
    currentPage, 
    onNavigate, 
    onMainNavigate,
    onSearch, 
    onLogout, 
    onMovieClick, 
    currentRole, 
    onSwitchRole,
    viewUserId 
}) => {
    const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
    const isAdmin = ['admin', 'owner', 'manager'].includes(currentRole);
    const canAccessCreatorStudio = ['fandub', 'admin', 'owner', 'dub'].includes(currentRole);

    useEffect(() => {
        if (currentPage === 'more') {
            getSocialLinks().then(setSocialLinks);
        }
    }, [currentPage]);

    const getSocialIcon = (platform: string) => {
        switch(platform) {
            case 'instagram': return <Instagram size={20}/>;
            case 'telegram': return <Send size={20}/>;
            case 'youtube': return <Youtube size={20}/>;
            case 'facebook': return <Facebook size={20}/>;
            default: return <Globe size={20}/>;
        }
    };

    const renderContent = () => {
        switch (currentPage) {
            case 'profile': return <ProfilePage viewUserId={viewUserId} onMainNavigate={onMainNavigate} />;
            case 'settings': return <SettingsPage onNavigate={onNavigate} />;
            case 'history': return <HistoryPage onMovieClick={onMovieClick} viewUserId={viewUserId} />;
            case 'saved': return <SavedPage onMovieClick={onMovieClick} viewUserId={viewUserId} />;
            case 'account': return <AccountPage onNavigate={onNavigate} />;
            case 'billing': return <BillingPage />;
            case 'plans': 
                return (
                    <div className="animate-fade-in pb-20">
                        <h2 className="text-3xl font-black text-center text-white mb-2 uppercase tracking-tight">Premium Tariflar</h2>
                        <p className="text-zinc-500 text-xs font-bold text-center uppercase tracking-widest mb-8">Eng qulayini tanlang</p>
                        <SubscriptionPlans />
                    </div>
                );
            case 'support': return <DashboardSupportPage onBack={() => onNavigate('more')} />;
            case 'more':
                return (
                    <div className="animate-fade-in space-y-10 max-w-2xl mx-auto pb-20">
                        <div className="flex flex-col gap-2">
                             <h2 className="text-3xl font-black tracking-tight text-white">Yana</h2>
                             <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Xizmatlar va Bo'limlar</p>
                        </div>
                        
                        <div className="grid gap-4">
                            {canAccessCreatorStudio && (
                                <button 
                                    onClick={() => onMainNavigate('fandub-dashboard')} 
                                    className="group w-full flex items-center justify-between p-6 bg-gradient-to-r from-purple-600/30 via-purple-600/10 to-transparent border border-purple-500/50 rounded-[2.5rem] text-white font-black transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-purple-500/20"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 bg-purple-600 rounded-3xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(147,51,234,0.4)] group-hover:rotate-12 transition-transform">
                                            <Mic size={28}/>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xl tracking-tight">Ijodkor Xonasi</p>
                                            <p className="text-[10px] uppercase tracking-widest text-purple-400 font-black">LOYIHALARNI BOSHQARISH</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-purple-400 animate-pulse">OCHISH</span>
                                        <ChevronRight size={20} className="text-purple-400 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </button>
                            )}

                            <button 
                                onClick={() => onMainNavigate('studio')} 
                                className="group w-full flex items-center justify-between p-6 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] text-orange-500 font-black transition-all hover:scale-[1.02] active:scale-95"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-zinc-800 rounded-3xl flex items-center justify-center text-orange-500 border border-zinc-700 group-hover:bg-orange-600 group-hover:text-white transition-all">
                                        <LayoutGrid size={28}/>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xl tracking-tight text-white">Anilo Studio</p>
                                        <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-black">Artistlar va Katalog</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-zinc-600">OCHISH</span>
                                    <ExternalLink size={20} className="text-zinc-600 group-hover:text-orange-500" />
                                </div>
                            </button>

                            {isAdmin && (
                                <button onClick={() => onSwitchRole(currentRole)} className="group w-full flex items-center justify-between p-5 bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20 rounded-[2rem] text-yellow-500 font-black transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-yellow-500/5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-yellow-500/20 rounded-2xl flex items-center justify-center">
                                            <ShieldCheck size={24}/>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-base text-white">Admin Paneli</p>
                                            <p className="text-[10px] opacity-60">Tizimni boshqarish</p>
                                        </div>
                                    </div>
                                    <ExternalLink size={18} className="opacity-40 group-hover:opacity-100 transition-opacity" />
                                </button>
                            )}
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button onClick={() => onNavigate('account')} className="group w-full flex flex-col p-6 bg-white/5 border border-white/5 rounded-[2.5rem] hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-95">
                                    <div className="w-12 h-12 bg-orange-600/20 text-orange-500 rounded-2xl flex items-center justify-center mb-4">
                                        <CreditCard size={24}/>
                                    </div>
                                    <p className="text-white font-bold text-lg">Moliya</p>
                                    <p className="text-gray-500 text-xs mt-1">Hisobni to'ldirish</p>
                                </button>

                                <button onClick={() => onNavigate('support')} className="group w-full flex flex-col p-6 bg-white/5 border border-white/5 rounded-[2.5rem] hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-95">
                                    <div className="w-12 h-12 bg-blue-600/20 text-blue-500 rounded-2xl flex items-center justify-center mb-4">
                                        <MessageCircle size={24}/>
                                    </div>
                                    <p className="text-white font-bold text-lg">Yordam</p>
                                    <p className="text-gray-500 text-xs mt-1">Murojaat va Chat</p>
                                </button>

                                <button onClick={() => onNavigate('history')} className="group w-full flex flex-col p-6 bg-white/5 border border-white/5 rounded-[2.5rem] hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-95">
                                    <div className="w-12 h-12 bg-purple-600/20 text-purple-500 rounded-2xl flex items-center justify-center mb-4">
                                        <History size={24}/>
                                    </div>
                                    <p className="text-white font-bold text-lg">Tarix</p>
                                    <p className="text-gray-500 text-xs mt-1">Ko'rilgan animelar</p>
                                </button>

                                <button onClick={() => onNavigate('settings')} className="group w-full flex flex-col p-6 bg-white/5 border border-white/5 rounded-[2.5rem] hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-95">
                                    <div className="w-12 h-12 bg-gray-600/20 text-gray-400 rounded-2xl flex items-center justify-center mb-4">
                                        <Settings size={24}/>
                                    </div>
                                    <p className="text-white font-bold text-lg">Sozlamalar</p>
                                    <p className="text-gray-500 text-xs mt-1">Hisob va Xavfsizlik</p>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-6 pt-10 border-t border-white/5">
                            <p className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] text-center">Biz Ijtimoiy Tarmoqlarda</p>
                            <div className="flex flex-wrap justify-center gap-4">
                                {socialLinks.length > 0 ? socialLinks.map(link => (
                                    <a 
                                        key={link.id}
                                        href={link.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="w-14 h-14 bg-white/5 hover:bg-orange-600 border border-white/5 rounded-2xl text-gray-400 hover:text-white transition-all flex items-center justify-center shadow-lg active:scale-90"
                                        title={link.label}
                                    >
                                        {getSocialIcon(link.platform)}
                                    </a>
                                )) : (
                                    <p className="text-gray-700 text-xs italic">Havolalar yuklanmoqda...</p>
                                )}
                            </div>
                        </div>

                        <button 
                            onClick={onLogout}
                            className="w-full flex items-center justify-center gap-3 p-6 bg-red-600/10 border border-red-600/20 rounded-[2rem] text-red-500 font-black uppercase tracking-widest text-[10px] hover:bg-red-600 hover:text-white transition-all shadow-xl shadow-red-600/5 active:scale-95"
                        >
                            <LogOut size={18}/> Hisobdan Chiqish
                        </button>
                    </div>
                );
            case 'main':
            default:
                return <DashboardHomePage onSearch={onSearch} onMovieClick={onMovieClick} onMainNavigate={onMainNavigate} />;
        }
    }

    return (
        <div className={currentPage === 'main' ? "w-full" : "container mx-auto px-4 pt-4"}>
            {renderContent()}
        </div>
    );
};
