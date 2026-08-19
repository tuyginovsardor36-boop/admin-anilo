
import React, { useState, useEffect, useRef } from 'react';
import { User, Gift, Repeat, List, CheckCircle, Lock, Brain, X, ArrowRight, Play, Clock } from 'lucide-react';
import { supabase } from './services/supabaseClient';
// Added getUserProfile to imports
import { getUserProfile, getATCTransactions, getContestSettings, getContestTasks, claimATCReward, convertATCtoUZS, getQuizQuestions, rewardExtraSpin, getATCWallet, getContestAds } from './services/dbService';
import { ATCWallet, ATCTransaction, ContestTask, WheelPrize, UserProfile, QuizQuestion, ContestAd } from './types';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useNotification } from './hooks/useNotification';
import { BackArrowIcon } from './components/icons/BackArrowIcon';

// --- COMPONENTS ---

const ConcursNav: React.FC<{ activeTab: string, onTabChange: (tab: string) => void }> = ({ activeTab, onTabChange }) => {
    const tabs = [
        { id: 'home', label: 'Uy', icon: <User size={20} /> },
        { id: 'contest', label: 'Konkurs', icon: <Gift size={20} /> },
        { id: 'wheel', label: '', icon: <div className="w-14 h-14 -mt-6 bg-orange-600 rounded-full flex items-center justify-center border-4 border-gray-900 shadow-lg animate-pulse"><span className="text-2xl">🎡</span></div> }, // Big Icon
        { id: 'convert', label: 'Ayirboshlash', icon: <Repeat size={20} /> },
        { id: 'tasks', label: 'Shartlar', icon: <List size={20} /> },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 pb-safe z-40">
            <div className="flex justify-around items-center h-16 px-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id === 'wheel' ? 'wheel' : tab.id)}
                        className={`flex flex-col items-center justify-center w-full h-full ${activeTab === tab.id ? 'text-orange-500' : 'text-gray-500'}`}
                    >
                        {tab.icon}
                        {tab.label && <span className="text-[10px] mt-1 font-medium">{tab.label}</span>}
                    </button>
                ))}
            </div>
        </div>
    );
};

const LuckyWheel: React.FC<{ 
    settings: any, 
    onWin: (prize: WheelPrize) => void, 
    canSpin: boolean, 
    onStartQuiz: () => void,
    spinsAvailable: number 
}> = ({ settings, onWin, canSpin, onStartQuiz, spinsAvailable }) => {
    const [spinning, setSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const prizes: WheelPrize[] = settings.wheel_config || [];
    
    const spin = () => {
        if (spinning || !canSpin) return;
        setSpinning(true);

        // Determine result based on probability
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

        // Calculate rotation
        const segmentAngle = 360 / prizes.length;
        const prizeIndex = prizes.indexOf(selectedPrize);
        // Add extra spins (5-10 full spins)
        const extraSpins = 360 * (5 + Math.floor(Math.random() * 5)); 
        // Align to center of segment
        const targetRotation = extraSpins + (360 - (prizeIndex * segmentAngle));
        
        setRotation(targetRotation);

        setTimeout(() => {
            setSpinning(false);
            onWin(selectedPrize);
            // Reset logic handled by parent re-init
        }, 5000);
    };

    // Dynamic Gradient for segments
    const conicGradient = `conic-gradient(${prizes.map((p, i) => 
        `${p.color} ${i * (100/prizes.length)}% ${(i+1) * (100/prizes.length)}%`
    ).join(', ')})`;

    return (
        <div className="flex flex-col items-center justify-center py-10">
            <div className="relative w-72 h-72 sm:w-80 sm:h-80">
                {/* Pointer */}
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-white drop-shadow-xl"></div>
                
                {/* Wheel Container */}
                <div className="absolute inset-0 rounded-full border-8 border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.3)]"></div>

                {/* Spinning Wheel */}
                <div 
                    className="w-full h-full rounded-full overflow-hidden relative transition-transform duration-[5000ms] cubic-bezier(0.25, 0.1, 0.25, 1)"
                    style={{ 
                        transform: `rotate(${rotation}deg)`,
                        background: conicGradient
                    }}
                >
                    {prizes.map((prize, idx) => {
                        const angle = 360 / prizes.length;
                        const rotate = (idx * angle) + (angle / 2); // Center of segment
                        return (
                            <div 
                                key={prize.id}
                                className="absolute w-full h-full top-0 left-0 flex justify-center pt-4"
                                style={{ transform: `rotate(${rotate}deg)` }}
                            >
                                <span className="text-white font-bold text-xs sm:text-sm drop-shadow-md bg-black/20 px-1 rounded" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                                    {prize.label}
                                </span>
                            </div>
                        )
                    })}
                </div>
                
                {/* Center Cap */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full z-10 flex items-center justify-center border-4 border-gray-200 shadow-inner">
                     <span className="font-black text-orange-600 text-xl">ATC</span>
                </div>
            </div>

            <div className="mt-8 flex flex-col items-center gap-2">
                {canSpin ? (
                    <button 
                        onClick={spin} 
                        disabled={spinning}
                        className="px-10 py-4 bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-black text-xl rounded-full shadow-lg transform active:scale-95 disabled:opacity-50 tracking-widest animate-pulse"
                    >
                        {spinning ? 'AYLANMOQDA...' : 'AYLANTIRISH'}
                    </button>
                ) : (
                    <button 
                        onClick={onStartQuiz}
                        className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-full shadow-lg flex items-center gap-2"
                    >
                        <Brain className="w-5 h-5" />
                        VIKTORINA O'YNASH
                    </button>
                )}

                <p className="text-gray-400 text-sm mt-2">
                    {canSpin 
                        ? `Mavjud imkoniyatlar: ${spinsAvailable}` 
                        : "Bugungi bepul imkoniyat tugadi."}
                </p>
                {!canSpin && <p className="text-xs text-gray-500">Viktorinada qatnashib yana aylantirish imkonini yuting!</p>}
            </div>
        </div>
    );
};

const ConvertModal: React.FC<{ 
    onClose: () => void, 
    onConfirm: (amount: number) => void, 
    balance: number, 
    rate: number,
    isLoading: boolean 
}> = ({ onClose, onConfirm, balance, rate, isLoading }) => {
    const [amount, setAmount] = useState<string>('');
    const [uzsValue, setUzsValue] = useState(0);

    useEffect(() => {
        const val = Number(amount);
        if (!isNaN(val)) {
            setUzsValue(val * rate);
        } else {
            setUzsValue(0);
        }
    }, [amount, rate]);

    const handleMax = () => {
        setAmount(Math.floor(balance).toString());
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-gray-900 border border-blue-500/50 rounded-2xl w-full max-w-sm p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                    <X size={24} />
                </button>
                
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Repeat className="text-blue-500" /> Ayirboshlash
                </h3>

                <div className="bg-gray-800 p-4 rounded-xl mb-4">
                    <p className="text-xs text-gray-400 mb-1">Sizning balansingiz</p>
                    <p className="text-2xl font-bold text-orange-400">{balance.toFixed(2)} ATC</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-300 mb-1">ATC miqdori</label>
                        <div className="relative">
                            <input 
                                type="number" 
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="0"
                                className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none pr-16"
                            />
                            <button 
                                onClick={handleMax}
                                className="absolute right-2 top-2 bg-blue-900/50 text-blue-300 text-xs px-2 py-1.5 rounded hover:bg-blue-900"
                            >
                                MAX
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <ArrowRight className="text-gray-500 rotate-90 sm:rotate-0" />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-300 mb-1">Qabul qilasiz (UZS)</label>
                        <div className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-green-400 font-bold font-mono">
                            {uzsValue.toLocaleString()} UZS
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    <p className="text-xs text-gray-500 text-center mb-3">Kurs: 1 ATC = {rate} UZS</p>
                    <button 
                        onClick={() => {
                            const val = Number(amount);
                            if (val > 0 && val <= balance) onConfirm(val);
                        }}
                        disabled={isLoading || Number(amount) <= 0 || Number(amount) > balance}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/30"
                    >
                        {isLoading ? 'Bajarilmoqda...' : 'Tasdiqlash'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const RulesModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-md w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800 rounded-t-2xl">
                <h3 className="text-lg font-bold text-white">Qoidalar va Maxfiylik</h3>
                <button onClick={onClose}><X className="text-gray-400" /></button>
            </div>
            <div className="p-6 overflow-y-auto text-gray-300 text-sm space-y-4">
                <p><strong>1. ATC Tizimi:</strong> ATC (Anilo Token Coin) - bu sayt ichki valyutasi bo'lib, uni faqat o'yinlar orqali yig'ish va sayt xizmatlariga almashtirish mumkin.</p>
                <p><strong>2. Ayirboshlash:</strong> Yig'ilgan ATC larni UZS ga almashtirishda admin tomonidan belgilangan kurs amal qiladi. Mablag' foydalanuvchi balansiga tushadi.</p>
                <p><strong>3. Naqdlashtirish:</strong> Balansdagi mablag'ni naqd pul ko'rinishida yoki bank kartasiga chiqarib olish imkoniyati mavjud emas. Faqat Premium obuna uchun ishlatiladi.</p>
                <p><strong>4. Halollik:</strong> Tizimni aldashga urinish (bot ishlatish, ko'p akkaunt ochish) hisobning bloklanishiga va barcha yutuqlarning bekor qilinishiga olib keladi.</p>
                <p><strong>5. Limitlar:</strong> Kunlik bepul aylantirish limiti 1 marta. Qo'shimcha imkoniyat viktorina savollariga javob berish orqali olinadi.</p>
            </div>
            <div className="p-4 border-t border-gray-700 bg-gray-800 rounded-b-2xl">
                <button onClick={onClose} className="w-full bg-orange-600 py-2 rounded-lg text-white font-bold">Tushundim</button>
            </div>
        </div>
    </div>
);

const QuizModal: React.FC<{ onClose: () => void, onComplete: (won: boolean) => void, settings: any }> = ({ onClose, onComplete, settings }) => {
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [loading, setLoading] = useState(true);
    const [finished, setFinished] = useState(false);

    useEffect(() => {
        loadQuestions();
    }, []);

    const loadQuestions = async () => {
        const count = Number(settings.quiz_questions_count || 5);
        const qs = await getQuizQuestions(count);
        setQuestions(qs);
        setLoading(false);
    };

    const handleAnswer = (option: string) => {
        if (option === questions[currentIndex].correct_option) {
            setScore(prev => prev + 1);
        }
        
        if (currentIndex + 1 < questions.length) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setFinished(true);
        }
    };

    const handleFinish = () => {
        const passing = Number(settings.quiz_passing_score || 3);
        onComplete(score >= passing);
    };

    if (loading) return <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"><LoadingSpinner /></div>;

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 border border-purple-500/50 rounded-2xl w-full max-w-md p-6 relative">
                {!finished ? (
                    <>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-orange-400 font-bold">Savol {currentIndex + 1}/{questions.length}</h3>
                            <span className="text-xs text-gray-400">To'g'ri: {score}</span>
                        </div>
                        <p className="text-white text-lg font-medium mb-6 min-h-[60px]">{questions[currentIndex]?.question}</p>
                        <div className="space-y-3">
                            {['a', 'b', 'c', 'd'].map((opt) => (
                                <button 
                                    key={opt}
                                    onClick={() => handleAnswer(opt)}
                                    className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-gray-200 transition-colors border border-gray-600 hover:border-purple-500"
                                >
                                    {questions[currentIndex][`option_${opt}` as keyof QuizQuestion]}
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-6">
                        <h3 className="text-2xl font-bold text-white mb-2">Natija</h3>
                        <div className="text-6xl mb-4">{score >= Number(settings.quiz_passing_score || 3) ? '🎉' : '😔'}</div>
                        <p className="text-gray-300 mb-4">
                            Siz {questions.length} ta savoldan {score} tasiga to'g'ri javob berdingiz.
                        </p>
                        {score >= Number(settings.quiz_passing_score || 3) ? (
                            <div className="bg-green-900/30 border border-green-500/50 p-4 rounded-xl mb-6">
                                <p className="text-green-400 font-bold">Tabriklaymiz! Siz qo'shimcha aylantirish imkoniyatini qo'lga kiritdingiz.</p>
                            </div>
                        ) : (
                            <div className="bg-red-900/30 border border-red-500/50 p-4 rounded-xl mb-6">
                                <p className="text-red-400">Afsuski, yutuq uchun {settings.quiz_passing_score} ta to'g'ri javob kerak edi.</p>
                            </div>
                        )}
                        <button onClick={handleFinish} className="bg-orange-600 w-full py-3 rounded-xl font-bold text-white">Davom etish</button>
                    </div>
                )}
            </div>
        </div>
    );
};

const WatchAdModal: React.FC<{ ad: ContestAd, onClose: () => void, onComplete: () => void }> = ({ ad, onClose, onComplete }) => {
    const [timeLeft, setTimeLeft] = useState(ad.duration_sec);
    const [canClose, setCanClose] = useState(false);
    
    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setCanClose(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [ad.duration_sec]);

    return (
        <div className="fixed inset-0 bg-black z-[60] flex flex-col items-center justify-center p-4">
            <div className="relative w-full max-w-lg aspect-video bg-gray-900 rounded-xl overflow-hidden border border-gray-700 shadow-2xl">
                {ad.media_type === 'video' ? (
                    <video src={ad.media_url} autoPlay muted playsInline className="w-full h-full object-contain" />
                ) : (
                    <img src={ad.media_url} alt={ad.title} className="w-full h-full object-contain" />
                )}
                
                {/* Timer Overlay */}
                <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-bold border border-white/20">
                    {timeLeft > 0 ? `${timeLeft}s` : 'Tayyor'}
                </div>
            </div>
            
            <div className="mt-8 w-full max-w-sm">
                {canClose ? (
                    <button 
                        onClick={onComplete}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold text-lg animate-bounce shadow-lg shadow-green-900/50"
                    >
                        MUKOFOTNI OLISH (+{ad.reward_atc} ATC)
                    </button>
                ) : (
                    <p className="text-center text-gray-500 animate-pulse">Iltimos, reklama tugashini kuting...</p>
                )}
            </div>
            
            {/* Emergency Close (Optional, or prevent it) */}
            {/* <button onClick={onClose} className="absolute top-4 left-4 text-gray-500">Yopish</button> */}
        </div>
    );
};

// --- MAIN PAGE ---

export const AniConcursPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('home');
    const [loading, setLoading] = useState(true);
    
    // Data States
    const [profileData, setProfileData] = useState<UserProfile & { atc_balance: number, atc_converted: number, atc_earned: number, active_days: number } | null>(null);
    const [transactions, setTransactions] = useState<ATCTransaction[]>([]);
    const [settings, setSettings] = useState<any>({});
    const [tasks, setTasks] = useState<ContestTask[]>([]);
    const [ads, setAds] = useState<ContestAd[]>([]); // New ads state
    const [wallet, setWallet] = useState<ATCWallet | null>(null);

    // Logic States
    const [canSpin, setCanSpin] = useState(false);
    const [spinsAvailable, setSpinsAvailable] = useState(0);
    const [showRules, setShowRules] = useState(false);
    const [showQuiz, setShowQuiz] = useState(false);
    const [showConvertModal, setShowConvertModal] = useState(false);
    const [convertLoading, setConvertLoading] = useState(false);
    
    // Watch Ad State
    const [activeAd, setActiveAd] = useState<ContestAd | null>(null);

    const { addNotification } = useNotification();

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch everything
            // FIX: Correctly mapping wallet fields to the expected state structure to avoid type mismatch and balance collision
            const [profRaw, tx, s, t, w, a] = await Promise.all([
                getUserProfile(user.id),
                getATCTransactions(user.id),
                getContestSettings(),
                getContestTasks(),
                getATCWallet(user.id),
                getContestAds() 
            ]);

            if (profRaw && w) {
                setProfileData({
                    ...profRaw,
                    atc_balance: w.balance,
                    atc_converted: w.total_converted,
                    atc_earned: w.total_earned,
                    active_days: w.active_days
                } as any);
            }

            setTransactions(tx);
            setSettings(s);
            setTasks(t);
            setWallet(w);
            setAds(a);

            // Calculate Spin Eligibility
            if (w) checkSpinStatus(w);

        } catch (e) {
            console.error("Contest init error", e);
        } finally {
            setLoading(false);
        }
    };

    const checkSpinStatus = (w: ATCWallet) => {
        // 1. Daily Free Spin
        const lastSpin = w.last_spin_at ? new Date(w.last_spin_at) : new Date(0);
        const today = new Date();
        const isSameDay = lastSpin.getDate() === today.getDate() && 
                          lastSpin.getMonth() === today.getMonth() && 
                          lastSpin.getFullYear() === today.getFullYear();
        
        const dailyAvailable = !isSameDay;
        const extraAvailable = w.extra_spins > 0;

        setCanSpin(dailyAvailable || extraAvailable);
        setSpinsAvailable((dailyAvailable ? 1 : 0) + w.extra_spins);
    };

    const handleWheelWin = async (prize: WheelPrize) => {
        if (!profileData) return;

        try {
            if (prize.type === 'atc') {
                await claimATCReward(profileData.id, prize.value, 'spin', `Baraban yutug'i: ${prize.label}`);
                addNotification({ type: 'success', title: 'Yutuq!', message: `Siz ${prize.label} yutib oldingiz!` });
            } else if (prize.type === 'uzs') {
                if (profileData.active_days >= 10) {
                    addNotification({ type: 'success', title: 'Jekpot!', message: `${prize.value} UZS yutib oldingiz! (Admin bilan bog'laning)` });
                } else {
                    addNotification({ type: 'warning', title: 'Shart bajarilmagan', message: `Pul yutug'ini olish uchun 10 kun faol bo'lishingiz kerak.` });
                }
            } else {
                 addNotification({ type: 'info', title: 'Omad kelmadi', message: 'Keyingi safar albatta yutasiz!' });
            }
            init(); // Refresh data
        } catch (e) {
            console.error(e);
        }
    };

    const handleQuizComplete = async (won: boolean) => {
        setShowQuiz(false);
        if (won && profileData) {
            const reward = Number(settings.quiz_reward_spins || 1);
            await rewardExtraSpin(profileData.id, reward);
            addNotification({ type: 'success', title: 'Mukofot', message: `Siz ${reward} ta aylantirish imkonini yutdingiz!` });
            init();
        }
    };
    
    const handleAdComplete = async () => {
        if (!activeAd || !profileData) return;
        try {
            await claimATCReward(profileData.id, activeAd.reward_atc, 'ad_watch', `Reklama: ${activeAd.title}`);
            addNotification({ type: 'success', title: 'Mukofot', message: `+${activeAd.reward_atc} ATC qo'shildi!` });
            setActiveAd(null);
            init();
        } catch (e) {
            console.error(e);
            addNotification({ type: 'error', title: 'Xatolik', message: 'Mukofotni olishda xatolik.' });
        }
    };

    const handleConvertConfirm = async (amount: number) => {
        if (!profileData) return;
        
        setConvertLoading(true);
        try {
            const rate = Number(settings.exchange_rate || 100);
            await convertATCtoUZS(profileData.id, amount, rate);
            addNotification({ type: 'success', title: 'Muvaffaqiyatli', message: 'Ayirboshlash amalga oshirildi.' });
            setShowConvertModal(false);
            init();
        } catch (e: any) {
            console.error(e);
            let msg = e.message;
            if (msg.includes("row-level security") || msg.includes("policy")) {
                msg = "Xatolik: Admin paneldan SQL qoidalarini yangilash kerak.";
            }
            addNotification({ type: 'error', title: 'Xatolik', message: msg });
        } finally {
            setConvertLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center h-screen items-center bg-gray-900"><LoadingSpinner /></div>;

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 pb-20">
             {/* Header */}
             <div className="bg-gray-800 p-4 flex items-center gap-3 shadow-md sticky top-0 z-40">
                <button onClick={() => window.history.back()} className="text-gray-400"><BackArrowIcon className="w-6 h-6" /></button>
                <h1 className="text-xl font-bold text-orange-500 font-mono tracking-wider">AniConcurs <span className="text-xs bg-orange-900/50 px-2 py-0.5 rounded ml-2 text-orange-200">BETA</span></h1>
                <div className="ml-auto bg-gray-700 px-3 py-1 rounded-full text-sm font-bold text-yellow-400 border border-yellow-600 font-mono">
                    {profileData?.atc_balance.toFixed(1)} ATC
                </div>
             </div>

             <div className="p-4 max-w-lg mx-auto">
                {/* HOME TAB */}
                {activeTab === 'home' && profileData && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 shadow-xl border border-gray-700 flex flex-col items-center text-center relative overflow-hidden">
                            {/* Background decoration */}
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 to-red-600"></div>
                            
                            <div className="w-24 h-24 bg-gray-700 rounded-full mb-4 border-4 border-orange-500 shadow-lg flex items-center justify-center overflow-hidden">
                                {profileData.avatar_url ? (
                                    <img src={profileData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={40} className="text-gray-400" />
                                )}
                            </div>
                            <h2 className="text-xl font-bold text-white">{profileData.full_name || 'Foydalanuvchi'}</h2>
                            <p className="text-sm text-gray-400 font-mono">ID: {profileData.short_id || '---'}</p>
                            
                            <div className="grid grid-cols-2 gap-3 mt-6 w-full text-left">
                                <div className="bg-black/30 p-3 rounded-xl border border-gray-700/50">
                                    <p className="text-[10px] text-gray-500 uppercase font-bold">Asosiy Balans</p>
                                    <p className="text-sm font-bold text-white">{profileData.balance.toLocaleString()} UZS</p>
                                </div>
                                <div className="bg-black/30 p-3 rounded-xl border border-gray-700/50">
                                    <p className="text-[10px] text-gray-500 uppercase font-bold">Telefon</p>
                                    <p className="text-sm font-bold text-white truncate">{profileData.phone || '---'}</p>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-3 w-full">
                                <div className="flex-1 bg-black/30 p-3 rounded-xl border border-green-900/30">
                                    <p className="text-xs text-gray-400">Jami Yig'ildi</p>
                                    <p className="text-lg font-bold text-green-400">+{profileData.atc_earned}</p>
                                </div>
                                <div className="flex-1 bg-black/30 p-3 rounded-xl border border-blue-900/30">
                                    <p className="text-xs text-gray-400">Ayirboshlandi</p>
                                    <p className="text-lg font-bold text-blue-400">{profileData.atc_converted.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                            <h3 className="font-bold text-gray-300 mb-3 flex items-center gap-2"><List size={16}/> So'nggi harakatlar</h3>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                {transactions.length === 0 && <p className="text-gray-500 text-sm text-center py-4">Tarix bo'sh</p>}
                                {transactions.map(tx => (
                                    <div key={tx.id} className="flex justify-between items-center text-sm bg-gray-900/50 p-3 rounded-lg border border-gray-700/50">
                                        <div>
                                            <p className="text-white text-xs font-medium">{tx.description}</p>
                                            <p className="text-[10px] text-gray-500">{new Date(tx.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <span className={`font-bold font-mono ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {tx.amount > 0 ? '+' : ''}{tx.amount}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* CONTEST TAB */}
                {activeTab === 'contest' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="bg-purple-900/30 border border-purple-500/30 p-6 rounded-xl text-center">
                            <Gift size={48} className="mx-auto text-purple-400 mb-4" />
                            <h2 className="text-2xl font-bold text-white mb-2">Katta Konkurs Boshlandi!</h2>
                            <p className="text-gray-300 text-sm">
                                Eng ko'p ATC yig'gan 3 ta ishtirokchiga "Iphone 15" yutib olish imkoniyati!
                                <br/><br/>
                                <span className="text-orange-400 font-bold">Muddat: 30-Fevralgacha</span>
                            </p>
                        </div>
                    </div>
                )}

                {/* WHEEL TAB */}
                {activeTab === 'wheel' && (
                    <div className="animate-fade-in h-full flex flex-col justify-center items-center min-h-[70vh]">
                         <LuckyWheel 
                            settings={settings} 
                            onWin={handleWheelWin} 
                            canSpin={canSpin} 
                            onStartQuiz={() => setShowQuiz(true)}
                            spinsAvailable={spinsAvailable}
                         />
                    </div>
                )}

                {/* CONVERT TAB */}
                {activeTab === 'convert' && profileData && (
                    <div className="animate-fade-in space-y-6">
                         <div className="bg-blue-900/20 border border-blue-500/30 p-6 rounded-xl">
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Repeat className="text-blue-400" /> Konvertatsiya
                            </h2>
                            <p className="text-gray-300 text-sm mb-4">
                                Yig'ilgan ATC tangalarini sayt balansiga (UZS) almashtiring.
                                <br/>
                                <span className="text-yellow-400 font-bold">Kurs: 1 ATC = {settings.exchange_rate || 100} UZS</span>
                            </p>
                            <div className="bg-black/40 p-4 rounded-lg mb-6 text-center border border-blue-500/20">
                                <p className="text-gray-400 text-xs uppercase">Sizda mavjud</p>
                                <p className="text-4xl font-mono font-bold text-white mt-1">{profileData.atc_balance.toFixed(1)} ATC</p>
                                <p className="text-gray-500 text-xs mt-2 border-t border-gray-700 pt-2">≈ {(profileData.atc_balance * (settings.exchange_rate || 100)).toLocaleString()} UZS</p>
                            </div>
                            
                            <button onClick={() => setShowConvertModal(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-colors shadow-lg shadow-blue-900/50">
                                Almashtirish
                            </button>
                         </div>
                         
                         <button 
                            onClick={() => setShowRules(true)}
                            className="w-full bg-gray-800 p-4 rounded-xl text-sm text-gray-400 flex items-center justify-between hover:bg-gray-700 transition-colors border border-gray-700"
                         >
                            <span className="flex items-center gap-2"><Lock size={16}/> Qoidalar va Maxfiylik</span>
                            <span className="text-xl">&rsaquo;</span>
                         </button>
                    </div>
                )}

                {/* TASKS TAB */}
                {activeTab === 'tasks' && (
                    <div className="animate-fade-in space-y-6">
                        
                        {/* Watch Ads Section */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Play className="text-blue-500 fill-current" /> Reklama Ko'rib Ishlash
                            </h2>
                            {ads.length === 0 && <p className="text-gray-500 text-sm">Hozircha reklamalar yo'q.</p>}
                            {ads.map(ad => (
                                <div key={ad.id} className="bg-gray-800 p-4 rounded-xl flex justify-between items-center border border-gray-700 hover:bg-gray-750">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-gray-900 p-2 rounded-lg">
                                            {ad.media_type === 'video' ? <Play size={20} className="text-blue-400"/> : <Gift size={20} className="text-purple-400"/>}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-sm">{ad.title}</p>
                                            <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                                                <span className="flex items-center gap-1"><Clock size={10}/> {ad.duration_sec}s</span>
                                                <span className="text-orange-400 font-bold">+{ad.reward_atc} ATC</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setActiveAd(ad)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                                    >
                                        KO'RISH
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Social Tasks Section */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-white border-t border-gray-800 pt-6">Ijtimoiy Vazifalar</h2>
                            {tasks.map(task => (
                                <div key={task.id} className="bg-gray-800 p-4 rounded-xl flex justify-between items-center border border-gray-700">
                                    <div>
                                        <p className="font-bold text-white text-sm">{task.label}</p>
                                        <p className="text-xs text-orange-400 font-bold mt-1">Mukofot: +{task.reward_atc} ATC</p>
                                    </div>
                                    <a 
                                        href={task.url} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        onClick={() => {
                                            setTimeout(async () => {
                                                if(window.confirm("Vazifani bajardingizmi?")) {
                                                     const { data: { user } } = await supabase.auth.getUser();
                                                     if(user) await claimATCReward(user.id, task.reward_atc, 'task', `Vazifa: ${task.label}`);
                                                     alert("Mukofot berildi!");
                                                     init();
                                                }
                                            }, 5000);
                                        }}
                                        className="bg-gray-700 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                                    >
                                        BAJARISH
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
             </div>

             {/* MODALS */}
             {showRules && <RulesModal onClose={() => setShowRules(false)} />}
             {showQuiz && <QuizModal settings={settings} onClose={() => setShowQuiz(false)} onComplete={handleQuizComplete} />}
             {showConvertModal && profileData && (
                 <ConvertModal 
                    onClose={() => setShowConvertModal(false)} 
                    onConfirm={handleConvertConfirm} 
                    balance={profileData.atc_balance} 
                    rate={Number(settings.exchange_rate || 100)}
                    isLoading={convertLoading}
                 />
             )}
             
             {activeAd && (
                 <WatchAdModal 
                    ad={activeAd} 
                    onClose={() => setActiveAd(null)} 
                    onComplete={handleAdComplete} 
                 />
             )}
             
             <ConcursNav activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
    );
};
