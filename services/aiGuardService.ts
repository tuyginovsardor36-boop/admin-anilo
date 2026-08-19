
import { GoogleGenAI, Type } from "@google/genai";

export interface AiGuardResult {
    allowed: boolean;
    analysis: string;
    actions: string[];
    threatLevel: 'low' | 'medium' | 'high';
}

/**
 * AI Guard: Foydalanuvchi harakatlarini real vaqtda tahlil qiladi.
 * Maqsad: Spam, haqorat, xavfsizlik buzilishi va siyosatga zid kontentni aniqlash.
 */
export const runAiServerManager = async (logContext: string): Promise<AiGuardResult | null> => {
    try {
        // Initialize client lazily to avoid top-level env access issues
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Siz Anilo.uz anime portalining Xavfsizlik va Moderatsiya AI Guard tizimisiz. 
            Quyidagi kontekstni tahlil qiling va qaror qabul qiling. 
            Qoidalar: 
            1. Haqoratli username yoki sharhlarni bloklang. 
            2. Shubhali yoki botga o'xshash ketma-ket amallarni aniqlang. 
            3. Sayt obro'siga zarar yetkazuvchi reklamalarni taqiqlang.
            
            Kontekst: ${logContext}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        allowed: { type: Type.BOOLEAN, description: "Amalga ruxsat beriladimi?" },
                        analysis: { type: Type.STRING, description: "Qisqacha tahlil (admin uchun)" },
                        actions: { 
                            type: Type.ARRAY, 
                            items: { type: Type.STRING },
                            description: "Tizim tomonidan amalga oshirilgan yoki tavsiya etilgan amallar"
                        },
                        threatLevel: { 
                            type: Type.STRING, 
                            description: "Xavf darajasi: low, medium, high" 
                        }
                    },
                    required: ["allowed", "analysis", "actions", "threatLevel"]
                }
            }
        });

        const result = JSON.parse(response.text || '{}');
        return result as AiGuardResult;
    } catch (error) {
        console.error("AI Guard Error:", error);
        return null;
    }
};

/**
 * Global AI Pilot holatini boshqarish (localStorage orqali)
 */
export const isAiPilotEnabled = (): boolean => {
    return localStorage.getItem('anilo_ai_pilot') === 'true';
};

export const setAiPilotEnabled = (enabled: boolean) => {
    localStorage.setItem('anilo_ai_pilot', String(enabled));
};
