import React from 'react';
import { motion } from 'framer-motion';
import { RiArrowRightLine, RiMapPinLine, RiPhoneLine, RiMailLine } from 'react-icons/ri';

const ShippingForm = ({ formData, setFormData, onNext, currentTheme, isMobile }) => {
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
      {/* Name Row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="firstName" className={labelClass}>First Name</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className={inputClass}
            placeholder="John"
            required
          />
        </div>
        <div>
          <label htmlFor="lastName" className={labelClass}>Last Name</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className={inputClass}
            placeholder="Doe"
            required
          />
        </div>
      </div>

      {/* Contact Info */}
      <div>
        <label htmlFor="email" className={labelClass}>Email Address</label>
        <div className="relative">
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={inputClass}
            placeholder="your@email.com"
            required
          />
          <RiMailLine className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50" size={18} />
        </div>
      </div>

      <div>
        <label htmlFor="phone" className={labelClass}>Phone Number</label>
        <div className="relative">
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={inputClass}
            placeholder="+1 (234) 567-8900"
            required
          />
          <RiPhoneLine className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50" size={18} />
        </div>
      </div>

      {/* Address */}
      <div>
        <label htmlFor="address" className={labelClass}>Street Address</label>
        <div className="relative">
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className={inputClass}
            placeholder="123 Main Street"
            required
          />
          <RiMapPinLine className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50" size={18} />
        </div>
      </div>

      {/* City and Zip Code Row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="city" className={labelClass}>City</label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            className={inputClass}
            placeholder="New York"
            required
          />
        </div>
        <div>
          <label htmlFor="zipCode" className={labelClass}>ZIP Code</label>
          <input
            type="text"
            id="zipCode"
            name="zipCode"
            value={formData.zipCode}
            onChange={handleChange}
            className={inputClass}
            placeholder="10001"
            required
          />
        </div>
      </div>

      {/* Submit Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        className={`w-full mt-6 py-3.5 px-6 rounded-xl font-medium flex items-center justify-center gap-2 ${
          currentTheme === 'dark'
            ? 'bg-white text-gray-900 hover:bg-gray-100'
            : currentTheme === 'eyeCare'
            ? 'bg-[#433422] text-[#F5E6D3] hover:bg-[#433422]/90'
            : 'bg-gray-900 text-white hover:bg-gray-800'
        }`}
      >
        <span>Continue to Payment</span>
        <RiArrowRightLine size={18} />
      </motion.button>
    </motion.form>
  );
};

export default ShippingForm; 