
import React, { useState, useEffect } from 'react';
import { 
    ShoppingBag, Plus, Trash2, X, Star, Truck, Info, Settings, Save, List
} from 'lucide-react';
import { 
    getAdminShopProducts, createShopProduct, uploadFile 
} from './services/dbService';
import { ShopProduct } from './types';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useNotification } from './hooks/useNotification';

export const ShopAdminPage: React.FC = () => {
    const [products, setProducts] = useState<ShopProduct[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('');
    const [discount, setDiscount] = useState('0');
    const [rating, setRating] = useState('5.0');
    const [delivery, setDelivery] = useState('2-5 kun');
    const [desc, setDesc] = useState('');
    const [cat, setCat] = useState<ShopProduct['category']>('other');
    const [image, setImage] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Dynamic Specifications (Ubuy logic)
    const [specs, setSpecs] = useState<{ key: string, value: string }[]>([
        { key: 'Material', value: '' },
        { key: 'O\'lcham', value: '' }
    ]);

    const { addNotification } = useNotification();

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const p = await getAdminShopProducts();
            setProducts(p);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleCreateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!image) return addNotification({ type: 'warning', title: 'Diqqat', message: 'Rasm yuklang.' });
        setIsSaving(true);
        try {
            const imageUrl = await uploadFile(image, 'posters');
            const specsObj: Record<string, string> = {};
            specs.forEach(s => { if (s.key && s.value) specsObj[s.key] = s.value; });

            await createShopProduct({
                title, 
                price: Number(price), 
                discount_percent: Number(discount),
                rating: Number(rating),
                delivery_time: delivery,
                description: desc,
                category: cat, 
                image_url: imageUrl, 
                specifications: specsObj,
                stock_count: 100,
                is_active: true
            });

            addNotification({ type: 'success', title: 'Tayyor', message: "Mahsulot yaratildi." });
            setIsModalOpen(false);
            loadData();
            resetForm();
        } catch (e) { console.error(e); }
        finally { setIsSaving(false); }
    };

    const resetForm = () => {
        setTitle(''); setPrice(''); setDiscount('0'); setRating('5.0'); setDesc(''); setSpecs([{key:'Material', value:''}, {key:'O\'lcham', value:''}]);
    };

    return (
        <div className="animate-fade-in p-6 max-w-7xl mx-auto pb-32">
            <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-pink-600 rounded-2xl flex items-center justify-center text-white"><ShoppingBag size={24}/></div>
                    <h1 className="text-3xl font-black uppercase text-white">Do'kon Boshqaruvi</h1>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="px-8 py-3 bg-pink-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-xl">Yangi Mahsulot</button>
            </div>

            {loading ? <LoadingSpinner /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map(p => (
                        <div key={p.id} className="bg-zinc-900 border border-white/5 rounded-3xl p-5 flex items-center gap-4">
                            <img src={p.image_url} className="w-20 h-20 rounded-2xl object-contain bg-white" alt="" />
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-white text-sm truncate uppercase">{p.title}</p>
                                <p className="text-pink-500 font-black">{p.price.toLocaleString()} UZS</p>
                                {p.discount_percent ? <span className="text-[10px] text-red-500 font-bold">-{p.discount_percent}% Discount</span> : null}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => !isSaving && setIsModalOpen(false)}></div>
                    <form onSubmit={handleCreateProduct} className="relative bg-[#0a0a0a] border border-white/10 w-full max-w-4xl rounded-[3rem] p-10 overflow-y-auto max-h-[90vh] animate-slide-in-up">
                        <h2 className="text-3xl font-black uppercase text-white mb-8">Yangi mahsulot qo'shish</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4">
                                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nomi" className="w-full bg-zinc-900 border border-white/10 rounded-xl p-4 text-white font-bold" required />
                                <div className="grid grid-cols-2 gap-4">
                                    <input value={price} onChange={e => setPrice(e.target.value)} type="number" placeholder="Narxi" className="w-full bg-zinc-900 border border-white/10 rounded-xl p-4 text-white" required />
                                    <input value={discount} onChange={e => setDiscount(e.target.value)} type="number" placeholder="Chegirma %" className="w-full bg-zinc-900 border border-white/10 rounded-xl p-4 text-red-500 font-bold" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <input value={rating} onChange={e => setRating(e.target.value)} placeholder="Reyting (ex: 4.8)" className="w-full bg-zinc-900 border border-white/10 rounded-xl p-4 text-yellow-500 font-bold" />
                                    <input value={delivery} onChange={e => setDelivery(e.target.value)} placeholder="Yetkazish (ex: 2-3 kun)" className="w-full bg-zinc-900 border border-white/10 rounded-xl p-4 text-blue-400 font-bold" />
                                </div>
                                <select value={cat} onChange={e => setCat(e.target.value as any)} className="w-full bg-zinc-900 border border-white/10 rounded-xl p-4 text-white">
                                    <option value="clothing">Kiyim</option>
                                    <option value="figure">Figura</option>
                                    <option value="accessory">Aksessuar</option>
                                    <option value="other">Boshqa</option>
                                </select>
                                <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Tavsif" className="w-full bg-zinc-900 border border-white/10 rounded-xl p-4 text-white h-32" required />
                                <input type="file" onChange={e => setImage(e.target.files?.[0] || null)} className="w-full text-zinc-500 text-xs" accept="image/*" />
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-black text-pink-500 uppercase text-xs tracking-widest flex items-center gap-2"> <List size={14}/> Xususiyatlar (Maks 20 ta)</h4>
                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {specs.map((s, i) => (
                                        <div key={i} className="flex gap-2">
                                            <input value={s.key} onChange={e => {const n=[...specs]; n[i].key=e.target.value; setSpecs(n)}} placeholder="Nom (ex: Material)" className="flex-1 bg-zinc-900 border border-white/5 rounded-lg p-2 text-xs text-white font-bold" />
                                            <input value={s.value} onChange={e => {const n=[...specs]; n[i].value=e.target.value; setSpecs(n)}} placeholder="Qiymat" className="flex-1 bg-zinc-900 border border-white/5 rounded-lg p-2 text-xs text-white font-bold" />
                                            <button type="button" onClick={() => setSpecs(specs.filter((_, idx) => idx !== i))} className="text-red-500 px-2"><Trash2 size={14}/></button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => setSpecs([...specs, {key:'', value:''}])} className="w-full py-2 border border-dashed border-zinc-700 rounded-lg text-[10px] text-zinc-500 uppercase font-black hover:text-white transition-all">+ Qo'shish</button>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-10">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-zinc-800 text-white rounded-2xl font-black uppercase text-xs tracking-widest">Bekor qilish</button>
                            <button type="submit" disabled={isSaving} className="flex-1 py-5 bg-pink-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 disabled:opacity-50">
                                {isSaving ? 'Yuklanmoqda...' : 'Mahsulotni qo\'shish'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};
