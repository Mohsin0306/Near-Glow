import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  RiHeartLine,
  RiShoppingCart2Line,
  RiFilterLine,
  RiSearchLine,
  RiPriceTag3Line,
  RiCheckLine,
  RiHeartFill,
  RiStarFill
} from 'react-icons/ri';
import { createAPI } from '../../utils/api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import ProductActionModal from '../common/ProductActionModal';

// Skeleton loader component
const SkeletonLoader = () => (
  <div className="animate-pulse">
    <div className="h-[35vh] bg-gray-300 mb-8" />
    <div className="max-w-[1920px] mx-auto px-4">
      {[1, 2].map((section) => (
        <div key={section} className="mb-8 sm:mb-12">
          <div className="h-6 sm:h-8 bg-gray-200 w-36 sm:w-48 mb-4 sm:mb-6" />
          <div className="flex gap-3 sm:gap-4 overflow-x-hidden">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="w-[140px] sm:w-[200px] md:w-[calc((100vw-112px)/4)] max-w-[300px]">
                <div className="bg-gray-200 rounded-lg aspect-w-1 aspect-h-1 sm:aspect-w-4 sm:aspect-h-3" />
                <div className="h-16 sm:h-24 bg-gray-200 mt-2 sm:mt-4 rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const scrollbarStyles = `
  <style>
    @media (min-width: 768px) {
      .product-scroll {
        overflow-x: hidden;
        transition: all 0.3s ease;
      }
      .product-scroll:hover {
        overflow-x: auto;
      }
      .product-scroll::-webkit-scrollbar {
        height: 12px; /* Thicker scrollbar */
      }
      .product-scroll::-webkit-scrollbar-track {
        background: transparent;
        border-radius: 8px;
        margin: 0 4px;
      }
      .product-scroll.light-theme::-webkit-scrollbar-track {
        background: #f1f1f1;
      }
      .product-scroll.dark-theme::-webkit-scrollbar-track {
        background: #2d3748;
      }
      .product-scroll.eye-care-theme::-webkit-scrollbar-track {
        background: #E6D5BC;
      }
      .product-scroll::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 8px;
        border: 3px solid transparent;
        background-clip: padding-box;
        transition: all 0.3s ease;
      }
      .product-scroll.light-theme::-webkit-scrollbar-thumb {
        background-color: #CBD5E0;
        border-color: #f1f1f1;
      }
      .product-scroll.dark-theme::-webkit-scrollbar-thumb {
        background-color: #4A5568;
        border-color: #2d3748;
      }
      .product-scroll.eye-care-theme::-webkit-scrollbar-thumb {
        background-color: #C4B39A;
        border-color: #E6D5BC;
      }
      .product-scroll::-webkit-scrollbar-thumb:hover {
        background-color: #718096;
      }
      .product-scroll.light-theme::-webkit-scrollbar-thumb:hover {
        background-color: #A0AEC0;
      }
      .product-scroll.dark-theme::-webkit-scrollbar-thumb:hover {
        background-color: #718096;
      }
      .product-scroll.eye-care-theme::-webkit-scrollbar-thumb:hover {
        background-color: #B3A289;
      }
    }
    /* Hide scrollbar for mobile */
    @media (max-width: 767px) {
      .product-scroll {
        overflow-x: auto;
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      .product-scroll::-webkit-scrollbar {
        display: none;
      }
    }
  </style>
`;

const ProductCard = ({ product, currentTheme, wishlistItems }) => {
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Check wishlist status from props instead of making API call
  useEffect(() => {
    setIsInWishlist(wishlistItems?.some(item => item._id === product._id));
  }, [wishlistItems, product._id]);

  // Add effect to handle body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body scrolling when modal is closed
      document.body.style.overflow = '';
    }
    
    // Cleanup function to ensure body scroll is restored
    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);

  const handleAddToWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Please login to add to wishlist');
      return;
    }

    try {
      setIsAddingToWishlist(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('https://api.nearglow.com/api/wishlist/add', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId: product._id
        })
      });

      const data = await response.json();
      if (data.success) {
        setIsInWishlist(true);
        toast.success('Added to wishlist');
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      toast.error('Failed to add to wishlist');
    } finally {
      setIsAddingToWishlist(false);
    }
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }
    setIsModalOpen(true);
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    
    if (color.media && color.media.length > 0) {
      const mainProductMedia = product.media.filter(item => 
        !product.colors?.some(c => 
          c.media?.some(m => m.url === item.url)
        )
      );
      
      product.media = [...color.media, ...mainProductMedia];
    }
  };

  useEffect(() => {
    if (isModalOpen && product?.colors?.length > 0) {
      const initialColor = product.colors[0];
      setSelectedColor(initialColor);
      
      if (initialColor.media?.length > 0) {
        const mainProductMedia = product.media.filter(item => 
          !product.colors.some(c => 
            c.media?.some(m => m.url === item.url)
          )
        );
        
        product.media = [...initialColor.media, ...mainProductMedia];
      }
    }
  }, [isModalOpen, product]);

  const handleCartAction = async () => {
    if (product?.colors?.length > 0 && !selectedColor) {
      toast.error('Please select a color');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      const api = createAPI(token);
      await api.post('/cart/add', {
        productId: product._id,
        quantity,
        colorId: selectedColor?._id,
      });
      
      toast.success('Added to cart successfully');
      setIsModalOpen(false);
      setIsAdded(true);
      setTimeout(() => {
        setIsAdded(false);
      }, 2000);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error(error.response?.data?.message || 'Error adding to cart');
    } finally {
      setLoading(false);
    }
  };

  const transformedProduct = {
    ...product,
    colors: product.colors?.map(color => ({
      _id: color._id,
      name: color.name,
      media: color.media || []
    })) || []
  };

  // Update the modal styles with more specific and higher z-index values
  const modalStyles = `
    <style>
      /* Modal overlay - extremely high z-index */
      .modal-overlay {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        z-index: 99999 !important; /* Extremely high z-index */
        background-color: rgba(0, 0, 0, 0.7) !important;
      }
      
      /* Modal content - even higher z-index */
      .modal-content {
        position: relative !important;
        z-index: 100000 !important; /* Higher than overlay */
      }
      
      /* Force all other elements below modal */
      body.modal-open header,
      body.modal-open nav,
      body.modal-open .sticky,
      body.modal-open .fixed,
      body.modal-open [class*="z-"] {
        z-index: 10 !important;
      }
      
      /* Prevent scrolling when modal is open */
      body.modal-open {
        overflow: hidden !important;
        position: relative !important;
      }
    </style>
  `;

  // Add this effect to forcefully handle z-index when modal is open
  useEffect(() => {
    if (isModalOpen) {
      // Add class to body when modal is open
      document.body.classList.add('modal-open');
      
      // Force all sticky/fixed elements to have lower z-index
      const stickyElements = document.querySelectorAll('.sticky, .fixed, [class*="z-"]');
      stickyElements.forEach(el => {
        el.dataset.originalZIndex = el.style.zIndex;
        el.style.zIndex = '10';
      });
      
      // Prevent body scrolling
      document.body.style.overflow = 'hidden';
    } else {
      // Remove class from body when modal is closed
      document.body.classList.remove('modal-open');
      
      // Restore original z-index values
      const stickyElements = document.querySelectorAll('.sticky, .fixed, [class*="z-"]');
      stickyElements.forEach(el => {
        if (el.dataset.originalZIndex) {
          el.style.zIndex = el.dataset.originalZIndex;
          delete el.dataset.originalZIndex;
        } else {
          el.style.removeProperty('z-index');
        }
      });
      
      // Restore body scrolling
      document.body.style.overflow = '';
    }
    
    return () => {
      // Cleanup function
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      
      const stickyElements = document.querySelectorAll('.sticky, .fixed, [class*="z-"]');
      stickyElements.forEach(el => {
        if (el.dataset.originalZIndex) {
          el.style.zIndex = el.dataset.originalZIndex;
          delete el.dataset.originalZIndex;
        } else {
          el.style.removeProperty('z-index');
        }
      });
    };
  }, [isModalOpen]);

  return (
    <>
      <div className={`group h-full rounded-lg overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl ${
        currentTheme === 'dark' ? 'bg-gray-800' 
        : currentTheme === 'eyeCare' ? 'bg-[#E6D5BC]'
        : 'bg-white'
      }`}>
        <Link to={`/products/${product._id}`}>
          <div className="relative w-full pb-[100%]">
            {product.media && product.media.length > 0 && (
              <img 
                src={product.media[0].url} 
                alt={product.name}
                className="absolute inset-0 w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/400';
                  e.target.onError = null; // Prevent infinite loop if placeholder fails
                }}
              />
            )}
            {!product.media?.length && (
              <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400">No Image</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
            <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex gap-1.5 sm:gap-2">
              {/* Wishlist Button */}
              <button 
                className={`p-1.5 sm:p-2 rounded-full shadow-lg transform transition-all duration-300 
                  ${isAddingToWishlist ? 'scale-90' : 'hover:scale-110'}
                  ${isInWishlist 
                    ? currentTheme === 'dark'
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : currentTheme === 'eyeCare'
                      ? 'bg-[#FF6B6B] text-white hover:bg-[#FF5252]'
                      : 'bg-red-500 text-white hover:bg-red-600'
                    : currentTheme === 'dark'
                    ? 'bg-gray-700/90 hover:bg-gray-600 text-gray-300'
                    : currentTheme === 'eyeCare'
                    ? 'bg-[#E6D5BC]/90 hover:bg-[#D5C4AB] text-[#433422]'
                    : 'bg-white/90 hover:bg-white text-gray-700'
                  }`}
                onClick={handleAddToWishlist}
                disabled={isAddingToWishlist}
              >
                {isInWishlist ? (
                  <RiHeartFill 
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors duration-300
                      ${currentTheme === 'eyeCare' ? 'text-[#433422]' : 'text-white'}`}
                  />
                ) : (
                  <RiHeartLine 
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors duration-300
                      ${isAddingToWishlist ? 'animate-pulse' : ''}`}
                  />
                )}
              </button>

              {/* Cart Button */}
              <button 
                className={`p-1.5 sm:p-2 rounded-full shadow-lg transform transition-all duration-300 
                  ${isAddingToCart ? 'scale-90' : 'hover:scale-110'}
                  ${isAdded 
                    ? currentTheme === 'dark'
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : currentTheme === 'eyeCare'
                      ? 'bg-[#68D391] text-white hover:bg-[#48BB78]'
                      : 'bg-green-500 text-white hover:bg-green-600'
                    : currentTheme === 'dark'
                    ? 'bg-gray-700/90 hover:bg-gray-600 text-gray-300'
                    : currentTheme === 'eyeCare'
                    ? 'bg-[#E6D5BC]/90 hover:bg-[#D5C4AB] text-[#433422]'
                    : 'bg-white/90 hover:bg-white text-gray-700'
                  }`}
                onClick={handleAddToCart}
                disabled={isAddingToCart}
              >
                {isAdded ? (
                  <RiCheckLine 
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors duration-300
                      ${currentTheme === 'eyeCare' ? 'text-[#433422]' : 'text-white'}`}
                  />
                ) : (
                  <RiShoppingCart2Line 
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors duration-300
                      ${isAddingToCart ? 'animate-pulse' : ''}`}
                  />
                )}
              </button>
            </div>
            {/* Out of stock overlay */}
            {product.stock <= 0 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white text-xs font-medium px-2 py-0.5 rounded-full bg-red-500">
                  Out of Stock
                </span>
              </div>
            )}
          </div>
          <div className="p-3 sm:p-4">
            <h3 className={`text-sm sm:text-base font-medium mb-1 line-clamp-2 ${
              currentTheme === 'dark' ? 'text-white' 
              : currentTheme === 'eyeCare' ? 'text-[#433422]'
              : 'text-gray-900'
            }`}>
              {product.name}
            </h3>
            <div className="flex items-baseline gap-2 mb-1">
              <span className={`font-bold ${
                currentTheme === 'dark' ? 'text-white' 
                : currentTheme === 'eyeCare' ? 'text-[#433422]'
                : 'text-gray-900'
              }`}>
                Rs {product.salePrice?.toLocaleString()}
              </span>
              {product.marketPrice > product.salePrice && (
                <span className={`text-sm line-through ${
                  currentTheme === 'dark' ? 'text-gray-400' 
                  : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]/60'
                  : 'text-gray-500'
                }`}>
                  Rs {product.marketPrice?.toLocaleString()}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className={`text-xs ${
                product.stock > 0 
                  ? 'text-green-500' 
                  : 'text-red-500'
              }`}>
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </div>
              {product.rating > 0 && (
                <div className="flex items-center gap-1">
                  <RiStarFill className="text-yellow-400" size={14} />
                  <span className={`text-xs ${
                    currentTheme === 'dark' ? 'text-gray-300' 
                    : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]'
                    : 'text-gray-600'
                  }`}>
                    {product.rating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Link>
      </div>

      {/* Use portal to render modal outside the component hierarchy */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 modal-overlay" 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(0, 0, 0, 0.7)'
          }}
        >
          <div className="modal-content" style={{ position: 'relative', zIndex: 100000 }}>
            <ProductActionModal
              isOpen={isModalOpen}
              onClose={() => {
                setIsModalOpen(false);
                setSelectedColor(null);
                setQuantity(1);
              }}
              product={transformedProduct}
              selectedColor={selectedColor}
              onColorSelect={handleColorSelect}
              quantity={quantity}
              setQuantity={setQuantity}
              onAction={handleCartAction}
              loading={loading}
              currentTheme={currentTheme}
              mode="cart"
            />
          </div>
        </div>
      )}
    </>
  );
};

// Add this CSS to ensure modal appears correctly
const modalStyles = `
  <style>
    .modal-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }
    
    @media (max-width: 768px) {
      .modal-container {
        align-items: flex-end;
      }
    }
    
    /* Ensure modal overlay is above everything */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 9999;
      background-color: rgba(0, 0, 0, 0.5);
    }
    
    /* Ensure modal content is above the overlay */
    .modal-content {
      position: relative;
      z-index: 10000;
    }
  </style>
`;

const CategoryProducts = () => {
  const { currentTheme } = useTheme();
  const { categoryId } = useParams();
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubcategories, setSelectedSubcategories] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [sortBy, setSortBy] = useState('default');
  const [originalProducts, setOriginalProducts] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const navigate = useNavigate();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Added for auth check

  // Fetch wishlist once on component mount
  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('https://api.nearglow.com/api/wishlist', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setWishlistItems(data.data.products || []);
        }
      } catch (error) {
        console.error('Error fetching wishlist:', error);
      }
    };

    fetchWishlist();
  }, []);

  // Remove auth check
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const api = createAPI(); // No token needed for public access
        
        // Fetch category details
        const categoryResponse = await api.get(`/categories/${categoryId}`);
        if (categoryResponse.data.success) {
          setCategory(categoryResponse.data.data);
        }

        // Fetch products for this category
        const productsResponse = await api.get(`/products/category/${categoryId}`);
        if (productsResponse.data.success) {
          setOriginalProducts(productsResponse.data.data);
          setFilteredProducts(productsResponse.data.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [categoryId]);

  // Add sorting function
  const sortProducts = (products, sortType) => {
    const sorted = [...products];
    switch (sortType) {
      case 'price-low':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price-high':
        return sorted.sort((a, b) => b.price - a.price);
      case 'name-asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      default:
        return sorted;
    }
  };

  // Update useEffect for filtering and sorting
  useEffect(() => {
    let result = [...originalProducts];

    // Apply subcategory filter
    if (selectedSubcategories.length > 0) {
      result = result.filter(product => 
        product.subcategories?.some(sub => selectedSubcategories.includes(sub))
      );
    }

    // Apply search filter
    if (searchQuery) {
      result = result.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply price range filter
    result = result.filter(product => 
      product.price >= priceRange[0] && product.price <= priceRange[1]
    );

    // Apply sorting
    result = sortProducts(result, sortBy);

    setFilteredProducts(result);
  }, [selectedSubcategories, searchQuery, originalProducts, priceRange, sortBy]);

  // Group products by subcategory
  const productsBySubcategory = {};
  
  if (filteredProducts.length > 0) {
    if (selectedSubcategories.length === 0 && category?.subcategories) {
      // If no subcategories selected, organize products by all available subcategories
      category.subcategories.forEach(sub => {
        productsBySubcategory[sub] = filteredProducts.filter(product =>
          product.subcategories?.includes(sub)
        );
      });
    } else if (selectedSubcategories.length > 0) {
      // Show only products from selected subcategories
      selectedSubcategories.forEach(sub => {
        productsBySubcategory[sub] = filteredProducts.filter(product =>
          product.subcategories?.includes(sub)
        );
      });
    } else {
      // If no subcategories at all, show all products under "All Products"
      productsBySubcategory["All Products"] = filteredProducts;
    }
  }

  console.log('Products by subcategory:', productsBySubcategory); // Debug log

  // Define handleViewAllClick before using it
  const handleViewAllClick = (subcategory) => {
    // Get userId from localStorage or use an empty string if not available
    const userId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user'))._id : '';
    navigate(`/${userId}/categories/${categoryId}/subcategory/${encodeURIComponent(subcategory)}`);
  };

  // Define ProductSection after handleViewAllClick
  const ProductSection = ({ title, products, currentTheme }) => (
    <div className="mb-12 px-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-xl font-semibold ${
          currentTheme === 'dark' ? 'text-white' 
          : currentTheme === 'eyeCare' ? 'text-[#433422]'
          : 'text-gray-900'
        }`}>
          {title}
        </h2>
        
        <button
          onClick={() => handleViewAllClick(title)}
          className={`px-4 py-2 rounded-lg text-sm transition-all ${
            currentTheme === 'dark'
              ? 'bg-gray-800 hover:bg-gray-700 text-white'
              : currentTheme === 'eyeCare'
              ? 'bg-[#D5C4AB] hover:bg-[#C4B39A] text-[#433422]'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
          }`}
        >
          View All
        </button>
      </div>

      <div className="relative">
        <div className={`product-scroll overflow-x-auto pb-4 sm:pb-6 ${
          currentTheme === 'dark' ? 'dark-theme' 
          : currentTheme === 'eyeCare' ? 'eye-care-theme'
          : 'light-theme'
        }`}>
          <div className="flex gap-3 sm:gap-4 px-4">
            {products.map((product) => (
              <div 
                key={product._id} 
                className="w-[160px] flex-none sm:w-[180px] lg:w-[220px] max-w-[250px]"
              >
                <ProductCard 
                  product={product} 
                  currentTheme={currentTheme}
                  wishlistItems={wishlistItems}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Add auth check for wishlist/cart actions
  const handleAddToCart = async (product) => {
    if (!isAuthenticated) {
      toast.error('Please login to add to cart');
      return;
    }
    // ... rest of cart logic
  };

  const handleWishlistToggle = async (product) => {
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist');
      return;
    }
    // ... rest of wishlist logic
  };

  // Add the modal styles to the document head
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = modalStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Add this to ensure modals appear on top of everything
  useEffect(() => {
    // Add a style tag to ensure modals are on top
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
      .modal-overlay {
        position: fixed !important;
        z-index: 10000 !important;
      }
      
      /* When modal is open, reduce z-index of other elements */
      body.modal-open .sticky {
        z-index: 10 !important;
      }
    `;
    document.head.appendChild(styleTag);
    
    return () => {
      document.head.removeChild(styleTag);
    };
  }, []);

  // Add effect to handle body class when modal is open
  useEffect(() => {
    const handleModalState = () => {
      // Check if any modal is open in the component
      const isAnyModalOpen = document.querySelector('.modal-overlay') !== null;
      
      if (isAnyModalOpen) {
        document.body.classList.add('modal-open');
      } else {
        document.body.classList.remove('modal-open');
      }
    };
    
    // Run initially and set up a mutation observer to detect modal changes
    handleModalState();
    
    const observer = new MutationObserver(handleModalState);
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => {
      observer.disconnect();
      document.body.classList.remove('modal-open');
    };
  }, []);

  if (loading) {
    return <SkeletonLoader />;
  }

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />
      <div className={`min-h-screen ${
        currentTheme === 'dark' ? 'bg-gray-900 text-white' 
        : currentTheme === 'eyeCare' ? 'bg-[#F5E6D3] text-[#433422]'
        : 'bg-gray-50 text-gray-900'
      }`}>
        {/* Modern Professional Header - Reduced z-index */}
        <div className={`w-full sticky top-0 z-20 ${
          currentTheme === 'dark' ? 'bg-gray-900/80' 
          : currentTheme === 'eyeCare' ? 'bg-[#F5E6D3]/80'
          : 'bg-white/80'
        } backdrop-blur-md border-b ${
          currentTheme === 'dark' ? 'border-gray-800' 
          : currentTheme === 'eyeCare' ? 'border-[#E6D5BC]'
          : 'border-gray-100'
        }`}>
          <div className="max-w-7xl mx-auto px-4">
            <div className="py-4">
              {/* Navigation Path */}
              <div className="flex items-center gap-3 text-sm mb-1">
                <Link 
                  to={`/categories`}
                  className={`hover:text-blue-500 transition-colors flex items-center gap-2 ${
                    currentTheme === 'dark' ? 'text-gray-400 hover:text-white' 
                    : currentTheme === 'eyeCare' ? 'text-[#433422]/70 hover:text-[#433422]'
                    : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <span>Categories</span>
                </Link>
                <svg className="w-3 h-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className={`font-medium ${
                  currentTheme === 'dark' ? 'text-white' 
                  : currentTheme === 'eyeCare' ? 'text-[#433422]'
                  : 'text-gray-900'
                }`}>
                  {category?.name || 'Category'}
                </span>
              </div>

              {/* Category Info */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className={`text-2xl font-semibold ${
                    currentTheme === 'dark' ? 'text-white' 
                    : currentTheme === 'eyeCare' ? 'text-[#433422]'
                    : 'text-gray-900'
                  }`}>
                    {category?.name || 'Category'}
                  </h1>
                  <p className={`mt-1 text-sm ${
                    currentTheme === 'dark' ? 'text-gray-400' 
                    : currentTheme === 'eyeCare' ? 'text-[#433422]/70'
                    : 'text-gray-500'
                  }`}>
                    {category?.description || 'No description available'}
                  </p>
                </div>

                {/* Stats */}
                <div className="hidden sm:flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${
                      currentTheme === 'dark' ? 'text-gray-400' 
                      : currentTheme === 'eyeCare' ? 'text-[#433422]/70'
                      : 'text-gray-500'
                    }`}>
                      Products
                    </span>
                    <span className={`font-semibold ${
                      currentTheme === 'dark' ? 'text-white' 
                      : currentTheme === 'eyeCare' ? 'text-[#433422]'
                      : 'text-gray-900'
                    }`}>
                      {filteredProducts.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${
                      currentTheme === 'dark' ? 'text-gray-400' 
                      : currentTheme === 'eyeCare' ? 'text-[#433422]/70'
                      : 'text-gray-500'
                    }`}>
                      Subcategories
                    </span>
                    <span className={`font-semibold ${
                      currentTheme === 'dark' ? 'text-white' 
                      : currentTheme === 'eyeCare' ? 'text-[#433422]'
                      : 'text-gray-900'
                    }`}>
                      {category?.subcategories?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters - Reduced z-index */}
        <div className="max-w-7xl mx-auto px-4 pt-6 relative z-10">
          <div className="relative">
            <div className={`flex items-center gap-2 p-2 rounded-xl ${
              currentTheme === 'dark' ? 'bg-gray-800/50' 
              : currentTheme === 'eyeCare' ? 'bg-[#E6D5BC]/50'
              : 'bg-white/50'
            } backdrop-blur-sm shadow-sm mb-4`}>
              <RiSearchLine className="text-gray-400 w-5 h-5 ml-2" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full outline-none border-none bg-transparent`}
              />
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`p-2 rounded-lg transition-colors ${
                  isFilterOpen ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
                }`}
              >
                <RiFilterLine className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Panel - Adjusted z-index */}
            {isFilterOpen && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`absolute z-30 mt-2 w-full rounded-xl p-4 shadow-lg ${
                  currentTheme === 'dark' ? 'bg-gray-800' 
                  : currentTheme === 'eyeCare' ? 'bg-[#E6D5BC]'
                  : 'bg-white'
                }`}
              >
                {/* Price Range Section */}
                <div className="mb-6">
                  <h3 className="font-medium mb-3">Price Range (Rs)</h3>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1">
                      <input
                        type="number"
                        min="0"
                        max={priceRange[1]}
                        value={priceRange[0]}
                        onChange={(e) => {
                          const value = Math.max(0, parseInt(e.target.value) || 0);
                          setPriceRange([value, Math.max(value, priceRange[1])]);
                        }}
                        className={`w-full p-2 rounded-lg outline-none ${
                          currentTheme === 'dark' ? 'bg-gray-700' 
                          : currentTheme === 'eyeCare' ? 'bg-[#D5C4AB]'
                          : 'bg-gray-100'
                        }`}
                        placeholder="Min Price"
                      />
                    </div>
                    <span>to</span>
                    <div className="flex-1">
                      <input
                        type="number"
                        min={priceRange[0]}
                        max="100000"
                        value={priceRange[1]}
                        onChange={(e) => {
                          const value = Math.min(100000, parseInt(e.target.value) || 0);
                          setPriceRange([Math.min(priceRange[0], value), value]);
                        }}
                        className={`w-full p-2 rounded-lg outline-none ${
                          currentTheme === 'dark' ? 'bg-gray-700' 
                          : currentTheme === 'eyeCare' ? 'bg-[#D5C4AB]'
                          : 'bg-gray-100'
                        }`}
                        placeholder="Max Price"
                      />
                    </div>
                  </div>
                  <style>
                    {`
                      input[type="range"] {
                        -webkit-appearance: none;
                        width: 100%;
                        height: 4px;
                        margin: 10px 0;
                        background: #ddd;
                        border-radius: 5px;
                        outline: none;
                        opacity: 0.7;
                        -webkit-transition: .2s;
                        transition: opacity .2s;
                        background: linear-gradient(to right,
                          #ddd 0%,
                          #000 0%,
                          #000 100%,
                          #ddd 100%
                        );
                        position: relative;
                        top: 50%;
                        transform: translateY(-50%);
                      }

                      input[type="range"]::-webkit-slider-thumb {
                        -webkit-appearance: none;
                        appearance: none;
                        width: 16px;
                        height: 16px;
                        background: #000;
                        border-radius: 50%;
                        cursor: pointer;
                        margin-top: -6px;
                      }

                      input[type="range"]::-moz-range-thumb {
                        width: 16px;
                        height: 16px;
                        background: #000;
                        border-radius: 50%;
                        cursor: pointer;
                        border: none;
                      }

                      input[type="range"]::-webkit-slider-runnable-track {
                        height: 4px;
                        background: transparent;
                      }

                      input[type="range"]::-moz-range-track {
                        height: 4px;
                        background: transparent;
                      }

                      input[type="range"]:hover {
                        opacity: 1;
                      }

                      .dark input[type="range"] {
                        background: linear-gradient(to right,
                          #4B5563 0%,
                          #fff 0%,
                          #fff 100%,
                          #4B5563 100%
                        );
                      }

                      .dark input[type="range"]::-webkit-slider-thumb {
                        background: #fff;
                      }

                      .dark input[type="range"]::-moz-range-thumb {
                        background: #fff;
                      }

                      .eyeCare input[type="range"] {
                        background: linear-gradient(to right,
                          #D5C4AB 0%,
                          #000 0%,
                          #000 100%,
                          #D5C4AB 100%
                        );
                      }
                    `}
                  </style>
                  <div className="mb-4 relative h-12">
                    <input
                      type="range"
                      min="0"
                      max="100000"
                      value={priceRange[0]}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setPriceRange([value, Math.max(value, priceRange[1])]);
                        // Update the background gradient
                        e.target.style.background = `linear-gradient(to right, 
                          #ddd 0%, 
                          #000 0%, 
                          #000 ${(value / 100000) * 100}%, 
                          #ddd ${(value / 100000) * 100}%
                        )`;
                      }}
                      className="w-full absolute top-1/2 -translate-y-1/2"
                    />
                    <input
                      type="range"
                      min="0"
                      max="100000"
                      value={priceRange[1]}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setPriceRange([Math.min(priceRange[0], value), value]);
                        // Update the background gradient
                        e.target.style.background = `linear-gradient(to right, 
                          #ddd 0%, 
                          #000 ${(priceRange[0] / 100000) * 100}%, 
                          #000 ${(value / 100000) * 100}%, 
                          #ddd ${(value / 100000) * 100}%
                        )`;
                      }}
                      className="w-full absolute top-1/2 -translate-y-1/2"
                    />
                  </div>
                </div>

                {/* Sort Options */}
                <div className="mb-6">
                  <h3 className="font-medium mb-3">Sort By</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'default', label: 'Default' },
                      { value: 'price-low', label: 'Price: Low to High' },
                      { value: 'price-high', label: 'Price: High to Low' },
                      { value: 'name-asc', label: 'Name: A to Z' },
                      { value: 'name-desc', label: 'Name: Z to A' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSortBy(option.value)}
                        className={`px-3 py-2 rounded-lg text-sm transition-all ${
                          sortBy === option.value
                            ? 'bg-black text-white'
                            : currentTheme === 'dark'
                            ? 'bg-gray-700 hover:bg-gray-600'
                            : currentTheme === 'eyeCare'
                            ? 'bg-[#D5C4AB] hover:bg-[#C4B39A]'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subcategories Section */}
                <div>
                  <h3 className="font-medium mb-3">Subcategories</h3>
                  <div className="flex flex-wrap gap-2">
                    {category?.subcategories?.map((sub, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedSubcategories(prev => 
                            prev.includes(sub)
                              ? prev.filter(s => s !== sub)
                              : [...prev, sub]
                          );
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                          selectedSubcategories.includes(sub)
                            ? 'bg-black text-white'
                            : currentTheme === 'dark'
                            ? 'bg-gray-700 hover:bg-gray-600'
                            : currentTheme === 'eyeCare'
                            ? 'bg-[#D5C4AB] hover:bg-[#C4B39A]'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {sub}
                        {selectedSubcategories.includes(sub) && (
                          <RiCheckLine className="inline-block ml-1 w-4 h-4" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Products Display - Base z-index */}
        <div className="max-w-[1920px] mx-auto py-8 relative z-0">
          {Object.keys(productsBySubcategory).length > 0 ? (
            Object.entries(productsBySubcategory).map(([subcategory, products]) => (
              products.length > 0 && (
                <ProductSection 
                  key={subcategory}
                  title={subcategory}
                  products={products}
                  currentTheme={currentTheme}
                />
              )
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-xl">No products available in this category</p>
              <p className="mt-2 text-gray-500">
                Category ID: {categoryId}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// Export ProductCard component so it can be used in SubcategoryView
export { ProductCard };

export default CategoryProducts;