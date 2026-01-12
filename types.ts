export interface Movie {
  id: string | number;
  title: string;
  description: string;
  backdropUrl: string; // Wide image for hero/modal
  posterUrl: string;   // Tall image for rows
  rating: number;      // e.g. 8.5
  year: number;
  releaseDate: string; // ISO Date YYYY-MM-DD
  genres: string[];
  mediaType?: 'movie' | 'tv'; // Essential for fetching trailers correctly
}

export interface CategoryRow {
  title: string;
  movies: Movie[];
}

export interface UserProfile {
  name: string;
  avatar: string;
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  still_path: string | null;
  episode_number: number;
  season_number: number;
}

export interface Season {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  poster_path: string | null;
}

export interface TvShowDetails extends Movie {
  seasons: Season[];
}