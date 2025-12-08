import { Movie, CategoryRow } from '../types';

// ===============================
// CONFIGURAÇÃO DAS API KEYS
// ===============================
const API_KEY = "8420990487db506c6935b230874e40ae";      // TMDB Key
const YOUTUBE_API_KEY = "AIzaSyDiJW0gjyZvOa0P32oXkouWatH3DfuPTpk"; // YouTube v3 Key

const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/original";
const POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500";

// Cache separado por idioma
const genreCache: Record<string, Record<number, string>> = {
  en: {},
  pt: {},
};

// ===============================
// BUSCA DE GÊNEROS (Movie e TV)
// ===============================
const fetchGenres = async (lang: "en" | "pt") => {
  if (Object.keys(genreCache[lang]).length > 0) return;

  const apiLang = lang === "en" ? "en-US" : "pt-BR";

  try {
    const [movieRes, tvRes] = await Promise.all([
      fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=${apiLang}`),
      fetch(`${BASE_URL}/genre/tv/list?api_key=${API_KEY}&language=${apiLang}`),
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

// ===============================
// TRANSFORMA RESULTADO EM MOVIE
// ===============================
const transformContent = (
  result: any,
  lang: "en" | "pt",
  fallbackType?: "movie" | "tv"
): Movie => {
  const gcache = genreCache[lang] || {};

  const genreNames = result.genre_ids
    ? result.genre_ids.map((id: number) => gcache[id]).filter(Boolean)
    : [];

  const releaseDate = result.release_date || result.first_air_date || "";
  const displayDate = releaseDate || "2024-01-01";

  let mediaType: "movie" | "tv" = result.media_type;
  if (!mediaType && fallbackType) mediaType = fallbackType;
  if (!mediaType) mediaType = result.title ? "movie" : "tv";

  return {
    id: result.id,
    title: result.title || result.name || result.original_name,
    description:
      result.overview ||
      (lang === "pt"
        ? "Sem descrição disponível."
        : "No description available."),
    backdropUrl: result.backdrop_path
      ? `${IMAGE_BASE_URL}${result.backdrop_path}`
      : "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=1920&q=80",
    posterUrl: result.poster_path
      ? `${POSTER_BASE_URL}${result.poster_path}`
      : "https://via.placeholder.com/300x450?text=No+Poster",
    rating: result.vote_average ? Number(result.vote_average.toFixed(1)) : 0,
    year: parseInt(displayDate.substring(0, 4)) || 0,
    releaseDate: releaseDate,
    genres: genreNames.length > 0 ? genreNames : ["Anime"],
    mediaType,
  };
};

// ===============================
// ORDENAR POR DATA DESC
// ===============================
const sortByDateDesc = (movies: Movie[]): Movie[] => {
  return movies.sort((a, b) => {
    const da = new Date(a.releaseDate || "1900-01-01").getTime();
    const db = new Date(b.releaseDate || "1900-01-01").getTime();
    return db - da;
  });
};

// ===============================
// HELPER: BUSCAR VÁRIAS PÁGINAS
// ===============================
const fetchTmdbPages = async (
  baseUrl: string,
  pages: number
): Promise<any[]> => {
  const results: any[] = [];

  for (let page = 1; page <= pages; page++) {
    try {
      const res = await fetch(`${baseUrl}&page=${page}`);
      const data = await res.json();
      if (Array.isArray(data.results)) {
        results.push(...data.results);
      }
    } catch {
      // Ignora erro dessa página específica e continua
    }
  }

  return results;
};

// ===============================
// BUSCA DE TRAILER (YouTube + TMDB)
// ===============================
export const getTrailerKey = async (
  movie: Movie,
  lang: "en" | "pt"
): Promise<string | null> => {
  // 1. Tentativa — YouTube API
  try {
    const langTerm = lang === "pt" ? "trailer oficial" : "official trailer";
    const cleanTitle = movie.title.replace(/[^\w\s\-\:]/gi, "");
    const searchQuery = `${cleanTitle} ${langTerm}`;

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
      searchQuery
    )}&type=video&videoEmbeddable=true&maxResults=1&key=${YOUTUBE_API_KEY}`;

    const res = await fetch(url);

    if (res.ok) {
      const data = await res.json();
      if (data.items?.length > 0) return data.items[0].id.videoId;
    } else {
      console.warn("YouTube quota error, using TMDB fallback");
    }
  } catch (err) {
    console.warn("YouTube failed, using fallback:", err);
  }

  // 2. Tentativa — TMDB
  try {
    const type = movie.mediaType || "movie";
    const apiLang = lang === "en" ? "en-US" : "pt-BR";

    let res = await fetch(
      `${BASE_URL}/${type}/${movie.id}/videos?api_key=${API_KEY}&language=${apiLang}`
    );
    let data = await res.json();

    let trailer = data.results?.find(
      (v: any) =>
        v.site === "YouTube" &&
        (v.type === "Trailer" || v.type === "Teaser")
    );

    if (!trailer && lang !== "en") {
      res = await fetch(
        `${BASE_URL}/${type}/${movie.id}/videos?api_key=${API_KEY}&language=en-US`
      );
      data = await res.json();

      trailer = data.results?.find(
        (v: any) => v.site === "YouTube" && v.type === "Trailer"
      );
    }

    if (trailer) return trailer.key;

  } catch (err) {
    console.error("Fallback TMDB failed:", err);
  }

  return null;
};

// ===============================
// GERAR LINK DE STREAMING
// ===============================
export const getStreamUrl = async (movie: Movie): Promise<string | null> => {
  try {
    const type = movie.mediaType || "movie";

    if (type === "tv") {
      return `https://vidsrc.xyz/embed/tv?tmdb=${movie.id}&season=1&episode=1&ds_lang=pt&autoplay=1`;
    }

    return `https://vidsrc.xyz/embed/movie?tmdb=${movie.id}&ds_lang=pt&autoplay=1`;
  } catch (err) {
    console.error("Stream link error:", err);
    return null;
  }
};

// ===============================
// DESTAQUE DA HOME
// ===============================
export const getFeaturedContent = async (
  type: "movie" | "tv",
  lang: "en" | "pt"
): Promise<Movie> => {
  await fetchGenres(lang);
  const apiLang = lang === "en" ? "en-US" : "pt-BR";

  const res = await fetch(
    `${BASE_URL}/trending/${type}/day?api_key=${API_KEY}&language=${apiLang}`
  );
  const data = await res.json();

  if (!data.results?.length) {
    throw new Error("No featured content found");
  }

  const randomIndex = Math.floor(Math.random() * Math.min(10, data.results.length));

  return transformContent(data.results[randomIndex], lang, type);
};

// ===============================
// CATEGORIAS DA HOME
// ===============================
export const getContentRows = async (
  type: "movie" | "tv",
  lang: "en" | "pt"
): Promise<CategoryRow[]> => {
  await fetchGenres(lang);

  const apiLang = lang === "en" ? "en-US" : "pt-BR";

  let endpoints;

  if (type === "movie") {
    endpoints = [
      { title: lang === "pt" ? "Filmes em Alta Hoje" : "Trending Movies Today", url: `${BASE_URL}/trending/movie/day?api_key=${API_KEY}&language=${apiLang}` },
      { title: lang === "pt" ? "Nos Cinemas" : "Now Playing", url: `${BASE_URL}/movie/now_playing?api_key=${API_KEY}&language=${apiLang}` },
      { title: lang === "pt" ? "Lançamentos 2024" : "2024 Releases", url: `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=${apiLang}&primary_release_year=2024&sort_by=popularity.desc` },
      { title: lang === "pt" ? "Lançamentos 2025" : "2025 Releases", url: `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=${apiLang}&primary_release_year=2025&sort_by=popularity.desc` },
      { title: lang === "pt" ? "Últimos 30 Dias" : "Last 30 Days", url: `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=${apiLang}&primary_release_date.gte=${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}&sort_by=popularity.desc` },
      { title: lang === "pt" ? "Últimos 90 Dias" : "Last 90 Days", url: `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=${apiLang}&primary_release_date.gte=${new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}&sort_by=popularity.desc` },
      { title: lang === "pt" ? "Em Breve" : "Upcoming", url: `${BASE_URL}/movie/upcoming?api_key=${API_KEY}&language=${apiLang}` },
      { title: lang === "pt" ? "Lançamentos" : "Latest Releases", url: `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=${apiLang}&sort_by=release_date.desc` },
      { title: lang === "pt" ? "Melhores Avaliados" : "Top Rated", url: `${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=${apiLang}` },
      { title: lang === "pt" ? "Ação" : "Action", url: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=28&language=${apiLang}` },
      { title: lang === "pt" ? "Comédia" : "Comedy", url: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=35&language=${apiLang}` },
      { title: lang === "pt" ? "Drama" : "Drama", url: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=18&language=${apiLang}` },
      { title: lang === "pt" ? "Ficção Científica" : "Sci-Fi", url: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=878&language=${apiLang}` },
      { title: lang === "pt" ? "Terror" : "Horror", url: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=27&language=${apiLang}` },
      { title: lang === "pt" ? "Suspense" : "Thriller", url: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=53&language=${apiLang}` },
      { title: lang === "pt" ? "Romance" : "Romance", url: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=10749&language=${apiLang}` },
    ];
  } else {
    endpoints = [
      { title: lang === "pt" ? "Séries em Alta Hoje" : "Trending Series Today", url: `${BASE_URL}/trending/tv/day?api_key=${API_KEY}&language=${apiLang}` },
      { title: lang === "pt" ? "Séries em Alta Esta Semana" : "Trending This Week", url: `${BASE_URL}/trending/tv/week?api_key=${API_KEY}&language=${apiLang}` },
      { title: lang === "pt" ? "No Ar Agora" : "On the Air", url: `${BASE_URL}/tv/on_the_air?api_key=${API_KEY}&language=${apiLang}` },
      { title: lang === "pt" ? "Estreias 2024" : "2024 Premieres", url: `${BASE_URL}/discover/tv?api_key=${API_KEY}&language=${apiLang}&first_air_date.year=2024&sort_by=popularity.desc` },
      { title: lang === "pt" ? "Estreias 2025" : "2025 Premieres", url: `${BASE_URL}/discover/tv?api_key=${API_KEY}&language=${apiLang}&first_air_date.year=2025&sort_by=popularity.desc` },
      { title: lang === "pt" ? "Últimos 30 Dias" : "Last 30 Days", url: `${BASE_URL}/discover/tv?api_key=${API_KEY}&language=${apiLang}&first_air_date.gte=${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}&sort_by=popularity.desc` },
      { title: lang === "pt" ? "Últimos 90 Dias" : "Last 90 Days", url: `${BASE_URL}/discover/tv?api_key=${API_KEY}&language=${apiLang}&first_air_date.gte=${new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}&sort_by=popularity.desc` },
      { title: lang === "pt" ? "Novas Séries" : "New Shows", url: `${BASE_URL}/discover/tv?api_key=${API_KEY}&language=${apiLang}&sort_by=first_air_date.desc` },
      { title: lang === "pt" ? "Melhores Avaliadas" : "Top Rated Shows", url: `${BASE_URL}/tv/top_rated?api_key=${API_KEY}&language=${apiLang}` },
      { title: lang === "pt" ? "Ação & Aventura" : "Action & Adventure", url: `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=10759&language=${apiLang}` },
      { title: lang === "pt" ? "Comédia" : "Comedy", url: `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=35&language=${apiLang}` },
      { title: lang === "pt" ? "Drama" : "Drama", url: `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=18&language=${apiLang}` },
      { title: lang === "pt" ? "Suspense & Mistério" : "Mystery & Thriller", url: `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=9648&language=${apiLang}` },
      { title: lang === "pt" ? "Ficção Científica" : "Sci-Fi", url: `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=10765&language=${apiLang}` },
      { title: lang === "pt" ? "Terror" : "Horror", url: `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=18&language=${apiLang}` },
      { title: lang === "pt" ? "Romance" : "Romance", url: `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=10749&language=${apiLang}` },
      { title: lang === "pt" ? "Documentários" : "Documentaries", url: `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=99&language=${apiLang}` },
      { title: lang === "pt" ? "Família" : "Family", url: `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=10751&language=${apiLang}` },
      { title: lang === "pt" ? "Crime" : "Crime", url: `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=80&language=${apiLang}` },
      { title: lang === "pt" ? "Kids" : "Kids", url: `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=10762&language=${apiLang}` },
      { title: lang === "pt" ? "Reality Show" : "Reality", url: `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=10764&language=${apiLang}` },
      { title: lang === "pt" ? "Guerra & Política" : "War & Politics", url: `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=10768&language=${apiLang}` },
      { title: lang === "pt" ? "Animação" : "Animation", url: `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=16&language=${apiLang}` },
    ];
  }

  const categoryPromises = endpoints.map(async (cat) => {
    try {
      // Busca múltiplas páginas para ter mais títulos por faixa
      const rawItems = await fetchTmdbPages(cat.url, 10); // até 10 páginas (~200 resultados)

      const movies = rawItems.map((item: any) =>
        transformContent(item, lang, type)
      );

      return { title: cat.title, movies: sortByDateDesc(movies) };

    } catch {
      return { title: cat.title, movies: [] };
    }
  });

  const rows = await Promise.all(categoryPromises);

  return rows.filter((r) => r.movies.length > 0);
};

// ===============================
// ANIME
// ===============================
export const getAnimeRows = async (
  lang: "en" | "pt"
): Promise<CategoryRow[]> => {
  await fetchGenres(lang);

  const apiLang = lang === "en" ? "en-US" : "pt-BR";

  const endpoints = [
    {
      title: lang === "pt" ? "Animes em Alta" : "Trending Anime",
      url: `${BASE_URL}/discover/tv?api_key=${API_KEY}&language=${apiLang}&with_genres=16&with_original_language=ja&sort_by=popularity.desc`,
      type: "tv",
    },
    {
      title: lang === "pt" ? "Filmes de Anime" : "Anime Movies",
      url: `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=${apiLang}&with_genres=16&with_original_language=ja&sort_by=popularity.desc`,
      type: "movie",
    },
    {
      title: lang === "pt" ? "Animes de Ação" : "Action Anime",
      url: `${BASE_URL}/discover/tv?api_key=${API_KEY}&language=${apiLang}&with_genres=16,10759&with_original_language=ja&sort_by=vote_count.desc`,
      type: "tv",
    },
    {
      title: lang === "pt" ? "Animes de Fantasia" : "Fantasy Anime",
      url: `${BASE_URL}/discover/tv?api_key=${API_KEY}&language=${apiLang}&with_genres=16,10765&with_original_language=ja&sort_by=vote_count.desc`,
      type: "tv",
    },
    {
      title: lang === "pt" ? "Clássicos" : "Classics",
      url: `${BASE_URL}/discover/tv?api_key=${API_KEY}&language=${apiLang}&with_genres=16&with_original_language=ja&sort_by=vote_average.desc&vote_count.gte=100`,
      type: "tv",
    },
  ];

  const categoryPromises = endpoints.map(async (cat) => {
    try {
      const rawItems = await fetchTmdbPages(cat.url, 10);

      const movies = rawItems.map((item: any) =>
        transformContent(item, lang, cat.type as "movie" | "tv")
      );

      return { title: cat.title, movies };

    } catch {
      return { title: cat.title, movies: [] };
    }
  });

  const rows = await Promise.all(categoryPromises);

  return rows.filter((r) => r.movies.length > 0);
};

// ===============================
// BUSCA GLOBAL
// ===============================
export const searchContent = async (
  query: string,
  lang: "en" | "pt"
): Promise<Movie[]> => {
  if (!query.trim()) return [];

  await fetchGenres(lang);

  const apiLang = lang === "en" ? "en-US" : "pt-BR";

  try {
    const res = await fetch(
      `${BASE_URL}/search/multi?api_key=${API_KEY}&language=${apiLang}&query=${encodeURIComponent(
        query
      )}&page=1&include_adult=false`
    );

    const data = await res.json();

    if (!data.results) return [];

    const filtered = data.results.filter(
      (item: any) =>
        (item.media_type === "movie" || item.media_type === "tv") &&
        item.poster_path
    );

    const mapped = filtered.map((item: any) =>
      transformContent(item, lang)
    );

    return sortByDateDesc(mapped);

  } catch {
    return [];
  }
};
