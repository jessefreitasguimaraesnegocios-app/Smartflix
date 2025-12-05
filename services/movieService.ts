import { Movie, CategoryRow } from '../types';

// CHAVES DE API CONFIGURADAS
const API_KEY = "8420990487db506c6935b230874e40ae"; // TMDB Key
const YOUTUBE_API_KEY = "AIzaSyDiJW0gjyZvOa0P32oXkouWatH3DfuPTpk"; // YouTube Data API v3 Key

const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/original";
const POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500";

// Cache for genres to map IDs to Names, separated by language
let genreCache: Record<string, Record<number, string>> = {
  en: {},
  pt: {}
};

/**
 * Fetches both Movie and TV genres to populate the cache for a specific language.
 */
const fetchGenres = async (lang: 'en' | 'pt') => {
  if (Object.keys(genreCache[lang]).length > 0) return;

  const apiLang = lang === 'en' ? 'en-US' : 'pt-BR';

  try {
    const [movieRes, tvRes] = await Promise.all([
      fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=${apiLang}`),
      fetch(`${BASE_URL}/genre/tv/list?api_key=${API_KEY}&language=${apiLang}`)
    ]);

    const movieData = await movieRes.json();
    const tvData = await tvRes.json();

    const allGenres = [...(movieData.genres || []), ...(tvData.genres || [])];
    
    allGenres.forEach((g: any) => {
      genreCache[lang][g.id] = g.name;
    });
  } catch (error) {
    console.error("Error fetching genres:", error);
  }
};

/**
 * Transforms a raw TMDB result into our app's Movie interface.
 */
const transformContent = (result: any, lang: 'en' | 'pt', fallbackType?: 'movie' | 'tv'): Movie => {
  const currentGenreCache = genreCache[lang] || {};
  
  const genreNames = result.genre_ids
    ? result.genre_ids.map((id: number) => currentGenreCache[id]).filter(Boolean)
    : [];

  const releaseDate = result.release_date || result.first_air_date || "";
  const displayDate = releaseDate || "2024-01-01";

  let mediaType: 'movie' | 'tv' = result.media_type;
  if (!mediaType && fallbackType) mediaType = fallbackType;
  if (!mediaType) mediaType = result.title ? 'movie' : 'tv';

  return {
    id: result.id,
    title: result.title || result.name || result.original_name,
    description: result.overview || (lang === 'pt' ? "Sem descrição disponível." : "No description available."),
    backdropUrl: result.backdrop_path 
      ? `${IMAGE_BASE_URL}${result.backdrop_path}` 
      : 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=1920&q=80',
    posterUrl: result.poster_path 
      ? `${POSTER_BASE_URL}${result.poster_path}` 
      : 'https://via.placeholder.com/300x450?text=No+Poster',
    rating: result.vote_average ? Number(result.vote_average.toFixed(1)) : 0,
    year: parseInt(displayDate.substring(0, 4)) || 0,
    releaseDate: releaseDate,
    genres: genreNames.length > 0 ? genreNames : ["Anime"],
    mediaType: mediaType
  };
};

const sortByDateDesc = (movies: Movie[]): Movie[] => {
  return movies.sort((a, b) => {
    const dateA = new Date(a.releaseDate || '1900-01-01').getTime();
    const dateB = new Date(b.releaseDate || '1900-01-01').getTime();
    return dateB - dateA;
  });
};

/**
 * BUSCA DE TRAILER NO YOUTUBE
 */
export const getTrailerKey = async (movie: Movie, lang: 'en' | 'pt'): Promise<string | null> => {
    try {
        const langTerm = lang === 'pt' ? 'trailer oficial' : 'official trailer';
        const cleanTitle = movie.title.replace(/[^\w\s\-\:]/gi, '');
        const searchQuery = `${cleanTitle} ${langTerm}`;
        
        // Prioritize embeddable videos to avoid Error 153
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&videoEmbeddable=true&maxResults=1&key=${YOUTUBE_API_KEY}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.items && data.items.length > 0) {
            return data.items[0].id.videoId;
        } 
    } catch (e) {
        console.error("YouTube API Error:", e);
    }
    
    return null;
}

/**
 * GERA URL DE STREAMING (VIDSRC.XYZ)
 * Gera o link embed direto para reprodução no player interno.
 * Adicionado parâmetro ds_lang=pt para priorizar áudio em Português (Dublado).
 */
export const getStreamUrl = async (movie: Movie): Promise<string | null> => {
    try {
        const type = movie.mediaType || 'movie';
        
        // ds_lang=pt tenta forçar o áudio em português (dublado)
        if (type === 'tv') {
            return `https://vidsrc.xyz/embed/tv?tmdb=${movie.id}&season=1&episode=1&ds_lang=pt`;
        } else {
            return `https://vidsrc.xyz/embed/movie?tmdb=${movie.id}&ds_lang=pt`;
        }

    } catch (error) {
        console.error("Stream Link generation error:", error);
        return null;
    }
};

export const getFeaturedContent = async (type: 'movie' | 'tv', lang: 'en' | 'pt'): Promise<Movie> => {
  await fetchGenres(lang);
  const apiLang = lang === 'en' ? 'en-US' : 'pt-BR';

  const response = await fetch(`${BASE_URL}/trending/${type}/day?api_key=${API_KEY}&language=${apiLang}`);
  const data = await response.json();
  
  if (!data.results || data.results.length === 0) {
    throw new Error("No featured content found");
  }

  const randomIndex = Math.floor(Math.random() * Math.min(10, data.results.length));
  const item = data.results[randomIndex];

  return transformContent(item, lang, type);
};

export const getContentRows = async (type: 'movie' | 'tv', lang: 'en' | 'pt'): Promise<CategoryRow[]> => {
  await fetchGenres(lang);
  const apiLang = lang === 'en' ? 'en-US' : 'pt-BR';

  let endpoints;

  if (type === 'movie') {
    endpoints = [
      { title: lang === 'pt' ? "Filmes em Alta Hoje" : "Trending Movies Today", url: `/trending/movie/day?api_key=${API_KEY}&language=${apiLang}` },
      { title: lang === 'pt' ? "Nos Cinemas" : "Now Playing in Theaters", url: `/movie/now_playing?api_key=${API_KEY}&language=${apiLang}` },
      { title: lang === 'pt' ? "Melhores Avaliados" : "Top Rated", url: `/movie/top_rated?api_key=${API_KEY}&language=${apiLang}` },
      { title: lang === 'pt' ? "Ação" : "Action", url: `/discover/movie?api_key=${API_KEY}&with_genres=28&language=${apiLang}` },
      { title: lang === 'pt' ? "Comédia" : "Comedy", url: `/discover/movie?api_key=${API_KEY}&with_genres=35&language=${apiLang}` },
      { title: lang === 'pt' ? "Terror" : "Horror", url: `/discover/movie?api_key=${API_KEY}&with_genres=27&language=${apiLang}` },
    ];
  } else {
    endpoints = [
      { title: lang === 'pt' ? "Séries em Alta Hoje" : "Trending Series Today", url: `/trending/tv/day?api_key=${API_KEY}&language=${apiLang}` },
      { title: lang === 'pt' ? "No Ar Agora" : "On The Air Now", url: `/tv/on_the_air?api_key=${API_KEY}&language=${apiLang}` },
      { title: lang === 'pt' ? "Melhores Avaliadas" : "Top Rated Shows", url: `/tv/top_rated?api_key=${API_KEY}&language=${apiLang}` },
      { title: lang === 'pt' ? "Ação e Aventura" : "Action & Adventure", url: `/discover/tv?api_key=${API_KEY}&with_genres=10759&language=${apiLang}` },
      { title: lang === 'pt' ? "Comédia" : "Comedy", url: `/discover/tv?api_key=${API_KEY}&with_genres=35&language=${apiLang}` },
    ];
  }

  const categoryPromises = endpoints.map(async (category) => {
    try {
      const res = await fetch(`${BASE_URL}${category.url}`);
      const data = await res.json();
      const movies = data.results ? data.results.map((item: any) => transformContent(item, lang, type)) : [];
      return { title: category.title, movies: sortByDateDesc(movies) };
    } catch (error) {
      return { title: category.title, movies: [] };
    }
  });

  const rows = await Promise.all(categoryPromises);
  return rows.filter(row => row.movies.length > 0);
};

export const getAnimeRows = async (lang: 'en' | 'pt'): Promise<CategoryRow[]> => {
  await fetchGenres(lang);
  const apiLang = lang === 'en' ? 'en-US' : 'pt-BR';

  const endpoints = [
    { title: lang === 'pt' ? "Animes em Alta" : "Trending Anime", url: `/discover/tv?api_key=${API_KEY}&language=${apiLang}&with_genres=16&with_original_language=ja&sort_by=popularity.desc`, type: 'tv' },
    { title: lang === 'pt' ? "Filmes de Anime" : "Anime Movies", url: `/discover/movie?api_key=${API_KEY}&language=${apiLang}&with_genres=16&with_original_language=ja&sort_by=popularity.desc`, type: 'movie' },
    { title: lang === 'pt' ? "Animes de Ação" : "Action Anime", url: `/discover/tv?api_key=${API_KEY}&language=${apiLang}&with_genres=16,10759&with_original_language=ja&sort_by=vote_count.desc`, type: 'tv' },
    { title: lang === 'pt' ? "Animes de Fantasia" : "Fantasy Anime", url: `/discover/tv?api_key=${API_KEY}&language=${apiLang}&with_genres=16,10765&with_original_language=ja&sort_by=vote_count.desc`, type: 'tv' },
    { title: lang === 'pt' ? "Clássicos" : "Classics", url: `/discover/tv?api_key=${API_KEY}&language=${apiLang}&with_genres=16&with_original_language=ja&sort_by=vote_average.desc&vote_count.gte=100`, type: 'tv' },
  ];

  const categoryPromises = endpoints.map(async (category) => {
    try {
      const res = await fetch(`${BASE_URL}${category.url}`);
      const data = await res.json();
      const movies = data.results ? data.results.map((item: any) => transformContent(item, lang, category.type as 'movie'|'tv')) : [];
      return { title: category.title, movies: movies }; 
    } catch (error) {
      return { title: category.title, movies: [] };
    }
  });

  const rows = await Promise.all(categoryPromises);
  return rows.filter(row => row.movies.length > 0);
};

export const searchContent = async (query: string, lang: 'en' | 'pt'): Promise<Movie[]> => {
  if (!query) return [];
  await fetchGenres(lang);
  const apiLang = lang === 'en' ? 'en-US' : 'pt-BR';
  
  try {
    const response = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&language=${apiLang}&query=${encodeURIComponent(query)}&page=1&include_adult=false`);
    const data = await response.json();
    
    if (!data.results) return [];

    const filtered = data.results.filter((item: any) => 
      (item.media_type === 'movie' || item.media_type === 'tv') && item.poster_path
    );

    const mapped = filtered.map((item: any) => transformContent(item, lang));
    return sortByDateDesc(mapped);
  } catch (error) {
    return [];
  }
}