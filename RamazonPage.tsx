import React, { useState, useEffect } from 'react';
import { ArrowLeft, Moon, Sun, MapPin, Clock, Info, Share2 } from 'lucide-react';

interface RamazonPageProps {
    onBack: () => void;
}

const REGIONS: Record<string, number> = {
    "Toshkent": 0, "Andijon": -10, "Namangan": -8, "Farg'ona": -9, "Jizzax": 5,
    "Sirdaryo": 2, "Samarqand": 8, "Buxoro": 18, "Navoiy": 12, "Xorazm": 30,
    "Nukus": 35, "Qashqadaryo": 15, "Surxondaryo": 12
};

const RAMADAN_START_DATE = new Date("2025-03-01T00:00:00");

export const RamazonPage: React.FC<RamazonPageProps> = ({ onBack }) => {
    const [selectedRegion, setSelectedRegion] = useState(() => localStorage.getItem('anilo_ramazon_region') || "Toshkent");
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
    const [isRamadan, setIsRamadan] = useState(false);
    
    const baseSahar = "05:15";
    const baseIftar = "18:20";

    const handleRegionChange = (region: string) => {
        setSelectedRegion(region);
        localStorage.setItem('anilo_ramazon_region', region);
        // Headerga o'zgarishni bildirish uchun event trigger qilamiz
        window.dispatchEvent(new Event('storage'));
    };

    const calculateRegionTime = (baseTime: string, offset: number) => {
        const [h, m] = baseTime.split(':').map(Number);
        let totalMinutes = h * 60 + m + offset;
        const newH = Math.floor(totalMinutes / 60);
        const newM = totalMinutes % 60;
        return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
    };

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            const difference = RAMADAN_START_DATE.getTime() - now.getTime();

            if (difference <= 0) {
                setIsRamadan(true);
                clearInterval(timer);
            } else {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    mins: Math.floor((difference / 1000 / 60) % 60),
                    secs: Math.floor((difference / 1000) % 60)
                });
            }
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="min-h-screen bg-[#050505] text-white pb-32 animate-fade-in font-sans">
            <div className="bg-zinc-900/50 backdrop-blur-md border-b border-white/5 px-6 py-6 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 bg-white/5 rounded-full hover:bg-orange-600 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-black uppercase tracking-tighter">Ramazon 2025</h1>
                </div>
                <div className="flex items-center gap-2 bg-orange-600/20 px-4 py-2 rounded-2xl border border-orange-500/30">
                    <MapPin size={14} className="text-orange-500" />
                    <select 
                        value={selectedRegion}
                        onChange={(e) => handleRegionChange(e.target.value)}
                        className="bg-transparent text-xs font-black uppercase tracking-widest outline-none appearance-none cursor-pointer"
                    >
                        {Object.keys(REGIONS).map(r => <option key={r} value={r} className="bg-zinc-900">{r}</option>)}
                    </select>
                </div>
            </div>

            <div className="container mx-auto px-4 md:px-8 max-w-4xl mt-10 space-y-8">
                {!isRamadan && (
                    <div className="relative bg-gradient-to-br from-orange-600 to-red-600 rounded-[3rem] p-10 text-center shadow-2xl overflow-hidden group">
                        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                        <Moon size={80} className="mx-auto mb-6 text-white drop-shadow-2xl animate-pulse" />
                        <h2 className="text-sm font-black uppercase tracking-[0.4em] mb-8 text-orange-200">Muborak oyga qoldi:</h2>
                        <div className="grid grid-cols-4 gap-4">
                            {[
                                { label: 'Kun', val: timeLeft.days },
                                { label: 'Soat', val: timeLeft.hours },
                                { label: 'Min', val: timeLeft.mins },
                                { label: 'Sek', val: timeLeft.secs },
                            ].map(t => (
                                <div key={t.label} className="bg-black/30 backdrop-blur-md rounded-3xl p-4 flex flex-col items-center">
                                    <span className="text-3xl md:text-5xl font-black tracking-tighter">{t.val}</span>
                                    <span className="text-[10px] font-bold uppercase mt-1 opacity-60">{t.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-8 flex flex-col items-center text-center group hover:border-orange-500/50 transition-all">
                        <div className="w-16 h-16 bg-blue-600/10 rounded-3xl flex items-center justify-center text-blue-500 mb-6 group-hover:scale-110 transition-transform">
                            <Sun size={32} />
                        </div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2">Saharlik (Yopish)</h3>
                        <p className="text-5xl font-black tracking-tighter text-white">
                            {calculateRegionTime(baseSahar, REGIONS[selectedRegion])}
                        </p>
                    </div>

                    <div className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-8 flex flex-col items-center text-center group hover:border-orange-500/50 transition-all">
                        <div className="w-16 h-16 bg-orange-600/10 rounded-3xl flex items-center justify-center text-orange-500 mb-6 group-hover:scale-110 transition-transform">
                            <Moon size={32} />
                        </div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2">Iftorlik (Ochish)</h3>
                        <p className="text-5xl font-black tracking-tighter text-white">
                            {calculateRegionTime(baseIftar, REGIONS[selectedRegion])}
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-[#111] border border-white/5 rounded-[2.5rem] p-8">
                        <h4 className="text-lg font-black uppercase tracking-tight text-orange-500 mb-4 flex items-center gap-3">
                            <Clock size={20} /> Saharlik duosi
                        </h4>
                        <p className="text-zinc-200 text-lg leading-relaxed font-serif italic mb-6">
                            "Navaytu an asuma sovma shahri ramazona minal fajri ilal mag'ribi, xolisan lillahi ta'ala. Allohu akbar."
                        </p>
                    </div>

                    <div className="bg-[#111] border border-white/5 rounded-[2.5rem] p-8">
                        <h4 className="text-lg font-black uppercase tracking-tight text-orange-500 mb-4 flex items-center gap-3">
                            <Moon size={20} /> Iftorlik duosi
                        </h4>
                        <p className="text-zinc-200 text-lg leading-relaxed font-serif italic mb-6">
                            "Allohumma laka sumtu va bika amantu va 'alayka tavakkaltu va 'ala rizqika aftartu, fag'firli ya g'offaru ma qoddamtu va ma axxortu."
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};