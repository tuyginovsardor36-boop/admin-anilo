
import React, { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { StampIcon } from './components/icons/StampIcon';
import { UploadIcon } from './components/icons/UploadIcon';
import { DownloadIcon } from './components/icons/DownloadIcon';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useNotification } from './hooks/useNotification';
import { FileText } from 'lucide-react';

export const StampToolPage: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { addNotification } = useNotification();

    // Function to generate the circular stamp image using Canvas
    const generateStampImage = async (): Promise<Uint8Array> => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const size = 400; // High resolution for print
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');

            if (!ctx) return;

            const centerX = size / 2;
            const centerY = size / 2;
            const radius = 180;
            const color = '#1e3a8a'; // Official Blue (Anilo Brand)

            // 1. Outer Circle
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.lineWidth = 8;
            ctx.strokeStyle = color;
            ctx.stroke();

            // 2. Inner Circle
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius - 50, 0, 2 * Math.PI);
            ctx.lineWidth = 4;
            ctx.strokeStyle = color;
            ctx.stroke();

            // 3. Center Text (ANILO.UZ)
            ctx.fillStyle = color;
            ctx.font = 'bold 50px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Rotate text slightly for style
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(-10 * Math.PI / 180);
            ctx.fillText('ANILO.UZ', 0, -10);
            ctx.font = 'normal 25px Arial';
            ctx.fillText('PLATFORMASI', 0, 25);
            ctx.restore();

            // 4. Bottom Text (TASDIQLANGAN)
            ctx.font = 'bold 24px Arial';
            ctx.fillText('TASDIQLANGAN', centerX, centerY + 120);

            // 5. Top Curved Text (O'ZBEKISTON RESPUBLIKASI)
            // Simplified: Drawing text character by character along an arc
            const text = "O'ZBEKISTON RESPUBLIKASI";
            const angleStep = 0.3; // Radian per char (approx)
            const startAngle = -Math.PI / 2 - (text.length * angleStep) / 2 + angleStep / 2; // Center top
            
            ctx.save();
            ctx.font = 'bold 26px Arial';
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                ctx.save();
                ctx.translate(centerX, centerY);
                ctx.rotate(startAngle + i * angleStep);
                ctx.translate(0, -radius + 30); // Move to edge (inside)
                ctx.fillText(char, 0, 0);
                ctx.restore();
            }
            ctx.restore();

            // Convert to bytes
            canvas.toBlob((blob) => {
                if (blob) {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const arrayBuffer = reader.result as ArrayBuffer;
                        resolve(new Uint8Array(arrayBuffer));
                    };
                    reader.readAsArrayBuffer(blob);
                }
            }, 'image/png');
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type !== 'application/pdf') {
                addNotification({ type: 'warning', title: 'Fayl xato', message: 'Faqat PDF fayllar qabul qilinadi.' });
                return;
            }
            setFile(selectedFile);
            setDownloadUrl(null); // Reset previous result
        }
    };

    const processPdf = async () => {
        if (!file) return;
        setProcessing(true);

        try {
            // 1. Load the PDF
            const fileBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(fileBuffer);

            // 2. Generate Stamp Image
            const stampBytes = await generateStampImage();
            const stampImage = await pdfDoc.embedPng(stampBytes);

            // 3. Get the last page
            const pages = pdfDoc.getPages();
            const lastPage = pages[pages.length - 1];
            const { width } = lastPage.getSize();

            // 4. Draw the stamp
            // Position: Bottom Right
            const stampDims = stampImage.scale(0.4); // Scale down the 400px image
            lastPage.drawImage(stampImage, {
                x: width - stampDims.width - 50, // 50px margin from right
                y: 50, // 50px margin from bottom
                width: stampDims.width,
                height: stampDims.height,
                opacity: 0.9,
            });

            // 5. Save and Create Download Link
            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            
            setDownloadUrl(url);
            addNotification({ type: 'success', title: 'Tayyor', message: 'Hujjat tasdiqlandi va muhr bosildi.' });

        } catch (e) {
            console.error(e);
            addNotification({ type: 'error', title: 'Xatolik', message: 'PDFni qayta ishlashda xatolik yuz berdi.' });
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="animate-fade-in max-w-4xl mx-auto pb-10">
            <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                <StampIcon className="w-8 h-8 text-blue-500" />
                Hujjatni Tasdiqlash (E-Stamp)
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Upload Section */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mb-4 border-2 border-dashed border-gray-600">
                        <FileText className="w-10 h-10 text-gray-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">PDF Faylni Yuklang</h2>
                    <p className="text-sm text-gray-400 mb-6">
                        Shartnoma, buyruq yoki xatni yuklang. Tizim avtomatik ravishda oxirgi sahifaga rasmiy muhrni bosib beradi.
                    </p>
                    
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="application/pdf" 
                        className="hidden" 
                    />
                    
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors"
                    >
                        <UploadIcon className="w-5 h-5" /> Fayl Tanlash
                    </button>

                    {file && (
                        <div className="mt-4 p-3 bg-gray-700/50 rounded-lg border border-gray-600 flex items-center gap-3">
                            <FileText className="w-5 h-5 text-blue-400" />
                            <span className="text-sm text-white truncate max-w-[200px]">{file.name}</span>
                            <span className="text-xs text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                    )}
                </div>

                {/* Process Section */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
                    
                    <h2 className="text-xl font-bold text-white mb-6 relative z-10">Tasdiqlash</h2>
                    
                    <div className="space-y-4 relative z-10">
                        <div className="flex items-center gap-3 text-gray-300 text-sm">
                            <div className="w-6 h-6 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400 font-bold text-xs">1</div>
                            <span>Fayl tahlil qilinadi</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-300 text-sm">
                            <div className="w-6 h-6 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400 font-bold text-xs">2</div>
                            <span>"Anilo.uz" rasmiy muhri generatsiya qilinadi</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-300 text-sm">
                            <div className="w-6 h-6 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400 font-bold text-xs">3</div>
                            <span>Muhr oxirgi sahifaga (pastki o'ng) bosiladi</span>
                        </div>
                    </div>

                    <div className="mt-8">
                        {!downloadUrl ? (
                            <button 
                                onClick={processPdf}
                                disabled={!file || processing}
                                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-900/20"
                            >
                                {processing ? <LoadingSpinner /> : <StampIcon className="w-5 h-5" />}
                                {processing ? 'Jarayonda...' : 'MUHR BOSISH'}
                            </button>
                        ) : (
                            <a 
                                href={downloadUrl} 
                                download={`signed_${file?.name || 'document.pdf'}`}
                                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-orange-900/20 animate-pulse"
                            >
                                <DownloadIcon className="w-5 h-5" />
                                TAYYOR HUJJATNI YUKLASH
                            </a>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
