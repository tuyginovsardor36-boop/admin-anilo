
// --- BU KONFIGURATSIYA FAYLI ---

// Vite environment variables
const viteEnv = (import.meta as any).env;

// Supabase Configuration
export const SUPABASE_URL = viteEnv.VITE_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = viteEnv.VITE_SUPABASE_KEY || viteEnv.VITE_SUPABASE_ANON_KEY || "";

// --- TSPAY CONFIGURATION ---
// MUHIM: CORS xatoligini oldini olish uchun biz to'g'ridan-to'g'ri URL emas,
// balki o'zimiz yaratgan '/api-tspay' proksi yo'lini ishlatamiz.
// Bu yo'l vite.config.ts (lokal) va vercel.json (prod) orqali haqiqiy manzilga ulanadi.

export const TSPAY_BASE_URL = '/api-tspay'; 

export const TSPAY_MERCHANT_TOKEN = 
    viteEnv.VITE_TSPAY_API || 
    ""; 

// Debugging
if (viteEnv.DEV) {
    console.log("Config Loaded:", {
        supabase: !!SUPABASE_URL,
        tspay_token_set: !!TSPAY_MERCHANT_TOKEN,
        tspay_proxy_path: TSPAY_BASE_URL
    });
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Supabase kalitlari topilmadi!");
}

if (!TSPAY_MERCHANT_TOKEN) {
    console.warn("TsPay API kaliti topilmadi (VITE_TSPAY_API).");
}