import { Movie, CategoryRow, TvShowDetails, Episode } from '../types';

// CHAVES DE API CONFIGURADAS
const API_KEY = "8420990487db506c6935b230874e40ae"; // TMDB Key

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
 * BUSCA DE TRAILER USANDO TMDB API (Mais confiável que YouTube API)
 */
export const getTrailerKey = async (movie: Movie, lang: 'en' | 'pt'): Promise<string | null> => {
  try {
    const apiLang = lang === 'en' ? 'en-US' : 'pt-BR';
    const mediaType = movie.mediaType || 'movie';

    // Busca vídeos do TMDB (trailers, teasers, etc)
    const url = `${BASE_URL}/${mediaType}/${movie.id}/videos?api_key=${API_KEY}&language=${apiLang}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      // Prioriza trailers oficiais do YouTube
      const trailer = data.results.find((video: any) =>
        video.type === 'Trailer' &&
        video.site === 'YouTube' &&
        video.official === true
      );

      if (trailer) return trailer.key;

      // Se não encontrar trailer oficial, pega qualquer trailer
      const anyTrailer = data.results.find((video: any) =>
        video.type === 'Trailer' &&
        video.site === 'YouTube'
      );

      if (anyTrailer) return anyTrailer.key;

      // Se não encontrar trailer, pega qualquer vídeo do YouTube
      const anyVideo = data.results.find((video: any) => video.site === 'YouTube');
      if (anyVideo) return anyVideo.key;
    }

    // Fallback: tenta buscar em inglês se não encontrou no idioma atual
    if (lang === 'pt') {
      const fallbackUrl = `${BASE_URL}/${mediaType}/${movie.id}/videos?api_key=${API_KEY}&language=en-US`;
      const fallbackResponse = await fetch(fallbackUrl);
      const fallbackData = await fallbackResponse.json();

      if (fallbackData.results && fallbackData.results.length > 0) {
        const trailer = fallbackData.results.find((video: any) =>
          video.type === 'Trailer' && video.site === 'YouTube'
        );
        if (trailer) return trailer.key;

        const anyVideo = fallbackData.results.find((video: any) => video.site === 'YouTube');
        if (anyVideo) return anyVideo.key;
      }
    }
  } catch (e) {
    console.error("TMDB Videos API Error:", e);
  }

  return null;
}

export const getFeaturedContent = async (type: 'movie' | 'tv', lang: 'en' | 'pt'): Promise<Movie> => {
  await fetchGenres(lang);
  const apiLang = lang === 'en' ? 'en-US' : 'pt-BR';

  // Get current date and date from 6 months ago for recent releases
  const currentDate = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(currentDate.getMonth() - 6);

  const releaseDateGte = sixMonthsAgo.toISOString().split('T')[0];
  const releaseDateLte = currentDate.toISOString().split('T')[0];

  // Fetch trending content from the last 6 months with high ratings
  const endpoint = type === 'movie'
    ? `/discover/movie?api_key=${API_KEY}&language=${apiLang}&sort_by=popularity.desc&primary_release_date.gte=${releaseDateGte}&primary_release_date.lte=${releaseDateLte}&vote_count.gte=100`
    : `/discover/tv?api_key=${API_KEY}&language=${apiLang}&sort_by=popularity.desc&first_air_date.gte=${releaseDateGte}&first_air_date.lte=${releaseDateLte}&vote_count.gte=50`;

  const response = await fetch(`${BASE_URL}${endpoint}`);
  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    // Fallback to trending if no recent releases
    const fallbackResponse = await fetch(`${BASE_URL}/trending/${type}/week?api_key=${API_KEY}&language=${apiLang}`);
    const fallbackData = await fallbackResponse.json();
    const randomIndex = Math.floor(Math.random() * Math.min(5, fallbackData.results.length));
    return transformContent(fallbackData.results[randomIndex], lang, type);
  }

  // Pick from top 5 most popular recent releases
  const randomIndex = Math.floor(Math.random() * Math.min(5, data.results.length));
  const item = data.results[randomIndex];

  return transformContent(item, lang, type);
};

export const getContentRows = async (type: 'movie' | 'tv', lang: 'en' | 'pt'): Promise<CategoryRow[]> => {
  await fetchGenres(lang);
  const apiLang = lang === 'en' ? 'en-US' : 'pt-BR';

  // Get current year and last year for filtering
  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;

  let endpoints;

  if (type === 'movie') {
    endpoints = [
      {
        title: lang === 'pt' ? "Lançamentos 2024-2025" : "New Releases 2024-2025",
        url: `/discover/movie?api_key=${API_KEY}&language=${apiLang}&sort_by=popularity.desc&primary_release_year=${currentYear}&vote_count.gte=50`
      },
      {
        title: lang === 'pt' ? "Em Alta Hoje" : "Trending Now",
        url: `/trending/movie/week?api_key=${API_KEY}&language=${apiLang}`
      },
      {
        title: lang === 'pt' ? "Nos Cinemas" : "Now Playing",
        url: `/movie/now_playing?api_key=${API_KEY}&language=${apiLang}`
      },
      {
        title: lang === 'pt' ? "Populares de 2024" : "Popular in 2024",
        url: `/discover/movie?api_key=${API_KEY}&language=${apiLang}&sort_by=vote_average.desc&primary_release_year=${currentYear}&vote_count.gte=100`
      },
      {
        title: lang === 'pt' ? "Ação e Aventura" : "Action & Adventure",
        url: `/discover/movie?api_key=${API_KEY}&with_genres=28&language=${apiLang}&sort_by=popularity.desc&primary_release_year=${currentYear}`
      },
      {
        title: lang === 'pt' ? "Ficção Científica" : "Sci-Fi",
        url: `/discover/movie?api_key=${API_KEY}&with_genres=878&language=${apiLang}&sort_by=popularity.desc&vote_count.gte=50`
      },
      {
        title: lang === 'pt' ? "Comédia" : "Comedy",
        url: `/discover/movie?api_key=${API_KEY}&with_genres=35&language=${apiLang}&sort_by=popularity.desc&primary_release_year=${currentYear}`
      },
    ];
  } else {
    endpoints = [
      {
        title: lang === 'pt' ? "Séries Novas 2024-2025" : "New Series 2024-2025",
        url: `/discover/tv?api_key=${API_KEY}&language=${apiLang}&sort_by=popularity.desc&first_air_date_year=${currentYear}&vote_count.gte=30`
      },
      {
        title: lang === 'pt' ? "Em Alta Esta Semana" : "Trending This Week",
        url: `/trending/tv/week?api_key=${API_KEY}&language=${apiLang}`
      },
      {
        title: lang === 'pt' ? "No Ar Agora" : "On The Air",
        url: `/tv/on_the_air?api_key=${API_KEY}&language=${apiLang}`
      },
      {
        title: lang === 'pt' ? "Populares de 2024" : "Popular in 2024",
        url: `/discover/tv?api_key=${API_KEY}&language=${apiLang}&sort_by=vote_average.desc&first_air_date_year=${currentYear}&vote_count.gte=50`
      },
      {
        title: lang === 'pt' ? "Ação e Aventura" : "Action & Adventure",
        url: `/discover/tv?api_key=${API_KEY}&with_genres=10759&language=${apiLang}&sort_by=popularity.desc`
      },
      {
        title: lang === 'pt' ? "Drama" : "Drama",
        url: `/discover/tv?api_key=${API_KEY}&with_genres=18&language=${apiLang}&sort_by=popularity.desc&vote_count.gte=50`
      },
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

// Nova Função para buscar Animes
export const getAnimeRows = async (lang: 'en' | 'pt'): Promise<CategoryRow[]> => {
  await fetchGenres(lang);
  const apiLang = lang === 'en' ? 'en-US' : 'pt-BR';

  // ID 16 = Animation. Combinamos com original_language=ja para focar em Anime Japonês.
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
      const movies = data.results ? data.results.map((item: any) => transformContent(item, lang, category.type as 'movie' | 'tv')) : [];
      return { title: category.title, movies: movies }; // Não ordenamos por data aqui para manter a ordem de popularidade/votos da API
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

export const getTvDetails = async (id: string | number, lang: 'en' | 'pt'): Promise<TvShowDetails | null> => {
  const apiLang = lang === 'en' ? 'en-US' : 'pt-BR';
  try {
    const res = await fetch(`${BASE_URL}/tv/${id}?api_key=${API_KEY}&language=${apiLang}`);
    const data = await res.json();
    return {
      ...transformContent(data, lang, 'tv'),
      seasons: data.seasons || []
    };
  } catch (e) {
    console.error(e);
    return null;
  }
};

export const getSeasonEpisodes = async (tvId: string | number, seasonNumber: number, lang: 'en' | 'pt'): Promise<Episode[]> => {
  const apiLang = lang === 'en' ? 'en-US' : 'pt-BR';
  try {
    const res = await fetch(`${BASE_URL}/tv/${tvId}/season/${seasonNumber}?api_key=${API_KEY}&language=${apiLang}`);
    const data = await res.json();
    return data.episodes?.map((ep: any) => ({
      id: ep.id,
      name: ep.name,
      overview: ep.overview,
      still_path: ep.still_path ? `${POSTER_BASE_URL}${ep.still_path}` : null,
      episode_number: ep.episode_number,
      season_number: ep.season_number
    })) || [];
  } catch (e) {
    console.error(e);
    return [];
  }
};