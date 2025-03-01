import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import {
  RiHeartLine,
  RiSearchLine,
  RiFilterLine,
  RiShoppingCartLine,
  RiDeleteBinLine,
  RiPriceTag3Line,
  RiStarLine,
  RiHeartFill,
  RiInboxUnarchiveLine,
  RiCloseLine,
  RiAlertLine,
  RiCheckLine,
  RiSparklingLine,
  RiLeafLine,
  RiLoader4Line,
  RiTimeLine,
  RiHistoryLine,
  RiArrowUpLine,
  RiArrowDownLine
} from 'react-icons/ri';
import { createAPI } from '../../utils/api';
import {useAuth} from '../../context/AuthContext'
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { cartAPI } from '../../utils/api';

const DeleteModal = ({ isOpen, onClose, onConfirm, itemName, styles }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={`${styles.card} rounded-2xl p-6 max-w-md w-full shadow-xl`}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-start mb-4">
            <div className={`p-3 rounded-full ${styles.border} mr-4`}>
              <RiAlertLine className="w-6 h-6 text-red-500" />
            </div>
            <div className="flex-1">
              <h3 className={`text-lg font-semibold ${styles.text}`}>
                Remove from Wishlist
              </h3>
              <p className={`mt-1 text-sm ${styles.text} opacity-75`}>
                Are you sure you want to remove "{itemName}" from your wishlist?
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-4 py-2 rounded-lg ${styles.border} text-sm font-medium
                ${styles.text} hover:opacity-80`}
              onClick={onClose}
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium
                hover:bg-red-600"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onConfirm();
              }}
            >
              Remove
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const ClearModal = ({ isOpen, onClose, onConfirm, styles }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={`${styles.card} rounded-2xl p-6 max-w-md w-full shadow-xl`}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-start mb-4">
            <div className={`p-3 rounded-full ${styles.border} mr-4`}>
              <RiAlertLine className="w-6 h-6 text-red-500" />
            </div>
            <div className="flex-1">
              <h3 className={`text-lg font-semibold ${styles.text}`}>
                Clear Wishlist
              </h3>
              <p className={`mt-1 text-sm ${styles.text} opacity-75`}>
                Are you sure you want to clear your entire wishlist? This action cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-4 py-2 rounded-lg ${styles.border} text-sm font-medium
                ${styles.text} hover:opacity-80`}
              onClick={onClose}
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium
                hover:bg-red-600"
              onClick={onConfirm}
            >
              Clear All
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const Wishlist = () => {
  const { currentTheme } = useTheme();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'highPrice', 'lowPrice'
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null });
  const [cartAnimation, setCartAnimation] = useState({ active: false, itemId: null });
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedMainCategory, setSelectedMainCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const api = createAPI(localStorage.getItem('authToken'));

  const getThemeStyles = () => ({
    background: currentTheme === 'dark' ? 'bg-gray-900' 
      : currentTheme === 'eyeCare' ? 'bg-[#F5E6D3]' 
      : 'bg-gray-50',
    text: currentTheme === 'dark' ? 'text-white' 
      : currentTheme === 'eyeCare' ? 'text-[#433422]' 
      : 'text-gray-900',
    card: currentTheme === 'dark' ? 'bg-gray-800' 
      : currentTheme === 'eyeCare' ? 'bg-[#E6D5BC]' 
      : 'bg-white',
    border: currentTheme === 'dark' ? 'border-gray-700' 
      : currentTheme === 'eyeCare' ? 'border-[#D4C3AA]' 
      : 'border-gray-200',
    button: currentTheme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' 
      : currentTheme === 'eyeCare' ? 'bg-[#C1A173] hover:bg-[#B39164]' 
      : 'bg-white hover:bg-gray-50',
  });

  const styles = getThemeStyles();

  // Add this helper function to truncate description
  const truncateText = (text, maxLength = 60) => {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength).trim() + '...';
  };

  // Update the fetchWishlistItems function to include createdAt
  const fetchWishlistItems = async () => {
    try {
      setLoading(true);
      const response = await api.get('/wishlist');
      
      if (response.data.success && response.data.data?.products) {
        const transformedItems = response.data.data.products.map(product => ({
          id: product._id,
          name: product.name,
          description: product.description,
          price: parseFloat(product.price),
          image: product.media?.[0]?.url || 'https://via.placeholder.com/300x300',
          brand: product.brand,
          stock: parseInt(product.stock) || 0,
          status: product.status,
          media: product.media || [],
          createdAt: product.createdAt || response.data.data.createdAt // fallback to wishlist creation date
        }));
        
        setWishlistItems(transformedItems);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      toast.error('Failed to load wishlist items');
      setWishlistItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories and subcategories
  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      if (response.data.success) {
        // Filter main categories
        const mainCategories = response.data.data.filter(cat => !cat.parent);
        setCategories(mainCategories.map(category => ({
          id: category._id,
          name: category.name,
          icon: getCategoryIcon(category.name),
          type: 'main'
        })));

        // Store all subcategories
        const subCats = response.data.data.filter(cat => cat.parent);
        setSubCategories(subCats.map(category => ({
          id: category._id,
          name: category.name,
          parentId: category.parent,
          icon: getCategoryIcon(category.name),
          type: 'sub'
        })));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  };

  // Get icon based on category name
  const getCategoryIcon = (categoryName) => {
    const name = categoryName.toLowerCase();
    if (name.includes('perfume')) return <RiSparklingLine size={18} />;
    if (name.includes('natural')) return <RiLeafLine size={18} />;
    return <RiSparklingLine size={18} />; // default icon
  };

  // Get filtered subcategories based on selected main category
  const getFilteredSubCategories = () => {
    if (!selectedMainCategory) return [];
    return subCategories.filter(sub => sub.parentId === selectedMainCategory.id);
  };

  // Handle category selection
  const handleCategoryChange = (category) => {
    if (category?.type === 'main') {
      setSelectedMainCategory(category);
      setSelectedSubCategory(null);
    } else if (category?.type === 'sub') {
      setSelectedSubCategory(category);
    } else {
      setSelectedMainCategory(null);
      setSelectedSubCategory(null);
    }
  };

  useEffect(() => {
    fetchWishlistItems();
    fetchCategories();
  }, []);

  // Update the delete handler function
  const handleDelete = async (itemId) => {
    try {
      const token = localStorage.getItem('authToken');
      const api = createAPI(token);
      const response = await api.delete(`/wishlist/remove/${itemId}`);
      
      if (response.data.success) {
        // Update local state instead of reloading
        setWishlistItems(prevItems => 
          prevItems.filter(item => item.id !== itemId)
        );
        
        setDeleteModal({ open: false, item: null });
        
        toast.custom((t) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`${styles.card} ${styles.border} p-4 rounded-lg shadow-lg flex items-center gap-3`}
          >
            <div className={`p-2 rounded-full bg-green-500/10`}>
              <RiCheckLine className="w-4 h-4 text-green-500" />
            </div>
            <p className={styles.text}>Item removed from wishlist!</p>
          </motion.div>
        ));
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Failed to remove from wishlist');
    }
  };

  // Add to cart with animation
  const addToCart = async (e, itemId) => {
    e.stopPropagation(); // Prevent card click event
    try {
      setCartAnimation({ active: true, itemId });
      const token = localStorage.getItem('authToken');
      const response = await cartAPI.addToCart(itemId, token);
      
      if (response.data.success) {
        toast.custom((t) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`${styles.card} ${styles.border} p-4 rounded-lg shadow-lg flex items-center gap-3`}
          >
            <div className={`p-2 rounded-full bg-green-500/10`}>
              <RiCheckLine className="w-4 h-4 text-green-500" />
            </div>
            <p className={styles.text}>Added to cart successfully!</p>
          </motion.div>
        ));
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    } finally {
      setTimeout(() => {
        setCartAnimation({ active: false, itemId: null });
      }, 1000);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirmation = () => {
    if (deleteModal.item) {
      handleDelete(deleteModal.item.id);
    }
  };

  // Update the delete button click handler
  const handleDeleteClick = (e, item) => {
    e.stopPropagation(); // Prevent card click event
    setDeleteModal({ open: true, item });
  };

  const getTextColor = (type = 'primary') => {
    switch(type) {
      case 'primary':
        return currentTheme === 'dark' ? 'text-gray-100' : 'text-gray-900';
      case 'secondary':
        return currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700';
      case 'tertiary':
        return currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500';
      default:
        return currentTheme === 'dark' ? 'text-gray-100' : 'text-gray-900';
    }
  };

  // Update the sorting function
  const getSortedAndFilteredItems = () => {
    let filtered = wishlistItems.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'highPrice':
          return b.price - a.price;
        case 'lowPrice':
          return a.price - b.price;
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  };

  const handleCardClick = (itemId) => {
    navigate(`/${user._id}/products/${itemId}`);
  };

  // Add clear wishlist function
  const handleClearWishlist = async () => {
    try {
      const response = await api.delete('/wishlist/clear');
      
      if (response.data.success) {
        setWishlistItems([]);
        setShowClearModal(false);
        
        toast.custom((t) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`${styles.card} ${styles.border} p-4 rounded-lg shadow-lg flex items-center gap-3`}
          >
            <div className={`p-2 rounded-full bg-green-500/10`}>
              <RiCheckLine className="w-4 h-4 text-green-500" />
            </div>
            <p className={styles.text}>Wishlist cleared successfully!</p>
          </motion.div>
        ));
      }
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      toast.error('Failed to clear wishlist');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen p-3 md:p-6 ${styles.background} overflow-x-hidden`}
    >
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        {/* Title and Clear All button */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${styles.card} ${styles.border} shadow-sm`}>
              <RiHeartLine className={`w-5 h-5 ${getTextColor('primary')}`} />
            </div>
            <div>
              <h1 className={`text-xl md:text-2xl font-bold ${getTextColor('primary')}`}>
                My Wishlist
              </h1>
              <p className={`text-xs md:text-sm ${getTextColor('tertiary')}`}>
                Keep track of items you want to purchase later
              </p>
            </div>
          </div>
          
          {/* Clear All Button */}
          {wishlistItems.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowClearModal(true)}
              className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl 
                ${styles.button} ${styles.border} text-sm font-medium 
                hover:bg-red-500/10 transition-colors duration-200`}
            >
              <RiDeleteBinLine className={`w-4 h-4 ${getTextColor('primary')}`} />
              <span className={getTextColor('primary')}>Clear All</span>
            </motion.button>
          )}
        </div>

        {/* Mobile Clear All Button */}
        {wishlistItems.length > 0 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowClearModal(true)}
            className={`sm:hidden flex items-center justify-center gap-2 w-full px-4 py-2.5 mb-3 
              rounded-xl ${styles.button} ${styles.border} text-sm font-medium 
              hover:bg-red-500/10 transition-colors duration-200`}
          >
            <RiDeleteBinLine className={`w-4 h-4 ${getTextColor('primary')}`} />
            <span className={getTextColor('primary')}>Clear Wishlist</span>
          </motion.button>
        )}

        {/* Search and Filter */}
        <div className="space-y-3">
          <div className="flex gap-2 w-full">
            <div className="relative flex-1">
              <RiSearchLine className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${getTextColor('tertiary')}`} />
              <input
                type="text"
                placeholder="Search wishlist..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 text-sm rounded-xl border ${styles.border} ${styles.card}
                  focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${getTextColor('primary')}`}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2 rounded-xl border ${styles.border} ${styles.button}
                flex items-center justify-center gap-1.5 min-w-[90px]`}
            >
              <RiFilterLine className={`w-4 h-4 ${getTextColor('primary')}`} />
              <span className={`text-sm ${getTextColor('primary')}`}>Filter</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`w-full rounded-xl border ${styles.border} ${styles.card} overflow-hidden mb-4`}
          >
            <div className="p-3">
              <div className="flex flex-wrap gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSortBy('newest')}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors duration-200 flex items-center gap-1.5
                    ${sortBy === 'newest' 
                      ? 'bg-blue-500 text-white' 
                      : `${styles.button} border ${styles.border} ${getTextColor('secondary')}`
                    }`}
                >
                  <RiTimeLine className="w-4 h-4" />
                  <span>Newest First</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSortBy('oldest')}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors duration-200 flex items-center gap-1.5
                    ${sortBy === 'oldest' 
                      ? 'bg-blue-500 text-white' 
                      : `${styles.button} border ${styles.border} ${getTextColor('secondary')}`
                    }`}
                >
                  <RiHistoryLine className="w-4 h-4" />
                  <span>Oldest First</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSortBy('highPrice')}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors duration-200 flex items-center gap-1.5
                    ${sortBy === 'highPrice' 
                      ? 'bg-blue-500 text-white' 
                      : `${styles.button} border ${styles.border} ${getTextColor('secondary')}`
                    }`}
                >
                  <RiArrowUpLine className="w-4 h-4" />
                  <span>Price: High to Low</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSortBy('lowPrice')}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors duration-200 flex items-center gap-1.5
                    ${sortBy === 'lowPrice' 
                      ? 'bg-blue-500 text-white' 
                      : `${styles.button} border ${styles.border} ${getTextColor('secondary')}`
                    }`}
                >
                  <RiArrowDownLine className="w-4 h-4" />
                  <span>Price: Low to High</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wishlist Content */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <RiLoader4Line className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : wishlistItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <RiHeartLine className={`w-16 h-16 mb-4 ${getTextColor('tertiary')}`} />
          <h3 className={`text-lg font-semibold mb-2 ${getTextColor('primary')}`}>
            Your wishlist is empty
          </h3>
          <p className={`${getTextColor('tertiary')}`}>
            Start adding items you'd like to purchase later
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {getSortedAndFilteredItems().map(item => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onClick={() => handleCardClick(item.id)}
              className={`${styles.card} rounded-xl overflow-hidden border ${styles.border} cursor-pointer`}
            >
              {/* Cart Animation Overlay */}
              <AnimatePresence>
                {cartAnimation.active && cartAnimation.itemId === item.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.3 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.2 }}
                    className="absolute inset-0 z-10 flex items-center justify-center
                      bg-black/20 backdrop-blur-sm"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="p-3 rounded-full bg-white shadow-lg"
                    >
                      <RiShoppingCartLine className="w-6 h-6 text-green-500" />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative aspect-square">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x300';
                  }}
                />
              </div>
              <div className="p-4">
                <h3 className={`font-semibold mb-2 line-clamp-1 ${getTextColor('primary')}`}>
                  {item.name}
                </h3>
                <p className={`text-sm mb-3 line-clamp-2 ${getTextColor('secondary')}`}>
                  {truncateText(item.description)}
                </p>
                <div className="flex items-center justify-between">
                  <span className={`font-bold ${getTextColor('primary')}`}>
                    ₨ {item.price.toLocaleString('en-PK')}
                  </span>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => handleDeleteClick(e, item)}
                      className={`p-2 rounded-lg ${styles.button} ${styles.border}`}
                    >
                      <RiDeleteBinLine className="w-5 h-5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => addToCart(e, item.id)}
                      className={`p-2 rounded-lg ${styles.button} ${styles.border}`}
                      disabled={cartAnimation.active}
                    >
                      <RiShoppingCartLine className={`w-5 h-5 ${
                        cartAnimation.active && cartAnimation.itemId === item.id
                          ? 'animate-bounce'
                          : ''
                      }`} />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, item: null })}
        onConfirm={handleDeleteConfirmation}
        itemName={deleteModal.item?.name}
        styles={styles}
      />

      {/* Clear Modal */}
      <ClearModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleClearWishlist}
        styles={styles}
      />
    </motion.div>
  );
};

export default Wishlist; 