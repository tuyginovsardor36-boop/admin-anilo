
import React, { useState, useEffect, createContext, useContext } from 'react';
import { Download, X, Smartphone, Share, PlusSquare } from 'lucide-react';

interface PWAContextType {
    isInstallable: boolean;
    installApp: () => void;
}

const PWAContext = createContext<PWAContextType>({
    isInstallable: false,
    installApp: () => {},
});

export const usePWA = () => useContext(PWAContext);

export const PWAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // iOS aniqlash
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(isIOSDevice);

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
            
            // Avtomatik taklif
            const hasSeenPrompt = localStorage.getItem('anilo_pwa_prompt_v2');
            if (!hasSeenPrompt) {
                setTimeout(() => setShowModal(true), 5000);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        if (isIOSDevice && !(window.navigator as any).standalone) {
            setIsInstallable(true);
        }

        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const installApp = () => {
        if (isIOS) {
            setShowModal(true);
        } else if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
                if (choiceResult.outcome === 'accepted') {
                    setIsInstallable(false);
                    localStorage.setItem('anilo_pwa_prompt_v2', 'true');
                }
                setDeferredPrompt(null);
            });
        } else {
            setShowModal(true);
        }
    };

    const handleClose = () => {
        setShowModal(false);
        localStorage.setItem('anilo_pwa_prompt_v2', 'true');
    };

    return (
        <PWAContext.Provider value={{ isInstallable, installApp }}>
            {children}
            
            {showModal && (
                <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#0f0f0f] border border-white/10 w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl animate-slide-in-up">
                        <div className="p-8 flex flex-col items-center text-center">
                            <div className="relative mb-6">
                                <div className="w-24 h-24 rounded-full overflow-hidden shadow-2xl border-2 border-orange-500/50">
                                    <img src="/logotip.png" alt="Anilo" className="w-full h-full object-cover" />
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-orange-600 rounded-full p-2 border-4 border-[#0f0f0f] shadow-lg">
                                    <Smartphone size={20} className="text-white" />
                                </div>
                            </div>

                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Anilo Ilovasi</h3>
                            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-8 leading-relaxed">
                                Tezkor kirish va yuqori sifatli anime tomosha qilish uchun ilovani o'rnating
                            </p>

                            {isIOS ? (
                                <div className="w-full space-y-4 text-left bg-white/5 p-5 rounded-3xl border border-white/5">
                                    <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] mb-4 text-center">iPhone uchun qo'llanma</p>
                                    <div className="flex items-center gap-4 text-sm text-zinc-300">
                                        <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-white shrink-0">1</div>
                                        <div className="flex items-center gap-2">
                                            Brauzerda <Share size={16} className="text-blue-500" /> tugmasini bosing
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-zinc-300">
                                        <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-white shrink-0">2</div>
                                        <div className="flex items-center gap-2">
                                            <PlusSquare size={16} className="text-white" /> <span className="font-bold">"Add to Home Screen"</span> ni tanlang
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <button 
                                    onClick={installApp}
                                    className="w-full py-5 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all shadow-xl shadow-orange-900/40 flex items-center justify-center gap-3 active:scale-95"
                                >
                                    <Download size={20} /> HOZIROQ O'RNATISH
                                </button>
                            )}

                            <button 
                                onClick={handleClose}
                                className="mt-6 text-[10px] font-black text-zinc-600 hover:text-white uppercase tracking-widest transition-colors"
                            >
                                Keyinroq sinab ko'raman
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PWAContext.Provider>
    );
};
