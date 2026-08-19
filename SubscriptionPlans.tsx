
import React, { useState, useEffect } from 'react';
import { CrownIcon } from './components/icons/CrownIcon';
import { TicketIcon } from './components/icons/TicketIcon';
import { QualityIcon } from './components/icons/QualityIcon';
import { NoAdsIcon } from './components/icons/NoAdsIcon';
import { buySubscription, redeemPromocode, getAppConfig } from './services/dbService';
import { supabase } from './services/supabaseClient';
import { useNotification } from './hooks/useNotification';
import { LoadingSpinner } from './components/LoadingSpinner';
import { PlayIcon } from './components/icons/PlayIcon';

// Define plan types
type PlanDuration = '1-oy' | '3-oy' | '6-oy' | '1-yil';

interface PlanDetails {
    price: number;
    originalPrice?: number;
    monthlyPrice?: number;
    label: string;
}

const PlanFeature: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
    <li className="flex items-center gap-3 text-sm text-gray-300">
        <span className="text-yellow-400">{icon}</span>
        <span>{text}</span>
    </li>
);

// Helper to format currency
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' UZS';
};

export const SubscriptionPlans: React.FC = () => {
    const [selectedPlan, setSelectedPlan] = useState<PlanDuration>('1-oy');
    const [isLoading, setIsLoading] = useState(false);
    const [isPricesLoading, setIsPricesLoading] = useState(true);
    const [showPromoModal, setShowPromoModal] = useState(false);
    const [promoCode, setPromoCode] = useState('');
    const [discount, setDiscount] = useState<{value: number, type: 'percentage' | 'fixed'} | null>(null);
    const { addNotification } = useNotification();
    
    const [plans, setPlans] = useState<Record<PlanDuration, PlanDetails>>({
        '1-oy': { price: 9999, label: '1 oy' },
        '3-oy': { price: 28500, label: '3 oy' },
        '6-oy': { price: 51000, label: '6 oy' },
        '1-yil': { price: 90000, label: '1 yil' },
    });

    useEffect(() => {
        const fetchPrices = async () => {
            try {
                const config = await getAppConfig();
                const p1 = Number(config['price_1_oy']) || 9999;
                const p3 = Number(config['price_3_oy']) || 28500;
                const p6 = Number(config['price_6_oy']) || 51000;
                const p12 = Number(config['price_1_yil']) || 90000;

                setPlans({
                    '1-oy': {
                        price: p1,
                        originalPrice: Math.round(p1 * 1.2),
                        label: '1 oy',
                    },
                    '3-oy': {
                        price: p3,
                        monthlyPrice: Math.round(p3 / 3),
                        label: '3 oy',
                    },
                    '6-oy': {
                        price: p6,
                        monthlyPrice: Math.round(p6 / 6),
                        label: '6 oy',
                    },
                    '1-yil': {
                        price: p12,
                        monthlyPrice: Math.round(p12 / 12),
                        label: '1 yil',
                    },
                });
            } catch (e) {
                console.error("Failed to load prices", e);
            } finally {
                setIsPricesLoading(false);
            }
        };
        fetchPrices();
    }, []);
    
    const activePlan = plans[selectedPlan];
    
    // Calculate final price with discount
    let finalPrice = activePlan.price;
    if (discount) {
        if (discount.type === 'percentage') {
            finalPrice = Math.round(activePlan.price * (1 - discount.value / 100));
        } else {
            finalPrice = Math.max(0, activePlan.price - discount.value);
        }
    }

    const premiumFeatures = [
        { icon: <QualityIcon className="w-5 h-5" />, text: '4K+HDR Yuqori Sifat' },
        { icon: <NoAdsIcon className="w-5 h-5" />, text: selectedPlan === '1-yil' ? 'REKLAMASIZ (1 yillik bonus)' : 'Minimal reklama' },
        { icon: <PlayIcon className="w-5 h-5" />, text: 'Cheksiz tomosha vaqti (Limit yo\'q)' },
        { icon: <CrownIcon className="w-5 h-5" />, text: 'Eksklyuziv kontent' },
    ];

    const handleBuy = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                addNotification({ type: 'warning', title: 'Kirish kerak', message: "Iltimos, avval tizimga kiring." });
                setIsLoading(false);
                return;
            }

            await buySubscription(user.id, selectedPlan, finalPrice);
            addNotification({ type: 'success', title: 'Muvaffaqiyatli!', message: "Premium obuna faollashtirildi." });
            
            setTimeout(() => {
                window.location.reload(); 
            }, 1500);

        } catch (error: any) {
            console.error(error);
            if (error.message.includes("Mablag' yetarli emas")) {
                 addNotification({ type: 'error', title: 'Mablag\' yetarli emas', message: "Hisobingizni to'ldiring." });
            } else {
                addNotification({ type: 'error', title: 'Xatolik', message: error.message || "Xatolik yuz berdi" });
            }
            setIsLoading(false);
        }
    };

    const handleRedeemPromo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!promoCode) return;
        
        try {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                addNotification({ type: 'warning', title: 'Kirish kerak', message: "Tizimga kiring" });
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

    if (isPricesLoading) return <div className="py-10 flex justify-center"><LoadingSpinner /></div>;

    return (
        <section className="relative">
            <div className="max-w-md mx-auto bg-gray-900/50 backdrop-blur-sm border border-yellow-500/20 rounded-2xl shadow-lg overflow-hidden ring-1 ring-yellow-500/20">
                 <div className="p-6 sm:p-8">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">
                            <span role="img" aria-label="crown" className="mr-2">👑</span> PREMIUM
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">(Oflayn yuklab olish mualliflik huquqi sababli o'chirilgan)</p>
                    </div>

                    <div className="flex justify-center bg-gray-800 p-1 rounded-full mb-6">
                        {(Object.keys(plans) as PlanDuration[]).map((planKey) => (
                            <button
                                key={planKey}
                                onClick={() => setSelectedPlan(planKey)}
                                disabled={isLoading}
                                className={`w-full py-2 px-1 text-sm font-semibold rounded-full transition-colors duration-300 ${
                                    selectedPlan === planKey
                                        ? 'bg-yellow-400 text-black shadow-md shadow-yellow-500/20'
                                        : 'text-gray-400 hover:bg-gray-700'
                                }`}
                            >
                                {plans[planKey].label}
                            </button>
                        ))}
                    </div>

                    <div className="text-center mb-6 h-20 flex flex-col justify-center">
                        <div>
                            <span className="text-4xl font-extrabold text-white">{formatCurrency(finalPrice)}</span>
                            {(activePlan.originalPrice || discount) && (
                                <span className="ml-2 text-lg text-gray-500 line-through">
                                    {formatCurrency(activePlan.price)}
                                </span>
                            )}
                        </div>
                        {discount && (
                            <span className="text-green-400 text-sm font-bold animate-pulse">
                                Chegirma qo'llanildi!
                            </span>
                        )}
                        {activePlan.monthlyPrice && !discount && (
                            <p className="text-yellow-400 text-sm font-semibold mt-1">{formatCurrency(activePlan.monthlyPrice)} / oyiga</p>
                        )}
                    </div>
                    
                    <ul className="space-y-3 mb-8">
                        {premiumFeatures.map((feature, index) => (
                            <PlanFeature key={index} icon={feature.icon} text={feature.text} />
                        ))}
                    </ul>

                    <button 
                        onClick={handleBuy}
                        disabled={isLoading}
                        className="w-full py-3 bg-white text-black rounded-lg font-bold text-lg hover:bg-gray-200 transition-all duration-300 transform active:scale-95 shadow-lg shadow-white/10 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                        {isLoading ? 'Jarayonda...' : 'Faollashtirish'}
                    </button>
                </div>

                <div className="bg-yellow-400 text-black text-center py-3 px-6">
                    <button onClick={() => setShowPromoModal(true)} className="font-bold flex items-center justify-center w-full group">
                        <TicketIcon className="w-6 h-6 mr-2 transition-transform duration-300 group-hover:rotate-12"/>
                        <span>Promokod bormi?</span>
                    </button>
                </div>
            </div>

            {showPromoModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setShowPromoModal(false)}>
                    <div className="bg-gray-900 border border-yellow-500/50 p-6 rounded-xl w-full max-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-white mb-4">Promokodni kiriting</h3>
                        <form onSubmit={handleRedeemPromo}>
                            <input 
                                type="text" 
                                value={promoCode} 
                                onChange={e => setPromoCode(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white mb-4 focus:ring-2 focus:ring-yellow-500 focus:outline-none font-mono uppercase tracking-widest text-center"
                                placeholder="CODE2024"
                                autoFocus
                            />
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowPromoModal(false)} className="flex-1 py-2 bg-gray-700 rounded-lg text-white hover:bg-gray-600">Bekor qilish</button>
                                <button type="submit" disabled={isLoading || !promoCode} className="flex-1 py-2 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400">
                                    {isLoading ? '...' : 'Ishlatish'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
};
