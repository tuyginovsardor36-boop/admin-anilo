
import { supabase } from './supabaseClient';
import { Ad } from '../types';

// Barcha faol reklamalarni joylashuvi bo'yicha olish
export const getActiveAdForLocation = async (location: Ad['location']): Promise<Ad | null> => {
    try {
        const { data, error } = await supabase
            .from('ads')
            .select('*')
            .eq('location', location)
            .eq('status', 'active')
            // Agar bir nechta bo'lsa, tasodifiy yoki eng oxirgisini olish mumkin. Hozircha bittasini olamiz.
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error(`Error fetching ad for ${location}:`, error);
            return null;
        }

        if (!data) return null;

        // Fix: Use any type cast to safely access fields from the dynamically fetched table
        const adData = data as any;
        return {
            id: adData.id,
            name: adData.name,
            type: adData.type,
            contentUrl: adData.content_url,
            targetUrl: adData.target_url,
            location: adData.location,
            status: adData.status,
            view_count: adData.view_count
        };
    } catch (err) {
        console.error("Ad service error:", err);
        return null;
    }
};

// Pleyer uchun barcha kerakli reklamalarni birdaniga olish (optimallashtirish)
export const getPlayerAds = async (): Promise<Ad[]> => {
    try {
        const { data, error } = await supabase
            .from('ads')
            .select('*')
            .in('location', ['player_overlay_full', 'player_overlay_large_banner', 'player_overlay_small_banner', 'pre_roll_video'])
            .eq('status', 'active');

        if (error) throw error;

        // Fix: Added any cast in map for property access when table is not in Database interface
        return (data || []).map((ad: any) => ({
            id: ad.id,
            name: ad.name,
            type: ad.type,
            contentUrl: ad.content_url,
            targetUrl: ad.target_url,
            location: ad.location,
            status: ad.status,
            view_count: ad.view_count
        }));
    } catch (err) {
        console.error("Player ads fetch error:", err);
        return [];
    }
};
