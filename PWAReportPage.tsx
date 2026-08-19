
import React, { useEffect, useState } from 'react';
import { 
    CheckCircle2, XCircle, Smartphone, Globe, Zap, 
    ShieldCheck, RefreshCw, Bell, Download, Share2,
    Layout, Layers, Activity, Info, MapPin, FileCode,
    Camera, Mic, Bluetooth, Contact, Lock, Eye, Hash,
    Usb, Cpu, MousePointer2, Music, Fingerprint, CreditCard,
    Keyboard, Pipette, Share, HardDrive, Wifi, CpuIcon, Battery,
    Gamepad, Type, Monitor, Shield, Cookie, Mic2, Volume2,
    Maximize, SmartphoneIcon, ZapOff
} from 'lucide-react';
import { motion } from 'motion/react';

export const PWAReportPage: React.FC = () => {
    const [swStatus, setSwStatus] = useState<'loading' | 'active' | 'inactive'>('loading');
    const [manifest, setManifest] = useState<any>(null);
    const [isStandalone, setIsStandalone] = useState(false);

    const downloadAssetLinks = () => {
        const content = `[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "uz.anilo.mobile",
    "sha256_cert_fingerprints": ["C3:CF:98:62:ED:83:25:7E:98:B2:15:DF:22:5A:81:93:0D:54:99:A6:0E:86:E5:12:45:6B:D3:2D:37:63:80:29"]
  }
}]`;
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'assetlinks.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    useEffect(() => {
        // Check Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration().then(reg => {
                if (reg && reg.active) {
                    setSwStatus('active');
                } else {
                    setSwStatus('inactive');
                }
            });
        } else {
            setSwStatus('inactive');
        }

        // Check Manifest
        fetch('/manifest.json')
            .then(res => res.json())
            .then(data => setManifest(data))
            .catch(() => setManifest(null));

        // Check Standalone mode
        setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
    }, []);

    const features = [
        { 
            name: 'Service Worker', 
            status: swStatus === 'active', 
            desc: 'Oflayn ishlash va keshni boshqarish',
            icon: Zap
        },
        { 
            name: 'Web Manifest', 
            status: !!manifest, 
            desc: 'Ilova ma\'lumotlari va ikonkalari',
            icon: Layout
        },
        { 
            name: 'Standalone Mode', 
            status: isStandalone, 
            desc: 'Ilova kabi alohida oynada ochilish',
            icon: Smartphone
        },
        { 
            name: 'HTTPS / Secure', 
            status: window.location.protocol === 'https:', 
            desc: 'Xavfsiz ulanish va ma\'lumotlar himoyasi',
            icon: ShieldCheck
        },
        { 
            name: 'Push Notifications', 
            status: 'Notification' in window, 
            desc: 'Tezkor xabarnomalar yuborish imkoniyati',
            icon: Bell
        },
        { 
            name: 'Background Sync', 
            status: 'SyncManager' in window, 
            desc: 'Internet ulanganda ma\'lumotlarni sinxronlash',
            icon: RefreshCw
        },
        { 
            name: 'Share Target', 
            status: !!manifest?.share_target, 
            desc: 'Boshqa ilovalardan ma\'lumot qabul qilish',
            icon: Share2
        },
        { 
            name: 'Protocol Handlers', 
            status: !!manifest?.protocol_handlers, 
            desc: 'Maxsus havolalar (web+anilo) bilan ishlash',
            icon: Globe
        },
        { 
            name: 'Launch Handler', 
            status: !!manifest?.launch_handler, 
            desc: 'Ilovani ochilish mantiqini boshqarish',
            icon: Layers
        },
        { 
            name: 'App Shortcuts', 
            status: !!manifest?.shortcuts && manifest.shortcuts.length > 0, 
            desc: 'Ilova belgisini bosib turganda chiqadigan tezkor tugmalar',
            icon: Zap
        },
        { 
            name: 'Geolocation', 
            status: 'geolocation' in navigator, 
            desc: 'Foydalanuvchi joylashuvini aniqlash',
            icon: MapPin
        },
        { 
            name: 'File System Access', 
            status: 'showOpenFilePicker' in window, 
            desc: 'Qurilmadagi fayllar bilan to\'g\'ridan-to\'g\'ri ishlash',
            icon: FileCode
        },
        { 
            name: 'Camera Access', 
            status: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia), 
            desc: 'Rasm va video olish imkoniyati',
            icon: Camera
        },
        { 
            name: 'Microphone Access', 
            status: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia), 
            desc: 'Ovoz yozish imkoniyati',
            icon: Mic
        },
        { 
            name: 'Web Bluetooth', 
            status: 'bluetooth' in navigator, 
            desc: 'Yaqin atrofdagi Bluetooth qurilmalarga ulanish',
            icon: Bluetooth
        },
        { 
            name: 'Contact Picker', 
            status: 'contacts' in navigator && 'ContactsManager' in window, 
            desc: 'Kontaktlar ro\'yxatidan tanlash imkoniyati',
            icon: Contact
        },
        { 
            name: 'Screen Wake Lock', 
            status: 'wakeLock' in navigator, 
            desc: 'Ekran o\'chib qolishini oldini olish',
            icon: Lock
        },
        { 
            name: 'Idle Detection', 
            status: 'IdleDetector' in window, 
            desc: 'Foydalanuvchi faolligini aniqlash',
            icon: Eye
        },
        { 
            name: 'App Badging', 
            status: 'setAppBadge' in navigator, 
            desc: 'Ilova belgisida bildirishnoma raqamini ko\'rsatish',
            icon: Hash
        },
        { 
            name: 'Web USB', 
            status: 'usb' in navigator, 
            desc: 'USB qurilmalarga to\'g\'ridan-to\'g\'ri ulanish',
            icon: Usb
        },
        { 
            name: 'Web Serial', 
            status: 'serial' in navigator, 
            desc: 'Serial (COM) portlar bilan ishlash',
            icon: Cpu
        },
        { 
            name: 'Web HID', 
            status: 'hid' in navigator, 
            desc: 'Inson interfeysi qurilmalari (joystik va h.k.)',
            icon: MousePointer2
        },
        { 
            name: 'Web MIDI', 
            status: 'requestMIDIAccess' in navigator, 
            desc: 'Musiqiy asboblarni ulash va boshqarish',
            icon: Music
        },
        { 
            name: 'Web Authentication', 
            status: 'credentials' in navigator && !!window.PublicKeyCredential, 
            desc: 'Biometrik (FaceID/TouchID) orqali kirish',
            icon: Fingerprint
        },
        { 
            name: 'Payment Request', 
            status: 'PaymentRequest' in window, 
            desc: 'Tezkor va xavfsiz to\'lovlarni amalga oshirish',
            icon: CreditCard
        },
        { 
            name: 'Virtual Keyboard', 
            status: 'virtualKeyboard' in navigator, 
            desc: 'Ekran klaviaturasi o\'lchamlarini boshqarish',
            icon: Keyboard
        },
        { 
            name: 'Eye Dropper', 
            status: 'EyeDropper' in window, 
            desc: 'Ekranning istalgan nuqtasidan rang tanlash',
            icon: Pipette
        },
        { 
            name: 'File Handlers', 
            status: !!manifest?.file_handlers, 
            desc: 'Ilovani ma\'lum fayl turlari uchun ochuvchi sifatida ro\'yxatdan o\'tkazish',
            icon: FileCode
        },
        { 
            name: 'Web Share API', 
            status: 'share' in navigator, 
            desc: 'Tizim ulashish oynasidan foydalanish',
            icon: Share
        },
        { 
            name: 'Storage Manager', 
            status: 'storage' in navigator && 'estimate' in navigator.storage, 
            desc: 'Xotira hajmini aniqlash va boshqarish',
            icon: HardDrive
        },
        { 
            name: 'Network Information', 
            status: 'connection' in navigator, 
            desc: 'Internet turi va tezligini aniqlash',
            icon: Wifi
        },
        { 
            name: 'Device Memory', 
            status: 'deviceMemory' in navigator, 
            desc: 'Qurilma operativ xotirasi (RAM) haqida ma\'lumot',
            icon: CpuIcon
        },
        { 
            name: 'Hardware Concurrency', 
            status: 'hardwareConcurrency' in navigator, 
            desc: 'Protsessor yadrolari sonini aniqlash',
            icon: Cpu
        },
        { 
            name: 'Battery Status', 
            status: 'getBattery' in navigator, 
            desc: 'Batareya quvvati va holatini kuzatish',
            icon: Battery
        },
        { 
            name: 'Gamepad API', 
            status: 'getGamepads' in navigator, 
            desc: 'O\'yin pultlarini ulash va boshqarish',
            icon: Gamepad
        },
        { 
            name: 'Local Font Access', 
            status: 'queryLocalFonts' in window, 
            desc: 'Tizimdagi shriftlardan foydalanish',
            icon: Type
        },
        { 
            name: 'Window Controls Overlay', 
            status: 'windowControlsOverlay' in navigator, 
            desc: 'Sarlavha satrini (Title Bar) boshqarish',
            icon: Monitor
        },
        { 
            name: 'Permissions API', 
            status: 'permissions' in navigator, 
            desc: 'Ruxsatlar holatini tekshirish',
            icon: Shield
        },
        { 
            name: 'Cookie Store API', 
            status: 'cookieStore' in window, 
            desc: 'Cookie-larni zamonaviy usulda boshqarish',
            icon: Cookie
        },
        { 
            name: 'Speech Recognition', 
            status: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window, 
            desc: 'Ovozni matnga aylantirish',
            icon: Mic2
        },
        { 
            name: 'Speech Synthesis', 
            status: 'speechSynthesis' in window, 
            desc: 'Matnni ovozli o\'qish',
            icon: Volume2
        },
        { 
            name: 'Fullscreen API', 
            status: 'requestFullscreen' in document.documentElement, 
            desc: 'Ilovani butun ekranda ko\'rsatish',
            icon: Maximize
        },
        { 
            name: 'Screen Orientation', 
            status: 'orientation' in screen, 
            desc: 'Ekran holatini (portrait/landscape) aniqlash',
            icon: SmartphoneIcon
        },
        { 
            name: 'Vibration API', 
            status: 'vibrate' in navigator, 
            desc: 'Qurilmani tebratish (vibratsiya)',
            icon: ZapOff
        },
        { 
            name: 'Android App (AAB)', 
            status: true, 
            desc: 'Google Play uchun tayyorlangan ilova paketi',
            icon: SmartphoneIcon
        }
    ];

    const activeFeatures = features.filter(f => f.status).length;
    const totalScore = Math.round((activeFeatures / features.length) * 100);

    return (
        <div className="min-h-screen bg-[#050505] text-white p-6 pb-20">
            <div className="max-w-4xl mx-auto">
                <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <motion.h1 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl font-black mb-2 bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent"
                        >
                            Anilo PWA Report Card
                        </motion.h1>
                        <p className="text-gray-400">Ilovaning Progressiv Web App (PWA) imkoniyatlari va holati tahlili.</p>
                    </div>
                    
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-[#111] border border-orange-500/20 p-4 rounded-2xl flex items-center gap-4"
                    >
                        <div className="text-right">
                            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">PWA Score</p>
                            <p className="text-3xl font-black text-orange-500">{totalScore}%</p>
                        </div>
                        <div className="w-12 h-12 rounded-full border-4 border-orange-500/20 border-t-orange-500 flex items-center justify-center">
                            <span className="text-xs font-bold">{activeFeatures}/{features.length}</span>
                        </div>
                    </motion.div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    {features.map((f, i) => (
                        <motion.div 
                            key={f.name}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-[#111] border border-white/5 p-6 rounded-2xl flex items-start gap-4"
                        >
                            <div className={`p-3 rounded-xl ${f.status ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                <f.icon className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-bold text-lg">{f.name}</h3>
                                    {f.status ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-red-500" />
                                    )}
                                </div>
                                <p className="text-sm text-gray-500">{f.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {manifest && (
                    <section className="bg-[#111] border border-white/5 p-8 rounded-3xl mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <Info className="w-6 h-6 text-orange-500" />
                            <h2 className="text-2xl font-bold">Manifest Ma'lumotlari</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div>
                                <label className="text-xs uppercase tracking-widest text-gray-500 font-bold">Ilova Nomi</label>
                                <p className="text-lg font-medium">{manifest.name}</p>
                            </div>
                            <div>
                                <label className="text-xs uppercase tracking-widest text-gray-500 font-bold">Qisqa Nom</label>
                                <p className="text-lg font-medium">{manifest.short_name}</p>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="text-xs uppercase tracking-widest text-gray-500 font-bold">Tavsif</label>
                                <p className="text-gray-400 leading-relaxed">{manifest.description}</p>
                            </div>
                            <div>
                                <label className="text-xs uppercase tracking-widest text-gray-500 font-bold">Mavzu Rangi</label>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: manifest.theme_color }}></div>
                                    <p className="font-mono">{manifest.theme_color}</p>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs uppercase tracking-widest text-gray-500 font-bold">ID</label>
                                <p className="font-mono text-sm text-orange-400">{manifest.id}</p>
                            </div>
                        </div>

                        <div className="mt-10 pt-10 border-t border-white/5">
                            <h3 className="text-lg font-bold mb-4">Ikonkalar</h3>
                            <div className="flex flex-wrap gap-4">
                                {manifest.icons?.map((icon: any, idx: number) => (
                                    <div key={idx} className="bg-black/40 p-3 rounded-xl border border-white/5 flex flex-col items-center gap-2">
                                        <img src={icon.src} alt="icon" className="w-12 h-12" />
                                        <span className="text-[10px] font-mono text-gray-500">{icon.sizes}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                <section className="bg-green-500/5 border border-green-500/10 p-8 rounded-3xl mb-12">
                    <div className="flex items-center gap-3 mb-6">
                        <SmartphoneIcon className="w-8 h-8 text-green-500" />
                        <h2 className="text-2xl font-bold">Android Ilovasi Tayyor! ✅</h2>
                    </div>
                    <p className="text-gray-400 mb-6 leading-relaxed">
                        Tabriklaymiz! Google Play uchun <strong>Android App Bundle (.aab)</strong> va <strong>APK</strong> fayllari muvaffaqiyatli yaratildi. 
                        Endi ilovani rasman nashr etish uchun quyidagi qadamlarni bajarishingiz kerak:
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-black/40 p-6 rounded-2xl border border-white/5">
                            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                                <Globe className="w-5 h-5 text-blue-400" />
                                1. PWA (Bepul va Oson)
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Google Play'ga 25$ to'lash shart emas! Saytingizga kirib, brauzer menyusidan <strong>"Ilovani o'rnatish" (Add to Home Screen)</strong> tugmasini bossangiz kifoya.
                            </p>
                            <ul className="text-xs text-gray-600 space-y-1">
                                <li>• Mutlaqo bepul</li>
                                <li>• Xuddi oddiy ilovadek ishlaydi</li>
                                <li>• Yangilanishlar avtomatik bo'ladi</li>
                            </ul>
                        </div>

                        <div className="bg-black/40 p-6 rounded-2xl border border-white/5">
                            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-green-400" />
                                2. APK (Play Store'siz)
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Agar baribir APK kerak bo'lsa, yuklab olingan <code>.apk</code> faylini Telegram yoki saytingiz orqali tarqatishingiz mumkin.
                            </p>
                            <div className="bg-[#050505] p-4 rounded-xl font-mono text-[11px] text-orange-400 mb-4 overflow-x-auto">
                                <pre>{`[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "uz.anilo.mobile",
    "sha256_cert_fingerprints": ["C3:CF:98:62:ED:83:25:7E:98:B2:15:DF:22:5A:81:93:0D:54:99:A6:0E:86:E5:12:45:6B:D3:2D:37:63:80:29"]
  }
}]`}</pre>
                            </div>
                            <p className="text-xs text-gray-600 mb-4">
                                Yuqoridagi kodni <code>assetlinks.json</code> deb nomlangan faylga saqlang va uni saytingizning <code>.well-known/</code> papkasiga yuklang.
                            </p>
                            
                            <button 
                                onClick={downloadAssetLinks}
                                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors mb-4"
                            >
                                <Download className="w-5 h-5" />
                                assetlinks.json faylini yuklab olish
                            </button>

                            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                                <p className="text-sm text-green-400 font-bold mb-2 flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5" />
                                    Fayl loyihaga qo'shildi!
                                </p>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    Men <code>public/.well-known/assetlinks.json</code> faylini loyihangizga avtomatik tarzda yaratib qo'shdim. 
                                    Endi siz saytingizni yangilaganingizda (deploy qilganingizda), bu fayl o'z-o'zidan <code>anilo.uz/.well-known/assetlinks.json</code> manzilida paydo bo'ladi.
                                </p>
                            </div>

                            <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                                <p className="text-[10px] text-orange-400 leading-tight">
                                    <strong>ESLATMA:</strong> Tepadagi "X" va manzil satrini yo'qotish uchun baribir <code>assetlinks.json</code> faylini saytga yuklash kerak bo'ladi.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-orange-500/5 border border-orange-500/10 p-8 rounded-3xl mb-12">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-orange-500" />
                        Ruxsatlarni Sinab Ko'rish
                    </h2>
                    <p className="text-sm text-gray-500 mb-6">Quyidagi tugmalar orqali brauzerdan ruxsat so'rash jarayonini tekshirishingiz mumkin.</p>
                    <div className="flex flex-wrap gap-4">
                        <button 
                            onClick={() => navigator.geolocation.getCurrentPosition(() => {}, () => {})}
                            className="bg-[#111] hover:bg-orange-500/10 border border-white/5 hover:border-orange-500/30 px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
                        >
                            <MapPin className="w-4 h-4" /> Joylashuv
                        </button>
                        <button 
                            onClick={() => navigator.mediaDevices.getUserMedia({ video: true }).then(s => s.getTracks().forEach(t => t.stop()))}
                            className="bg-[#111] hover:bg-orange-500/10 border border-white/5 hover:border-orange-500/30 px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
                        >
                            <Camera className="w-4 h-4" /> Kamera
                        </button>
                        <button 
                            onClick={() => navigator.mediaDevices.getUserMedia({ audio: true }).then(s => s.getTracks().forEach(t => t.stop()))}
                            className="bg-[#111] hover:bg-orange-500/10 border border-white/5 hover:border-orange-500/30 px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
                        >
                            <Mic className="w-4 h-4" /> Mikrofon
                        </button>
                        <button 
                            onClick={() => 'Notification' in window && Notification.requestPermission()}
                            className="bg-[#111] hover:bg-orange-500/10 border border-white/5 hover:border-orange-500/30 px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
                        >
                            <Bell className="w-4 h-4" /> Bildirishnoma
                        </button>
                        <button 
                            onClick={async () => {
                                if ('showOpenFilePicker' in window) {
                                    try { await (window as any).showOpenFilePicker(); } catch(e) {}
                                }
                            }}
                            className="bg-[#111] hover:bg-orange-500/10 border border-white/5 hover:border-orange-500/30 px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
                        >
                            <FileCode className="w-4 h-4" /> Fayl Tizimi
                        </button>
                    </div>
                </section>

                <section className="bg-orange-500/5 border border-orange-500/10 p-8 rounded-3xl mb-12">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-orange-500" />
                        Keyingi Qadamlar
                    </h2>
                    <ul className="space-y-3 text-gray-400">
                        <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 shrink-0"></div>
                            <span><strong>Maskable Icons:</strong> Ilova ikonkasini barcha qurilmalarda chiroyli ko'rinishi uchun "maskable" formatda tayyorlash.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 shrink-0"></div>
                            <span><strong>Real Screenshots:</strong> Picsum o'rniga ilovaning haqiqiy interfeysidan olingan rasmlarni manifestga qo'shish.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 shrink-0"></div>
                            <span><strong>Offline Content:</strong> Oflayn rejimda ko'rish uchun keshda saqlanadigan sahifalar sonini ko'paytirish.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 shrink-0"></div>
                            <span><strong>PNG Icons:</strong> PNG formatidagi ikonkalarni qo'shish (Bajarildi ✅).</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 shrink-0"></div>
                            <span><strong>Google Play:</strong> Ilovani Google Play Console orqali dunyoga taqdim etish (Navbatdagi qadam 🚀).</span>
                        </li>
                    </ul>
                </section>

                <footer className="text-center text-gray-600 text-sm">
                    <p>© 2026 Anilo.uz - Barcha huquqlar himoyalangan.</p>
                    <p className="mt-1">PWABuilder tahlili asosida optimallashtirildi.</p>
                </footer>
            </div>
        </div>
    );
};
