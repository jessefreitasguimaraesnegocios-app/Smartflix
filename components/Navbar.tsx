import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Globe, X } from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  activeType: 'movie' | 'tv';
  activeView: 'home' | 'anime' | 'list' | 'search' | 'profile';
  onTypeChange: (type: 'movie' | 'tv') => void;
  onViewChange: (view: 'home' | 'anime' | 'list' | 'profile') => void;
  language: 'en' | 'pt';
  onLanguageChange: (lang: 'en' | 'pt') => void;
  onSearch: (query: string) => void;
  userProfile: UserProfile;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  activeType, 
  activeView, 
  onTypeChange, 
  onViewChange, 
  language, 
  onLanguageChange,
  onSearch,
  userProfile
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  const t = {
    home: language === 'pt' ? 'Início' : 'Home',
    series: language === 'pt' ? 'Séries' : 'Series',
    movies: language === 'pt' ? 'Filmes' : 'Movies',
    anime: 'Anime',
    myList: language === 'pt' ? 'Minha Lista' : 'My List',
    switchLang: language === 'pt' ? 'Mudar para Inglês' : 'Switch to Portuguese',
    placeholder: language === 'pt' ? 'Títulos, gente e gêneros' : 'Titles, people, genres'
  };

  const handleNavClick = (view: 'home' | 'anime' | 'list', type?: 'movie' | 'tv') => {
    onViewChange(view);
    if (type) {
      onTypeChange(type);
    }
    // Clear search when navigating away
    if (activeView === 'search') {
      setSearchValue("");
      setShowSearch(false);
    }
  };

  const toggleLanguage = () => {
    onLanguageChange(language === 'en' ? 'pt' : 'en');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    onSearch(val);
  };

  const toggleSearch = () => {
    if (showSearch && searchValue) {
        setSearchValue("");
        onSearch("");
    } else {
        setShowSearch(!showSearch);
    }
  };

  return (
    <nav className={`fixed top-0 w-full z-50 transition-colors duration-300 ${isScrolled ? 'bg-[#141414]' : 'bg-gradient-to-b from-black/80 to-transparent'}`}>
      <div className="px-4 md:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <h1 
            onClick={() => handleNavClick('home', 'movie')}
            className="text-red-600 text-2xl md:text-3xl font-bold cursor-pointer"
          >
            NETFLIX
          </h1>
          
          <ul className="hidden md:flex gap-6 text-sm text-gray-300">
            <li 
              className={`hover:text-white cursor-pointer transition font-medium ${activeView === 'home' && !activeType ? 'text-white font-bold' : ''}`}
              onClick={() => handleNavClick('home', 'movie')}
            >
              {t.home}
            </li>
            <li 
              onClick={() => handleNavClick('home', 'movie')}
              className={`cursor-pointer transition hover:text-white ${activeView === 'home' && activeType === 'movie' ? 'text-white font-bold' : ''}`}
            >
              {t.movies}
            </li>
             <li 
              onClick={() => handleNavClick('home', 'tv')}
              className={`cursor-pointer transition hover:text-white ${activeView === 'home' && activeType === 'tv' ? 'text-white font-bold' : ''}`}
            >
              {t.series}
            </li>
            <li 
              onClick={() => handleNavClick('anime')}
              className={`hover:text-white cursor-pointer transition ${activeView === 'anime' ? 'text-white font-bold' : ''}`}
            >
              {t.anime}
            </li>
            <li 
              onClick={() => handleNavClick('list')}
              className={`hover:text-white cursor-pointer transition ${activeView === 'list' ? 'text-white font-bold' : ''}`}
            >
              {t.myList}
            </li>
          </ul>
        </div>

        <div className="flex items-center gap-4 text-white">
            {/* Search Bar */}
            <div className={`flex items-center border border-white/0 ${showSearch || searchValue ? 'bg-black/80 border-white/50 px-2 py-1' : ''} transition-all duration-300`}>
                <button onClick={toggleSearch}>
                    <Search className="w-5 h-5 cursor-pointer hover:text-gray-300 transition" />
                </button>
                <input 
                    ref={searchInputRef}
                    type="text"
                    value={searchValue}
                    onChange={handleSearchChange}
                    placeholder={t.placeholder}
                    className={`bg-transparent text-sm text-white outline-none ml-2 transition-all duration-300 ${showSearch || searchValue ? 'w-32 md:w-60 opacity-100' : 'w-0 opacity-0'}`}
                />
                 {(searchValue) && (
                    <X className="w-4 h-4 cursor-pointer text-gray-400 hover:text-white" onClick={() => {
                        setSearchValue("");
                        onSearch("");
                    }} />
                )}
            </div>

          {/* Language Toggle Button */}
          <button 
            onClick={toggleLanguage}
            className="flex items-center gap-1 cursor-pointer hover:text-gray-300 transition text-white border border-transparent hover:border-white/20 rounded px-2 py-1"
            title={t.switchLang}
          >
             <Globe className="w-4 h-4" />
             <span className="text-sm font-medium uppercase">{language}</span>
          </button>

          <Bell className="w-5 h-5 cursor-pointer hover:text-gray-300 transition" />
          
          <div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => onViewChange('profile')}
          >
            <div className="w-8 h-8 rounded overflow-hidden border border-transparent group-hover:border-white transition-all">
                <img src={userProfile.avatar} alt={userProfile.name} className="w-full h-full object-cover" />
            </div>
            <span className={`text-xs transition-all duration-300 ml-1 whitespace-nowrap hidden sm:block ${activeView === 'profile' ? 'font-bold text-white' : 'text-gray-300 group-hover:text-white'}`}>
              {userProfile.name}
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
};