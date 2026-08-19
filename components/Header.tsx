
import React, { useState, useEffect, useRef } from 'react';
import { Page, DashboardSubPage } from '../App';
import { UzumakiLogo } from './icons/UzumakiLogo';
import { Search, Bell, User, Play, Mic, Sparkles, Download, ShieldCheck, FileText, Info, Video, MessageSquare } from 'lucide-react';
import * as db from '../services/dbService';
import { supabase } from '../services/supabaseClient';
import { UserRole } from '../types';
import { useNotification } from '../hooks/useNotification';
import { NotificationList } from './NotificationList';
import { usePWA } from './InstallPWA'; 

interface HeaderProps {
  onNavigate: (page: Page) => void;
  onDashboardNavigate: (page: DashboardSubPage) => void;
  currentPage: Page;
  isAuthenticated: boolean;
  onLoginClick: () => void;
  onSearchClick: () => void;
  onSwitchRole: (role: UserRole) => void;
  onLogout: () => void;
  isMenuOpen: boolean; 
  setIsMenuOpen: (isOpen: boolean) => void; 
  onNotificationClick?: (type: string, data: any) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
    onNavigate, onDashboardNavigate, currentPage, isAuthenticated, 
    onLoginClick, onSearchClick, onSwitchRole, onLogout,
    isMenuOpen, setIsMenuOpen, onNotificationClick
}) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAnyLive, setIsAnyLive] = useState(false);
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const notificationRef = useRef<HTMLDivElement>(null);
  
  const { isInstallable, installApp } = usePWA(); 

  useEffect(() => {
      db.getAppConfig().then(config => {
          if (config['site_logo']) setCustomLogo(config['site_logo']);
      });

      if (isAuthenticated) {
          fetchHeaderData();
          
          // Real-time notifications
          let sub: any;
          supabase.auth.getUser().then(({data: {user}}) => {
              if (user) {
                  sub = supabase.channel(`user_notifications_${user.id}`)
                      .on('postgres_changes', { 
                          event: 'INSERT', 
                          schema: 'public', 
                          table: 'notifications',
                          filter: `user_id=eq.${user.id}`
                      }, () => {
                          fetchHeaderData();
                      })
                      .subscribe();
              }
          });

          const interval = setInterval(fetchHeaderData, 15000);
          return () => {
              clearInterval(interval);
              if (sub) supabase.removeChannel(sub);
          };
      }
  }, [isAuthenticated]);

  const fetchHeaderData = async () => {
      try {
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
              const [count, profile, list] = await Promise.all([
                  db.getUnreadNotificationsCount(user.id),
                  db.getUserProfile(user.id),
                  db.getUserNotifications(user.id)
              ]);
              setUnreadCount(count);
              setNotifications(list);
              if (profile) setAvatarUrl(profile.avatar_url);
          }
      } catch (e) { console.error(e); }
  };

  const handleToggleNotifications = async () => {
      if (!showNotifications && isAuthenticated) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
              await db.markNotificationsRead(user.id);
              setUnreadCount(0);
          }
      }
      setShowNotifications(!showNotifications);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[110] bg-gradient-to-b from-black/90 to-transparent pt-4 pb-12 pointer-events-none">
        {/* AI Botlari uchun Maxfiy Havolalar (SEO Deep Links) */}
        <nav className="sr-only opacity-0 absolute">
            <a href="/?page=copyright#privacy-policy">Maxfiylik Siyosati</a>
            <a href="/?page=copyright#public-offer">Ommaviy Oferta</a>
            <a href="/?page=copyright#founders">Loyiha Egalari</a>
            <a href="/?page=copyright#user-guide">Foydalanish Yo'riqnomasi</a>
        </nav>

        <div className="container mx-auto px-4 md:px-8 h-20 flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-4 md:gap-10">
                <div className="flex items-center gap-3 cursor-pointer group relative" onClick={() => isAuthenticated ? onNavigate('dashboard') : onNavigate('welcome')}>
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-transform hover:scale-110">
                        {customLogo ? (
                            <img src={customLogo} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                            <UzumakiLogo className="w-full h-full p-1.5 text-orange-500 bg-black" />
                        )}
                    </div>
                    {isAnyLive && (
                        <div className="absolute -top-1 -right-1 flex items-center justify-center">
                            <div className="w-3 h-3 bg-red-600 rounded-full animate-ping absolute"></div>
                            <div className="w-3 h-3 bg-red-600 rounded-full border-2 border-black relative"></div>
                        </div>
                    )}
                </div>

                <nav className="hidden xl:flex items-center gap-4">
                    <button onClick={() => onNavigate('dashboard')} className={`group flex items-center gap-3 px-5 py-2.5 rounded-2xl transition-all ${currentPage === 'dashboard' ? 'bg-white/10 border-white/10' : 'hover:bg-white/5 border-transparent'}`}>
                        <Play size={20} fill={currentPage === 'dashboard' ? "currentColor" : "none"} className={currentPage === 'dashboard' ? 'text-orange-600' : 'text-zinc-500'} />
                        <p className="text-sm font-black uppercase tracking-wide">Katalog</p>
                    </button>
                    <button onClick={() => onNavigate('studio')} className={`group flex items-center gap-3 px-5 py-2.5 rounded-2xl transition-all ${currentPage === 'studio' ? 'bg-white/10 border-white/10' : 'hover:bg-white/5 border-transparent'}`}>
                        <Mic size={20} className={currentPage === 'studio' ? 'text-purple-600' : 'text-zinc-500'} />
                        <p className="text-sm font-black uppercase tracking-wide">Fandub</p>
                    </button>
                    <button onClick={() => onNavigate('chat')} className={`group flex items-center gap-3 px-5 py-2.5 rounded-2xl transition-all ${currentPage === 'chat' ? 'bg-white/10 border-white/10' : 'hover:bg-white/5 border-transparent'}`}>
                        <MessageSquare size={20} className={currentPage === 'chat' ? 'text-orange-600' : 'text-zinc-500'} />
                        <p className="text-sm font-black uppercase tracking-wide">Suhbat</p>
                    </button>
                </nav>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 relative" ref={notificationRef}>
                {isInstallable && (
                    <button 
                        onClick={installApp} 
                        className="p-2 md:p-2.5 rounded-xl bg-orange-600/20 text-orange-500 hover:bg-orange-600 hover:text-white transition-all active:scale-95 border border-orange-600/30 animate-pulse"
                        title="Ilovani o'rnatish"
                    >
                        <Download size={20} />
                    </button>
                )}

                <button onClick={() => onNavigate('ai-assistant')} className={`p-2 md:p-2.5 rounded-xl transition-all active:scale-95 ${currentPage === 'ai-assistant' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-blue-400'}`}>
                    <Sparkles size={22} className={currentPage === 'ai-assistant' ? 'animate-pulse' : ''}/>
                </button>

                <button onClick={onSearchClick} className="p-2 text-white hover:text-orange-500 transition-colors active:scale-95">
                    <Search size={24} strokeWidth={2.5} />
                </button>
                
                <div className="relative">
                    <button onClick={handleToggleNotifications} className="p-2 text-white hover:text-orange-500 transition-colors relative active:scale-95 group">
                        <Bell size={24} strokeWidth={2.5} className={unreadCount > 0 ? "animate-swing text-orange-500" : ""} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-red-600 rounded-full border border-black text-[8px] flex items-center justify-center text-white font-black animate-pulse">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>
                    {showNotifications && (
                        <NotificationList 
                            notifications={notifications} 
                            onClose={() => setShowNotifications(false)} 
                            onNotificationClick={(n) => {
                                setShowNotifications(false);
                                if (onNotificationClick) {
                                    onNotificationClick(n.type, n.data);
                                }
                            }}
                        />
                    )}
                </div>

                <div className="hidden md:block">
                    {isAuthenticated ? (
                        <button onClick={() => setIsMenuOpen(true)} className="w-11 h-11 rounded-full border-2 border-white/20 overflow-hidden hover:border-orange-500 transition-all shadow-lg active:scale-95">
                            {avatarUrl ? <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-400"><User size={22} /></div>}
                        </button>
                    ) : (
                        <button onClick={onLoginClick} className="ml-2 bg-white text-black px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all shadow-lg">Kirish</button>
                    )}
                </div>
            </div>
        </div>
    </header>
  );
};
