import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onSearch(val); // Dynamic search as user types
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
        <Search className="w-5 h-5 text-zinc-450" />
      </div>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Masalan: Yovuzlik qarorgohi"
        className="w-full pl-12 pr-6 py-4.5 text-base bg-zinc-900/90 border border-zinc-850/80 rounded-2xl focus:border-zinc-700 focus:outline-none transition-all duration-200 placeholder-zinc-500 font-bold text-white shadow-inner"
        disabled={isLoading}
      />
    </form>
  );
};