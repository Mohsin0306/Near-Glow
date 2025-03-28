import React from 'react';
import { motion } from 'framer-motion';
import { RiStarFill } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';

const SearchResults = ({ 
  results = [], 
  query = '', 
  loading = false, 
  currentTheme = 'light',
  onProductClick = null
}) => {
  const navigate = useNavigate();

  // Handle product click with fallback to navigate
  const handleProductClick = (productId) => {
    if (onProductClick) {
      onProductClick(productId);
    } else {
      navigate(`/product/${productId}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!Array.isArray(results)) {
    console.error('Search results is not an array:', results);
    return (
      <div className="py-10 text-center">
        <p>No results found. Please try a different search term.</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="py-10 text-center">
        <h2 className="text-xl font-semibold mb-2">
          No results found for "{query}"
        </h2>
        <p className="text-sm opacity-60">
          Try checking your spelling or use more general terms.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold">
          Search Results for "{query}"
        </h2>
        <p className="text-sm opacity-60 mt-1">
          {results.length} products found
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {results.map((product) => (
          <motion.div
            key={product._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-lg overflow-hidden transition-all ${
              currentTheme === 'dark' 
                ? 'bg-gray-800 hover:bg-gray-750' 
                : currentTheme === 'eyeCare'
                ? 'bg-[#E6D5BC] hover:bg-[#E6D5BC]/90'
                : 'bg-white hover:bg-white/90'
            }`}
            onClick={() => handleProductClick(product._id)}
          >
            <div className="relative aspect-square overflow-hidden">
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
              {product.stock <= 0 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-xs font-medium px-2 py-0.5 rounded-full bg-red-500">
                    Out of Stock
                  </span>
                </div>
              )}
            </div>
            <div className="p-2">
              <h3 className="text-xs font-medium line-clamp-1">
                {product.name}
              </h3>
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
  );
};

export default SearchResults; 