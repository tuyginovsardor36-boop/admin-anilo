
import React, { useState } from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { ToggleSwitch } from './ToggleSwitch';

interface AddAdModalProps {
  onClose: () => void;
  onSave: (adData: any) => void;
}

export const AddAdModal: React.FC<AddAdModalProps> = ({ onClose, onSave }) => {
    const [name, setName] = useState('');
    const [adType, setAdType] = useState<'video' | 'banner'>('banner'); 
    const [sourceType, setSourceType] = useState<'url' | 'file'>('url');
    const [file, setFile] = useState<File | null>(null);
    const [contentUrl, setContentUrl] = useState('');
    const [targetUrl, setTargetUrl] = useState('');
    const [location, setLocation] = useState('welcome_bottom');
    const [isActive, setIsActive] = useState(true);
    const [validationError, setValidationError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            
            // Video format validation
            if (adType === 'video') {
                if (selectedFile.type !== 'video/mp4' && selectedFile.type !== 'video/webm') {
                    setValidationError("Diqqat: Veb-saytlar faqat MP4 yoki WebM formatini o'qiydi. MKV ishlamaydi.");
                    // We still accept it, but warn the user
                } else {
                    setValidationError(null);
                }
                // Size warning (e.g. > 50MB)
                if (selectedFile.size > 50 * 1024 * 1024) {
                     setValidationError("Fayl hajmi juda katta (50MB+). Yuklash uzoq vaqt olishi yoki xato berishi mumkin.");
                }
            }
            
            setFile(selectedFile);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (sourceType === 'file' && !file) {
            setValidationError("Iltimos, faylni tanlang.");
            return;
        }
        setValidationError(null);
        onSave({ name, adType, sourceType, contentUrl, file, targetUrl, location, isActive });
        // Note: onClose is handled by parent after successful save or manually by user
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-900 border border-orange-500/30 rounded-lg shadow-xl w-full max-w-lg m-4 relative max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-gray-800">
                    <h2 className="text-2xl font-bold text-orange-500">Yangi Reklama Qo'shish</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors" aria-label="Yopish">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    {validationError && (
                        <div className="p-3 bg-yellow-500/20 border border-yellow-500/50 rounded text-yellow-200 text-sm">
                            {validationError}
                        </div>
                    )}

                    <div>
                        <label htmlFor="ad-name" className="block text-sm font-medium text-gray-300 mb-2">Reklama Nomi</label>
                        <input id="ad-name" type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Masalan: Katta kuzgi aksiya" className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:ring-2 focus:ring-orange-500 focus:outline-none text-white" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="ad-type" className="block text-sm font-medium text-gray-300 mb-2">Reklama Turi</label>
                            <select id="ad-type" value={adType} onChange={e => setAdType(e.target.value as any)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:ring-2 focus:ring-orange-500 focus:outline-none text-white">
                                <option value="banner">Rasm (Banner)</option>
                                <option value="video">Video (MP4)</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-2">Joylashuv</label>
                            <select id="location" value={location} onChange={e => setLocation(e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:ring-2 focus:ring-orange-500 focus:outline-none text-white">
                                {adType === 'banner' ? (
                                    <>
                                        <option value="welcome_bottom">Bosh Sahifa (Pastki Banner)</option>
                                        <option value="search_top">Qidiruv (Yuqori Banner)</option>
                                        <option value="detail_top">Kino Sahifasi (Yuqori Banner)</option>
                                        <option value="player_overlay_small_banner">Player (Kichik Overlay)</option>
                                        <option value="player_overlay_large_banner">Player (Katta Overlay)</option>
                                        <option value="player_overlay_full">Player (To'liq Ekran)</option>
                                    </>
                                ) : (
                                    <option value="pre_roll_video">Pre-Roll (Video boshlanishidan oldin)</option>
                                )}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            {adType === 'video' ? 'Video Manbasi (MP4 tavsiya etiladi)' : 'Rasm Manbasi'}
                        </label>
                        <div className="flex gap-4 mb-2">
                           <label className="flex items-center gap-2 text-gray-300"><input type="radio" name="sourceType" checked={sourceType === 'url'} onChange={() => setSourceType('url')} className="accent-orange-500" /> URL</label>
                           <label className="flex items-center gap-2 text-gray-300"><input type="radio" name="sourceType" checked={sourceType === 'file'} onChange={() => setSourceType('file')} className="accent-orange-500" /> {adType === 'video' ? 'Video yuklash' : 'Rasm yuklash'}</label>
                        </div>
                        {sourceType === 'url' ? (
                            <input type="text" placeholder={adType === 'video' ? "https://server.com/video.mp4" : "https://server.com/image.jpg"} value={contentUrl} onChange={e => setContentUrl(e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:ring-2 focus:ring-orange-500 focus:outline-none text-white" />
                        ) : (
                            <div className="space-y-2">
                                <input 
                                    type="file" 
                                    accept={adType === 'video' ? "video/mp4,video/webm" : "image/*"}
                                    onChange={handleFileChange} 
                                    className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-600/20 file:text-orange-400 hover:file:bg-orange-600/30" 
                                />
                                {adType === 'video' && <p className="text-xs text-gray-500">Eslatma: MKV fayllar brauzerda ishlamaydi. Iltimos, .mp4 yuklang.</p>}
                            </div>
                        )}
                    </div>

                    <div>
                        <label htmlFor="target-url" className="block text-sm font-medium text-gray-300 mb-2">Target URL (Bosilganda ochiladi)</label>
                        <input id="target-url" type="text" placeholder="https://t.me/..." value={targetUrl} onChange={e => setTargetUrl(e.target.value)} required className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:ring-2 focus:ring-orange-500 focus:outline-none text-white" />
                    </div>

                    <div className="flex justify-between items-center border-t border-gray-800 pt-4">
                        <label className="text-sm font-medium text-gray-300">Holati</label>
                        <ToggleSwitch checked={isActive} onChange={setIsActive} />
                    </div>
                </form>

                <div className="p-6 border-t border-gray-800 bg-gray-900/50 flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md font-semibold transition-colors text-white">Bekor qilish</button>
                    <button type="submit" onClick={handleSubmit} className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-md font-semibold transition-colors text-white">Saqlash</button>
                </div>
            </div>
        </div>
    );
};
