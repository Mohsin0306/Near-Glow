import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../../context/ThemeContext';

const ProductCardSkeleton = () => {
  const { currentTheme } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl ${
        currentTheme === 'dark' 
          ? 'bg-gray-800/80' 
          : currentTheme === 'eyeCare'
          ? 'bg-[#E6D5BC]'
          : 'bg-white'
      } shadow-lg`}
    >
      {/* Image Skeleton */}
      <div className="relative aspect-square">
        <div className={`w-full h-full rounded-t-2xl animate-pulse ${
          currentTheme === 'dark' 
            ? 'bg-gray-700' 
            : currentTheme === 'eyeCare'
            ? 'bg-[#D4C4A9]'
            : 'bg-gray-200'
        }`} />
      </div>

      {/* Content Skeleton */}
      <div className="p-4 space-y-3">
        {/* Title Skeleton */}
        <div className={`h-4 rounded-full w-3/4 animate-pulse ${
          currentTheme === 'dark' 
            ? 'bg-gray-700' 
            : currentTheme === 'eyeCare'
            ? 'bg-[#D4C4A9]'
            : 'bg-gray-200'
        }`} />

        {/* Price and Status Skeleton */}
        <div className="flex items-center justify-between">
          <div className={`h-4 rounded-full w-1/3 animate-pulse ${
            currentTheme === 'dark' 
              ? 'bg-gray-700' 
              : currentTheme === 'eyeCare'
              ? 'bg-[#D4C4A9]'
              : 'bg-gray-200'
          }`} />
          <div className={`h-4 rounded-full w-1/4 animate-pulse ${
            currentTheme === 'dark' 
              ? 'bg-gray-700' 
              : currentTheme === 'eyeCare'
              ? 'bg-[#D4C4A9]'
              : 'bg-gray-200'
          }`} />
        </div>
      </div>

      {/* Loading Overlay */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
    </motion.div>
  );
};

export default ProductCardSkeleton; 