import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { RiStarLine, RiLoader4Line, RiFlowerLine } from 'react-icons/ri';
import * as RiIcons from 'react-icons/ri';
import { createAPI, categoryAPI } from '../../utils/api';

const Categories = () => {
  const { currentTheme } = useTheme();
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentCategory, setCurrentCategory] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await categoryAPI.getCategories();
        
        if (response.data.success) {
          setCategories(response.data.data);
          
          if (categoryId) {
            const category = response.data.data.find(cat => cat._id === categoryId);
            if (category) {
              setCurrentCategory(category);
            } else {
              navigate('/categories');
            }
          }
        } else {
          setError('Failed to load categories');
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        setError('Failed to load categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [categoryId, navigate]);

  const handleCategoryClick = (category) => {
    navigate(`/categories/${category._id}`);
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        currentTheme === 'dark' ? 'bg-gray-900 text-white' 
        : currentTheme === 'eyeCare' ? 'bg-[#F5E6D3] text-[#433422]'
        : 'bg-white text-gray-900'
      }`}>
        <RiLoader4Line className="animate-spin text-4xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        currentTheme === 'dark' ? 'bg-gray-900 text-red-400' 
        : currentTheme === 'eyeCare' ? 'bg-[#F5E6D3] text-red-800'
        : 'bg-white text-red-600'
      }`}>
        <p>{error}</p>
      </div>
    );
  }

  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>No categories available</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${
      currentTheme === 'dark' ? 'bg-gray-900 text-white' 
      : currentTheme === 'eyeCare' ? 'bg-[#F5E6D3] text-[#433422]'
      : 'bg-white text-gray-900'
    }`}>
      <div className="relative h-48 overflow-hidden">
        <div 
          className="absolute inset-0 bg-center bg-cover"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1583445095369-5cc4a5dae6e7?q=80&w=1000')",
            transform: "translateZ(0)",
          }}
        >
          <div className={`absolute inset-0 ${
            currentTheme === 'dark' ? 'bg-gray-900/70' 
            : currentTheme === 'eyeCare' ? 'bg-[#F5E6D3]/70'
            : 'bg-white/70'
          } backdrop-blur-sm`} />
        </div>
        <div className="relative h-full max-w-7xl mx-auto px-4 flex flex-col justify-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Fragrance Collections</h1>
          <p className={`text-base md:text-lg ${
            currentTheme === 'dark' ? 'text-gray-300' 
            : currentTheme === 'eyeCare' ? 'text-[#433422]/90'
            : 'text-gray-700'
          }`}>
            Discover your signature scent from our curated collections
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            if (!category || !category._id) {
              console.warn('Invalid category object:', category);
              return null;
            }

            const IconComponent = (category.icon && RiIcons[category.icon]) || RiFlowerLine;
            const isActive = currentCategory?._id === category._id;

            return (
              <motion.div
                key={category._id}
                onClick={() => handleCategoryClick(category)}
                className={`cursor-pointer group relative overflow-hidden rounded-3xl ${
                  isActive ? 'ring-2 ring-blue-500' : ''
                } ${
                  currentTheme === 'dark' 
                    ? 'bg-gray-800/80 hover:bg-gray-800' 
                    : currentTheme === 'eyeCare'
                    ? 'bg-[#E6D5BC] hover:bg-[#E6D5BC]/90'
                    : 'bg-white hover:bg-white/90'
                } shadow-lg`}
              >
                <div className="relative h-56">
                  <img 
                    src={category.image?.url || 'https://via.placeholder.com/400x300'} 
                    alt={category.name || 'Category'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x300';
                    }}
                  />
                  <div className={`absolute inset-0 ${category.bgPattern || ''} ${category.color || ''} opacity-70 mix-blend-multiply`} />
                  <div className="absolute inset-0 p-6 flex flex-col justify-end bg-gradient-to-t from-black/60 via-black/30 to-transparent">
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="flex items-center gap-3 mb-3"
                    >
                      <span className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md">
                        <IconComponent size={24} className="text-white" />
                      </span>
                    </motion.div>
                    <h3 className="text-2xl font-bold mb-2 text-white">
                      {category.name || 'Unnamed Category'}
                    </h3>
                    <p className="text-white/90 text-sm">
                      {category.description || 'No description available'}
                    </p>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  {/* First Row: Featured Collections with Heading */}
                  {Array.isArray(category.featured) && category.featured.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <RiStarLine className="text-yellow-500" size={18} />
                          <span className={`text-sm font-medium ${
                            currentTheme === 'dark' ? 'text-white' 
                            : currentTheme === 'eyeCare' ? 'text-[#433422]'
                            : 'text-gray-900'
                          }`}>Collections:</span>
                        </div>
                        <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                          <div className="flex gap-2">
                            {category.featured.slice(0, 3).map((collection, idx) => (
                              <motion.span
                                key={idx}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap ${
                                  currentTheme === 'dark'
                                    ? 'bg-gray-700/50 hover:bg-gray-700 text-white'
                                    : currentTheme === 'eyeCare'
                                    ? 'bg-[#433422]/10 hover:bg-[#433422]/20 text-[#433422]'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                                }`}
                              >
                                {collection}
                              </motion.span>
                            ))}
                            {category.featured.length > 3 && (
                              <span className={`text-xs ${
                                currentTheme === 'dark' ? 'text-gray-400' 
                                : currentTheme === 'eyeCare' ? 'text-[#433422]/70'
                                : 'text-gray-500'
                              }`}>
                                +{category.featured.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Second Row: Subcategories */}
                  {Array.isArray(category.subcategories) && category.subcategories.length > 0 && (
                    <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                      <div className="flex gap-2">
                        {category.subcategories.map((sub, idx) => (
                          <motion.span
                            key={idx}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap ${
                              currentTheme === 'dark' 
                                ? 'bg-gray-700/50 hover:bg-gray-700 text-white' 
                                : currentTheme === 'eyeCare'
                                ? 'bg-[#433422]/10 hover:bg-[#433422]/20 text-[#433422]'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                            }`}
                          >
                            {sub}
                          </motion.span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {currentCategory && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed inset-0 z-50 overflow-y-auto bg-black/50"
          onClick={() => {
            setCurrentCategory(null);
            navigate('/categories');
          }}
        >
          <div className="min-h-screen flex items-center justify-center p-4">
            <div 
              className={`relative max-w-2xl w-full rounded-2xl p-6 ${
                currentTheme === 'dark' ? 'bg-gray-800' 
                : currentTheme === 'eyeCare' ? 'bg-[#F5E6D3]'
                : 'bg-white'
              }`}
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-4">{currentCategory.name}</h2>
              <p className="mb-4">{currentCategory.description}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Categories;