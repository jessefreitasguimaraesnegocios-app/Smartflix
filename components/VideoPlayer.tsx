import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronRight, SkipForward, Layers } from 'lucide-react';
import { Movie, TvShowDetails, Episode, Season } from '../types';
import { getTvDetails, getSeasonEpisodes } from '../services/movieService';

interface VideoPlayerProps {
    movie: Movie;
    onClose: () => void;
    language: 'en' | 'pt';
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ movie, onClose, language }) => {
    const [season, setSeason] = useState<number>(1);
    const [episode, setEpisode] = useState<number>(1);

    const [tvDetails, setTvDetails] = useState<TvShowDetails | null>(null);
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [seasons, setSeasons] = useState<Season[]>([]);

    const [showSeasonSelector, setShowSeasonSelector] = useState(false);
    const [loadingEpisodes, setLoadingEpisodes] = useState(false);

    const isTv = movie.mediaType === 'tv';

    // Embed Sources
    // Strategy: Server 2 (vidsrc) as primary for better performance
    const [provider, setProvider] = useState<'embed.su' | 'vidsrc' | 'superembed'>('vidsrc');

    useEffect(() => {
        if (isTv) {
            loadTvDetails();
        }
    }, [movie.id]);

    useEffect(() => {
        if (isTv && tvDetails) {
            loadEpisodes(season);
        }
    }, [season, tvDetails]);

    const loadTvDetails = async () => {
        const details = await getTvDetails(movie.id, language);
        if (details) {
            setTvDetails(details);
            setSeasons(details.seasons.filter(s => s.season_number > 0)); // Filter out Specials (S0) usually
        }
    };

    const loadEpisodes = async (seasonNum: number) => {
        setLoadingEpisodes(true);
        const eps = await getSeasonEpisodes(movie.id, seasonNum, language);
        setEpisodes(eps);
        setLoadingEpisodes(false);
    };

    const handleNextEpisode = () => {
        const currentEpIndex = episodes.findIndex(e => e.episode_number === episode);
        if (currentEpIndex >= 0 && currentEpIndex < episodes.length - 1) {
            setEpisode(episodes[currentEpIndex + 1].episode_number);
        } else {
            // Try next season
            const currentSeasonIndex = seasons.findIndex(s => s.season_number === season);
            if (currentSeasonIndex >= 0 && currentSeasonIndex < seasons.length - 1) {
                setSeason(seasons[currentSeasonIndex + 1].season_number);
                setEpisode(1);
            }
        }
    };

    const getEmbedUrl = () => {
        switch (provider) {
            case 'embed.su':
                return isTv
                    ? `https://embed.su/embed/tv/${movie.id}/${season}/${episode}`
                    : `https://embed.su/embed/movie/${movie.id}`;
            case 'vidsrc':
                return isTv
                    ? `https://vidsrc.xyz/embed/tv/${movie.id}/${season}-${episode}`
                    : `https://vidsrc.xyz/embed/movie/${movie.id}`;
            case 'superembed':
                // superembed usually handles lang via args or internal
                return isTv
                    ? `https://multiembed.mov/directstream.php?video_id=${movie.id}&tmdb=1&s=${season}&e=${episode}`
                    : `https://multiembed.mov/directstream.php?video_id=${movie.id}&tmdb=1`;
            default:
                return '';
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
            {/* Header Controls */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                <div className="pointer-events-auto flex items-center space-x-4">
                    <button onClick={onClose} className="bg-zinc-800/50 hover:bg-zinc-700 p-2 rounded-full text-white backdrop-blur-sm transition">
                        <X size={24} />
                    </button>
                    <div className="text-white drop-shadow-md">
                        <h1 className="font-bold text-lg md:text-xl line-clamp-1">{movie.title}</h1>
                        {isTv && <p className="text-sm text-gray-300">S{season}:E{episode}</p>}
                    </div>
                </div>

                <div className="pointer-events-auto flex space-x-2">
                    {isTv && (
                        <button
                            onClick={() => setShowSeasonSelector(!showSeasonSelector)}
                            className="flex items-center space-x-2 bg-zinc-800/80 hover:bg-zinc-700 px-4 py-2 rounded text-white text-sm backdrop-blur-sm transition"
                        >
                            <Layers size={16} />
                            <span>{language === 'pt' ? 'Episódios' : 'Episodes'}</span>
                        </button>
                    )}

                    {/* Source Switcher - Hidden in obscure menu usually, but let's make it accessible for debug/utility */}
                    <select
                        value={provider}
                        onChange={(e) => setProvider(e.target.value as any)}
                        className="bg-black/50 text-xs text-gray-400 border border-gray-700 rounded px-2"
                    >
                        <option value="embed.su">Server 1 (Multi-Lang)</option>
                        <option value="vidsrc">Server 2 (Fast)</option>
                        <option value="superembed">Server 3 (Backup)</option>
                    </select>
                </div>
            </div>

            {/* Main Player */}
            <div className="flex-1 w-full h-full bg-black relative">
                <iframe
                    key={`${provider}-${movie.id}-${season}-${episode}`} // Force reload on change
                    src={getEmbedUrl()}
                    width="100%"
                    height="100%"
                    allowFullScreen
                    allow="autoplay; encrypted-media; picture-in-picture"
                    className="w-full h-full border-none"
                    title="Video Player"
                />
            </div>

            {/* Episode Selector Overlay */}
            {showSeasonSelector && isTv && (
                <div className="absolute top-16 right-4 w-80 max-h-[80vh] bg-zinc-900/95 border border-zinc-700 rounded-lg shadow-2xl flex flex-col z-20 backdrop-blur-md">
                    <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                        <span className="font-bold text-white">
                            {language === 'pt' ? 'Temporadas' : 'Seasons'}
                        </span>
                        <button onClick={() => setShowSeasonSelector(false)}><X size={16} className="text-gray-400" /></button>
                    </div>

                    {/* Season Tabs */}
                    <div className="flex overflow-x-auto p-2 space-x-2 border-b border-zinc-800 scrollbar-hide">
                        {seasons.map(s => (
                            <button
                                key={s.id}
                                onClick={() => setSeason(s.season_number)}
                                className={`px-3 py-1 rounded text-sm whitespace-nowrap transition ${season === s.season_number ? 'bg-red-600 text-white' : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700'}`}
                            >
                                {s.name}
                            </button>
                        ))}
                    </div>

                    {/* Episode List */}
                    <div className="overflow-y-auto flex-1 p-2 space-y-1">
                        {loadingEpisodes ? (
                            <div className="text-center py-8 text-gray-500">Loading...</div>
                        ) : (
                            episodes.map(ep => (
                                <button
                                    key={ep.id}
                                    onClick={() => {
                                        setEpisode(ep.episode_number);
                                        setShowSeasonSelector(false);
                                    }}
                                    className={`w-full text-left p-2 rounded flex items-start space-x-3 hover:bg-zinc-800 transition group ${ep.episode_number === episode ? 'bg-zinc-800 ring-1 ring-red-500' : ''}`}
                                >
                                    <div className="flex-shrink-0 w-24 aspect-video bg-zinc-800 rounded overflow-hidden relative">
                                        {ep.still_path ? (
                                            <img src={ep.still_path} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-zinc-600">No Img</div>
                                        )}
                                        <div className="absolute top-1 left-1 bg-black/60 px-1 rounded text-xs text-white">
                                            {ep.episode_number}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0 py-1">
                                        <h4 className={`text-sm font-medium truncate ${ep.episode_number === episode ? 'text-red-400' : 'text-gray-200 group-hover:text-white'}`}>
                                            {ep.name}
                                        </h4>
                                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">{ep.overview}</p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Next Episode Button (Bottom Right) */}
            {isTv && (
                <div className="absolute bottom-8 right-8 z-20">
                    <button
                        onClick={handleNextEpisode}
                        className="bg-white text-black px-6 py-3 rounded font-bold flex items-center space-x-2 hover:bg-gray-200 transition shadow-lg"
                    >
                        <span>{language === 'pt' ? 'Próximo Ep.' : 'Next Ep.'}</span>
                        <SkipForward size={20} fill="currentColor" />
                    </button>
                </div>
            )}
        </div>
    );
};
