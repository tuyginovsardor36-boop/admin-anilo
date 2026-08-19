
import React, { useState, useEffect } from 'react';
import { CrownIcon } from './components/icons/CrownIcon';
import { PaymentRequestDB, UserProfile } from './types';
import { ImagePreviewModal } from './components/ImagePreviewModal';
import { useNotification } from './hooks/useNotification';
import { getPaymentRequests, approvePaymentRequest, rejectPaymentRequest, getPremiumUsers, adminAdjustUserBalance, getUserByEmail, giveGlobalBonus } from './services/dbService';
import { LoadingSpinner } from './components/LoadingSpinner';
import { WalletIcon } from './components/icons/WalletIcon';
import { PlusIcon } from './components/icons/PlusIcon';
import { Gift } from 'lucide-react';

const StatCard: React.FC<{
    title: string;
    value: string;
    color: string;
}> = ({ title, value, color }) => (
    <div className="bg-gray-800/70 p-6 rounded-lg border-t-4" style={{borderColor: color}}>
        <p className="text-sm text-gray-400">{title}</p>
        <p className="text-3xl font-bold text-white mt-1">{value}</p>
    </div>
);

export const FinancialsPage: React.FC = () => {
    const [pendingRequests, setPendingRequests] = useState<PaymentRequestDB[]>([]);
    const [premiumUsers, setPremiumUsers] = useState<any[]>([]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({ income: 0, pending: 0 });
    const [processingId, setProcessingId] = useState<number | null>(null);
    
    // Manual Transaction State
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [manualEmail, setManualEmail] = useState('');
    const [manualAmount, setManualAmount] = useState('');
    const [manualType, setManualType] = useState<'add' | 'deduct'>('add');
    const [manualDescription, setManualDescription] = useState('');
    const [manualLoading, setManualLoading] = useState(false);

    // Bonus State
    const [bonusAmount, setBonusAmount] = useState('5000');
    const [isBonusLoading, setIsBonusLoading] = useState(false);

    const { addNotification } = useNotification();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const requests = await getPaymentRequests();
            setPendingRequests(requests.filter(r => r.status === 'pending'));
            
            const premiums = await getPremiumUsers();
            setPremiumUsers(premiums);

            const totalIncome = requests
                .filter(r => r.status === 'approved')
                .reduce((acc, curr) => acc + curr.amount, 0);
            
            const totalPending = requests
                .filter(r => r.status === 'pending')
                .reduce((acc, curr) => acc + curr.amount, 0);

            setStats({ income: totalIncome, pending: totalPending });

        } catch (e) {
            console.error(e);
            addNotification({ type: 'error', title: 'Xatolik', message: 'Ma\'lumotlarni yuklab bo\'lmadi.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (req: PaymentRequestDB) => {
        setProcessingId(req.id);
        try {
            await approvePaymentRequest(req.id, req.user_id, req.amount);
            
            addNotification({ type: 'success', title: 'Tasdiqlandi', message: "To'lov tasdiqlandi va balans to'ldirildi." });
            
            // Optimistic update
            setPendingRequests(prev => prev.filter(p => p.id !== req.id));
            
            // Reload stats properly (optional, but good for sync)
            loadData(); 
        } catch (e: any) {
            console.error("Approval error:", e);
            addNotification({ type: 'error', title: 'Xatolik', message: e.message || "Tasdiqlashda xatolik yuz berdi." });
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (req: PaymentRequestDB) => {
        // Debug log to check if click is registered
        console.log("Reject button clicked for ID:", req.id);
        
        // Temporarily remove window.confirm to rule out browser blocking issues
        // if (!window.confirm("Rad etishni tasdiqlaysizmi?")) return;
        
        setProcessingId(req.id);
        try {
            await rejectPaymentRequest(req.id);
            addNotification({ type: 'warning', title: 'Rad etildi', message: "To'lov rad etildi." });
            
            // Update UI immediately (Optimistic)
            setPendingRequests(prev => prev.filter(p => p.id !== req.id));
            
        } catch (e: any) {
            console.error("Rejection error:", e);
            // Show explicit error to user to help debugging
            alert("Rad etishda xatolik yuz berdi (Baza xatosi): " + (e.message || JSON.stringify(e)));
            addNotification({ type: 'error', title: 'Xatolik', message: e.message || "Xatolik yuz berdi." });
        } finally {
            setProcessingId(null);
        }
    };

    const handleManualTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        setManualLoading(true);
        try {
            const user = await getUserByEmail(manualEmail);
            if (!user) {
                throw new Error("Bunday emailga ega foydalanuvchi topilmadi.");
            }

            await adminAdjustUserBalance(user.id, Number(manualAmount), manualType, manualDescription);
            addNotification({ type: 'success', title: 'Bajarildi', message: 'Balans o\'zgartirildi.' });
            
            // Reset form
            setManualEmail('');
            setManualAmount('');
            setManualDescription('');
            setIsManualModalOpen(false);
            loadData();
        } catch (error: any) {
             addNotification({ type: 'error', title: 'Xatolik', message: error.message || "Xatolik yuz berdi." });
        } finally {
            setManualLoading(false);
        }
    }

    const handleGiveBonus = async () => {
        if (!window.confirm(`Barcha foydalanuvchilarga ${Number(bonusAmount).toLocaleString()} UZS bonus berishni tasdiqlaysizmi? Bu amalni ortga qaytarib bo'lmaydi.`)) return;
        
        setIsBonusLoading(true);
        try {
            const result = await giveGlobalBonus(Number(bonusAmount), `Bonus: ${Number(bonusAmount).toLocaleString()} UZS`);
            addNotification({ 
                type: 'success', 
                title: 'Bonus Tarqatildi', 
                message: `${result.successCount} ta foydalanuvchiga bonus berildi. ${result.skippedCount} ta foydalanuvchi avval olganligi uchun o'tkazib yuborildi.` 
            });
            loadData(); // Refresh stats
        } catch (e: any) {
            addNotification({ type: 'error', title: 'Xatolik', message: e.message || 'Bonus berishda xatolik.' });
        } finally {
            setIsBonusLoading(false);
        }
    };

    if (isLoading) return <LoadingSpinner />;

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">Moliya va To'lovlar</h1>
                <button 
                    onClick={() => setIsManualModalOpen(true)}
                    className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    <WalletIcon className="w-5 h-5" />
                    <span>Balansni Boshqarish</span>
                </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <StatCard title="Jami Tasdiqlangan Kirim" value={`${stats.income.toLocaleString()} UZS`} color="#34d399" />
                <StatCard title="Kutilayotgan Tushum" value={`${stats.pending.toLocaleString()} UZS`} color="#facc15" />
                <StatCard title="Premium Foydalanuvchilar" value={premiumUsers.length.toString()} color="#60a5fa" />
            </div>

            {/* BONUS CAMPAIGN CARD */}
            <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-500/30 rounded-lg p-6 mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Gift className="w-32 h-32 text-white" />
                </div>
                <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div>
                        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                            <Gift className="text-purple-400" />
                            <span>Bonus Kampaniyasi</span>
                        </h2>
                        <p className="text-gray-300 text-sm max-w-md">
                            Barcha ro'yxatdan o'tgan foydalanuvchilarga bir martalik bonus bering. Tizim avtomatik ravishda tekshiradi va faqat olmaganlarga tarqatadi.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 bg-black/30 p-2 rounded-lg border border-white/10">
                        <div className="relative">
                            <input 
                                type="number" 
                                value={bonusAmount}
                                onChange={(e) => setBonusAmount(e.target.value)}
                                className="bg-gray-800 text-white px-3 py-2 rounded-md w-32 focus:ring-2 focus:ring-purple-500 outline-none border border-gray-700"
                                placeholder="5000"
                            />
                            <span className="absolute right-2 top-2.5 text-xs text-gray-500 font-bold">UZS</span>
                        </div>
                        <button 
                            onClick={handleGiveBonus}
                            disabled={isBonusLoading || !bonusAmount}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isBonusLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Tarqatish'}
                        </button>
                    </div>
                </div>
            </div>

            {/* PENDING REQUESTS */}
            <div className="bg-gray-800/70 p-6 rounded-lg mb-8">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span>Kutayotgan To'lovlar</span>
                    {pendingRequests.length > 0 && <span className="bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-full">{pendingRequests.length}</span>}
                </h2>
                
                {pendingRequests.length === 0 ? (
                    <p className="text-gray-500">Hozircha yangi to'lov so'rovlari yo'q.</p>
                ) : (
                    <div className="space-y-4">
                        {pendingRequests.map(req => (
                            <div key={req.id} className="bg-gray-900 p-4 rounded-lg border-l-4 border-yellow-500">
                                <div className="flex flex-col md:flex-row gap-6 items-start">
                                    {/* Screenshot */}
                                    <div className="w-full md:w-40 flex-shrink-0">
                                        <img 
                                            src={req.screenshot_url} 
                                            alt="Chek" 
                                            className="w-full h-24 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                                            onClick={() => setSelectedImage(req.screenshot_url)}
                                        />
                                        <p className="text-center text-xs text-gray-500 mt-1">Kattalashtirish</p>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-grow">
                                        <h3 className="font-bold text-lg text-white">{req.profiles?.full_name || 'Foydalanuvchi'}</h3>
                                        <p className="text-gray-400 text-sm">{req.profiles?.email}</p>
                                        
                                        <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-500">To'lov summasi:</p>
                                                <p className="text-xl font-bold text-green-400">{req.amount.toLocaleString()} UZS</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Sana:</p>
                                                <p className="text-white">{new Date(req.created_at).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto mt-4 md:mt-0">
                                        <button 
                                            onClick={() => handleApprove(req)} 
                                            disabled={processingId === req.id}
                                            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-md font-semibold transition-colors flex items-center justify-center gap-2"
                                        >
                                            {processingId === req.id ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Tasdiqlash'}
                                        </button>
                                        <button 
                                            onClick={() => handleReject(req)} 
                                            disabled={processingId === req.id}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-md font-semibold transition-colors flex items-center justify-center gap-2"
                                        >
                                            {processingId === req.id ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Rad etish'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* PREMIUM USERS LIST */}
            <div className="bg-gray-800/70 rounded-lg">
                 <div className="p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                        <CrownIcon className="w-6 h-6 text-yellow-400" />
                        <span>Faol Hisoblar (Premium)</span>
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">Balansida mablag' bor foydalanuvchilar ro'yxati.</p>
                 </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-800">
                            <tr>
                                <th className="p-4 font-semibold">Foydalanuvchi</th>
                                <th className="p-4 font-semibold">Email</th>
                                <th className="p-4 font-semibold">Balans</th>
                                <th className="p-4 font-semibold">Rol</th>
                                <th className="p-4 font-semibold">Sana</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {premiumUsers.length === 0 && <tr><td colSpan={3} className="p-4 text-center text-gray-500">Foydalanuvchilar yo'q.</td></tr>}
                            {premiumUsers.map(user => (
                                <tr key={user.id} className="hover:bg-gray-800 transition-colors">
                                    <td className="p-4">
                                        <p className="font-semibold text-white">{user.full_name || 'Ismsiz'}</p>
                                        <p className="text-xs text-zinc-500">@{user.username || 'user'}</p>
                                    </td>
                                    <td className="p-4">
                                        <p className="text-sm text-gray-400">{user.email}</p>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-green-400 font-mono font-bold">{user.balance.toLocaleString()} UZS</span>
                                    </td>
                                    <td className="p-4">
                                        <span className="bg-gray-700 px-2 py-1 rounded text-xs uppercase">{user.role}</span>
                                    </td>
                                    <td className="p-4 text-xs text-zinc-500">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedImage && (
                <ImagePreviewModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
            )}

            {/* MANUAL TRANSACTION MODAL */}
            {isManualModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setIsManualModalOpen(false)}>
                    <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-white mb-4">Balansni Boshqarish</h2>
                        <form onSubmit={handleManualTransaction} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Foydalanuvchi Email</label>
                                <input 
                                    type="email" 
                                    required
                                    value={manualEmail}
                                    onChange={e => setManualEmail(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
                                    placeholder="user@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Summa (UZS)</label>
                                <input 
                                    type="number" 
                                    required
                                    value={manualAmount}
                                    onChange={e => setManualAmount(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
                                    placeholder="10000"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Amal turi</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 text-white cursor-pointer">
                                        <input type="radio" name="type" checked={manualType === 'add'} onChange={() => setManualType('add')} className="accent-green-500" />
                                        <span className="text-green-400">Pul qo'shish (+)</span>
                                    </label>
                                    <label className="flex items-center gap-2 text-white cursor-pointer">
                                        <input type="radio" name="type" checked={manualType === 'deduct'} onChange={() => setManualType('deduct')} className="accent-red-500" />
                                        <span className="text-red-400">Pul yechish (-)</span>
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Izoh</label>
                                <input 
                                    type="text" 
                                    value={manualDescription}
                                    onChange={e => setManualDescription(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
                                    placeholder="Sabab (ixtiyoriy)"
                                />
                            </div>
                            
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setIsManualModalOpen(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors">Bekor qilish</button>
                                <button type="submit" disabled={manualLoading} className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded transition-colors disabled:opacity-50">
                                    {manualLoading ? 'Bajarilmoqda...' : 'Tasdiqlash'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};