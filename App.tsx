import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { MovieRow } from './components/MovieRow';
import { MovieModal } from './components/MovieModal';
import { ProfileEditor } from './components/ProfileEditor';
import { Movie, CategoryRow, UserProfile } from './types';
import { getContentRows, getFeaturedContent, getAnimeRows, searchContent } from './services/movieService';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'home' | 'anime' | 'list' | 'search' | 'profile'>('home');
  const [lastView, setLastView] = useState<'home' | 'anime' | 'list'>('home'); 
  const [contentType, setContentType] = useState<'movie' | 'tv'>('movie');
  const [language, setLanguage] = useState<'en' | 'pt'>('en');
  
  const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [animeRows, setAnimeRows] = useState<CategoryRow[]>([]);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [autoPlay, setAutoPlay] = useState(false); // New state for auto-playing content
  const [loading, setLoading] = useState(true);
  
  // -- State: My List --
  const [myList, setMyList] = useState<Movie[]>(() => {
    const saved = localStorage.getItem('myList');
    return saved ? JSON.parse(saved) : [];
  });

  // -- State: Liked Movies --
  const [likedMovies, setLikedMovies] = useState<string[]>(() => {
    const saved = localStorage.getItem('likedMovies');
    return saved ? JSON.parse(saved) : [];
  });

  // -- State: User Profile --
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('userProfile');
    return saved ? JSON.parse(saved) : {
      name: 'User',
      avatar: 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png'
    };
  });

  // Persist Data
  useEffect(() => { localStorage.setItem('myList', JSON.stringify(myList)); }, [myList]);
  useEffect(() => { localStorage.setItem('likedMovies', JSON.stringify(likedMovies)); }, [likedMovies]);
  useEffect(() => { localStorage.setItem('userProfile', JSON.stringify(userProfile)); }, [userProfile]);

  // -- Handlers --

  const toggleMyList = (movie: Movie) => {
    setMyList(prev => {
      const exists = prev.find(m => m.id === movie.id);
      if (exists) {
        return prev.filter(m => m.id !== movie.id);
      } else {
        return [...prev, movie];
      }
    });
  };

  const isMovieInList = (movieId?: string | number) => {
    if (!movieId) return false;
    return myList.some(m => m.id === movieId);
  };

  const toggleLike = (movie: Movie) => {
    const idString = movie.id.toString();
    setLikedMovies(prev => {
        if (prev.includes(idString)) {
            return prev.filter(id => id !== idString);
        } else {
            return [...prev, idString];
        }
    });
  };

  const isMovieLiked = (movieId?: string | number) => {
      if (!movieId) return false;
      return likedMovies.includes(movieId.toString());
  };

  const handleUpdateProfile = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    setActiveView(lastView); // Return to previous screen after saving
  };

  // Handler for Hero Play Button
  const handleHeroPlay = (movie: Movie) => {
    setAutoPlay(true);
    setSelectedMovie(movie);
  };

  const handleCloseModal = () => {
    setSelectedMovie(null);
    setAutoPlay(false); // Reset autoPlay when closing
  };

  // Function to load data based on type and language
  const loadData = async () => {
    // Only fetch home data if we are in home or just switching types
    if (activeView === 'home' || activeView === 'search' || activeView === 'profile') {
        try {
             const [hero, rows] = await Promise.all([
                getFeaturedContent(contentType, language),
                getContentRows(contentType, language)
             ]);
             setFeaturedMovie(hero);
             setCategories(rows);
        } catch (e) { console.error(e) }
        setLoading(false);
    } 
    
    if (activeView === 'anime') {
        setLoading(true);
        try {
            const rows = await getAnimeRows(language);
            setAnimeRows(rows);
        } catch (e) { console.error(e) }
        setLoading(false);
    }
  };

  // Load data when major state changes
  useEffect(() => {
    loadData();
  }, [contentType, language, activeView]);

  const handleContentTypeChange = (type: 'movie' | 'tv') => {
    if (type !== contentType || activeView !== 'home') {
      setActiveView('home');
      setLastView('home');
      setContentType(type);
      window.scrollTo(0, 0);
    }
  };

  const handleSmartflixClick = () => {
    // Cycle through: movie -> tv -> anime -> movie
    if (activeView === 'anime') {
      // From anime to movies
      setActiveView('home');
      setLastView('home');
      setContentType('movie');
    } else if (activeView === 'home' && contentType === 'movie') {
      // From movies to series
      setActiveView('home');
      setLastView('home');
      setContentType('tv');
    } else {
      // From series or any other state to anime
      setActiveView('anime');
      setLastView('anime');
    }
    window.scrollTo(0, 0);
  };

  const handleViewChange = (view: 'home' | 'anime' | 'list' | 'profile') => {
    setActiveView(view);
    if (view !== 'profile') {
        setLastView(view);
    }
    window.scrollTo(0, 0);
  };

  const handleSearch = async (query: string) => {
    if (!query) {
        // If query cleared, go back to last view (if not profile)
        if (activeView === 'search') {
            setActiveView(lastView);
        }
        return;
    }

    if (activeView !== 'search') {
        setActiveView('search');
    }

    const results = await searchContent(query, language);
    setSearchResults(results);
  };

  const t = {
    emptyList: language === 'pt' ? 'Sua lista está vazia.' : 'Your list is empty.',
    addSomething: language === 'pt' ? 'Adicione filmes e séries para assistir mais tarde.' : 'Add movies and shows to watch later.',
    myListTitle: language === 'pt' ? 'Minha Lista' : 'My List',
    resultsFor: language === 'pt' ? 'Resultados para' : 'Results for',
    noResults: language === 'pt' ? 'Nenhum resultado encontrado.' : 'No results found.'
  };

  return (
    <div className="min-h-screen bg-[#141414] pb-12 overflow-x-hidden font-sans">
      <Navbar 
        activeType={contentType} 
        activeView={activeView}
        onTypeChange={handleContentTypeChange}
        onViewChange={handleViewChange}
        language={language}
        onLanguageChange={setLanguage}
        onSearch={handleSearch}
        userProfile={userProfile}
        onSmartflixClick={handleSmartflixClick}
      />
      
      {loading && activeView !== 'search' && activeView !== 'profile' ? (
        <div className="h-screen w-full flex items-center justify-center bg-[#141414]">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {activeView === 'home' && (
            <>
              <Hero 
                movie={featuredMovie} 
                onMoreInfo={setSelectedMovie} 
                onPlay={handleHeroPlay}
                language={language}
              />
              <div className="relative z-10 -mt-24 md:-mt-32 space-y-4 md:space-y-8">
                {categories.map((category, index) => (
                  <MovieRow 
                    key={`${contentType}-${language}-${index}`} 
                    title={category.title} 
                    movies={category.movies} 
                    onMovieClick={setSelectedMovie}
                  />
                ))}
              </div>
            </>
          )}

          {activeView === 'anime' && (
            <div className="pt-24 md:pt-32 space-y-4 md:space-y-8">
               <h2 className="text-3xl font-bold text-white px-4 md:px-12 mb-4">Anime</h2>
              {animeRows.map((category, index) => (
                <MovieRow 
                  key={`anime-${language}-${index}`} 
                  title={category.title} 
                  movies={category.movies} 
                  onMovieClick={setSelectedMovie}
                />
              ))}
            </div>
          )}

          {activeView === 'list' && (
            <div className="pt-24 px-4 md:px-12 min-h-[50vh]">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">{t.myListTitle}</h2>
              {myList.length === 0 ? (
                 <div className="text-gray-400 text-lg flex flex-col items-center justify-center h-64 border border-gray-800 rounded">
                    <p>{t.emptyList}</p>
                    <p className="text-sm mt-2">{t.addSomething}</p>
                 </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                   {myList.map((movie) => (
                      <div 
                        key={movie.id}
                        onClick={() => setSelectedMovie(movie)}
                        className="relative aspect-[2/3] rounded overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-105 hover:z-10 group"
                      >
                        <img 
                          src={movie.posterUrl} 
                          alt={movie.title}
                          className="w-full h-full object-cover"
                        />
                         <div className="absolute inset-0 bg-black/10 hover:bg-black/0 transition"></div>
                      </div>
                   ))}
                </div>
              )}
            </div>
          )}

          {activeView === 'search' && (
             <div className="pt-24 px-4 md:px-12 min-h-[50vh]">
                 <h2 className="text-gray-400 text-lg mb-6">{t.resultsFor}: <span className="text-white font-bold">...</span></h2>
                 {searchResults.length === 0 ? (
                    <div className="text-gray-400 text-center mt-20">{t.noResults}</div>
                 ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {searchResults.map((movie) => (
                        <div 
                            key={movie.id}
                            onClick={() => setSelectedMovie(movie)}
                            className="relative aspect-[2/3] rounded overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-105 hover:z-10 group"
                        >
                            <img 
                            src={movie.posterUrl} 
                            alt={movie.title}
                            className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/10 hover:bg-black/0 transition"></div>
                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-100 transition">
                                <p className="text-xs font-bold text-white truncate">{movie.title}</p>
                            </div>
                        </div>
                        ))}
                    </div>
                 )}
             </div>
          )}

          {activeView === 'profile' && (
              <ProfileEditor 
                currentProfile={userProfile}
                onSave={handleUpdateProfile}
                onCancel={() => setActiveView(lastView)}
                language={language}
              />
          )}
        </>
      )}

      <MovieModal 
        movie={selectedMovie} 
        onClose={handleCloseModal} 
        language={language}
        isListed={isMovieInList(selectedMovie?.id)}
        onToggleList={toggleMyList}
        isLiked={isMovieLiked(selectedMovie?.id)}
        onToggleLike={toggleLike}
        autoPlay={autoPlay}
      />

      {activeView !== 'profile' && (
        <footer className="mt-24 text-center text-gray-500 text-sm py-8 border-t border-zinc-800">
            <p>Smart Cria</p>
            <p className="mt-2">&copy; 2024 Fundador Jessé Freitas.</p>
        </footer>
      )}
    </div>
  );
};

export default App;