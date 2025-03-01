import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import {
  RiNotification3Line,
  RiUserSettingsLine,
  RiDeleteBinLine,
  RiMailLine,
  RiSmartphoneLine,
  RiAlertLine,
  RiCheckLine,
} from 'react-icons/ri';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createAPI, notificationAPI } from '../../utils/api';
import { toast } from 'sonner';

const Settings = () => {
  const { theme, currentTheme } = useTheme();
  const [searchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState('account');
  const [notificationSettings, setNotificationSettings] = useState({
    orderUpdates: true,
    promotions: false,
    priceAlerts: true
  });
  const { user, updateUser, token } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: ''
  });

  // Add loading state for notifications
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  // Add state for delete account
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const section = searchParams.get('section');
    if (section && settingsSections.some(s => s.id === section)) {
      setActiveSection(section);
    }
  }, [searchParams]);

  useEffect(() => {
    // Load user data when component mounts
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || ''
      });
    }
  }, [user]);

  // Load notification preferences when component mounts
  useEffect(() => {
    const loadNotificationPreferences = async () => {
      try {
        const api = createAPI(token);
        const response = await api.get('/notifications/preferences');
        if (response.data.success) {
          setNotificationSettings(response.data.preferences);
        }
      } catch (error) {
        console.error('Error loading notification preferences:', error);
        toast.error('Failed to load notification preferences');
      } finally {
        setLoadingNotifications(false);
      }
    };

    if (user) {
      loadNotificationPreferences();
    }
  }, [user, token]);

  const settingsSections = [
    {
      id: 'account',
      name: 'Account Settings',
      icon: <RiUserSettingsLine size={22} />,
      color: currentTheme === 'eyeCare' ? 'from-[#A89078] to-[#8B7355]' : 'from-blue-500 to-indigo-600',
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: <RiNotification3Line size={22} />,
      color: currentTheme === 'eyeCare' ? 'from-[#C1A173] to-[#8B7355]' : 'from-green-500 to-emerald-600',
    },
    {
      id: 'deleteAccount',
      name: 'Delete Account',
      icon: <RiDeleteBinLine size={22} />,
      color: currentTheme === 'eyeCare' ? 'from-[#C17373] to-[#8B5555]' : 'from-red-500 to-rose-600',
    },
  ];

  const inputClasses = `w-full p-3 rounded-xl border ${theme.border} ${theme.background} ${theme.text} 
    focus:outline-none focus:ring-2 ${
      currentTheme === 'eyeCare' 
        ? 'focus:ring-[#A89078]' 
        : currentTheme === 'dark'
        ? 'focus:ring-indigo-500'
        : 'focus:ring-blue-500'
    }`;

  const buttonClasses = `px-6 py-3 rounded-xl font-medium transition-all duration-200 
    ${currentTheme === 'eyeCare' 
      ? 'bg-[#A89078] hover:bg-[#8B7355] text-white' 
      : 'bg-blue-500 hover:bg-blue-600 text-white'}`;

  const labelClasses = `text-sm font-medium ${
    currentTheme === 'dark' 
      ? 'text-gray-300' 
      : currentTheme === 'eyeCare'
      ? 'text-[#433422]'
      : 'text-gray-700'
  }`;

  const descriptionClasses = `text-sm ${
    currentTheme === 'dark' 
      ? 'text-gray-400' 
      : currentTheme === 'eyeCare'
      ? 'text-[#433422]/70'
      : 'text-gray-600'
  }`;

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const api = createAPI(token);
      const response = await api.put('/buyers/profile', formData);

      if (response.data.success) {
        updateUser(response.data.buyer);
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(error.response?.data?.message || 'Error updating profile');
    }
  };

  // Handle notification toggle - Remove admin message creation
  const handleNotificationToggle = async (key) => {
    try {
      const api = createAPI(token);
      const response = await api.put('/notifications/preferences', {
        type: key,
        enabled: !notificationSettings[key]
      });

      if (response.data.success) {
        setNotificationSettings(prev => ({
          ...prev,
          [key]: !prev[key]
        }));

        // Emit an event to refresh notifications in other components
        const event = new CustomEvent('notificationPreferencesChanged', {
          detail: {
            type: key,
            enabled: !notificationSettings[key]
          }
        });
        window.dispatchEvent(event);

        toast.success(`${key} notifications ${!notificationSettings[key] ? 'enabled' : 'disabled'}`);
      }
    } catch (error) {
      console.error('Error updating notification preference:', error);
      toast.error('Failed to update notification preference');
    }
  };

  // Add handleDeleteAccount function
  const handleDeleteAccount = async () => {
    if (!deleteConfirmation) {
      toast.error('Please enter your phone number to confirm');
      return;
    }

    try {
      setIsDeleting(true);
      const api = createAPI(token);
      const response = await api.delete('/buyers/delete-account', {
        data: { phoneNumber: deleteConfirmation }
      });

      if (response.data.success) {
        toast.success('Account deleted successfully');
        // Clear auth context and redirect to home
        updateUser(null);
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Delete account error:', error);
      toast.error(error.response?.data?.message || 'Error deleting account');
    } finally {
      setIsDeleting(false);
    }
  };

  const renderAccountSettings = () => (
    <div className="space-y-8">
      <h2 className={`text-2xl font-bold ${theme.text}`}>Account Settings</h2>
      
      <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className={labelClasses}>First Name</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            className={inputClasses}
          />
        </div>
        <div className="space-y-2">
          <label className={labelClasses}>Last Name</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            className={inputClasses}
          />
        </div>
        <div className="space-y-2">
          <label className={labelClasses}>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={inputClasses}
          />
        </div>
        <div className="space-y-2">
          <label className={labelClasses}>Phone</label>
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            className={inputClasses}
          />
        </div>
        <div className="md:col-span-2 flex justify-end">
          <button type="submit" className={buttonClasses}>
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-8">
      <h2 className={`text-2xl font-bold ${theme.text}`}>Notification Preferences</h2>
      
      <div className="space-y-6">
        {loadingNotifications ? (
          <div className={`p-4 rounded-xl ${theme.card}`}>Loading preferences...</div>
        ) : (
          Object.entries(notificationSettings).map(([key, value]) => (
            <div key={key} 
              className={`p-4 rounded-xl ${theme.card} border ${theme.border} flex items-center justify-between`}
            >
              <div className="space-y-1">
                <h3 className={`font-medium ${theme.text}`}>
                  {key === 'orderUpdates' && 'Order Updates'}
                  {key === 'promotions' && 'Promotional Alerts'}
                  {key === 'priceAlerts' && 'Price Drop Alerts'}
                </h3>
                <p className={descriptionClasses}>
                  {key === 'orderUpdates' && 'Get notified about your order status changes'}
                  {key === 'promotions' && 'Receive notifications about special offers and deals'}
                  {key === 'priceAlerts' && 'Get alerts when items in your wishlist drop in price'}
                </p>
              </div>
              <button
                onClick={() => handleNotificationToggle(key)}
                className={`w-14 h-7 rounded-full transition-all duration-300 ${
                  value 
                    ? currentTheme === 'eyeCare' 
                      ? 'bg-[#A89078]' 
                      : 'bg-green-500'
                    : currentTheme === 'dark'
                    ? 'bg-gray-700'
                    : 'bg-gray-200'
                }`}
              >
                <motion.div
                  animate={{ x: value ? 28 : 2 }}
                  className={`w-6 h-6 rounded-full ${theme.card} shadow-md`}
                />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderDeleteAccount = () => (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-red-500">Delete Account</h2>
      
      <div className={`p-6 rounded-xl ${theme.card} border border-red-200 space-y-6`}>
        <div className={`p-4 ${
          currentTheme === 'dark' 
            ? 'bg-red-900/20 text-red-400' 
            : 'bg-red-50 text-red-700'
        } rounded-lg flex items-start gap-3`}>
          <RiAlertLine className="mt-1" size={20} />
          <div>
            <h4 className={`font-medium ${
              currentTheme === 'dark' ? 'text-red-400' : 'text-red-700'
            }`}>
              Warning: This action cannot be undone
            </h4>
            <p className={`text-sm mt-1 ${
              currentTheme === 'dark' ? 'text-red-400/80' : 'text-red-600/80'
            }`}>
              All your data, including purchase history and saved preferences, will be permanently deleted.
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Enter your phone number to confirm"
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value)}
            className={inputClasses}
          />
          <button 
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className={`w-full px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors 
              ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isDeleting ? 'Deleting Account...' : 'Permanently Delete My Account'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen pb-20 ${theme.background}`}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className={`text-3xl md:text-4xl font-bold ${theme.text}`}>Settings</h1>
          <p className={descriptionClasses}>
            Manage your account preferences and settings
          </p>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Mobile Navigation */}
          <div className="lg:hidden flex overflow-x-auto pb-4 gap-4">
            {settingsSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-3 p-3 rounded-xl whitespace-nowrap transition-all
                  ${activeSection === section.id 
                    ? `${theme.card} shadow-lg` 
                    : 'opacity-70'
                  }`}
              >
                <div className={`p-2 rounded-lg bg-gradient-to-br ${section.color} text-white`}>
                  {section.icon}
                </div>
                <span className={`font-medium ${theme.text}`}>{section.name}</span>
              </button>
            ))}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:block lg:col-span-3 space-y-3">
            {settingsSections.map((section) => (
              <motion.button
                key={section.id}
                whileHover={{ x: 4 }}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all
                  ${activeSection === section.id 
                    ? `${theme.card} shadow-lg` 
                    : 'hover:opacity-80'
                  }`}
              >
                <div className={`p-2 rounded-lg bg-gradient-to-br ${section.color} text-white`}>
                  {section.icon}
                </div>
                <span className={`font-medium ${theme.text}`}>{section.name}</span>
              </motion.button>
            ))}
          </div>

          {/* Content */}
          <div className={`lg:col-span-9 p-6 rounded-2xl ${theme.card} border ${theme.border}`}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {activeSection === 'account' && renderAccountSettings()}
              {activeSection === 'notifications' && renderNotificationSettings()}
              {activeSection === 'deleteAccount' && renderDeleteAccount()}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 