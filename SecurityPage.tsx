
import React, { useState, useEffect } from 'react';
import { getAdminPin, setAdminPin, getProtectedRoutes, setProtectedRoutes, saveRecoveryCodes, verifyRecoveryCode, getRecoveryCodesStatus } from './services/dbService';
import { ShieldIcon } from './components/icons/ShieldIcon';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useNotification } from './hooks/useNotification';
import { ToggleSwitch } from './components/ToggleSwitch';
import { Lock, Key, Shield, FileJson, Download, Eye, EyeOff, ShieldAlert, XCircle, Unlock } from 'lucide-react';
import { PinModal } from './components/PinModal';

const AVAILABLE_ROUTES: { id: string, label: string }[] = [
    { id: 'financials', label: 'Moliya (Billing)' },
    { id: 'settings', label: 'Tizim Sozlamalari' },
    { id: 'contest', label: 'Konkurs (O\'yin)' },
    { id: 'cash_contest', label: 'ARK Trading (Cash Contest)' },
    { id: 'users', label: 'Foydalanuvchilar' },
    { id: 'movies', label: 'Kinolar Boshqaruvi' },
];

export const SecurityPage: React.FC = () => {
    const [currentPin, setCurrentPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [protectedRoutes, setProtectedRoutesState] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [realAdminPin, setRealAdminPin] = useState('');
    const [hasRecoveryCodes, setHasRecoveryCodes] = useState(false);
    
    // Recovery Logic
    const [recoveryInput, setRecoveryInput] = useState('');
    const [isPinVisible, setIsPinVisible] = useState(false);

    // Regeneration Logic
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [oldCodeInput, setOldCodeInput] = useState('');

    // Controls Security Logic
    const [areControlsUnlocked, setAreControlsUnlocked] = useState(false);
    const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
    const [unlockActionType, setUnlockActionType] = useState<'controls' | 'other'>('controls');

    const { addNotification } = useNotification();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [pin, routes, hasCodes] = await Promise.all([
                getAdminPin(),
                getProtectedRoutes(),
                getRecoveryCodesStatus()
            ]);
            setRealAdminPin(pin);
            setProtectedRoutesState(routes);
            setHasRecoveryCodes(hasCodes);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePinChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (currentPin !== realAdminPin) {
            addNotification({ type: 'error', title: 'Xatolik', message: 'Joriy PIN kod noto\'g\'ri.' });
            return;
        }
        if (newPin.length !== 4 || isNaN(Number(newPin))) {
            addNotification({ type: 'warning', title: 'Diqqat', message: 'PIN kod 4 ta raqamdan iborat bo\'lishi kerak.' });
            return;
        }
        if (newPin !== confirmPin) {
            addNotification({ type: 'error', title: 'Xatolik', message: 'Yangi kodlar mos kelmadi.' });
            return;
        }

        try {
            await setAdminPin(newPin);
            setRealAdminPin(newPin);
            setCurrentPin('');
            setNewPin('');
            setConfirmPin('');
            addNotification({ type: 'success', title: 'Muvaffaqiyatli', message: 'PIN kod yangilandi.' });
        } catch (e) {
            addNotification({ type: 'error', title: 'Xatolik', message: 'Saqlashda xatolik.' });
        }
    };

    // --- Route Protection Logic ---

    const handleUnlockClick = () => {
        setUnlockActionType('controls');
        setIsUnlockModalOpen(true);
    };

    const handleLockClick = () => {
        setAreControlsUnlocked(false);
        addNotification({ type: 'info', title: 'Yopildi', message: 'Tahrirlash rejimi yopildi.' });
    };

    const onPinSuccess = () => {
        if (unlockActionType === 'controls') {
            setAreControlsUnlocked(true);
            addNotification({ type: 'success', title: 'Ochiq', message: 'Tahrirlash rejimi faollashdi.' });
        }
        setIsUnlockModalOpen(false);
    };

    const handleRouteToggle = async (routeId: string) => {
        // Controls must be unlocked to toggle
        if (!areControlsUnlocked) return;

        const isCurrentlyProtected = protectedRoutes.includes(routeId);
        const newRoutes = isCurrentlyProtected
            ? protectedRoutes.filter(r => r !== routeId)
            : [...protectedRoutes, routeId];
        
        setProtectedRoutesState(newRoutes); 
        
        try {
            await setProtectedRoutes(newRoutes);
            // Optional: Show small toast or nothing for smoother UX
        } catch (e) {
            console.error(e);
            addNotification({ type: 'error', title: 'Xatolik', message: 'Sozlamani saqlab bo\'lmadi.' });
            setProtectedRoutesState(protectedRoutes); // Revert
        }
    };

    // --- Recovery Codes Logic ---

    const executeGeneration = async () => {
        const codes = Array.from({length: 12}, () => Math.random().toString(36).substring(2, 10).toUpperCase());
        
        try {
            await saveRecoveryCodes(codes);
            setHasRecoveryCodes(true);
            
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(codes, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `anilo_recovery_codes_${Date.now()}.json`);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            
            addNotification({ type: 'success', title: 'Yuklandi', message: 'Yangi qutqaruv kodlari saqlandi va yuklab olindi.' });
            setIsRegenerating(false);
            setOldCodeInput('');
        } catch (e) {
            console.error(e);
            addNotification({ type: 'error', title: 'Xatolik', message: 'Kodlarni yaratishda xatolik.' });
        }
    };

    const handleStartGeneration = () => {
        if (!hasRecoveryCodes) {
            executeGeneration();
        } else {
            setIsRegenerating(true);
        }
    };

    const handleConfirmRegeneration = async () => {
        if (!oldCodeInput) return;
        const isValid = await verifyRecoveryCode(oldCodeInput.toUpperCase().trim());
        if (isValid) {
            executeGeneration();
        } else {
            addNotification({ type: 'error', title: 'Xato', message: 'Kiritilgan kod noto\'g\'ri.' });
        }
    };

    const handleRecoverPin = async () => {
        if (!recoveryInput) return;
        const isValid = await verifyRecoveryCode(recoveryInput.toUpperCase().trim());
        if (isValid) {
            setIsPinVisible(true);
            setRecoveryInput('');
            addNotification({ type: 'success', title: 'Tasdiqlandi', message: 'PIN kod ochildi.' });
        } else {
            addNotification({ type: 'error', title: 'Xato', message: 'Noto\'g\'ri qutqaruv kodi.' });
        }
    };

    if (isLoading) return <LoadingSpinner />;

    return (
        <div className="animate-fade-in pb-10">
            <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                <ShieldIcon className="w-8 h-8 text-green-500" />
                Xavfsizlik va Himoya
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Route Protection Section */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 lg:col-span-2">
                    <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                        <div className="flex items-center gap-3">
                            <Shield className="text-blue-400" size={24} />
                            <h2 className="text-xl font-bold text-white">Sahifalarni Qulflash</h2>
                        </div>
                        
                        {areControlsUnlocked ? (
                            <button 
                                onClick={handleLockClick}
                                className="flex items-center gap-2 bg-red-600/20 text-red-400 px-4 py-2 rounded-lg hover:bg-red-600/30 transition-colors text-sm font-bold border border-red-600/30"
                            >
                                <Lock size={16} />
                                Yopish
                            </button>
                        ) : (
                            <button 
                                onClick={handleUnlockClick}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-bold shadow-lg shadow-blue-900/20 animate-pulse"
                            >
                                <Unlock size={16} />
                                Tahrirlashni Yoqish
                            </button>
                        )}
                    </div>

                    {!areControlsUnlocked && (
                         <div className="mb-6 bg-blue-900/20 p-4 rounded-lg border border-blue-500/30 flex items-center gap-3">
                            <ShieldAlert className="text-blue-400 flex-shrink-0" />
                            <p className="text-sm text-blue-200">
                                Xavfsizlik maqsadida o'zgartirish tugmalari yashiringan. Ularni ko'rish va boshqarish uchun "Tahrirlashni Yoqish" tugmasini bosing va PIN kodni kiriting.
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {AVAILABLE_ROUTES.map(route => (
                            <div key={route.id} className={`flex justify-between items-center p-4 rounded-lg border transition-colors ${areControlsUnlocked ? 'bg-gray-900/50 border-gray-700 hover:border-gray-500' : 'bg-gray-800/30 border-gray-800 opacity-70'}`}>
                                <div className="flex items-center gap-3">
                                    {protectedRoutes.includes(route.id) ? <Lock size={20} className="text-red-400"/> : <Shield size={20} className="text-gray-600"/>}
                                    <span className="text-gray-200 font-medium">{route.label}</span>
                                </div>
                                
                                {areControlsUnlocked ? (
                                    <ToggleSwitch 
                                        checked={protectedRoutes.includes(route.id)} 
                                        onChange={() => handleRouteToggle(route.id)} 
                                    />
                                ) : (
                                    <div className="w-10 h-6 bg-gray-800 rounded-full flex items-center justify-center border border-gray-700">
                                        <Lock size={12} className="text-gray-500" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* PIN Change Section */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-700 pb-4">
                        <Key className="text-yellow-400" size={24} />
                        <h2 className="text-xl font-bold text-white">PIN Kodni O'zgartirish</h2>
                    </div>
                    
                    <form onSubmit={handlePinChange} className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Joriy PIN</label>
                            <input 
                                type="password" 
                                maxLength={4}
                                value={currentPin}
                                onChange={e => setCurrentPin(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white tracking-[1em] text-center font-mono focus:border-orange-500 outline-none"
                                placeholder="••••"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Yangi PIN</label>
                                <input 
                                    type="password" 
                                    maxLength={4}
                                    value={newPin}
                                    onChange={e => setNewPin(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white tracking-[1em] text-center font-mono focus:border-green-500 outline-none"
                                    placeholder="••••"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Tasdiqlash</label>
                                <input 
                                    type="password" 
                                    maxLength={4}
                                    value={confirmPin}
                                    onChange={e => setConfirmPin(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white tracking-[1em] text-center font-mono focus:border-green-500 outline-none"
                                    placeholder="••••"
                                />
                            </div>
                        </div>
                        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors mt-2">
                            SAQLASH
                        </button>
                    </form>
                </div>

                {/* Recovery Section */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-700 pb-4">
                        <ShieldAlert className="text-red-400" size={24} />
                        <h2 className="text-xl font-bold text-white">Favqulodda Kirish (Recovery)</h2>
                    </div>

                    <div className="space-y-6">
                        {/* Status */}
                        <div className={`p-4 rounded-lg border ${hasRecoveryCodes ? 'bg-green-900/20 border-green-500/30' : 'bg-yellow-900/20 border-yellow-500/30'}`}>
                             <p className={`text-sm font-bold ${hasRecoveryCodes ? 'text-green-400' : 'text-yellow-400'}`}>
                                 {hasRecoveryCodes ? 'Qutqaruv kodlari faollashtirilgan ✅' : 'Qutqaruv kodlari yaratilmagan ⚠️'}
                             </p>
                             {!hasRecoveryCodes && <p className="text-xs text-gray-400 mt-1">PIN esdan chiqqanda tizimni tiklash uchun kodlar yarating.</p>}
                        </div>

                        {/* Generate Button / Form */}
                        {!isRegenerating ? (
                            <button 
                                onClick={handleStartGeneration}
                                className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors"
                            >
                                <Download size={18}/>
                                {hasRecoveryCodes ? 'Kodlarni yangilash (Qayta yuklash)' : 'Kodlarni yaratish va yuklash'} (.json)
                            </button>
                        ) : (
                            <div className="bg-gray-900/50 p-4 rounded-lg border border-orange-500/50 animate-fade-in">
                                <p className="text-sm text-orange-300 font-bold mb-2 flex items-center gap-2">
                                    <ShieldAlert size={16}/> Xavfsizlik Tekshiruvi
                                </p>
                                <p className="text-xs text-gray-400 mb-3">
                                    Yangi kodlarni yaratish uchun, iltimos, amaldagi (eski) JSON faylingizdagi kodlardan birini kiriting.
                                </p>
                                <input 
                                    type="text" 
                                    value={oldCodeInput}
                                    onChange={(e) => setOldCodeInput(e.target.value)}
                                    placeholder="Eski kodni kiriting"
                                    className="w-full bg-black border border-gray-600 rounded px-3 py-2 text-white text-sm mb-3 focus:border-orange-500 outline-none"
                                />
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setIsRegenerating(false)}
                                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded text-sm"
                                    >
                                        <XCircle className="w-4 h-4 mx-auto"/>
                                    </button>
                                    <button 
                                        onClick={handleConfirmRegeneration}
                                        disabled={!oldCodeInput}
                                        className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 rounded text-sm font-bold disabled:opacity-50"
                                    >
                                        Tasdiqlash
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="border-t border-gray-700 my-4"></div>

                        {/* PIN Reveal */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
                                <FileJson size={14}/> Kod orqali PINni ko'rish
                            </label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={recoveryInput}
                                    onChange={e => setRecoveryInput(e.target.value)}
                                    placeholder="Qutqaruv kodini kiriting"
                                    className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none"
                                />
                                <button 
                                    onClick={handleRecoverPin}
                                    disabled={!recoveryInput}
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 rounded-lg font-bold disabled:opacity-50"
                                >
                                    <Eye size={20} />
                                </button>
                            </div>
                            {isPinVisible && (
                                <div className="mt-4 p-4 bg-black/60 border border-green-500/50 rounded-lg text-center animate-fade-in">
                                    <p className="text-xs text-gray-400 mb-1">Sizning PIN kodingiz:</p>
                                    <p className="text-3xl font-mono font-bold text-green-400 tracking-[0.5em]">{realAdminPin}</p>
                                    <button onClick={() => setIsPinVisible(false)} className="text-xs text-gray-500 mt-2 hover:text-white flex items-center justify-center gap-1 w-full">
                                        <EyeOff size={12}/> Yashirish
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Unlock Confirmation Modal */}
            {isUnlockModalOpen && (
                <PinModal 
                    correctPin={realAdminPin}
                    onSuccess={onPinSuccess}
                    onClose={() => setIsUnlockModalOpen(false)}
                />
            )}
        </div>
    );
};
