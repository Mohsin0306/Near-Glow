import React from 'react';
import { motion } from 'framer-motion';
import { RiSecurePaymentLine, RiTruckLine, RiShieldCheckLine } from 'react-icons/ri';
import { formatCurrency } from '../../../utils/api';

const OrderSummary = ({ cartItems = [], currentTheme, isMobile, subtotal = 0, shipping = 0, total = 0 }) => {
  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 rounded-xl ${
          currentTheme === 'dark' 
            ? 'bg-gray-800/50 backdrop-blur-xl border border-gray-700' 
            : currentTheme === 'eyeCare' 
            ? 'bg-[#E6D5BC]/50 backdrop-blur-xl border border-[#D4C3AA]'
            : 'bg-white/50 backdrop-blur-xl border border-gray-100'
        }`}
      >
        <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
        
        <div className="space-y-3 mb-4">
          <div className="flex justify-between text-sm">
            <span className="opacity-60">Subtotal ({(cartItems || []).length} items)</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="opacity-60">Delivery Fee</span>
            <span>{formatCurrency(shipping || cartItems[0]?.product?.deliveryPrice || 0)}</span>
          </div>
          <div className="h-px bg-current opacity-10" />
          <div className="flex justify-between">
            <span className="font-medium">Total</span>
            <span className="font-medium">
              {formatCurrency(total + (shipping || cartItems[0]?.product?.deliveryPrice || 0))}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {[
            {
              icon: <RiSecurePaymentLine size={18} />,
              title: 'Secure Payment',
              description: 'Your payment information is encrypted'
            },
            {
              icon: <RiTruckLine size={18} />,
              title: 'Free Shipping',
              description: 'On all orders over Rs 15,000'
            },
            {
              icon: <RiShieldCheckLine size={18} />,
              title: 'Money-Back Guarantee',
              description: '30-day return policy'
            }
          ].map((feature, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 p-3 rounded-lg ${
                currentTheme === 'dark' ? 'bg-gray-700/50' 
                : currentTheme === 'eyeCare' ? 'bg-white'
                : 'bg-gray-50'
              }`}
            >
              <div className={`mt-0.5 ${
                currentTheme === 'dark' ? 'text-white' 
                : currentTheme === 'eyeCare' ? 'text-[#433422]'
                : 'text-gray-900'
              }`}>
                {feature.icon}
              </div>
              <div>
                <h3 className="text-sm font-medium">{feature.title}</h3>
                <p className={`text-xs ${
                  currentTheme === 'dark' ? 'text-gray-400' 
                  : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]'
                  : 'text-gray-600'
                }`}>{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default OrderSummary; 