import React, { useRef } from 'react';
import { Movie } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MovieRowProps {
  title: string;
  movies: Movie[];
  onMovieClick: (movie: Movie) => void;
}

export const MovieRow: React.FC<MovieRowProps> = ({ title, movies, onMovieClick }) => {
  const rowRef = useRef<HTMLDivElement>(null);

  const slide = (offset: number) => {
    if (rowRef.current) {
      rowRef.current.scrollLeft += offset;
    }
  };

  return (
    <div className="mb-8 pl-4 md:pl-12 group relative">
      <h2 className="text-white text-xl md:text-2xl font-semibold mb-4 transition-colors hover:text-gray-300 cursor-pointer inline-block">
        {title}
      </h2>

      {/* Navigation Buttons (Hidden by default, visible on group hover) */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 z-40 h-[200px] w-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none md:pointer-events-auto">
         <button 
            onClick={() => slide(-500)}
            className="bg-black/50 hover:bg-black/80 rounded-full p-2 cursor-pointer backdrop-blur-sm"
         >
            <ChevronLeft className="text-white" />
         </button>
      </div>

      <div className="absolute right-0 top-1/2 -translate-y-1/2 z-40 h-[200px] w-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none md:pointer-events-auto">
        <button 
            onClick={() => slide(500)}
            className="bg-black/50 hover:bg-black/80 rounded-full p-2 cursor-pointer backdrop-blur-sm"
         >
            <ChevronRight className="text-white" />
         </button>
      </div>

      {/* Row Container */}
      <div 
        ref={rowRef}
        className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth relative"
      >
        {movies.map((movie) => (
          <div 
            key={movie.id}
            onClick={() => onMovieClick(movie)}
            className="relative min-w-[180px] h-[260px] md:min-w-[220px] md:h-[320px] rounded overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-105 hover:z-10"
          >
            <img 
              src={movie.posterUrl} 
              alt={movie.title}
              loading="lazy"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20 hover:bg-transparent transition"></div>
          </div>
        ))}
      </div>
    </div>
  );
};