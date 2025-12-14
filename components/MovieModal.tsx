import React, { useEffect, useState, useRef } from 'react';
import { X, Play, Plus, ThumbsUp, Check, Volume2, VolumeX } from 'lucide-react';
import { Movie } from '../types';
import { getTrailerKey } from '../services/movieService';

interface MovieModalProps {
  movie: Movie | null;
  onClose: () => void;
  language: 'en' | 'pt';
  isListed?: boolean;
  onToggleList?: (movie: Movie) => void;
  isLiked?: boolean;
  onToggleLike?: (movie: Movie) => void;
  onPlay?: (movie: Movie) => void;
}

export const MovieModal: React.FC<MovieModalProps> = ({
  movie,
  onClose,
  language,
  isListed = false,
  onToggleList,
  isLiked = false,
  onToggleLike,
  onPlay
}) => {
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  // Alterado para FALSE: Inicia com som ligado
  const [isMuted, setIsMuted] = useState(false);

  // Estado para controlar a visibilidade da interface (Imersão)
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (movie) {
      // Reset state
      setShowVideo(false);
      setTrailerKey(null);
      setIsMuted(false); // Reseta para som ligado ao abrir novo filme
      setShowControls(true); // Sempre mostra ao abrir

      getTrailerKey(movie, language).then((key) => {
        if (key) {
          setTrailerKey(key);
          setShowVideo(true);
        }
      });
    }
  }, [movie, language]);

  // Lógica de Auto-Hide da Interface
  const handleUserActivity = () => {
    // 1. Mostra os controles imediatamente ao interagir
    setShowControls(true);

    // 2. Limpa timer anterior para reiniciar contagem
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    // 3. Se o vídeo estiver rodando, ageda para esconder em 1.5s
    if (showVideo && trailerKey) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 1500);
    }
  };

  // Dispara o timer assim que o vídeo carrega pela primeira vez
  useEffect(() => {
    if (showVideo && trailerKey) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 1500);
    }
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [showVideo, trailerKey]);

  if (!movie) return null;

  const t = {
    play: language === 'pt' ? 'Assistir' : 'Play',
    match: language === 'pt' ? 'Relevância' : 'Match',
    genres: language === 'pt' ? 'Gêneros' : 'Genres',
    originalLang: language === 'pt' ? 'Idioma Original' : 'Original Language',
    totalVotes: language === 'pt' ? 'Votos Totais' : 'Total Votes',
    addList: language === 'pt' ? 'Adicionar à Lista' : 'Add to My List',
    removeList: language === 'pt' ? 'Remover da Lista' : 'Remove from My List',
    like: language === 'pt' ? 'Gostei' : 'I like this',
    unlike: language === 'pt' ? 'Remover gostei' : 'Remove like',
    unmute: language === 'pt' ? 'Ativar Som' : 'Unmute',
    mute: language === 'pt' ? 'Mudo' : 'Mute',
  };

  const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'http://localhost:3000';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/80 transition-opacity backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <div className="relative bg-[#181818] w-full max-w-4xl rounded-lg overflow-hidden shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto no-scrollbar ring-1 ring-white/10">

        {/* Botão Fechar também obedece ao fade, mas mantém hover acessível se o mouse estiver perto */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 z-20 bg-[#181818]/80 rounded-full p-2 hover:bg-white/20 transition-all duration-500 group ${showControls ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}
        >
          <X className="text-white w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>

        {/* Hero Media Wrapper - Captura movimento do mouse */}
        <div
          className="relative h-64 md:h-[500px] w-full bg-black group"
          onMouseMove={handleUserActivity}
          onClick={handleUserActivity}
          onTouchStart={handleUserActivity}
        >
          {showVideo && trailerKey ? (
            <>
              <iframe
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&origin=${origin}&playsinline=1&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&loop=1&playlist=${trailerKey}&enablejsapi=1&vq=hd2160&hd=1&quality=highres`}
                title={movie.title}
                className="w-full h-full absolute inset-0 pointer-events-none scale-125 md:scale-150"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              ></iframe>
            </>
          ) : (
            <img
              src={movie.backdropUrl}
              alt={movie.title}
              className="w-full h-full object-cover"
            />
          )}

          {/* Gradiente e Overlay de Conteúdo */}
          <div className={`absolute inset-0 transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-transparent pointer-events-none"></div>

            {/* Botões e Título - Somem se showControls for false */}
            <div className={`absolute bottom-8 left-8 z-10 max-w-[90%] transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <h2 className="text-3xl md:text-5xl font-bold text-white drop-shadow-lg mb-6">{movie.title}</h2>

              <div className="flex items-center gap-3 pointer-events-auto">
                <button
                  onClick={() => onPlay && onPlay(movie)}
                  className="bg-white text-black px-8 py-2.5 rounded font-bold hover:bg-gray-200 transition flex items-center gap-2 text-lg"
                >
                  <Play className="fill-black w-6 h-6" /> {t.play}
                </button>

                <button
                  onClick={() => onToggleList && onToggleList(movie)}
                  className="border-2 border-gray-500 rounded-full p-2.5 hover:border-white transition bg-black/40 hover:bg-black/60 backdrop-blur-md group"
                  title={isListed ? t.removeList : t.addList}
                >
                  {isListed ? (
                    <Check className="w-6 h-6 text-green-400" />
                  ) : (
                    <Plus className="w-6 h-6 text-white" />
                  )}
                </button>

                <button
                  onClick={() => onToggleLike && onToggleLike(movie)}
                  className={`border-2 rounded-full p-2.5 transition-all duration-300 bg-black/40 hover:bg-black/60 backdrop-blur-md group active:scale-90 ${isLiked ? 'border-green-500' : 'border-gray-500 hover:border-white'}`}
                  title={isLiked ? t.unlike : t.like}
                >
                  <ThumbsUp
                    className={`w-6 h-6 transition-colors duration-300 ${isLiked ? 'text-green-500 fill-green-500' : 'text-white'}`}
                  />
                </button>

                {trailerKey && (
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="border-2 border-gray-500 rounded-full p-2.5 hover:border-white transition bg-black/40 hover:bg-black/60 backdrop-blur-md group"
                    title={isMuted ? t.unmute : t.mute}
                  >
                    {isMuted ? (
                      <VolumeX className="w-6 h-6 text-white" />
                    ) : (
                      <Volume2 className="w-6 h-6 text-white" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 grid md:grid-cols-[2fr_1fr] gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm font-semibold">
              <span className="text-green-400 font-bold">{Math.round(movie.rating * 10)}% {t.match}</span>
              <span className="text-gray-300">{movie.year}</span>
              <span className="border border-gray-500 px-2 py-0.5 text-xs rounded text-gray-300">HD</span>
            </div>
            <p className="text-white leading-relaxed text-base text-gray-200">
              {movie.description}
            </p>
          </div>
          <div className="text-sm space-y-4 text-gray-400">
            <div>
              <span className="text-gray-500 block mb-1">{t.genres}:</span>
              <span className="text-white hover:underline cursor-pointer">
                {movie.genres.join(", ")}
              </span>
            </div>
            <div>
              <span className="text-gray-500 block mb-1">{t.originalLang}:</span>
              <span className="text-white">English / Português</span>
            </div>
            <div>
              <span className="text-gray-500 block mb-1">{t.totalVotes}:</span>
              <span className="text-white">{movie.rating} / 10</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};