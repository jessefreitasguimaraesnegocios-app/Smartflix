import React, { useEffect, useState, useRef } from 'react';
import { Play, Info, Volume2, VolumeX } from 'lucide-react';
import { Movie } from '../types';
import { getTrailerKey } from '../services/movieService';

interface HeroProps {
  movie: Movie | null;
  onMoreInfo: (movie: Movie) => void;
  onPlay: (movie: Movie) => void;
  language: 'en' | 'pt';
}

export const Hero: React.FC<HeroProps> = ({ movie, onMoreInfo, onPlay, language }) => {
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [showVideo, setShowVideo] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Busca o trailer quando o filme muda
  useEffect(() => {
    if (movie) {
      setTrailerKey(null);
      setShowVideo(false);
      setIsMuted(true);
      
      getTrailerKey(movie, language).then((key) => {
        if (key) {
          setTrailerKey(key);
          // Pequeno delay para garantir que o iframe carregue suavemente
          setTimeout(() => setShowVideo(true), 1000);
        }
      });
    }
  }, [movie, language]);

  if (!movie) return <div className="h-[56.25vw] bg-zinc-900 animate-pulse"></div>;

  const t = {
    play: language === 'pt' ? 'Assistir' : 'Play',
    moreInfo: language === 'pt' ? 'Mais Informações' : 'More Info',
  };

  const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'http://localhost:3000';

  return (
    <div className="relative h-[80vh] w-full overflow-hidden group">
      {/* Background Media */}
      <div className="absolute top-0 left-0 w-full h-full">
        {/* Imagem de Fundo (Sempre renderizada como base/fallback) */}
        <img 
          src={movie.backdropUrl} 
          alt={movie.title} 
          className={`w-full h-full object-cover transition-opacity duration-700 ${showVideo ? 'opacity-0' : 'opacity-100'}`}
        />

        {/* Video Player (Sobreposto) */}
        {trailerKey && (
           <div className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${showVideo ? 'opacity-100' : 'opacity-0'}`}>
              <iframe 
                ref={iframeRef}
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&origin=${origin}&playsinline=1&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&loop=1&playlist=${trailerKey}&enablejsapi=1&vq=hd1080`} 
                title="Hero Trailer"
                className="w-full h-full absolute inset-0 pointer-events-none scale-[1.35] md:scale-[1.5]" // Scale para remover barras pretas e cobrir a tela (efeito object-cover)
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                tabIndex={-1}
              ></iframe>
           </div>
        )}

        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-transparent to-transparent z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/20 to-transparent z-10"></div>
      </div>

      {/* Content */}
      <div className="absolute top-[30%] md:top-[40%] left-4 md:left-12 max-w-xl space-y-4 z-20">
        <h1 className="text-4xl md:text-6xl font-bold drop-shadow-lg text-white">
          {movie.title}
        </h1>
        <p className="text-white text-sm md:text-lg drop-shadow-md line-clamp-3 text-shadow-black">
          {movie.description}
        </p>
        
        <div className="flex items-center gap-4 mt-4">
          <button 
            onClick={() => onPlay(movie)}
            className="flex items-center gap-2 bg-white text-black px-6 md:px-8 py-2 md:py-3 rounded font-semibold hover:bg-opacity-80 transition"
          >
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

          {/* Botão de Volume (Só aparece se tiver trailer) */}
          {trailerKey && showVideo && (
            <button 
                onClick={() => setIsMuted(!isMuted)}
                className="p-3 rounded-full border border-gray-400 bg-black/30 hover:bg-white/10 hover:border-white text-white transition backdrop-blur-md"
            >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};