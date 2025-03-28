import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { orderAPI } from '../../utils/api';
import {
  RiArrowLeftLine,
  RiTruckLine,
  RiMoneyDollarCircleLine,
  RiMapPinLine,
  RiUserLine,
  RiCalendarEventLine,
  RiShoppingBag3Line,
  RiCheckboxCircleLine,
  RiTimeLine,
  RiCloseLine,
  RiExternalLinkLine,
  RiImageLine,
  RiAlertLine,
} from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext';

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const [showCancelModal, setShowCancelModal] = useState(false);

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
    cancelButton: currentTheme === 'dark' ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' 
      : currentTheme === 'eyeCare' ? 'bg-red-500/10 text-red-600 hover:bg-red-500/20' 
      : 'bg-red-500/10 text-red-500 hover:bg-red-500/20',
  });

  const styles = getThemeStyles();

  const getProductImage = (item) => {
    try {
      // Check if item has __parentArray structure
      if (item?.__parentArray?.[0]?.product?.media) {
        const media = item.__parentArray[0].product.media;
        const firstImage = media.find(m => m.type === 'image');
        return firstImage?.url;
      }
      return null;
    } catch (error) {
      console.error('Error getting product image:', error);
      return null;
    }
  };

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await orderAPI.getOrderById(orderId, token);
        if (response.data.success) {
          console.log('Order Data:', response.data.order); // Debug log
          setOrder(response.data.order);
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const handleCancelOrder = async () => {
    try {
      setCancelling(true);
      const token = localStorage.getItem('authToken');
      const response = await orderAPI.cancelOrder(orderId, token);
      if (response.data.success) {
        // Only update the status instead of replacing the entire order
        setOrder(prev => ({
          ...prev,
          status: 'cancelled'
        }));
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
    } finally {
      setCancelling(false);
      setShowCancelModal(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-500 bg-green-500/10';
      case 'pending': return 'text-yellow-500 bg-yellow-500/10';
      case 'processing': return 'text-blue-500 bg-blue-500/10';
      case 'cancelled': return 'text-red-500 bg-red-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const handleImageError = (productId) => {
    setImageErrors(prev => ({
      ...prev,
      [productId]: true
    }));
  };

  // Add a helper function to format price in PKR
  const formatPrice = (price) => {
    return `Rs. ${price.toLocaleString('en-PK')}`;
  };

  const truncateText = (text, maxLength = 25) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  const calculateItemTotal = (item) => {
    return (item.price || 0) * (item.quantity || 0);
  };

  const calculateSubtotal = (items) => {
    if (!Array.isArray(items)) return 0;
    return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${styles.background}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${styles.background}`}>
        <div className="text-red-500">{error || 'Order not found'}</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-4 md:p-6 lg:p-8 ${styles.background}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className={`p-2 rounded-lg ${styles.button}`}
          >
            <RiArrowLeftLine className="w-6 h-6" />
          </button>
          <div>
            <h2 className={`text-lg font-semibold ${styles.text}`}>Order Details</h2>
            <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {order.orderId || order._id}
            </p>
          </div>
        </div>

        {/* Order Status Card */}
        <div className={`p-4 rounded-xl ${styles.card} border ${styles.border} mb-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {order.status === 'completed' && <RiCheckboxCircleLine className="w-5 h-5 text-green-500" />}
              {order.status === 'processing' && <RiTimeLine className="w-5 h-5 text-blue-500" />}
              {order.status === 'pending' && <RiTruckLine className="w-5 h-5 text-yellow-500" />}
              {order.status === 'cancelled' && <RiCloseLine className="w-5 h-5 text-red-500" />}
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
            {order.status !== 'cancelled' && order.status !== 'completed' && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCancelModal(true)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${styles.cancelButton}`}
              >
                Cancel Order
              </motion.button>
            )}
          </div>
        </div>

        {/* Order Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customer Information */}
          <div className={`p-4 rounded-xl ${styles.card} border ${styles.border}`}>
            <h3 className={`text-sm font-medium mb-3 ${styles.text}`}>Customer Information</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <RiUserLine className="w-4 h-4 text-gray-400" />
                <span className={`text-sm ${styles.text}`}>
                  {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <RiMapPinLine className="w-4 h-4 text-gray-400" />
                <span className={`text-sm ${styles.text}`}>
                  {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.country}
                </span>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className={`p-4 rounded-xl ${styles.card} border ${styles.border}`}>
            <h3 className={`text-sm font-medium mb-3 ${styles.text}`}>Order Summary</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RiMoneyDollarCircleLine className="w-4 h-4 text-gray-400" />
                  <span className={`text-sm ${styles.text}`}>Original Amount</span>
                </div>
                <span className={`text-sm font-medium ${styles.text}`}>
                  {formatPrice(order.totalAmount)}
                </span>
              </div>
              
              {/* Add Referral Discount if used */}
              {order.referralDiscount > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RiMoneyDollarCircleLine className="w-4 h-4 text-green-400" />
                    <span className={`text-sm ${styles.text}`}>Referral Discount</span>
                  </div>
                  <span className={`text-sm font-medium text-green-500`}>
                    - {formatPrice(order.referralDiscount)}
                  </span>
                </div>
              )}

              {/* Final Amount */}
              <div className="flex items-center justify-between pt-2 border-t border-dashed">
                <div className="flex items-center gap-2">
                  <RiMoneyDollarCircleLine className="w-4 h-4 text-gray-400" />
                  <span className={`text-sm font-bold ${styles.text}`}>Final Amount</span>
                </div>
                <span className={`text-sm font-bold ${styles.text}`}>
                  {formatPrice(order.finalAmount || order.totalAmount)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RiCalendarEventLine className="w-4 h-4 text-gray-400" />
                  <span className={`text-sm ${styles.text}`}>Order Date</span>
                </div>
                <span className={`text-sm ${styles.text}`}>
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items with Images */}
        <div className={`mt-4 p-4 rounded-xl ${styles.card} border ${styles.border}`}>
          <h3 className={`text-sm font-medium mb-3 ${styles.text}`}>Order Items</h3>
          <div className="space-y-3">
            {order.items?.[0]?.__parentArray?.map((item, index) => {
              if (!item || !item.product) return null;

              const product = item.product;
              const quantity = item.quantity || 0;
              const price = item.price || 0;
              const itemTotal = price * quantity;

              return (
                <motion.div 
                  key={index}
                  whileHover={{ scale: 1.01 }}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    currentTheme === 'dark' ? 'bg-gray-700/50' 
                    : currentTheme === 'eyeCare' ? 'bg-[#FFF8ED]' 
                    : 'bg-gray-50'
                  }`}
                >
                  <Link 
                    to={`/${user?._id}/products/${product._id}`}
                    className="flex items-center gap-4 flex-1 group"
                  >
                    {/* Product Image */}
                    <div className={`relative w-16 h-16 rounded-lg overflow-hidden border ${styles.border}`}>
                      {product.media?.[0]?.url && !imageErrors[product._id] ? (
                        <img
                          src={product.media[0].url}
                          alt={product.name || 'Product'}
                          className="w-full h-full object-cover"
                          onError={() => handleImageError(product._id)}
                          loading="lazy"
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center ${
                          currentTheme === 'dark' ? 'bg-gray-800' 
                          : currentTheme === 'eyeCare' ? 'bg-[#D4C3AA]' 
                          : 'bg-gray-100'
                        }`}>
                          <RiImageLine className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium ${styles.text} group-hover:underline`}>
                          {truncateText(product.name || 'Unnamed Product')}
                        </p>
                        <RiExternalLinkLine className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${
                          currentTheme === 'dark' ? 'text-gray-400' 
                          : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]' 
                          : 'text-gray-500'
                        }`} />
                      </div>
                      <p className={`text-xs mt-1 ${
                        currentTheme === 'dark' ? 'text-gray-400' 
                        : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]' 
                        : 'text-gray-600'
                      }`}>
                        Quantity: {quantity}
                      </p>
                    </div>
                  </Link>

                  {/* Total Price */}
                  <div className="pl-4 border-l border-gray-200">
                    <span className={`text-sm font-medium ${styles.text}`}>
                      {formatPrice(itemTotal)}
                    </span>
                  </div>
                </motion.div>
              );
            })}

            {/* Order Total */}
            <div className={`mt-4 pt-4 border-t ${styles.border}`}>
              <div className="flex justify-between items-center">
                <span className={`text-sm font-medium ${styles.text}`}>Subtotal</span>
                <span className={`text-sm ${styles.text}`}>
                  {formatPrice(calculateSubtotal(order.items?.[0]?.__parentArray || []))}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className={`text-sm font-medium ${styles.text}`}>Shipping</span>
                <span className={`text-sm ${styles.text}`}>Free</span>
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-dashed">
                <span className={`text-sm font-bold ${styles.text}`}>Total</span>
                <span className={`text-sm font-bold ${styles.text}`}>
                  {formatPrice(order.totalAmount || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Modal Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowCancelModal(false)}
            />

            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className={`
                relative
                w-full
                max-w-sm
                sm:max-w-md
                mx-auto
                p-6
                rounded-xl
                shadow-xl
                z-50
                ${styles.card}
                border
                ${styles.border}
              `}
            >
              <div className="flex flex-col items-center text-center">
                <div className={`p-3 rounded-full mb-4 ${
                  currentTheme === 'dark' ? 'bg-red-500/10' 
                  : currentTheme === 'eyeCare' ? 'bg-red-500/10' 
                  : 'bg-red-50'
                }`}>
                  <RiAlertLine className="w-8 h-8 text-red-500" />
                </div>
                
                <h3 className={`text-xl font-semibold ${styles.text} mb-2`}>
                  Cancel Order
                </h3>
                
                <p className={`text-sm ${
                  currentTheme === 'dark' ? 'text-gray-400' 
                  : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]' 
                  : 'text-gray-600'
                } mb-6`}>
                  Are you sure you want to cancel this order? This action cannot be undone.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className={`
                      w-full
                      sm:w-1/2
                      px-4
                      py-2.5
                      rounded-lg
                      text-sm
                      font-medium
                      ${styles.button}
                      transition-colors
                      duration-200
                    `}
                  >
                    No, Keep Order
                  </button>
                  
                  <button
                    onClick={handleCancelOrder}
                    disabled={cancelling}
                    className={`
                      w-full
                      sm:w-1/2
                      px-4
                      py-2.5
                      rounded-lg
                      text-sm
                      font-medium
                      transition-colors
                      duration-200
                      ${cancelling ? 'opacity-50 cursor-not-allowed' : ''} 
                      bg-red-500
                      hover:bg-red-600
                      text-white
                    `}
                  >
                    {cancelling ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Cancelling...</span>
                      </div>
                    ) : (
                      'Yes, Cancel Order'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrderDetails; 