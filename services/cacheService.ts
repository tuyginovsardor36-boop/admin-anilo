
// Kesh tizimi versiyasi
const CACHE_VERSION = '2.5';
const CACHE_PREFIX = 'anilo_v' + CACHE_VERSION + '_';

interface CacheItem<T> {
    data: T;
    expiry: number;
    v: string;
}

/**
 * Keshdan ma'lumot olish
 */
export const getCache = <T>(key: string): T | null => {
    const fullKey = CACHE_PREFIX + key;
    try {
        const itemStr = localStorage.getItem(fullKey);
        if (!itemStr) return null;

        const item: CacheItem<T> = JSON.parse(itemStr);
        
        if (!item || item.v !== CACHE_VERSION || Date.now() > item.expiry) {
            localStorage.removeItem(fullKey);
            return null;
        }

        return item.data;
    } catch (e) {
        localStorage.removeItem(fullKey);
        return null;
    }
};

/**
 * Keshga yozish - QuotaExceeded xatosidan himoyalangan
 */
export const setCache = <T>(key: string, data: T, ttlMinutes: number = 60): void => {
    try {
        const item: CacheItem<T> = {
            data: data,
            expiry: Date.now() + ttlMinutes * 60 * 1000,
            v: CACHE_VERSION
        };
        const serialized = JSON.stringify(item);
        
        // Juda katta ma'lumotlarni localStorageda saqlamaslik kerak
        if (serialized.length > 500000) { // 500KB limit
            console.warn(`Data for ${key} is too large for localStorage.`);
            return;
        }

        localStorage.setItem(CACHE_PREFIX + key, serialized);
    } catch (e: any) {
        if (e.name === 'QuotaExceededError' || e.code === 22) {
            console.error("LocalStorage full! Purging non-essential data...");
            clearAppCache(true); // Faqat keshni tozalash, authni emas
        }
    }
};

/**
 * Barcha keshni tozalash
 * @param onlyCache - Agar true bo'lsa, faqat vaqtincha kesh o'chadi, login saqlanib qoladi
 */
export const clearAppCache = (onlyCache: boolean = false): void => {
    try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            // Login/Auth ma'lumotlarini saqlab qolamiz
            if (onlyCache) {
                if (key.startsWith('anilo_v') || key.includes('cache')) {
                    localStorage.removeItem(key);
                }
            } else {
                if (key.includes('anilo') || key.includes('supabase')) {
                    localStorage.removeItem(key);
                }
            }
        });
    } catch (e) {}
};

/**
 * Muddati o'tgan keshni o'chirish
 */
export const pruneCache = (): void => {
    try {
        const now = Date.now();
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('anilo_') || key.startsWith(CACHE_PREFIX))) {
                try {
                    const item = JSON.parse(localStorage.getItem(key) || '{}');
                    if (item.expiry && now > item.expiry) {
                        localStorage.removeItem(key);
                    }
                } catch {
                    // JSON xato bo'lsa ham o'chiramiz
                    if (key.includes('cache')) localStorage.removeItem(key);
                }
            }
        }
    } catch (e) {}
};
