import React from 'react';
import { motion } from 'framer-motion';
import { RiStarFill } from 'react-icons/ri';

const SearchResults = ({ results, query, loading, currentTheme }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {results.map((product) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl overflow-hidden shadow-lg transition-all duration-300 ${
              currentTheme === 'dark' 
                ? 'bg-gray-800 hover:bg-gray-750' 
                : currentTheme === 'eyeCare'
                ? 'bg-[#E6D5BC] hover:bg-[#E6D5BC]/90'
                : 'bg-white hover:bg-white/90'
            }`}
          >
            <div className="relative aspect-square">
              <img 
                src={product.media?.[0]?.url || 'https://via.placeholder.com/300x300?text=Product+Image'}
                alt={product.title}
                className="w-full h-full object-cover"
              />
              {product.stock <= 0 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-xs font-medium px-2 py-0.5 rounded-full bg-red-500">
                    Out of Stock
                  </span>
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="text-sm font-semibold mb-1 line-clamp-2">
                {product.title}
              </h3>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-bold">
                  Rs {product.price.toLocaleString('en-PK')}
                </p>
                {product.rating.count > 0 && (
                  <div className="flex items-center gap-1">
                    <RiStarFill className="text-yellow-400" size={14} />
                    <span className="text-xs opacity-60">
                      {product.rating.rate.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between text-xs opacity-60">
                <span>{product.category}</span>
                <span>{product.stock} in stock</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SearchResults; 