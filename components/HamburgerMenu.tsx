
import React, { useState, useEffect } from 'react';
import { 
    X, CreditCard, History, Bookmark, 
    Settings, LogOut, ChevronRight, User, 
    ShieldCheck, Edit3, Lock, HelpCircle, FileText, Wallet, Crown, Mic, Download, ExternalLink, Zap, Video, Activity, MessageSquare
} from 'lucide-react';
import { DashboardSubPage, Page, LegalDocType } from '../App';
import { supabase } from '../services/supabaseClient';
import { getUserProfile, getActiveStories } from '../services/dbService';
import { UserRole, UserProfile, FandubStory } from '../types';
import { usePWA } from './InstallPWA';
import { StoryViewer } from './StoryViewer';

interface HamburgerMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onLogout: () => void;
    onMainNavigate: (page: Page) => void;
    onDashboardNavigate: (page: DashboardSubPage) => void;
    onSwitchRole: (role: UserRole) => void;
    onOpenLegal: (type: LegalDocType) => void;
}

const MenuItem: React.FC<{ 
    icon?: React.ReactNode; 
    label: string; 
    value?: string; 
    onClick: () => void; 
    isDestructive?: boolean;
    hasArrow?: boolean;
    badge?: string;
}> = ({ icon, label, value, onClick, isDestructive = false, hasArrow = true, badge }) => (
    <button 
        onClick={onClick}
        className="w-full flex items-center justify-between py-4 border-b border-white/5 active:bg-white/5 transition-colors group"
    >
        <div className="flex items-center gap-3">
            {icon && <span className={isDestructive ? "text-red-500" : "text-zinc-400 group-hover:text-white transition-colors"}>{icon}</span>}
            <span className={`text-sm font-medium ${isDestructive ? "text-red-500" : "text-white"}`}>
                {label}
            </span>
            {badge && <span className="px-2 py-0.5 bg-orange-600 text-[9px] font-black uppercase rounded text-white ml-2">{badge}</span>}
        </div>
        <div className="flex items-center gap-2">
            {value && <span className="text-xs text-zinc-500 font-medium">{value}</span>}
            {hasArrow && <ChevronRight size={16} className="text-zinc-600 group-hover:text-zinc-400" />}
        </div>
    </button>
);

const MenuSection: React.FC<{ title?: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6">
        {title && <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 px-1">{title}</h4>}
        <div className="flex flex-col">
            {children}
        </div>
    </div>
);

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ 
    isOpen, onClose, onLogout, onMainNavigate, onDashboardNavigate, onSwitchRole, onOpenLegal 
}) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [myStory, setMyStory] = useState<FandubStory[]>([]);
    const [showStory, setShowStory] = useState(false);
    const { isInstallable, installApp } = usePWA();

    useEffect(() => {
        if (isOpen) {
            const loadData = async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const [p, stories] = await Promise.all([
                        getUserProfile(user.id),
                        getActiveStories()
                    ]);
                    setProfile(p as UserProfile);
                    const mine = stories.filter(s => s.user_id === user.id);
                    setMyStory(mine);
                }
            };
            loadData();
        }
    }, [isOpen]);

    const handleAction = (type: 'main' | 'sub', target: any) => {
        if (type === 'main') {
            onMainNavigate(target);
        } else {
            onMainNavigate('dashboard');
            setTimeout(() => {
                onDashboardNavigate(target);
            }, 50);
        }
        onClose();
    };

    const isPrivileged = profile && profile.role !== 'user';
    const hasStory = myStory.length > 0;

    if (!isOpen) return null;

    // Check if user has creator access (fandub, admin or owner)
    const hasCreatorAccess = profile && ['fandub', 'admin', 'owner'].includes(profile.role);

    return (
        <div className="fixed inset-0 z-[200] flex justify-end animate-fade-in">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

            <div className="relative w-full max-w-sm bg-[#0a0a0a] h-full border-l border-white/10 shadow-2xl flex flex-col overflow-hidden animate-slide-in-right">
                
                <div className="absolute top-4 right-4 z-50">
                    <button onClick={onClose} className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all border border-white/10">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    
                    {/* --- PROFIL BANNER HUDUDI --- */}
                    <div className="relative pt-20 pb-10 px-6 flex flex-col items-center overflow-hidden">
                        <div className="absolute inset-0 z-0">
                            {profile?.banner_url ? (
                                <img src={profile.banner_url} className="w-full h-full object-cover opacity-40 blur-[2px]" alt="" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-orange-950 via-[#0a0a0a] to-black"></div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-black/20"></div>
                            
                            {profile?.role === 'user' && (
                                <div 
                                    onClick={() => handleAction('sub', 'plans')}
                                    className="absolute inset-x-4 top-4 h-10 bg-orange-600/20 backdrop-blur-md border border-orange-500/30 rounded-xl flex items-center justify-between px-4 cursor-pointer hover:bg-orange-600/30 transition-all group animate-pulse"
                                >
                                    <div className="flex items-center gap-2">
                                        <Zap size={14} className="text-orange-500 fill-orange-500" />
                                        <span className="text-[9px] font-black text-white uppercase tracking-widest">Premiumga o'ting!</span>
                                    </div>
                                    <ExternalLink size={12} className="text-orange-500 group-hover:translate-x-1 transition-transform" />
                                </div>
                            )}
                        </div>

                        <div className="relative z-10 flex flex-col items-center">
                            <div 
                                className="relative mb-4 group cursor-pointer" 
                                onClick={() => {
                                    if (hasStory && isPrivileged) setShowStory(true);
                                    else handleAction('sub', 'profile');
                                }}
                            >
                                <div className={`w-28 h-28 rounded-full p-1 transition-all duration-700 ${hasStory && isPrivileged ? 'bg-gradient-to-tr from-orange-500 via-pink-600 to-purple-600 animate-spin-slow' : 'bg-white/10 backdrop-blur-md border border-white/20'}`}>
                                    <div className="w-full h-full rounded-full bg-black overflow-hidden border-4 border-black">
                                        {profile?.avatar_url ? (
                                            <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-500"><User size={48}/></div>
                                        )}
                                    </div>
                                </div>
                                {hasStory && isPrivileged && (
                                    <div className="absolute -top-1 -right-1 bg-orange-600 text-[8px] font-black px-2 py-0.5 rounded-full border-2 border-black animate-bounce shadow-xl">
                                        STORY
                                    </div>
                                )}
                                {!hasStory && isPrivileged && (
                                    <div className="absolute bottom-1 right-1 bg-white text-black p-1.5 rounded-full shadow-xl border-2 border-black group-hover:scale-110 transition-transform">
                                        <Edit3 size={14} />
                                    </div>
                                )}
                            </div>
                            
                            <div className="text-center bg-black/40 backdrop-blur-sm px-6 py-2 rounded-2xl border border-white/5 shadow-2xl">
                                <h2 className="text-xl font-black text-white uppercase tracking-tight mb-0.5">
                                    {profile?.full_name || 'Foydalanuvchi'}
                                </h2>
                                <div className="flex items-center justify-center gap-2">
                                     <p className="text-sm font-bold text-orange-500">@{profile?.username}</p>
                                     {isPrivileged && <Crown size={12} className="text-yellow-500 fill-yellow-500" />}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 pb-10">
                        {isInstallable && (
                            <button 
                                onClick={installApp}
                                className="w-full mb-6 py-3.5 bg-white text-black rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all shadow-xl active:scale-95"
                            >
                                <Download size={16} /> Ilovani O'rnatish
                            </button>
                        )}

                        {/* Updated role check: owner and admin can now access Fandub Studio */}
                        {hasCreatorAccess && (
                            <div className="mb-6">
                                <button 
                                    onClick={() => handleAction('main', 'fandub-dashboard')}
                                    className="w-full p-4 rounded-2xl bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-500/30 flex items-center justify-between group hover:border-purple-500/60 transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                                            <Mic size={20} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-black text-white uppercase">Fandub Studio</p>
                                            <p className="text-[9px] text-zinc-500 font-bold uppercase">Ijodkor paneli</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={18} className="text-purple-400 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        )}

                        <MenuSection title="Mening Profilim">
                            <MenuItem icon={<MessageSquare size={20}/>} label="Suhbat" onClick={() => handleAction('main', 'chat')} />
                            <MenuItem icon={<User size={20}/>} label="Profilni tahrirlash" onClick={() => handleAction('sub', 'profile')} />
                            <MenuItem 
                                icon={<Wallet size={20}/>} 
                                label="Mening Hisobim" 
                                value={`${(profile?.balance || 0).toLocaleString()} UZS`}
                                onClick={() => handleAction('sub', 'account')} 
                            />
                            <MenuItem 
                                icon={<Crown size={20}/>} 
                                label="Premium Obuna" 
                                value={profile?.subscription_plan || "Yo'q"} 
                                onClick={() => handleAction('sub', 'plans')} 
                            />
                            <MenuItem icon={<Bookmark size={20}/>} label="Saqlanganlar" onClick={() => handleAction('sub', 'saved')} />
                            <MenuItem icon={<History size={20}/>} label="Ko'rishlar tarixi" onClick={() => handleAction('sub', 'history')} />
                        </MenuSection>

                        <MenuSection title="Yordam va Sozlamalar">
                            <MenuItem 
                                icon={<HelpCircle size={20}/>} 
                                label="Yordam Markazi (AI)" 
                                badge="AI"
                                onClick={() => handleAction('main', 'ai-assistant')} 
                            />
                            <MenuItem icon={<Settings size={20}/>} label="Ilova Sozlamalari" onClick={() => handleAction('sub', 'settings')} />
                            <MenuItem icon={<Activity size={20}/>} label="PWA Report Card" onClick={() => handleAction('main', 'pwa-report')} />
                        </MenuSection>

                        <MenuSection title="Hujjatlar">
                            <MenuItem icon={<FileText size={20}/>} label="Ommaviy Oferta" hasArrow={false} onClick={() => {onOpenLegal('terms'); onClose();}} />
                            <MenuItem icon={<Lock size={20}/>} label="Maxfiylik Siyosati" hasArrow={false} onClick={() => {onOpenLegal('privacy'); onClose();}} />
                        </MenuSection>

                        {['admin', 'owner'].includes(profile?.role || '') && (
                            <MenuSection title="Administrator">
                                <MenuItem icon={<ShieldCheck size={20}/>} label="Admin Panelga o'tish" onClick={() => { onSwitchRole(profile!.role); onClose(); }} />
                            </MenuSection>
                        )}

                        <div className="mt-8 pt-6 border-t border-white/10">
                            <MenuItem 
                                icon={<LogOut size={20}/>} 
                                label="Hisobdan chiqish" 
                                isDestructive={true} 
                                hasArrow={false}
                                onClick={onLogout} 
                            />
                        </div>
                        
                        <div className="mt-8 text-center">
                            <p className="text-[10px] text-zinc-700 font-black uppercase tracking-[0.3em]">Anilo Platform v2.5</p>
                        </div>
                    </div>
                </div>
            </div>

            {showStory && myStory.length > 0 && (
                <StoryViewer 
                    stories={myStory} 
                    initialIndex={0} 
                    onClose={() => setShowStory(false)} 
                />
            )}
        </div>
    );
};
