import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../../context/ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { RiArrowLeftLine } from 'react-icons/ri';
import ShippingForm from './ShippingForm';
import PaymentForm from './PaymentForm';
import ReviewSection from './ReviewSection';
import OrderSummary from './OrderSummary';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../../../utils/api';
import { orderAPI } from '../../../utils/api';

const CheckoutPage = () => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { items, subtotal, shipping, total, selectedItemIds } = location.state || {};
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const { user } = useAuth();

  // Add new state for saved addresses
  const [savedAddresses, setSavedAddresses] = useState([]);

  // Load saved addresses when component mounts
  useEffect(() => {
    const loadSavedAddress = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await orderAPI.getSavedAddresses(token);
        if (response.data.success && response.data.address) {
          setSavedAddresses([response.data.address]); // Set only the latest address
        }
      } catch (error) {
        console.error('Error loading saved address:', error);
      }
    };

    loadSavedAddress();
  }, []);

  useEffect(() => {
    // Hide body overflow when component mounts on mobile
    if (isMobile) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    }

    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isMobile]);

  // Validate that we have selected items
  useEffect(() => {
    if (!items || items.length === 0) {
      navigate(-1);
      toast.error('Please select items to checkout');
    }
  }, [items]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zipCode: '',
    paymentMethod: 'cod'
  });

  const steps = [
    { number: 1, title: 'Shipping' },
    { number: 2, title: 'Payment' },
    { number: 3, title: 'Review' }
  ];

  const handlePlaceOrder = async (orderData) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      // Make sure all shipping address fields are included
      const completeOrderData = {
        ...orderData,
        shippingAddress: {
          firstName: orderData.firstName,
          lastName: orderData.lastName,
          email: orderData.email,
          phone: orderData.phone,
          address: orderData.address,
          city: orderData.city,
          zipCode: orderData.zipCode
        }
      };
      
      const response = await orderAPI.createOrder(completeOrderData, token);
      
      if (response.data.success) {
        console.log('Order created:', response.data);
        // Store the order ID in localStorage temporarily
        localStorage.setItem('lastOrderId', response.data.orderId);
        // Navigate to the order confirmation page with user ID
        navigate(`/${user._id}/order-confirmation/${response.data.orderId}`);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error(error.response?.data?.message || 'Error creating order');
    } finally {
      setLoading(false);
    }
  };

  // Fix the delivery price calculation
  const deliveryPrice = 150; // Fixed delivery price
  const totalBeforeDiscount = subtotal + deliveryPrice;
  const finalAmount = totalBeforeDiscount;

  return (
    <div className={`${isMobile ? 'fixed inset-0 z-50' : 'min-h-screen'} ${
      currentTheme === 'dark' ? 'bg-gray-900 text-white' 
      : currentTheme === 'eyeCare' ? 'bg-[#F5E6D3] text-[#433422]'
      : 'bg-gray-50 text-gray-900'
    }`}>
      <div className={`h-full ${isMobile ? 'overflow-y-auto pb-[80px]' : ''}`}>
        <div className="max-w-6xl mx-auto px-4 py-4 md:py-8">
          {/* Header with Back Button */}
          <div className="flex items-center gap-4 mb-6 sticky top-0 z-10 py-2 -mx-4 px-4 backdrop-blur-lg bg-opacity-90 border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={() => navigate(-1)}
              className={`p-2 rounded-full transition-all ${
                currentTheme === 'dark' ? 'hover:bg-gray-800' 
                : currentTheme === 'eyeCare' ? 'hover:bg-[#E6D5BC]'
                : 'hover:bg-gray-100'
              }`}
            >
              <RiArrowLeftLine size={20} />
            </button>
            <h1 className="text-xl font-semibold">Checkout</h1>
          </div>

          {/* Progress Steps - Mobile Optimized */}
          <div className="flex justify-center mb-6">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex flex-col items-center ${
                  index !== steps.length - 1 ? 'w-20 md:w-32' : ''
                }`}>
                  <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-sm md:text-base ${
                    step.number === activeStep
                      ? currentTheme === 'dark'
                        ? 'bg-white text-gray-900'
                        : currentTheme === 'eyeCare'
                        ? 'bg-[#433422] text-[#F5E6D3]'
                        : 'bg-gray-900 text-white'
                      : step.number < activeStep
                      ? 'bg-green-500 text-white'
                      : currentTheme === 'dark'
                      ? 'bg-gray-700 text-gray-400'
                      : currentTheme === 'eyeCare'
                      ? 'bg-[#D4C3AA] text-[#433422]'
                      : 'bg-gray-200 text-gray-400'
                  }`}>
                    {step.number < activeStep ? '✓' : step.number}
                  </div>
                  <span className="text-xs md:text-sm mt-1">{step.title}</span>
                </div>
                {index !== steps.length - 1 && (
                  <div className={`h-px w-full ${
                    step.number < activeStep
                      ? 'bg-green-500'
                      : currentTheme === 'dark'
                      ? 'bg-gray-700'
                      : currentTheme === 'eyeCare'
                      ? 'bg-[#D4C3AA]'
                      : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {activeStep === 1 && (
                <ShippingForm 
                  formData={formData}
                  setFormData={setFormData}
                  onNext={() => setActiveStep(2)}
                  currentTheme={currentTheme}
                  isMobile={isMobile}
                  savedAddresses={savedAddresses}
                />
              )}
              {activeStep === 2 && (
                <PaymentForm 
                  formData={formData}
                  setFormData={setFormData}
                  onNext={() => setActiveStep(3)}
                  onBack={() => setActiveStep(1)}
                  currentTheme={currentTheme}
                  isMobile={isMobile}
                />
              )}
              {activeStep === 3 && (
                <ReviewSection 
                  formData={formData}
                  cartItems={items}
                  onBack={() => setActiveStep(2)}
                  loading={loading}
                  setLoading={setLoading}
                  currentTheme={currentTheme}
                  isMobile={isMobile}
                  onPlaceOrder={handlePlaceOrder}
                />
              )}
            </div>
            
            {/* Desktop Order Summary */}
            <div className="hidden lg:block">
              <OrderSummary 
                cartItems={items} 
                subtotal={subtotal}
                shipping={shipping}
                total={total}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Order Summary */}
      {isMobile && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className={`fixed bottom-0 left-0 right-0 px-4 py-3 z-50 ${
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
              <span className="text-lg font-semibold">{formatCurrency(finalAmount)}</span>
            </div>
            <div className="text-sm opacity-70">
              {`Delivery: ${formatCurrency(deliveryPrice)}`}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CheckoutPage; 