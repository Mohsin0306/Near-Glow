import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { RiUser3Line, RiMailLine, RiPhoneLine, RiMapPinLine, RiCalendarLine } from 'react-icons/ri';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';

const CustomerList = ({ customers, selectedUsers, onUserSelect, selectable = false }) => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    });
  };

  const handleCustomerClick = (customer) => {
    if (selectable) {
      onUserSelect(customer._id);
    } else if (isAuthenticated && user?._id) {
      navigate(`/${user._id}/admin/customers/${customer._id}`);
    }
  };

  return (
    <div className={`w-full ${
      currentTheme === 'dark'
        ? 'bg-gray-800/80'
        : currentTheme === 'eyeCare'
        ? 'bg-[#E6D5BC]'
        : 'bg-white'
    } rounded-xl shadow-sm`}>
      <div className="divide-y divide-gray-200/20">
        {customers.map((customer, index) => (
          <motion.div
            key={customer._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => handleCustomerClick(customer)}
            className={`cursor-pointer transition-colors ${
              selectedUsers?.has(customer._id)
                ? currentTheme === 'dark'
                  ? 'bg-blue-600/20'
                  : 'bg-blue-50'
                : ''
            }`}
          >
            <div className={`p-4 flex items-center gap-4 ${
              currentTheme === 'dark'
                ? 'hover:bg-gray-700/50'
                : currentTheme === 'eyeCare'
                ? 'hover:bg-[#D4C4A9]/50'
                : 'hover:bg-gray-50'
            }`}>
              {/* Profile Picture */}
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                {customer.profilePicture?.url ? (
                  <img 
                    src={customer.profilePicture.url} 
                    alt={customer.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${
                    currentTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <RiUser3Line className="text-gray-400" />
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${
                  currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {customer.name}
                </p>
                <p className={`text-sm truncate ${
                  currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {customer.email}
                </p>
              </div>

              {/* Selection Indicator */}
              {selectable && (
                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                  selectedUsers?.has(customer._id)
                    ? 'bg-blue-500 border-blue-500'
                    : currentTheme === 'dark'
                    ? 'border-gray-600'
                    : 'border-gray-300'
                }`}>
                  {selectedUsers?.has(customer._id) && (
                    <svg className="w-full h-full text-white p-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CustomerList;