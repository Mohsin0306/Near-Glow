import React from 'react';
import { motion } from 'framer-motion';
import { Link, useParams, useLocation } from 'react-router-dom';
import { RiCheckboxCircleLine, RiHome2Line, RiFileListLine } from 'react-icons/ri';

const OrderConfirmation = ({ currentTheme, isMobile }) => {
  const { userId } = useParams();
  const location = useLocation();
  const order = location.state?.order;
  
  // Get the actual order ID from the order object
  const orderId = order?.orderId || order?._id || "Order ID not available";

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
              <p className="font-mono font-medium text-sm">{orderId}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Link to={`/${userId}/`} className="w-full">
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

              <Link to={`/${userId}/alerts/orders`} className="w-full">
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