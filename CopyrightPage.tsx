
import React, { useState, useEffect } from 'react';
import { BackArrowIcon } from './components/icons/BackArrowIcon';
import { 
    ShieldCheck, FileText, UserCheck, BookOpen, 
    Lock, Copyright, MapPin, Mail, CheckCircle2,
    Scale, AlertCircle, Award, Layout, ChevronRight,
    Globe, ShieldAlert, Zap, Cpu, History, CreditCard
} from 'lucide-react';

interface CopyrightPageProps {
    onBack: () => void;
}

type DocSection = 'founders' | 'offer' | 'privacy' | 'rules' | 'copyright';

export const CopyrightPage: React.FC<CopyrightPageProps> = ({ onBack }) => {
    const [activeSection, setActiveSection] = useState<DocSection>('founders');

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [activeSection]);

    const SidebarLink = ({ id, icon, label }: { id: DocSection, icon: React.ReactNode, label: string }) => (
        <button 
            onClick={() => setActiveSection(id)}
            className={`w-full flex items-center justify-between p-5 rounded-[1.5rem] transition-all duration-500 group ${
                activeSection === id 
                ? 'bg-orange-600 text-white shadow-2xl shadow-orange-900/40 translate-x-2' 
                : 'bg-zinc-900/40 text-zinc-500 hover:bg-zinc-800 hover:text-white border border-white/5'
            }`}
        >
            <div className="flex items-center gap-4">
                <span className={activeSection === id ? 'text-white' : 'text-orange-500 group-hover:scale-110 transition-transform'}>{icon}</span>
                <span className="text-[11px] font-black uppercase tracking-[0.15em]">{label}</span>
            </div>
            <ChevronRight size={14} className={`transition-transform duration-500 ${activeSection === id ? 'rotate-90 opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
        </button>
    );

    const OfficialSeal = () => (
        <div className="mt-20 pt-10 border-t border-zinc-800/50 flex flex-col items-center select-none">
            <div className="relative w-40 h-40">
                <div className="absolute inset-0 border-[6px] border-blue-900/30 rounded-full animate-pulse"></div>
                <div className="absolute inset-2 border-2 border-blue-900 rounded-full flex items-center justify-center bg-blue-900/5 backdrop-blur-sm">
                    <div className="text-blue-900 text-[7px] font-black absolute top-4 left-1/2 -translate-x-1/2 tracking-[0.2em] text-center leading-none w-full">
                        O'ZBEKISTON RESPUBLIKASI
                    </div>
                    <div className="text-blue-950 font-black text-xl text-center rotate-[-12deg] leading-none drop-shadow-sm">
                        ANILO.UZ<br/>
                        <span className="text-[10px] font-bold tracking-widest">LOYIHASI</span>
                    </div>
                    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-blue-900 text-[7px] font-black uppercase tracking-[0.3em] whitespace-nowrap bg-white px-2 py-0.5 rounded shadow-sm">
                        TASDIQLANGAN
                    </div>
                </div>
            </div>
            <div className="mt-6 text-center">
                <p className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.5em]">CERTIFIED DIGITAL DOCUMENT</p>
                <p className="text-zinc-700 text-[8px] mt-1 font-mono">HASH: 7a2b9c1d8e4f5g6h0j1k2l3m4n5o6p</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050505] text-white animate-fade-in font-sans selection:bg-orange-600 selection:text-white">
            
            {/* STICKY HEADER */}
            <div className="sticky top-0 z-[100] bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 px-6 md:px-12 py-5 flex items-center justify-between">
                <button 
                    onClick={onBack}
                    className="flex items-center gap-3 text-zinc-400 hover:text-white transition-all font-black uppercase text-[10px] tracking-widest group"
                >
                    <div className="p-2.5 bg-zinc-900 rounded-2xl group-hover:bg-orange-600 group-hover:text-white transition-all shadow-lg">
                        <BackArrowIcon className="w-4 h-4" />
                    </div>
                    <span className="hidden sm:inline">Bosh sahifa</span>
                </button>
                <div className="flex items-center gap-3">
                    <ShieldCheck className="text-orange-500" size={20} />
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] border-l border-zinc-800 pl-4">Legal Portal v2.0</span>
                </div>
            </div>

            <div className="container mx-auto px-4 md:px-8 py-12 lg:py-20">
                <div className="flex flex-col lg:flex-row gap-16">
                    
                    {/* SIDEBAR NAVIGATION */}
                    <aside className="w-full lg:w-85 flex-shrink-0">
                        <div className="sticky top-32 space-y-3">
                            <div className="mb-10 px-4">
                                <h1 className="text-4xl font-black uppercase tracking-tighter mb-3 bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">Huquqiy<br/>Markaz</h1>
                                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest leading-relaxed">Platformadan foydalanishning barcha huquqiy asoslari.</p>
                            </div>
                            <SidebarLink id="founders" icon={<UserCheck size={20}/>} label="Loyihaga mas'ullar" />
                            <SidebarLink id="offer" icon={<FileText size={20}/>} label="Ommaviy Oferta" />
                            <SidebarLink id="privacy" icon={<Lock size={20}/>} label="Maxfiylik Siyosati" />
                            <SidebarLink id="rules" icon={<Scale size={20}/>} label="Foydalanish Qoidalari" />
                            <SidebarLink id="copyright" icon={<Copyright size={20}/>} label="Mualliflik Huquqi" />
                            
                            <div className="mt-12 p-6 bg-orange-600/5 border border-orange-500/10 rounded-[2rem] hidden lg:block">
                                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2">Tezkor aloqa</p>
                                <p className="text-xs text-zinc-400 leading-relaxed mb-4">Huquqiy masalalar bo'yicha admin bilan bog'laning.</p>
                                <a href="https://t.me/anilo_ega" target="_blank" className="text-[10px] font-black text-white bg-orange-600 px-4 py-2 rounded-xl inline-block hover:bg-orange-500 transition-colors uppercase tracking-widest">Telegram Support</a>
                            </div>
                        </div>
                    </aside>

                    {/* MAIN CONTENT AREA */}
                    <main className="flex-1 bg-zinc-900/20 border border-white/5 rounded-[3.5rem] p-8 md:p-14 lg:p-20 shadow-3xl relative overflow-hidden">
                        
                        {/* Interactive Background Elements */}
                        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-orange-600/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-blue-600/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

                        <div className="relative z-10 animate-fade-in">
                            
                            {/* --- 1. LOYIHA ASOSCHILARI --- */}
                            {activeSection === 'founders' && (
                                <div className="space-y-16">
                                    <header className="border-l-4 border-orange-600 pl-8 mb-16">
                                        <h2 className="text-5xl font-black uppercase tracking-tighter mb-4">Loyiha Egalari</h2>
                                        <p className="text-zinc-400 text-base leading-relaxed max-w-2xl font-medium">"Anilo.uz" — O'zbekistonda anime industriyasini professional darajaga ko'tarishni maqsad qilgan mustaqil media loyiha.</p>
                                    </header>

                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                                        {/* Founder 1 */}
                                        <div className="group bg-black/40 border border-white/10 p-10 rounded-[3rem] hover:border-orange-500/40 transition-all duration-700 hover:shadow-2xl hover:shadow-orange-900/10">
                                            <div className="w-24 h-24 bg-orange-600/10 rounded-[2rem] flex items-center justify-center mb-8 text-orange-500 border border-orange-500/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                                                <Award size={48} />
                                            </div>
                                            <h3 className="text-3xl font-black text-white mb-2 tracking-tight">Firdavs Abdurazzoqov</h3>
                                            <p className="text-orange-500 text-[11px] font-black uppercase tracking-[0.3em] mb-8 bg-orange-500/10 w-fit px-3 py-1 rounded-full border border-orange-500/20">Owner & Chief Executive (CEO)</p>
                                            <div className="space-y-5 text-sm text-zinc-400 font-medium">
                                                <div className="flex items-center gap-4 bg-zinc-800/30 p-3 rounded-2xl"><MapPin size={18} className="text-zinc-600" /> <span>Navoiy viloyati, O'zbekiston</span></div>
                                                <div className="flex items-center gap-4 bg-zinc-800/30 p-3 rounded-2xl"><Globe size={18} className="text-zinc-600" /> <span>Strategik rivojlanish, hamkorlik va moliyalashtirish bo'yicha bosh mas'ul.</span></div>
                                            </div>
                                        </div>

                                        {/* Founder 2 */}
                                        <div className="group bg-black/40 border border-white/10 p-10 rounded-[3rem] hover:border-blue-500/40 transition-all duration-700 hover:shadow-2xl hover:shadow-blue-900/10">
                                            <div className="w-24 h-24 bg-blue-600/10 rounded-[2rem] flex items-center justify-center mb-8 text-blue-500 border border-blue-500/20 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500">
                                                <Cpu size={48} />
                                            </div>
                                            <h3 className="text-3xl font-black text-white mb-2 tracking-tight">Sardor Tuyginov</h3>
                                            <p className="text-blue-500 text-[11px] font-black uppercase tracking-[0.3em] mb-8 bg-blue-500/10 w-fit px-3 py-1 rounded-full border border-blue-500/20">Creator & Chief Tech (CTO)</p>
                                            <div className="space-y-5 text-sm text-zinc-400 font-medium">
                                                <div className="flex items-center gap-4 bg-zinc-800/30 p-3 rounded-2xl"><MapPin size={18} className="text-zinc-600" /> <span>Samarqand viloyati, O'zbekiston</span></div>
                                                <div className="flex items-center gap-4 bg-zinc-800/30 p-3 rounded-2xl"><Layout size={18} className="text-zinc-600" /> <span>Platforma arxitekturasi, UI/UX dizayn va dasturiy ta'minot bo'yicha bosh mas'ul.</span></div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-zinc-900/50 p-10 rounded-[3rem] border border-white/5">
                                        <h4 className="text-lg font-black uppercase text-white mb-6 flex items-center gap-3"> <History size={20} className="text-orange-500"/> Loyiha Tarixi</h4>
                                        <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                                            "Anilo.uz" loyihasiga 2023-yilda tamal toshi qo'yilgan bo'lib, jamoa O'zbekistondagi anime ixlosmandlari uchun yagona, qulay va professional fandub ekotizimini yaratish yo'lida faoliyat yuritadi. Hozirgi kunda platforma O'zbekistondagi eng yirik anime kataloglaridan biriga ega.
                                        </p>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                            <div className="p-4 bg-black/40 rounded-2xl border border-white/5 text-center"> <p className="text-2xl font-black text-white">50k+</p> <p className="text-[8px] text-zinc-500 uppercase font-black">Users</p> </div>
                                            <div className="p-4 bg-black/40 rounded-2xl border border-white/5 text-center"> <p className="text-2xl font-black text-white">1k+</p> <p className="text-[8px] text-zinc-500 uppercase font-black">Anime</p> </div>
                                            <div className="p-4 bg-black/40 rounded-2xl border border-white/5 text-center"> <p className="text-2xl font-black text-white">100+</p> <p className="text-[8px] text-zinc-500 uppercase font-black">Daily Uploads</p> </div>
                                            <div className="p-4 bg-black/40 rounded-2xl border border-white/5 text-center"> <p className="text-2xl font-black text-white">24/7</p> <p className="text-[8px] text-zinc-500 uppercase font-black">Uptime</p> </div>
                                        </div>
                                    </div>

                                    <OfficialSeal />
                                </div>
                            )}

                            {/* --- 2. OMMAVIY OFFERTA (BATAFSIL) --- */}
                            {activeSection === 'offer' && (
                                <div className="space-y-12">
                                    <header className="mb-12">
                                        <h2 className="text-4xl font-black uppercase tracking-tight mb-6 flex items-center gap-4">
                                            <FileText className="text-orange-500" size={36} /> Ommaviy Oferta
                                        </h2>
                                        <div className="p-6 bg-orange-600/5 border border-orange-500/20 rounded-2xl">
                                            <p className="text-sm text-zinc-300 font-medium leading-relaxed italic">
                                                Ushbu Ommaviy Oferta "Anilo.uz" platformasi ma'muriyati va jismoniy shaxs (keyingi o'rinlarda - Foydalanuvchi) o'rtasidagi masofaviy xizmat ko'rsatish shartnomasi hisoblanadi.
                                            </p>
                                        </div>
                                    </header>

                                    <div className="space-y-10 text-zinc-300 text-sm leading-[1.8] font-medium">
                                        <section className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5">
                                            <h4 className="text-white font-black uppercase tracking-widest text-xs mb-6 pb-2 border-b border-white/10">1. Shartnoma predmeti</h4>
                                            <p className="mb-4">1.1. Ma'muriyat foydalanuvchiga platformadagi anime kontentlarini onlayn ko'rish, fan-dublyaj materiallaridan foydalanish va interaktiv o'yinlarda (ATC, ARK) ishtirok etish imkoniyatini beradi.</p>
                                            <p>1.2. Foydalanuvchi platformada ro'yxatdan o'tgan paytdan boshlab ushbu oferta shartlarini so'zsiz qabul qilgan hisoblanadi.</p>
                                        </section>

                                        <section className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5">
                                            <h4 className="text-white font-black uppercase tracking-widest text-xs mb-6 pb-2 border-b border-white/10">2. Pullik xizmatlar va Obunalar</h4>
                                            <p className="mb-4">2.1. Premium obuna - bu foydalanuvchiga reklamalarsiz ko'rish va eksklyuziv kontentlarga kirish huquqini beruvchi raqamli xizmatdir.</p>
                                            <p className="mb-4">2.2. To'lovlar Click, Payme yoki boshqa to'lov operatorlari orqali amalga oshiriladi. To'lov tasdiqlangach, obuna avtomatik yoki 12 soat ichida faollashadi.</p>
                                            <p>2.3. To'langan mablag'lar qaytarilmaydi (Return Policy: No Refund), chunki xizmat raqamli shaklda va sotib olingan zahoti taqdim etiladi.</p>
                                        </section>

                                        <section className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5">
                                            <h4 className="text-white font-black uppercase tracking-widest text-xs mb-6 pb-2 border-b border-white/10">3. Virtual Valyuta (ATC & ARK)</h4>
                                            <p className="mb-4">3.1. ATC va ARK tangalari platforma ichidagi ko'ngilochar tizim elementlari bo'lib, ular haqiqiy pul mablag'lari hisoblanmaydi.</p>
                                            <p>3.2. Tangalarni naqdlashtirish (withdrawal) faqat admin tomonidan belgilangan maxsus aksiya davrlarida va faqat platforma balansiga o'tkazish yo'li bilan amalga oshirilishi mumkin.</p>
                                        </section>
                                    </div>
                                    <OfficialSeal />
                                </div>
                            )}

                            {/* --- 3. MAXFIYLIK SIYOSATI (BATAFSIL) --- */}
                            {activeSection === 'privacy' && (
                                <div className="space-y-12">
                                    <header className="mb-12">
                                        <h2 className="text-4xl font-black uppercase tracking-tight mb-6 flex items-center gap-4">
                                            <Lock className="text-blue-500" size={36} /> Maxfiylik Siyosati
                                        </h2>
                                        <p className="text-zinc-400 font-medium leading-relaxed">
                                            Biz sizning shaxsiy ma'lumotlaringiz xavfsizligini ta'minlash uchun xalqaro standartlar va O'zbekiston Respublikasining "Shaxsga doir ma'lumotlar to'g'risida"gi qonuniga amal qilamiz.
                                        </p>
                                    </header>

                                    <div className="space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="p-8 bg-blue-900/5 border border-blue-500/10 rounded-[2.5rem]">
                                                <h5 className="text-white font-black uppercase text-[10px] tracking-widest mb-4">Qanday ma'lumotlarni yig'amiz?</h5>
                                                <ul className="text-zinc-400 text-xs space-y-3 list-disc pl-4 leading-relaxed">
                                                    <li>Elektron pochta manzili (Akkaunt uchun)</li>
                                                    <li>IP manzil va Brauzer ma'lumotlari (Xavfsizlik uchun)</li>
                                                    <li>Qurilma ID (Bitta hisobdan foydalanishni nazorat qilish uchun)</li>
                                                    <li>To'lov cheklari (Screenshot ko'rinishida)</li>
                                                </ul>
                                            </div>
                                            <div className="p-8 bg-green-900/5 border border-green-500/10 rounded-[2.5rem]">
                                                <h5 className="text-white font-black uppercase text-[10px] tracking-widest mb-4">Ma'lumotlar himoyasi</h5>
                                                <ul className="text-zinc-400 text-xs space-y-3 list-disc pl-4 leading-relaxed">
                                                    <li>SSL/TLS shifrlangan ulanish</li>
                                                    <li>Supabase Auth - dunyo miqyosidagi xavfsiz tizim</li>
                                                    <li>Parollar "salted hash" usulida saqlanadi</li>
                                                    <li>Uchinchi shaxslarga ma'lumot sotilmaydi</li>
                                                </ul>
                                            </div>
                                        </div>
                                        
                                        <div className="p-8 bg-zinc-800/30 rounded-[2.5rem] border border-white/5">
                                            <p className="text-xs text-zinc-500 leading-[2] font-medium">
                                                * Eslatma: Siz saytdan foydalanish davomida barcha cookie-fayllarga va qurilma ma'lumotlarini tahlil qilishimizga rozilik berasiz. Bu platforma tezligini va xavfsizligini (botlardan himoya) ta'minlash uchun zarurdir.
                                            </p>
                                        </div>
                                    </div>
                                    <OfficialSeal />
                                </div>
                            )}

                            {/* --- 4. FOYDALANISH QOIDALARI (KAT'IY) --- */}
                            {activeSection === 'rules' && (
                                <div className="space-y-12">
                                    <h2 className="text-4xl font-black uppercase tracking-tight mb-10 flex items-center gap-4">
                                        <Scale className="text-yellow-500" size={36} /> Foydalanish Qoidalari
                                    </h2>
                                    
                                    <div className="grid grid-cols-1 gap-8">
                                        <div className="p-10 bg-red-900/10 border border-red-500/20 rounded-[3rem] relative overflow-hidden">
                                            <div className="absolute -right-8 -top-8 text-red-500/10 rotate-12"><ShieldAlert size={150}/></div>
                                            <h4 className="text-red-500 font-black text-xl mb-6 flex items-center gap-3 uppercase tracking-tighter"> <AlertCircle size={24}/> Qat'iyan Taqiqlanadi</h4>
                                            <ul className="text-sm text-zinc-400 space-y-4 font-medium leading-relaxed">
                                                <li className="flex gap-3"><span className="text-red-500">✕</span> Bir foydalanuvchi tomonidan 3 tadan ortiq akkaunt ochish.</li>
                                                <li className="flex gap-3"><span className="text-red-500">✕</span> Sharhlarda haqoratli so'zlar ishlatish va boshqa foydalanuvchilarni kamsitish.</li>
                                                <li className="flex gap-3"><span className="text-red-500">✕</span> Admin yoki Moderatsiyaga yolg'on cheklar/to'lov ma'lumotlarini yuborish.</li>
                                                <li className="flex gap-3"><span className="text-red-500">✕</span> Saytga zarar yetkazuvchi skriptlar (DDOS, SQL Injection) va botlarni ishga tushirish.</li>
                                                <li className="flex gap-3"><span className="text-red-500">✕</span> "ATC" va "ARK" tizimini manipulyatsiya qilishga urinish.</li>
                                            </ul>
                                            <p className="mt-8 text-xs text-red-500 font-black uppercase tracking-widest border-t border-red-500/20 pt-6">Jazo: Hisobni butunlay bloklash va yutuqlarni bekor qilish.</p>
                                        </div>

                                        <div className="p-10 bg-green-900/10 border border-green-500/20 rounded-[3rem]">
                                            <h4 className="text-green-500 font-black text-xl mb-6 flex items-center gap-3 uppercase tracking-tighter"> <CheckCircle2 size={24}/> Sizning huquqlaringiz</h4>
                                            <ul className="text-sm text-zinc-400 space-y-4 font-medium leading-relaxed">
                                                <li className="flex gap-3"><span className="text-green-500">✓</span> Animelarni yuqori sifatda ko'rish va shaxsiy keshga saqlash.</li>
                                                <li className="flex gap-3"><span className="text-green-500">✓</span> Platforma texnik xatolari haqida xabar berish va AI botdan yordam olish.</li>
                                                <li className="flex gap-3"><span className="text-green-500">✓</span> Fandub loyihalariga ovoz berish va ijodkorlarni qo'llab-quvvatlash.</li>
                                                <li className="flex gap-3"><span className="text-green-500">✓</span> Premium obuna orqali cheklovsiz imkoniyatlarga ega bo'lish.</li>
                                            </ul>
                                        </div>
                                    </div>
                                    <OfficialSeal />
                                </div>
                            )}

                            {/* --- 5. MUALLIFLIK HUQUQI (PROTECTION) --- */}
                            {activeSection === 'copyright' && (
                                <div className="space-y-12">
                                    <h2 className="text-4xl font-black uppercase tracking-tight mb-10 flex items-center gap-4">
                                        <Copyright className="text-purple-500" size={36} /> Mualliflik Huquqi
                                    </h2>
                                    
                                    <div className="prose prose-invert max-w-none space-y-8 text-zinc-300 text-sm leading-[2] font-medium">
                                        <p className="bg-white/5 p-8 rounded-3xl border border-white/5">
                                            5.1. "Anilo.uz" platformasidagi barcha grafik dizayn elementlari, logotiplar, UI/UX yechimlari va dasturiy kodlar <strong>ANILO MEDIA GROUP</strong> intellektual mulki hisoblanadi. Ularni ruxsatsiz ko'chirish qonun bilan ta'qib qilinadi.
                                        </p>
                                        <p>
                                            5.2. Platformadagi animelar Yaponiya va boshqa ishlab chiqaruvchi studiyalarga tegishli bo'lib, biz ularning o'zbek tilidagi fan-dublyaj (havaskor tarjima) versiyalarini taqdim etamiz. Biz original kontentga egalik qilishni da'vo qilmaymiz.
                                        </p>
                                        <p>
                                            5.3. <strong>DMCA & COPYRIGHT NOTICE:</strong> Agar siz mualliflik huquqi egasi bo'lsangiz va bizning platformadagi kontent huquqlaringizni buzmoqda deb hisoblasangiz, iltimos <strong>copyright@anilo.uz</strong> manziliga rasmiy so'rov yuboring. Biz 48 soat ichida javob beramiz.
                                        </p>
                                    </div>

                                    <div className="mt-20 p-12 bg-gradient-to-br from-zinc-900 to-black rounded-[4rem] text-center border border-white/10 shadow-3xl relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                                        <p className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.6em] mb-6">Designed & Developed by</p>
                                        <p className="text-5xl font-['Metal_Mania'] text-white tracking-[0.2em] mb-4 drop-shadow-2xl">ANILO TEAM</p>
                                        <p className="text-[10px] text-orange-500 font-black uppercase tracking-[0.3em] mb-10">Innovation in Fandub</p>
                                        <div className="w-20 h-1 bg-orange-600 mx-auto rounded-full mb-8"></div>
                                        <p className="text-xs text-zinc-500 italic">Est. 2023 | Tashkent - Navoiy - Samarkand</p>
                                    </div>
                                    <OfficialSeal />
                                </div>
                            )}

                        </div>
                    </main>

                </div>
            </div>

            {/* FINAL FOOTER */}
            <div className="bg-black py-12 border-t border-white/5 px-6">
                <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-center md:text-left">
                        <p className="text-zinc-400 font-black text-[10px] uppercase tracking-[0.3em] mb-2">Anilo Media Group LLC</p>
                        <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-widest leading-relaxed max-w-lg">
                            Barcha ma'lumotlar "Anilo.uz" platformasining rasmiy mulki hisoblanadi. Saytdan foydalanish barcha qoidalarni qabul qilganingizni anglatadi.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-500 border border-white/5 hover:text-white transition-colors cursor-pointer"> <InstagramIcon className="w-5 h-5"/> </div>
                        <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-500 border border-white/5 hover:text-white transition-colors cursor-pointer"> <TelegramIcon className="w-5 h-5"/> </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Simple helper icons for footer if needed
const InstagramIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
);

const TelegramIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
);
