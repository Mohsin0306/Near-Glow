import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { RiArrowLeftLine } from 'react-icons/ri';
import ShippingForm from './ShippingForm';
import PaymentForm from './PaymentForm';
import ReviewSection from './ReviewSection';
import OrderSummary from './OrderSummary';
import { useAuth } from '../../../context/AuthContext';

const CheckoutPage = ({ cartItems }) => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const { userId } = useAuth();


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

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    zipCode: '',
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  });

  const steps = [
    { number: 1, title: 'Shipping' },
    { number: 2, title: 'Payment' },
    { number: 3, title: 'Review' }
  ];

  // Calculate total for mobile summary
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 150 ? 0 : 12.00;
  const total = subtotal + shipping;

  const handleOrderSuccess = (orderData) => {
    navigate(`/${userId}/checkout/confirmation`, { 
      state: { 
        order: orderData // Pass the complete order data
      }
    });
  };

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
                  cartItems={cartItems}
                  onBack={() => setActiveStep(2)}
                  loading={loading}
                  setLoading={setLoading}
                  currentTheme={currentTheme}
                  isMobile={isMobile}
                  onOrderSuccess={handleOrderSuccess}
                />
              )}
            </div>
            
            {/* Desktop Order Summary */}
            <div className="hidden lg:block">
              <OrderSummary cartItems={cartItems} currentTheme={currentTheme} />
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
              <span className="text-lg font-semibold">${total.toFixed(2)}</span>
            </div>
            <div className="text-sm opacity-70">
              {shipping === 0 ? 'Free Shipping' : `+$${shipping} Shipping`}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CheckoutPage; 