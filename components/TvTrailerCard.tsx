import React, { useEffect, useState, useRef } from 'react';
import { Movie } from '../types';
import { useAutoplayTrailer } from '../hooks/useAutoplayTrailer';
import { getTrailerKey } from '../services/movieService';

interface TvTrailerCardProps {
  movie: Movie;
  isFocused: boolean;
  onFocus: () => void;
  onClick: () => void;
  language: 'en' | 'pt';
  className?: string;
}

/**
 * Componente de card otimizado para TV com autoplay de trailer
 * - Mostra poster quando não está focado
 * - Autoplay de trailer quando recebe foco (após 800ms)
 * - Remove iframe quando perde foco
 */
export const TvTrailerCard: React.FC<TvTrailerCardProps> = ({
  movie,
  isFocused,
  onFocus,
  onClick,
  language,
  className = '',
}) => {
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [isLoadingTrailer, setIsLoadingTrailer] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const { shouldPlay } = useAutoplayTrailer({
    isFocused,
    trailerKey,
    delay: 800,
  });

  // Carregar trailer quando recebe foco
  useEffect(() => {
    if (isFocused && !trailerKey && !isLoadingTrailer) {
      setIsLoadingTrailer(true);
      getTrailerKey(movie, language)
        .then((key) => {
          if (key) {
            setTrailerKey(key);
          }
        })
        .finally(() => {
          setIsLoadingTrailer(false);
        });
    }
  }, [isFocused, movie, language, trailerKey, isLoadingTrailer]);

  // Limpar trailer quando perde foco
  useEffect(() => {
    if (!isFocused && trailerKey) {
      // Remover iframe após um pequeno delay para transição suave
      const timer = setTimeout(() => {
        setTrailerKey(null);
        if (iframeRef.current) {
          iframeRef.current = null;
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isFocused, trailerKey]);

  // Focar no card quando isFocused muda
  useEffect(() => {
    if (isFocused && cardRef.current) {
      cardRef.current.focus();
    }
  }, [isFocused]);

  // Handler de teclado já está no wrapper div

  const origin = typeof window !== 'undefined' && window.location.origin 
    ? window.location.origin 
    : 'http://localhost:3000';

  return (
    <div
      ref={cardRef}
      tabIndex={0}
      onFocus={onFocus}
      onClick={onClick}
      className={`
        relative min-w-[280px] h-[400px] md:min-w-[320px] md:h-[460px]
        rounded-lg overflow-hidden
        transition-all duration-300
        focus:outline-none
        ${isFocused 
          ? 'scale-110 z-20 shadow-2xl ring-4 ring-white/50' 
          : 'scale-100 z-10'
        }
        ${className}
      `}
      style={{
        transform: isFocused ? 'scale(1.1)' : 'scale(1)',
        boxShadow: isFocused 
          ? '0 0 30px rgba(255, 255, 255, 0.3), 0 0 60px rgba(255, 255, 255, 0.1)' 
          : 'none',
      }}
    >
      {/* Trailer ou Poster */}
      {shouldPlay && trailerKey ? (
        <iframe
          ref={iframeRef}
          src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&rel=0&origin=${origin}&playsinline=1&showinfo=0&iv_load_policy=3&modestbranding=1&loop=1&playlist=${trailerKey}&enablejsapi=1`}
          title={movie.title}
          className="absolute inset-0 w-full h-full pointer-events-none"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <img
          src={movie.posterUrl}
          alt={movie.title}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      )}

      {/* Overlay quando focado */}
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

      {/* Indicador de loading do trailer */}
      {isLoadingTrailer && isFocused && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};
