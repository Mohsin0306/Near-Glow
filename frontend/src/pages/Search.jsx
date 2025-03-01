import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RiSearchLine, RiArrowLeftLine, RiHistoryLine, RiFireLine, RiArrowRightLine } from 'react-icons/ri';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import SearchResults from '../components/SearchResults';
import { createAPI } from '../utils/api';

const SUGGESTED_SEARCHES = [
  "Chanel",
  "Dior",
  "Versace",
  "Gucci",
  "Body Mist",
  "Perfume Oil",
  "Attar",
  "Deodorant",
  "Summer Fragrances",
  "Long Lasting",
  "Floral Scents",
  "Woody Scents",
  "Oriental",
  "Unisex",
  "Gift Sets",
  "Travel Size",
  "Luxury",
  "Under $50",
  "New Arrivals",
  "Best Sellers"
];

const Search = () => {
  const { currentTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(location.state?.initialQuery || '');
  const [searchResults, setSearchResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [popularSearches, setPopularSearches] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('authToken');
  const api = createAPI(token);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Load recent and popular searches on mount
  useEffect(() => {
    // Load recent searches from localStorage
    const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    setRecentSearches(recent.slice(0, 8)); // Show last 8 searches

    // Load popular searches
    fetchPopularSearches();
  }, []);

  const fetchPopularSearches = async () => {
    try {
      const response = await api.get('/products/suggestions');
      if (response.data.success) {
        setPopularSearches(response.data.popularSearches);
      }
    } catch (error) {
      console.error('Error fetching popular searches:', error);
    }
  };

  const handleSearch = async (query) => {
    if (!query?.trim()) return;
    setLoading(true);
    setSearchResults([]); // Clear previous results

    try {
      const response = await api.get(`/products/search?q=${encodeURIComponent(query)}`);
      
      if (response.data.success) {
        const products = response.data.data || [];
        const transformedProducts = products.map(p => ({
          id: p._id,
          title: p.name,
          description: p.description,
          price: parseFloat(p.price),
          image: p.media?.[0]?.url || 'https://via.placeholder.com/300x300?text=Product+Image',
          category: p.category?.name || 'Uncategorized',
          subcategories: Array.isArray(p.subcategories) ? p.subcategories : [],
          rating: { 
            rate: p.averageRating || 0, 
            count: p.ratings?.length || 0 
          },
          stock: parseInt(p.stock) || 0,
          brand: p.brand,
          media: p.media || [],
          specifications: p.specifications || [],
          features: p.features || [],
          orderCount: p.orderCount || 0,
          viewCount: p.viewCount || 0
        }));
        
        setSearchResults(transformedProducts);
        
        // Save to recent searches
        if (query.trim()) {
          const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
          const newSearch = {
            query: query.trim(),
            timestamp: new Date().toISOString()
          };
          const updatedRecent = [newSearch, ...recent.filter(item => item.query !== query.trim())]
            .slice(0, 8);
          localStorage.setItem('recentSearches', JSON.stringify(updatedRecent));
          setRecentSearches(updatedRecent);
        }
      }
    } catch (error) {
      console.error('Error searching products:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      handleSearch(searchQuery);
    }
  };

  const handleQueryChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setShowSuggestions(true);

    if (query.trim().length > 0) {
      try {
        const response = await api.get(`/products/suggestions?q=${encodeURIComponent(query)}`);
        if (response.data.success) {
          setSuggestions(response.data.suggestions);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    handleSearch(suggestion);
    setSuggestions([]);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Add click outside handler to hide suggestions
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSuggestions(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <div className={`min-h-screen ${
      currentTheme === 'dark' ? 'bg-gray-900 text-white' 
      : currentTheme === 'eyeCare' ? 'bg-[#F5E6D3] text-[#433422]'
      : 'bg-white text-gray-900'
    }`}>
      {/* Search Header */}
      <div className={`sticky top-0 z-50 ${
        currentTheme === 'dark' ? 'bg-gray-900/95' 
        : currentTheme === 'eyeCare' ? 'bg-[#F5E6D3]/95'
        : 'bg-white/95'
      } backdrop-blur-md shadow-sm`}>
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-3">
          <form onSubmit={handleSubmitSearch} className="relative">
            <div className="flex items-center gap-2 sm:gap-3">
              <button 
                type="button"
                onClick={() => navigate(-1)}
                className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100/10"
              >
                <RiArrowLeftLine size={20} className="sm:w-6 sm:h-6" />
              </button>
              <div 
                className={`flex-1 flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full border ${
                  currentTheme === 'dark' ? 'bg-gray-800 border-gray-700' 
                  : currentTheme === 'eyeCare' ? 'bg-[#E6D5BC] border-[#D4C3AA]'
                  : 'bg-gray-50 border-gray-200'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <RiSearchLine className="text-gray-400 min-w-[18px] sm:min-w-[20px]" size={18} />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={handleQueryChange}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Search for products..."
                  autoFocus
                  className={`flex-1 bg-transparent outline-none text-sm sm:text-base ${
                    currentTheme === 'dark' ? 'placeholder:text-gray-500' 
                    : currentTheme === 'eyeCare' ? 'placeholder:text-[#433422]/60'
                    : 'placeholder:text-gray-500'
                  }`}
                />
                {searchQuery.trim() && (
                  <button
                    type="submit"
                    className={`group flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black hover:bg-black/90 transition-all duration-200 ${
                      currentTheme === 'eyeCare' ? 'bg-[#433422] hover:bg-[#433422]/90' : ''
                    }`}
                    onClick={() => {
                      setShowSuggestions(false);
                      handleSearch(searchQuery);
                    }}
                  >
                    <RiSearchLine 
                      className="text-white transform group-hover:scale-110 transition-transform duration-200" 
                      size={16} 
                    />
                  </button>
                )}
              </div>
            </div>

            {/* Suggestions Dropdown */}
            {searchQuery && suggestions.length > 0 && showSuggestions && (
              <div 
                className={`absolute left-0 right-0 mt-1 sm:mt-2 py-1 sm:py-2 rounded-lg shadow-lg ${
                  currentTheme === 'dark' ? 'bg-gray-800' 
                  : currentTheme === 'eyeCare' ? 'bg-[#E6D5BC]'
                  : 'bg-white'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`px-3 sm:px-4 py-2 cursor-pointer flex items-center gap-2 sm:gap-3 ${
                      currentTheme === 'dark' ? 'hover:bg-gray-700' 
                      : currentTheme === 'eyeCare' ? 'hover:bg-[#D4C3AA]'
                      : 'hover:bg-gray-50'
                    }`}
                  >
                    <RiSearchLine className="text-gray-400" size={16} />
                    <span className="text-sm">{suggestion}</span>
                  </div>
                ))}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Search Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <AnimatePresence>
          {!searchQuery && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-semibold">Recent Searches</h2>
                      <p className="text-sm opacity-60 mt-1">Your search history</p>
                    </div>
                    <button
                      onClick={() => {
                        localStorage.removeItem('recentSearches');
                        setRecentSearches([]);
                      }}
                      className="text-sm px-3 py-1.5 rounded-full hover:bg-gray-100/10 transition-colors duration-200"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((search, index) => (
                      <motion.div
                        key={index}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => {
                          setSearchQuery(search.query);
                          handleSearch(search.query);
                        }}
                        className={`group flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer transition-all duration-200 ${
                          currentTheme === 'dark' 
                            ? 'bg-gray-800 hover:bg-gray-700' 
                            : currentTheme === 'eyeCare' 
                            ? 'bg-[#E6D5BC] hover:bg-[#D4C3AA]'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <RiHistoryLine 
                            className="text-gray-400 group-hover:text-gray-500 transition-colors duration-200" 
                            size={16} 
                          />
                          <span className="text-sm font-medium">{search.query}</span>
                          <span className="text-xs opacity-50">{formatTimestamp(search.timestamp)}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Searches */}
              {popularSearches.length > 0 && (
                <div>
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold">Popular Searches</h2>
                    <p className="text-sm opacity-60 mt-1">Trending products</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {popularSearches.map((search, index) => (
                      <motion.button
                        key={index}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => {
                          setSearchQuery(search);
                          handleSearch(search);
                        }}
                        className={`group flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all duration-200 ${
                          currentTheme === 'dark' 
                            ? 'bg-gray-800 hover:bg-gray-700' 
                            : currentTheme === 'eyeCare' 
                            ? 'bg-[#E6D5BC] hover:bg-[#D4C3AA]'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        <RiFireLine 
                          className="text-orange-500 group-hover:text-orange-600 transition-colors duration-200" 
                          size={16} 
                        />
                        {search}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <SearchResults 
            results={searchResults} 
            query={searchQuery}
            loading={loading}
            currentTheme={currentTheme}
          />
        )}
      </div>
    </div>
  );
};

// Import and use the ProductCard component from Products.jsx
const ProductCard = ({ product, currentTheme, wishlistItems }) => {
  // Copy the ProductCard component from Products.jsx
  // ... ProductCard code ...
};

export default Search; 