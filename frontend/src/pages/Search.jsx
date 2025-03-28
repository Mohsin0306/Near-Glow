import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RiSearchLine, RiArrowLeftLine, RiHistoryLine, RiFireLine, RiCloseLine, RiStarFill } from 'react-icons/ri';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import SearchResults from '../components/SearchResults';
import { createAPI } from '../utils/api';

// Trending categories for fragrances
const TRENDING_CATEGORIES = [
  "New Arrivals",
  "Best Sellers",
  "Luxury",
  "Unisex",
  "Gift Sets"
];

const Search = () => {
  const { currentTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const token = localStorage.getItem('authToken');
  const api = createAPI(token);

  useEffect(() => {
    // If we have results from navigation state, use them
    if (location.state?.searchResults) {
      setSearchResults(location.state.searchResults);
      setSearchQuery(location.state.searchQuery || '');
      setHasSearched(true);
    } else if (location.state?.initialQuery) {
      setSearchQuery(location.state.initialQuery);
    }
    
    // Fetch trending products on mount
    fetchTrendingProducts();
    
    // Load search state from sessionStorage when returning from product detail
    const savedSearchState = sessionStorage.getItem('searchState');
    if (savedSearchState) {
      try {
        const { query, results, hasSearched: searched } = JSON.parse(savedSearchState);
        setSearchQuery(query || '');
        setSearchResults(results || []);
        setHasSearched(searched || false);
      } catch (error) {
        console.error('Error restoring search state:', error);
      }
    }
  }, [location.state]);

  // Load recent searches on mount
  useEffect(() => {
    try {
      const recentSearchesData = localStorage.getItem('recentSearches');
      if (recentSearchesData) {
        const parsedSearches = JSON.parse(recentSearchesData);
        const validSearches = Array.isArray(parsedSearches) 
          ? parsedSearches.filter(item => typeof item === 'string')
          : [];
        setRecentSearches(validSearches.slice(0, 8));
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
      localStorage.removeItem('recentSearches');
      setRecentSearches([]);
    }
  }, []);

  // Fetch trending products
  const fetchTrendingProducts = async () => {
    try {
      const response = await api.get('/products/trending');
      if (response.data.success) {
        setTrendingProducts(response.data.products || []);
      }
    } catch (error) {
      console.error('Error fetching trending products:', error);
      setTrendingProducts([]);
    }
  };

  // Handle search input changes with debounced suggestions
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length > 1 && !hasSearched) {
        fetchSuggestions(searchQuery);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, hasSearched]);

  const fetchSuggestions = async (query) => {
    if (!query.trim()) return;
    
    try {
      const response = await api.get(`/products/suggestions?q=${encodeURIComponent(query.trim())}`);
      if (response.data.success) {
        setSuggestions(response.data.suggestions);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleSearch = async (event) => {
    if (event) event.preventDefault();
    
    if (!searchQuery.trim()) return;

    setLoading(true);
    setHasSearched(true);
    setShowSuggestions(false);

    try {
      const response = await api.get(`/products/search?q=${encodeURIComponent(searchQuery.trim())}`);
      
      if (response.data.success) {
        const results = response.data.data || [];
        setSearchResults(results);
        
        // Save search state to sessionStorage
        saveSearchState(searchQuery, results, true);
        
        // Save to recent searches
        try {
          const recentSearchesData = localStorage.getItem('recentSearches');
          const recent = recentSearchesData ? JSON.parse(recentSearchesData) : [];
          
          const validRecent = Array.isArray(recent) ? recent : [];
          
          const updatedRecent = [
            searchQuery.trim(),
            ...validRecent.filter(item => 
              typeof item === 'string' && item !== searchQuery.trim()
            )
          ].slice(0, 10);
          
          localStorage.setItem('recentSearches', JSON.stringify(updatedRecent));
          setRecentSearches(updatedRecent);
        } catch (error) {
          console.error('Error saving recent searches:', error);
        }
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching products:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Save search state to sessionStorage
  const saveSearchState = (query, results, searched) => {
    try {
      sessionStorage.setItem('searchState', JSON.stringify({
        query,
        results,
        hasSearched: searched
      }));
    } catch (error) {
      console.error('Error saving search state:', error);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    
    // Trigger search with the selected suggestion
    setTimeout(() => {
      handleSearch();
    }, 0);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setHasSearched(false);
    // Don't clear search results until a new search is performed
  };

  const clearRecentSearches = () => {
    localStorage.removeItem('recentSearches');
    setRecentSearches([]);
  };

  // Handle product click to navigate to product detail page
  const handleProductClick = (productId) => {
    // Save current search state before navigating
    saveSearchState(searchQuery, searchResults, hasSearched);
    
    // Navigate to product detail page
    navigate(`/products/${productId}`);
  };

  return (
    <div className={`min-h-screen pt-4 pb-20 px-4 ${
      currentTheme === 'dark' 
        ? 'bg-gray-900 text-white' 
        : currentTheme === 'eyeCare'
        ? 'bg-[#F5E6D3] text-[#433422]'
        : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="max-w-3xl mx-auto">
        {/* Search Header */}
        <div className="flex items-center gap-3 mb-4">
          <button 
            onClick={() => navigate(-1)}
            className={`p-2 rounded-full ${
              currentTheme === 'dark' 
                ? 'hover:bg-gray-800' 
                : currentTheme === 'eyeCare'
                ? 'hover:bg-[#E6D5BC]'
                : 'hover:bg-gray-100'
            }`}
          >
            <RiArrowLeftLine size={20} />
          </button>
          <h1 className="text-xl font-semibold">Search</h1>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="relative mb-4">
          <div className={`flex items-center gap-2 p-2 rounded-full ${
            currentTheme === 'dark' 
              ? 'bg-gray-800 border border-gray-700' 
              : currentTheme === 'eyeCare'
              ? 'bg-[#E6D5BC] border border-[#D4C3A3]'
              : 'bg-white border border-gray-200 shadow-sm'
          }`}>
            <RiSearchLine 
              size={20} 
              className={currentTheme === 'dark' ? 'text-gray-400' : currentTheme === 'eyeCare' ? 'text-[#433422]/60' : 'text-gray-400'} 
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for fragrances, brands..."
              className={`flex-1 bg-transparent border-none outline-none text-sm ${
                currentTheme === 'dark' 
                  ? 'placeholder-gray-500' 
                  : currentTheme === 'eyeCare'
                  ? 'placeholder-[#433422]/50'
                  : 'placeholder-gray-400'
              }`}
              onFocus={() => {
                if (searchQuery.trim().length > 1) {
                  setShowSuggestions(true);
                }
              }}
              onBlur={() => {
                // Delay hiding suggestions to allow for clicks
                setTimeout(() => setShowSuggestions(false), 200);
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className={`p-1 rounded-full ${
                  currentTheme === 'dark' 
                    ? 'hover:bg-gray-700 text-gray-400' 
                    : currentTheme === 'eyeCare'
                    ? 'hover:bg-[#D4C3A3] text-[#433422]/60'
                    : 'hover:bg-gray-100 text-gray-400'
                }`}
              >
                <RiCloseLine size={18} />
              </button>
            )}
          </div>
          
          {/* Search Suggestions */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && !hasSearched && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`absolute z-10 mt-2 w-full rounded-lg shadow-lg overflow-hidden ${
                  currentTheme === 'dark' 
                    ? 'bg-gray-800 border border-gray-700' 
                    : currentTheme === 'eyeCare'
                    ? 'bg-[#E6D5BC] border border-[#D4C3A3]'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <div className="p-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className={`w-full text-left px-3 py-2 rounded text-sm ${
                        currentTheme === 'dark' 
                          ? 'hover:bg-gray-700' 
                          : currentTheme === 'eyeCare'
                          ? 'hover:bg-[#D4C3A3]'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <RiSearchLine size={14} className="opacity-60" />
                        <span>{suggestion}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        {/* Search Results or Initial Content */}
        <div>
          <AnimatePresence mode="wait">
            {hasSearched ? (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <SearchResults 
                  results={searchResults} 
                  query={searchQuery} 
                  loading={loading}
                  currentTheme={currentTheme}
                  onProductClick={handleProductClick}
                />
              </motion.div>
            ) : (
              <motion.div
                key="initial"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-base font-semibold flex items-center gap-2">
                        <RiHistoryLine />
                        Recent Searches
                      </h2>
                      <button
                        onClick={clearRecentSearches}
                        className={`text-xs px-2 py-1 rounded ${
                          currentTheme === 'dark' 
                            ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                            : currentTheme === 'eyeCare'
                            ? 'text-[#433422]/70 hover:text-[#433422] hover:bg-[#E6D5BC]'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((search, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(search)}
                          className={`px-4 py-2 rounded-full text-sm transition-all ${
                            currentTheme === 'dark' 
                              ? 'bg-gray-800 hover:bg-gray-700 border border-gray-700' 
                              : currentTheme === 'eyeCare'
                              ? 'bg-[#E6D5BC] hover:bg-[#D4C3A3] border border-[#D4C3A3]'
                              : 'bg-white hover:bg-gray-50 border border-gray-200'
                          }`}
                        >
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending Products */}
                {trendingProducts.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-base font-semibold flex items-center gap-2">
                        <RiFireLine className="text-orange-500" />
                        Trending Products
                      </h2>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {trendingProducts.map((product) => (
                        <motion.div
                          key={product._id}
                          whileHover={{ y: -3 }}
                          className={`rounded-lg overflow-hidden transition-all ${
                            currentTheme === 'dark' 
                              ? 'bg-gray-800 hover:shadow-lg hover:shadow-purple-500/10' 
                              : currentTheme === 'eyeCare'
                              ? 'bg-[#E6D5BC] hover:shadow-lg hover:shadow-[#433422]/10'
                              : 'bg-white hover:shadow-lg hover:shadow-gray-200/50'
                          }`}
                          onClick={() => handleProductClick(product._id)}
                        >
                          <div className="aspect-square overflow-hidden">
                            {product.media && product.media.length > 0 ? (
                              <img 
                                src={product.media[0].url} 
                                alt={product.name}
                                className="w-full h-full object-cover transition-transform hover:scale-110"
                              />
                            ) : (
                              <div className={`w-full h-full flex items-center justify-center ${
                                currentTheme === 'dark' 
                                  ? 'bg-gray-700' 
                                  : currentTheme === 'eyeCare'
                                  ? 'bg-[#D4C3A3]'
                                  : 'bg-gray-100'
                              }`}>
                                <span className="text-xs opacity-50">No image</span>
                              </div>
                            )}
                          </div>
                          <div className="p-2">
                            <h3 className="text-xs font-medium line-clamp-1">{product.name}</h3>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-xs font-bold">
                                Rs {product.price?.toLocaleString('en-PK')}
                              </p>
                              {product.averageRating > 0 && (
                                <div className="flex items-center gap-0.5">
                                  <RiStarFill className="text-yellow-400" size={10} />
                                  <span className="text-[10px] opacity-60">
                                    {product.averageRating.toFixed(1)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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