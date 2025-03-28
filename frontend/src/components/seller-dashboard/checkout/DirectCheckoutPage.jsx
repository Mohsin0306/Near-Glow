import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../../context/ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { RiArrowLeftLine } from 'react-icons/ri';
import ShippingForm from './ShippingForm';
import PaymentForm from './PaymentForm';
import DirectReviewSection from './DirectReviewSection';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { formatCurrency, orderAPI } from '../../../utils/api';

const DirectCheckoutPage = () => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { product, subtotal, shipping = 0 } = location.state || {};
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const { user } = useAuth();
  const [deliveryPrice, setDeliveryPrice] = useState(shipping || 0);
  const [finalAmount, setFinalAmount] = useState((subtotal || 0) + (shipping || 0));

  // Add state for saved addresses
  const [savedAddresses, setSavedAddresses] = useState([]);

  // Fetch saved addresses
  useEffect(() => {
    const fetchSavedAddresses = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await orderAPI.getSavedAddresses(token);
        if (response.data.success && response.data.address) {
          setSavedAddresses([response.data.address]);
        }
      } catch (error) {
        console.error('Error fetching saved addresses:', error);
      }
    };

    fetchSavedAddresses();
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Validate product data
  useEffect(() => {
    if (!product) {
      toast.error('Product information is missing');
      navigate('/');
    }
  }, [product, navigate]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
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
      
      // Make sure we have the product ID
      const productId = product.id || product._id;
      
      // Prepare color data for API
      let selectedColor = null;
      if (product.selectedColor) {
        selectedColor = product.selectedColor.name;
      }
      
      // Make sure all shipping address fields are included
      const completeOrderData = {
        productId,
        quantity: product.quantity || 1,
        selectedColor,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        zipCode: formData.zipCode,
        paymentMethod: formData.paymentMethod || 'cod',
        useReferralCoins: orderData.useReferralCoins
      };
      
      console.log('Sending order data:', completeOrderData);
      
      const response = await orderAPI.createDirectOrder({
        ...completeOrderData
      }, token);
      
      if (response.data.success) {
        // Store the order ID in localStorage for the confirmation page
        localStorage.setItem('lastOrderId', response.data.orderId);
        
        // Navigate to order confirmation
        navigate(`/order-confirmation/${response.data.orderId}`);
      } else {
        toast.error(response.data.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('Order creation error:', error);
      toast.error(error.response?.data?.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen pb-20 ${
      currentTheme === 'dark' ? 'bg-gray-900 text-white' 
      : currentTheme === 'eyeCare' ? 'bg-[#F5E6D3] text-[#433422]'
      : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
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

          {/* Steps */}
          <div className="flex justify-between mb-8">
            {steps.map((step) => (
              <div key={step.number} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                  step.number === activeStep
                    ? currentTheme === 'dark'
                      ? 'bg-white text-gray-900'
                      : currentTheme === 'eyeCare'
                      ? 'bg-[#433422] text-[#F5E6D3]'
                      : 'bg-gray-900 text-white'
                    : step.number < activeStep
                    ? currentTheme === 'dark'
                      ? 'bg-green-500 text-white'
                      : currentTheme === 'eyeCare'
                      ? 'bg-[#6B5D4D] text-[#F5E6D3]'
                      : 'bg-green-500 text-white'
                    : currentTheme === 'dark'
                    ? 'bg-gray-700 text-gray-400'
                    : currentTheme === 'eyeCare'
                    ? 'bg-[#E6D5B8] text-[#6B5D4D]'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step.number < activeStep ? '✓' : step.number}
                </div>
                <span className={`text-sm ${
                  step.number === activeStep
                    ? 'font-medium'
                    : 'opacity-70'
                }`}>
                  {step.title}
                </span>
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
                <DirectReviewSection 
                  formData={formData}
                  product={product}
                  onBack={() => setActiveStep(2)}
                  loading={loading}
                  setLoading={setLoading}
                  currentTheme={currentTheme}
                  isMobile={isMobile}
                  onPlaceOrder={handlePlaceOrder}
                  deliveryPrice={deliveryPrice}
                  setDeliveryPrice={setDeliveryPrice}
                  finalAmount={finalAmount}
                  setFinalAmount={setFinalAmount}
                />
              )}
            </div>
            
            <div className="hidden lg:block">
              {/* Order Summary */}
              <div className={`p-6 rounded-xl ${
                currentTheme === 'dark' 
                  ? 'bg-gray-800/50 backdrop-blur-xl border border-gray-700' 
                  : currentTheme === 'eyeCare' 
                  ? 'bg-[#E6D5BC]/50 backdrop-blur-xl border border-[#D4C3AA]'
                  : 'bg-white/50 backdrop-blur-xl border border-gray-100'
              }`}>
                <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
                
                {/* Product */}
                <div className="flex gap-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                    <img 
                      src={product?.media?.[0]?.url || '/placeholder.png'} 
                      alt={product?.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm line-clamp-2">{product?.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs opacity-70">Qty: {product?.quantity}</span>
                      {product?.selectedColor && (
                        <span className="text-xs opacity-70">
                          Color: {product.selectedColor.name}
                        </span>
                      )}
                    </div>
                    <div className="mt-1">
                      <span className="font-medium">{formatCurrency((product?.salePrice || product?.price) * product?.quantity)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Amounts */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="opacity-60">Subtotal</span>
                    <span>{formatCurrency((product?.salePrice || product?.price) * product?.quantity)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="opacity-60">Delivery</span>
                    <span>{formatCurrency(deliveryPrice)}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span>Total</span>
                    <span>{formatCurrency(finalAmount)}</span>
                  </div>
                </div>
              </div>
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
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm opacity-70">Total:</span>
                <span className="text-lg font-semibold">{formatCurrency(finalAmount)}</span>
              </div>
              <div className="text-sm opacity-70">
                {`Delivery: ${formatCurrency(deliveryPrice)}`}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DirectCheckoutPage; 