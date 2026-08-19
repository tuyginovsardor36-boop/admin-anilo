
import React, { useRef, useState, useEffect } from 'react';
import { UzumakiLogo } from './components/icons/UzumakiLogo';
import { UploadIcon } from './components/icons/UploadIcon';
import { getAppConfig, updateAppConfig, uploadFile } from './services/dbService';
import { useNotification } from './hooks/useNotification';

const defaultBg = "url('https://i.imgur.com/sC56bsu.jpg')";

export const SiteCustomizationPage: React.FC = () => {
    const logoInputRef = useRef<HTMLInputElement>(null);
    const bgInputRef = useRef<HTMLInputElement>(null);
    const [currentBg, setCurrentBg] = useState(defaultBg);
    const [loading, setLoading] = useState(false);
    const { addNotification } = useNotification();

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const config = await getAppConfig();
        if (config['site_background']) {
            setCurrentBg(`url(${config['site_background']})`);
        }
        // Note: Logo update is handled via localStorage event currently in UzumakiLogo, 
        // but ideally we update global state. For now, we'll update DB.
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'bg') => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setLoading(true);
            // 1. Upload to 'assets' bucket
            const publicUrl = await uploadFile(file, 'assets');
            
            // 2. Save URL to DB
            if (type === 'logo') {
                await updateAppConfig('site_logo', publicUrl);
                localStorage.setItem('custom-logo', publicUrl); // Keep local sync for immediate effect
                document.dispatchEvent(new Event('logoUpdated'));
                addNotification({ type: 'success', title: 'Logotip yangilandi', message: 'Sahifani yangilang.' });
            } else {
                await updateAppConfig('site_background', publicUrl);
                localStorage.setItem('custom-background-image', publicUrl);
                document.body.style.backgroundImage = `url(${publicUrl})`;
                setCurrentBg(`url(${publicUrl})`);
                addNotification({ type: 'success', title: 'Fon yangilandi', message: 'Sayt foni muvaffaqiyatli o\'zgardi.' });
            }
        } catch (error) {
            console.error(error);
            addNotification({ type: 'error', title: 'Xatolik', message: 'Faylni yuklashda xatolik.' });
        } finally {
            setLoading(false);
            event.target.value = '';
        }
    };
    
    const handleResetBg = async () => {
        try {
            await updateAppConfig('site_background', 'https://i.imgur.com/sC56bsu.jpg');
            localStorage.removeItem('custom-background-image');
            document.body.style.backgroundImage = defaultBg;
            setCurrentBg(defaultBg);
            addNotification({ type: 'success', title: 'Tiklandi', message: 'Fon asl holiga qaytarildi.' });
        } catch (e) { console.error(e); }
    };

    return (
        <div className="animate-fade-in">
            <h1 className="text-3xl font-bold text-white mb-8">Sayt Ko'rinishini Sozlash (Baza)</h1>
            
            {loading && <div className="text-orange-400 mb-4">Yuklanmoqda...</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Logo Customization */}
                <div className="bg-gray-800/70 p-6 rounded-lg">
                    <h2 className="text-xl font-bold text-white mb-4">Logotip</h2>
                    <div className="flex flex-col items-center gap-4">
                        <p className="text-sm text-gray-400 text-center">Joriy logotip. Barcha sahifalarda ko'rinadi.</p>
                        <div className="p-4 bg-gray-900 rounded-full">
                           <UzumakiLogo />
                        </div>
                        <div className="flex gap-4">
                             <button disabled={loading} onClick={() => logoInputRef.current?.click()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
                                <UploadIcon className="w-5 h-5" />
                                O'zgartirish
                            </button>
                        </div>
                    </div>
                    <input type="file" ref={logoInputRef} onChange={(e) => handleFileChange(e, 'logo')} accept="image/*" className="hidden" />
                </div>
                
                {/* Background Customization */}
                <div className="bg-gray-800/70 p-6 rounded-lg">
                    <h2 className="text-xl font-bold text-white mb-4">Orqa Fon Rasmi</h2>
                     <div className="flex flex-col items-center gap-4">
                        <p className="text-sm text-gray-400 text-center">Saytning asosiy orqa fon rasmi.</p>
                        <div 
                            className="w-full h-32 rounded-md bg-cover bg-center border border-gray-700"
                            style={{ backgroundImage: currentBg }}
                        ></div>
                        <div className="flex gap-4">
                             <button disabled={loading} onClick={() => bgInputRef.current?.click()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
                                <UploadIcon className="w-5 h-5" />
                                O'zgartirish
                            </button>
                             <button disabled={loading} onClick={handleResetBg} className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors">
                                Asl holiga qaytarish
                            </button>
                        </div>
                    </div>
                    <input type="file" ref={bgInputRef} onChange={(e) => handleFileChange(e, 'bg')} accept="image/*" className="hidden" />
                </div>
            </div>
        </div>
    );
};
