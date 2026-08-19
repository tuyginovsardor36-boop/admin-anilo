
import React from 'react';
import { AdminSubPage } from '../App';
import { UzumakiLogo } from './icons/UzumakiLogo';
import { DashboardIcon } from './icons/DashboardIcon';
import { UsersIcon } from './icons/UsersIcon';
import { MovieIcon } from './icons/MovieIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { LogoutIcon } from './icons/LogoutIcon';
import { SwitchUserIcon } from './icons/SwitchUserIcon';
import { UserRole } from '../types';
import { BillingIcon } from './icons/BillingIcon';
import { SupportIcon } from './icons/SupportIcon';
import { MegaphoneIcon } from './icons/MegaphoneIcon';
import { TagIcon } from './icons/TagIcon';
import { PaletteIcon } from './icons/PaletteIcon';
import { MonitorIcon } from './icons/MonitorIcon';
import { BroadcastIcon } from './icons/BroadcastIcon';
import { MapIcon } from './icons/MapIcon';
import { ShieldIcon } from './icons/ShieldIcon';
import { StampIcon } from './icons/StampIcon';
import { Layers, Truck, ShoppingCart } from 'lucide-react';

interface AdminSidebarProps {
  currentRole: UserRole;
  currentPage: AdminSubPage;
  onNavigate: (page: AdminSubPage) => void;
  onSwitchView: () => void;
  onLogout: () => void;
  counts?: { financials: number; support: number; fandub?: number };
}

const NavItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
    count?: number;
    isPrimary?: boolean;
}> = ({ icon, label, isActive, onClick, count, isPrimary }) => (
    <li>
        <button
            type="button"
            onClick={onClick}
            className={`relative w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 group ${
                isActive 
                ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg shadow-orange-600/20 translate-x-2' 
                : 'text-zinc-500 hover:text-white hover:bg-white/5 border border-transparent'
            } ${isPrimary && !isActive ? 'border-l-2 border-orange-500/30' : ''}`}
        >
            <span className={`${isActive ? 'text-white' : (isPrimary ? 'text-orange-500/70' : 'text-zinc-600')} group-hover:text-orange-500 transition-colors`}>
                {icon}
            </span>
            <span className="flex-1 text-left">{label}</span>
            {(count !== undefined && count > 0) && (
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-full text-[9px] font-black border ${isActive ? 'bg-white text-orange-600 border-white' : 'bg-orange-600 text-white border-orange-500 animate-pulse'}`}>
                    {count > 99 ? '99+' : count}
                </span>
            )}
        </button>
    </li>
);

// MAIN 9 CATEGORIES (Primary)
const primaryMenuItems: { page: any, label: string, icon: React.ReactNode, roles: UserRole[] }[] = [
    { page: 'dashboard', label: 'Boshqaruv', icon: <DashboardIcon className="w-5 h-5" />, roles: ['owner', 'admin'] },
    { page: 'users', label: 'Foydalanuvchilar', icon: <UsersIcon className="w-5 h-5" />, roles: ['owner', 'admin'] },
    { page: 'movies', label: 'Anime Katalog', icon: <MovieIcon className="w-5 h-5" />, roles: ['owner', 'admin', 'manager'] },
    { page: 'financials', label: 'Moliya & Billing', icon: <BillingIcon className="w-5 h-5" />, roles: ['owner', 'accountant'] },
    { page: 'support', label: 'Murojaatlar', icon: <SupportIcon className="w-5 h-5" />, roles: ['owner', 'support'] },
    { page: 'advertisements', label: 'Reklamalar', icon: <MegaphoneIcon className="w-5 h-5" />, roles: ['owner', 'admin'] },
    { page: 'promocodes', label: 'Promokodlar', icon: <TagIcon className="w-5 h-5" />, roles: ['owner', 'admin'] },
    { page: 'customization', label: 'Dizayn & Fon', icon: <PaletteIcon className="w-5 h-5" />, roles: ['owner'] },
    { page: 'sessions', label: 'Xavfsizlik (Seans)', icon: <MonitorIcon className="w-5 h-5" />, roles: ['owner', 'admin'] },
];

// EXTRA CATEGORIES (Secondary/Tools)
const secondaryMenuItems: { page: any, label: string, icon: React.ReactNode, roles: UserRole[] }[] = [
    { page: 'bundle_manager', label: 'Premium To\'plamlar', icon: <Layers size={20} />, roles: ['owner'] },
    { page: 'broadcasts', label: 'Brodkast', icon: <BroadcastIcon className="w-5 h-5" />, roles: ['owner', 'admin'] },
    { page: 'sitemap', label: 'SEO Generator', icon: <MapIcon className="w-5 h-5" />, roles: ['owner', 'admin'] },
    { page: 'stamp_tool', label: 'E-Muhr Tool', icon: <StampIcon className="w-5 h-5" />, roles: ['owner'] },
    { page: 'settings', label: 'Tizim Sozlamalari', icon: <SettingsIcon className="w-5 h-5" />, roles: ['owner'] },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentRole,
  currentPage,
  onNavigate,
  onSwitchView,
  onLogout,
  counts = { financials: 0, support: 0, fandub: 0 }
}) => {
  const visiblePrimary = primaryMenuItems.filter(item => item.roles.includes(currentRole));
  const visibleSecondary = secondaryMenuItems.filter(item => item.roles.includes(currentRole));
  
  return (
    <aside className="w-72 bg-[#050505] border-r border-white/5 p-6 flex flex-col flex-shrink-0 h-screen sticky top-0 overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-4 mb-12 px-2">
        <UzumakiLogo className="w-12 h-12 shadow-2xl shadow-orange-600/20" />
        <div>
            <h2 className="text-xl font-black font-mono tracking-tighter text-white uppercase leading-none">Anilo<span className="text-orange-600">.Admin</span></h2>
            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] mt-1">Control Panel v2.5</p>
        </div>
      </div>

      <nav className="flex-grow space-y-8">
        <div>
            <h3 className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.3em] mb-4 px-4">Asosiy 9 bo'lim</h3>
            <ul className="space-y-1">
              {visiblePrimary.map(item => (
                <NavItem
                    key={item.page}
                    icon={item.icon}
                    label={item.label}
                    isActive={currentPage === item.page}
                    onClick={() => onNavigate(item.page)}
                    count={item.page === 'financials' ? counts.financials : item.page === 'support' ? counts.support : undefined}
                    isPrimary
                />
              ))}
            </ul>
        </div>

        <div>
            <h3 className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.3em] mb-4 px-4">Tizim va Asboblar</h3>
            <ul className="space-y-1">
              {visibleSecondary.map(item => (
                <NavItem
                    key={item.page}
                    icon={item.icon}
                    label={item.label}
                    isActive={currentPage === item.page}
                    onClick={() => onNavigate(item.page)}
                />
              ))}
            </ul>
        </div>
      </nav>

      <div className="mt-10 pt-6 border-t border-white/5">
        <ul className="space-y-2">
           <li>
                <button type="button" onClick={onSwitchView} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:bg-white/5 transition-all">
                    <SwitchUserIcon className="w-5 h-5 text-zinc-700" />
                    <span>User Mode</span>
                </button>
           </li>
           <li>
                <button type="button" onClick={onLogout} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all">
                    <LogoutIcon className="w-5 h-5" />
                    <span>Log Out</span>
                </button>
           </li>
        </ul>
      </div>
    </aside>
  );
};
