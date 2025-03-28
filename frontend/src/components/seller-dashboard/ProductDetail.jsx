import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RiEditLine, RiArrowLeftLine, RiLoader4Line, RiStore2Line, RiPriceTag3Line, RiCheckboxCircleLine, RiMoneyDollarCircleLine, RiSaveLine, RiCloseLine, RiZoomInLine, RiArrowLeftSLine, RiArrowRightSLine, RiPlayCircleLine, RiPauseCircleLine, RiShoppingCart2Line, RiHeartLine, RiHeartFill, RiShareLine, RiSubtractLine, RiTruckLine, RiAddLine, RiShoppingCartLine, RiShoppingBag3Line } from 'react-icons/ri';
import { useTheme } from '../../context/ThemeContext';
import { createAPI, productAPI, cartAPI } from '../../utils/api';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useMediaQuery } from '@mui/material';
import { useSwipeable } from 'react-swipeable';
import axios from 'axios';
import ProductActionModal from '../common/ProductActionModal';

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
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedColorImages, setSelectedColorImages] = useState([]);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [bottomSheetMode, setBottomSheetMode] = useState('cart'); // 'cart' or 'buy'

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
      formData.append('marketPrice', Number(editedProduct.marketPrice));
      formData.append('salePrice', Number(editedProduct.salePrice));
      formData.append('deliveryPrice', Number(editedProduct.deliveryPrice));
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

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to continue');
      navigate('/login', { state: { from: location } });
      return;
    }

    try {
      setLoading(true);
      
      // Get the token from localStorage
      const token = localStorage.getItem('authToken');
      
      // Make sure we have the product ID
      const productId = product._id;
      
      // Check if product has colors
      const hasColors = product.colors && product.colors.length > 0;
      
      // Prepare color data for API
      let colorId = null;
      if (hasColors && selectedColor) {
        colorId = selectedColor._id;
      }
      
      console.log('Validating direct purchase with:', {
        productId,
        quantity,
        colorId,
        hasToken: !!token
      });
      
      // Validate the purchase first
      const validateResponse = await cartAPI.validateDirectPurchase({
        productId,
        quantity,
        colorId
      }, token);
      
      console.log('Validate response:', validateResponse.data);
      
      if (validateResponse.data.success) {
        // Close the bottom sheet if it's open
        setIsBottomSheetOpen(false);
        
        // Get the product details from the response
        const productDetails = validateResponse.data.directPurchaseDetails.product;
        const amounts = validateResponse.data.directPurchaseDetails.amounts;
        
        // Navigate to the correct route with user ID
        navigate(`/${user._id}/direct-checkout`, {
          state: {
            product: {
              ...productDetails,
              quantity: quantity,
              selectedColor: selectedColor,
              id: productId
            },
            subtotal: amounts.subtotal,
            shipping: amounts.deliveryPrice,
            colorId: colorId
          }
        });
      } else {
        toast.error(validateResponse.data.message || 'Unable to process purchase');
      }
    } catch (error) {
      console.error('Buy now error:', error);
      toast.error(error.response?.data?.message || 'Error processing your request');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add to cart');
      navigate('/login', { state: { from: location } });
      return;
    }

    try {
      setAddingToCart(true);
      
      // Get the token from localStorage
      const token = localStorage.getItem('authToken');
      
      // Check if product has colors and if a color is selected
      const hasColors = product.colors && product.colors.length > 0;
      
      // Don't send color data if product doesn't have colors
      let colorData = null;
      
      if (hasColors) {
        // If product has colors but no color is selected, use the first color
        if (!selectedColor && product.colors.length > 0) {
          setSelectedColor(product.colors[0]);
          colorData = product.colors[0];
        } else {
          colorData = selectedColor;
        }
      }

      // Check if product with same color exists
      const existingItem = cartItems?.find(item => 
        item.product._id === product._id && 
        ((!colorData && !item.selectedColor) || 
         (item.selectedColor?._id === colorData?._id))
      );

      let response;
      if (existingItem) {
        // Update quantity if same product and color exists
        response = await cartAPI.updateCartItem(
          existingItem._id, // Use the cart item ID
          {
            quantity: existingItem.quantity + quantity,
            selectedColor: hasColors && colorData ? colorData._id : null
          },
          token
        );
      } else {
        // Add new item
        response = await cartAPI.addToCart({
          productId: product._id,
          quantity,
          selectedColor: hasColors && colorData ? colorData._id : null
        }, token);
      }

      if (response.data.success) {
        toast.success(response.data.message);
        await fetchCartData();
        setIsBottomSheetOpen(false);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
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
            <RiAddLine size={18} />
          </motion.button>
        </div>
      </div>

      {/* Action Buttons with Animation - Fixed layout */}
      <div className="flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setBottomSheetMode('cart');
            setIsBottomSheetOpen(true);
          }}
          disabled={loading || !product?.stock}
          className={`flex-1 h-11 px-4 rounded-xl font-medium relative overflow-hidden whitespace-nowrap
            ${currentTheme === 'dark'
              ? 'bg-gray-800 text-white hover:bg-gray-700'
              : currentTheme === 'eyeCare'
              ? 'bg-[#E6D5B8] text-[#433422] hover:bg-[#E6D5B8]/90'
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
            } ${loading || !product?.stock ? 'opacity-50 cursor-not-allowed' : ''}
            transition-all duration-300`}
        >
          <motion.div
            className="flex items-center justify-center gap-2"
            initial={false}
            animate={{
              opacity: loading ? 0 : 1,
              y: loading ? 20 : 0
            }}
            transition={{ duration: 0.2 }}
          >
            <RiShoppingCartLine size={18} />
            <span className="text-sm">Add to Cart</span>
          </motion.div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setBottomSheetMode('buy');
            setIsBottomSheetOpen(true);
          }}
          disabled={loading || !product?.stock}
          className={`flex-1 h-11 px-4 rounded-xl font-medium relative overflow-hidden whitespace-nowrap
            ${currentTheme === 'dark'
              ? 'bg-white text-gray-900 hover:bg-gray-100'
              : currentTheme === 'eyeCare'
              ? 'bg-[#433422] text-[#F5E6D3] hover:bg-[#433422]/90'
              : 'bg-gray-900 text-white hover:bg-gray-800'
            } ${loading || !product?.stock ? 'opacity-50 cursor-not-allowed' : ''}
            transition-all duration-300`}
        >
          <motion.div
            className="flex items-center justify-center gap-2"
            initial={false}
            animate={{
              opacity: loading ? 0 : 1,
              scale: loading ? 1 : 0.8,
            }}
            transition={{ duration: 0.2 }}
          >
            <RiShoppingBag3Line size={18} />
            <span className="text-sm">Buy Now</span>
          </motion.div>
        </motion.button>
      </div>
    </div>
  );

  const renderMedia = (media) => {
    if (media.type === 'video') {
      return (
        <div 
          className="relative w-full h-full flex items-center justify-center"
          onMouseMove={handleVideoInteraction}
          onClick={handleVideoInteraction}
        >
          <video
            ref={videoRef}
            src={media.url}
            className="w-full h-full object-contain"
            poster={media.thumbnail}
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
        src={media.url}
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
      className={`fixed bottom-0 left-0 right-0 px-4 py-3 z-50 ${
        currentTheme === 'dark' 
          ? 'bg-gray-900/95 border-t border-gray-800' 
          : currentTheme === 'eyeCare' 
          ? 'bg-[#F5E6D3]/95 border-t border-[#D4C3AA]'
          : 'bg-white/95 border-t border-gray-100'
      } backdrop-blur-lg`}
    >
      <div className="flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setBottomSheetMode('cart');
            setIsBottomSheetOpen(true);
          }}
          disabled={loading || !product.stock}
          className={`flex-1 py-2.5 px-4 rounded-xl font-medium flex items-center justify-center gap-1.5 ${
            currentTheme === 'dark'
              ? 'bg-gray-800 text-white'
              : currentTheme === 'eyeCare'
              ? 'bg-[#E6D5B8] text-[#433422]'
              : 'bg-gray-100 text-gray-900'
          } ${loading || !product.stock ? 'opacity-50' : ''}`}
        >
          <RiShoppingCartLine size={18} />
          <span className="text-sm">Add to Cart</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setBottomSheetMode('buy');
            setIsBottomSheetOpen(true);
          }}
          disabled={loading || !product.stock}
          className={`flex-1 py-2.5 px-4 rounded-xl font-medium flex items-center justify-center gap-1.5 ${
            currentTheme === 'dark'
              ? 'bg-white text-gray-900'
              : currentTheme === 'eyeCare'
              ? 'bg-[#433422] text-[#F5E6D3]'
              : 'bg-gray-900 text-white'
          } ${loading || !product.stock ? 'opacity-50' : ''}`}
        >
          <RiShoppingBag3Line size={18} />
          <span className="text-sm">Buy Now</span>
        </motion.button>
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
        {/* Title */}
        <h1 className={`text-2xl font-bold mb-4 ${
          currentTheme === 'dark' ? 'text-white' 
          : currentTheme === 'eyeCare' ? 'text-[#433422]'
          : 'text-gray-900'
        }`}>
          {product?.name}
        </h1>

        {/* Price Section */}
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-baseline gap-3">
            <div className={`text-3xl font-bold ${
              currentTheme === 'dark' ? 'text-white' 
              : currentTheme === 'eyeCare' ? 'text-[#433422]'
              : 'text-gray-900'
            }`}>
              RS {product?.salePrice?.toLocaleString()}
            </div>
            <span className={`text-lg line-through ${
              currentTheme === 'dark' ? 'text-gray-400' 
              : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]/60'
              : 'text-gray-500'
            }`}>
              RS {product?.marketPrice?.toLocaleString()}
            </span>
          </div>
          <div className={`text-sm ${
            currentTheme === 'dark' ? 'text-gray-400' 
            : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]'
            : 'text-gray-600'
          }`}>
            {product?.deliveryPrice > 0 
              ? `+RS ${product.deliveryPrice.toLocaleString()} Delivery`
              : 'Free Delivery'
            }
          </div>
          <div className={`flex items-center gap-1.5 ${
            product?.stock > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {product?.stock > 0 ? (
              <>
                <RiCheckboxCircleLine className="w-5 h-5" />
                <span className="text-base font-semibold">{product.stock} in stock</span>
              </>
            ) : (
              <>
                <RiCloseLine className="w-5 h-5" />
                <span className="text-base font-semibold">Out of stock</span>
              </>
            )}
          </div>
        </div>

        {/* Colors Section - Moved here */}
        {product?.colors && product.colors.length > 0 && (
          <div className="mb-4">
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
          </div>
        )}

        {/* Description */}
        <div className="mb-6">
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
            onClick={() => {
              setBottomSheetMode('cart');
              setIsBottomSheetOpen(true);
            }}
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
              <span>Add to Cart • RS {((product?.salePrice * quantity) + (product?.deliveryPrice || 0)).toLocaleString()}</span>
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

  // Add color selection handler
  const handleColorSelect = (color) => {
    console.log('Selected color:', color);
    setSelectedColor(color);
    
    // Check if the color has media
    if (color.media && color.media.length > 0) {
      // Create a new array with color media
      const colorMedia = [...color.media];
      
      // Get the main product media that doesn't belong to any color
      const mainProductMedia = product.media.filter(item => 
        !product.colors.some(c => 
          c.media?.some(m => m.url === item.url)
        )
      );
      
      // Set the media state with color media first, then product media
      setMediaState([...colorMedia, ...mainProductMedia]);
      
      // Reset to first image
      setSelectedMedia(0);
    } else {
      // If no color media, revert to original product media
      setMediaState(product.media);
    }
  };

  // Fix for the initial color selection
  useEffect(() => {
    if (product?.colors?.length > 0 && product?._id) {
      // Get the initial color
      const initialColor = product.colors[0];
      
      // Set the selected color
      setSelectedColor(initialColor);
      
      // Update media if the color has media
      if (initialColor.media && initialColor.media.length > 0) {
        // Create a new array with color media
        const colorMedia = [...initialColor.media];
        
        // Get the main product media that doesn't belong to any color
        const mainProductMedia = product.media.filter(item => 
          !product.colors.some(c => 
            c.media?.some(m => m.url === item.url)
          )
        );
        
        // Set the media state with color media first, then product media
        setMediaState([...colorMedia, ...mainProductMedia]);
        
        // Reset to first image
        setSelectedMedia(0);
      }
    }
  }, [product?._id]); // Only run when product ID changes

  const renderProductInfo = () => (
    <div className="space-y-4">
      {/* Basic Info Card */}
      <div className={`p-4 rounded-xl ${
        currentTheme === 'dark' ? 'bg-gray-800' 
        : currentTheme === 'eyeCare' ? 'bg-[#FFF8ED]'
        : 'bg-white'
      } shadow-lg`}>
        {/* Price Section - Always at top for mobile */}
        {isMobile && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold tracking-tight ${
                currentTheme === 'dark' ? 'text-white' 
                : currentTheme === 'eyeCare' ? 'text-[#433422]'
                : 'text-gray-900'
              }`}>
                RS {product?.salePrice?.toLocaleString()}
              </span>
              <span className={`text-base line-through ${
                currentTheme === 'dark' ? 'text-gray-400' 
                : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]/60'
                : 'text-gray-500'
              }`}>
                RS {product?.marketPrice?.toLocaleString()}
              </span>
            </div>
            <div className={`text-sm ${
              currentTheme === 'dark' ? 'text-gray-400' 
              : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]'
              : 'text-gray-600'
            }`}>
              {product?.deliveryPrice > 0 
                ? `+RS ${product.deliveryPrice.toLocaleString()} Delivery`
                : 'Free Delivery'
              }
            </div>
          </div>
        )}

        {/* Product Title */}
        <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold mb-4 ${
          currentTheme === 'dark' ? 'text-white' 
          : currentTheme === 'eyeCare' ? 'text-[#433422]'
          : 'text-gray-900'
        }`}>
          {product?.name}
        </h1>

        {/* Desktop Price Section */}
        {!isMobile && (
          <div className="flex flex-col gap-2 mb-4">
            <div className="flex items-baseline gap-3">
              <div className={`text-3xl font-bold ${
                currentTheme === 'dark' ? 'text-white' 
                : currentTheme === 'eyeCare' ? 'text-[#433422]'
                : 'text-gray-900'
              }`}>
                RS {product?.salePrice?.toLocaleString()}
              </div>
              <span className={`text-lg line-through ${
                currentTheme === 'dark' ? 'text-gray-400' 
                : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]/60'
                : 'text-gray-500'
              }`}>
                RS {product?.marketPrice?.toLocaleString()}
              </span>
            </div>
            <div className={`text-sm ${
              currentTheme === 'dark' ? 'text-gray-400' 
              : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]'
              : 'text-gray-600'
            }`}>
              {product?.deliveryPrice > 0 
                ? `+RS ${product.deliveryPrice.toLocaleString()} Delivery`
                : 'Free Delivery'
              }
            </div>
          </div>
        )}

        {/* Colors Section */}
        {product?.colors && product.colors.length > 0 && (
          <div className="mb-4">
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
          </div>
        )}

        {/* Description */}
        <div className="mb-4">
          <p className={`text-base leading-relaxed ${
            currentTheme === 'dark' ? 'text-gray-300' 
            : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]'
            : 'text-gray-600'
          }`}>
            {product?.description}
          </p>
        </div>

        {/* Stock Status */}
        <div className={`flex items-center gap-1.5 mb-4 ${
          product?.stock > 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {product?.stock > 0 ? (
            <>
              <RiCheckboxCircleLine className="w-4 h-4" />
              <span className="text-sm font-semibold">{product.stock} in stock</span>
            </>
          ) : (
            <>
              <RiCloseLine className="w-4 h-4" />
              <span className="text-sm font-semibold">Out of stock</span>
            </>
          )}
        </div>

        {/* Add to Cart Section for Desktop */}
        {!isMobile && (
          <div className="flex items-center gap-4">
            {/* Quantity controls and Add to Cart button */}
            {renderProductActions()}
          </div>
        )}
      </div>

      {/* Specifications Card */}
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

      {/* Features Card */}
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
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RiLoader4Line className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  return (
    <>
      <div className={`min-h-screen ${isMobile ? 'pb-24' : 'pb-6'} ${
        currentTheme === 'dark' ? 'bg-gray-900' 
        : currentTheme === 'eyeCare' ? 'bg-[#F5E6D3]' 
        : 'bg-gray-50'
      }`}>
        {isMobile && renderMobileHeader()}
        <div className="max-w-7xl mx-auto pt-6 px-4 sm:px-6">
          <div className={`${isMobile ? 'space-y-6' : 'grid grid-cols-1 lg:grid-cols-2 gap-8'}`}>
            {/* Media Gallery Section */}
            <div className="space-y-6">
              <div className="space-y-4">
                <div className={`relative ${isMobile ? 'mt-16' : ''}`} {...swipeHandlers}>
                  <AnimatePresence initial={false}>
                    {mediaState && mediaState[selectedMedia] && (
                      <motion.div
                        key={selectedMedia}
                        variants={imageVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="relative aspect-square w-full"
                      >
                        {mediaState[selectedMedia]?.type === 'video' ? (
                          <div 
                            className="relative w-full h-full flex items-center justify-center"
                            onMouseMove={handleVideoInteraction}
                            onClick={handleVideoInteraction}
                          >
                            <video
                              ref={videoRef}
                              src={mediaState[selectedMedia].url}
                              className="w-full h-full object-contain"
                              poster={mediaState[selectedMedia].thumbnail}
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
                              {mediaState?.length > 1 && (
                                <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedMedia(prev => 
                                        prev === 0 ? mediaState.length - 1 : prev - 1
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
                                        prev === mediaState.length - 1 ? 0 : prev + 1
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
                            src={mediaState[selectedMedia]?.url}
                            alt={product?.name}
                            className="w-full h-full object-contain"
                          />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Image Counter - Show only on mobile */}
                  {isMobile && mediaState?.length > 1 && (
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
                      {selectedMedia + 1} / {mediaState.length}
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

                {/* Thumbnails - Only show on desktop */}
                {!isMobile && mediaState?.length > 1 && (
                  <div className="relative px-1">
                    <div className="overflow-x-auto scrollbar-thin">
                      <div className="flex gap-3 py-2 px-0.5">
                        {mediaState.map((item, index) => (
                          <motion.button
                            key={index}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setSelectedMedia(index);
                              setIsPlaying(false);
                            }}
                            className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden group
                              transition-all duration-200 ${
                              selectedMedia === index 
                                ? `ring-2 ${
                                    currentTheme === 'dark' ? 'ring-white' 
                                    : currentTheme === 'eyeCare' ? 'ring-[#433422]'
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
              </div>
            </div>

            {/* Product Info Section */}
            {renderProductInfo()}
          </div>
        </div>
        {isMobile && renderBottomBar()}
      </div>

      {/* Product Action Modal */}
      <ProductActionModal
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        product={product}
        selectedColor={selectedColor}
        onColorSelect={handleColorSelect}
        quantity={quantity}
        setQuantity={setQuantity}
        onAction={bottomSheetMode === 'cart' ? handleAddToCart : handleBuyNow}
        loading={loading}
        currentTheme={currentTheme}
        mode={bottomSheetMode}
      />
    </>
  );
};

export default ProductDetails;