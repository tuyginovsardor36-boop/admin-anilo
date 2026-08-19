








import React, { useState, useEffect } from 'react';
import { GiftIcon } from './components/icons/GiftIcon';
import { getContestSettings, getContestTasks, updateContestSetting, createContestTask, deleteContestTask, getContestAds, createContestAd, deleteContestAd, uploadFile } from './services/dbService';
import { ContestTask, ContestAd } from './types';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useNotification } from './hooks/useNotification';
import { PlusIcon } from './components/icons/PlusIcon';
import { DeleteIcon } from './components/icons/DeleteIcon';
import { Brain, Play } from 'lucide-react';

export const ContestManagementPage: React.FC = () => {
    const [settings, setSettings] = useState<any>({});
    const [tasks, setTasks] = useState<ContestTask[]>([]);
    const [ads, setAds] = useState<ContestAd[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { addNotification } = useNotification();

    // Task Form
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [taskLabel, setTaskLabel] = useState('');
    const [taskUrl, setTaskUrl] = useState('');
    const [taskReward, setTaskReward] = useState('1');
    const [taskPlatform, setTaskPlatform] = useState<ContestTask['platform']>('telegram');

    // Ad Form
    const [isAdModalOpen, setIsAdModalOpen] = useState(false);
    const [adTitle, setAdTitle] = useState('');
    const [adType, setAdType] = useState<'video' | 'image'>('image');
    const [adReward, setAdReward] = useState('0.5');
    const [adDuration, setAdDuration] = useState('15');
    const [adFile, setAdFile] = useState<File | null>(null);
    const [adLoading, setAdLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [s, t, a] = await Promise.all([getContestSettings(), getContestTasks(), getContestAds()]);
            setSettings(s);
            setTasks(t);
            setAds(a);
        } catch (e) {
            console.error(e);
            addNotification({ type: 'error', title: 'Xatolik', message: 'Ma\'lumotlarni yuklab bo\'lmadi' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSettingChange = async (key: string, value: string) => {
        try {
            await updateContestSetting(key, value);
            setSettings({ ...settings, [key]: value });
            addNotification({ type: 'success', title: 'Saqlandi', message: 'Sozlama yangilandi.' });
        } catch (e) {
            addNotification({ type: 'error', title: 'Xatolik', message: 'Saqlab bo\'lmadi.' });
        }
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createContestTask({
                label: taskLabel,
                url: taskUrl,
                reward_atc: Number(taskReward),
                platform: taskPlatform
            });
            addNotification({ type: 'success', title: 'Qo\'shildi', message: 'Vazifa qo\'shildi.' });
            setIsTaskModalOpen(false);
            setTaskLabel('');
            setTaskUrl('');
            loadData();
        } catch (e) {
            addNotification({ type: 'error', title: 'Xatolik', message: 'Vazifa qo\'shishda xatolik.' });
        }
    };

    const handleDeleteTask = async (id: number) => {
        if(!window.confirm("O'chirmoqchimisiz?")) return;
        try {
            await deleteContestTask(id);
            setTasks(prev => prev.filter(t => t.id !== id));
            addNotification({ type: 'success', title: 'O\'chirildi', message: 'Vazifa o\'chirildi.' });
        } catch (e) {
            addNotification({ type: 'error', title: 'Xatolik', message: 'O\'chirishda xatolik.' });
        }
    };

    const handleAddAd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adFile) {
            addNotification({ type: 'warning', title: 'Diqqat', message: 'Fayl tanlanmadi.' });
            return;
        }
        
        setAdLoading(true);
        try {
            // Upload file
            const bucket = adType === 'video' ? 'videos' : 'posters';
            const url = await uploadFile(adFile, bucket);
            
            await createContestAd({
                title: adTitle,
                media_type: adType,
                media_url: url,
                reward_atc: Number(adReward),
                duration_sec: Number(adDuration)
            });
            
            addNotification({ type: 'success', title: 'Qo\'shildi', message: 'Reklama muvaffaqiyatli qo\'shildi.' });
            setIsAdModalOpen(false);
            setAdTitle('');
            setAdFile(null);
            loadData();
        } catch (e: any) {
            console.error(e);
            addNotification({ type: 'error', title: 'Xatolik', message: e.message || 'Reklama qo\'shishda xatolik.' });
        } finally {
            setAdLoading(false);
        }
    }
    
    const handleDeleteAd = async (id: number) => {
        if(!window.confirm("O'chirmoqchimisiz?")) return;
        try {
            await deleteContestAd(id);
            setAds(prev => prev.filter(a => a.id !== id));
            addNotification({ type: 'success', title: 'O\'chirildi', message: 'Reklama o\'chirildi.' });
        } catch (e) {
            addNotification({ type: 'error', title: 'Xatolik', message: 'O\'chirishda xatolik.' });
        }
    }

    if (isLoading) return <LoadingSpinner />;

    return (
        <div className="animate-fade-in pb-10">
            <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                <GiftIcon className="w-8 h-8 text-orange-500" />
                AniConcurs Boshqaruvi (ATC O'yini)
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* SOZLAMALAR */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                    <h2 className="text-xl font-bold text-white mb-6 border-b border-gray-700 pb-4">Asosiy Sozlamalar</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">1 ATC narxi (UZS)</label>
                            <input 
                                type="number" 
                                value={settings.exchange_rate || ''} 
                                onChange={(e) => handleSettingChange('exchange_rate', e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Reklama ko'rish bonusi (ATC)</label>
                            <input 
                                type="number" 
                                step="0.1"
                                value={settings.ad_reward_atc || ''} 
                                onChange={(e) => handleSettingChange('ad_reward_atc', e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Kunlik bepul aylantirish</label>
                            <input 
                                type="number" 
                                value={settings.daily_free_spins || ''} 
                                onChange={(e) => handleSettingChange('daily_free_spins', e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white"
                            />
                        </div>
                    </div>
                </div>

                {/* QUIZ SETTINGS */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                     <h2 className="text-xl font-bold text-white mb-6 border-b border-gray-700 pb-4 flex items-center gap-2">
                        <Brain className="text-purple-500" size={24}/> Viktorina Sozlamalari
                     </h2>
                     <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Savollar soni (har o'yinda)</label>
                            <input 
                                type="number" 
                                value={settings.quiz_questions_count || 5} 
                                onChange={(e) => handleSettingChange('quiz_questions_count', e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Minimal to'g'ri javob</label>
                            <input 
                                type="number" 
                                value={settings.quiz_passing_score || 3} 
                                onChange={(e) => handleSettingChange('quiz_passing_score', e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Yutuq (Qo'shimcha aylantirish)</label>
                            <input 
                                type="number" 
                                value={settings.quiz_reward_spins || 1} 
                                onChange={(e) => handleSettingChange('quiz_reward_spins', e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white"
                            />
                        </div>
                     </div>
                </div>

                {/* ADS MANAGEMENT */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 md:col-span-2">
                    <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Play className="text-blue-500"/> Reklamali Vazifalar
                        </h2>
                        <button 
                            onClick={() => setIsAdModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-bold flex items-center gap-2"
                        >
                            <PlusIcon className="w-4 h-4" /> Reklama Qo'shish
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                         {ads.length === 0 && <p className="text-gray-500 col-span-full text-center">Reklamalar yo'q.</p>}
                         {ads.map(ad => (
                             <div key={ad.id} className="bg-gray-900 p-4 rounded-lg border border-gray-700 relative">
                                 <div className="absolute top-2 right-2">
                                     <button onClick={() => handleDeleteAd(ad.id)} className="text-gray-500 hover:text-red-500 bg-black/50 rounded p-1"><DeleteIcon className="w-4 h-4" /></button>
                                 </div>
                                 <div className="aspect-video bg-black rounded mb-3 overflow-hidden flex items-center justify-center">
                                     {ad.media_type === 'video' ? (
                                         <video src={ad.media_url} className="w-full h-full object-contain" />
                                     ) : (
                                         <img src={ad.media_url} alt={ad.title} className="w-full h-full object-contain" />
                                     )}
                                 </div>
                                 <h4 className="font-bold text-white text-sm truncate">{ad.title}</h4>
                                 <div className="flex justify-between mt-2 text-xs text-gray-400">
                                     <span>{ad.duration_sec} sekund</span>
                                     <span className="text-orange-400 font-bold">+{ad.reward_atc} ATC</span>
                                 </div>
                             </div>
                         ))}
                    </div>
                </div>

                {/* VAZIFALAR */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 md:col-span-2">
                    <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                        <h2 className="text-xl font-bold text-white">Vazifalar Ro'yxati (Linklar)</h2>
                        <button 
                            onClick={() => setIsTaskModalOpen(true)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-bold flex items-center gap-2"
                        >
                            <PlusIcon className="w-4 h-4" /> Qo'shish
                        </button>
                    </div>
                    
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {tasks.length === 0 && <p className="text-gray-500 text-center">Vazifalar yo'q.</p>}
                        {tasks.map(task => (
                            <div key={task.id} className="bg-gray-900 p-3 rounded flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-white">{task.label}</p>
                                    <a href={task.url} target="_blank" className="text-xs text-blue-400 hover:underline truncate max-w-[150px] block">{task.url}</a>
                                    <span className="text-xs text-orange-400 font-bold">+{task.reward_atc} ATC</span>
                                </div>
                                <button onClick={() => handleDeleteTask(task.id)} className="text-gray-500 hover:text-red-500">
                                    <DeleteIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ADD TASK MODAL */}
            {isTaskModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-gray-700 p-6 rounded-lg w-full max-w-md">
                        <h3 className="text-xl font-bold text-white mb-4">Yangi Vazifa</h3>
                        <form onSubmit={handleAddTask} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400">Nomi (Label)</label>
                                <input className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white" required value={taskLabel} onChange={e => setTaskLabel(e.target.value)} placeholder="Telegram kanalga obuna bo'ling" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400">Havola (URL)</label>
                                <input className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white" required value={taskUrl} onChange={e => setTaskUrl(e.target.value)} placeholder="https://t.me/..." />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400">Mukofot (ATC)</label>
                                <input type="number" className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white" required value={taskReward} onChange={e => setTaskReward(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400">Platforma</label>
                                <select className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white" value={taskPlatform} onChange={e => setTaskPlatform(e.target.value as any)}>
                                    <option value="telegram">Telegram</option>
                                    <option value="instagram">Instagram</option>
                                    <option value="youtube">YouTube</option>
                                    <option value="facebook">Facebook</option>
                                    <option value="other">Boshqa</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setIsTaskModalOpen(false)} className="px-4 py-2 bg-gray-700 rounded text-white">Bekor qilish</button>
                                <button type="submit" className="px-4 py-2 bg-green-600 rounded text-white">Saqlash</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ADD AD MODAL */}
            {isAdModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-gray-700 p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-white mb-4">Yangi Reklama Vazifasi</h3>
                        <form onSubmit={handleAddAd} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400">Sarlavha</label>
                                <input className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white" required value={adTitle} onChange={e => setAdTitle(e.target.value)} placeholder="Reklama nomi" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400">Turi</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 text-white"><input type="radio" checked={adType === 'image'} onChange={() => setAdType('image')} className="accent-blue-500"/> Rasm</label>
                                    <label className="flex items-center gap-2 text-white"><input type="radio" checked={adType === 'video'} onChange={() => setAdType('video')} className="accent-blue-500"/> Video</label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400">Fayl ({adType === 'video' ? 'MP4' : 'JPG/PNG'})</label>
                                <input type="file" className="w-full text-sm text-gray-400" required accept={adType === 'video' ? "video/mp4,video/webm" : "image/*"} onChange={e => e.target.files && setAdFile(e.target.files[0])} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400">Mukofot (ATC)</label>
                                    <input type="number" step="0.1" className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white" required value={adReward} onChange={e => setAdReward(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400">Davomiyligi (sek)</label>
                                    <input type="number" className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white" required value={adDuration} onChange={e => setAdDuration(e.target.value)} />
                                </div>
                            </div>
                            
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setIsAdModalOpen(false)} disabled={adLoading} className="px-4 py-2 bg-gray-700 rounded text-white">Bekor qilish</button>
                                <button type="submit" disabled={adLoading} className="px-4 py-2 bg-blue-600 rounded text-white flex items-center gap-2">
                                    {adLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                    Saqlash
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};