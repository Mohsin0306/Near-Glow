import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  RiSearchLine, 
  RiFilterLine, 
  RiSparklingLine, 
  RiLeafLine 
} from 'react-icons/ri';
import { useTheme } from '../../context/ThemeContext';
import { motion } from 'framer-motion';
import axios from 'axios';

const scrollbarStyles = `
  <style>
    @media (min-width: 768px) {
      .tags-scroll {
        overflow-x: hidden;
        transition: all 0.3s ease;
      }
      .tags-scroll:hover {
        overflow-x: auto;
      }
      .tags-scroll::-webkit-scrollbar {
        height: 8px;
      }
      .tags-scroll::-webkit-scrollbar-track {
        background: transparent;
        border-radius: 8px;
        margin: 0 4px;
      }
      .tags-scroll.light-theme::-webkit-scrollbar-track {
        background: #f1f1f1;
      }
      .tags-scroll.dark-theme::-webkit-scrollbar-track {
        background: #2d3748;
      }
      .tags-scroll.eye-care-theme::-webkit-scrollbar-track {
        background: #E6D5BC;
      }
      .tags-scroll::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 8px;
        border: 2px solid transparent;
        background-clip: padding-box;
        transition: all 0.3s ease;
      }
      .tags-scroll.light-theme::-webkit-scrollbar-thumb {
        background-color: #CBD5E0;
        border-color: #f1f1f1;
      }
      .tags-scroll.dark-theme::-webkit-scrollbar-thumb {
        background-color: #4A5568;
        border-color: #2d3748;
      }
      .tags-scroll.eye-care-theme::-webkit-scrollbar-thumb {
        background-color: #C4B39A;
        border-color: #E6D5BC;
      }
      .tags-scroll::-webkit-scrollbar-thumb:hover {
        background-color: #718096;
      }
    }
    @media (max-width: 767px) {
      .tags-scroll {
        overflow-x: auto;
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      .tags-scroll::-webkit-scrollbar {
        display: none;
      }
    }
  </style>
`;

const SearchBar = ({ onCategoryChange, selectedCategories }) => {
  const { currentTheme } = useTheme();
  const [searchFocused, setSearchFocused] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('https://api.nearglow.com/api/categories');
        if (response.data.success) {
          const allCategories = response.data.data.reduce((acc, category) => {
            // Add main category
            acc.push({
              id: category._id,
              icon: <RiSparklingLine size={18} />,
              name: category.name,
              type: 'main',
              subcategories: category.subcategories || []
            });
            
            // Add subcategories
            if (category.subcategories?.length > 0) {
              category.subcategories.forEach(sub => {
                const cleanSub = typeof sub === 'string' 
                  ? sub.replace(/[\[\]"\\]/g, '').trim()
                  : sub;
                  
                acc.push({
                  id: `${category._id}-${cleanSub}`,
                  icon: <RiLeafLine size={18} />,
                  name: cleanSub,
                  type: 'sub',
                  parentId: category._id,
                  parentName: category.name
                });
              });
            }
            return acc;
          }, []);
          
          setCategories(allCategories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleCategoryChange = (category) => {
    if (onCategoryChange) {
      // If category is already selected, remove it, otherwise add it
      const isSelected = selectedCategories?.some(c => c.id === category.id);
      if (isSelected) {
        onCategoryChange(selectedCategories.filter(c => c.id !== category.id));
      } else {
        onCategoryChange([...(selectedCategories || []), category]);
      }
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      const response = await axios.get(`http://192.168.0.1059:5000/api/products/search?q=${searchQuery}`);
      if (response.data.success) {
        navigate('/search', {
          state: {
            searchResults: response.data.products,
            searchQuery: searchQuery
          }
        });
      }
    } catch (error) {
      console.error('Error searching products:', error);
    }
  };

  const handleSearchFocus = () => {
    setSearchFocused(true);
    navigate('/search', { 
      state: { 
        initialQuery: searchQuery 
      }
    });
  };

  return (
    <div className={`w-full backdrop-blur-md shadow-sm ${
      currentTheme === 'dark' ? 'bg-gray-900/95' 
      : currentTheme === 'eyeCare' ? 'bg-[#F5E6D3]/95'
      : 'bg-white/95'
    }`}>
      <div dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />
      <div className="max-w-7xl mx-auto px-3 py-3">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex gap-2 items-center mb-3">
          <motion.div 
            className={`flex-1 flex items-center gap-2 px-4 py-2.5 rounded-full border ${
              currentTheme === 'dark' ? 'bg-gray-800/80 border-gray-700' 
              : currentTheme === 'eyeCare' ? 'bg-[#E6D5BC] border-[#D4C3AA]'
              : 'bg-gray-50/80 border-gray-200'
            } ${searchFocused ? 'ring-2 ring-indigo-500/20' : ''}`}
            animate={{ scale: searchFocused ? 1.01 : 1 }}
            transition={{ duration: 0.2 }}
          >
            <RiSearchLine className={
              currentTheme === 'dark' ? 'text-gray-400' 
              : currentTheme === 'eyeCare' ? 'text-[#433422]'
              : 'text-gray-500'
            } size={18} />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for perfumes..."
              onFocus={handleSearchFocus}
              onBlur={() => setSearchFocused(false)}
              className={`w-full bg-transparent outline-none text-sm ${
                currentTheme === 'dark' ? 'text-white placeholder:text-gray-500' 
                : currentTheme === 'eyeCare' ? 'text-[#433422] placeholder:text-[#433422]/60'
                : 'text-gray-900 placeholder:text-gray-500'
              }`}
            />
          </motion.div>
          <button 
            type="submit"
            className="px-6 py-2.5 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Search
          </button>
        </form>

        {/* Categories Row */}
        <div className="relative">
          <div className={`tags-scroll ${
            currentTheme === 'dark' ? 'dark-theme' 
            : currentTheme === 'eyeCare' ? 'eye-care-theme'
            : 'light-theme'
          }`}>
            <div className="flex gap-2 py-1">
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onCategoryChange([])} // Clear all selections
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full whitespace-nowrap transition-all duration-200 ${
                  !selectedCategories?.length ? (
                    currentTheme === 'dark'
                      ? 'bg-white text-gray-900'
                      : currentTheme === 'eyeCare'
                      ? 'bg-[#433422] text-[#F5E6D3]'
                      : 'bg-gray-900 text-white'
                  ) : (
                    currentTheme === 'dark'
                      ? 'bg-gray-800/80 hover:bg-gray-700 text-white'
                      : currentTheme === 'eyeCare'
                      ? 'bg-[#E6D5BC] hover:bg-[#D4C3AA] text-[#433422]'
                      : 'bg-gray-50/80 hover:bg-gray-100 text-gray-800'
                  )
                }`}
              >
                <RiSparklingLine size={18} />
                <span className="text-sm font-medium">All</span>
              </motion.button>

              {!loading && categories.map((category) => (
                <motion.button
                  key={category.id}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCategoryChange(category)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full whitespace-nowrap transition-all duration-200 ${
                    selectedCategories?.some(c => c.id === category.id) ? (
                      currentTheme === 'dark'
                        ? 'bg-white text-gray-900'
                        : currentTheme === 'eyeCare'
                        ? 'bg-[#433422] text-[#F5E6D3]'
                        : 'bg-gray-900 text-white'
                    ) : (
                      currentTheme === 'dark'
                        ? 'bg-gray-800/80 hover:bg-gray-700 text-white'
                        : currentTheme === 'eyeCare'
                        ? 'bg-[#E6D5BC] hover:bg-[#D4C3AA] text-[#433422]'
                        : 'bg-gray-50/80 hover:bg-gray-100 text-gray-800'
                    )
                  }`}
                >
                  {category.icon}
                  <span className="text-sm font-medium">
                    {category.type === 'sub' ? `${category.parentName} - ${category.name}` : category.name}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;

