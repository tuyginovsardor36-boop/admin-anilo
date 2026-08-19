
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

const finalUrl = SUPABASE_URL || "https://placeholder-project.supabase.co";
const finalKey = SUPABASE_ANON_KEY || "placeholder-key";

// Supabase mijozi - Optimallashtirilgan konfiguratsiya
export const supabase = createClient<any>(finalUrl, finalKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'anilo_auth_token',
        storage: window.localStorage
    },
    db: {
        schema: 'public',
    },
    // Realtime connection sozlamalari
    // Ko'p foydalanuvchi bo'lsa, ulanishni yengillashtirish uchun timeoutni oshiramiz
    realtime: {
        params: {
            eventsPerSecond: 2, // 10 dan 2 ga tushirildi (yuklamani kamaytirish uchun)
        },
        timeout: 45000, // Timeoutni 45s ga oshiramiz
    },
    global: {
        headers: { 'x-application-name': 'anilo-uz' },
    },
});
