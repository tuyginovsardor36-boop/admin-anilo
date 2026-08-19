
import React, { useState, useEffect } from 'react';
import { CrownIcon } from './icons/CrownIcon';
import { TicketIcon } from './icons/TicketIcon';
import { buySubscription, redeemPromocode, getAppConfig } from '../services/dbService';
import { supabase } from '../services/supabaseClient';
import { useNotification } from '../hooks/useNotification';
import { LoadingSpinner } from './LoadingSpinner';
import { Check, Star, Zap, Shield, ArrowRight } from 'lucide-react';

type PlanDuration = '1-oy' | '3-oy' | '6-oy' | '1-yil';

interface PlanDetails {
    price: number;
    originalPrice?: number;
    label: string;
    description: string;
    accentColor: string;
    icon: React.ReactNode;
    features: string[];
    isPopular?: boolean;
}

interface SubscriptionPlansProps {
    onPlanSelect?: (plan: string) => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount);
};

export const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ onPlanSelect }) => {
    const [selectedPlan, setSelectedPlan] = useState<PlanDuration>('3-oy');
    const [isLoading, setIsLoading] = useState(false);
    const [showPromoModal, setShowPromoModal] = useState(false);
    const [promoCode, setPromoCode] = useState('');
    const [discount, setDiscount] = useState<{value: number, type: 'percentage' | 'fixed'} | null>(null);
    const { addNotification } = useNotification();
    
    const [plans, setPlans] = useState<Record<PlanDuration, PlanDetails>>({
        '1-oy': { 
            price: 9999, label: 'SILVER', description: 'Boshlash uchun',
            accentColor: 'border-zinc-500 text-zinc-400',
            icon: <Shield className="w-6 h-6 text-zinc-400" />,
            features: ['HD Sifat (720p)', '1 ta qurilma', 'Reklamasiz']
        },
        '3-oy': { 
            price: 28500, label: 'GOLD', description: 'Eng ommabop', isPopular: true,
            accentColor: 'border-yellow-500 text-yellow-400',
            icon: <CrownIcon className="w-6 h-6 text-yellow-400" />,
            features: ['Full HD (1080p)', '2 ta qurilma', 'Reklamasiz', 'Tezkor yuklama']
        },
        '6-oy': { 
            price: 51000, label: 'PLATINUM', description: 'Kino ixlosmandlari',
            accentColor: 'border-cyan-500 text-cyan-400',
            icon: <Star className="w-6 h-6 text-cyan-400" />,
            features: ['4K Ultra HD', '3 ta qurilma', 'Oflayn rejim (Beta)', 'VIP Support']
        },
        '1-yil': { 
            price: 90000, label: 'OBSIDIAN', description: 'Maksimal tejash',
            accentColor: 'border-purple-600 text-purple-500',
            icon: <Zap className="w-6 h-6 text-purple-500" />,
            features: ['Barcha imkoniyatlar', '5 ta qurilma', 'Eksklyuziv premyeralar', 'Beta funksiyalar']
        },
    });

    useEffect(() => {
        const fetchPrices = async () => {
            try {
                const config = await getAppConfig();
                const p1 = Number(config['price_1_oy']) || 9999;
                const p3 = Number(config['price_3_oy']) || 28500;
                const p6 = Number(config['price_6_oy']) || 51000;
                const p12 = Number(config['price_1_yil']) || 90000;

                setPlans(prev => ({
                    '1-oy': { ...prev['1-oy'], price: p1 },
                    '3-oy': { ...prev['3-oy'], price: p3, originalPrice: p3 * 1.2 },
                    '6-oy': { ...prev['6-oy'], price: p6, originalPrice: p6 * 1.25 },
                    '1-yil': { ...prev['1-yil'], price: p12, originalPrice: p12 * 1.3 },
                }));
            } catch (e) { console.error(e); }
        };
        fetchPrices();
    }, []);

    // Added missing handleRedeemPromo function to process promocode redemption.
    const handleRedeemPromo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!promoCode) return;
        
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                addNotification({ type: 'warning', title: 'Kirish kerak', message: "Tizimga kiring" });
                setIsLoading(false);
                return;
            }
            
            const result = await redeemPromocode(user.id, promoCode.toUpperCase());
            setDiscount({ value: result.discount || 0, type: result.type });
            setShowPromoModal(false);
            addNotification({ type: 'success', title: 'Qabul qilindi', message: 'Chegirma qo\'llanilidi!' });
        } catch (error: any) {
            addNotification({ type: 'error', title: 'Xatolik', message: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleBuyNow = async (planKey: PlanDuration) => {
        if (onPlanSelect) {
            onPlanSelect(planKey);
            return;
        }

        setIsLoading(true);
        const plan = plans[planKey];
        let finalPrice = plan.price;
        if (discount && selectedPlan === planKey) {
            finalPrice = discount.type === 'percentage' 
                ? Math.round(plan.price * (1 - discount.value / 100)) 
                : Math.max(0, plan.price - discount.value);
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                addNotification({ type: 'warning', title: 'Kirish kerak', message: "Tizimga kiring." });
                setIsLoading(false);
                return;
            }

            await buySubscription(user.id, planKey, finalPrice);
            addNotification({ type: 'success', title: 'Tabriklaymiz!', message: "Premium obuna faollashtirildi." });
            setTimeout(() => window.location.reload(), 1500);
        } catch (error: any) {
            addNotification({ type: 'error', title: 'Xatolik', message: error.message });
            setIsLoading(false);
        }
    };

    return (
        <section className="relative w-full max-w-7xl mx-auto px-2 pb-10">
            <div className="flex justify-between items-center mb-8 px-2">
                <h2 className="text-xl font-black text-white uppercase tracking-widest">Rejani tanlang</h2>
                <button onClick={() => setShowPromoModal(true)} className="flex items-center gap-2 text-[10px] font-black text-orange-500 uppercase tracking-widest hover:text-white transition-colors bg-orange-900/20 px-4 py-2 rounded-full border border-orange-500/30">
                    <TicketIcon className="w-4 h-4"/> Promokod
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(Object.keys(plans) as PlanDuration[]).map((key) => {
                    const plan = plans[key];
                    const isPop = plan.isPopular;
                    const isCurrentSelected = selectedPlan === key;

                    return (
                        <div 
                            key={key} 
                            onClick={() => setSelectedPlan(key)}
                            className={`relative rounded-[2.5rem] p-8 cursor-pointer transition-all duration-500 flex flex-col justify-between overflow-hidden border-2
                                ${isCurrentSelected 
                                    ? `bg-[#121212] ${plan.accentColor.split(' ')[0]} shadow-2xl scale-[1.02]` 
                                    : 'bg-[#0a0a0a] border-white/5 hover:border-white/10'
                                }
                            `}
                        >
                            {isPop && (
                                <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[9px] font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-widest shadow-lg">
                                    Mashhur
                                </div>
                            )}

                            <div>
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-white/5 border border-white/5 transition-transform ${isCurrentSelected ? 'scale-110 shadow-lg' : ''}`}>
                                    {plan.icon}
                                </div>
                                <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-1">{plan.label}</h3>
                                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] mb-8">{plan.description}</p>

                                <ul className="space-y-4 mb-10">
                                    {plan.features.map((f, i) => (
                                        <li key={i} className="flex items-center gap-3 text-xs text-zinc-400 font-bold">
                                            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${isCurrentSelected ? 'bg-orange-500' : 'bg-zinc-800'}`}>
                                                <Check size={10} className="text-white" strokeWidth={4} />
                                            </div>
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="space-y-6">
                                <div className="flex flex-col">
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-3xl font-black text-white tracking-tighter">
                                            {formatCurrency(discount && isCurrentSelected ? (discount.type === 'percentage' ? Math.round(plan.price * (1 - discount.value / 100)) : Math.max(0, plan.price - discount.value)) : plan.price)}
                                        </span>
                                        <span className="text-xs text-zinc-500 font-black">UZS</span>
                                    </div>
                                    {plan.originalPrice && <p className="text-xs text-zinc-600 line-through font-bold">{formatCurrency(plan.originalPrice)}</p>}
                                </div>

                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleBuyNow(key); }}
                                    disabled={isLoading}
                                    className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 disabled:opacity-50
                                        ${isCurrentSelected ? 'bg-white text-black hover:bg-orange-500 hover:text-white' : 'bg-zinc-900 text-white hover:bg-zinc-800'}
                                    `}
                                >
                                    {isLoading && isCurrentSelected ? <LoadingSpinner /> : (
                                        <>Obuna bo'lish <ArrowRight size={14}/></>
                                    )}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {showPromoModal && (
                <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[300] p-6 backdrop-blur-xl" onClick={() => setShowPromoModal(false)}>
                    <div className="bg-[#121212] border border-white/10 p-10 rounded-[3rem] w-full max-w-sm shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                        <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Promokod</h3>
                        <p className="text-zinc-500 text-[10px] mb-8 font-black uppercase tracking-widest">Chegirma kodingizni kiriting</p>
                        
                        <form onSubmit={handleRedeemPromo}>
                            <input 
                                type="text" 
                                value={promoCode} 
                                onChange={e => setPromoCode(e.target.value.toUpperCase())}
                                className="w-full bg-black border border-white/10 rounded-2xl p-5 text-white mb-6 focus:border-orange-500 outline-none font-mono text-center font-black tracking-[0.3em] text-xl"
                                placeholder="ANILO2025"
                                autoFocus
                            />
                            <div className="flex gap-4">
                                <button type="button" onClick={() => setShowPromoModal(false)} className="flex-1 py-4 bg-zinc-900 rounded-2xl text-zinc-500 font-black text-xs uppercase tracking-widest">Bekor</button>
                                <button type="submit" disabled={isLoading || !promoCode} className="flex-1 py-4 bg-orange-600 text-white font-black rounded-2xl hover:bg-orange-500 uppercase text-xs tracking-widest shadow-xl">
                                    Qabul
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
};
