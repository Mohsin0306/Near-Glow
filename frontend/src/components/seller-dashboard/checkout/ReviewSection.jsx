import React from 'react';
import { motion } from 'framer-motion';
import { RiArrowLeftLine, RiShieldCheckLine } from 'react-icons/ri';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { createAPI } from '../../../utils/api';

const ReviewSection = ({ formData, cartItems, onBack, loading, setLoading, currentTheme, isMobile }) => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('authToken');
      const api = createAPI(token);

      const orderData = {
        shippingAddress: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          address: formData.address,
          city: formData.city,
          country: 'Pakistan',
          phoneNumber: formData.phone
        },
        paymentMethod: 'cod',
        paymentDetails: {
          status: 'pending'
        }
      };

      const response = await api.post('/orders', orderData);

      if (response.data.success) {
        setLoading(false);
        navigate(`/${userId}/checkout/confirmation`, { state: { order: response.data.order } });
      }
    } catch (error) {
      setLoading(false);
      console.error('Error creating order:', error);
    }
  };

  const sectionClass = `p-3 rounded-xl ${
    currentTheme === 'dark' ? 'bg-gray-800/50' 
    : currentTheme === 'eyeCare' ? 'bg-white'
    : 'bg-gray-50'
  }`;

  const headerClass = `text-sm font-medium mb-2 ${
    currentTheme === 'dark' ? 'text-gray-300' 
    : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]'
    : 'text-gray-600'
  }`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      {/* Shipping Information */}
      <div className="space-y-3">
        <h3 className={headerClass}>Shipping To</h3>
        <div className={sectionClass}>
          <p className="font-medium">{formData.firstName} {formData.lastName}</p>
          <p className="mt-1 text-sm opacity-75">{formData.address}</p>
          <p className="text-sm opacity-75">{formData.city}, {formData.zipCode}</p>
          <p className="mt-2 text-sm opacity-75">{formData.email}</p>
          <p className="text-sm opacity-75">{formData.phone}</p>
        </div>
      </div>

      {/* Payment Information */}
      <div className="space-y-3">
        <h3 className={headerClass}>Payment Method</h3>
        <div className={sectionClass}>
          {formData.cardNumber ? (
            <>
              <p className="font-medium">Credit Card ending in {formData.cardNumber.slice(-4)}</p>
              <p className="mt-1 text-sm opacity-75">Expires {formData.expiryDate}</p>
            </>
          ) : (
            <p className="font-medium">Cash on Delivery</p>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="space-y-3">
        <h3 className={headerClass}>Order Items</h3>
        <div className="space-y-3">
          {cartItems.map((item, index) => (
            <div key={index} className={`flex gap-3 ${sectionClass}`}>
              <img 
                src={item.image} 
                alt={item.title}
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.title}</p>
                <p className="text-sm opacity-75">Qty: {item.quantity}</p>
                <p className="font-medium text-sm mt-1">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-3 mt-6">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onBack}
          disabled={loading}
          className={`flex-1 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-1.5 ${
            currentTheme === 'dark'
              ? 'bg-gray-800 text-white hover:bg-gray-700'
              : currentTheme === 'eyeCare'
              ? 'bg-[#E6D5B8] text-[#433422] hover:bg-[#E6D5B8]/90'
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <RiArrowLeftLine size={16} />
          <span className="text-sm">Back</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={loading}
          className={`flex-1 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-1.5 ${
            currentTheme === 'dark'
              ? 'bg-white text-gray-900 hover:bg-gray-100'
              : currentTheme === 'eyeCare'
              ? 'bg-[#433422] text-[#F5E6D3] hover:bg-[#433422]/90'
              : 'bg-gray-900 text-white hover:bg-gray-800'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <RiShieldCheckLine size={16} />
          <span className="text-sm">{loading ? 'Processing...' : 'Place Order'}</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ReviewSection; 