'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchBoxProps {
    onSearch: (query: string) => void;
    placeholder?: string;
    className?: string;
}

export function SearchBox({
    onSearch,
    placeholder = 'Search tutorials...',
    className
}: SearchBoxProps) {
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(query.trim());
    };

    const handleClear = () => {
        setQuery('');
        onSearch('');
    };

    return (
        <form
            onSubmit={handleSubmit}
            className={cn(
                'relative flex items-center transition-all duration-300',
                isFocused ? 'ring-2 ring-coral/50' : '',
                className
            )}
        >
            <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={placeholder}
                    className="w-full pl-12 pr-12 py-3 bg-white border-2 border-gray-200 rounded-full text-gray-900 placeholder-gray-400 focus:outline-none focus:border-coral transition-colors"
                />
                {query && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
        </form>
    );
}
