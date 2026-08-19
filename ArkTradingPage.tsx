

import React, { useState, useEffect, useRef } from 'react';
import { User, Repeat, List, Home, TrendingUp, CreditCard, Play, Brain, Clock, X, Phone, Mail, Hash, AtSign, LogOut, Lock } from 'lucide-react';
import { supabase } from './services/supabaseClient';
import { getArkWallet, getArkMarketHistory, requestArkWithdrawal, getArkSettings, getContestTasks, getArkAds, getArkQuizzes, recordArkSpinResult, rewardArkSpins, claimArkAdReward, getUserProfile } from './services/dbService';
import { ArkWallet, ArkMarketData, ContestTask, ArkAd, ArkQuiz, WheelPrize, UserProfile } from './types';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useNotification } from './hooks/useNotification';
import { BackArrowIcon } from './components/icons/BackArrowIcon';
import { ChartIcon } from './components/icons/ChartIcon';
import { BankCardIcon } from './components/icons/BankCardIcon';

// --- Components ---

const Nav: React.FC<{ activeTab: string, onTabChange: (tab: string) => void }> = ({ activeTab, onTabChange }) => {
    const tabs = [
        { id: 'home', label: 'Uy', icon: <Home size={20} /> },
        { id: 'analysis', label: 'Bozor', icon: <ChartIcon className="w-5 h-5" /> },
        { id: 'trade', label: '', icon: <div className="w-14 h-14 -mt-6 bg-yellow-500 rounded-full flex items-center justify-center border-4 border-gray-950 shadow-lg animate-pulse"><span className="text-2xl font-black text-black">🎰</span></div> }, 
        { id: 'wallet', label: 'Hamyon', icon: <BankCardIcon className="w-5 h-5" /> },
        { id: 'tasks', label: 'Vazifalar', icon: <List size={20} /> },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-gray-800 pb-safe z-40 lg:hidden">
            <div className="flex justify-around items-center h-16 px-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`flex flex-col items-center justify-center w-full h-full ${activeTab === tab.id ? 'text-yellow-500' : 'text-gray-500'}`}
                    >
                        {tab.icon}
                        {tab.label && <span className="text-[10px] mt-1 font-medium">{tab.label}</span>}
                    </button>
                ))}
            </div>
        </div>
    );
};

const PriceChart: React.FC<{ data: ArkMarketData[] }> = ({ data }) => {
    if (data.length < 2) return <div className="h-48 flex items-center justify-center text-gray-600">Ma'lumot yetarli emas</div>;
    
    const maxPrice = Math.max(...data.map(d => d.price));
    const minPrice = Math.min(...data.map(d => d.price));
    const range = maxPrice - minPrice || 1;
    
    // Force "No Loss" visual: Even if data drops (which shouldn't happen in new logic), we draw it green
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((d.price - minPrice) / range) * 100;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="w-full h-64 relative bg-black/20 rounded-lg border border-gray-800 overflow-hidden p-4">
             <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                <polyline 
                    fill="none" 
                    stroke="#22c55e" // Green for growth
                    strokeWidth="2" 
                    points={points} 
                    vectorEffect="non-scaling-stroke"
                />
                {/* Gradient Fill */}
                <defs>
                    <linearGradient id="chartGrad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity="0.2"/>
                        <stop offset="100%" stopColor="#22c55e" stopOpacity="0"/>
                    </linearGradient>
                </defs>
                <polygon points={`0,100 ${points} 100,100`} fill="url(#chartGrad)" />
             </svg>
             <div className="absolute top-2 right-2 text-xs text-green-400 font-mono font-bold">
                H: {maxPrice} UZS
             </div>
        </div>
    );
};

// --- WHEEL COMPONENT ---
const ArkWheel: React.FC<{ 
    prizes: WheelPrize[], 
    onWin: (prize: WheelPrize) => void,
    canSpin: boolean,
    spinsLeft: number
}> = ({ prizes, onWin, canSpin, spinsLeft }) => {
    const [spinning, setSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);

    const spin = () => {
        if (spinning || !canSpin) return;
        setSpinning(true);

        // Determine result
        const rand = Math.random() * 100;
        let cumulative = 0;
        let selectedPrize = prizes[0];
        for (const prize of prizes) {
            cumulative += prize.probability;
            if (rand <= cumulative) {
                selectedPrize = prize;
                break;
            }
        }

        const segmentAngle = 360 / prizes.length;
        const index = prizes.indexOf(selectedPrize);
        // const extraSpins = 360 * 5; 
        
        setRotation(prev => prev + 360 * 5 + (360 - index * segmentAngle)); // Simple accumulation

        setTimeout(() => {
            setSpinning(false);
            onWin(selectedPrize);
        }, 5000);
    };

    const conic = `conic-gradient(${prizes.map((p, i) => `${p.color} ${i * (100/prizes.length)}% ${(i+1) * (100/prizes.length)}%`).join(', ')})`;

    return (
        <div className="flex flex-col items-center py-10">
            <div className="relative w-72 h-72">
                 {/* Pointer */}
                 <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[20px] border-t-white z-20"></div>
                 
                 <div 
                    className="w-full h-full rounded-full overflow-hidden transition-transform duration-[5000ms] cubic-bezier(0.2, 0.8, 0.2, 1) border-4 border-gray-800"
                    style={{ background: conic, transform: `rotate(${rotation}deg)` }}
                 >
                    {prizes.map((p, i) => {
                        const angle = 360 / prizes.length;
                        const rot = i * angle + angle / 2;
                        return (
                            <div key={i} className="absolute top-0 left-0 w-full h-full flex justify-center pt-4" style={{ transform: `rotate(${rot}deg)` }}>
                                <span className="bg-black/30 text-white text-xs px-1 rounded font-bold" style={{ writingMode: 'vertical-rl' }}>{p.label}</span>
                            </div>
                        )
                    })}
                 </div>
            </div>
            <button 
                onClick={spin} 
                disabled={spinning || !canSpin}
                className="mt-8 bg-yellow-500 text-black font-black px-8 py-3 rounded-full shadow-lg shadow-yellow-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {spinning ? 'AYLANMOQDA...' : `SPIN (${spinsLeft})`}
            </button>
            {!canSpin && <p className="text-xs text-gray-500 mt-2">Spin tugadi. Vazifa bajarib yoki Viktorina o'ynab toping!</p>}
        </div>
    );
};

// --- QUIZ MODAL ---
const QuizModal: React.FC<{ onClose: () => void, onComplete: (won: boolean, amount: number) => void }> = ({ onClose, onComplete }) => {
    const [questions, setQuestions] = useState<ArkQuiz[]>([]);
    const [index, setIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [loading, setLoading] = useState(true);
    const [done, setDone] = useState(false);

    useEffect(() => {
        getArkQuizzes().then(qs => {
            // Shuffle and take 3
            const random = qs.sort(() => 0.5 - Math.random()).slice(0, 3);
            setQuestions(random);
            setLoading(false);
        });
    }, []);

    const handleAnswer = (opt: string) => {
        if (opt === questions[index].correct_option) setScore(s => s + 1);
        if (index + 1 < questions.length) setIndex(i => i + 1);
        else setDone(true);
    };

    const finish = () => {
        const won = score >= 2; // Need 2 out of 3
        onComplete(won, 1);
    }

    if (loading) return <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"><LoadingSpinner /></div>;
    if (questions.length === 0) return <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center text-white p-4">Savollar yo'q<button onClick={onClose} className="ml-4 text-red-500">Yopish</button></div>;

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md border border-yellow-500/30">
                {!done ? (
                    <>
                        <h3 className="text-yellow-500 font-bold mb-4">Savol {index+1}/{questions.length}</h3>
                        <p className="text-white text-lg mb-6">{questions[index].question}</p>
                        <div className="space-y-2">
                            {['a','b','c','d'].map(o => (
                                <button key={o} onClick={() => handleAnswer(o)} className="w-full bg-gray-700 p-3 rounded text-left hover:bg-gray-600 text-gray-200 uppercase">
                                    {questions[index][`option_${o}` as keyof ArkQuiz]}
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="text-center">
                        <h3 className="text-2xl text-white font-bold mb-2">Natija: {score}/{questions.length}</h3>
                        <p className="text-gray-400 mb-6">{score >= 2 ? "Tabriklaymiz! Spin yutdingiz." : "Afsuski yutqazdingiz. 2 ta to'g'ri javob kerak."}</p>
                        <button onClick={finish} className="bg-yellow-500 text-black font-bold px-6 py-2 rounded">Tamomlash</button>
                    </div>
                )}
            </div>
        </div>
    );
};

const UserProfileCard: React.FC<{ profile: UserProfile }> = ({ profile }) => {
    return (
        <div className="bg-gradient-to-r from-gray-900 to-black border border-yellow-600/30 p-5 rounded-xl relative overflow-hidden">
             <div className="absolute -right-6 -top-6 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl"></div>
             
             <div className="flex items-center gap-4 relative z-10">
                 <div className="w-20 h-20 rounded-full bg-gray-800 p-1 border-2 border-yellow-500/50 shadow-lg shadow-yellow-500/20">
                     {profile.avatar_url ? (
                         <img src={profile.avatar_url} alt="Profile" className="w-full h-full rounded-full object-cover" />
                     ) : (
                         <div className="w-full h-full rounded-full bg-gray-700 flex items-center justify-center text-gray-400"><User size={32}/></div>
                     )}
                 </div>
                 
                 <div className="flex-1 min-w-0">
                     <h2 className="text-xl font-bold text-white truncate">{profile.full_name || 'Foydalanuvchi'}</h2>
                     <p className="text-yellow-500 text-sm font-medium">@{profile.username || 'username'}</p>
                     <div className="flex flex-wrap gap-3 mt-2">
                         <span className="text-[10px] text-gray-400 flex items-center gap-1 bg-gray-800 px-2 py-0.5 rounded">
                             <Hash size={10}/> {profile.short_id || '---'}
                         </span>
                         <span className="text-[10px] text-gray-400 flex items-center gap-1 bg-gray-800 px-2 py-0.5 rounded">
                             <Phone size={10}/> {profile.phone || '---'}
                         </span>
                     </div>
                     <div className="mt-1 text-[10px] text-gray-500 flex items-center gap-1">
                         <Mail size={10}/> {profile.email || 'hidden'}
                     </div>
                 </div>
             </div>
        </div>
    );
};


export const ArkTradingPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('home');
    const [wallet, setWallet] = useState<ArkWallet | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [marketData, setMarketData] = useState<ArkMarketData[]>([]);
    const [settings, setSettings] = useState<any>({});
    const [ads, setAds] = useState<ArkAd[]>([]);
    const [contestTasks, setContestTasks] = useState<ContestTask[]>([]); 
    const [loading, setLoading] = useState(true);
    
    // Withdraw Form
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [cardNum, setCardNum] = useState('');
    const [cardHolder, setCardHolder] = useState('');
    const [wLoading, setWLoading] = useState(false);

    // Interactive States
    const [showQuiz, setShowQuiz] = useState(false);
    const [activeAd, setActiveAd] = useState<ArkAd | null>(null);
    const [adTimer, setAdTimer] = useState(0);

    const { addNotification } = useNotification();

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const [w, p, m, s, a, t] = await Promise.all([
                getArkWallet(user.id),
                getUserProfile(user.id),
                getArkMarketHistory(),
                getArkSettings(),
                getArkAds(),
                getContestTasks() 
            ]);

            setWallet(w);
            // Manually inject email from auth if missing in profile (security rule might hide it)
            const fullProfile = { ...p, email: p?.email || user.email };
            setProfile(fullProfile as UserProfile);
            
            setMarketData(m);
            setSettings(s);
            setAds(a);
            setContestTasks(t);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // --- Actions ---

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isMarketClosed) return; // Extra safety
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setWLoading(true);
        try {
            await requestArkWithdrawal(user.id, Number(withdrawAmount), cardNum, cardHolder);
            addNotification({ type: 'success', title: 'Qabul qilindi', message: 'So\'rov yuborildi.' });
            setWithdrawAmount('');
            init(); 
        } catch (e: any) {
            addNotification({ type: 'error', title: 'Xatolik', message: e.message });
        } finally {
            setWLoading(false);
        }
    };

    const handleSpinWin = async (prize: WheelPrize) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await recordArkSpinResult(user.id, prize);
            if (prize.type === 'ark') addNotification({ type: 'success', title: 'Yutuq!', message: `+${prize.value} ARK` });
            else addNotification({ type: 'info', title: 'Natija', message: prize.label });
            init();
        }
    };

    const handleQuizResult = async (won: boolean, spins: number) => {
        setShowQuiz(false);
        if (won) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await rewardArkSpins(user.id, spins);
                addNotification({ type: 'success', title: 'Yutuq!', message: `+${spins} Spin` });
                init();
            }
        }
    };

    // Ad Watch Logic
    useEffect(() => {
        let interval: any;
        if (activeAd && adTimer > 0) {
            interval = setInterval(() => setAdTimer(t => t - 1), 1000);
        } else if (activeAd && adTimer === 0) {
            // Timer finished
        }
        return () => clearInterval(interval);
    }, [activeAd, adTimer]);

    const finishAd = async () => {
        if (!activeAd) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await claimArkAdReward(user.id, activeAd.reward_ark, activeAd.title);
            addNotification({ type: 'success', title: 'Mukofot', message: `+${activeAd.reward_ark} ARK` });
            setActiveAd(null);
            init();
        }
    }

    if (loading) return <div className="flex justify-center h-screen items-center bg-[#050505]"><LoadingSpinner /></div>;

    const currentPrice = Number(settings.current_price || 300);
    const isGameActive = settings.game_status === 'active';
    const isMarketClosed = settings.game_status === 'closed';
    const wheelPrizes = settings.wheel_config || [];

    const AdsSidebar = () => (
        <div className="space-y-4 h-full overflow-y-auto">
            <h3 className="text-white font-bold text-sm flex items-center gap-2 mb-4 border-b border-gray-800 pb-2">
                <Play size={16} className="text-blue-500"/> Faol Vazifalar
            </h3>
            {ads.length === 0 && <p className="text-gray-500 text-xs">Hozircha vazifalar yo'q.</p>}
            {ads.map(ad => (
                <div key={ad.id} className="bg-gray-900 border border-gray-800 p-3 rounded-lg flex justify-between items-center hover:bg-gray-800 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-900/20 p-2 rounded"><Play className="text-blue-400" size={16}/></div>
                        <div className="min-w-0">
                            <p className="text-white font-medium text-sm truncate max-w-[100px]">{ad.title}</p>
                            <p className="text-gray-500 text-[10px]">{ad.duration_sec}s • <span className="text-green-400">+{ad.reward_ark}</span></p>
                        </div>
                    </div>
                    <button 
                        onClick={() => { setActiveAd(ad); setAdTimer(ad.duration_sec); }}
                        className="bg-blue-600 text-[10px] px-3 py-1.5 rounded font-bold text-white hover:bg-blue-700"
                    >
                        START
                    </button>
                </div>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050505] text-gray-200 font-sans pb-20 lg:pb-0">
            {/* Header */}
            <div className="bg-[#0a0a0a] p-4 flex items-center justify-between sticky top-0 z-40 border-b border-gray-800">
                <div className="flex items-center gap-3">
                    <button onClick={() => window.location.href = '/?page=dashboard'} className="text-gray-500 hover:text-white transition-colors"><BackArrowIcon className="w-6 h-6" /></button>
                    <h1 className="text-lg font-bold text-yellow-500 tracking-widest">ARK TRADER</h1>
                </div>
                <div className={`px-2 py-0.5 text-[10px] rounded border ${isGameActive ? 'border-green-500 text-green-500' : isMarketClosed ? 'border-red-500 text-red-500' : 'border-yellow-500 text-yellow-500'} animate-pulse`}>
                    {isMarketClosed ? 'CLOSED' : isGameActive ? 'LIVE' : 'PAUSED'}
                </div>
            </div>

            <div className="flex h-[calc(100vh-60px)]">
                 {/* MAIN CONTENT AREA */}
                 <div className="flex-1 p-4 overflow-y-auto max-w-3xl mx-auto w-full">
                    {/* HOME TAB */}
                    {activeTab === 'home' && wallet && profile && (
                        <div className="animate-fade-in space-y-4">
                            {/* Start Message */}
                            {settings.start_message && (
                                <div className="bg-blue-900/20 border border-blue-500/50 p-4 rounded-lg text-blue-200 text-sm text-center animate-pulse">
                                    {settings.start_message}
                                </div>
                            )}

                            <UserProfileCard profile={profile} />

                            {/* Balance Card */}
                            <div className="bg-gradient-to-br from-gray-900 to-black border border-yellow-600/30 p-6 rounded-2xl shadow-lg relative overflow-hidden">
                                <div className="absolute -right-10 -top-10 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl"></div>
                                <p className="text-gray-500 text-xs uppercase tracking-widest">Total Balance</p>
                                <h2 className="text-3xl font-mono font-bold text-white mt-1">{wallet.balance.toFixed(8)} ARK</h2>
                                <p className="text-yellow-500/80 text-sm mt-1">≈ {(wallet.balance * currentPrice).toLocaleString()} UZS</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 text-center">
                                    <p className="text-xs text-gray-500">Available Spins</p>
                                    <p className="text-xl font-bold text-white">{wallet.available_spins}</p>
                                </div>
                                <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 text-center">
                                    <p className="text-xs text-gray-500">Earned Total</p>
                                    <p className="text-xl font-bold text-green-400">{wallet.total_earned.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ANALYSIS TAB */}
                    {activeTab === 'analysis' && (
                        <div className="animate-fade-in space-y-4">
                            <h2 className="text-xl font-bold text-white mb-4">Market Analysis</h2>
                            <PriceChart data={marketData} />
                            <div className="flex justify-between text-sm text-gray-400 mt-2 px-2">
                                <span>Current Price:</span>
                                <span className="text-white font-bold">{currentPrice} UZS</span>
                            </div>
                            <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg text-sm text-green-200">
                                Bozor "No Loss" tizimida ishlaydi. Narx faqat barqaror turadi yoki o'sadi.
                            </div>
                        </div>
                    )}

                    {/* TRADE (WHEEL) TAB */}
                    {activeTab === 'trade' && wallet && (
                        <div className="animate-fade-in relative">
                            {isMarketClosed && (
                                <div className="absolute inset-0 bg-black/80 z-10 flex items-center justify-center rounded-xl">
                                    <div className="text-center p-6 bg-gray-900 border border-red-500 rounded-xl">
                                        <Lock size={48} className="text-red-500 mx-auto mb-4"/>
                                        <h3 className="text-xl font-bold text-white">BOZOR YOPIQ</h3>
                                        <p className="text-gray-400 text-sm mt-2">Savdo va o'yinlar vaqtincha to'xtatilgan.</p>
                                    </div>
                                </div>
                            )}
                            
                            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 mb-4 text-center">
                                <p className="text-yellow-500 font-bold">LUCKY SPIN</p>
                                <p className="text-xs text-gray-400">Aylantirishlar soni: {wallet.available_spins}</p>
                            </div>
                            <ArkWheel 
                                prizes={wheelPrizes} 
                                canSpin={wallet.available_spins > 0 && !isMarketClosed} 
                                spinsLeft={wallet.available_spins}
                                onWin={handleSpinWin} 
                            />
                            <button 
                                onClick={() => setShowQuiz(true)}
                                disabled={isMarketClosed}
                                className="w-full mt-6 bg-purple-900/30 border border-purple-500/50 text-purple-300 py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Brain size={20}/> Spin Yutish (Viktorina)
                            </button>
                        </div>
                    )}

                    {/* WALLET / WITHDRAW TAB */}
                    {activeTab === 'wallet' && (
                        <div className="animate-fade-in space-y-6 relative">
                            {isMarketClosed && (
                                <div className="absolute inset-0 bg-black/80 z-10 flex items-center justify-center rounded-xl">
                                    <div className="text-center p-6 bg-gray-900 border border-red-500 rounded-xl">
                                        <Lock size={48} className="text-red-500 mx-auto mb-4"/>
                                        <h3 className="text-xl font-bold text-white">HAMYON BLOKLANGAN</h3>
                                        <p className="text-gray-400 text-sm mt-2">Bozor yopiq paytida pul chiqarish mumkin emas.</p>
                                    </div>
                                </div>
                            )}

                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><BankCardIcon className="w-6 h-6"/> Withdraw Funds</h2>
                            
                            <form onSubmit={handleWithdraw} className="bg-gray-900 p-5 rounded-xl border border-gray-800 space-y-4">
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">User Email (Automatic)</label>
                                    <input 
                                        type="text" 
                                        value={profile?.email || 'Unknown'} 
                                        disabled 
                                        className="w-full bg-black border border-gray-700 rounded p-3 text-gray-400 cursor-not-allowed" 
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Amount (ARK)</label>
                                    <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-yellow-500 outline-none" placeholder="0.00" />
                                    <p className="text-right text-xs text-gray-500 mt-1">Min: 1 ARK</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Card Number</label>
                                    <input type="text" value={cardNum} onChange={e => setCardNum(e.target.value)} className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-yellow-500 outline-none" placeholder="8600 0000 0000 0000" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Card Holder Name</label>
                                    <input type="text" value={cardHolder} onChange={e => setCardHolder(e.target.value)} className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-yellow-500 outline-none" placeholder="VALIYEVA A." />
                                </div>
                                <button type="submit" disabled={wLoading || !withdrawAmount || isMarketClosed} className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 rounded-lg mt-2 disabled:opacity-50">
                                    {wLoading ? 'Processing...' : 'Submit Request'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* TASKS TAB (Mobile only) */}
                    {activeTab === 'tasks' && (
                         <div className="lg:hidden">
                             <AdsSidebar />
                         </div>
                    )}
                 </div>

                 {/* SIDEBAR (Desktop Only) */}
                 <div className="hidden lg:block w-80 bg-gray-900/50 border-l border-gray-800 p-4">
                     <AdsSidebar />
                 </div>
            </div>

            {/* Quiz Modal */}
            {showQuiz && <QuizModal onClose={() => setShowQuiz(false)} onComplete={handleQuizResult} />}
            
            {/* Ad Watch Modal */}
            {activeAd && (
                <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-4">
                    <div className="w-full max-w-md aspect-video bg-gray-900 mb-4 flex items-center justify-center overflow-hidden rounded border border-gray-800">
                         {activeAd.media_type === 'video' ? (
                             <video src={activeAd.media_url} autoPlay className="w-full h-full object-contain" />
                         ) : (
                             <img src={activeAd.media_url} className="w-full h-full object-contain" />
                         )}
                    </div>
                    <div className="text-center">
                        {adTimer > 0 ? (
                            <p className="text-2xl font-bold text-white animate-pulse">{adTimer}s</p>
                        ) : (
                            <button onClick={finishAd} className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold text-lg animate-bounce">
                                CLAIM +{activeAd.reward_ark} ARK
                            </button>
                        )}
                    </div>
                </div>
            )}

            <Nav activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
    );
};