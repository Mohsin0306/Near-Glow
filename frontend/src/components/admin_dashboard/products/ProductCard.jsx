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

  // Early return if product is not defined
  if (!product) {
    return null;
  }

  // Format price with fallback values
  const formatPrice = (price) => {
    return typeof price === 'number' ? price.toLocaleString('en-PK') : '0';
  };

  // Safely get discount percentage
  const getDiscountPercentage = () => {
    if (product.marketPrice && product.salePrice) {
      const discount = ((product.marketPrice - product.salePrice) / product.marketPrice) * 100;
      return Math.round(discount);
    }
    return 0;
  };

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
      className={`group relative overflow-hidden rounded-xl cursor-pointer w-full max-w-[280px] ${
        currentTheme === 'dark' 
          ? 'bg-gray-800/80 hover:bg-gray-800' 
          : currentTheme === 'eyeCare'
          ? 'bg-[#E6D5BC] hover:bg-[#E6D5BC]/90'
          : 'bg-white hover:bg-white/90'
      } shadow-md hover:shadow-lg transition-all duration-300`}
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

      {/* Product Image with Actions */}
      <div className="relative aspect-[4/3]">
        <img 
          src={product.media?.find(m => m.type === 'image')?.url || '/placeholder.jpg'}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        
        {/* Desktop Actions */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden lg:flex items-end justify-end p-3">
          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              className="p-2 bg-white/20 rounded-lg backdrop-blur-md hover:bg-white/30 transition-all duration-300"
            >
              <RiEditLine size={16} className="text-white" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 bg-white/20 rounded-lg backdrop-blur-md hover:bg-red-400/30 transition-all duration-300"
            >
              <RiDeleteBinLine size={16} className="text-white" />
            </button>
          </div>
        </div>

        {/* Mobile Actions */}
        <div className="absolute top-2 right-2 flex gap-2 lg:hidden">
          <button
            onClick={handleEdit}
            className={`p-1.5 rounded-lg backdrop-blur-md 
              ${currentTheme === 'dark' 
                ? 'bg-gray-800/80 text-white' 
                : currentTheme === 'eyeCare'
                ? 'bg-[#E6D5BC]/80 text-[#433422]'
                : 'bg-white/80 text-gray-700'
              } shadow-sm active:scale-95 transition-all duration-200`}
          >
            <RiEditLine size={16} />
          </button>
          <button
            onClick={handleDelete}
            className={`p-1.5 rounded-lg backdrop-blur-md shadow-sm active:scale-95 transition-all duration-200
              ${currentTheme === 'eyeCare'
                ? 'bg-[#433422]/80 text-white'
                : 'bg-red-500/80 text-white'
              }`}
          >
            <RiDeleteBinLine size={16} />
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-3 space-y-1.5">
        {/* Title */}
        <h3 className={`text-sm font-medium leading-tight truncate ${
          currentTheme === 'dark' ? 'text-white' 
          : currentTheme === 'eyeCare' ? 'text-[#433422]'
          : 'text-gray-900'
        }`}>
          {product.name}
        </h3>
        
        {/* Pricing Row */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1.5">
            <span className={`text-sm font-bold ${
              currentTheme === 'dark' ? 'text-white' 
              : currentTheme === 'eyeCare' ? 'text-[#433422]'
              : 'text-gray-900'
            }`}>
              Rs {formatPrice(product.salePrice)}
            </span>
            {product.marketPrice > product.salePrice && (
              <span className={`text-xs line-through ${
                currentTheme === 'dark' ? 'text-gray-400' 
                : currentTheme === 'eyeCare' ? 'text-[#433422]/70'
                : 'text-gray-500'
              }`}>
                Rs {formatPrice(product.marketPrice)}
              </span>
            )}
          </div>
        </div>

        {/* Discount and Status Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getDiscountPercentage() > 0 && (
              <span className="text-xs font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                {getDiscountPercentage()}% OFF
              </span>
            )}
            {(product.deliveryPrice || 0) === 0 && (
              <span className="text-xs text-green-600 font-medium">
                Free Delivery
              </span>
            )}
          </div>
          <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            (product.stock || 0) > 0
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {(product.stock || 0) > 0 ? 'In Stock' : 'Out'}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard; 