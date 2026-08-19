import React, { useRef } from 'react';
import { PaletteIcon } from './icons/PaletteIcon';

export const BackgroundUploader: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                document.body.style.backgroundImage = `url(${result})`;
                localStorage.setItem('custom-background-image', result);
            };
            reader.readAsDataURL(file);
        }
        // Reset the input value to allow uploading the same file again
        event.target.value = '';
    };

    return (
        <div>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
                aria-hidden="true"
            />
            <button
                onClick={handleButtonClick}
                className="fixed bottom-5 right-5 z-50 p-3 bg-gray-900/70 backdrop-blur-sm border border-orange-500/30 rounded-full text-orange-400 hover:bg-orange-500/20 hover:text-orange-300 transition-all duration-300 shadow-lg"
                aria-label="Orqa fon rasmini o'zgartirish"
                title="Orqa fon rasmini o'zgartirish"
            >
                <PaletteIcon className="w-6 h-6" />
            </button>
        </div>
    );
};
