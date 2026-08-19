
import React, { useEffect, useState } from 'react';
import { DashboardSubPage } from './App';
import { WalletIcon } from './components/icons/WalletIcon';
import { PlusIcon } from './components/icons/PlusIcon';
import { HistoryIcon } from './components/icons/HistoryIcon';
import { CrownIcon } from './components/icons/CrownIcon';
import { supabase } from './services/supabaseClient';
import { getUserProfile, getUserTransactions } from './services/dbService';
import { Transaction, UserProfile } from './types';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ArrowUpRight, ArrowDownLeft, Clock, CreditCard } from 'lucide-react';

interface AccountPageProps {
  onNavigate: (page: DashboardSubPage) => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({ onNavigate }) => {
  const [balance, setBalance] = useState(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const userProfile = await getUserProfile(user.id);
                setProfile(userProfile);
                setBalance(userProfile?.balance || 0);

                const txs = await getUserTransactions(user.id);
                setTransactions(txs);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

  return (
    <div className="animate-fade-in pb-20">
      <h1 className="text-3xl font-black text-white mb-8 tracking-tight">Mening Hisobim</h1>
      
      {/* 1. BANK CARD DESIGN */}
      <div className="relative w-full max-w-md mx-auto h-56 rounded-[2.5rem] bg-gradient-to-br from-zinc-900 via-black to-zinc-900 border border-white/10 shadow-2xl shadow-black/50 overflow-hidden mb-10 transform transition-transform hover:scale-[1.02]">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
          
          <div className="relative z-10 p-8 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start">
                  <div>
                      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Joriy Balans</p>
                      <h2 className="text-3xl font-black text-white tracking-tight">
                          {balance.toLocaleString()} <span className="text-orange-500 text-lg">UZS</span>
                      </h2>
                  </div>
                  <div className="w-12 h-8 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-md border border-white/5">
                      <WalletIcon className="text-white w-5 h-5"/>
                  </div>
              </div>

              <div className="flex justify-between items-end">
                  <div>
                      <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-1">Karta Egasi</p>
                      <p className="text-white font-bold text-sm uppercase tracking-wider">{profile?.full_name || 'FOYDALANUVCHI'}</p>
                  </div>
                  <div>
                      <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-1 text-right">ID Raqam</p>
                      <p className="text-white font-mono text-sm tracking-widest">
                          {profile?.short_id ? `**** ${profile.short_id.slice(-4)}` : '**** 0000'}
                      </p>
                  </div>
              </div>
          </div>
      </div>

      {/* 2. QUICK ACTIONS */}
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-10">
          <button 
            onClick={() => onNavigate('billing')}
            className="group flex flex-col items-center justify-center p-5 bg-zinc-900 border border-white/5 rounded-[2rem] hover:bg-green-600/10 hover:border-green-500/30 transition-all active:scale-95"
          >
              <div className="w-12 h-12 bg-green-500/20 text-green-500 rounded-2xl flex items-center justify-center mb-2 group-hover:bg-green-500 group-hover:text-white transition-all">
                  <PlusIcon className="w-6 h-6"/>
              </div>
              <span className="text-xs font-bold text-white uppercase tracking-widest">To'ldirish</span>
          </button>

          <button 
            onClick={() => onNavigate('plans')}
            className="group flex flex-col items-center justify-center p-5 bg-zinc-900 border border-white/5 rounded-[2rem] hover:bg-orange-600/10 hover:border-orange-500/30 transition-all active:scale-95"
          >
              <div className="w-12 h-12 bg-orange-500/20 text-orange-500 rounded-2xl flex items-center justify-center mb-2 group-hover:bg-orange-500 group-hover:text-white transition-all">
                  <CrownIcon className="w-6 h-6"/>
              </div>
              <span className="text-xs font-bold text-white uppercase tracking-widest">Tariflar</span>
          </button>
      </div>

      {/* 3. TRANSACTION HISTORY */}
      <div className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-8 max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-orange-500 rounded-full"></div>
                  O'tkazmalar Tarixi
              </h3>
              <button className="p-2 bg-white/5 rounded-xl text-zinc-500 hover:text-white transition-colors">
                  <HistoryIcon className="w-5 h-5"/>
              </button>
          </div>

          {transactions.length === 0 ? (
              <div className="text-center py-10">
                  <Clock size={48} className="mx-auto text-zinc-800 mb-4"/>
                  <p className="text-zinc-600 font-bold uppercase tracking-widest text-xs">Hozircha tranzaksiyalar yo'q</p>
              </div>
          ) : (
              <div className="space-y-4">
                  {transactions.map((tx) => {
                      const isIncoming = tx.amount > 0;
                      return (
                          <div key={tx.id} className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl hover:border-white/10 transition-colors">
                              <div className="flex items-center gap-4">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isIncoming ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                      {isIncoming ? <ArrowDownLeft size={20}/> : <ArrowUpRight size={20}/>}
                                  </div>
                                  <div>
                                      <p className="text-sm font-bold text-white">{isIncoming ? "Hisob to'ldirish" : "Xarid / Obuna"}</p>
                                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{new Date(tx.created_at).toLocaleDateString()}</p>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <p className={`font-black text-sm ${isIncoming ? 'text-green-500' : 'text-white'}`}>
                                      {isIncoming ? '+' : ''}{tx.amount.toLocaleString()}
                                  </p>
                                  <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">UZS</p>
                              </div>
                          </div>
                      );
                  })}
              </div>
          )}
      </div>
    </div>
  );
};
