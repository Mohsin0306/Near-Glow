import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { RiSearchLine, RiStarLine, RiFireLine, RiLeafLine, RiFilterLine, RiStarFill, RiHeartLine, RiHeartFill, RiShoppingCart2Line, RiCheckLine, RiMoneyDollarCircleLine, RiShoppingBag3Line } from 'react-icons/ri';
import { useTheme } from '../../context/ThemeContext';
import { createAPI, cartAPI } from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

const Products = ({ selectedCategories, setSelectedCategories }) => {
  const { currentTheme } = useTheme();
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const isProductPage = true;

  const token = localStorage.getItem('authToken');
  const api = createAPI(token);

  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const response = await api.get('/products');
      
      if (response.data.success) {
        // Transform products from each category
        const transformProduct = (p) => ({
          id: p._id,
          title: p.name,
          description: p.description,
          price: parseFloat(p.price),
          image: p.media?.[0]?.url || 'https://via.placeholder.com/300x300?text=Product+Image',
          category: p.category?.name || 'Uncategorized',
          subcategories: Array.isArray(p.subcategories) 
            ? p.subcategories
            : [],
          rating: { 
            rate: p.averageRating || 0, 
            count: p.ratings?.length || 0 
          },
          stock: parseInt(p.stock) || 0,
          brand: p.brand,
          createdAt: new Date(p.createdAt),
          seller: p.seller,
          status: p.status,
          media: p.media || [],
          specifications: p.specifications || [],
          features: p.features || [],
          orderCount: p.orderCount || 0,
          viewCount: p.viewCount || 0,
          lastViewedAt: p.lastViewedAt ? new Date(p.lastViewedAt) : null,
          trendingScore: p.trendingScore || 0
        });

        // Transform all products from different sections
        const allProducts = [
          ...(response.data.data.topSales || []).map(transformProduct),
          ...(response.data.data.trending || []).map(transformProduct),
          ...(response.data.data.newArrivals || []).map(transformProduct)
        ];

        // Remove duplicates based on id
        const uniqueProducts = Array.from(
          new Map(allProducts.map(item => [item.id, item])).values()
        );

        setProducts(uniqueProducts);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products based on search query and selected categories
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!selectedCategories?.length) return matchesSearch;

      const matchesCategory = selectedCategories.some(selectedCat => {
        if (selectedCat.type === 'main') {
          return product.category.toLowerCase() === selectedCat.name.toLowerCase();
        } else {
          return product.subcategories?.some(sub => {
            const cleanSub = typeof sub === 'string' 
              ? sub.replace(/[\[\]"\\]/g, '').trim().toLowerCase()
              : '';
            return cleanSub === selectedCat.name.toLowerCase();
          });
        }
      });
      
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategories]);

  // Filter products within each collection based on categories
  const filterProductsByCategories = (productsToFilter) => {
    if (!selectedCategories?.length) return productsToFilter;

    return productsToFilter.filter(product => {
      return selectedCategories.some(selectedCat => {
        if (selectedCat.type === 'main') {
          return product.category?.toLowerCase() === selectedCat.name.toLowerCase();
        } else {
          return product.subcategories?.some(sub => {
            const cleanSub = typeof sub === 'string' 
              ? sub.replace(/[\[\]"\\]/g, '').trim().toLowerCase()
              : '';
            return cleanSub === selectedCat.name.toLowerCase();
          });
        }
      });
    });
  };

  // Update collections to use proper filtering logic
  const collections = useMemo(() => {
    const collections = [];

    // Top Sales - show products with orders (modified logic)
    const topSalesUnfiltered = products.filter(p => 
      p.status === 'published' && 
      p.stock > 0 &&
      (p.orderCount >= 5 || p.orderCount > 0)
    ).sort((a, b) => b.orderCount - a.orderCount);

    const topSales = filterProductsByCategories(topSalesUnfiltered);

    // Always show Top Sales section if there are any filtered products
    if (topSales.length > 0) {
      collections.push({
        id: 'top-sales',
        name: 'Top Sales',
        icon: <RiMoneyDollarCircleLine className="text-green-500" size={20} />,
        products: topSales
      });
    }

    // Trending - show viewed products that aren't in top sales
    const trendingUnfiltered = products.filter(p => 
      p.status === 'published' && 
      p.stock > 0 && 
      p.viewCount > 0 &&
      !topSales.find(t => t.id === p.id)
    ).sort((a, b) => {
      if (a.trendingScore && b.trendingScore) {
        return b.trendingScore - a.trendingScore;
      }
      return b.viewCount - a.viewCount;
    });

    const trending = filterProductsByCategories(trendingUnfiltered);

    if (trending.length > 0) {
      collections.push({
        id: 'trending',
        name: 'Trending Now',
        icon: <RiFireLine className="text-red-500" size={20} />,
        products: trending
      });
    }

    // New Arrivals - show all products from last month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const newArrivalsUnfiltered = products.filter(p => 
      p.status === 'published' && 
      p.stock > 0 && 
      new Date(p.createdAt) > oneMonthAgo &&
      !topSales.find(t => t.id === p.id) &&
      !trending.find(t => t.id === p.id)
    ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const newArrivals = filterProductsByCategories(newArrivalsUnfiltered);

    if (newArrivals.length > 0) {
      collections.push({
        id: 'new',
        name: 'New Arrivals',
        icon: <RiLeafLine className="text-green-500" size={20} />,
        products: newArrivals
      });
    }

    return collections;
  }, [products, selectedCategories]);

  // Add this to help debug
  useEffect(() => {
    console.log('Selected Categories:', selectedCategories);
    console.log('Filtered Collections:', collections);
  }, [selectedCategories, collections]);

  // Add scrollbar styles
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
          height: 12px;
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
      }
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

  // Product Card Component with smaller size
  const ProductCard = ({ product, currentTheme, wishlistItems }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [isAdded, setIsAdded] = useState(false);
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);

    useEffect(() => {
      // Only check wishlist if user is logged in
      if (user && wishlistItems) {
        setIsInWishlist(wishlistItems?.some(item => item._id === product.id));
      }
    }, [wishlistItems, product.id, user]);

    const handleProductClick = (e) => {
      // Don't navigate if clicking wishlist/cart buttons
      if (e.target.closest('button')) {
        e.stopPropagation();
        return;
      }
      
      // Navigate to the public product route
      navigate(`/products/${product.id}`);
    };

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
        
        const response = await fetch('http://192.168.100.17:5000/api/wishlist/add', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            productId: product.id
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

    const handleAddToCart = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (product.stock <= 0) {
        toast.error('Product is out of stock');
        return;
      }

      if (!user) {
        toast.error('Please login to add to cart');
        return;
      }

      try {
        setIsAddingToCart(true);
        const token = localStorage.getItem('authToken');
        
        const response = await cartAPI.addToCart(product.id, token);
        
        if (response.data.success) {
          setIsAdded(true);
          toast.success('Added to cart');
          setTimeout(() => setIsAdded(false), 2000);
        }
      } catch (error) {
        console.error('Error adding to cart:', error);
        toast.error('Failed to add to cart');
      } finally {
        setIsAddingToCart(false);
      }
    };

    return (
      <div 
        onClick={handleProductClick}
        className={`w-44 rounded-xl overflow-hidden shadow-lg transition-all duration-300 cursor-pointer ${
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
          {/* Wishlist and Cart buttons */}
          <div className="absolute top-2 right-2 flex gap-1.5">
            <button 
              className={`p-1.5 rounded-full shadow-lg transform transition-all duration-300 
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
                  className={`w-3.5 h-3.5 transition-colors duration-300
                    ${currentTheme === 'eyeCare' ? 'text-[#433422]' : 'text-white'}`}
                />
              ) : (
                <RiHeartLine 
                  className={`w-3.5 h-3.5 transition-colors duration-300
                    ${isAddingToWishlist ? 'animate-pulse' : ''}`}
                />
              )}
            </button>

            <button 
              className={`p-1.5 rounded-full shadow-lg transform transition-all duration-300 
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
                  className={`w-3.5 h-3.5 transition-colors duration-300
                    ${currentTheme === 'eyeCare' ? 'text-[#433422]' : 'text-white'}`}
                />
              ) : (
                <RiShoppingCart2Line 
                  className={`w-3.5 h-3.5 transition-colors duration-300
                    ${isAddingToCart ? 'animate-pulse' : ''}`}
                />
              )}
            </button>
          </div>
          {product.stock <= 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white text-xs font-medium px-2 py-0.5 rounded-full bg-red-500">
                Out
              </span>
            </div>
          )}
          {product.status === 'draft' && (
            <div className="absolute top-2 left-2">
              <span className="text-white text-xs font-medium px-2 py-0.5 rounded-full bg-gray-500">
                Draft
              </span>
            </div>
          )}
        </div>
        <div className="p-2">
          <div className="h-5 mb-0.5">
            <h3 className="text-xs font-semibold truncate" title={product.title}>
              {product.title}
            </h3>
          </div>
          <div className="flex items-center justify-between mb-0.5">
            <p className="text-sm font-bold">Rs {product.price.toLocaleString('en-PK')}</p>
            {product.rating.count > 0 && (
              <div className="flex items-center gap-1">
                <RiStarFill className="text-yellow-400" size={12} />
                <span className="text-xs opacity-60">{product.rating.rate.toFixed(1)}</span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] ${
              product.stock > 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {product.stock > 0 ? `${product.stock} in stock` : 'Out'}
            </span>
            <span className="text-[10px] opacity-60">{product.category}</span>
          </div>
        </div>
      </div>
    );
  };

  // Product Section Component with smaller gap
  const ProductSection = ({ section }) => {
    const { currentTheme } = useTheme();
    const { user } = useAuth();
    const [wishlistItems, setWishlistItems] = useState([]);

    // Only fetch wishlist if user is logged in
    useEffect(() => {
      const fetchWishlist = async () => {
        if (!user) return;

        try {
          const token = localStorage.getItem('authToken');
          const response = await fetch('http://192.168.100.17:5000/api/wishlist', {
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
    }, [user]);

    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          {section.icon}
          <h2 className="text-xl font-semibold">{section.name}</h2>
          <span className="text-sm opacity-60">({section.products.length} items)</span>
        </div>
        <div className="relative">
          <div className={`product-scroll overflow-x-auto pb-4 ${
            currentTheme === 'dark' ? 'dark-theme' 
            : currentTheme === 'eyeCare' ? 'eye-care-theme'
            : 'light-theme'
          }`}>
            <div className="flex gap-3 min-w-full">
              {section.products.map(product => (
                <div key={product.id} className="flex-shrink-0">
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
  };

  // Search and filter modal
  const SearchFilterModal = () => (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className={`fixed inset-x-0 bottom-0 p-4 rounded-t-3xl shadow-xl z-50 ${
        currentTheme === 'dark' ? 'bg-gray-800' 
        : currentTheme === 'eyeCare' ? 'bg-[#E6D5BC]'
        : 'bg-white'
      }`}
    >
      <div className="space-y-4">
        <div className={`flex items-center gap-3 p-3 rounded-xl ${
          currentTheme === 'dark' ? 'bg-gray-700' 
          : currentTheme === 'eyeCare' ? 'bg-[#D4C3AA]'
          : 'bg-gray-100'
        }`}>
          <RiSearchLine size={20} />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent outline-none"
          />
          <RiFilterLine 
            size={20} 
            className={`${searchQuery ? 'opacity-0' : 'opacity-100'}`}
          />
        </div>

        {/* Add your filter options here */}
        <div className="space-y-2">
          {/* Filter options will go here */}
        </div>
      </div>
    </motion.div>
  );

  // Loading Skeleton Component
  const ProductSkeleton = () => (
    <div className={`min-w-[160px] sm:min-w-[200px] rounded-xl overflow-hidden animate-pulse ${
      currentTheme === 'dark' 
        ? 'bg-gray-800' 
        : currentTheme === 'eyeCare'
        ? 'bg-[#E6D5BC]'
        : 'bg-white'
    }`}>
      <div className={`h-36 ${
        currentTheme === 'dark' 
          ? 'bg-gray-700' 
          : currentTheme === 'eyeCare'
          ? 'bg-[#D4C3AA]'
          : 'bg-gray-100'
      }`} />
      <div className="p-3 space-y-2">
        <div className={`h-4 rounded ${
          currentTheme === 'dark' 
            ? 'bg-gray-700' 
            : currentTheme === 'eyeCare'
            ? 'bg-[#D4C3AA]'
            : 'bg-gray-100'
        }`} />
        <div className={`h-3 w-2/3 rounded ${
          currentTheme === 'dark' 
            ? 'bg-gray-700' 
            : currentTheme === 'eyeCare'
            ? 'bg-[#D4C3AA]'
            : 'bg-gray-100'
        }`} />
        <div className="flex justify-between items-center pt-2">
          <div className={`h-4 w-1/3 rounded ${
            currentTheme === 'dark' 
              ? 'bg-gray-700' 
              : currentTheme === 'eyeCare'
              ? 'bg-[#D4C3AA]'
              : 'bg-gray-100'
          }`} />
          <div className={`h-8 w-8 rounded-full ${
            currentTheme === 'dark' 
              ? 'bg-gray-700' 
              : currentTheme === 'eyeCare'
              ? 'bg-[#D4C3AA]'
              : 'bg-gray-100'
          }`} />
        </div>
      </div>
    </div>
  );

  // Loading Section Component
  const LoadingSection = () => (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <div className={`h-5 w-5 rounded ${
          currentTheme === 'dark' 
            ? 'bg-gray-800' 
            : currentTheme === 'eyeCare'
            ? 'bg-[#E6D5BC]'
            : 'bg-gray-200'
        }`} />
        <div className={`h-6 w-32 rounded ${
          currentTheme === 'dark' 
            ? 'bg-gray-800' 
            : currentTheme === 'eyeCare'
            ? 'bg-[#E6D5BC]'
            : 'bg-gray-200'
        }`} />
      </div>
      <div className="flex gap-4 overflow-x-hidden">
        {[1, 2, 3, 4].map((i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    </div>
  );

  // Add style tag to head
  const styleSheet = document.createElement("style");
  styleSheet.innerText = scrollbarStyles;
  document.head.appendChild(styleSheet);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  if (productsLoading) {
    return (
      <div className={`p-4 sm:p-6 ${
        currentTheme === 'dark' ? 'bg-gray-900 text-white' 
        : currentTheme === 'eyeCare' ? 'bg-[#F5E6D3] text-[#433422]'
        : 'bg-gray-50 text-gray-900'
      }`}>
        <div className="max-w-7xl mx-auto">
          {[1, 2, 3].map((i) => (
            <LoadingSection key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${
      currentTheme === 'dark' ? 'bg-gray-900 text-white' 
      : currentTheme === 'eyeCare' ? 'bg-[#F5E6D3] text-[#433422]'
      : 'bg-gray-50 text-gray-900'
    }`}>
      <div dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {collections.map(section => (
          <ProductSection key={section.id} section={section} />
        ))}
      </div>
    </div>
  );
};

export default Products; 