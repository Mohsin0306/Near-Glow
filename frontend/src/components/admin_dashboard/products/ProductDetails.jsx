import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RiEditLine, RiArrowLeftLine, RiLoader4Line, RiStore2Line, RiPriceTag3Line, RiCheckboxCircleLine, RiMoneyDollarCircleLine, RiSaveLine, RiCloseLine, RiZoomInLine, RiArrowLeftSLine, RiArrowRightSLine, RiPlayCircleLine, RiPauseCircleLine, RiTruckLine } from 'react-icons/ri';
import { useTheme } from '../../../context/ThemeContext';
import { createAPI } from '../../../utils/api';
import { toast } from 'react-hot-toast';
import ProductModal from './ProductModal';
import { useAuth } from '../../../context/AuthContext';
import { useMediaQuery } from '@mui/material';
import { useSwipeable } from 'react-swipeable';

const imageVariants = {
  enter: { opacity: 0, scale: 1.1 },
  center: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
};

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const { user } = useAuth();
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
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedColorImages, setSelectedColorImages] = useState([]);

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
    if (product?.colors?.length > 0) {
      const initialColor = product.colors[0];
      setSelectedColor(initialColor);
      
      if (initialColor.media?.length > 0) {
        const mainProductMedia = product.media.filter(item => 
          !product.colors.some(c => 
            c.media?.some(m => m.url === item.url)
          )
        );
        
        product.media = [...initialColor.media, ...mainProductMedia];
        setSelectedMedia(0);
      }
    }
  }, [product]);

  const token = localStorage.getItem('authToken');
  const api = createAPI(token);

  useEffect(() => {
    if (!user || !user._id) {
      toast.error('User session expired. Please login again.');
      navigate('/login');
      return;
    }
    fetchProduct();
  }, [id, user]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/products/${id}`);
      if (response.data.success) {
        setProduct(response.data.product);
      }
    } catch (error) {
      toast.error('Failed to fetch product details');
      navigate('/admin/products');
    } finally {
      setLoading(false);
    }
  };

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

      const response = await api.put(`/products/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        // Fetch fresh data after update
        const updatedProductResponse = await api.get(`/products/${id}`);
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
    if (user && user._id) {
      navigate(`/${user._id}/admin/products`);
    } else {
      toast.error('User session expired. Please login again.');
      navigate('/login');
    }
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

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    
    // Create a combined media array with main product images and color variant images
    const allMedia = [...(product?.media || [])];
    
    // If color has media, add it to the beginning of the array
    if (color.media && color.media.length > 0) {
      // Filter out any existing color images from the main media array
      const mainProductMedia = allMedia.filter(item => 
        !product?.colors?.some(c => 
          c.media?.some(m => m.url === item.url)
        )
      );
      
      // Combine color media with main product media
      const combinedMedia = [...color.media, ...mainProductMedia];
      
      // Update the product's media array temporarily
      product.media = combinedMedia;
      
      // Set the first image of the color as selected
      setSelectedMedia(0);
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RiLoader4Line className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-6 ${isMobile ? 'max-w-[100vw]' : ''} ${
      currentTheme === 'dark' ? 'bg-gray-900' 
      : currentTheme === 'eyeCare' ? 'bg-[#F5E6D3]' 
      : 'bg-gray-50'
    }`}>
      {/* Mobile Header */}
      {isMobile && (
        <motion.div
          initial={false}
          animate={{
            backgroundColor: currentTheme === 'dark' 
              ? 'rgb(17, 24, 39)' 
              : currentTheme === 'eyeCare'
              ? 'rgb(245, 230, 211)'
              : 'rgb(255, 255, 255)'
          }}
          className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 
            ${currentTheme === 'dark' 
              ? 'bg-gray-900 border-gray-800' 
              : currentTheme === 'eyeCare'
              ? 'bg-[#F5E6D3] border-[#E6D5B8]'
              : 'bg-white border-gray-200'
            } border-b shadow-sm`}
        >
          <div className="flex items-center justify-between gap-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleBackClick}
              className={`flex items-center gap-2 p-2 rounded-xl
                ${currentTheme === 'dark'
                  ? 'text-gray-200'
                  : currentTheme === 'eyeCare'
                  ? 'text-[#433422]'
                  : 'text-gray-700'
                }`}
            >
              <RiArrowLeftLine size={24} />
            </motion.button>

            <h1 className={`flex-1 text-lg font-semibold truncate
              ${currentTheme === 'dark'
                ? 'text-white'
                : currentTheme === 'eyeCare'
                ? 'text-[#433422]'
                : 'text-gray-900'
              }`}
            >
              Product Details
            </h1>

            {isEditing ? (
              <div className="flex items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleUpdateProduct}
                  className={`p-2 rounded-xl ${
                    currentTheme === 'eyeCare'
                      ? 'bg-[#433422] text-white'
                      : currentTheme === 'dark'
                      ? 'bg-green-600 text-white'
                      : 'bg-green-600 text-white'
                  }`}
                >
                  <RiSaveLine size={20} />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setIsEditing(false);
                    setEditedProduct({ ...product });
                  }}
                  className={`p-2 rounded-xl ${
                    currentTheme === 'dark'
                      ? 'bg-gray-800 text-gray-200'
                      : currentTheme === 'eyeCare'
                      ? 'bg-[#E6D5B8] text-[#433422]'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <RiCloseLine size={20} />
                </motion.button>
              </div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditing(true)}
                className={`p-2 rounded-xl ${
                  currentTheme === 'eyeCare'
                    ? 'bg-[#433422] text-white'
                    : currentTheme === 'dark'
                    ? 'bg-gray-800 text-white'
                    : 'bg-black text-white'
                }`}
              >
                <RiEditLine size={20} />
              </motion.button>
            )}
          </div>
        </motion.div>
      )}

      {/* Main Content with conditional padding for mobile */}
      <div className={`max-w-7xl mx-auto ${isMobile ? 'pt-20' : 'pt-6'} px-4 sm:px-6`}>
        {/* Desktop Header - Only show if not mobile */}
        {!isMobile && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <motion.button
              whileHover={{ x: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBackClick}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200
                ${currentTheme === 'dark'
                  ? 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                  : currentTheme === 'eyeCare'
                  ? 'bg-[#E6D5B8] text-[#433422] hover:bg-[#D4C4A7]'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } group`}
            >
              <motion.span
                className="flex items-center"
                animate={{ x: 0 }}
                whileHover={{ x: -2 }}
              >
                <RiArrowLeftLine 
                  size={20} 
                  className={`transition-transform duration-200 group-hover:-translate-x-1
                    ${currentTheme === 'dark' 
                      ? 'text-gray-300' 
                      : currentTheme === 'eyeCare' 
                      ? 'text-[#433422]' 
                      : 'text-gray-600'
                    }`}
                />
              </motion.span>
              <span className={`hidden sm:inline font-medium ${
                currentTheme === 'dark' 
                  ? 'text-gray-200' 
                  : currentTheme === 'eyeCare' 
                  ? 'text-[#433422]' 
                  : 'text-gray-700'
              }`}>
                Back to Products
              </span>
            </motion.button>
            
            {isEditing ? (
              <div className="flex items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUpdateProduct}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-white shadow-lg 
                    transition-all duration-200 ${
                    currentTheme === 'eyeCare' 
                      ? 'bg-[#433422] hover:bg-[#5C4934] shadow-[#433422]/20' 
                      : currentTheme === 'dark'
                      ? 'bg-green-600 hover:bg-green-700 shadow-green-900/20'
                      : 'bg-green-600 hover:bg-green-700 shadow-green-600/20'
                  }`}
                >
                  <motion.span
                    animate={{ rotate: 0 }}
                    whileHover={{ rotate: 180 }}
                    transition={{ duration: 0.3 }}
                  >
                    <RiSaveLine size={20} />
                  </motion.span>
                  <span className="font-medium">Save Changes</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setIsEditing(false);
                    setEditedProduct({ ...product });
                  }}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl shadow-lg 
                    transition-all duration-200 ${
                    currentTheme === 'eyeCare' 
                      ? 'bg-[#E6D5B8] text-[#433422] hover:bg-[#D4C4A7] shadow-[#433422]/10' 
                      : currentTheme === 'dark'
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 shadow-black/20'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300 shadow-gray-400/20'
                  }`}
                >
                  <motion.span
                    animate={{ rotate: 0 }}
                    whileHover={{ rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <RiCloseLine size={20} />
                  </motion.span>
                  <span className="font-medium">Cancel</span>
                </motion.button>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsEditing(true)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-white shadow-lg 
                  transition-all duration-200 ${
                  currentTheme === 'eyeCare' 
                    ? 'bg-[#433422] hover:bg-[#5C4934] shadow-[#433422]/20' 
                    : currentTheme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600 shadow-black/20'
                    : 'bg-black hover:bg-gray-800 shadow-black/20'
                }`}
              >
                <motion.span
                  animate={{ rotate: 0 }}
                  whileHover={{ rotate: 180 }}
                  transition={{ duration: 0.3 }}
                >
                  <RiEditLine size={20} />
                </motion.span>
                <span className="font-medium">Edit Product</span>
              </motion.button>
            )}
          </div>
        )}

        {/* Product Content */}
        <div className={`${isMobile ? 'space-y-6' : 'grid grid-cols-1 lg:grid-cols-2 gap-8'}`}>
          {/* Left Column: Images and Highlights (Desktop) */}
          <div className="space-y-6">
            {/* Gallery Section */}
            <div className="space-y-4">
              {/* Main Image Container */}
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

              {/* Thumbnails - Only show on desktop */}
              {!isMobile && product?.media?.length > 1 && (
                <div className="relative px-1">
                  <div className="overflow-x-auto scrollbar-thin">
                    <div className="flex gap-3 py-2 px-0.5">
                      {product.media.map((item, index) => (
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
                          currentTheme === 'dark' ? 'text-gray-300' 
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

                  {/* Price Info */}
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
                          currentTheme === 'dark' ? 'text-gray-300' 
                          : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]'
                          : 'text-gray-600'
                        }`}>
                          Price
                        </p>
                        <div className="flex items-baseline gap-2">
                          <p className={`text-base font-semibold ${
                            currentTheme === 'dark' ? 'text-white' 
                            : currentTheme === 'eyeCare' ? 'text-[#433422]'
                            : 'text-gray-900'
                          }`}>
                            RS {product?.salePrice?.toLocaleString()}
                          </p>
                          {product?.marketPrice > product?.salePrice && (
                            <p className={`text-sm line-through ${
                              currentTheme === 'dark' ? 'text-gray-400' 
                              : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]/60'
                              : 'text-gray-500'
                            }`}>
                              RS {product?.marketPrice?.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Info */}
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
                        <RiTruckLine className="w-5 h-5 text-white" />
                      </span>
                      <div>
                        <p className={`text-sm font-medium ${
                          currentTheme === 'dark' ? 'text-gray-300' 
                          : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]'
                          : 'text-gray-600'
                        }`}>
                          Delivery
                        </p>
                        <p className={`text-base font-semibold ${
                          currentTheme === 'dark' ? 'text-white' 
                          : currentTheme === 'eyeCare' ? 'text-[#433422]'
                          : 'text-gray-900'
                        }`}>
                          {product?.deliveryPrice > 0 
                            ? `RS ${product.deliveryPrice.toLocaleString()}`
                            : 'Free Delivery'
                          }
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
                          currentTheme === 'dark' ? 'text-gray-300' 
                          : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]'
                          : 'text-gray-600'
                        }`}>
                          Status
                        </p>
                        <p className={`text-base font-semibold ${
                          product?.stock > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {product?.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Product Details Section */}
            {isMobile && (
              <div className="space-y-4">
                {/* 1. Media Gallery */}
                <div className="relative">
                  {/* ... existing media gallery code ... */}
                </div>

                {/* 2. Price Section - Moved up */}
                <div className="px-4 py-2">
                  <div className="flex items-start justify-between">
                    {/* Left side - Price */}
                    <div className="flex items-baseline gap-2">
                      <span className={`text-xl font-bold ${currentTheme === 'dark' ? 'text-white' : currentTheme === 'eyeCare' ? 'text-[#433422]' : 'text-gray-900'}`}>
                        RS {product?.salePrice?.toLocaleString()}
                      </span>
                      {product?.marketPrice > product?.salePrice && (
                        <span className={`text-sm line-through ${currentTheme === 'dark' ? 'text-gray-400' : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]/60' : 'text-gray-500'}`}>
                          RS {product?.marketPrice?.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Right side - Delivery & Stock */}
                    <div className="text-right">
                      <div className={`text-xs ${currentTheme === 'dark' ? 'text-gray-400' : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]/60' : 'text-gray-500'}`}>
                        {product?.deliveryPrice > 0 
                          ? `Delivery: RS ${product.deliveryPrice.toLocaleString()}`
                          : 'Free Delivery'
                        }
                      </div>
                      <div className={`text-xs mt-0.5 ${product?.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {product?.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Title - After price */}
                <div className="px-4">
                  <h1 className={`text-xl font-bold mb-1 ${currentTheme === 'dark' ? 'text-white' : currentTheme === 'eyeCare' ? 'text-[#433422]' : 'text-gray-900'}`}>
                    {product?.name}
                  </h1>
                  <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-400' : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]' : 'text-gray-500'}`}>
                    {product?.category?.name} • {product?.brand}
                  </p>
                </div>

                {/* 4. Colors Section */}
                {product?.colors && product.colors.length > 0 && (
                  <div className="px-4 py-2">
                    <div className="space-y-2">
                      {/* Color Label and Selected Color */}
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${currentTheme === 'dark' ? 'text-white' : currentTheme === 'eyeCare' ? 'text-[#433422]' : 'text-gray-900'}`}>
                          Color:
                        </span>
                        <span className={`text-sm ${currentTheme === 'dark' ? 'text-gray-300' : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]' : 'text-gray-600'}`}>
                          {selectedColor?.name || product.colors[0].name}
                        </span>
                      </div>

                      {/* Color Swatches */}
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
                              <span className={`text-xs ${currentTheme === 'dark' ? 'text-gray-300' : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]' : 'text-gray-600'}`}>
                                {color.name}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. Description */}
                <div className="px-4">
                  <p className={`text-sm leading-relaxed ${currentTheme === 'dark' ? 'text-gray-300' : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]' : 'text-gray-600'}`}>
                    {product?.description}
                  </p>
                </div>

                {/* Specifications - Mobile */}
                <div className="px-4 pt-4 border-t">
                  <h3 className={`text-base font-semibold mb-3 ${currentTheme === 'dark' ? 'text-gray-300' : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]' : 'text-gray-900'}`}>
                    Specifications
                  </h3>
                  <div className="space-y-3">
                    {product?.specifications?.map((spec, index) => (
                      <div key={index} className="space-y-1">
                        <dt className={`text-sm font-medium ${currentTheme === 'dark' ? 'text-gray-400' : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]' : 'text-gray-500'}`}>
                          {spec.key}
                        </dt>
                        <dd className={`text-sm ${currentTheme === 'dark' ? 'text-gray-300' : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]' : 'text-gray-900'}`}>
                          {spec.value}
                        </dd>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Features - Mobile */}
                <div className="px-4 pt-4 border-t">
                  <h3 className={`text-base font-semibold mb-3 ${currentTheme === 'dark' ? 'text-gray-300' : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]' : 'text-gray-900'}`}>
                    Features
                  </h3>
                  <ul className="space-y-2">
                    {product?.features?.map((feature, index) => (
                      <li key={index} className={`flex items-start gap-2 text-sm ${currentTheme === 'dark' ? 'text-gray-300' : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]' : 'text-gray-600'}`}>
                        <span className="mt-1">•</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Details */}
          {!isMobile && (
            <div className="space-y-6">
              <div className={`p-6 rounded-2xl ${
                currentTheme === 'dark' ? 'bg-gray-800' 
                : currentTheme === 'eyeCare' ? 'bg-[#FFF8ED]'
                : 'bg-white'
              } shadow-lg`}>
                {/* 1. Title Section */}
                <div className="mb-6">
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
                    <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${
                      currentTheme === 'dark' ? 'text-white' 
                      : currentTheme === 'eyeCare' ? 'text-[#433422]'
                      : 'text-gray-900'
                    }`}>
                      {product?.name}
                    </h1>
                  )}
                  <p className={`text-sm ${
                    currentTheme === 'dark' ? 'text-gray-400' 
                    : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]'
                    : 'text-gray-500'
                  }`}>
                    {product?.category?.name} • {product?.brand}
                  </p>
                </div>

                {/* 2. Price Section - Moved after title */}
                <div className={`p-6 rounded-2xl ${
                  currentTheme === 'dark' ? 'bg-gray-800' 
                  : currentTheme === 'eyeCare' ? 'bg-[#FFF8ED]'
                  : 'bg-white'
                } shadow-lg`}>
                  <div className="space-y-3">
                    {/* Price */}
                    <div className="flex items-baseline gap-3">
                      <span className={`text-3xl font-bold ${
                        currentTheme === 'dark' ? 'text-white' 
                        : currentTheme === 'eyeCare' ? 'text-[#433422]'
                        : 'text-gray-900'
                      }`}>
                        RS {product?.salePrice?.toLocaleString()}
                      </span>
                      {product?.marketPrice > product?.salePrice && (
                        <span className={`text-xl line-through ${
                          currentTheme === 'dark' ? 'text-gray-400' 
                          : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]/60'
                          : 'text-gray-500'
                        }`}>
                          RS {product?.marketPrice?.toLocaleString()}
                        </span>
                      )}
                    </div>
                    
                    {/* Delivery Price */}
                    <div className={`text-base ${
                      currentTheme === 'dark' ? 'text-gray-400' 
                      : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]/60'
                      : 'text-gray-500'
                    }`}>
                      {product?.deliveryPrice > 0 
                        ? `Delivery: RS ${product.deliveryPrice.toLocaleString()}`
                        : 'Free Delivery'
                      }
                    </div>

                    {/* Stock Status */}
                    <div className={`text-base ${product?.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {product?.stock > 0 ? (
                        <>
                          In Stock
                          {product.stock <= 5 && (
                            <span className="ml-2 text-red-600">
                              Only {product.stock} left!
                            </span>
                          )}
                        </>
                      ) : 'Out of Stock'}
                    </div>
                  </div>
                </div>

                {/* 3. Colors Section */}
                {product?.colors && product.colors.length > 0 && (
                  <div className={`p-6 rounded-2xl ${
                    currentTheme === 'dark' ? 'bg-gray-800' 
                    : currentTheme === 'eyeCare' ? 'bg-[#FFF8ED]'
                    : 'bg-white'
                  } shadow-lg`}>
                    <div className="flex flex-col space-y-3">
                      {/* Color Label and Selected Color */}
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${
                          currentTheme === 'dark' ? 'text-white' 
                          : currentTheme === 'eyeCare' ? 'text-[#433422]'
                          : 'text-gray-900'
                        }`}>
                          Color:
                        </span>
                        <span className={`${
                          currentTheme === 'dark' ? 'text-gray-300' 
                          : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]'
                          : 'text-gray-600'
                        }`}>
                          {selectedColor?.name || product.colors[0].name}
                        </span>
                      </div>

                      {/* Color Swatches */}
                      <div className="flex flex-wrap gap-3">
                        {product.colors.map((color, index) => (
                          <button
                            key={index}
                            onClick={() => handleColorSelect(color)}
                            className={`group relative rounded-lg p-1 ${
                              selectedColor?.name === color.name 
                                ? 'ring-2 ring-blue-500'
                                : 'hover:ring-2 hover:ring-gray-300'
                            }`}
                          >
                            <div className="flex flex-col items-center gap-1">
                              <div
                                className={`w-12 h-12 rounded-lg border-2 ${
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

                {/* 4. Description */}
                <div className={`p-6 rounded-2xl ${
                  currentTheme === 'dark' ? 'bg-gray-800' 
                  : currentTheme === 'eyeCare' ? 'bg-[#FFF8ED]'
                  : 'bg-white'
                } shadow-lg`}>
                  <p className={`text-base leading-relaxed ${
                    currentTheme === 'dark' ? 'text-gray-300' 
                    : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]'
                    : 'text-gray-600'
                  }`}>
                    {product?.description}
                  </p>
                </div>
              </div>

              {/* Specifications */}
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
                {isEditing ? (
                  <div className="space-y-4">
                    {editedProduct?.specifications.map((spec, index) => (
                      <div key={index} className="grid grid-cols-2 gap-4">
                        <input
                          value={spec.key}
                          onChange={(e) => handleSpecificationChange(index, 'key', e.target.value)}
                          className={`w-full px-4 py-3 rounded-xl border transition-all duration-200
                            ${currentTheme === 'dark'
                                ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                                : currentTheme === 'eyeCare'
                                ? 'bg-white border-[#E6D5B8] text-[#433422] focus:border-[#433422]'
                                : 'bg-white border-gray-200 text-gray-900 focus:border-black'
                              } focus:ring-2 focus:ring-opacity-50 focus:outline-none`}
                            placeholder="Key"
                          />
                          <input
                            value={spec.value}
                            onChange={(e) => handleSpecificationChange(index, 'value', e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl border transition-all duration-200
                              ${currentTheme === 'dark'
                                ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                                : currentTheme === 'eyeCare'
                                ? 'bg-white border-[#E6D5B8] text-[#433422] focus:border-[#433422]'
                                : 'bg-white border-gray-200 text-gray-900 focus:border-black'
                              } focus:ring-2 focus:ring-opacity-50 focus:outline-none`}
                            placeholder="Value"
                          />
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className={`p-6 rounded-2xl ${
                    currentTheme === 'dark' ? 'bg-gray-800' 
                    : currentTheme === 'eyeCare' ? 'bg-[#FFF8ED]'
                    : 'bg-white'
                  } shadow-lg`}>
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
                          <dd className={`text-base break-words ${
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
                )}
              </div>

              {/* Features */}
              <div>
                <h3 className={`text-lg font-semibold mb-4 ${
                  currentTheme === 'dark' ? 'text-white' 
                  : currentTheme === 'eyeCare' ? 'text-[#433422]'
                  : 'text-gray-900'
                }`}>
                  Features
                </h3>
                {isEditing ? (
                  <div className="space-y-4">
                    {editedProduct?.features.map((feature, index) => (
                      <input
                        key={index}
                        value={feature}
                        onChange={(e) => handleFeatureChange(index, e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border transition-all duration-200
                          ${currentTheme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                            : currentTheme === 'eyeCare'
                            ? 'bg-white border-[#E6D5B8] text-[#433422] focus:border-[#433422]'
                            : 'bg-white border-gray-200 text-gray-900 focus:border-black'
                          } focus:ring-2 focus:ring-opacity-50 focus:outline-none`}
                          placeholder={`Feature ${index + 1}`}
                        />
                      ))}
                  </div>
                ) : (
                  <div className={`p-6 rounded-2xl ${
                    currentTheme === 'dark' ? 'bg-gray-800' 
                    : currentTheme === 'eyeCare' ? 'bg-[#FFF8ED]'
                    : 'bg-white'
                  } shadow-lg`}>
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
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails; 