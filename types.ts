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