
import React, { useState, useEffect } from 'react';
import { PlusIcon } from './components/icons/PlusIcon';
import { DeleteIcon } from './components/icons/DeleteIcon';
import { AddAdModal } from './components/AddAdModal';
import { Ad } from './types';
import { getAds, saveAd, deleteAd, uploadFile } from './services/dbService';
import { useNotification } from './hooks/useNotification';
import { LoadingSpinner } from './components/LoadingSpinner';
import { PlayIcon } from './components/icons/PlayIcon';
import { PaletteIcon } from './components/icons/PaletteIcon';
import { EyeIcon } from './components/icons/EyeIcon';

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const isActive = status === 'active';
    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
            {isActive ? 'Faol' : 'Nofaol'}
        </span>
    );
};

const TypeIcon: React.FC<{ type: string }> = ({ type }) => {
    if (type === 'video') return <PlayIcon className="w-4 h-4 text-blue-400" />;
    return <PaletteIcon className="w-4 h-4 text-purple-400" />;
}

export const AdvertisementPage: React.FC = () => {
    const [ads, setAds] = useState<Ad[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { addNotification } = useNotification();

    useEffect(() => {
        loadAds();
    }, []);

    const loadAds = async () => {
        try {
            setIsLoading(true);
            const fetchedAds = await getAds();
            setAds(fetchedAds);
        } catch (error) {
            console.error(error);
            addNotification({ type: 'error', title: 'Xatolik', message: 'Reklamalarni yuklab bo\'lmadi.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveAd = async (adData: any) => {
        setIsSaving(true);
        try {
            let contentUrl = adData.contentUrl;
            
            // Upload file if it's a File object
            if (adData.sourceType === 'file' && adData.file) {
                // MUHIM: Video uchun 'videos', rasm uchun 'posters' bucketini ishlatamiz.
                // 'assets' bucket har doim ham mavjud bo'lmasligi mumkin.
                const bucketName = adData.adType === 'video' ? 'videos' : 'posters';
                
                try {
                    contentUrl = await uploadFile(adData.file, bucketName);
                } catch (uploadError: any) {
                    console.error("Upload Error:", uploadError);
                    let errorMsg = `Fayl yuklashda xatolik (${bucketName}): ${uploadError.message || 'Noma\'lum xato'}`;
                    
                    // Supabase specific error check
                    if (uploadError.message && (uploadError.message.includes('not found') || uploadError.message.includes('Bucket'))) {
                        errorMsg = `Diqqat: Supabase-da '${bucketName}' nomli bucket (papka) yaratilmagan yoki ruxsat berilmagan.`;
                    }
                    
                    throw new Error(errorMsg);
                }
            }

            const newAd: Ad = {
                name: adData.name,
                type: adData.adType, // 'video' or 'banner'
                contentUrl: contentUrl,
                targetUrl: adData.targetUrl,
                location: adData.location,
                status: adData.isActive ? 'active' : 'inactive',
                view_count: 0
            };

            await saveAd(newAd);
            addNotification({ type: 'success', title: 'Saqlandi', message: 'Reklama muvaffaqiyatli qo\'shildi.' });
            loadAds(); // Reload list
            setIsModalOpen(false); // Only close on success
        } catch (error: any) {
            console.error("Ad Save Error:", error);
            let msg = 'Reklamani saqlashda xatolik.';
            if (error.message) {
                msg = error.message;
            }
            addNotification({ type: 'error', title: 'Xatolik', message: msg });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        // Removed blocking window.confirm to fix UI freeze issues.
        console.log("Deleting ad with ID:", id);
        
        try {
            await deleteAd(id);
            setAds(prev => prev.filter(a => a.id !== id));
            addNotification({ type: 'success', title: 'O\'chirildi', message: 'Reklama o\'chirildi.' });
        } catch (e: any) {
             console.error("Delete failed:", e);
             let msg = 'O\'chirishda xatolik.';
             if (e.message && e.message.includes("policy")) {
                 msg = "Ruxsat yo'q (Policy Error). Sozlamalarda SQL kodni yangilang.";
             }
             addNotification({ type: 'error', title: 'Xatolik', message: msg });
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">Reklamalarni Boshqarish</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                    <PlusIcon className="w-5 h-5" />
                    <span>Yangi Reklama</span>
                </button>
            </div>

            {isLoading ? <LoadingSpinner /> : (
                <div className="bg-gray-800/70 rounded-lg overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-800">
                            <tr>
                                <th className="p-4 font-semibold">Nomi</th>
                                <th className="p-4 font-semibold">Turi</th>
                                <th className="p-4 font-semibold">Kontent</th>
                                <th className="p-4 font-semibold">Joylashuv</th>
                                <th className="p-4 font-semibold">Ko'rilgan</th>
                                <th className="p-4 font-semibold">Holati</th>
                                <th className="p-4 font-semibold">Amallar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {ads.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-gray-500">Reklamalar yo'q.</td></tr>}
                            {ads.map(ad => (
                                <tr key={ad.id} className="hover:bg-gray-800 transition-colors">
                                    <td className="p-4 font-semibold text-white">{ad.name}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <TypeIcon type={ad.type} />
                                            <span className="capitalize text-sm text-gray-300">{ad.type}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <a href={ad.contentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-400 hover:underline text-xs group">
                                            {ad.type === 'banner' ? (
                                                <img src={ad.contentUrl} alt="" className="w-10 h-6 object-cover rounded border border-gray-600" />
                                            ) : (
                                                <div className="w-10 h-6 bg-gray-700 rounded flex items-center justify-center border border-gray-600"><PlayIcon className="w-3 h-3 text-gray-400"/></div>
                                            )}
                                            <span className="truncate max-w-[100px]">Ko'rish</span>
                                        </a>
                                    </td>
                                    <td className="p-4 text-gray-400 text-sm">{ad.location}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1 text-sm text-white font-mono">
                                            <EyeIcon className="w-4 h-4 text-gray-500" />
                                            {ad.view_count || 0}
                                        </div>
                                    </td>
                                    <td className="p-4"><StatusBadge status={ad.status} /></td>
                                    <td className="p-4">
                                        <button 
                                            onClick={() => ad.id && handleDelete(ad.id)}
                                            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                                            title="O'chirish"
                                        >
                                            <DeleteIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && (
                <AddAdModal
                    onClose={() => !isSaving && setIsModalOpen(false)}
                    onSave={handleSaveAd}
                />
            )}
            
            {isSaving && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center">
                    <div className="bg-gray-900 p-6 rounded-lg flex flex-col items-center">
                         <LoadingSpinner />
                         <p className="mt-4 text-white font-semibold">Yuklanmoqda...</p>
                    </div>
                </div>
            )}
        </div>
    );
};
