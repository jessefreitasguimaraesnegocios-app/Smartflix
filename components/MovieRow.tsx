import React, { useRef, useState, useCallback } from 'react';
import { Movie } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TvTrailerCard } from './TvTrailerCard';

interface MovieRowProps {
  title: string;
  movies: Movie[];
  onMovieClick: (movie: Movie) => void;
  rowIndex?: number;
  language?: 'en' | 'pt';
  enableTvMode?: boolean; // Ativa modo TV com autoplay
}

export const MovieRow: React.FC<MovieRowProps> = ({ 
  title, 
  movies, 
  onMovieClick,
  rowIndex = 0,
  language = 'pt',
  enableTvMode = true,
}) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const slide = (offset: number) => {
    if (rowRef.current) {
      rowRef.current.scrollLeft += offset;
    }
  };

  const handleCardFocus = useCallback((index: number) => {
    setFocusedIndex(index);
  }, []);

  const handleCardBlur = useCallback(() => {
    // Não limpar imediatamente para evitar flicker
    setTimeout(() => {
      setFocusedIndex(null);
    }, 100);
  }, []);

  const handleCardKeyDown = useCallback((e: React.KeyboardEvent, movie: Movie) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onMovieClick(movie);
    }
  }, [onMovieClick]);

  return (
    <div className="mb-12 pl-4 md:pl-12 group relative">
      <h2 className="text-white text-2xl md:text-3xl font-bold mb-6 transition-colors">
        {title}
      </h2>

      {/* Navigation Buttons (Hidden by default, visible on group hover) */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 z-40 h-[400px] w-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none md:pointer-events-auto">
         <button 
            onClick={() => slide(-600)}
            className="bg-black/50 hover:bg-black/80 rounded-full p-2 cursor-pointer backdrop-blur-sm"
         >
            <ChevronLeft className="text-white w-6 h-6" />
         </button>
      </div>

      <div className="absolute right-0 top-1/2 -translate-y-1/2 z-40 h-[400px] w-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none md:pointer-events-auto">
        <button 
            onClick={() => slide(600)}
            className="bg-black/50 hover:bg-black/80 rounded-full p-2 cursor-pointer backdrop-blur-sm"
         >
            <ChevronRight className="text-white w-6 h-6" />
         </button>
      </div>

      {/* Row Container */}
      <div 
        ref={rowRef}
        className="flex items-center gap-4 md:gap-6 overflow-x-auto no-scrollbar scroll-smooth relative"
        style={{ scrollPaddingLeft: '4rem' }}
      >
        {movies.map((movie, index) => {
          const isFocused = focusedIndex === index;
          
          if (enableTvMode) {
            return (
              <div
                key={movie.id}
                tabIndex={0}
                onKeyDown={(e) => handleCardKeyDown(e, movie)}
                className="focus:outline-none"
              >
                <TvTrailerCard
                  movie={movie}
                  isFocused={isFocused}
                  onFocus={() => handleCardFocus(index)}
                  onClick={() => onMovieClick(movie)}
                  language={language}
                />
              </div>
            );
          }

          // Fallback para modo desktop (sem autoplay)
          return (
            <div 
              key={movie.id}
              tabIndex={0}
              onClick={() => onMovieClick(movie)}
              onFocus={() => handleCardFocus(index)}
              onBlur={handleCardBlur}
              onKeyDown={(e) => handleCardKeyDown(e, movie)}
              className={`
                relative min-w-[280px] h-[400px] md:min-w-[320px] md:h-[460px]
                rounded-lg overflow-hidden cursor-pointer
                transition-all duration-300
                focus:outline-none
                ${isFocused 
                  ? 'scale-110 z-20 shadow-2xl ring-4 ring-white/50' 
                  : 'scale-100 z-10 hover:scale-105'
                }
              `}
              style={{
                transform: isFocused ? 'scale(1.1)' : 'scale(1)',
                boxShadow: isFocused 
                  ? '0 0 30px rgba(255, 255, 255, 0.3), 0 0 60px rgba(255, 255, 255, 0.1)' 
                  : 'none',
              }}
            >
              <img 
                src={movie.posterUrl} 
                alt={movie.title}
                loading="lazy"
                className="w-full h-full object-cover"
              />
              {isFocused && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white text-lg md:text-xl font-bold drop-shadow-lg line-clamp-2">
                      {movie.title}
                    </h3>
                    <p className="text-white/80 text-sm mt-1 line-clamp-2">
                      {movie.year} • {movie.genres.slice(0, 2).join(', ')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};