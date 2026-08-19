
import React from 'react';
import { Bell, Info, Zap, Gift, Clock, CheckCircle, XCircle } from 'lucide-react';

interface NotificationItem {
    id: number;
    title: string;
    message: string;
    type: string;
    created_at: string;
    is_read: boolean;
    data?: any;
}

interface NotificationListProps {
    notifications: NotificationItem[];
    onClose: () => void;
    onNotificationClick?: (notification: NotificationItem) => void;
}

export const NotificationList: React.FC<NotificationListProps> = ({ notifications, onClose, onNotificationClick }) => {
    
    const getIcon = (type: string) => {
        switch(type) {
            case 'success': return <CheckCircle size={16} className="text-green-500" />;
            case 'error': return <XCircle size={16} className="text-red-500" />;
            case 'promo': return <Gift size={16} className="text-purple-500" />;
            case 'warning': return <Zap size={16} className="text-yellow-500" />;
            case 'live': return <Zap size={16} className="text-red-500 animate-pulse" />;
            case 'invite': return <Bell size={16} className="text-orange-500" />;
            case 'mention': return <Info size={16} className="text-blue-500" />;
            default: return <Info size={16} className="text-blue-500" />;
        }
    };

    return (
        <div className="absolute top-16 right-0 w-80 sm:w-96 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[200] animate-fade-in">
            <div className="p-4 border-b border-white/5 bg-[#121212] flex justify-between items-center">
                <h3 className="font-black text-xs uppercase tracking-widest text-white flex items-center gap-2">
                    <Bell size={14} className="text-orange-500"/> Bildirishnomalar
                </h3>
                <button onClick={onClose} className="text-zinc-600 hover:text-white text-xs font-bold uppercase">Yopish</button>
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                    <div className="p-10 text-center flex flex-col items-center gap-3">
                        <Clock size={32} className="text-zinc-800"/>
                        <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">Hozircha xabarlar yo'q</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {notifications.map(n => (
                            <div 
                                key={n.id} 
                                onClick={() => onNotificationClick?.(n)}
                                className={`p-4 hover:bg-white/10 transition-all cursor-pointer group relative ${!n.is_read ? 'bg-orange-500/5' : ''}`}
                            >
                                <div className="flex gap-3">
                                    <div className="mt-0.5">{getIcon(n.type)}</div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-white leading-tight mb-1 group-hover:text-orange-500 transition-colors">{n.title}</p>
                                        <p className="text-xs text-zinc-400 leading-relaxed mb-2">{n.message}</p>
                                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-tighter">
                                            {new Date(n.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    {!n.is_read && <div className="w-2 h-2 bg-orange-600 rounded-full shrink-0 mt-1"></div>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-3 bg-[#121212] border-t border-white/5 text-center">
                <button className="text-[9px] font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-colors">Barcha bildirishnomalar</button>
            </div>
        </div>
    );
};
