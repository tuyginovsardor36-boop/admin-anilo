
import React, { useState, useEffect } from 'react';
import { PlusIcon } from './components/icons/PlusIcon';
import { DeleteIcon } from './components/icons/DeleteIcon';
import { AddPromocodeModal } from './components/AddPromocodeModal';
import { getPromocodes, savePromocode, deletePromocode } from './services/dbService';
import { Promocode } from './types';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useNotification } from './hooks/useNotification';

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const colorClasses: Record<string, string> = {
        'active': 'bg-green-500/20 text-green-400',
        'inactive': 'bg-gray-500/20 text-gray-400',
        'expired': 'bg-red-500/20 text-red-400',
    };
    const label: Record<string, string> = {
        'active': 'Faol',
        'inactive': 'Nofaol',
        'expired': 'Muddati o\'tgan',
    }
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClasses[status] || 'bg-gray-500/20 text-gray-400'}`}>{label[status] || status}</span>;
}

export const PromocodePage: React.FC = () => {
    const [promocodes, setPromocodes] = useState<Promocode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { addNotification } = useNotification();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const data = await getPromocodes();
            setPromocodes(data);
        } catch (e) {
            console.error(e);
            addNotification({ type: 'error', title: 'Xatolik', message: 'Promokodlarni yuklab bo\'lmadi' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (data: any) => {
        try {
            const newPromo: Promocode = {
                code: data.code,
                type: data.type,
                value: Number(data.value),
                usage_limit: data.limit ? Number(data.limit) : null,
                expires_at: data.expiresAt || null,
                used_count: 0,
                status: 'active'
            };
            await savePromocode(newPromo);
            addNotification({ type: 'success', title: 'Saqlandi', message: 'Promokod muvaffaqiyatli yaratildi' });
            loadData();
            setIsModalOpen(false);
        } catch (e: any) {
             console.error("Promocode save error:", e);
             let message = 'Saqlashda xatolik yuz berdi';
             
             // Handle duplicate key error (Postgres code 23505)
             if (e.code === '23505' || e.message?.includes('unique constraint')) {
                 message = 'Bunday kod allaqachon mavjud. Boshqa kod yozing.';
             } else if (e.code === '42501' || e.message?.includes('row-level security')) {
                 message = 'Sizda promokod yaratish huquqi yo\'q (faqat admin/owner).';
             } else if (e.message) {
                 message = `Xatolik: ${e.message}`;
             }

             addNotification({ type: 'error', title: 'Xatolik', message: message });
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm("O'chirmoqchimisiz?")) {
            try {
                await deletePromocode(id);
                setPromocodes(prev => prev.filter(p => p.id !== id));
                addNotification({ type: 'success', title: 'O\'chirildi', message: 'Promokod o\'chirildi' });
            } catch (e) {
                addNotification({ type: 'error', title: 'Xatolik', message: 'O\'chirishda xatolik' });
            }
        }
    }
    
    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">Promokodlarni Boshqarish</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                    <PlusIcon className="w-5 h-5" />
                    <span>Yangi Promokod Yaratish</span>
                </button>
            </div>

            {isLoading ? <LoadingSpinner /> : (
                <div className="bg-gray-800/70 rounded-lg overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-800">
                            <tr>
                                <th className="p-4 font-semibold">Kod</th>
                                <th className="p-4 font-semibold">Chegirma</th>
                                <th className="p-4 font-semibold">Foydalanilgan / Limit</th>
                                <th className="p-4 font-semibold">Amal qilish muddati</th>
                                <th className="p-4 font-semibold">Holati</th>
                                <th className="p-4 font-semibold">Amallar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {promocodes.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-500">Promokodlar yo'q.</td></tr>}
                            {promocodes.map(promo => (
                                <tr key={promo.id} className="hover:bg-gray-800 transition-colors">
                                    <td className="p-4 font-mono font-semibold text-orange-400">{promo.code}</td>
                                    <td className="p-4 text-white">{promo.type === 'percentage' ? `${promo.value}%` : `${promo.value.toLocaleString()} UZS`}</td>
                                    <td className="p-4 text-gray-400">{promo.used_count} / {promo.usage_limit || '∞'}</td>
                                    <td className="p-4 text-gray-400">{promo.expires_at ? new Date(promo.expires_at).toLocaleDateString() : 'Cheksiz'}</td>
                                    <td className="p-4"><StatusBadge status={promo.status} /></td>
                                    <td className="p-4">
                                        <div className="flex gap-2">
                                            <button onClick={() => promo.id && handleDelete(promo.id)} className="p-2 text-gray-400 hover:text-red-400 transition-colors"><DeleteIcon className="w-5 h-5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && (
                <AddPromocodeModal
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
};
