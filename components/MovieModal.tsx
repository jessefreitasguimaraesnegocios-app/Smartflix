import React, { useEffect, useState, useRef } from 'react';
import { X, Play, Plus, ThumbsUp, Check, Volume2, VolumeX } from 'lucide-react';
import { Movie } from '../types';
import { getTrailerKey, getStreamUrl } from '../services/movieService';

interface MovieModalProps {
  movie: Movie | null;
  onClose: () => void;
  language: 'en' | 'pt';
  isListed?: boolean;
  onToggleList?: (movie: Movie) => void;
  isLiked?: boolean;
  onToggleLike?: (movie: Movie) => void;
  autoPlay?: boolean;
}

export const MovieModal: React.FC<MovieModalProps> = ({ 
    movie, 
    onClose, 
    language, 
    isListed = false, 
    onToggleList,
    isLiked = false,
    onToggleLike,
    autoPlay = false
}) => {
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [isLoadingLink, setIsLoadingLink] = useState(false);
  
  // Estado para controlar a visibilidade da interface (Imersão)
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Função centralizada para iniciar o play
  const startMoviePlayback = async (m: Movie) => {
    setIsLoadingLink(true);
    const url = await getStreamUrl(m);
    setIsLoadingLink(false);
    
    if (url) {
        setStreamUrl(url); // Define a URL para tocar no iframe interno
        setShowControls(false); // Esconde a interface para focar no filme
    } else {
        alert(language === 'pt' ? "Conteúdo indisponível para streaming no momento." : "Content not available for streaming at this time.");
    }
  };

  useEffect(() => {
    if (movie) {
        // Reset state
        setShowVideo(false); 
        setTrailerKey(null);
        setIsMuted(false); 
        setShowControls(true); 
        setIsLoadingLink(false);
        setStreamUrl(null); // Reset player URL
        
        // Se autoPlay for true, iniciamos o playback diretamente
        if (autoPlay) {
            startMoviePlayback(movie);
        } else {
            // Se não, carrega o trailer (modo preview)
            getTrailerKey(movie, language).then((key) => {
                if (key) {
                    setTrailerKey(key);
                    setShowVideo(true);
                }
            });
        }
    }
  }, [movie, language, autoPlay]);

  // Handler para o botão Play do Modal
  const handlePlayClick = () => {
    if (movie) {
        startMoviePlayback(movie);
    }
  };

  // Lógica de Auto-Hide da Interface (Apenas para o Trailer)
  const handleUserActivity = () => {
    // Se estiver rodando o filme completo (streamUrl), não mostramos a overlay da interface
    // pois ela bloquearia os controles do player vidsrc
    if (streamUrl) {
        setShowControls(false); 
        return;
    }

    setShowControls(true);
    if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
    }
    // Só esconde controles se estiver tocando (trailer)
    if (showVideo && trailerKey && !streamUrl) {
        controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
        }, 1500);
    }
  };

  useEffect(() => {
    if (showVideo && trailerKey && !streamUrl) {
        controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
        }, 1500);
    }
    return () => {
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [showVideo, trailerKey, streamUrl]);

  if (!movie) return null;

  const t = {
    play: language === 'pt' ? 'Assistir' : 'Play',
    checking: language === 'pt' ? 'Carregando...' : 'Loading...',
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

  // Se estiver tocando o filme (streamUrl), mudamos o container para Tela Cheia
  const containerClasses = streamUrl 
    ? "relative bg-black w-full h-full rounded-none overflow-hidden" 
    : "relative bg-[#181818] w-full max-w-4xl rounded-lg overflow-hidden shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto no-scrollbar ring-1 ring-white/10";

  return (
    <div className={`fixed inset-0 z-[60] flex items-center justify-center ${streamUrl ? '' : 'px-4'}`}>
      <div 
        className="absolute inset-0 bg-black/80 transition-opacity backdrop-blur-sm" 
        onClick={onClose}
      ></div>

      <div className={containerClasses}>
        
        <button 
          onClick={onClose}
          className={`absolute top-4 right-4 z-50 bg-[#181818]/80 rounded-full p-2 hover:bg-white/20 transition-all duration-500 group ${showControls || streamUrl ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}
        >
          <X className="text-white w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>

        {/* Hero Media Wrapper / Video Player */}
        <div 
            className={`relative w-full bg-black group ${streamUrl ? 'h-full' : 'h-64 md:h-[500px]'}`}
            onMouseMove={handleUserActivity}
            onClick={handleUserActivity}
            onTouchStart={handleUserActivity}
        >
          {streamUrl ? (
              /* PLAYER DO FILME (VIDSRC) - TELA CHEIA */
              <iframe 
                src={streamUrl}
                className="w-full h-full absolute inset-0 z-40"
                allowFullScreen
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              ></iframe>
          ) : (
            <>
                {showVideo && trailerKey ? (
                    /* TRAILER PLAYER */
                    <iframe 
                        src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&origin=${origin}&playsinline=1&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&loop=1&playlist=${trailerKey}&enablejsapi=1&vq=hd1080`} 
                        title={movie.title}
                        className="w-full h-full absolute inset-0 pointer-events-none scale-125 md:scale-150"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                    ></iframe>
                ) : (
                    <img 
                        src={movie.backdropUrl} 
                        alt={movie.title} 
                        className="w-full h-full object-cover"
                    />
                )}
            </>
          )}

          {/* Interface Overlay (Apenas se NÃO estiver tocando o filme completo) */}
          {!streamUrl && (
              <div className={`absolute inset-0 transition-opacity duration-500 pointer-events-none ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-transparent"></div>
                  
                  <div className="absolute bottom-8 left-8 z-10 max-w-[90%] pointer-events-auto">
                    <h2 className="text-3xl md:text-5xl font-bold text-white drop-shadow-lg mb-6">{movie.title}</h2>
                    
                    <div className="flex items-center gap-3">
                      {/* Botão Play Principal */}
                      <button 
                        onClick={handlePlayClick}
                        disabled={isLoadingLink}
                        className={`bg-white text-black px-8 py-2.5 rounded font-bold hover:bg-red-600 hover:text-white transition flex items-center gap-2 text-lg ${isLoadingLink ? 'opacity-70 cursor-wait' : ''}`}
                      >
                        {isLoadingLink ? (
                            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <Play className="fill-current w-6 h-6" /> 
                        )}
                        {isLoadingLink ? t.checking : t.play}
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
          )}
        </div>

        {/* Detalhes (Ocultar se estiver tocando o filme) */}
        {!streamUrl && (
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
        )}
      </div>
    </div>
  );
};