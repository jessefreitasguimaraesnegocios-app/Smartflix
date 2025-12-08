import React, { useEffect, useState, useRef } from 'react';
import { X, Play, Plus, ThumbsUp, Check, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';
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
  // Estado para controlar se o player está ocupando a tela toda ou modo janela
  const [isMaximized, setIsMaximized] = useState(false);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenButtonRef = useRef<HTMLButtonElement>(null);

  // Verificar se é dispositivo móvel
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Função para ativar/desativar tela cheia real do navegador
  const toggleFullscreen = async () => {
    if (!videoContainerRef.current) return;
    
    if (!document.fullscreenElement) {
      try {
        await videoContainerRef.current.requestFullscreen();
        setIsFullscreen(true);
        setIsMaximized(true);
      } catch (err) {
        console.error('Erro ao entrar em tela cheia:', err);
        // Fallback para modo CSS maximizado
        setIsFullscreen(true);
        setIsMaximized(true);
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
        setIsMaximized(false);
      } catch (err) {
        console.error('Erro ao sair da tela cheia:', err);
        // Fallback para modo CSS normal
        setIsFullscreen(false);
        setIsMaximized(false);
      }
    }
  };

  // Efeito para lidar com a mudança de orientação no mobile
  useEffect(() => {
    const handleOrientationChange = () => {
      if (isFullscreen && isMobile) {
        // Forçar o redimensionamento no mobile
        setTimeout(() => {
          if (videoContainerRef.current) {
            videoContainerRef.current.style.width = '100%';
            videoContainerRef.current.style.height = '100%';
          }
        }, 100);
      }
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, [isFullscreen, isMobile]);

  // Detectar mudanças de tela cheia do navegador
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      setIsMaximized(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const handleCloseModal = () => {
    const exit =
      (document as any).exitFullscreen ||
      (document as any).webkitExitFullscreen ||
      (document as any).msExitFullscreen;

    if (document.fullscreenElement && exit) {
      try {
        exit.call(document);
      } catch (err) {
        console.error('Erro ao sair da tela cheia ao fechar:', err);
      }
    }

    onClose();
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
        setIsMaximized(false); // Reset maximize state
        
        if (autoPlay) {
            // Se autoPlay for true, ignoramos o trailer e iniciamos o carregamento do link direto
            setIsLoadingLink(true);
            getStreamUrl(movie).then(url => {
                 setIsLoadingLink(false);
                 if (url) {
                    setStreamUrl(url);
                    setIsMaximized(true); // Auto maximize on play
                    setShowControls(false);
                 }
            });
        } else {
            // Carrega o trailer (modo preview) se não for autoplay
            getTrailerKey(movie, language).then((key) => {
                if (key) {
                    setTrailerKey(key);
                    setShowVideo(true);
                }
            });
        }
    }
  }, [movie, language, autoPlay]);

  // Função para dar Play no filme/série
  const handlePlayClick = async () => {
    if (!movie) return;
    setIsLoadingLink(true);
    
    // Busca a URL usando vidsrc
    const url = await getStreamUrl(movie);
    
    setIsLoadingLink(false);
    
    if (url) {
        setStreamUrl(url); // Define a URL para tocar no iframe interno
        setIsMaximized(true); // Maximiza automaticamente ao dar play
        setShowControls(false); // Esconde a interface para focar no filme
    } else {
        alert(language === 'pt' ? "Conteúdo indisponível para streaming no momento." : "Content not available for streaming at this time.");
    }
  };

  // Lógica de Auto-Hide da Interface (Apenas para o Trailer)
  const handleUserActivity = () => {
    // Se estiver rodando o filme completo (streamUrl), não mostramos a overlay da interface
    // pois ela bloquearia os controles do player vidsrc.
    // MAS, precisamos mostrar os botões de fechar/minimizar.
    if (streamUrl) {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
        }, 1500); // Esconde controles após 1.5s também no player completo
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
    minimize: language === 'pt' ? 'Minimizar Tela' : 'Minimize Screen',
    maximize: language === 'pt' ? 'Tela Cheia' : 'Full Screen',
  };

  const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'http://localhost:3000';

  // Lógica de CSS Dinâmico
  let containerClasses = "relative bg-[#181818] w-full max-w-4xl rounded-lg overflow-hidden shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto no-scrollbar ring-1 ring-white/10";
  
  if (streamUrl) {
      if (isMaximized) {
          // Modo Cinema Total
          containerClasses = "relative bg-black w-full h-full rounded-none overflow-hidden";
      } else {
          // Modo Janela (Player rodando, mas em janela menor)
          containerClasses = "relative bg-black w-full max-w-5xl aspect-video rounded-lg overflow-hidden shadow-2xl border border-gray-800";
      }
  }

  return (
    <div className={`fixed inset-0 z-[60] flex items-center justify-center ${streamUrl && isMaximized ? '' : 'px-4'}`}>
      <div 
        className="absolute inset-0 bg-black/80 transition-opacity backdrop-blur-sm" 
        onClick={handleCloseModal}
      ></div>

      <div 
        className={containerClasses} 
        ref={videoContainerRef}
        style={isFullscreen ? {
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 9999,
          backgroundColor: '#000',
          margin: 0,
          padding: 0,
          borderRadius: 0
        } : {}}
      >
        
        {/* Controles Superiores (Fechar e Maximizar/Minimizar) - apenas quando NÃO está tocando o filme */}
        <div className={`absolute top-4 right-4 z-50 flex items-center gap-3 transition-opacity duration-500 ${showControls || !streamUrl ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
            {!streamUrl && (
              <>
                <button 
                  ref={fullscreenButtonRef}
                  onClick={toggleFullscreen}
                  className="bg-[#181818]/80 rounded-full p-2 hover:bg-white/20 transition-all group border border-white/10"
                  title={isMaximized ? t.minimize : t.maximize}
                  aria-label={isMaximized ? t.minimize : t.maximize}
                >
                  {isMaximized ? (
                    <Minimize className="text-white w-6 h-6 group-hover:scale-110 transition-transform" />
                  ) : (
                    <Maximize className="text-white w-6 h-6 group-hover:scale-110 transition-transform" />
                  )}
                </button>

                <button 
                  onClick={handleCloseModal}
                  className="bg-[#181818]/80 rounded-full p-2 hover:bg-white/20 transition-all group border border-white/10"
                >
                  <X className="text-white w-6 h-6 group-hover:scale-110 transition-transform" />
                </button>
              </>
            )}
        </div>

        {/* Hero Media Wrapper / Video Player */}
        <div 
            className={`relative w-full bg-black group ${streamUrl ? 'h-full' : 'h-64 md:h-[500px]'}`}
            onMouseMove={handleUserActivity}
            onClick={handleUserActivity}
            onTouchStart={handleUserActivity}
        >
          {streamUrl ? (
              /* PLAYER DO FILME (VIDSRC) */
              <div className="relative w-full h-full">
                <div className="absolute inset-0 z-40">
                  <iframe 
                    src={streamUrl}
                    className="w-full h-full"
                    allowFullScreen
                    allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                    title="Video Player"
                    webkitallowfullscreen
                    mozallowfullscreen
                    playsInline
                  ></iframe>
                </div>
                
                {/* Overlays para bloquear cliques em anúncios:
                    - parte de CIMA e parte de BAIXO bloqueadas
                    - faixa CENTRAL livre para clicar no play do player */}
                {/* Topo */}
                <div 
                  className="absolute top-0 left-0 right-0 h-1/3 z-50 pointer-events-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUserActivity();
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    handleUserActivity();
                  }}
                  style={{
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation'
                  }}
                ></div>

                {/* Parte de baixo, deixando a barra do player quase toda livre (só bloqueia uma faixa acima) */}
                <div 
                  className="absolute bottom-14 left-0 right-0 h-1/3 z-50 pointer-events-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUserActivity();
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    handleUserActivity();
                  }}
                  style={{
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation'
                  }}
                ></div>

                {/* Botão X sempre visível no canto superior direito */}
                <div className="absolute top-4 right-4 z-50 pointer-events-auto">
                  <button 
                    onClick={handleCloseModal}
                    className="bg-black/80 rounded-full p-3 hover:bg-red-600 transition-all group border border-white/20"
                    aria-label="Fechar"
                  >
                    <X className="text-white w-6 h-6 group-hover:scale-110 transition-transform" />
                  </button>
                </div>

                                
                {/* Overlay de controles personalizados */}
                {isMobile && (
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-60">
                    <div className="flex justify-end">
                      <button 
                        onClick={toggleFullscreen}
                        className="p-2 text-white"
                        aria-label={isFullscreen ? t.minimize : t.maximize}
                      >
                        {isFullscreen ? (
                          <Minimize className="w-6 h-6" />
                        ) : (
                          <Maximize className="w-6 h-6" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
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