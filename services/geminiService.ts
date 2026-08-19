
import { GoogleGenAI, Type } from "@google/genai";
import { Movie } from '../types';

const API_TIMEOUT = 20000;

const movieSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "Full title of the anime." },
        year: { type: Type.INTEGER, description: "Release year." },
        plot: { type: Type.STRING, description: "Brief summary." },
        posterUrl: { type: Type.STRING, description: "Direct high-quality image URL." },
        genre: { type: Type.STRING, description: "Genres like Shonen, Isekai, Action." },
        language: { type: Type.STRING, description: "Original language (Japanese)." },
        quality: { type: Type.STRING, description: "Quality like HD or 4K." },
        rating: { type: Type.NUMBER, description: "Numerical rating out of 5." }
    },
    required: ["title", "year", "plot", "posterUrl", "genre", "language", "quality", "rating"]
};

const commonConfig = {
    responseMimeType: "application/json",
    responseSchema: {
        type: Type.ARRAY,
        items: movieSchema,
    },
};

const parseGeminiResponse = (text: string): any => {
    const cleanedText = text.trim();
    try {
        return JSON.parse(cleanedText);
    } catch (e) {
        const markdownMatch = cleanedText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (markdownMatch && markdownMatch[1]) {
            try {
                return JSON.parse(markdownMatch[1]);
            } catch (e) {}
        }
        throw new Error("Failed to parse AI response.");
    }
}

export const getPopularMovies = async (): Promise<Movie[]> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Provide a list of 12 highly-rated and popular anime series or movies. Include title, year, plot, posterUrl, genre, language, quality (HD/4K), and rating (0-5).`,
            config: commonConfig,
        });
        return parseGeminiResponse(response.text || '');
    } catch (error) {
        console.error(error);
        throw new Error("Ommabop animelar yuklanmadi.");
    }
};

export const searchMovies = async (query: string): Promise<Movie[]> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Search for anime matching: "${query}". Provide title, year, plot, posterUrl, genre, language, quality, and rating.`,
            config: commonConfig,
        });
        return parseGeminiResponse(response.text || '');
    } catch (error) {
        console.error(error);
        throw new Error("Qidiruvda xatolik.");
    }
};
