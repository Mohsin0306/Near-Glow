// frontend/src/components/seller-dashboard/Orders.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import {
  RiFileList3Line,
  RiSearchLine,
  RiSortAsc,
  RiCheckboxCircleLine,
  RiTimeLine,
  RiTruckLine,
  RiCloseLine,
  RiMoneyDollarCircleLine,
  RiCalendarEventLine,
  RiUserLine,
  RiMapPinLine,
  RiArrowRightLine,
  RiShoppingBag3Line,
  RiShoppingCartLine,
  RiCalendarLine,
  RiArrowDownSLine,
} from 'react-icons/ri';
import { orderAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Orders = () => {
  const { currentTheme } = useTheme();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Smoother animation variants
  const filterPanelVariants = {
    hidden: { 
      opacity: 0,
      height: 0,
      transition: {
        duration: 0.2,
        ease: "easeInOut"
      }
    },
    visible: { 
      opacity: 1,
      height: "auto",
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  };

  // Add sort options
  const sortOptions = [
    { value: 'date-desc', label: 'Newest First', icon: RiCalendarLine },
    { value: 'date-asc', label: 'Oldest First', icon: RiCalendarLine },
    { value: 'total-desc', label: 'Price: High to Low', icon: RiMoneyDollarCircleLine },
    { value: 'total-asc', label: 'Price: Low to High', icon: RiMoneyDollarCircleLine },
    { value: 'status', label: 'By Status', icon: RiFileList3Line },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getFirstProductImage = (order) => {
    try {
      // Check if order exists and has items
      if (!order?.items?.[0]?.product?.media) {
        return null;
      }

      // Get the first product's media array
      const media = order.items[0].product.media;
      
      // Find the first image type media
      const firstImage = media.find(m => m.type === 'image');
      
      return firstImage?.url || null;

    } catch (error) {
      console.error('Error getting product image:', error);
      return null;
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await orderAPI.getOrders(token);
        
        if (response.data.success) {
          // Transform the orders data to match component structure
          const transformedOrders = response.data.orders.map(order => ({
            _id: order._id,
            id: order.orderId,
            customer: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
            date: order.createdAt,
            total: order.totalAmount,
            finalAmount: order.finalAmount || order.totalAmount,
            referralDiscount: order.referralDiscount || 0,
            status: order.status,
            items: order.items.map(item => ({
              ...item,
              product: {
                ...item.product,
                imageUrl: item.product.media?.[0]?.url || null
              }
            }))
          }));

          setOrders(transformedOrders);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Format price in PKR
  const formatPrice = (price) => {
    return `Rs. ${Number(price).toLocaleString('en-PK')}`;
  };

  // Filter orders based on search
  const filteredOrders = orders.filter(order => {
    const orderIdMatch = order.id?.toLowerCase().includes(searchQuery.toLowerCase());
    const customerMatch = order.customer?.toLowerCase().includes(searchQuery.toLowerCase());
    return searchQuery === '' || orderIdMatch || customerMatch;
  });

  // Updated sort function
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    switch (sortBy) {
      case 'date-desc':
        return new Date(b.date) - new Date(a.date);
      case 'date-asc':
        return new Date(a.date) - new Date(b.date);
      case 'total-desc':
        return b.total - a.total;
      case 'total-asc':
        return a.total - b.total;
      case 'status':
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-500 bg-green-500/10';
      case 'pending':
        return 'text-yellow-500 bg-yellow-500/10';
      case 'processing':
        return 'text-blue-500 bg-blue-500/10';
      case 'cancelled':
        return 'text-red-500 bg-red-500/10';
      default:
        return 'text-gray-500 bg-gray-500/10';
    }
  };

  const handleViewDetails = (orderId) => {
    // Find the order to get its MongoDB _id
    const order = orders.find(o => o.id === orderId);
    if (order) {
      navigate(`/${user._id}/alerts/orders/${order._id}`);
    }
  };

  return (
    <div className={`min-h-screen p-3 md:p-6 lg:p-8 ${styles.background}`}>
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className={`text-xl md:text-2xl font-semibold ${
            currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Orders
          </h1>
          <div className={`px-3 py-1 rounded-lg ${
            currentTheme === 'dark' 
              ? 'bg-gray-800/60 text-gray-200' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            <span className="text-sm font-medium">{orders.length} orders</span>
          </div>
        </div>
        <p className={`text-sm ${
          currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        }`}>
          Manage and track your orders
        </p>
      </div>

      {/* Search and Sort Section */}
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 ${
              currentTheme === 'dark' 
                ? 'bg-gray-800/50 focus:bg-gray-800 text-white focus:ring-gray-700' 
                : 'bg-gray-50/50 focus:bg-white focus:ring-gray-200'
            }`}
          />
          <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>

        {/* Sort Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`py-2 px-3 rounded-lg flex items-center gap-2 transition-all duration-200 ${
              currentTheme === 'dark'
                ? 'bg-gray-800/50 hover:bg-gray-800 text-white'
                : 'bg-gray-50/50 hover:bg-gray-100 text-gray-700'
            }`}
          >
            <RiSortAsc className="w-5 h-5" />
            <span className="hidden md:inline text-sm">Sort by</span>
          </button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg border z-50 ${
                  currentTheme === 'dark'
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="py-1">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-sm flex items-center gap-2 ${
                        currentTheme === 'dark'
                          ? 'text-gray-200 hover:bg-gray-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      } ${sortBy === option.value ? 'font-medium' : ''}`}
                    >
                      <option.icon className="w-4 h-4" />
                      {option.label}
                      {sortBy === option.value && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="ml-auto"
                        >
                          <div className={`w-2 h-2 rounded-full ${
                            currentTheme === 'dark' ? 'bg-white' : 'bg-gray-900'
                          }`} />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-2">
        {loading ? (
          <div>Loading...</div>
        ) : sortedOrders.length === 0 ? (
          <div>No orders found</div>
        ) : (
          sortedOrders.map((order) => (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onClick={() => navigate(`/${user._id}/alerts/orders/${order._id}`)}
              className={`rounded-lg border cursor-pointer ${
                currentTheme === 'dark' 
                  ? 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-800' 
                  : currentTheme === 'eyeCare' 
                    ? 'bg-[#E6D5BC] border-[#D4C3AA]' 
                    : 'bg-white border-gray-100 hover:bg-gray-50'
              } transition-all duration-200 shadow-sm overflow-hidden`}
            >
              {/* Order Card Content */}
              <div className="p-2.5">
                {/* Order Header - ID and Status */}
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm sm:text-base font-medium ${currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
                      {order.id}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {new Date(order.date).toLocaleDateString()}
                    </span>
                  </div>
                  <span className={`px-2.5 py-1 text-xs sm:text-sm rounded-full ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>

                {/* Order Content - Product and Details */}
                <div className="flex gap-3">
                  {/* Product Image */}
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden flex-shrink-0">
                    {getFirstProductImage(order) ? (
                      <img
                        src={getFirstProductImage(order)}
                        alt="Product"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/placeholder.png';
                        }}
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${
                        currentTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                      }`}>
                        <RiShoppingBag3Line className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Order Details */}
                  <div className="flex-1 min-w-0 flex justify-between items-center">
                    <div>
                      <p className={`text-sm sm:text-base font-medium leading-snug ${
                        currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                      }`}>
                        {order.customer}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                    <div className="text-right">
                      {order.referralDiscount > 0 ? (
                        <>
                          <p className={`text-xs line-through text-gray-500`}>
                            {formatPrice(order.total)}
                          </p>
                          <p className={`text-sm sm:text-base font-medium ${
                            currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                          }`}>
                            {formatPrice(order.finalAmount)}
                          </p>
                        </>
                      ) : (
                        <p className={`text-sm sm:text-base font-medium ${
                          currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                        }`}>
                          {formatPrice(order.total)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default Orders;