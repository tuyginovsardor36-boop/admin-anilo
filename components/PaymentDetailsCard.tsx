
import React, { useState, useRef, useEffect } from 'react';
import { CopyIcon } from './icons/CopyIcon';
import { getAppConfig } from '../services/dbService';

// Uzcard Logo (Simplified)
const UzcardLogo = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 30" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 5h10v20h-10z" fill="#3B82F6"/>
        <path d="M25 5h10v20h-10z" fill="#60A5FA"/>
        <text x="45" y="22" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="20" fill="white">UZCARD</text>
    </svg>
);

// Humo Logo (Simplified)
const HumoLogo = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 30" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 15c0-5 5-10 15-10s10 5 10 10-5 10-15 10-15-5-15-10z" fill="#F97316"/>
        <text x="40" y="22" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="20" fill="white">HUMO</text>
    </svg>
);

// Contactless Icon
const ContactlessIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-white/80" stroke="currentColor" strokeWidth="2">
        <path d="M8.5 10a4 4 0 0 1 7 0" strokeLinecap="round" />
        <path d="M6 8.5a7 7 0 0 1 12 0" strokeLinecap="round" />
        <path d="M3.5 7a10 10 0 0 1 17 0" strokeLinecap="round" />
    </svg>
);

export const PaymentDetailsCard: React.FC = () => {
    const [cardNumber, setCardNumber] = useState('8600 0000 0000 0000');
    const [cardHolder, setCardHolder] = useState('ANILO PLATFORM');
    const [copied, setCopied] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState<React.CSSProperties & { [key: string]: string | number | undefined }>({});

    useEffect(() => {
        const loadCardInfo = async () => {
            try {
                const config = await getAppConfig();
                if (config['card_number']) setCardNumber(config['card_number']);
                if (config['card_holder']) setCardHolder(config['card_holder']);
            } catch (e) { console.error(e); }
        };
        loadCardInfo();
    }, []);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const rotateX = (y / rect.height - 0.5) * -15; // Subtle rotation
        const rotateY = (x / rect.width - 0.5) * 15;

        setStyle({
            '--mouse-x': `${x}px`,
            '--mouse-y': `${y}px`,
            transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
        });
    };

    const handleMouseLeave = () => {
        setStyle({
            transform: 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)',
            transition: 'transform 0.5s ease-out'
        });
    };

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(cardNumber.replace(/\s/g, ''));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="w-full max-w-[24rem] mx-auto perspective-1000 group">
            <div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={style}
                className="relative aspect-[1.586/1] w-full rounded-2xl shadow-2xl transition-all duration-100 ease-linear cursor-pointer"
            >
                {/* --- CARD BACKGROUND & TEXTURES --- */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-black border border-white/10">
                    
                    {/* Metal/Noise Texture */}
                    <div className="absolute inset-0 opacity-20 mix-blend-overlay" 
                         style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
                    </div>

                    {/* Geometric Pattern */}
                    <div className="absolute inset-0 opacity-10"
                         style={{ 
                             backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 1px, transparent 1px)',
                             backgroundSize: '20px 20px' 
                         }}>
                    </div>

                    {/* Dynamic Holographic Shine */}
                    <div 
                        className="absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none"
                        style={{
                            background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.2) 40%, rgba(255,255,255,0.4) 45%, rgba(255,255,255,0.2) 50%, transparent 80%)',
                            backgroundSize: '200% 100%',
                            filter: 'blur(5px)',
                            transform: 'translateX(var(--mouse-x, -100%))' // Simple movement attempt, usually needs JS animation for scan
                        }}
                    ></div>
                    
                    {/* Mouse Follow Glow */}
                    <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{
                            background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(255,255,255,0.06), transparent 40%)`
                        }}
                    ></div>
                </div>

                {/* --- CARD CONTENT --- */}
                <div className="relative z-10 h-full p-6 flex flex-col justify-between text-white select-none">
                    
                    {/* Header */}
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-yellow-500 flex items-center justify-center shadow-lg border border-white/20">
                                <span className="font-black text-xs italic">A</span>
                            </div>
                            <span className="font-bold tracking-widest text-lg font-['Metal_Mania'] text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                                ANILO.UZ
                            </span>
                        </div>
                        <ContactlessIcon />
                    </div>

                    {/* Chip & Number */}
                    <div className="space-y-4 mt-2">
                        <div className="w-12 h-9 rounded-md bg-gradient-to-br from-[#fbbf24] to-[#b45309] border border-[#fcd34d]/50 relative overflow-hidden shadow-inner">
                            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-black/40"></div>
                            <div className="absolute left-1/2 top-0 h-full w-[1px] bg-black/40"></div>
                            <div className="absolute inset-0 m-auto w-6 h-5 border border-black/30 rounded-[2px]"></div>
                        </div>

                        <div className="flex items-center justify-between group/number relative">
                            <div 
                                className="font-mono text-xl sm:text-2xl tracking-[0.15em] text-white/90 drop-shadow-md"
                                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                            >
                                {cardNumber}
                            </div>
                            <button 
                                onClick={handleCopy}
                                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all active:scale-95 border border-white/5 backdrop-blur-sm"
                                title="Nusxalash"
                            >
                                {copied ? <span className="text-green-400 text-xs font-bold">OK</span> : <CopyIcon className="w-4 h-4"/>}
                            </button>
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="flex justify-between items-end">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-[7px] text-gray-400 uppercase tracking-widest">Valid Thru</span>
                                <span className="text-xs font-mono font-bold">12/28</span>
                            </div>
                            <p className="font-medium tracking-wider uppercase text-sm sm:text-base text-gray-200 drop-shadow-sm truncate max-w-[160px]">
                                {cardHolder}
                            </p>
                        </div>

                        {/* Payment System Logos */}
                        <div className="flex flex-col items-end gap-1">
                            <div className="flex gap-2 bg-white/5 p-1.5 rounded-lg border border-white/5 backdrop-blur-sm">
                                <UzcardLogo className="h-4 w-auto opacity-90" />
                                <div className="w-px h-4 bg-white/20"></div>
                                <HumoLogo className="h-4 w-auto opacity-90" />
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Shine effect overlay */}
                <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 pointer-events-none"></div>
            </div>
        </div>
    );
};
