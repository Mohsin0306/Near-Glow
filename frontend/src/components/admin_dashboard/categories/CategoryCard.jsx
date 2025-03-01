import React, { useState } from 'react';
import { RiEditLine, RiDeleteBinLine, RiStarLine } from 'react-icons/ri';
import { useTheme } from '../../../context/ThemeContext';
import * as RiIcons from 'react-icons/ri';
import { motion } from 'framer-motion';

const MAX_VISIBLE_SUBCATEGORIES = 3; // Reduced to fit in one row
const MAX_VISIBLE_COLLECTIONS = 2; // Show 2 featured collections

const CategoryCard = ({ category, onEdit, onDelete }) => {
  const { currentTheme } = useTheme();
  const [showAllSubcategories, setShowAllSubcategories] = useState(false);
  
  // Add debug logs
  console.log('Category:', category);
  console.log('Collections:', category.collections);

  // Add validation check
  if (!category || !category._id) {
    return null;
  }

  // Get the icon component from RiIcons
  const IconComponent = category.icon && RiIcons[category.icon];
  
  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (category && category._id) {
      onDelete(category);
    }
  };

  const visibleSubcategories = showAllSubcategories 
    ? category.subcategories 
    : category.subcategories.slice(0, MAX_VISIBLE_SUBCATEGORIES);

  const hasMoreSubcategories = category.subcategories.length > MAX_VISIBLE_SUBCATEGORIES;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative overflow-hidden rounded-3xl ${
        currentTheme === 'dark' 
          ? 'bg-gray-800/80 hover:bg-gray-800' 
          : currentTheme === 'eyeCare'
          ? 'bg-[#E6D5BC] hover:bg-[#E6D5BC]/90'
          : 'bg-white hover:bg-white/90'
      } shadow-lg ring-1 ring-black/5 hover:shadow-xl transition-all duration-300`}
    >
      <div className="relative h-56">
        <img 
          src={category.image?.url}
          alt={category.name}
          className="w-full h-full object-cover"
        />
        <div className={`absolute inset-0 ${category.bgPattern} ${category.color} opacity-70 mix-blend-multiply`} />
        <div className="absolute inset-0 p-6 flex flex-col justify-end bg-gradient-to-t from-black/60 via-black/30 to-transparent">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 mb-3"
          >
            <span className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md">
              {IconComponent && <IconComponent size={24} className="text-white" />}
            </span>
            <span className="text-sm font-medium bg-white/20 px-4 py-1.5 rounded-full backdrop-blur-md text-white">
              {category.items || 0} {category.items === 1 ? 'Product' : 'Products'}
            </span>
            <div className="absolute top-0 right-0 flex gap-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onEdit(category);
                }}
                className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md hover:bg-white/30 transition-all duration-300"
              >
                <RiEditLine size={20} className="text-white" />
              </button>
              <button
                onClick={handleDelete}
                className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md hover:bg-red-400/30 transition-all duration-300"
              >
                <RiDeleteBinLine size={20} className="text-white" />
              </button>
            </div>
          </motion.div>
          <h3 className="text-2xl font-bold mb-2 text-white">{category.name}</h3>
          <p className="text-white/90 text-sm">{category.description}</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Debug render */}
        <div className="text-xs text-gray-500">
          {JSON.stringify(category.collections)}
        </div>

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
                  {category.featured.slice(0, MAX_VISIBLE_COLLECTIONS).map((collection, idx) => (
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
                  {category.featured.length > MAX_VISIBLE_COLLECTIONS && (
                    <span className={`text-xs ${
                      currentTheme === 'dark' ? 'text-gray-400' 
                      : currentTheme === 'eyeCare' ? 'text-[#433422]/70'
                      : 'text-gray-500'
                    }`}>
                      +{category.featured.length - MAX_VISIBLE_COLLECTIONS} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Second Row: Subcategories */}
        {category.subcategories?.length > 0 && (
          <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            <div className="flex gap-2">
              {visibleSubcategories.map((sub, idx) => (
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
              {hasMoreSubcategories && (
                <button
                  onClick={() => setShowAllSubcategories(!showAllSubcategories)}
                  className={`text-xs ${
                    currentTheme === 'dark' ? 'text-gray-400' 
                    : currentTheme === 'eyeCare' ? 'text-[#433422]/70'
                    : 'text-gray-500'
                  }`}
                >
                  {showAllSubcategories ? 'Show less' : `+${category.subcategories.length - MAX_VISIBLE_SUBCATEGORIES} more`}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CategoryCard; 