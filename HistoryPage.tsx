
import React, { useState, useEffect } from 'react';
import { getUserHistory } from './services/dbService';
import { supabase } from './services/supabaseClient';
import { Movie } from './types';
import { MovieCard } from './components/MovieCard';
import { LoadingSpinner } from './components/LoadingSpinner';

interface HistoryPageProps {
    onMovieClick: (movie: Movie) => void;
    viewUserId?: string | null; // New prop
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onMovieClick, viewUserId }) => {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setIsLoading(true);
                setError(null);
                
                let targetUserId = viewUserId;
                if (!targetUserId) {
                    const { data: { user } } = await supabase.auth.getUser();
                    targetUserId = user?.id;
                }

                if (targetUserId) {
                    const historyMovies = await getUserHistory(targetUserId);
                    setMovies(historyMovies);
                }
            } catch (err) {
                console.error(err);
                setError("Tarixni yuklashda xatolik yuz berdi.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, [viewUserId]);

    return (
        <div className="animate-fade-in">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 mb-8 pl-2 border-l-4 border-orange-500">
                {viewUserId ? "Foydalanuvchi Tarixi" : "Ko'rilganlar Tarixi"}
            </h1>

            {isLoading && <div className="flex justify-center py-10"><LoadingSpinner /></div>}
            
            {error && !isLoading && (
                <div className="text-center text-red-400 bg-red-900/20 p-4 rounded-lg">
                    <p>{error}</p>
                </div>
            )}

            {!isLoading && movies.length === 0 && !error && (
                <div className="text-center text-gray-500 py-20">
                    <p>Hali hech qanday anime ko'rilmagan.</p>
                </div>
            )}

            {!isLoading && movies.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6 md:gap-8">
                    {movies.map((movie) => (
                        <MovieCard
                            key={`${movie.title}-${movie.id}-history`}
                            movie={movie}
                            isActive={true}
                            onClick={() => onMovieClick(movie)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
