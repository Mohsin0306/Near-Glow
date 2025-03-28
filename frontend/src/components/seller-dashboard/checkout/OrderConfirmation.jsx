import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { RiCheckboxCircleLine, RiHome2Line, RiFileListLine } from 'react-icons/ri';
import { formatCurrency, orderAPI } from '../../../utils/api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';

const OrderConfirmation = ({ currentTheme, isMobile }) => {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchOrderConfirmation = async () => {
      try {
        const orderIdToUse = orderId || localStorage.getItem('lastOrderId');
        
        if (!orderIdToUse) {
          console.error('No order ID found');
          navigate(`/${user._id}/`);
          return;
        }

        const token = localStorage.getItem('authToken');
        const response = await orderAPI.getOrderConfirmation(orderIdToUse, token);
        
        if (response.data.success) {
          setOrderData(response.data.orderConfirmation);
          localStorage.removeItem('lastOrderId');
        }
      } catch (error) {
        console.error('Error fetching order confirmation:', error);
        toast.error('Error fetching order details');
        navigate(`/${user._id}/`);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderConfirmation();
  }, [orderId, user._id, navigate]);

  // Debug logging
  useEffect(() => {
    console.log('Current order state:', orderData);
    console.log('Loading state:', loading);
  }, [orderData, loading]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="text-center p-4">
          <h2 className="text-xl font-semibold mb-4">No order information found</h2>
          <div className="space-x-4">
            <button onClick={() => navigate('/')} className="text-blue-500 hover:underline">
              Return Home
            </button>
            <button onClick={() => navigate('/orders')} className="text-blue-500 hover:underline">
              Check Order Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Destructure amounts from order
  const {
    productSubtotal,
    deliveryPrice,
    totalBeforeDiscount,
    referralDiscount,
    coinsUsed,
    coinValue,
    finalAmount
  } = orderData.amounts;

  // Get all the order details from the backend data
  const orderIdFromBackend = orderData.orderId || orderData._id || "Order ID not available";

  // Modify the Link components to clear localStorage when clicked
  const handleNavigateAway = () => {
    localStorage.removeItem('lastOrder');
  };

  return (
    <div className={`fixed inset-0 z-50 ${
      currentTheme === 'dark' ? 'bg-gray-900 text-white' 
      : currentTheme === 'eyeCare' ? 'bg-[#F5E6D3] text-[#433422]'
      : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="h-full overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-xl ${
              currentTheme === 'dark' ? 'bg-gray-800' 
              : currentTheme === 'eyeCare' ? 'bg-white'
              : 'bg-white'
            }`}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{
                background: currentTheme === 'dark' 
                  ? '#22c55e15' 
                  : currentTheme === 'eyeCare'
                  ? '#4CAF5015'
                  : '#22c55e15'
              }}
            >
              <RiCheckboxCircleLine 
                size={32} 
                className={
                  currentTheme === 'dark' 
                    ? 'text-green-500' 
                    : currentTheme === 'eyeCare'
                    ? 'text-[#4CAF50]'
                    : 'text-green-500'
                }
              />
            </motion.div>

            <h1 className="text-xl font-bold mb-2 text-center">Order Confirmed!</h1>
            <p className={`mb-4 text-sm text-center ${
              currentTheme === 'dark' ? 'text-gray-400' 
              : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]'
              : 'text-gray-600'
            }`}>
              Thank you for your purchase. Your order has been received.
            </p>

            <div className={`p-3 rounded-xl mb-6 ${
              currentTheme === 'dark' ? 'bg-gray-700/50' 
              : currentTheme === 'eyeCare' ? 'bg-[#FFF8ED]'
              : 'bg-gray-50'
            }`}>
              <p className="text-xs mb-1">Order ID</p>
              <p className="font-mono font-medium text-sm">{orderIdFromBackend}</p>
            </div>

            <div className={`p-3 rounded-xl mb-4 ${
              currentTheme === 'dark' ? 'bg-gray-700/50' 
              : currentTheme === 'eyeCare' ? 'bg-[#FFF8ED]'
              : 'bg-gray-50'
            }`}>
              <div className="space-y-2">
                {/* Product Subtotal */}
                <div className="flex justify-between text-sm">
                  <span className="opacity-70">Product Subtotal:</span>
                  <span>{formatCurrency(productSubtotal)}</span>
                </div>

                {/* Delivery Fee */}
                <div className="flex justify-between text-sm">
                  <span className="opacity-70">Delivery Fee:</span>
                  <span>{formatCurrency(deliveryPrice)}</span>
                </div>

                {/* Total before discount */}
                <div className="flex justify-between text-sm font-medium">
                  <span>Total:</span>
                  <span>{formatCurrency(totalBeforeDiscount)}</span>
                </div>

                {/* Referral Discount */}
                {referralDiscount > 0 && (
                  <>
                    <div className="h-px bg-current opacity-10 my-2" />
                    <div className="flex justify-between text-sm text-green-500">
                      <span>Referral Discount ({coinsUsed} coins):</span>
                      <span>-{formatCurrency(referralDiscount)}</span>
                    </div>
                    <div className="text-xs opacity-70">
                      (₹{coinValue} per coin used)
                    </div>
                  </>
                )}

                {/* Final Amount */}
                <div className="h-px bg-current opacity-10 my-2" />
                <div className="flex justify-between font-medium text-lg">
                  <span>Final Amount:</span>
                  <span>{formatCurrency(finalAmount)}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Link 
                to={`/${user?._id || orderId}/`} 
                className="w-full"
                onClick={handleNavigateAway}
              >
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  className={`w-full py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-1.5 ${
                    currentTheme === 'dark'
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : currentTheme === 'eyeCare'
                      ? 'bg-[#E6D5B8] text-[#433422] hover:bg-[#E6D5B8]/90'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  <RiHome2Line size={16} />
                  <span className="text-sm">Home</span>
                </motion.button>
              </Link>

              <Link 
                to={`/${user?._id || orderId}/alerts/orders`} 
                className="w-full"
                onClick={handleNavigateAway}
              >
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  className={`w-full py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-1.5 ${
                    currentTheme === 'dark'
                      ? 'bg-white text-gray-900 hover:bg-gray-100'
                      : currentTheme === 'eyeCare'
                      ? 'bg-[#433422] text-[#F5E6D3] hover:bg-[#433422]/90'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  <RiFileListLine size={16} />
                  <span className="text-sm">Orders</span>
                </motion.button>
              </Link>
            </div>

            <div className={`mt-6 p-3 rounded-xl ${
              currentTheme === 'dark' ? 'bg-gray-700/50' 
              : currentTheme === 'eyeCare' ? 'bg-[#FFF8ED]'
              : 'bg-gray-50'
            }`}>
              <p className={`text-xs ${
                currentTheme === 'dark' ? 'text-gray-400' 
                : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]'
                : 'text-gray-600'
              }`}>
                A confirmation email has been sent to your email address. 
                You can track your order status in the Orders section.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;