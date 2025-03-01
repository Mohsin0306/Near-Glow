import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RiEditLine, RiArrowLeftLine, RiLoader4Line, RiStore2Line, RiPriceTag3Line, RiCheckboxCircleLine, RiMoneyDollarCircleLine, RiSaveLine, RiCloseLine, RiZoomInLine, RiArrowLeftSLine, RiArrowRightSLine, RiPlayCircleLine, RiPauseCircleLine, RiShoppingCart2Line, RiHeartLine, RiHeartFill, RiShareLine, RiSubtractLine } from 'react-icons/ri';
import { useTheme } from '../../context/ThemeContext';
import { createAPI, productAPI } from '../../utils/api';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useMediaQuery } from '@mui/material';
import { useSwipeable } from 'react-swipeable';
import axios from 'axios';

const imageVariants = {
  enter: { opacity: 0, scale: 1.1 },
  center: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
};

const ProductDetails = ({ cartItems, setCartItems, fetchCartData, updateCart }) => {
  const { currentTheme } = useTheme();
  const { user, isAuthenticated, token } = useAuth();
  const { id, productId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(0);
  const [editedProduct, setEditedProduct] = useState(null);
  const [showZoom, setShowZoom] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef(null);
  const videoRef = useRef(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [mediaState, setMediaState] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [videoDuration, setVideoDuration] = useState('0:00');
  const [currentTime, setCurrentTime] = useState('0:00');
  const [progress, setProgress] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (product?.media?.length > 1) {
        setSelectedMedia(prev => 
          prev === product.media.length - 1 ? 0 : prev + 1
        );
      }
    },
    onSwipedRight: () => {
      if (product?.media?.length > 1) {
        setSelectedMedia(prev => 
          prev === 0 ? product.media.length - 1 : prev - 1
        );
      }
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: false
  });

  useEffect(() => {
    if (product && (!editedProduct || product._id !== editedProduct._id)) {
      const formattedMedia = (product.media || []).map(media => ({
        type: media.type,
        public_id: media.public_id,
        url: media.url,
        thumbnail: media.thumbnail || null,
        _id: media._id
      }));

      setEditedProduct({
        ...product,
        media: formattedMedia,
        specifications: product.specifications || [],
        features: product.features || [],
        category: {
          _id: product.category._id || product.category,
          name: product.category.name || ''
        }
      });
    }
  }, [product]);

  useEffect(() => {
    if (product?.media) {
      setMediaState(product.media);
    }
  }, [product?.media]);

  useEffect(() => {
    if (editedProduct && mediaState.length > 0) {
      setEditedProduct(prev => ({
        ...prev,
        media: mediaState
      }));
    }
  }, [mediaState]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        // Create API instance with token if authenticated
        const api = createAPI(isAuthenticated ? token : null);
        const response = await api.get(`/products/${productId}`);
        
        if (response.data.success) {
          setProduct(response.data.product);
          // If user is authenticated, check wishlist status
          if (isAuthenticated) {
            const wishlistResponse = await api.get(`/wishlist/`);
            setIsInWishlist(wishlistResponse.data.isWishlisted);
          }
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Failed to fetch product details');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, isAuthenticated, token]);

  const handleUpdateProduct = async () => {
    try {
      // Create a deep copy of the edited product
      const formData = new FormData();
      
      // Add basic product details
      formData.append('name', editedProduct.name);
      formData.append('description', editedProduct.description);
      formData.append('price', Number(editedProduct.price));
      formData.append('stock', Number(editedProduct.stock));
      formData.append('brand', editedProduct.brand);
      formData.append('category', editedProduct.category._id || editedProduct.category);
      formData.append('subcategories', JSON.stringify(editedProduct.subcategories || []));
      formData.append('specifications', JSON.stringify(editedProduct.specifications));
      formData.append('features', JSON.stringify(editedProduct.features));
      formData.append('status', editedProduct.status || 'draft');

      // Add existing media as existingMedia
      if (editedProduct.media && editedProduct.media.length > 0) {
        editedProduct.media.forEach((mediaItem, index) => {
          formData.append('existingMedia', JSON.stringify({
            type: mediaItem.type,
            public_id: mediaItem.public_id,
            url: mediaItem.url,
            thumbnail: mediaItem.thumbnail,
            _id: mediaItem._id
          }));
        });
      }

      // Log the data being sent
      console.log('Sending update with media:', editedProduct.media);

      const response = await productAPI.put(`/products/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        // Fetch fresh data after update
        const updatedProductResponse = await productAPI.get(`/products/${id}`);
        if (updatedProductResponse.data.success) {
          const updatedProduct = updatedProductResponse.data.product;
          setProduct(updatedProduct);
          setEditedProduct({
            ...updatedProduct,
            category: {
              _id: updatedProduct.category._id || updatedProduct.category,
              name: updatedProduct.category.name || ''
            }
          });
          toast.success('Product updated successfully');
          setIsEditing(false);
        }
      }
    } catch (error) {
      console.error('Update error:', error.response?.data || error);
      toast.error(error.response?.data?.message || 'Failed to update product');
    }
  };

  const handleInputChange = (field, value) => {
    setEditedProduct(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSpecificationChange = (index, key, value) => {
    const newSpecs = [...editedProduct.specifications];
    newSpecs[index] = { ...newSpecs[index], [key]: value };
    setEditedProduct(prev => ({
      ...prev,
      specifications: newSpecs
    }));
  };

  const handleFeatureChange = (index, value) => {
    const newFeatures = [...editedProduct.features];
    newFeatures[index] = value;
    setEditedProduct(prev => ({
      ...prev,
      features: newFeatures
    }));
  };

  const handleBackClick = () => {
    navigate(`/${user._id}/products`);
  };

  const handleVideoPlay = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play()
          .then(() => {
            setIsPlaying(true);
            // Hide controls after 2 seconds
            setTimeout(() => {
              setShowControls(false);
            }, 2000);
          })
          .catch(error => {
            console.error('Error playing video:', error);
            toast.error('Failed to play video');
          });
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
        setShowControls(true);
      }
    }
  };

  const handleVideoInteraction = () => {
    // Clear any existing timeout
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    // Show controls
    setShowControls(true);

    // Hide controls after 2 seconds if video is playing
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2000);
    }
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Update controls visibility when play state changes
  useEffect(() => {
    handleVideoInteraction();
  }, [isPlaying]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add to cart');
      return;
    }

    try {
      setAddingToCart(true);
      const api = createAPI(token);  // Create API with token
      const response = await api.post('/cart/add', {
        productId: product._id,
        quantity: quantity
      });

      if (response.data.success) {
        setIsAdded(true);
        toast.success('Added to cart successfully');
        fetchCartData(); // Refresh cart data
        
        setTimeout(() => {
          setIsAdded(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to proceed with purchase');
      return;
    }

    try {
      await handleAddToCart();
      navigate('/checkout');
    } catch (error) {
      toast.error('Failed to proceed to checkout');
    }
  };

  // Add helper function to format time
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Add video event handlers
  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      setCurrentTime(formatTime(current));
      setProgress((current / duration) * 100);
    }
  };

  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(formatTime(videoRef.current.duration));
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    setShowControls(true);
  };

  // Update video element and controls
  const renderVideoControls = () => (
    <div className={`absolute inset-0 flex flex-col items-center justify-between 
      transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
    >
      {/* Top bar - Title */}
      <div className="w-full p-4 bg-gradient-to-b from-black/50 to-transparent">
        <h3 className="text-white text-sm font-medium truncate">
          {product?.name}
        </h3>
      </div>

      {/* Center - Play/Pause */}
      <button
        onClick={handleVideoPlay}
        className="p-4 rounded-full bg-black/40 hover:bg-black/60 
          transition-all duration-200 transform hover:scale-105"
      >
        {isPlaying ? (
          <RiPauseCircleLine className="w-16 h-16 text-white" />
        ) : (
          <RiPlayCircleLine className="w-16 h-16 text-white" />
        )}
      </button>

      {/* Bottom bar - Progress and time */}
      <div className="w-full bg-gradient-to-t from-black/50 to-transparent">
        {/* Progress bar */}
        <div className="px-4 py-2">
          <div className="relative h-1 bg-white/30 rounded-full">
            <div 
              className="absolute h-full bg-white rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Time and controls */}
        <div className="px-4 pb-4 flex items-center justify-between">
          <div className="text-white text-sm">
            {currentTime} / {videoDuration}
          </div>
          
          {/* Navigation controls */}
          {product?.media?.length > 1 && (
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedMedia(prev => 
                    prev === 0 ? product.media.length - 1 : prev - 1
                  );
                }}
                className="p-2 rounded-full bg-black/40 hover:bg-black/60 
                  transition-all duration-200"
              >
                <RiArrowLeftSLine className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedMedia(prev => 
                    prev === product.media.length - 1 ? 0 : prev + 1
                  );
                }}
                className="p-2 rounded-full bg-black/40 hover:bg-black/60 
                  transition-all duration-200"
              >
                <RiArrowRightSLine className="w-5 h-5 text-white" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderMobileHeader = () => (
    <motion.div
      initial={false}
      animate={{
        backgroundColor: currentTheme === 'dark' 
          ? 'rgb(17, 24, 39)' 
          : currentTheme === 'eyeCare'
          ? 'rgb(245, 230, 211)'
          : 'rgb(255, 255, 255)'
      }}
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 border-b shadow-sm`}
    >
      <div className="flex items-center justify-between gap-4">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)}
          className={`p-2 rounded-xl ${
            currentTheme === 'dark'
              ? 'text-gray-200'
              : currentTheme === 'eyeCare'
              ? 'text-[#433422]'
              : 'text-gray-700'
          }`}
        >
          <RiArrowLeftLine size={24} />
        </motion.button>

        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleWishlistToggle}
            disabled={isAddingToWishlist}
            className={`p-2 rounded-xl ${
              currentTheme === 'dark'
                ? 'text-gray-200'
                : currentTheme === 'eyeCare'
                ? 'text-[#433422]'
                : 'text-gray-700'
            }`}
          >
            {isInWishlist ? (
              <RiHeartFill size={24} className={`text-red-500 ${
                isAddingToWishlist ? 'animate-pulse' : ''
              }`} />
            ) : (
              <RiHeartLine size={24} className={`${
                isAddingToWishlist ? 'animate-pulse' : ''
              }`} />
            )}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {/* Add share handler */}}
            className={`p-2 rounded-xl ${
              currentTheme === 'dark'
                ? 'text-gray-200'
                : currentTheme === 'eyeCare'
                ? 'text-[#433422]'
                : 'text-gray-700'
            }`}
          >
            <RiShareLine size={24} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );

  const renderProductActions = () => (
    <div className={`p-6 rounded-2xl ${
      currentTheme === 'dark' ? 'bg-gray-800' 
      : currentTheme === 'eyeCare' ? 'bg-[#FFF8ED]'
      : 'bg-white'
    } shadow-lg space-y-6`}>
      {/* Quantity Selector */}
      <div className="flex items-center gap-4">
        <span className={`text-sm font-medium ${
          currentTheme === 'dark' ? 'text-gray-300' 
          : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]'
          : 'text-gray-600'
        }`}>
          Quantity
        </span>
        <div className="flex items-center">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setQuantity(q => Math.max(1, q - 1))}
            className={`p-2 rounded-l-xl border ${
              currentTheme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-white'
                : currentTheme === 'eyeCare'
                ? 'bg-white border-[#E6D5B8] text-[#433422]'
                : 'bg-gray-100 border-gray-200 text-gray-600'
            }`}
          >
            -
          </motion.button>
          <div className={`px-4 py-2 border-t border-b ${
            currentTheme === 'dark'
              ? 'bg-gray-700 border-gray-600 text-white'
              : currentTheme === 'eyeCare'
              ? 'bg-white border-[#E6D5B8] text-[#433422]'
              : 'bg-white border-gray-200 text-gray-900'
          }`}>
            {quantity}
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setQuantity(q => Math.min(product?.stock || 1, q + 1))}
            className={`p-2 rounded-r-xl border ${
              currentTheme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-white'
                : currentTheme === 'eyeCare'
                ? 'bg-white border-[#E6D5B8] text-[#433422]'
                : 'bg-gray-100 border-gray-200 text-gray-600'
            }`}
          >
            +
          </motion.button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAddToCart}
          disabled={addingToCart || isAdded || !product?.stock}
          className={`flex-1 h-[52px] rounded-xl font-medium relative overflow-hidden
            ${addingToCart || isAdded ? 'bg-white text-black' : 'bg-black hover:bg-gray-900 text-white'}
            ${!product?.stock ? 'opacity-50 cursor-not-allowed' : ''}
            transition-all duration-300 flex items-center justify-center`}
        >
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={false}
            animate={{
              opacity: addingToCart ? 1 : 0,
              scale: addingToCart ? 1 : 0.8,
            }}
            transition={{ duration: 0.2 }}
          >
            <RiLoader4Line className="w-6 h-6 animate-spin" />
          </motion.div>

          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={false}
            animate={{
              opacity: isAdded ? 1 : 0,
              scale: isAdded ? 1 : 0.8,
            }}
            transition={{ duration: 0.2 }}
          >
            <RiCheckboxCircleLine className="w-6 h-6" />
          </motion.div>

          <motion.div
            className="flex items-center justify-center gap-2"
            initial={false}
            animate={{
              opacity: !addingToCart && !isAdded ? 1 : 0,
              scale: !addingToCart && !isAdded ? 1 : 0.8,
            }}
            transition={{ duration: 0.2 }}
          >
            <RiShoppingCart2Line className="w-5 h-5" />
            <span>Add to Cart • ₨ {(product?.price * quantity).toLocaleString()}</span>
          </motion.div>
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleBuyNow}
          className={`flex-1 px-6 py-3 rounded-xl text-white shadow-lg 
            transition-all duration-200 ${
            currentTheme === 'eyeCare' 
              ? 'bg-[#5C4934] hover:bg-[#433422] shadow-[#433422]/20' 
              : currentTheme === 'dark'
              ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-900/20'
              : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
          }`}
        >
          Buy Now
        </motion.button>
      </div>
    </div>
  );

  const renderMedia = () => {
    const currentMedia = product?.media?.[selectedMedia];
    if (!currentMedia) return null;

    if (currentMedia.type === 'video') {
      return (
        <div 
          className="relative w-full h-full flex items-center justify-center"
          onMouseMove={handleVideoInteraction}
          onClick={handleVideoInteraction}
        >
          <video
            ref={videoRef}
            src={product.media[selectedMedia].url}
            className="w-full h-full object-contain"
            poster={product.media[selectedMedia].thumbnail}
            playsInline
            preload="metadata"
            onClick={handleVideoPlay}
            onTimeUpdate={handleVideoTimeUpdate}
            onLoadedMetadata={handleVideoLoadedMetadata}
            onEnded={handleVideoEnded}
          />

          {/* Video Controls Overlay */}
          <div 
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
              showControls ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Play/Pause Button */}
            <button
              onClick={handleVideoPlay}
              className="p-4 rounded-full bg-black/40 hover:bg-black/60 transition-colors duration-200"
            >
              {isPlaying ? (
                <RiPauseCircleLine className="w-12 h-12 text-white" />
              ) : (
                <RiPlayCircleLine className="w-12 h-12 text-white" />
              )}
            </button>

            {/* Navigation Controls */}
            {product?.media?.length > 1 && (
              <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedMedia(prev => 
                      prev === 0 ? product.media.length - 1 : prev - 1
                    );
                  }}
                  className="p-3 rounded-full backdrop-blur-md shadow-lg transform transition-all duration-200 bg-black/40 hover:bg-black/60 pointer-events-auto"
                >
                  <RiArrowLeftSLine className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedMedia(prev => 
                      prev === product.media.length - 1 ? 0 : prev + 1
                    );
                  }}
                  className="p-3 rounded-full backdrop-blur-md shadow-lg transform transition-all duration-200 bg-black/40 hover:bg-black/60 pointer-events-auto"
                >
                  <RiArrowRightSLine className="w-6 h-6 text-white" />
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }

    // For images
    return (
      <motion.img
        key={selectedMedia}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.2 }}
        src={currentMedia.url}
        alt={product?.name}
        className="w-full h-full object-contain"
      />
    );
  };

  const renderThumbnail = (item, index) => {
    if (item.type === 'video') {
      return (
        <div className="relative w-full h-full">
          {/* Use thumbnail URL directly from the API response */}
          <div 
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{ 
              backgroundImage: `url(${item.thumbnail})`,
              backgroundColor: currentTheme === 'dark' ? '#1F2937' : '#F3F4F6'
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors duration-200 group-hover:bg-black/40">
            <RiPlayCircleLine className="w-8 h-8 text-white" />
          </div>
        </div>
      );
    }

    return (
      <img
        src={item.url}
        alt={`${product?.name} ${index + 1}`}
        className="w-full h-full object-cover"
      />
    );
  };

  const renderBottomBar = () => (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className={`fixed bottom-0 left-0 right-0 z-50 p-4 ${
        currentTheme === 'dark'
          ? 'bg-gray-800/95 border-t border-gray-700'
          : currentTheme === 'eyeCare'
          ? 'bg-[#FFF8ED]/95 border-t border-[#E6D5B8]'
          : 'bg-white/95 border-t border-gray-200'
      } backdrop-blur-lg`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          {/* Quantity Controls */}
          <div className="flex items-center">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className={`p-2 rounded-l-xl border ${
                currentTheme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : currentTheme === 'eyeCare'
                  ? 'bg-white border-[#E6D5B8] text-[#433422]'
                  : 'bg-gray-100 border-gray-200 text-gray-600'
              } ${quantity <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <RiSubtractLine size={18} />
            </motion.button>
            <div className={`px-4 py-2 border-t border-b ${
              currentTheme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-white'
                : currentTheme === 'eyeCare'
                ? 'bg-white border-[#E6D5B8] text-[#433422]'
                : 'bg-white border-gray-200 text-gray-900'
            }`}>
              {quantity}
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setQuantity(q => Math.min(product?.stock || 1, q + 1))}
              className={`p-2 rounded-r-xl border ${
                currentTheme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : currentTheme === 'eyeCare'
                  ? 'bg-white border-[#E6D5B8] text-[#433422]'
                  : 'bg-gray-100 border-gray-200 text-gray-600'
              }`}
            >
              +
            </motion.button>
          </div>

          {/* Add to Cart Button with Price */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAddToCart}
            disabled={addingToCart || isAdded || !product?.stock}
            className={`flex-1 h-[52px] rounded-xl font-medium relative overflow-hidden
              ${addingToCart || isAdded ? 'bg-white text-black' : 'bg-black hover:bg-gray-900 text-white'}
              ${!product?.stock ? 'opacity-50 cursor-not-allowed' : ''}
              transition-all duration-300 flex items-center justify-center`}
          >
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={false}
              animate={{
                opacity: addingToCart ? 1 : 0,
                scale: addingToCart ? 1 : 0.8,
              }}
              transition={{ duration: 0.2 }}
            >
              <RiLoader4Line className="w-6 h-6 animate-spin" />
            </motion.div>

            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={false}
              animate={{
                opacity: isAdded ? 1 : 0,
                scale: isAdded ? 1 : 0.8,
              }}
              transition={{ duration: 0.2 }}
            >
              <RiCheckboxCircleLine className="w-6 h-6" />
            </motion.div>

            <motion.div
              className="flex items-center justify-center gap-2"
              initial={false}
              animate={{
                opacity: !addingToCart && !isAdded ? 1 : 0,
                scale: !addingToCart && !isAdded ? 1 : 0.8,
              }}
              transition={{ duration: 0.2 }}
            >
              <RiShoppingCart2Line className="w-5 h-5" />
              <span>Add to Cart • ₨ {(product?.price * quantity).toLocaleString()}</span>
            </motion.div>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );

  const renderDesktopProductInfo = () => (
    <div className={`space-y-6`}>
      {/* Main Product Info Card */}
      <div className={`p-6 rounded-2xl ${
        currentTheme === 'dark' ? 'bg-gray-800' 
        : currentTheme === 'eyeCare' ? 'bg-[#FFF8ED]'
        : 'bg-white'
      } shadow-lg`}>
        {/* Product Title, Price, and Wishlist */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className={`text-3xl font-bold ${
              currentTheme === 'dark' ? 'text-white' 
              : currentTheme === 'eyeCare' ? 'text-[#433422]'
              : 'text-gray-900'
            }`}>
              {product?.name}
            </h1>
            <div className={`mt-2 text-2xl font-bold ${
              currentTheme === 'dark' ? 'text-white' 
              : currentTheme === 'eyeCare' ? 'text-[#433422]'
              : 'text-gray-900'
            }`}>
              ₨ {product?.price?.toLocaleString()}
            </div>
          </div>
          
          {/* Wishlist Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleWishlistToggle}
            disabled={isAddingToWishlist}
            className={`p-3 rounded-xl transition-colors duration-300 ${
              isInWishlist 
                ? 'bg-red-50 text-red-500' 
                : currentTheme === 'dark'
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  : currentTheme === 'eyeCare'
                    ? 'bg-[#E6D5BC] text-[#433422] hover:bg-[#D4C3AA]'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isInWishlist ? (
              <RiHeartFill className={`w-6 h-6 ${isAddingToWishlist ? 'animate-pulse' : ''}`} />
            ) : (
              <RiHeartLine className={`w-6 h-6 ${isAddingToWishlist ? 'animate-pulse' : ''}`} />
            )}
          </motion.button>
        </div>

        {/* Product Meta Info */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Brand Info */}
          <div className={`p-3 rounded-xl ${
            currentTheme === 'dark' ? 'bg-gray-700/50' 
            : currentTheme === 'eyeCare' ? 'bg-[#E6D5B8]/30'
            : 'bg-gray-50'
          }`}>
            <div className="flex items-center gap-3">
              <span className={`p-2 rounded-lg ${
                currentTheme === 'dark' ? 'bg-gray-600' 
                : currentTheme === 'eyeCare' ? 'bg-[#433422]'
                : 'bg-black'
              }`}>
                <RiStore2Line className="w-5 h-5 text-white" />
              </span>
              <div>
                <p className={`text-sm font-medium ${
                  currentTheme === 'dark' ? 'text-gray-400' 
                  : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]'
                  : 'text-gray-600'
                }`}>Brand</p>
                <p className={`text-base font-semibold ${
                  currentTheme === 'dark' ? 'text-white' 
                  : currentTheme === 'eyeCare' ? 'text-[#433422]'
                  : 'text-gray-900'
                }`}>{product?.brand}</p>
              </div>
            </div>
          </div>

          {/* Category */}
          <div className={`p-3 rounded-xl ${
            currentTheme === 'dark' ? 'bg-gray-700/50' 
            : currentTheme === 'eyeCare' ? 'bg-[#E6D5B8]/30'
            : 'bg-gray-50'
          }`}>
            <div className="flex items-center gap-3">
              <span className={`p-2 rounded-lg ${
                currentTheme === 'dark' ? 'bg-gray-600' 
                : currentTheme === 'eyeCare' ? 'bg-[#433422]'
                : 'bg-black'
              }`}>
                <RiPriceTag3Line className="w-5 h-5 text-white" />
              </span>
              <div>
                <p className={`text-sm font-medium ${
                  currentTheme === 'dark' ? 'text-gray-400' 
                  : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]'
                  : 'text-gray-600'
                }`}>Category</p>
                <p className={`text-base font-semibold ${
                  currentTheme === 'dark' ? 'text-white' 
                  : currentTheme === 'eyeCare' ? 'text-[#433422]'
                  : 'text-gray-900'
                }`}>{product?.category?.name}</p>
              </div>
            </div>
          </div>

          {/* Stock Status */}
          <div className={`p-3 rounded-xl ${
            currentTheme === 'dark' ? 'bg-gray-700/50' 
            : currentTheme === 'eyeCare' ? 'bg-[#E6D5B8]/30'
            : 'bg-gray-50'
          }`}>
            <div className="flex items-center gap-3">
              <span className={`p-2 rounded-lg ${
                product?.stock > 0 ? 'bg-green-500' : 'bg-red-500'
              }`}>
                <RiCheckboxCircleLine className="w-5 h-5 text-white" />
              </span>
              <div>
                <p className={`text-sm font-medium ${
                  currentTheme === 'dark' ? 'text-gray-400' 
                  : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]'
                  : 'text-gray-600'
                }`}>
                  Status
                </p>
                <p className={`text-base font-semibold ${
                  product?.stock > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {product?.stock > 0 ? 'In Stock' : 'Out of Stock'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h3 className={`text-lg font-semibold mb-2 ${
            currentTheme === 'dark' ? 'text-white' 
            : currentTheme === 'eyeCare' ? 'text-[#433422]'
            : 'text-gray-900'
          }`}>Description</h3>
          <p className={`text-base leading-relaxed ${
            currentTheme === 'dark' ? 'text-gray-300' 
            : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]'
            : 'text-gray-600'
          }`}>
            {product?.description}
          </p>
        </div>

        {/* Add to Cart Section */}
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className={`p-2 rounded-l-xl border ${
                currentTheme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : currentTheme === 'eyeCare'
                  ? 'bg-white border-[#E6D5B8] text-[#433422]'
                  : 'bg-gray-100 border-gray-200 text-gray-600'
              }`}
            >
              -
            </motion.button>
            <div className={`px-4 py-2 border-t border-b ${
              currentTheme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-white'
                : currentTheme === 'eyeCare'
                ? 'bg-white border-[#E6D5B8] text-[#433422]'
                : 'bg-white border-gray-200 text-gray-900'
            }`}>
              {quantity}
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setQuantity(q => Math.min(product?.stock || 1, q + 1))}
              className={`p-2 rounded-r-xl border ${
                currentTheme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : currentTheme === 'eyeCare'
                  ? 'bg-white border-[#E6D5B8] text-[#433422]'
                  : 'bg-gray-100 border-gray-200 text-gray-600'
              }`}
            >
              +
            </motion.button>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAddToCart}
            disabled={addingToCart || isAdded || !product?.stock}
            className={`flex-1 h-[52px] rounded-xl font-medium relative overflow-hidden
              ${addingToCart || isAdded ? 'bg-white text-black' : 'bg-black hover:bg-gray-900 text-white'}
              ${!product?.stock ? 'opacity-50 cursor-not-allowed' : ''}
              transition-all duration-300 flex items-center justify-center`}
          >
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={false}
              animate={{
                opacity: addingToCart ? 1 : 0,
                scale: addingToCart ? 1 : 0.8,
              }}
              transition={{ duration: 0.2 }}
            >
              <RiLoader4Line className="w-6 h-6 animate-spin" />
            </motion.div>

            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={false}
              animate={{
                opacity: isAdded ? 1 : 0,
                scale: isAdded ? 1 : 0.8,
              }}
              transition={{ duration: 0.2 }}
            >
              <RiCheckboxCircleLine className="w-6 h-6" />
            </motion.div>

            <motion.div
              className="flex items-center justify-center gap-2"
              initial={false}
              animate={{
                opacity: !addingToCart && !isAdded ? 1 : 0,
                scale: !addingToCart && !isAdded ? 1 : 0.8,
              }}
              transition={{ duration: 0.2 }}
            >
              <RiShoppingCart2Line className="w-5 h-5" />
              <span>Add to Cart • ₨ {(product?.price * quantity).toLocaleString()}</span>
            </motion.div>
          </motion.button>
        </div>
      </div>
    </div>
  );

  // Check if product is in wishlist
  useEffect(() => {
    const checkWishlist = async () => {
      if (!user) return; // Skip if no user

      try {
        const response = await productAPI.get('/wishlist');
        if (response.data.success && response.data.data?.products) {
          const isInList = response.data.data.products.some(
            item => item._id === product?._id
          );
          setIsInWishlist(isInList);
        }
      } catch (error) {
        console.error('Error checking wishlist:', error);
      }
    };

    if (product?._id) {
      checkWishlist();
    }
  }, [product?._id, user]);

  // Handle wishlist toggle
  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist');
      return;
    }

    try {
      setIsAddingToWishlist(true);
      const api = createAPI(token);  // Create API with token
      const response = await api.post(`/wishlist/add`, { productId: product._id });

      if (response.data.success) {
        setIsInWishlist(response.data.isWishlisted);
        toast.success(response.data.message);
      }
    } catch (error) {
      console.error('Wishlist error:', error);
      toast.error(error.response?.data?.message || 'Failed to update wishlist');
    } finally {
      setIsAddingToWishlist(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RiLoader4Line className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isMobile ? 'pb-24' : 'pb-6'} ${
      currentTheme === 'dark' ? 'bg-gray-900' 
      : currentTheme === 'eyeCare' ? 'bg-[#F5E6D3]' 
      : 'bg-gray-50'
    }`}>
      {isMobile && renderMobileHeader()}
      <div className="max-w-7xl mx-auto pt-6 px-4 sm:px-6">
        <div className={`${isMobile ? 'space-y-6' : 'grid grid-cols-1 lg:grid-cols-2 gap-8'}`}>
          <div className="space-y-6">
            <div className="space-y-4">
              <div 
                {...swipeHandlers}
                className={`relative ${
                  isMobile 
                    ? 'h-[calc(100vw-2rem)] max-h-[500px]' 
                    : 'aspect-[4/3]'
                } rounded-2xl overflow-hidden group`}
              >
                <div className={`absolute inset-0 ${
                  currentTheme === 'dark' ? 'bg-gray-800/50' 
                  : currentTheme === 'eyeCare' ? 'bg-[#FFF8ED]/50'
                  : 'bg-white/50'
                } backdrop-blur-sm`} />
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedMedia}
                    variants={imageVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="relative w-full h-full"
                  >
                    {product?.media[selectedMedia]?.type === 'video' ? (
                      <div 
                        className="relative w-full h-full flex items-center justify-center"
                        onMouseMove={handleVideoInteraction}
                        onClick={handleVideoInteraction}
                      >
                        <video
                          ref={videoRef}
                          src={product.media[selectedMedia].url}
                          className="w-full h-full object-contain"
                          poster={product.media[selectedMedia].thumbnail}
                          playsInline
                          preload="metadata"
                          onClick={handleVideoPlay}
                          onTimeUpdate={handleVideoTimeUpdate}
                          onLoadedMetadata={handleVideoLoadedMetadata}
                          onEnded={handleVideoEnded}
                        />

                        {/* Video Controls Overlay */}
                        <div 
                          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                            showControls ? 'opacity-100' : 'opacity-0'
                          }`}
                        >
                          {/* Play/Pause Button */}
                          <button
                            onClick={handleVideoPlay}
                            className="p-4 rounded-full bg-black/40 hover:bg-black/60 transition-colors duration-200"
                          >
                            {isPlaying ? (
                              <RiPauseCircleLine className="w-12 h-12 text-white" />
                            ) : (
                              <RiPlayCircleLine className="w-12 h-12 text-white" />
                            )}
                          </button>

                          {/* Navigation Controls */}
                          {product?.media?.length > 1 && (
                            <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedMedia(prev => 
                                    prev === 0 ? product.media.length - 1 : prev - 1
                                  );
                                }}
                                className="p-3 rounded-full backdrop-blur-md shadow-lg transform transition-all duration-200 bg-black/40 hover:bg-black/60 pointer-events-auto"
                              >
                                <RiArrowLeftSLine className="w-6 h-6 text-white" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedMedia(prev => 
                                    prev === product.media.length - 1 ? 0 : prev + 1
                                  );
                                }}
                                className="p-3 rounded-full backdrop-blur-md shadow-lg transform transition-all duration-200 bg-black/40 hover:bg-black/60 pointer-events-auto"
                              >
                                <RiArrowRightSLine className="w-6 h-6 text-white" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <img
                        src={product?.media[selectedMedia]?.url}
                        alt={product?.name}
                        className="w-full h-full object-contain"
                      />
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Image Counter - Show only on mobile */}
                {isMobile && product?.media.length > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 
                      rounded-full text-sm font-medium backdrop-blur-md ${
                      currentTheme === 'dark' 
                        ? 'bg-black/40 text-white' 
                        : currentTheme === 'eyeCare' 
                        ? 'bg-[#433422]/30 text-[#433422]' 
                        : 'bg-black/30 text-white'
                    }`}
                  >
                    {selectedMedia + 1} / {product.media.length}
                  </motion.div>
                )}

                {/* Zoom Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowZoom(true)}
                  className={`absolute top-4 right-4 p-2.5 rounded-full backdrop-blur-md 
                    shadow-lg transition-all duration-200 ${
                    currentTheme === 'dark' 
                      ? 'bg-black/40 hover:bg-black/60 text-white' 
                      : currentTheme === 'eyeCare' 
                      ? 'bg-[#433422]/30 hover:bg-[#433422]/40 text-[#433422]' 
                      : 'bg-white/40 hover:bg-white/60 text-black'
                    }`}
                >
                  <RiZoomInLine className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Thumbnails - Modified for mobile */}
              {product?.media?.length > 1 && (
                <div className="relative px-1">
                  <div className={`overflow-x-auto ${
                    isMobile 
                      ? '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]' 
                      : 'scrollbar-thin'
                  }`}>
                    <div className={`flex gap-3 ${isMobile ? 'py-4' : 'py-2'} px-0.5`}>
                      {product.media.map((item, index) => (
                        <motion.button
                          key={index}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setSelectedMedia(index);
                            setIsPlaying(false);
                          }}
                          className={`relative flex-shrink-0 ${
                            isMobile ? 'w-16 h-16' : 'w-20 h-20'
                          } rounded-xl overflow-hidden group
                            transition-all duration-200 ${
                            selectedMedia === index 
                              ? `ring-2 ${
                                  currentTheme === 'eyeCare' 
                                    ? 'ring-[#433422]' 
                                    : currentTheme === 'dark'
                                    ? 'ring-white'
                                    : 'ring-black'
                                }` 
                              : 'opacity-60 hover:opacity-100'
                          }`}
                        >
                          {renderThumbnail(item, index)}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Enhanced Zoom Modal */}
              <AnimatePresence>
                {showZoom && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-50 flex flex-col items-center justify-between backdrop-blur-lg"
                    onClick={() => setShowZoom(false)}
                  >
                    {/* Dark Overlay */}
                    <div className="absolute inset-0 bg-black/90" />
                    
                    {/* Header */}
                    <motion.div 
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="relative w-full z-10 px-4 py-3 flex items-center justify-between"
                    >
                      <span className="text-white/80 text-sm">
                        {selectedMedia + 1} / {product?.media?.length}
                      </span>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowZoom(false)}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20"
                      >
                        <RiCloseLine className="w-6 h-6 text-white" />
                      </motion.button>
                    </motion.div>
                    
                    {/* Main Media */}
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className="relative flex-1 w-full flex items-center justify-center p-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div {...swipeHandlers} className="relative w-full h-full flex items-center justify-center">
                        <AnimatePresence mode="wait">
                          {product?.media[selectedMedia]?.type === 'video' ? (
                            <div className="relative w-full h-full flex items-center justify-center bg-black/5">
                              <video
                                key={selectedMedia}
                                ref={videoRef}
                                src={product.media[selectedMedia].url}
                                poster={product.media[selectedMedia].thumbnail}
                                controls
                                controlsList="nodownload"
                                playsInline
                                className="max-w-full max-h-[calc(100vh-200px)] object-contain"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Your browser does not support the video tag.
                              </video>
                            </div>
                          ) : (
                            <motion.img
                              key={selectedMedia}
                              initial={{ opacity: 0, x: 50 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -50 }}
                              transition={{ duration: 0.2 }}
                              src={product?.media[selectedMedia]?.url}
                              alt={product?.name}
                              className="max-w-full max-h-[calc(100vh-200px)] object-contain"
                            />
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>

                    {/* Thumbnails */}
                    <motion.div 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="relative w-full z-10 p-4 bg-black/50 backdrop-blur-sm"
                    >
                      <div className="max-w-screen-lg mx-auto">
                        <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                          <div className="flex gap-2 items-center justify-start">
                            {product?.media.map((item, index) => (
                              <motion.button
                                key={index}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedMedia(index);
                                }}
                                className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden 
                                  transition-all duration-200 ${
                                  selectedMedia === index 
                                    ? 'ring-2 ring-white ring-offset-2 ring-offset-black/50' 
                                    : 'opacity-50 hover:opacity-80'
                                }`}
                              >
                                {item.type === 'video' ? (
                                  <div className="relative w-full h-full">
                                    <img
                                      src={item.thumbnail}
                                      alt={`${product?.name} video ${index + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                      <RiPlayCircleLine className="w-8 h-8 text-white" />
                                    </div>
                                  </div>
                                ) : (
                                  <img
                                    src={item.url}
                                    alt={`${product?.name} ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Product Highlights - Desktop Only */}
            {!isMobile && (
              <div className={`p-6 rounded-2xl ${
                currentTheme === 'dark' ? 'bg-gray-800' 
                : currentTheme === 'eyeCare' ? 'bg-[#FFF8ED]'
                : 'bg-white'
              } shadow-lg`}>
                <h3 className={`text-lg font-semibold mb-4 ${
                  currentTheme === 'dark' ? 'text-white' 
                  : currentTheme === 'eyeCare' ? 'text-[#433422]'
                  : 'text-gray-900'
                }`}>
                  Product Highlights
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Brand Info */}
                  <div className={`p-4 rounded-xl ${
                    currentTheme === 'dark' ? 'bg-gray-700/50' 
                    : currentTheme === 'eyeCare' ? 'bg-[#E6D5B8]/30'
                    : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className={`p-2 rounded-lg ${
                        currentTheme === 'dark' ? 'bg-gray-600' 
                        : currentTheme === 'eyeCare' ? 'bg-[#433422]'
                        : 'bg-black'
                      }`}>
                        <RiStore2Line className="w-5 h-5 text-white" />
                      </span>
                      <div>
                        <p className={`text-sm font-medium ${
                          currentTheme === 'dark' ? 'text-gray-400' 
                          : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]'
                          : 'text-gray-600'
                        }`}>
                          Brand
                        </p>
                        <p className={`text-base font-semibold ${
                          currentTheme === 'dark' ? 'text-white' 
                          : currentTheme === 'eyeCare' ? 'text-[#433422]'
                          : 'text-gray-900'
                        }`}>
                          {product?.brand}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Category Info */}
                  <div className={`p-4 rounded-xl ${
                    currentTheme === 'dark' ? 'bg-gray-700/50' 
                    : currentTheme === 'eyeCare' ? 'bg-[#E6D5B8]/30'
                    : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className={`p-2 rounded-lg ${
                        currentTheme === 'dark' ? 'bg-gray-600' 
                        : currentTheme === 'eyeCare' ? 'bg-[#433422]'
                        : 'bg-black'
                      }`}>
                        <RiPriceTag3Line className="w-5 h-5 text-white" />
                      </span>
                      <div>
                        <p className={`text-sm font-medium ${
                          currentTheme === 'dark' ? 'text-gray-400' 
                          : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]'
                          : 'text-gray-600'
                        }`}>
                          Category
                        </p>
                        <p className={`text-base font-semibold ${
                          currentTheme === 'dark' ? 'text-white' 
                          : currentTheme === 'eyeCare' ? 'text-[#433422]'
                          : 'text-gray-900'
                        }`}>
                          {product?.category?.name}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Stock Status */}
                  <div className={`p-4 rounded-xl ${
                    currentTheme === 'dark' ? 'bg-gray-700/50' 
                    : currentTheme === 'eyeCare' ? 'bg-[#E6D5B8]/30'
                    : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className={`p-2 rounded-lg ${
                        product?.stock > 0
                          ? 'bg-green-500'
                          : 'bg-red-500'
                      }`}>
                        <RiCheckboxCircleLine className="w-5 h-5 text-white" />
                      </span>
                      <div>
                        <p className={`text-sm font-medium ${
                          currentTheme === 'dark' ? 'text-gray-400' 
                          : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]'
                          : 'text-gray-600'
                        }`}>
                          Status
                        </p>
                        <p className={`text-base font-semibold ${
                          product?.stock > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {product?.stock > 0 ? 'In Stock' : 'Out of Stock'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Price Range */}
                  <div className={`p-4 rounded-xl ${
                    currentTheme === 'dark' ? 'bg-gray-700/50' 
                    : currentTheme === 'eyeCare' ? 'bg-[#E6D5B8]/30'
                    : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className={`p-2 rounded-lg ${
                        currentTheme === 'dark' ? 'bg-gray-600' 
                        : currentTheme === 'eyeCare' ? 'bg-[#433422]'
                        : 'bg-black'
                      }`}>
                        <RiMoneyDollarCircleLine className="w-5 h-5 text-white" />
                      </span>
                      <div>
                        <p className={`text-sm font-medium ${
                          currentTheme === 'dark' ? 'text-gray-400' 
                          : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]'
                          : 'text-gray-600'
                        }`}>
                          Price
                        </p>
                        <p className={`text-base font-semibold ${
                          currentTheme === 'dark' ? 'text-white' 
                          : currentTheme === 'eyeCare' ? 'text-[#433422]'
                          : 'text-gray-900'
                        }`}>
                          ₨ {product?.price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Product Info */}
            {isMobile && (
              <div className="space-y-4">
                {/* Basic Info Card */}
                <div className={`p-4 rounded-xl ${
                  currentTheme === 'dark' ? 'bg-gray-800' 
                  : currentTheme === 'eyeCare' ? 'bg-[#FFF8ED]'
                  : 'bg-white'
                } shadow-lg`}>
                  {/* Product Title and Meta */}
                  <div className="mb-4">
                    <h1 className={`text-xl font-bold mb-2 ${
                      currentTheme === 'dark' ? 'text-white' 
                      : currentTheme === 'eyeCare' ? 'text-[#433422]'
                      : 'text-gray-900'
                    }`}>
                      {product?.name}
                    </h1>
                    <div className={`flex flex-wrap items-center gap-2 ${
                      currentTheme === 'dark' ? 'text-gray-400' 
                      : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]'
                      : 'text-gray-600'
                    }`}>
                      <div className="flex items-center gap-1.5">
                        <RiStore2Line className="w-4 h-4" />
                        <span className="text-sm">{product?.brand}</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1.5">
                        <RiPriceTag3Line className="w-4 h-4" />
                        <span className="text-sm">{product?.category?.name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Price and Stock Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {/* Price Card */}
                    <div className={`p-3 rounded-lg ${
                      currentTheme === 'dark' ? 'bg-gray-700/50' 
                      : currentTheme === 'eyeCare' ? 'bg-[#E6D5B8]/30'
                      : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-md ${
                          currentTheme === 'dark' ? 'bg-gray-600' 
                          : currentTheme === 'eyeCare' ? 'bg-[#433422]'
                          : 'bg-black'
                        }`}>
                          <span className="text-white text-xs font-semibold">₨</span>
                        </span>
                        <span className={`text-xs font-medium ${
                          currentTheme === 'dark' ? 'text-gray-400' 
                          : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]'
                          : 'text-gray-600'
                        }`}>
                          Price
                        </span>
                      </div>
                      <p className={`text-lg font-bold ${
                        currentTheme === 'dark' ? 'text-white' 
                        : currentTheme === 'eyeCare' ? 'text-[#433422]'
                        : 'text-gray-900'
                      }`}>
                        ₨ {product?.price.toLocaleString()}
                      </p>
                    </div>

                    {/* Stock Status Card */}
                    <div className={`p-3 rounded-lg ${
                      currentTheme === 'dark' ? 'bg-gray-700/50' 
                      : currentTheme === 'eyeCare' ? 'bg-[#E6D5B8]/30'
                      : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-md ${
                          currentTheme === 'dark' ? 'bg-gray-600' 
                          : currentTheme === 'eyeCare' ? 'bg-[#433422]'
                          : 'bg-black'
                        }`}>
                          <RiCheckboxCircleLine className="w-5 h-5 text-white" />
                        </span>
                        <span className={`text-xs font-medium ${
                          currentTheme === 'dark' ? 'text-gray-400' 
                          : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]'
                          : 'text-gray-600'
                        }`}>
                          Stock
                        </span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${
                        product?.stock > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {product?.stock > 0 ? (
                          <>
                            <RiCheckboxCircleLine className="w-4 h-4" />
                            <span className="text-sm font-semibold">{product.stock} left</span>
                          </>
                        ) : (
                          <>
                            <RiCloseLine className="w-4 h-4" />
                            <span className="text-sm font-semibold">Out of stock</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className={`text-sm leading-relaxed ${
                      currentTheme === 'dark' ? 'text-gray-300' 
                      : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]'
                      : 'text-gray-600'
                    }`}>
                      {product?.description}
                    </p>
                  </div>
                </div>

                {/* Specifications Card - Mobile */}
                <div className={`p-4 rounded-xl ${
                  currentTheme === 'dark' ? 'bg-gray-800' 
                  : currentTheme === 'eyeCare' ? 'bg-[#FFF8ED]'
                  : 'bg-white'
                } shadow-lg`}>
                  <h3 className={`text-lg font-semibold mb-4 ${
                    currentTheme === 'dark' ? 'text-white' 
                    : currentTheme === 'eyeCare' ? 'text-[#433422]'
                    : 'text-gray-900'
                  }`}>
                    Specifications
                  </h3>
                  <div className="space-y-3">
                    {product?.specifications.map((spec, index) => (
                      <div key={index} className="space-y-1">
                        <dt className={`text-sm font-medium ${
                          currentTheme === 'dark' ? 'text-gray-400' 
                          : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]'
                          : 'text-gray-500'
                        }`}>
                          {spec.key}
                        </dt>
                        <dd className={`text-sm ${
                          currentTheme === 'dark' ? 'text-white' 
                          : currentTheme === 'eyeCare' ? 'text-[#433422]'
                          : 'text-gray-900'
                        }`}>
                          {spec.value}
                        </dd>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Features Card - Mobile */}
                <div className={`p-4 rounded-xl ${
                  currentTheme === 'dark' ? 'bg-gray-800' 
                  : currentTheme === 'eyeCare' ? 'bg-[#FFF8ED]'
                  : 'bg-white'
                } shadow-lg`}>
                  <h3 className={`text-lg font-semibold mb-4 ${
                    currentTheme === 'dark' ? 'text-white' 
                    : currentTheme === 'eyeCare' ? 'text-[#433422]'
                    : 'text-gray-900'
                  }`}>
                    Features
                  </h3>
                  <ul className="space-y-3">
                    {product?.features.map((feature, index) => (
                      <li key={index} className={`flex items-start gap-3 ${
                        currentTheme === 'dark' ? 'text-gray-300' 
                        : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]'
                        : 'text-gray-600'
                      }`}>
                        <span className={`flex-shrink-0 mt-1 ${
                          currentTheme === 'eyeCare' 
                            ? 'text-[#433422]' 
                            : 'text-blue-500'
                        }`}>•</span>
                        <span className="text-base leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Product Info - Desktop */}
          {!isMobile && (
            <div className="space-y-6">
              {/* Product Name and Basic Info Card */}
              <div className={`p-6 rounded-2xl ${
                currentTheme === 'dark' ? 'bg-gray-800' 
                : currentTheme === 'eyeCare' ? 'bg-[#FFF8ED]'
                : 'bg-white'
              } shadow-lg`}>
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        currentTheme === 'dark' ? 'text-gray-300' 
                        : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]'
                        : 'text-gray-600'
                      }`}>
                        Product Name
                      </label>
                      <input
                        type="text"
                        value={editedProduct?.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border transition-all duration-200
                          ${currentTheme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                            : currentTheme === 'eyeCare'
                            ? 'bg-white border-[#E6D5B8] text-[#433422] focus:border-[#433422]'
                            : 'bg-white border-gray-200 text-gray-900 focus:border-black'
                          } focus:ring-2 focus:ring-opacity-50 focus:outline-none`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        currentTheme === 'dark' ? 'text-gray-300' 
                        : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]'
                        : 'text-gray-600'
                      }`}>
                        Brand
                      </label>
                      <input
                        type="text"
                        value={editedProduct?.brand}
                        onChange={(e) => handleInputChange('brand', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border transition-all duration-200
                          ${currentTheme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                            : currentTheme === 'eyeCare'
                            ? 'bg-white border-[#E6D5B8] text-[#433422] focus:border-[#433422]'
                            : 'bg-white border-gray-200 text-gray-900 focus:border-black'
                          } focus:ring-2 focus:ring-opacity-50 focus:outline-none`}
                      />
                    </div>
                  </div>
                ) : (
                  renderDesktopProductInfo()
                )}
              </div>

              {/* Specifications - Desktop */}
              <div className={`p-6 rounded-2xl ${
                currentTheme === 'dark' ? 'bg-gray-800' 
                : currentTheme === 'eyeCare' ? 'bg-[#FFF8ED]'
                : 'bg-white'
              } shadow-lg`}>
                <h3 className={`text-lg font-semibold mb-4 ${
                  currentTheme === 'dark' ? 'text-white' 
                  : currentTheme === 'eyeCare' ? 'text-[#433422]'
                  : 'text-gray-900'
                }`}>
                  Specifications
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {product?.specifications.map((spec, index) => (
                    <div key={index} className="space-y-1">
                      <dt className={`text-sm font-medium ${
                        currentTheme === 'dark' ? 'text-gray-400' 
                        : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]'
                        : 'text-gray-500'
                      }`}>
                        {spec.key}
                      </dt>
                      <dd className={`text-sm ${
                        currentTheme === 'dark' ? 'text-white' 
                        : currentTheme === 'eyeCare' ? 'text-[#433422]'
                        : 'text-gray-900'
                      }`}>
                        {spec.value}
                      </dd>
                    </div>
                  ))}
                </div>
              </div>

              {/* Features - Desktop */}
              <div className={`p-6 rounded-2xl ${
                currentTheme === 'dark' ? 'bg-gray-800' 
                : currentTheme === 'eyeCare' ? 'bg-[#FFF8ED]'
                : 'bg-white'
              } shadow-lg`}>
                <h3 className={`text-lg font-semibold mb-4 ${
                  currentTheme === 'dark' ? 'text-white' 
                  : currentTheme === 'eyeCare' ? 'text-[#433422]'
                  : 'text-gray-900'
                }`}>
                  Features
                </h3>
                <ul className="space-y-3">
                  {product?.features.map((feature, index) => (
                    <li key={index} className={`flex items-start gap-3 ${
                      currentTheme === 'dark' ? 'text-gray-300' 
                      : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]'
                      : 'text-gray-600'
                    }`}>
                      <span className={`flex-shrink-0 mt-1 ${
                        currentTheme === 'eyeCare' 
                          ? 'text-[#433422]' 
                          : 'text-blue-500'
                      }`}>•</span>
                      <span className="text-base leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
      {isMobile && renderBottomBar()}
    </div>
  );
};

export default ProductDetails; 