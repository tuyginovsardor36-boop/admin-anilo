
import React, { useState, useEffect } from 'react';
import { 
    ShoppingBag, Wallet, CreditCard, X, ChevronRight, 
    MapPin, Phone, Search, Heart, Zap, ShieldCheck, 
    Filter, Tag, Star, Truck, Info, ArrowUpDown, Check
} from 'lucide-react';
import { getShopProducts, getShopWallet, createShopPaymentRequest, placeShopOrder, getMyShopOrders, uploadFile } from './services/dbService';
import { ShopProduct, ShopWallet, ShopOrder } from './types';
import { supabase } from './services/supabaseClient';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useNotification } from './hooks/useNotification';
import { PaymentDetailsCard } from './components/PaymentDetailsCard';

export const ShopPage: React.FC = () => {
    const [products, setProducts] = useState<ShopProduct[]>([]);
    const [wallet, setWallet] = useState<ShopWallet | null>(null);
    const [orders, setOrders] = useState<ShopOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'browse' | 'orders' | 'topup'>('browse');
    
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'popular'>('newest');

    const [viewProduct, setViewProduct] = useState<ShopProduct | null>(null);
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [isBuying, setIsBuying] = useState(false);

    const [topupAmount, setTopupAmount] = useState('');
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [isTopupLoading, setIsTopupLoading] = useState(false);

    const { addNotification } = useNotification();

    useEffect(() => { loadData(); }, [selectedCategory, sortBy]);

    const loadData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const p = await getShopProducts(selectedCategory, sortBy, searchQuery);
            setProducts(p);
            
            if (user) {
                const [w, o] = await Promise.all([
                    getShopWallet(user.id),
                    getMyShopOrders(user.id)
                ]);
                setWallet(w);
                setOrders(o);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadData();
    };

    const handleBuy = async () => {
        if (!viewProduct || !wallet) return;
        const discount = viewProduct.discount_percent ? (viewProduct.price * viewProduct.discount_percent / 100) : 0;
        const finalPrice = viewProduct.price - discount;

        if (wallet.balance < finalPrice) {
            addNotification({ type: 'error', title: 'Xatolik', message: "Mablag' yetarli emas." });
            return;
        }
        if (!address || !phone) {
            addNotification({ type: 'warning', title: 'Diqqat', message: "Ma'lumotlarni to'ldiring." });
            return;
        }

        setIsBuying(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            await placeShopOrder(user!.id, viewProduct.id, finalPrice, address, phone);
            addNotification({ type: 'success', title: 'Tayyor', message: "Buyurtma qabul qilindi!" });
            setViewProduct(null);
            loadData();
        } catch (e: any) {
            addNotification({ type: 'error', title: 'Xatolik', message: e.message });
        } finally { setIsBuying(false); }
    };

    const handleTopup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topupAmount || !screenshot) {
            addNotification({ type: 'warning', title: 'Diqqat', message: "Fayl va summani kiriting." });
            return;
        }
        setIsTopupLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Kirish kerak");
            const url = await uploadFile(screenshot, 'posters');
            await createShopPaymentRequest(user.id, Number(topupAmount), url);
            addNotification({ type: 'success', title: 'Yuborildi', message: 'Chek tekshirilmoqda.' });
            setTopupAmount(''); setScreenshot(null); setActiveTab('browse');
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Xatolik', message: err.message });
        } finally { setIsTopupLoading(false); }
    };

    return (
        <div className="min-h-screen bg-[#050505] pb-24 animate-fade-in font-sans text-gray-200">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/5 px-4 py-3">
                <div className="container mx-auto flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => {setSelectedCategory('all'); setActiveTab('browse')}}>
                            <div className="w-10 h-10 bg-pink-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                                <ShoppingBag size={22} fill="currentColor" />
                            </div>
                            <h1 className="text-xl font-black tracking-tighter text-white uppercase leading-none">
                                ANILO<br/><span className="text-pink-500 text-[9px] tracking-[0.2em]">STORE</span>
                            </h1>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <div onClick={() => setActiveTab('topup')} className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-full cursor-pointer border border-white/10">
                                <Wallet size={14} className="text-pink-500"/>
                                <span className="text-[11px] font-black text-white">{(wallet?.balance || 0).toLocaleString()} UZS</span>
                            </div>
                            <button onClick={() => setActiveTab('orders')} className="p-2 bg-white/5 rounded-full border border-white/10 relative">
                                <CreditCard size={18} className="text-gray-300"/>
                                {orders.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-black">{orders.length}</span>}
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSearch} className="relative w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Anime mahsulotlarini qidirish..."
                            className="w-full bg-[#151515] border border-white/5 py-3 pl-12 pr-4 rounded-xl text-sm focus:border-pink-500 outline-none transition-all text-white placeholder-zinc-600"
                        />
                    </form>
                </div>
            </div>

            <div className="container mx-auto px-4 mt-6">
                {activeTab === 'browse' && (
                    <div className="space-y-6">
                        <div className="flex flex-col gap-4">
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {[
                                    { id: 'all', label: 'Barchasi' },
                                    { id: 'figure', label: 'Figuralar' },
                                    { id: 'clothing', label: 'Kiyimlar' },
                                    { id: 'accessory', label: 'Aksessuar' },
                                ].map(cat => (
                                    <button 
                                        key={cat.id} 
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                                            selectedCategory === cat.id 
                                            ? 'bg-white text-black border-transparent shadow-lg' 
                                            : 'bg-zinc-900 text-gray-500 border-zinc-800 hover:text-white'
                                        }`}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {loading ? <div className="py-20 flex justify-center"><LoadingSpinner /></div> : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
                                {products.map(product => {
                                    const hasDiscount = product.discount_percent && product.discount_percent > 0;
                                    const finalPrice = hasDiscount ? product.price * (1 - product.discount_percent! / 100) : product.price;

                                    return (
                                        <div key={product.id} onClick={() => setViewProduct(product)} className="group bg-[#111] rounded-2xl md:rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl border border-white/5 transition-all duration-500 cursor-pointer flex flex-col">
                                            <div className="relative aspect-square overflow-hidden bg-white/5 flex items-center justify-center p-4">
                                                <img src={product.image_url} className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110" alt="" />
                                                <div className="absolute top-2 left-2 flex flex-col gap-1">
                                                    {hasDiscount && <span className="bg-red-600 text-white text-[8px] font-black px-2 py-1 rounded-md">-{product.discount_percent}%</span>}
                                                    {product.sales_count && product.sales_count > 20 && <span className="bg-yellow-400 text-black text-[7px] font-black px-2 py-1 rounded-md uppercase">TOP</span>}
                                                </div>
                                            </div>
                                            <div className="p-3 md:p-4 flex flex-col flex-1">
                                                <div className="flex items-center gap-1 mb-1">
                                                    <Star size={10} className="text-yellow-500 fill-yellow-500" />
                                                    <span className="text-[9px] font-bold text-gray-500">{product.rating || '5.0'}</span>
                                                </div>
                                                <h4 className="text-[11px] md:text-sm font-black text-gray-100 line-clamp-2 h-8 md:h-10 mb-2 uppercase leading-tight">{product.title}</h4>
                                                <div className="mt-auto pt-2 border-t border-white/5 flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <span className="text-[12px] md:text-lg font-black text-pink-500">{finalPrice.toLocaleString()} UZS</span>
                                                    </div>
                                                    <Zap size={14} className="text-pink-500 fill-current" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'topup' && (
                    <div className="max-w-xl mx-auto animate-slide-in-up">
                        <div className="bg-zinc-900 p-6 md:p-10 rounded-[2.5rem] shadow-2xl border border-white/5">
                            <h2 className="text-2xl font-black text-white mb-6 text-center uppercase tracking-tighter">Hisobni to'ldirish</h2>
                            <div className="mb-8 scale-95 md:scale-105"><PaymentDetailsCard /></div>
                            <form onSubmit={handleTopup} className="space-y-5">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase ml-4 tracking-widest">To'lov summasi</label>
                                    <input type="number" value={topupAmount} onChange={e => setTopupAmount(e.target.value)} className="w-full bg-black border border-white/10 rounded-2xl p-4 text-lg font-black outline-none focus:border-pink-500 transition-all text-white" placeholder="20,000" required />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase ml-4 tracking-widest">Chek rasm (Screenshot)</label>
                                    <input type="file" onChange={e => setScreenshot(e.target.files?.[0] || null)} className="w-full bg-black border border-white/10 rounded-2xl p-4 text-xs text-zinc-500" accept="image/*" required />
                                </div>
                                <button type="submit" disabled={isTopupLoading} className="w-full bg-pink-600 text-white py-4 rounded-2xl font-black uppercase text-xs hover:bg-pink-500 transition-all disabled:opacity-50">
                                    {isTopupLoading ? 'Jo\'natilmoqda...' : 'Tasdiqlash uchun yuborish'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
                
                {activeTab === 'orders' && (
                    <div className="max-w-3xl mx-auto animate-slide-in-up space-y-4">
                        <h2 className="text-2xl font-black text-white uppercase mb-6 pl-4 border-l-4 border-pink-500">Mening Buyurtmalarim</h2>
                        {orders.length === 0 ? (
                            <div className="text-center py-20 bg-zinc-900 rounded-3xl border border-dashed border-zinc-800">
                                <ShoppingBag className="mx-auto text-zinc-700 w-16 h-16 mb-4"/>
                                <p className="text-zinc-500 font-bold uppercase tracking-widest">Buyurtmalar yo'q</p>
                            </div>
                        ) : (
                            orders.map(order => (
                                <div key={order.id} className="bg-zinc-900 border border-white/5 p-5 rounded-2xl flex gap-4">
                                    <img src={order.products?.image_url} className="w-20 h-24 object-contain bg-white rounded-xl" alt=""/>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-white uppercase text-sm mb-1">{order.products?.title}</h4>
                                            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${order.status === 'delivered' ? 'bg-green-500/20 text-green-400' : order.status === 'shipped' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                {order.status === 'pending' ? 'Kutilmoqda' : order.status === 'shipped' ? 'Yuborildi' : 'Yetkazildi'}
                                            </span>
                                        </div>
                                        <p className="text-pink-500 font-black text-sm mb-2">{order.amount.toLocaleString()} UZS</p>
                                        <p className="text-zinc-500 text-xs flex items-center gap-1"> <MapPin size={12}/> {order.address}</p>
                                        <p className="text-zinc-500 text-[10px] mt-2">{new Date(order.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* DETAIL MODAL - MOBILE RESPONSIVE */}
            {viewProduct && (
                <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center sm:p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setViewProduct(null)}></div>
                    <div className="relative bg-[#0c0c0c] w-full max-w-4xl md:rounded-[3rem] rounded-t-[2.5rem] overflow-hidden shadow-2xl animate-slide-in-up flex flex-col md:flex-row max-h-[90vh] md:max-h-[85vh] border border-white/10">
                        <div className="w-full md:w-1/2 bg-zinc-900 relative p-6 flex items-center justify-center">
                            <img src={viewProduct.image_url} className="w-full max-h-[250px] md:max-h-full object-contain" alt="" />
                            <button onClick={() => setViewProduct(null)} className="absolute top-4 left-4 p-2 bg-black/40 rounded-full md:hidden text-white"><X size={20}/></button>
                        </div>
                        <div className="flex-1 flex flex-col overflow-y-auto p-6 md:p-10 custom-scrollbar bg-[#0a0a0a]">
                            <div className="mb-6">
                                <p className="text-[9px] font-black text-pink-500 uppercase tracking-widest mb-1">{viewProduct.category}</p>
                                <h3 className="text-xl md:text-2xl font-black text-white uppercase mb-3 leading-tight">{viewProduct.title}</h3>
                                <div className="text-2xl font-black text-pink-600">{(viewProduct.discount_percent ? viewProduct.price * (1 - viewProduct.discount_percent / 100) : viewProduct.price).toLocaleString()} UZS</div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mb-6">
                                <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center gap-2">
                                    <Truck className="text-blue-500" size={16}/><div className="text-[9px] font-bold text-gray-400 uppercase">{viewProduct.delivery_time || '2-4 kun'}</div>
                                </div>
                                <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center gap-2">
                                    <ShieldCheck className="text-green-500" size={16}/><div className="text-[9px] font-bold text-gray-400 uppercase">Original</div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <p className="text-gray-400 text-xs md:text-sm leading-relaxed">{viewProduct.description}</p>
                                
                                {/* Specifications (If any) */}
                                {viewProduct.specifications && Object.keys(viewProduct.specifications).length > 0 && (
                                    <div className="bg-white/5 p-4 rounded-xl space-y-2">
                                        {Object.entries(viewProduct.specifications).map(([key, val]) => (
                                            <div key={key} className="flex justify-between text-xs border-b border-white/5 pb-1 last:border-0">
                                                <span className="text-gray-500 font-bold">{key}</span>
                                                <span className="text-white">{val}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="space-y-3 pt-4 border-t border-white/5">
                                    <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Yetkazish manzili..." className="w-full bg-black rounded-xl p-3 text-sm outline-none border border-white/10 focus:border-pink-500 text-white placeholder-zinc-600"/>
                                    <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+998" type="tel" className="w-full bg-black rounded-xl p-3 text-sm outline-none border border-white/10 focus:border-pink-500 text-white placeholder-zinc-600"/>
                                </div>
                            </div>
                            <div className="mt-8">
                                <button onClick={handleBuy} disabled={isBuying} className="w-full bg-pink-600 hover:bg-pink-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl active:scale-95 disabled:opacity-50">
                                    {isBuying ? 'Kutilmoqda...' : 'Sotib Olish'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
