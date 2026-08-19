
import { supabase } from './supabaseClient';

export interface TsPayResponse {
    status: 'success' | 'error';
    transaction?: {
        id: number | string;
        url: string;
    };
    message?: string;
}

export const createTsPayTransaction = async (amount: number, userId: string): Promise<TsPayResponse> => {
    try {
        // Edge Function doim POST so'rov yuboradi
        const { data, error } = await supabase.functions.invoke('clever-api', {
            method: 'POST',
            body: { 
                action: 'create', 
                amount: amount, 
                user_id: userId 
            }
        });

        if (error) {
            console.error("Invoke Error:", error);
            return { 
                status: 'error', 
                message: "Tizim bilan bog'lanishda xato." 
            };
        }
        
        return data as TsPayResponse;
    } catch (err: any) {
        return { 
            status: 'error', 
            message: "Kutilmagan xatolik yuz berdi." 
        };
    }
};
