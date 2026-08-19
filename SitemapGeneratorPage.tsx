import React, { useState } from 'react';
import { MapIcon } from './components/icons/MapIcon';
import { DownloadIcon } from './components/icons/DownloadIcon';
import { generateSitemapXml, downloadSitemap } from './services/seoService';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useNotification } from './hooks/useNotification';
import { Copy } from 'lucide-react';

export const SitemapGeneratorPage: React.FC = () => {
    const [xmlContent, setXmlContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { addNotification } = useNotification();

    const handleGenerate = async () => {
        setIsLoading(true);
        try {
            const xml = await generateSitemapXml();
            setXmlContent(xml);
            addNotification({ type: 'success', title: 'Tayyor', message: 'Sitemap XML muvaffaqiyatli yaratildi.' });
        } catch (e) {
            addNotification({ type: 'error', title: 'Xatolik', message: 'Yaratishda xatolik yuz berdi.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(xmlContent);
        addNotification({ type: 'success', title: 'Nusxalandi', message: 'Buferga nusxalandi.' });
    };

    const handleDownload = () => {
        downloadSitemap(xmlContent);
        addNotification({ type: 'success', title: 'Yuklandi', message: 'sitemap.xml fayli yuklab olindi.' });
    };

    return (
        <div className="animate-fade-in max-w-4xl mx-auto pb-10">
            <h1 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
                <MapIcon className="w-8 h-8 text-orange-500" />
                SEO & Sitemap Generator
            </h1>
            <p className="text-gray-400 mb-8">
                Google va Yandex botlari uchun sayt xaritasini (sitemap.xml) yarating. 
                Yangi kinolar qo'shilganda bu yerdan yangi fayl yaratib, hostingingizdagi <code>public/sitemap.xml</code> o'rniga yuklashingiz tavsiya etiladi.
            </p>

            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white">Generator</h2>
                    <button 
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading ? 'Yaratilmoqda...' : 'Hozir Yaratish'}
                    </button>
                </div>

                {isLoading && <div className="py-10 flex justify-center"><LoadingSpinner /></div>}

                {!isLoading && xmlContent && (
                    <div className="animate-fade-in">
                        <div className="flex gap-3 mb-3 justify-end">
                            <button onClick={handleCopy} className="text-gray-400 hover:text-white flex items-center gap-1 text-sm bg-gray-700 px-3 py-1 rounded">
                                <Copy size={16} /> Kodni nusxalash
                            </button>
                            <button onClick={handleDownload} className="text-green-400 hover:text-green-300 flex items-center gap-1 text-sm bg-gray-700 px-3 py-1 rounded">
                                <DownloadIcon className="w-4 h-4" /> Yuklab olish (.xml)
                            </button>
                        </div>
                        <div className="relative">
                            <textarea 
                                readOnly
                                value={xmlContent}
                                className="w-full h-96 bg-black/60 border border-gray-600 rounded-lg p-4 text-green-400 font-mono text-xs sm:text-sm focus:outline-none"
                            />
                        </div>
                        <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-200 text-sm">
                            <strong>Eslatma:</strong> Yuklab olingan <code>sitemap.xml</code> faylini loyihangizning asosiy papkasidagi <code>public</code> papkasiga joylashtiring va saytni qayta yuklang (deploy).
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};