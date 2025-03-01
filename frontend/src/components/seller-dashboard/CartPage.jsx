import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import {
  RiShoppingBag3Line,
  RiDeleteBinLine,
  RiAddLine,
  RiSubtractLine,
  RiArrowRightLine,
  RiSecurePaymentLine,
  RiTruckLine,
  RiShieldCheckLine,
  RiArrowLeftLine,
  RiGiftLine,
  RiDeleteBin2Line,
  RiCloseLine,
  RiAlertLine
} from 'react-icons/ri';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const formatCurrency = (amount) => {
  return `Rs ${amount.toLocaleString('en-PK')}`;
};

const CartPage = ({ cartItems, setCartItems, cartLoading, fetchCartData }) => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const { userId } = useParams();
  const [isUpdating, setIsUpdating] = useState(false);
  const { user } = useAuth();
  const [showClearModal, setShowClearModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const user_id = user._id;

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch cart data
  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get('http://192.168.100.17:5000/api/cart', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      
      if (response.data.success) {
        const formattedItems = response.data.cart?.items.map(item => ({
          id: item.product._id,
          title: item.product.name,
          price: item.price,
          quantity: item.quantity,
          image: item.product.media[0]?.url,
          category: item.product.category?.name || 'Uncategorized'
        })) || [];
        
        setCartItems(formattedItems);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast.error('Failed to fetch cart items');
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // Update quantity with backend integration
  const updateQuantity = async (id, change) => {
    try {
      setIsUpdating(true);
      const token = localStorage.getItem('authToken');
      const item = cartItems.find(item => item.id === id);
      const newQuantity = Math.max(1, item.quantity + change);

      const response = await axios.put('http://192.168.100.17:5000/api/cart/update', 
        {
          productId: id,
          quantity: newQuantity
        },
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );

      if (response.data.success) {
        setCartItems(items =>
          items.map(item =>
            item.id === id
              ? { ...item, quantity: newQuantity }
              : item
          )
        );
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error(error.response?.data?.message || 'Failed to update quantity');
    } finally {
      setIsUpdating(false);
    }
  };

  // Remove item with backend integration
  const removeItem = async (id) => {
    try {
      setIsUpdating(true);
      const token = localStorage.getItem('authToken');
      
      const response = await axios.delete(`http://192.168.100.17:5000/api/cart/remove/${id}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });

      if (response.data.success) {
        setCartItems(items => items.filter(item => item.id !== id));
        toast.success('Item removed from cart');
      }
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Failed to remove item from cart');
    } finally {
      setIsUpdating(false);
    }
  };

  // Modified clear cart function
  const handleClearCart = async () => {
    try {
      setIsUpdating(true);
      const token = localStorage.getItem('authToken');
      
      // First animate items out
      const cartItemElements = document.querySelectorAll('.cart-item');
      await Promise.all(
        Array.from(cartItemElements).map((element, index) => {
          return new Promise(resolve => {
            element.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
            element.style.transitionDelay = `${index * 0.1}s`;
            element.style.transform = 'translateX(-100%)';
            element.style.opacity = '0';
            setTimeout(resolve, 300 + (index * 100));
          });
        })
      );

      const response = await axios.delete('http://192.168.100.17:5000/api/cart/clear', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });

      if (response.data.success) {
        setCartItems([]);
        toast.success('Cart cleared successfully');
        setShowClearModal(false);
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart');
    } finally {
      setIsUpdating(false);
    }
  };

  // Add to cart with backend integration
  const addToCart = async (productId, quantity = 1) => {
    try {
      setIsUpdating(true);
      const token = localStorage.getItem('authToken');
      
      const response = await axios.post('http://192.168.100.17:5000/api/cart/add',
        {
          productId,
          quantity
        },
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );

      if (response.data.success) {
        fetchCart(); // Refresh cart data
        toast.success('Item added to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error(error.response?.data?.message || 'Failed to add item to cart');
    } finally {
      setIsUpdating(false);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 150 ? 0 : 12.00;
  const total = subtotal + shipping;

  // Add the Clear Cart Modal component
  const ClearCartModal = () => (
    <AnimatePresence>
      {showClearModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowClearModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={`relative w-full max-w-md p-6 rounded-2xl shadow-xl ${
              currentTheme === 'dark'
                ? 'bg-gray-800 text-white'
                : currentTheme === 'eyeCare'
                ? 'bg-[#E6D5BC] text-[#433422]'
                : 'bg-white text-gray-900'
            }`}
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100/10"
              onClick={() => setShowClearModal(false)}
            >
              <RiCloseLine size={24} />
            </motion.button>

            {/* Modal content */}
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center bg-red-100 text-red-500"
              >
                <RiAlertLine size={32} />
              </motion.div>

              <h3 className="text-xl font-semibold mb-2">Clear Shopping Cart</h3>
              <p className="text-sm opacity-70 mb-6">
                Are you sure you want to remove all items from your cart? 
                This action cannot be undone.
              </p>

              <div className="flex gap-3 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 rounded-xl ${
                    currentTheme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600'
                      : currentTheme === 'eyeCare'
                      ? 'bg-[#D4C3AA] hover:bg-[#C4B39A]'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                  onClick={() => setShowClearModal(false)}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 rounded-xl flex items-center gap-2 ${
                    currentTheme === 'dark'
                      ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                      : currentTheme === 'eyeCare'
                      ? 'bg-[#FF6B6B]/10 text-[#FF6B6B] hover:bg-[#FF6B6B]/20'
                      : 'bg-red-50 text-red-500 hover:bg-red-100'
                  }`}
                  onClick={handleClearCart}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full"
                      />
                      <span>Clearing...</span>
                    </>
                  ) : (
                    <>
                      <RiDeleteBin2Line size={20} />
                      <span>Clear All</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Update the proceed to checkout button handler
  const handleCheckout = () => {
    navigate(`/${userId}/checkout`);
  };

  if (cartLoading) {
    return (
      <div className={`min-h-screen p-4 ${
        currentTheme === 'dark' ? 'bg-gray-900 text-white' 
        : currentTheme === 'eyeCare' ? 'bg-[#F5E6D3] text-[#433422]'
        : 'bg-gray-50 text-gray-900'
      }`}>
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`p-4 rounded-xl ${
                currentTheme === 'dark' 
                  ? 'bg-gray-800/50' 
                  : currentTheme === 'eyeCare' 
                  ? 'bg-[#E6D5BC]/50'
                  : 'bg-white/50'
              }`}>
                <div className="flex gap-4">
                  <div className="w-24 h-24 rounded-lg bg-gray-200 dark:bg-gray-700" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-[76px] lg:pb-0 relative ${
      currentTheme === 'dark' ? 'bg-gray-900 text-white' 
      : currentTheme === 'eyeCare' ? 'bg-[#F5E6D3] text-[#433422]'
      : 'bg-gray-50 text-gray-900'
    }`}>
      <ClearCartModal />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {cartItems.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <RiShoppingBag3Line size={64} className="mx-auto mb-4 opacity-20" />
            <h2 className="text-xl font-medium mb-2">Your cart is empty</h2>
            <p className="opacity-60 mb-8">Add some items to start shopping</p>
            <Link 
              to={`/${userId}/products`}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                currentTheme === 'dark' 
                  ? 'bg-white text-gray-900 hover:bg-gray-100' 
                  : currentTheme === 'eyeCare'
                  ? 'bg-[#433422] text-[#F5E6D3] hover:bg-[#433422]/90'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
            >
              <span>Continue Shopping</span>
              <RiArrowRightLine size={20} />
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <RiShoppingBag3Line className="text-purple-500 flex-shrink-0" size={20} />
                  <h1 className="text-lg md:text-2xl font-serif truncate">
                    Cart ({cartItems.length})
                  </h1>
                </div>
                
                {/* Clear All Button - Always on same row */}
                {cartItems.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowClearModal(true)}
                    disabled={isUpdating}
                    className={`ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all flex-shrink-0 ${
                      currentTheme === 'dark'
                        ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                        : currentTheme === 'eyeCare'
                        ? 'bg-[#FF6B6B]/10 text-[#FF6B6B] hover:bg-[#FF6B6B]/20'
                        : 'bg-red-50 text-red-500 hover:bg-red-100'
                    } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <RiDeleteBin2Line size={18} className="flex-shrink-0" />
                    <span className="font-medium whitespace-nowrap text-sm md:text-base">Clear</span>
                  </motion.button>
                )}
              </div>

              <AnimatePresence>
                {cartItems.map((item) => (
                  <motion.div
                    key={item.id}
                    className="cart-item"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className={`p-3 md:p-4 rounded-xl ${
                      currentTheme === 'dark' 
                        ? 'bg-gray-800/50 backdrop-blur-xl border border-gray-700' 
                        : currentTheme === 'eyeCare' 
                        ? 'bg-[#E6D5BC]/50 backdrop-blur-xl border border-[#D4C3AA]'
                        : 'bg-white/50 backdrop-blur-xl border border-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3 md:gap-4">
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="w-16 h-16 md:w-24 md:h-24 rounded-lg overflow-hidden bg-white p-2 cursor-pointer"
                        onClick={() => navigate(`/${user._id}/products/${item.id}?from=cart`)}
                      >
                        <img 
                          src={item.image} 
                          alt={item.title}
                          className="w-full h-full object-contain"
                        />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <h3 
                          className="font-medium mb-1 truncate cursor-pointer hover:opacity-80"
                          onClick={() => navigate(`/${user._id}/products/${item.id}?from=cart`)}
                        >
                          {item.title}
                        </h3>
                        {item.category !== 'Uncategorized' && (
                          <p className="text-xs md:text-sm opacity-60 mb-2">{item.category}</p>
                        )}
                        <div className="flex items-center gap-4">
                          <div className={`flex items-center rounded-lg ${
                            currentTheme === 'dark' ? 'bg-gray-700' 
                            : currentTheme === 'eyeCare' ? 'bg-[#D4C3AA]'
                            : 'bg-gray-100'
                          }`}>
                            <motion.button 
                              whileTap={{ scale: 0.9 }}
                              onClick={() => updateQuantity(item.id, -1)}
                              className="p-1 hover:opacity-70"
                            >
                              <RiSubtractLine size={isMobile ? 16 : 18} />
                            </motion.button>
                            <span className="w-8 text-center font-medium text-sm md:text-base">
                              {item.quantity}
                            </span>
                            <motion.button 
                              whileTap={{ scale: 0.9 }}
                              onClick={() => updateQuantity(item.id, 1)}
                              className="p-1 hover:opacity-70"
                            >
                              <RiAddLine size={isMobile ? 16 : 18} />
                            </motion.button>
                          </div>
                          <p className="font-medium text-sm md:text-base">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => removeItem(item.id)}
                        className="p-2 rounded-full hover:bg-red-500/10 text-red-500"
                      >
                        <RiDeleteBinLine size={isMobile ? 18 : 20} />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Gift Message */}
              <motion.div
                whileHover={{ y: -2 }}
                className={`p-4 rounded-xl ${
                  currentTheme === 'dark' 
                    ? 'bg-gray-800/50 backdrop-blur-xl border border-gray-700' 
                    : currentTheme === 'eyeCare' 
                    ? 'bg-[#E6D5BC]/50 backdrop-blur-xl border border-[#D4C3AA]'
                    : 'bg-white/50 backdrop-blur-xl border border-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <RiGiftLine size={24} className="text-purple-500" />
                  <div>
                    <p className="font-medium">Add a Gift Message?</p>
                    <p className="text-sm opacity-60">Make it special with a personal note</p>
                  </div>
                </div>
              </motion.div>

              {/* Features - Updated for mobile */}
              <div className="grid grid-cols-3 gap-2 mt-8">
                {[
                  { icon: <RiTruckLine size={20} />, text: "Free Shipping", subtext: "Over $150" },
                  { icon: <RiSecurePaymentLine size={20} />, text: "Secure Pay", subtext: "By Stripe" },
                  { icon: <RiShieldCheckLine size={20} />, text: "Money-Back", subtext: "30 Days" }
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ y: -2 }}
                    className={`p-2 md:p-4 rounded-xl text-center ${
                      currentTheme === 'dark' 
                        ? 'bg-gray-800/50 backdrop-blur-xl border border-gray-700' 
                        : currentTheme === 'eyeCare' 
                        ? 'bg-[#E6D5BC]/50 backdrop-blur-xl border border-[#D4C3AA]'
                        : 'bg-white/50 backdrop-blur-xl border border-gray-100'
                    }`}
                  >
                    <div className="flex justify-center mb-1 md:mb-2">
                      <div className={`text-purple-500 ${
                        currentTheme === 'dark' ? 'opacity-90' : 'opacity-80'
                      }`}>
                        {feature.icon}
                      </div>
                    </div>
                    <p className="font-medium text-xs md:text-base mb-0.5 md:mb-1 whitespace-nowrap">
                      {feature.text}
                    </p>
                    <p className="text-[10px] md:text-sm opacity-60 whitespace-nowrap">
                      {feature.subtext}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1 hidden lg:block">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 rounded-xl sticky top-24 ${
                  currentTheme === 'dark' 
                    ? 'bg-gray-800/50 backdrop-blur-xl border border-gray-700' 
                    : currentTheme === 'eyeCare' 
                    ? 'bg-[#E6D5BC]/50 backdrop-blur-xl border border-[#D4C3AA]'
                    : 'bg-white/50 backdrop-blur-xl border border-gray-100'
                }`}
              >
                <h2 className="text-xl font-serif mb-6">Order Summary</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="opacity-60">Subtotal</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-60">Shipping</span>
                    <span className="font-medium">
                      {shipping === 0 ? 'FREE' : formatCurrency(shipping)}
                    </span>
                  </div>
                  <div className="h-px bg-current opacity-10" />
                  <div className="flex justify-between">
                    <span className="font-medium">Total</span>
                    <span className="font-medium">{formatCurrency(total)}</span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCheckout}
                  disabled={isUpdating}
                  className={`w-full py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 ${
                    currentTheme === 'dark' 
                      ? 'bg-white text-gray-900 hover:bg-gray-100' 
                      : currentTheme === 'eyeCare'
                      ? 'bg-[#433422] text-[#F5E6D3] hover:bg-[#433422]/90'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span>{isUpdating ? 'Processing...' : 'Proceed to Checkout'}</span>
                  {!isUpdating && <RiArrowRightLine size={20} />}
                </motion.button>
              </motion.div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Checkout Bar */}
      {isMobile && cartItems.length > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className={`fixed bottom-[60px] left-0 right-0 px-4 py-3 z-40 ${
            currentTheme === 'dark' 
              ? 'bg-gray-900/95 border-t border-gray-800' 
              : currentTheme === 'eyeCare' 
              ? 'bg-[#F5E6D3]/95 border-t border-[#D4C3AA]'
              : 'bg-white/95 border-t border-gray-100'
          } backdrop-blur-lg`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-baseline gap-2">
              <span className="text-sm opacity-70">Total:</span>
              <span className="text-lg font-semibold">{formatCurrency(total)}</span>
            </div>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleCheckout}
              disabled={isUpdating}
              className={`flex-shrink-0 py-2 px-4 rounded-xl font-medium flex items-center justify-center gap-2 ${
                currentTheme === 'dark' 
                  ? 'bg-white text-gray-900 hover:bg-gray-100' 
                  : currentTheme === 'eyeCare'
                  ? 'bg-[#433422] text-[#F5E6D3] hover:bg-[#433422]/90'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="text-sm">
                {isUpdating ? 'Processing...' : 'Checkout'}
              </span>
              {!isUpdating && <RiArrowRightLine size={18} />}
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CartPage; 
