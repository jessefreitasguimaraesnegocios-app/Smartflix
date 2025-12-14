import React, { useEffect, useState } from 'react';
import { Play, Info, Volume2, VolumeX } from 'lucide-react';
import { Movie } from '../types';
import { getTrailerKey } from '../services/movieService';

interface HeroProps {
  movie: Movie | null;
  onMoreInfo: (movie: Movie) => void;
  onPlay: (movie: Movie) => void;
  language: 'en' | 'pt';
  shouldPause?: boolean;
}

export const Hero: React.FC<HeroProps> = ({ movie, onMoreInfo, onPlay, language, shouldPause = false }) => {
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    if (movie) {
      setShowVideo(false);
      setTrailerKey(null);
      setShowControls(true);

      getTrailerKey(movie, language).then((key) => {
        if (key) {
          setTrailerKey(key);
          setTimeout(() => setShowVideo(true), 500);
        }
      });
    }
  }, [movie, language]);

  // Mute video when modal is open
  useEffect(() => {
    if (shouldPause) {
      setIsMuted(true);
    }
  }, [shouldPause]);

  // Auto-hide controls after 2 seconds
  useEffect(() => {
    if (showVideo && trailerKey) {
      const timer = setTimeout(() => {
        setShowControls(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [showVideo, trailerKey]);

  // Show controls on user interaction
  const handleUserInteraction = () => {
    setShowControls(true);
  };

  if (!movie) return <div className="h-[56.25vw] bg-zinc-900 animate-pulse"></div>;

  const t = {
    play: language === 'pt' ? 'Assistir' : 'Play',
    moreInfo: language === 'pt' ? 'Mais Informações' : 'More Info',
  };

  const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'http://localhost:3000';

  return (
    <div
      className="relative h-[80vh] w-full overflow-hidden"
      onClick={handleUserInteraction}
      onMouseMove={handleUserInteraction}
    >
      {/* Background Video or Image */}
      <div className="absolute top-0 left-0 w-full h-full">
        {showVideo && trailerKey ? (
          <div className="relative w-full h-full">
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&loop=1&playlist=${trailerKey}&enablejsapi=1&origin=${origin}&vq=hd2160&hd=1&quality=highres&playsinline=1`}
              title={movie.title}
              className="absolute top-1/2 left-1/2 w-[177.77vh] h-[56.25vw] min-h-full min-w-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              style={{ border: 'none' }}
            />
          </div>
        ) : (
          <img
            src={movie.backdropUrl}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
        )}

        {/* Gradients to blend into background */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#141414]/60 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/20 to-transparent"></div>
      </div>

      {/* Content - Positioned at bottom */}
      <div
        className={`absolute bottom-[15%] left-4 md:left-12 max-w-2xl space-y-4 z-10 transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'
          }`}
      >
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold drop-shadow-2xl text-white">
          {movie.title}
        </h1>
        <p className="text-white text-sm md:text-base lg:text-lg drop-shadow-lg line-clamp-3 max-w-xl">
          {movie.description}
        </p>

        <div className="flex items-center gap-3 md:gap-4 mt-6">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay(movie);
            }}
            className="flex items-center gap-2 bg-white text-black px-6 md:px-8 py-2 md:py-3 rounded font-semibold hover:bg-opacity-80 transition shadow-lg"
          >
            <Play className="fill-black w-5 h-5" />
            {t.play}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoreInfo(movie);
            }}
            className="flex items-center gap-2 bg-gray-500/70 text-white px-6 md:px-8 py-2 md:py-3 rounded font-semibold hover:bg-gray-500/50 transition backdrop-blur-sm shadow-lg"
          >
            <Info className="w-5 h-5" />
            {t.moreInfo}
          </button>

          {/* Mute/Unmute Button */}
          {showVideo && trailerKey && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted(!isMuted);
              }}
              className="border-2 border-white/60 rounded-full p-2 md:p-3 hover:bg-white/20 transition bg-black/30 backdrop-blur-sm shadow-lg"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};