import React, { useState } from 'react';
import { createTsPayTransaction } from './services/tspayService';
import { supabase } from './services/supabaseClient';
import { useNotification } from './hooks/useNotification';
import { uploadFile, createPaymentRequest } from './services/dbService';
import { 
    CreditCard, Zap, Loader2, AlertCircle, CheckCircle, 
    ShieldCheck, Smartphone, Send, MessageCircle, Clock, 
    UserCheck, ExternalLink, ArrowRight, Copy, Upload, Image as ImageIcon
} from 'lucide-react';

export const BillingPage: React.FC = () => {
    // TSPAY State
    const [tsAmount, setTsAmount] = useState('');
    const [isTsPayLoading, setIsTsPayLoading] = useState(false);
    const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
    const [lastError, setLastError] = useState<string | null>(null);

    // Manual Card State
    const [manualAmount, setManualAmount] = useState('');
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [isManualLoading, setIsManualLoading] = useState(false);
    const [manualSuccess, setManualSuccess] = useState(false);

    const { addNotification } = useNotification();

    const cardHolder = "ANILO TV (T. Sardor)";
    const cardNumber = "8600 1204 5940 3122"; // HUMO / UZCARD

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text.replace(/\s+/g, ''));
        addNotification({
            type: 'success',
            title: 'Nusxalandi',
            message: "Karta raqami buferga nusxalandi!"
        });
    };

    const handleTsPaySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLastError(null);
        setRedirectUrl(null);

        const amountNum = Number(tsAmount);
        if (!tsAmount || amountNum < 1000) {
            addNotification({ 
                type: 'warning', 
                title: 'Diqqat', 
                message: "Minimal to'lov summasi 1,000 so'm." 
            });
            return;
        }

        setIsTsPayLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                addNotification({ type: 'error', title: 'Xatolik', message: 'Iltimos, avval tizimga kiring.' });
                return;
            }

            // TsPay orqali tranzaksiya yaratish
            const res = await createTsPayTransaction(amountNum, user.id);
            
            if (res.status === 'success' && res.transaction?.url) {
                const payUrl = res.transaction.url;
                setRedirectUrl(payUrl);
                
                addNotification({ 
                    type: 'success', 
                    title: 'Bajarildi', 
                    message: "To'lov sahifasiga yo'naltirilmoqda..." 
                });
                
                // 1.5 sekunddan keyin avtomatik redirect
                setTimeout(() => {
                    window.location.href = payUrl;
                }, 1500);
            } else {
                // Backenddan kelgan aniq xato xabari
                const errMsg = res.message || "To'lov tizimi so'rovni rad etdi.";
                setLastError(errMsg);
                addNotification({ type: 'error', title: 'Rad etildi', message: errMsg });
            }
        } catch (e: any) {
            console.error("Submit Error:", e);
            setLastError("Tizim bilan ulanishda xato.");
            addNotification({ type: 'error', title: 'Xatolik', message: 'Internet ulanishini tekshiring.' });
        } finally {
            setIsTsPayLoading(false);
        }
    };

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const amt = Number(manualAmount);
        if (!manualAmount || amt < 1000) {
            addNotification({ type: 'warning', title: 'Xatolik', message: "Minimal to'lov summasi 1,000 so'm." });
            return;
        }
        if (!receiptFile) {
            addNotification({ type: 'warning', title: 'Chek yuklanmagan', message: "Iltimos, to'lov cheki rasmini (screenshot) yuklang." });
            return;
        }

        setIsManualLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                addNotification({ type: 'error', title: 'Xatolik', message: 'Iltimos, avval tizimga kiring.' });
                return;
            }

            // 1. Upload the receipt file
            addNotification({ type: 'info', title: 'Yuklanmoqda', message: 'Chek serverga yuklanmoqda...' });
            const fileUrl = await uploadFile(receiptFile, 'posters');
            if (!fileUrl) {
                throw new Error("Chek rasmini yuklab bo'lmadi.");
            }

            // 2. Submit payment request
            await createPaymentRequest(user.id, amt, fileUrl);

            setManualSuccess(true);
            setManualAmount('');
            setReceiptFile(null);
            
            addNotification({
                type: 'success',
                title: 'So\'rovingiz qabul qilindi',
                message: "Chek tekshirish uchun adminlarga yuborildi. Balansingiz tez orada to'ldiriladi!"
            });
        } catch (err: any) {
            console.error(err);
            addNotification({
                type: 'error',
                title: 'Xatolik',
                message: err.message || "To'lov so'rovini yuborishda xatolik yuz berdi."
            });
        } finally {
            setIsManualLoading(false);
        }
    };

    return (
        <div className="animate-fade-in pb-20 max-w-6xl mx-auto px-4 pt-6 selection:bg-blue-500">
            <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/20 mb-4">
                    <ShieldCheck size={14} className="text-blue-500" />
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Xavfsiz To'lov Markazi</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-3">Balansni To'ldirish</h1>
                <p className="text-zinc-500 font-bold uppercase tracking-[0.3em] text-[10px]">Premium xizmatlar va qo'llab-quvvatlash uchun</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                {/* 1. TSPAY AUTOMATIC */}
                <div className="bg-[#0f172a] border border-blue-500/20 rounded-[3rem] p-1 shadow-2xl relative overflow-hidden group h-full">
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px]"></div>
                    <div className="bg-[#0b1120]/90 backdrop-blur-xl rounded-[2.8rem] p-8 h-full flex flex-col relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                                    <Zap className="text-yellow-400 fill-current" size={24} />
                                    <span>TSPAY AVTOMATIK</span>
                                </h2>
                                <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mt-1">Lahzada to'ldirish • UZCARD / HUMO / VISA</p>
                            </div>
                            <div className="bg-blue-900/30 p-3 rounded-2xl border border-blue-500/20 shadow-inner">
                                <Smartphone className="text-blue-400" size={24} />
                            </div>
                        </div>

                        <form onSubmit={handleTsPaySubmit} className="space-y-6 flex-1 flex flex-col">
                            <div className="relative group/input">
                                <label className="text-[9px] font-black text-blue-300 uppercase tracking-widest absolute -top-2 left-5 bg-[#0b1120] px-2 z-10">Summa (UZS)</label>
                                <input 
                                    type="number" 
                                    value={tsAmount} 
                                    onChange={e => setTsAmount(e.target.value)} 
                                    className={`w-full bg-[#1e293b]/50 border ${lastError ? 'border-red-500/50' : 'border-blue-500/30'} rounded-2xl p-6 text-white font-mono text-3xl outline-none focus:border-blue-500 transition-all placeholder:text-zinc-700`} 
                                    placeholder="10000" 
                                />
                                <div className="grid grid-cols-3 gap-3 mt-4">
                                    {[5000, 20000, 50000].map(val => (
                                        <button 
                                            key={val} 
                                            type="button" 
                                            onClick={() => setTsAmount(val.toString())} 
                                            className="py-3 rounded-xl bg-blue-900/20 border border-blue-500/10 text-blue-300 text-[11px] font-black hover:bg-blue-500 hover:text-white transition-all uppercase tracking-tighter"
                                        >
                                            {val.toLocaleString()}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {lastError && (
                                <div className="flex items-start gap-3 text-red-400 text-xs bg-red-900/20 p-5 rounded-2xl border border-red-500/20 animate-shake">
                                    <AlertCircle size={18} className="shrink-0" />
                                    <div className="flex-1">
                                        <p className="font-black uppercase text-[10px] mb-1">Xatolik:</p>
                                        <p className="leading-relaxed">{lastError}</p>
                                    </div>
                                </div>
                            )}

                            {redirectUrl ? (
                                <div className="space-y-4 mt-auto animate-fade-in">
                                    <div className="p-6 bg-green-500/10 border border-green-500/30 rounded-3xl text-center shadow-2xl">
                                        <CheckCircle className="text-green-500 mx-auto mb-3" size={44} />
                                        <p className="text-white font-black text-sm uppercase tracking-tight mb-4">Tayyor! Sahifa ochilmasa pastga bosing:</p>
                                        <a href={redirectUrl} className="w-full inline-flex items-center justify-center gap-3 text-black bg-white px-6 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all shadow-xl group">
                                            TO'LOVGA O'TISH <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <button 
                                    type="submit" 
                                    disabled={isTsPayLoading} 
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-6 rounded-2xl font-black uppercase text-xs tracking-[0.3em] transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 mt-auto"
                                >
                                    {isTsPayLoading ? (
                                        <><Loader2 className="animate-spin" size={20} /> <span>YUKLANMOQDA...</span></>
                                    ) : (
                                        <><CreditCard size={20} /> TO'LOVNI BOSHLASH</>
                                    )}
                                </button>
                            )}
                        </form>

                        <div className="mt-8 flex items-center justify-center gap-2 text-[9px] text-zinc-500 font-black uppercase tracking-widest">
                            <ShieldCheck size={14} className="text-green-500" /> 100% Xavfsiz Tranzaksiya
                        </div>
                    </div>
                </div>

                {/* 2. MANUAL KARTA ORQALI TO'LOV & CHEK YUBORISH */}
                <div className="bg-[#229ED9]/10 border border-emerald-500/30 rounded-[3rem] p-1 shadow-2xl relative overflow-hidden group h-full">
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-600/20 rounded-full blur-[100px]"></div>
                    <div className="bg-[#0b1120]/90 backdrop-blur-xl rounded-[2.8rem] p-8 h-full flex flex-col relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-black text-white flex items-center gap-2 uppercase">
                                    <CreditCard className="text-emerald-400" size={24} />
                                    <span>KARTAGA TO'LOV</span>
                                </h2>
                                <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mt-1">Manual tekshirish • Chek orqali</p>
                            </div>
                            <div className="bg-emerald-950/30 p-3 rounded-2xl border border-emerald-500/20 shadow-inner">
                                <Send className="text-emerald-400" size={24} />
                            </div>
                        </div>

                        {manualSuccess ? (
                            <div className="flex-1 flex flex-col justify-center items-center text-center p-6 animate-fade-in bg-zinc-950/40 border border-emerald-500/30 rounded-[2rem] my-auto">
                                <CheckCircle size={56} className="text-emerald-500 mb-4" />
                                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Chek Qabul Qilindi!</h3>
                                <p className="text-zinc-400 text-xs leading-relaxed mb-6">
                                    Sizning to'lovingiz navbatga qo'shildi. Administratorlar chekni tez orada tekshirib, balansingizni avtomatik to'ldirishadi.
                                </p>
                                <button 
                                    onClick={() => setManualSuccess(false)}
                                    className="px-6 py-3 bg-emerald-600 border border-emerald-500/40 text-white hover:bg-emerald-500 rounded-xl text-xs font-black uppercase tracking-wider"
                                >
                                    Yana chek yuborish
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6 flex-1 flex flex-col">
                                {/* CARD DATA */}
                                <div className="bg-zinc-950/60 border border-zinc-800/80 p-5 rounded-2xl relative">
                                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">To'lov qilish uchun karta raqami:</p>
                                    <div className="flex items-center justify-between">
                                        <p className="text-white font-mono text-xl tracking-wider select-all">{cardNumber}</p>
                                        <button 
                                            type="button" 
                                            onClick={() => copyToClipboard(cardNumber)}
                                            className="p-2 bg-[#1e293b] text-blue-400 hover:text-blue-300 rounded-lg border border-zinc-700/50 hover:bg-[#1e293b]/80 transition-all active:scale-95"
                                            title="Nusxalash"
                                        >
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-center mt-3 text-[10px]">
                                        <span className="text-zinc-500 font-bold uppercase tracking-wider">Ega: <span className="text-zinc-300">{cardHolder}</span></span>
                                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-black text-[8px] uppercase">Humo / Uzcard</span>
                                    </div>
                                </div>

                                {/* FORM */}
                                <form onSubmit={handleManualSubmit} className="space-y-4 flex-1 flex flex-col">
                                    {/* AMOUNT */}
                                    <div className="relative group/input">
                                        <label className="text-[9px] font-black text-emerald-400 uppercase tracking-widest absolute -top-2 left-5 bg-[#0b1120] px-2 z-10">To'langan Summa (UZS)</label>
                                        <input 
                                            type="number" 
                                            value={manualAmount} 
                                            onChange={e => setManualAmount(e.target.value)} 
                                            className="w-full bg-[#1e293b]/30 border border-emerald-500/20 rounded-2xl p-4 text-white font-mono text-lg outline-none focus:border-emerald-500 transition-all placeholder:text-zinc-700" 
                                            placeholder="Summani kiriting (masalan: 10000)" 
                                        />
                                    </div>

                                    {/* CHEK UPLOADER */}
                                    <div className="border-2 border-dashed border-zinc-800 hover:border-emerald-500/50 rounded-2xl p-5 text-center cursor-pointer transition-all relative block">
                                        <input 
                                            type="file" 
                                            accept="image/*,application/pdf"
                                            onChange={e => {
                                                const files = e.target.files;
                                                if (files && files.length > 0) {
                                                    setReceiptFile(files[0]);
                                                }
                                            }}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        {receiptFile ? (
                                            <div className="flex items-center gap-3 justify-center text-emerald-400 font-bold text-xs uppercase">
                                                <ImageIcon size={20} />
                                                <span className="truncate max-w-[200px]">{receiptFile.name} (Tanlandi)</span>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Upload className="mx-auto text-zinc-600 group-hover:text-emerald-500 transition-colors" size={28} />
                                                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-wider">To'lov chekini (rasm/screenshot) yuklang</p>
                                                <p className="text-zinc-600 text-[9px]">Suring yoki shu yerga bosing</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* ACTIONS */}
                                    <button 
                                        type="submit" 
                                        disabled={isManualLoading} 
                                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all shadow-xl shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 mt-auto"
                                    >
                                        {isManualLoading ? (
                                            <><Loader2 className="animate-spin" size={20} /> <span>YUBORILMOQDA...</span></>
                                        ) : (
                                            <><Send size={18} /> CHEKNI TASDIQLASHGA YUBORISH</>
                                        )}
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* SUPPORT */}
                        <div className="mt-6 flex items-center justify-between border-t border-zinc-800 pt-5 text-[10px] text-zinc-500">
                            <span className="font-bold flex items-center gap-1.5"><Clock size={12} className="text-amber-500" /> Tasklar 10-15 daqiqada tasdiqlanadi.</span>
                            <a href="https://t.me/anilo_ega" target="_blank" className="text-blue-400 hover:underline font-bold flex items-center gap-1">@anilo_ega <ExternalLink size={10} /></a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
