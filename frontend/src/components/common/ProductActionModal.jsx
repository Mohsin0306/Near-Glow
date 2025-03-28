import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RiSubtractLine, RiAddLine, RiCloseLine } from 'react-icons/ri';
import { useMediaQuery } from '@mui/material';

const ProductActionModal = ({ 
  isOpen, 
  onClose, 
  product, 
  selectedColor, 
  onColorSelect, 
  quantity, 
  setQuantity, 
  onAction, 
  loading, 
  currentTheme,
  mode // 'cart' or 'buy'
}) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [productImage, setProductImage] = useState('');

  // Update product image when selected color changes
  useEffect(() => {
    if (selectedColor?.media && selectedColor.media.length > 0) {
      // Use the first image from the selected color
      setProductImage(selectedColor.media[0].url);
    } else if (product?.media && product.media.length > 0) {
      // Fallback to the first product image
      setProductImage(product.media[0].url);
    }
  }, [selectedColor, product]);

  const modalVariants = {
    hidden: isMobile 
      ? { y: '100%' } 
      : { x: '100%', opacity: 0 },
    visible: isMobile 
      ? { 
          y: 0,
          transition: {
            type: 'spring',
            damping: 30,
            stiffness: 300
          }
        }
      : { 
          x: 0,
          opacity: 1,
          transition: {
            type: 'spring',
            damping: 25,
            stiffness: 280
          }
        },
    exit: isMobile 
      ? { y: '100%' }
      : { 
          x: '100%',
          opacity: 0,
          transition: { duration: 0.2 }
        }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const handleAction = () => {
    console.log(`Performing ${mode} action with:`, {
      product,
      selectedColor,
      quantity
    });
    onAction();
  };

  // Handle color selection within the modal
  const handleColorSelect = (color) => {
    console.log('Modal color selected:', color);
    onColorSelect(color);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`fixed z-50 ${
              isMobile 
                ? 'bottom-0 left-0 right-0' 
                : 'top-0 right-0 h-full w-full max-w-md'
            }`}
            style={{
              margin: isMobile ? '0 auto' : '0',
              ...(isMobile ? {} : { height: '100vh', overflowY: 'auto' })
            }}
          >
            <div className={`${
              isMobile ? 'rounded-t-3xl' : ''
            } h-full shadow-xl overflow-hidden ${
              currentTheme === 'dark' ? 'bg-gray-900' 
              : currentTheme === 'eyeCare' ? 'bg-[#F5E6D3]'
              : 'bg-white'
            }`}>
              {/* Header with close button */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200/10">
                <h3 className={`text-lg font-semibold ${
                  currentTheme === 'dark' ? 'text-white' 
                  : currentTheme === 'eyeCare' ? 'text-[#433422]'
                  : 'text-gray-900'
                }`}>
                  {mode === 'cart' ? 'Add to Cart' : 'Buy Now'}
                </h3>
                <button
                  onClick={onClose}
                  className={`p-2 rounded-xl hover:bg-gray-100/10 ${
                    currentTheme === 'dark' ? 'text-gray-400' 
                    : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]'
                    : 'text-gray-500'
                  }`}
                >
                  <RiCloseLine size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Product Info */}
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                    <img 
                      src={productImage || (product?.media[0]?.url || '')} 
                      alt={product?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-medium mb-2 ${
                      currentTheme === 'dark' ? 'text-white' 
                      : currentTheme === 'eyeCare' ? 'text-[#433422]'
                      : 'text-gray-900'
                    }`}>
                      {product?.name}
                    </h3>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-lg font-bold ${
                        currentTheme === 'dark' ? 'text-white' 
                        : currentTheme === 'eyeCare' ? 'text-[#433422]'
                        : 'text-gray-900'
                      }`}>
                        RS {product?.salePrice?.toLocaleString()}
                      </span>
                      <span className={`text-sm line-through ${
                        currentTheme === 'dark' ? 'text-gray-400' 
                        : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]/60'
                        : 'text-gray-500'
                      }`}>
                        RS {product?.marketPrice?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Colors */}
                {product?.colors && product.colors.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${
                        currentTheme === 'dark' ? 'text-white' 
                        : currentTheme === 'eyeCare' ? 'text-[#433422]'
                        : 'text-gray-900'
                      }`}>
                        Color:
                      </span>
                      <span className={`text-sm ${
                        currentTheme === 'dark' ? 'text-gray-300' 
                        : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]'
                        : 'text-gray-600'
                      }`}>
                        {selectedColor?.name || product.colors[0].name}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {product.colors.map((color, index) => (
                        <button
                          key={index}
                          onClick={() => handleColorSelect(color)}
                          className={`group relative p-0.5 ${
                            selectedColor?.name === color.name 
                              ? 'ring-2 ring-blue-500 rounded-lg'
                              : ''
                          }`}
                        >
                          <div className="flex flex-col items-center gap-0.5">
                            <div
                              className={`w-10 h-10 rounded-lg border ${
                                color.name.toLowerCase() === 'white' 
                                  ? 'border-gray-300' 
                                  : 'border-transparent'
                              }`}
                              style={{ backgroundColor: color.name.toLowerCase() }}
                            />
                            <span className={`text-xs ${
                              currentTheme === 'dark' ? 'text-gray-300' 
                              : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]'
                              : 'text-gray-600'
                            }`}>
                              {color.name}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div className="space-y-3">
                  <h4 className={`font-medium ${
                    currentTheme === 'dark' ? 'text-white' 
                    : currentTheme === 'eyeCare' ? 'text-[#433422]'
                    : 'text-gray-900'
                  }`}>
                    Select Quantity
                  </h4>
                  <div className="flex items-center gap-4">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className={`p-3 rounded-xl ${
                        currentTheme === 'dark'
                          ? 'bg-gray-800 text-white hover:bg-gray-700'
                          : currentTheme === 'eyeCare'
                          ? 'bg-[#E6D5B8] text-[#433422] hover:bg-[#E6D5B8]/90'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      <RiSubtractLine size={20} />
                    </motion.button>
                    <span className={`text-lg font-medium ${
                      currentTheme === 'dark' ? 'text-white' 
                      : currentTheme === 'eyeCare' ? 'text-[#433422]'
                      : 'text-gray-900'
                    }`}>
                      {quantity}
                    </span>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setQuantity(q => Math.min(product?.stock || 1, q + 1))}
                      className={`p-3 rounded-xl ${
                        currentTheme === 'dark'
                          ? 'bg-gray-800 text-white hover:bg-gray-700'
                          : currentTheme === 'eyeCare'
                          ? 'bg-[#E6D5B8] text-[#433422] hover:bg-[#E6D5B8]/90'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      <RiAddLine size={20} />
                    </motion.button>
                  </div>
                </div>

                {/* Action Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAction}
                  disabled={loading}
                  className={`w-full py-4 px-6 rounded-xl font-medium relative overflow-hidden
                    ${mode === 'cart' 
                      ? currentTheme === 'dark'
                        ? 'bg-gray-800 text-white hover:bg-gray-700'
                        : currentTheme === 'eyeCare'
                        ? 'bg-[#E6D5B8] text-[#433422] hover:bg-[#E6D5B8]/90'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      : currentTheme === 'dark'
                        ? 'bg-white text-gray-900 hover:bg-gray-100'
                        : currentTheme === 'eyeCare'
                        ? 'bg-[#433422] text-[#F5E6D3] hover:bg-[#433422]/90'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>{mode === 'cart' ? 'Adding...' : 'Processing...'}</span>
                    </div>
                  ) : (
                    mode === 'cart' 
                      ? `Add to Cart • RS ${((product?.salePrice * quantity) + (product?.deliveryPrice || 0)).toLocaleString()}`
                      : `Buy Now • RS ${((product?.salePrice * quantity) + (product?.deliveryPrice || 0)).toLocaleString()}`
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProductActionModal; 