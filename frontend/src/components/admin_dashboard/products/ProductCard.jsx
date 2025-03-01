import React from 'react';
import { motion } from 'framer-motion';
import { RiEditLine, RiDeleteBinLine, RiLoader4Line } from 'react-icons/ri';
import { useTheme } from '../../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-hot-toast';

const ProductCard = ({ product, onEdit, onDelete, isLoading }) => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(product); // This will trigger the edit modal with the product data
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(product); // This will trigger the delete confirmation modal
  };

  const handleCardClick = () => {
    if (user && user._id) {
      navigate(`/${user._id}/admin/product/${product._id}`);
    } else {
      toast.error('User session expired. Please login again.');
      navigate('/login');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative overflow-hidden rounded-2xl cursor-pointer ${
        currentTheme === 'dark' 
          ? 'bg-gray-800/80 hover:bg-gray-800' 
          : currentTheme === 'eyeCare'
          ? 'bg-[#E6D5BC] hover:bg-[#E6D5BC]/90'
          : 'bg-white hover:bg-white/90'
      } shadow-lg hover:shadow-xl transition-all duration-300`}
      onClick={handleCardClick}
    >
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="animate-spin">
            <RiLoader4Line size={32} className="text-white" />
          </div>
        </div>
      )}

      {/* Product Image */}
      <div className="relative aspect-square">
        <img 
          src={product.media?.find(m => m.type === 'image')?.url || '/placeholder.jpg'}
          alt={product.name}
          className="w-full h-full object-cover rounded-t-2xl"
        />
        
        {/* Desktop Actions (hover) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden lg:block">
          <div className="absolute bottom-4 right-4 flex gap-2 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <button
              onClick={handleEdit}
              className="p-2 bg-white/20 rounded-xl backdrop-blur-md hover:bg-white/30 transition-all duration-300"
            >
              <RiEditLine size={18} className="text-white" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 bg-white/20 rounded-xl backdrop-blur-md hover:bg-red-400/30 transition-all duration-300"
            >
              <RiDeleteBinLine size={18} className="text-white" />
            </button>
          </div>
        </div>

        {/* Mobile Actions (always visible) */}
        <div className="absolute top-2 right-2 flex gap-2 lg:hidden">
          <button
            onClick={handleEdit}
            className={`p-2 rounded-xl backdrop-blur-md 
              ${currentTheme === 'dark' 
                ? 'bg-gray-800/80 text-white' 
                : currentTheme === 'eyeCare'
                ? 'bg-[#E6D5BC]/80 text-[#433422]'
                : 'bg-white/80 text-gray-700'
              } shadow-sm active:scale-95 transition-all duration-200`}
          >
            <RiEditLine size={18} />
          </button>
          <button
            onClick={handleDelete}
            className={`p-2 rounded-xl backdrop-blur-md shadow-sm active:scale-95 transition-all duration-200
              ${currentTheme === 'eyeCare'
                ? 'bg-[#433422]/80 text-white'
                : 'bg-red-500/80 text-white'
              }`}
          >
            <RiDeleteBinLine size={18} />
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4 space-y-2">
        <h3 className={`text-sm font-semibold truncate ${
          currentTheme === 'dark' ? 'text-white' 
          : currentTheme === 'eyeCare' ? 'text-[#433422]'
          : 'text-gray-900'
        }`}>
          {product.name}
        </h3>
        
        <div className="flex items-center justify-between">
          <p className={`text-sm font-bold ${
            currentTheme === 'dark' ? 'text-white' 
            : currentTheme === 'eyeCare' ? 'text-[#433422]'
            : 'text-gray-900'
          }`}>
            Rs: {product.price.toLocaleString('en-IN')}
          </p>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            product.stock > 0
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {product.stock > 0 ? 'In Stock' : 'Out'}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard; 