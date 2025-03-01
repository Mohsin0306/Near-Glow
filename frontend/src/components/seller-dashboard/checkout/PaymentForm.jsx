import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { RiArrowLeftLine, RiArrowRightLine, RiMastercardLine, RiSecurePaymentLine, RiWalletLine, RiMoneyDollarCircleLine } from 'react-icons/ri';

const PaymentForm = ({ formData, setFormData, onNext, onBack, currentTheme, isMobile }) => {
  const [paymentMethod] = useState('cod');

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext();
  };

  const inputClass = `w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
    currentTheme === 'dark'
      ? 'bg-gray-800 border-gray-700 text-white focus:border-white'
      : currentTheme === 'eyeCare'
      ? 'bg-white border-[#E6D5B8] text-[#433422] focus:border-[#433422]'
      : 'bg-white border-gray-200 text-gray-900 focus:border-black'
  } focus:ring-2 focus:ring-opacity-50 focus:outline-none`;

  const labelClass = `block text-sm font-medium mb-1.5 ${
    currentTheme === 'dark' ? 'text-gray-300' 
    : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]'
    : 'text-gray-700'
  }`;

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      {/* Only show COD payment method */}
      <div className="grid grid-cols-1 gap-3">
        <motion.div
          className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
            currentTheme === 'dark'
              ? 'bg-gray-800 border-gray-700 text-gray-300'
              : currentTheme === 'eyeCare'
              ? 'bg-white border-[#E6D5B8] text-[#433422]'
              : 'bg-white border-gray-200 text-gray-600'
          }`}
          style={{
            borderColor: '#FF9800',
            background: '#FF980015'
          }}
        >
          <span style={{ color: '#FF9800' }}><RiMoneyDollarCircleLine size={20} /></span>
          <span className="text-sm font-medium">Cash on Delivery</span>
        </motion.div>
      </div>

      <div className={`p-3 rounded-xl ${
        currentTheme === 'dark' ? 'bg-gray-800' 
        : currentTheme === 'eyeCare' ? 'bg-white'
        : 'bg-gray-50'
      }`}>
        <p className="text-sm opacity-75">
          Pay with cash upon delivery. A verification call may be required before dispatch.
        </p>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-3 mt-6">
        <motion.button
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={onBack}
          className={`flex-1 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-1.5 ${
            currentTheme === 'dark'
              ? 'bg-gray-800 text-white hover:bg-gray-700'
              : currentTheme === 'eyeCare'
              ? 'bg-[#E6D5B8] text-[#433422] hover:bg-[#E6D5B8]/90'
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
          }`}
        >
          <RiArrowLeftLine size={16} />
          <span className="text-sm">Back</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          className={`flex-1 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-1.5 ${
            currentTheme === 'dark'
              ? 'bg-white text-gray-900 hover:bg-gray-100'
              : currentTheme === 'eyeCare'
              ? 'bg-[#433422] text-[#F5E6D3] hover:bg-[#433422]/90'
              : 'bg-gray-900 text-white hover:bg-gray-800'
          }`}
        >
          <span className="text-sm">Review</span>
          <RiArrowRightLine size={16} />
        </motion.button>
      </div>
    </motion.form>
  );
};

export default PaymentForm; 