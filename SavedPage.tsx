
import React, { useState, useEffect } from 'react';
import { getSavedMovies } from './services/dbService';
import { supabase } from './services/supabaseClient';
import { Movie } from './types';
import { MovieCard } from './components/MovieCard';
import { LoadingSpinner } from './components/LoadingSpinner';
import { BookmarkIcon } from './components/icons/BookmarkIcon';

interface SavedPageProps {
    onMovieClick: (movie: Movie) => void;
    viewUserId?: string | null; // New prop
}

export const SavedPage: React.FC<SavedPageProps> = ({ onMovieClick, viewUserId }) => {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSaved = async () => {
            try {
                setIsLoading(true);
                setError(null);
                
                let targetUserId = viewUserId;
                if (!targetUserId) {
                    const { data: { user } } = await supabase.auth.getUser();
                    targetUserId = user?.id;
                }

                if (targetUserId) {
                    const savedMovies = await getSavedMovies(targetUserId);
                    setMovies(savedMovies);
                }
            } catch (err) {
                console.error(err);
                setError("Saqlangan animelarni yuklashda xatolik yuz berdi.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchSaved();
    }, [viewUserId]);

    return (
        <div className="animate-fade-in">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-orange-600/20 rounded-lg">
                    <BookmarkIcon className="w-8 h-8 text-orange-500" />
                </div>
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
                    {viewUserId ? "Foydalanuvchi Saqlaganlari" : "Saqlanganlar"}
                </h1>
            </div>

            {isLoading && <div className="flex justify-center py-10"><LoadingSpinner /></div>}
            
            {error && !isLoading && (
                <div className="text-center text-red-400 bg-red-900/20 p-4 rounded-lg">
                    <p>{error}</p>
                </div>
            )}

            {!isLoading && movies.length === 0 && !error && (
                <div className="text-center text-gray-500 py-20 flex flex-col items-center">
                    <BookmarkIcon className="w-16 h-16 text-gray-700 mb-4" />
                    <p className="text-lg mb-2">Hali saqlangan animelar yo'q.</p>
                </div>
            )}

            {!isLoading && movies.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6 md:gap-8">
                    {movies.map((movie) => (
                        <MovieCard
                            key={`${movie.title}-${movie.id}-saved`}
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
