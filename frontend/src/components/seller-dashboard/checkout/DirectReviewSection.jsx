import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RiArrowLeftLine, RiShieldCheckLine } from 'react-icons/ri';
import { useAuth } from '../../../context/AuthContext';
import { orderAPI } from '../../../utils/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../../../utils/api';

const ReviewSection = ({ 
  formData, 
  product, 
  onBack, 
  loading, 
  setLoading, 
  currentTheme, 
  isMobile, 
  onPlaceOrder,
  deliveryPrice,
  setDeliveryPrice,
  finalAmount,
  setFinalAmount
}) => {
  const navigate = useNavigate();
  const { userId } = useAuth();

  const [useReferralCoins, setUseReferralCoins] = useState(false);
  const [referralDiscount, setReferralDiscount] = useState(0);
  const [availableCoins, setAvailableCoins] = useState(0);

  useEffect(() => {
    const fetchReferralCoins = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await orderAPI.calculateReferralDiscount(
          (product.salePrice || product.price) * product.quantity,
          token
        );
        setAvailableCoins(response.data.availableCoins);
        setReferralDiscount(response.data.maxDiscount);
      } catch (error) {
        console.error('Error fetching referral coins:', error);
      }
    };

    fetchReferralCoins();
  }, [product]);

  useEffect(() => {
    // Update final amount when referral discount changes
    const newFinalAmount = useReferralCoins 
      ? (product.salePrice || product.price) * product.quantity + deliveryPrice - referralDiscount 
      : (product.salePrice || product.price) * product.quantity + deliveryPrice;
    
    setFinalAmount(newFinalAmount);
  }, [useReferralCoins, referralDiscount, product, deliveryPrice, setFinalAmount]);

  const handlePlaceOrder = () => {
    onPlaceOrder({
      ...formData,
      useReferralCoins,
      referralDiscount
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Order Items */}
      <div className={`p-6 rounded-xl ${
        currentTheme === 'dark' 
          ? 'bg-gray-800/50 backdrop-blur-xl border border-gray-700' 
          : currentTheme === 'eyeCare' 
          ? 'bg-[#E6D5BC]/50 backdrop-blur-xl border border-[#D4C3AA]'
          : 'bg-white/50 backdrop-blur-xl border border-gray-100'
      }`}>
        <h2 className="text-lg font-semibold mb-4">Order Item</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <img 
              src={product.selectedColor?.media?.url || product.media?.[0]?.url || '/placeholder.png'} 
              alt={product.name} 
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div className="flex-1">
              <h3 className="font-medium">{product.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs opacity-70">Qty: {product.quantity}</span>
                {product.selectedColor && (
                  <span className="text-xs opacity-70">
                    Color: {product.selectedColor.name}
                  </span>
                )}
              </div>
              <div className="mt-1">
                <span className="font-medium">{formatCurrency((product.salePrice || product.price) * product.quantity)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shipping Details */}
      <div className={`p-6 rounded-xl mt-4 ${
        currentTheme === 'dark' 
          ? 'bg-gray-800/50 backdrop-blur-xl border border-gray-700' 
          : currentTheme === 'eyeCare' 
          ? 'bg-[#E6D5BC]/50 backdrop-blur-xl border border-[#D4C3AA]'
          : 'bg-white/50 backdrop-blur-xl border border-gray-100'
      }`}>
        <h2 className="text-lg font-semibold mb-4">Shipping Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className={`text-sm ${
              currentTheme === 'dark' ? 'text-gray-400' 
              : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]'
              : 'text-gray-600'
            }`}>Name</p>
            <p className="font-medium">{formData.firstName} {formData.lastName}</p>
          </div>
          <div>
            <p className={`text-sm ${
              currentTheme === 'dark' ? 'text-gray-400' 
              : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]'
              : 'text-gray-600'
            }`}>Phone</p>
            <p className="font-medium">{formData.phone}</p>
          </div>
          <div className="col-span-2">
            <p className={`text-sm ${
              currentTheme === 'dark' ? 'text-gray-400' 
              : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]'
              : 'text-gray-600'
            }`}>Email</p>
            <p className="font-medium">{formData.email}</p>
          </div>
          <div className="col-span-2">
            <p className={`text-sm ${
              currentTheme === 'dark' ? 'text-gray-400' 
              : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]'
              : 'text-gray-600'
            }`}>Address</p>
            <p className="font-medium">{formData.address}, {formData.city}, {formData.zipCode}</p>
          </div>
          <div>
            <p className={`text-sm ${
              currentTheme === 'dark' ? 'text-gray-400' 
              : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]'
              : 'text-gray-600'
            }`}>Payment Method</p>
            <p className="font-medium">{formData.paymentMethod === 'cod' ? 'Cash on Delivery' : formData.paymentMethod}</p>
          </div>
        </div>
      </div>

      {/* Referral Coins */}
      <div className={`p-6 rounded-xl mt-4 ${
        currentTheme === 'dark' 
          ? 'bg-gray-800/50 backdrop-blur-xl border border-gray-700' 
          : currentTheme === 'eyeCare' 
          ? 'bg-[#E6D5BC]/50 backdrop-blur-xl border border-[#D4C3AA]'
          : 'bg-white/50 backdrop-blur-xl border border-gray-100'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-medium">Use Referral Coins</h3>
            <p className={`text-sm ${
              currentTheme === 'dark' ? 'text-gray-400' 
              : currentTheme === 'eyeCare' ? 'text-[#6B5D4D]'
              : 'text-gray-600'
            }`}>
              Available: {availableCoins} coins
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={useReferralCoins}
              onChange={(e) => setUseReferralCoins(e.target.checked)}
              className="sr-only peer"
              disabled={!availableCoins}
            />
            <div className={`w-11 h-6 rounded-full peer ${
              !availableCoins ? 'opacity-50' : ''
            } ${
                currentTheme === 'dark'
                ? 'bg-gray-700 peer-checked:bg-blue-600'
                : currentTheme === 'eyeCare'
                ? 'bg-[#D4C3AA] peer-checked:bg-[#433422]'
                : 'bg-gray-200 peer-checked:bg-blue-600'
            } peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
          </label>
        </div>
        {useReferralCoins && (
          <div className="text-sm text-green-500">
            Discount: -{formatCurrency(referralDiscount)}
          </div>
        )}
      </div>

      {/* Amounts */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between text-sm">
          <span className="opacity-60">Subtotal (1 item)</span>
          <span>{formatCurrency((product.salePrice || product.price) * product.quantity)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="opacity-60">Delivery Fee</span>
          <span>{formatCurrency(deliveryPrice)}</span>
        </div>
        {useReferralCoins && (
          <div className="flex justify-between text-sm text-green-500">
            <span>Referral Discount</span>
            <span>-{formatCurrency(referralDiscount)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-lg pt-2 border-t border-gray-200 dark:border-gray-700">
          <span>Total</span>
          <span>{formatCurrency(finalAmount)}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onBack}
          disabled={loading}
          className={`py-3 px-4 rounded-xl font-medium flex items-center gap-1.5 ${
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
          onClick={handlePlaceOrder}
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