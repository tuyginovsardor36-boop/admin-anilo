

import React, { useState, useEffect } from 'react';
import { getArkSettings, updateArkSettings, getArkWithdrawals, approveArkWithdrawal, updateContestSetting, getArkAds, createArkAd, deleteArkAd, getArkQuizzes, createArkQuiz, deleteArkQuiz, uploadFile, giveArkGlobalBonus, runArkAutopilot, toggleArkMarketStatus, saveArkSchedule } from './services/dbService';
import { ArkWithdrawal, ArkAd, ArkQuiz, WheelPrize, ArkAutopilotConfig, ArkSchedule } from './types';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useNotification } from './hooks/useNotification';
import { TrendingUpIcon } from './components/icons/TrendingUpIcon';
import { BankCardIcon } from './components/icons/BankCardIcon';
import { Play, Square, Save, Check, Plus, Trash2, Edit, Gift, Settings, Power, Calendar } from 'lucide-react';

// Reusable Tab Button
const TabButton: React.FC<{ active: boolean; onClick: () => void; label: string }> = ({ active, onClick, label }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 rounded-lg font-bold transition-colors ${active ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
    >
        {label}
    </button>
);

export const CashContestPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'autopilot' | 'withdrawals' | 'ads' | 'quiz' | 'wheel' | 'bonus'>('dashboard');
    const [settings, setSettings] = useState<any>({});
    const [withdrawals, setWithdrawals] = useState<ArkWithdrawal[]>([]);
    const [ads, setAds] = useState<ArkAd[]>([]);
    const [quizzes, setQuizzes] = useState<ArkQuiz[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { addNotification } = useNotification();
    
    // Dashboard Forms
    const [price, setPrice] = useState('');
    const [startMsg, setStartMsg] = useState('');
    
    // Autopilot Forms
    const [apUnit, setApUnit] = useState('10000');
    const [apRevenue, setApRevenue] = useState('200000');
    const [apShare, setApShare] = useState('45');
    
    // Schedule Form
    const [schStart, setSchStart] = useState('');
    const [schDuration, setSchDuration] = useState('24');
    const [schGrowth, setSchGrowth] = useState('2.3');

    // Ad Form
    const [isAdModal, setIsAdModal] = useState(false);
    const [adTitle, setAdTitle] = useState('');
    const [adType, setAdType] = useState<'video'|'image'>('image');
    const [adReward, setAdReward] = useState('0.1');
    const [adFile, setAdFile] = useState<File | null>(null);

    // Quiz Form
    const [isQuizModal, setIsQuizModal] = useState(false);
    const [qQuestion, setQQuestion] = useState('');
    const [qA, setQA] = useState('');
    const [qB, setQB] = useState('');
    const [qC, setQC] = useState('');
    const [qD, setQD] = useState('');
    const [qCorrect, setQCorrect] = useState('a');
    const [qReward, setQReward] = useState('1');

    // Wheel Form
    const [wheelConfig, setWheelConfig] = useState<WheelPrize[]>([]);
    
    // Bonus Form
    const [bonusAmount, setBonusAmount] = useState('0.5');
    const [bonusMsg, setBonusMsg] = useState('Admin Bonusi');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [s, w, a, q] = await Promise.all([
                getArkSettings(), 
                getArkWithdrawals(),
                getArkAds(),
                getArkQuizzes()
            ]);
            setSettings(s);
            setWithdrawals(w);
            setAds(a);
            setQuizzes(q);
            
            setPrice(s.current_price?.toString() || '300');
            setStartMsg(s.start_message || '');
            setWheelConfig(s.wheel_config || []);
            
            // Autopilot
            if (s.autopilot_config) {
                setApUnit(s.autopilot_config.unit_views.toString());
                setApRevenue(s.autopilot_config.revenue_per_unit.toString());
                setApShare(s.autopilot_config.market_share_percent.toString());
            }
            // Schedule
            if (s.market_schedule) {
                setSchStart(s.market_schedule.start_date || '');
                setSchDuration(s.market_schedule.duration_hours.toString());
                setSchGrowth(s.market_schedule.growth_percent.toString());
            }

        } catch (e) {
            console.error(e);
            addNotification({ type: 'error', title: 'Xatolik', message: 'Ma\'lumotlarni yuklab bo\'lmadi' });
        } finally {
            setIsLoading(false);
        }
    };

    // --- DASHBOARD HANDLERS ---
    const handleSaveSettings = async () => {
        try {
            await updateArkSettings('current_price', price);
            await updateArkSettings('start_message', startMsg);
            addNotification({ type: 'success', title: 'Saqlandi', message: 'Sozlamalar yangilandi.' });
        } catch (e) {
            addNotification({ type: 'error', title: 'Xatolik', message: 'Saqlab bo\'lmadi.' });
        }
    };
    
    const handleStatusChange = async (status: 'active' | 'paused' | 'closed') => {
        try {
            await toggleArkMarketStatus(status);
            setSettings({ ...settings, game_status: status });
            addNotification({ type: 'success', title: 'Status', message: `Bozor holati: ${status.toUpperCase()}` });
        } catch(e) { console.error(e); }
    }

    // --- AUTOPILOT & SCHEDULE ---
    const handleSaveAutopilot = async () => {
        const config: ArkAutopilotConfig = {
            unit_views: Number(apUnit),
            revenue_per_unit: Number(apRevenue),
            market_share_percent: Number(apShare)
        };
        try {
            await updateArkSettings('autopilot_config', JSON.stringify(config));
            addNotification({ type: 'success', title: 'Saqlandi', message: 'Avtopilot formulasi yangilandi.' });
        } catch(e) { console.error(e); }
    };
    
    const handleSyncAutopilot = async () => {
        try {
            const res = await runArkAutopilot();
            setPrice(res.newPrice.toFixed(2));
            addNotification({ type: 'success', title: 'Hisoblandi', message: `Daromad: ${res.totalRevenue} UZS. Yangi Narx: ${res.newPrice.toFixed(2)} UZS` });
        } catch(e: any) {
            addNotification({ type: 'error', title: 'Xatolik', message: e.message });
        }
    };

    const handleSaveSchedule = async () => {
        const schedule: ArkSchedule = {
            start_date: schStart,
            duration_hours: Number(schDuration),
            growth_percent: Number(schGrowth),
            is_active: true
        };
        try {
            await saveArkSchedule(schedule);
            addNotification({ type: 'success', title: 'Rejalashtirildi', message: 'O\'sish rejasi saqlandi.' });
        } catch(e) { console.error(e); }
    }

    // --- WITHDRAWAL HANDLERS ---
    const handleApprove = async (id: number) => {
        if(!window.confirm("Pul chiqarishni tasdiqlaysizmi?")) return;
        try {
            await approveArkWithdrawal(id);
            setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: 'approved' } : w));
            addNotification({ type: 'success', title: 'Tasdiqlandi', message: 'Pul chiqarish tasdiqlandi.' });
        } catch (e) {
            addNotification({ type: 'error', title: 'Xatolik', message: 'Tasdiqlashda xatolik.' });
        }
    };

    // --- AD HANDLERS ---
    const handleSaveAd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adFile) return alert("Fayl tanlang");
        try {
            const url = await uploadFile(adFile, adType === 'video' ? 'videos' : 'posters');
            await createArkAd({
                title: adTitle, media_type: adType, media_url: url, reward_ark: Number(adReward), duration_sec: 15, is_active: true
            });
            addNotification({ type: 'success', title: 'Qo\'shildi', message: 'Reklama qo\'shildi.' });
            setIsAdModal(false);
            loadData();
        } catch (e) { console.error(e); }
    };
    const handleDeleteAd = async (id: number) => {
        if(confirm("O'chirasizmi?")) {
            await deleteArkAd(id);
            loadData();
        }
    }

    // --- QUIZ HANDLERS ---
    const handleSaveQuiz = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createArkQuiz({
                question: qQuestion, option_a: qA, option_b: qB, option_c: qC, option_d: qD, correct_option: qCorrect, reward_spins: Number(qReward)
            });
            addNotification({ type: 'success', title: 'Qo\'shildi', message: 'Savol qo\'shildi.' });
            setIsQuizModal(false);
            loadData();
        } catch (e) { console.error(e); }
    };
    const handleDeleteQuiz = async (id: number) => {
         if(confirm("O'chirasizmi?")) {
            await deleteArkQuiz(id);
            loadData();
        }
    }

    // --- WHEEL HANDLERS ---
    const updateWheelSegment = (index: number, field: keyof WheelPrize, value: any) => {
        const newConfig = [...wheelConfig];
        newConfig[index] = { ...newConfig[index], [field]: value };
        setWheelConfig(newConfig);
    };
    const addWheelSegment = () => {
        setWheelConfig([...wheelConfig, { id: Date.now(), label: 'New', value: 0, type: 'loss', color: '#333', probability: 10 }]);
    }
    const removeWheelSegment = (index: number) => {
        setWheelConfig(wheelConfig.filter((_, i) => i !== index));
    }
    const saveWheelConfig = async () => {
        try {
            await updateArkSettings('wheel_config', JSON.stringify(wheelConfig));
            addNotification({ type: 'success', title: 'Saqlandi', message: 'Baraban sozlamalari saqlandi.' });
        } catch (e) { console.error(e); }
    }

    // --- BONUS HANDLER ---
    const handleGlobalBonus = async () => {
        if (!confirm("Barchaga bonus tarqatilsinmi?")) return;
        try {
            await giveArkGlobalBonus(Number(bonusAmount), bonusMsg);
            addNotification({ type: 'success', title: 'Bajarildi', message: 'Bonus tarqatildi.' });
        } catch(e) { console.error(e); }
    }

    if (isLoading) return <LoadingSpinner />;

    return (
        <div className="animate-fade-in pb-10">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <TrendingUpIcon className="w-8 h-8 text-green-500" />
                    CASH KONKURS (ARK Trading)
                </h1>
                <div className="flex flex-wrap gap-2">
                    <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} label="Boshqaruv" />
                    <TabButton active={activeTab === 'autopilot'} onClick={() => setActiveTab('autopilot')} label="Avtopilot & Bozor" />
                    <TabButton active={activeTab === 'withdrawals'} onClick={() => setActiveTab('withdrawals')} label="To'lovlar" />
                    <TabButton active={activeTab === 'ads'} onClick={() => setActiveTab('ads')} label="Reklama" />
                    <TabButton active={activeTab === 'quiz'} onClick={() => setActiveTab('quiz')} label="Viktorina" />
                    <TabButton active={activeTab === 'wheel'} onClick={() => setActiveTab('wheel')} label="Baraban" />
                    <TabButton active={activeTab === 'bonus'} onClick={() => setActiveTab('bonus')} label="Bonus" />
                </div>
            </div>

            {activeTab === 'dashboard' && (
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 max-w-2xl">
                    <h2 className="text-xl font-bold text-white mb-6 border-b border-gray-700 pb-4">Asosiy Sozlamalar</h2>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Status</label>
                            <div className="flex gap-4">
                                <button onClick={() => handleStatusChange('active')} className={`flex-1 py-3 rounded font-bold border transition-colors ${settings.game_status === 'active' ? 'bg-green-600 border-green-500 text-white' : 'bg-gray-900 border-gray-700 text-gray-500'}`}>OPEN</button>
                                <button onClick={() => handleStatusChange('closed')} className={`flex-1 py-3 rounded font-bold border transition-colors ${settings.game_status === 'closed' ? 'bg-red-600 border-red-500 text-white' : 'bg-gray-900 border-gray-700 text-gray-500'}`}>CLOSE</button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">1 ARK Narxi (UZS)</label>
                            <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-gray-900 p-2 rounded text-white border border-gray-600" />
                        </div>
                         <div>
                            <label className="block text-sm text-gray-400 mb-2">Start Xabari (Banner)</label>
                            <input type="text" value={startMsg} onChange={e => setStartMsg(e.target.value)} className="w-full bg-gray-900 p-2 rounded text-white border border-gray-600" />
                        </div>
                        <button onClick={handleSaveSettings} className="w-full bg-blue-600 py-3 rounded font-bold text-white hover:bg-blue-700">SAQLASH</button>
                    </div>
                </div>
            )}

            {activeTab === 'autopilot' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {/* Autopilot Formula */}
                     <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                         <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Settings className="text-blue-400"/> Avtopilot Formulasi</h2>
                         <div className="space-y-4">
                             <div>
                                 <label className="block text-xs text-gray-400 mb-1">Birlik Ko'rishlar (Unit)</label>
                                 <input type="number" value={apUnit} onChange={e=>setApUnit(e.target.value)} className="w-full bg-gray-900 p-2 rounded text-white border border-gray-600" />
                             </div>
                             <div>
                                 <label className="block text-xs text-gray-400 mb-1">Daromad (Har bir Unit uchun UZS)</label>
                                 <input type="number" value={apRevenue} onChange={e=>setApRevenue(e.target.value)} className="w-full bg-gray-900 p-2 rounded text-white border border-gray-600" />
                             </div>
                             <div>
                                 <label className="block text-xs text-gray-400 mb-1">Bozor Ulushi (%)</label>
                                 <input type="number" value={apShare} onChange={e=>setApShare(e.target.value)} className="w-full bg-gray-900 p-2 rounded text-white border border-gray-600" />
                             </div>
                             <div className="flex gap-2 pt-2">
                                 <button onClick={handleSaveAutopilot} className="flex-1 bg-green-600 py-2 rounded text-white font-bold">Formulani Saqlash</button>
                                 <button onClick={handleSyncAutopilot} className="flex-1 bg-blue-600 py-2 rounded text-white font-bold">Hisoblash & Yangilash</button>
                             </div>
                             <p className="text-xs text-gray-500 mt-2">
                                 Tizim "Vazifalar" dagi barcha reklama ko'rishlarni sanaydi va formulaga asosan narxni oshiradi (Zararsiz).
                             </p>
                         </div>
                     </div>

                     {/* Market Scheduler */}
                     <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                         <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Calendar className="text-yellow-400"/> Rejali O'sish</h2>
                         <div className="space-y-4">
                             <div>
                                 <label className="block text-xs text-gray-400 mb-1">Boshlanish Sanasi (YYYY-MM-DD HH:MM)</label>
                                 <input type="datetime-local" value={schStart} onChange={e=>setSchStart(e.target.value)} className="w-full bg-gray-900 p-2 rounded text-white border border-gray-600" />
                             </div>
                             <div>
                                 <label className="block text-xs text-gray-400 mb-1">Davomiyligi (Soat)</label>
                                 <input type="number" value={schDuration} onChange={e=>setSchDuration(e.target.value)} className="w-full bg-gray-900 p-2 rounded text-white border border-gray-600" />
                             </div>
                             <div>
                                 <label className="block text-xs text-gray-400 mb-1">O'sish (%)</label>
                                 <input type="number" step="0.1" value={schGrowth} onChange={e=>setSchGrowth(e.target.value)} className="w-full bg-gray-900 p-2 rounded text-white border border-gray-600" />
                             </div>
                             <button onClick={handleSaveSchedule} className="w-full bg-orange-600 py-2 rounded text-white font-bold mt-2">Rejani Saqlash</button>
                         </div>
                     </div>
                 </div>
            )}

            {activeTab === 'withdrawals' && (
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
                     <table className="w-full text-left text-sm">
                        <thead className="bg-gray-900 text-gray-400">
                            <tr>
                                <th className="p-3">User / Email</th>
                                <th className="p-3">ARK</th>
                                <th className="p-3">UZS</th>
                                <th className="p-3">Karta</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700 text-gray-300">
                            {withdrawals.map(w => (
                                <tr key={w.id}>
                                    <td className="p-3">
                                        {w.profiles?.full_name}<br/>
                                        <span className="text-xs text-yellow-500 font-bold px-1.5 py-0.5 bg-yellow-900/20 rounded border border-yellow-700/30">{w.profiles?.email}</span>
                                    </td>
                                    <td className="p-3 text-yellow-400">{w.amount_ark}</td>
                                    <td className="p-3 text-green-400 font-bold">{w.amount_uzs.toLocaleString()}</td>
                                    <td className="p-3">{w.card_number}<br/><span className="text-xs">{w.card_holder}</span></td>
                                    <td className="p-3 uppercase">{w.status}</td>
                                    <td className="p-3">
                                        {w.status === 'pending' && <button onClick={() => handleApprove(w.id)} className="bg-green-600 p-1 rounded hover:bg-green-700"><Check size={16}/></button>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'ads' && (
                 <div className="space-y-4">
                     <button onClick={() => setIsAdModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"><Plus size={16}/> Reklama Qo'shish</button>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                         {ads.length === 0 && <p className="text-gray-500 col-span-full text-center">Reklamalar yo'q.</p>}
                         {ads.map(ad => (
                             <div key={ad.id} className="bg-gray-800 p-4 rounded border border-gray-700 relative">
                                 <button onClick={() => handleDeleteAd(ad.id)} className="absolute top-2 right-2 text-red-400"><Trash2 size={16}/></button>
                                 <p className="font-bold text-white">{ad.title}</p>
                                 <p className="text-xs text-gray-400">Type: {ad.media_type}</p>
                                 <p className="text-green-400 text-sm font-bold">Reward: {ad.reward_ark} ARK</p>
                             </div>
                         ))}
                     </div>
                     {isAdModal && (
                         <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                             <div className="bg-gray-900 p-6 rounded w-full max-w-md border border-gray-700">
                                 <h3 className="text-white font-bold mb-4">Yangi Reklama</h3>
                                 <input className="w-full bg-gray-800 mb-2 p-2 rounded text-white" placeholder="Title" value={adTitle} onChange={e=>setAdTitle(e.target.value)}/>
                                 <select className="w-full bg-gray-800 mb-2 p-2 rounded text-white" value={adType} onChange={e=>setAdType(e.target.value as any)}>
                                     <option value="image">Rasm</option>
                                     <option value="video">Video</option>
                                 </select>
                                 <input type="number" className="w-full bg-gray-800 mb-2 p-2 rounded text-white" placeholder="Reward (ARK)" value={adReward} onChange={e=>setAdReward(e.target.value)}/>
                                 <input type="file" className="mb-4 text-white" onChange={e=>setAdFile(e.target.files?.[0] || null)}/>
                                 <div className="flex justify-end gap-2">
                                     <button onClick={()=>setIsAdModal(false)} className="px-4 py-2 bg-gray-700 text-white rounded">Bekor qilish</button>
                                     <button onClick={handleSaveAd} className="px-4 py-2 bg-green-600 text-white rounded">Saqlash</button>
                                 </div>
                             </div>
                         </div>
                     )}
                 </div>
            )}
            
            {activeTab === 'quiz' && (
                <div className="space-y-4">
                     <button onClick={() => setIsQuizModal(true)} className="bg-purple-600 text-white px-4 py-2 rounded flex items-center gap-2"><Plus size={16}/> Savol Qo'shish</button>
                     <div className="grid gap-3">
                         {quizzes.map(q => (
                             <div key={q.id} className="bg-gray-800 p-4 rounded border border-gray-700 relative">
                                 <button onClick={() => handleDeleteQuiz(q.id)} className="absolute top-2 right-2 text-red-400"><Trash2 size={16}/></button>
                                 <p className="font-bold text-white">{q.question}</p>
                                 <p className="text-xs text-gray-400">Javob: {q.correct_option}) Reward: {q.reward_spins} spins</p>
                             </div>
                         ))}
                     </div>
                     {isQuizModal && (
                         <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                             <div className="bg-gray-900 p-6 rounded w-full max-w-lg border border-gray-700 max-h-[90vh] overflow-y-auto">
                                 <h3 className="text-white font-bold mb-4">Yangi Savol</h3>
                                 <textarea className="w-full bg-gray-800 mb-2 p-2 rounded text-white" placeholder="Savol matni" value={qQuestion} onChange={e=>setQQuestion(e.target.value)}/>
                                 <div className="grid grid-cols-2 gap-2 mb-2">
                                     <input className="bg-gray-800 p-2 rounded text-white" placeholder="A" value={qA} onChange={e=>setQA(e.target.value)}/>
                                     <input className="bg-gray-800 p-2 rounded text-white" placeholder="B" value={qB} onChange={e=>setQB(e.target.value)}/>
                                     <input className="bg-gray-800 p-2 rounded text-white" placeholder="C" value={qC} onChange={e=>setQC(e.target.value)}/>
                                     <input className="bg-gray-800 p-2 rounded text-white" placeholder="D" value={qD} onChange={e=>setQD(e.target.value)}/>
                                 </div>
                                 <select className="w-full bg-gray-800 mb-2 p-2 rounded text-white" value={qCorrect} onChange={e=>setQCorrect(e.target.value)}>
                                     <option value="a">To'g'ri javob: A</option>
                                     <option value="b">To'g'ri javob: B</option>
                                     <option value="c">To'g'ri javob: C</option>
                                     <option value="d">To'g'ri javob: D</option>
                                 </select>
                                 <input type="number" className="w-full bg-gray-800 mb-4 p-2 rounded text-white" placeholder="Reward (Spins)" value={qReward} onChange={e=>setQReward(e.target.value)}/>
                                 <div className="flex justify-end gap-2">
                                     <button onClick={()=>setIsQuizModal(false)} className="px-4 py-2 bg-gray-700 text-white rounded">Bekor qilish</button>
                                     <button onClick={handleSaveQuiz} className="px-4 py-2 bg-green-600 text-white rounded">Saqlash</button>
                                 </div>
                             </div>
                         </div>
                     )}
                </div>
            )}

            {activeTab === 'wheel' && (
                <div className="bg-gray-800/50 p-6 rounded border border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-white font-bold">Baraban Konfiguratsiyasi</h2>
                        <button onClick={addWheelSegment} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Qo'shish</button>
                    </div>
                    <div className="space-y-3">
                        {wheelConfig.map((seg, i) => (
                            <div key={seg.id} className="flex gap-2 items-center">
                                <input className="bg-gray-900 text-white p-2 rounded w-1/4" value={seg.label} onChange={e => updateWheelSegment(i, 'label', e.target.value)} placeholder="Label" />
                                <input className="bg-gray-900 text-white p-2 rounded w-1/6" type="number" value={seg.value} onChange={e => updateWheelSegment(i, 'value', Number(e.target.value))} placeholder="Value" />
                                <select className="bg-gray-900 text-white p-2 rounded w-1/6" value={seg.type} onChange={e => updateWheelSegment(i, 'type', e.target.value)}>
                                    <option value="ark">ARK</option>
                                    <option value="loss">Loss</option>
                                    <option value="box">Box</option>
                                </select>
                                <input className="bg-gray-900 text-white p-2 rounded w-1/6" type="number" value={seg.probability} onChange={e => updateWheelSegment(i, 'probability', Number(e.target.value))} placeholder="Prob %" />
                                <input className="bg-gray-900 text-white p-2 rounded w-10 h-10" type="color" value={seg.color} onChange={e => updateWheelSegment(i, 'color', e.target.value)} />
                                <button onClick={() => removeWheelSegment(i)} className="text-red-500"><Trash2 size={16}/></button>
                            </div>
                        ))}
                    </div>
                    <button onClick={saveWheelConfig} className="mt-4 w-full bg-green-600 py-2 text-white font-bold rounded">Konfiguratsiyani Saqlash</button>
                </div>
            )}
            
            {activeTab === 'bonus' && (
                 <div className="bg-gray-800/50 p-6 rounded border border-gray-700 max-w-md">
                     <h2 className="text-white font-bold mb-4 flex items-center gap-2"><Gift className="text-yellow-400"/> Global Bonus</h2>
                     <p className="text-gray-400 text-sm mb-4">Barcha foydalanuvchilarga bir vaqtning o'zida ARK tarqatish.</p>
                     
                     <div className="space-y-3">
                         <div>
                             <label className="text-gray-400 text-xs">Summa (ARK)</label>
                             <input type="number" className="w-full bg-gray-900 p-2 rounded text-white" value={bonusAmount} onChange={e=>setBonusAmount(e.target.value)}/>
                         </div>
                         <div>
                             <label className="text-gray-400 text-xs">Xabar</label>
                             <input type="text" className="w-full bg-gray-900 p-2 rounded text-white" value={bonusMsg} onChange={e=>setBonusMsg(e.target.value)}/>
                         </div>
                         <button onClick={handleGlobalBonus} className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 rounded">TARQATISH</button>
                     </div>
                 </div>
            )}
        </div>
    );
};