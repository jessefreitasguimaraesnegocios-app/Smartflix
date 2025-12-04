import React from 'react';
import { Play, Info } from 'lucide-react';
import { Movie } from '../types';

interface HeroProps {
  movie: Movie | null;
  onMoreInfo: (movie: Movie) => void;
  language: 'en' | 'pt';
}

export const Hero: React.FC<HeroProps> = ({ movie, onMoreInfo, language }) => {
  if (!movie) return <div className="h-[56.25vw] bg-zinc-900 animate-pulse"></div>;

  const t = {
    play: language === 'pt' ? 'Assistir' : 'Play',
    moreInfo: language === 'pt' ? 'Mais Informações' : 'More Info',
  };

  return (
    <div className="relative h-[80vh] w-full">
      {/* Background Image */}
      <div className="absolute top-0 left-0 w-full h-full">
        <img 
          src={movie.backdropUrl} 
          alt={movie.title} 
          className="w-full h-full object-cover"
        />
        {/* Gradients to blend image into background */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent"></div>
      </div>

      {/* Content */}
      <div className="absolute top-[30%] md:top-[40%] left-4 md:left-12 max-w-xl space-y-4">
        <h1 className="text-4xl md:text-6xl font-bold drop-shadow-lg text-white">
          {movie.title}
        </h1>
        <p className="text-white text-sm md:text-lg drop-shadow-md line-clamp-3">
          {movie.description}
        </p>
        
        <div className="flex items-center gap-4 mt-4">
          <button className="flex items-center gap-2 bg-white text-black px-6 md:px-8 py-2 md:py-3 rounded font-semibold hover:bg-opacity-80 transition">
            <Play className="fill-black w-5 h-5" />
            {t.play}
          </button>
          <button 
            onClick={() => onMoreInfo(movie)}
            className="flex items-center gap-2 bg-gray-500/70 text-white px-6 md:px-8 py-2 md:py-3 rounded font-semibold hover:bg-gray-500/50 transition backdrop-blur-sm"
          >
            <Info className="w-5 h-5" />
            {t.moreInfo}
          </button>
        </div>
      </div>
    </div>
  );
};