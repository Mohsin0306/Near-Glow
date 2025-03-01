import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { RiNotification2Line, RiSendPlaneLine, RiUserLine, RiGroupLine, RiCloseLine, RiSearchLine, RiInboxLine } from 'react-icons/ri';
import { notificationAPI } from '../../../utils/api';
import CustomerList from '../customers/CustomerList';
import { useTheme } from '../../../context/ThemeContext';
import NotificationTabs from './NotificationTabs';

const AdminNotifications = () => {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    recipientIds: [], // Changed to array for multiple recipients
    type: 'ADMIN_MESSAGE'
  });
  const [loading, setLoading] = useState(false);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const { user } = useAuth();
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (showUserSelector) {
      fetchCustomers();
    }
  }, [showUserSelector]);

  const fetchCustomers = async () => {
    try {
      const response = await notificationAPI.getCustomers(token);
      if (response.data.success) {
        // Transform the chat data into customer data
        const buyers = response.data.data.map(chat => ({
          _id: chat.buyer._id,
          name: chat.buyer.name,
          username: chat.buyer.username,
          profilePicture: chat.buyer.profilePicture,
          // Add any other fields you want to display
        }));
        
        // Remove duplicates based on _id
        const uniqueBuyers = Array.from(
          new Map(buyers.map(buyer => [buyer._id, buyer])).values()
        );
        
        setCustomers(uniqueBuyers);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to fetch customers');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const toggleUserSelection = (userId) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
    setFormData(prev => ({
      ...prev,
      recipientIds: Array.from(newSelected)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!token) {
      toast.error('Please login to send notifications');
      navigate('/login');
      return;
    }

    if (!formData.title || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const notificationData = {
        title: formData.title,
        message: formData.message,
        recipientIds: showUserSelector ? Array.from(selectedUsers) : [], // Empty array means send to all
        type: 'ADMIN_MESSAGE'
      };

      const response = await notificationAPI.sendAdminMessage(notificationData, token);

      if (response.data.success) {
        toast.success('Notification sent successfully!', {
          id: 'notification-success', // Add unique ID to prevent duplicate toasts
        });
        
        // Reset form
        setFormData({
          title: '',
          message: '',
          recipientIds: [],
          type: 'ADMIN_MESSAGE'
        });
        setSelectedUsers(new Set());
        setShowUserSelector(false);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error(error.response?.data?.message || 'Error sending notification', {
        id: 'notification-error', // Add unique ID to prevent duplicate toasts
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`min-h-screen ${
      currentTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50'
    }`}>
      <NotificationTabs />
      
      <div className="max-w-5xl mx-auto px-4 py-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`rounded-lg border ${
            currentTheme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          } p-4 md:p-6`}
        >
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title Input */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <label className="block text-sm font-medium mb-2">
                  Notification Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className={`w-full px-3 py-2 md:px-4 md:py-3 rounded-lg transition-colors ${
                    currentTheme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-gray-50 border-gray-200'
                  } focus:ring-2 focus:ring-blue-500`}
                  placeholder="Enter notification title"
                />
              </motion.div>

              {/* Message Input */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="block text-sm font-medium mb-2">
                  Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="3"
                  className={`w-full px-3 py-2 md:px-4 md:py-3 rounded-lg transition-colors ${
                    currentTheme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-gray-50 border-gray-200'
                  } focus:ring-2 focus:ring-blue-500`}
                  placeholder="Enter notification message"
                />
              </motion.div>

              {/* Recipient Selection */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-sm font-medium mb-2">
                  Send To
                </label>
                <div className="flex flex-col md:flex-row gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserSelector(false);
                      setSelectedUsers(new Set());
                      setFormData(prev => ({ ...prev, recipientIds: [] }));
                    }}
                    className={`flex-1 flex items-center justify-center px-4 py-3 rounded-xl transition-colors ${
                      !showUserSelector
                        ? 'bg-blue-600 text-white'
                        : currentTheme === 'dark'
                        ? 'bg-gray-700 text-gray-300'
                        : currentTheme === 'eyeCare'
                        ? 'bg-[#D4C4A9] text-[#433422]'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    <RiGroupLine className="mr-2" />
                    All Users
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUserSelector(true)}
                    className={`flex-1 flex items-center justify-center px-4 py-3 rounded-xl transition-colors ${
                      showUserSelector
                        ? 'bg-blue-600 text-white'
                        : currentTheme === 'dark'
                        ? 'bg-gray-700 text-gray-300'
                        : currentTheme === 'eyeCare'
                        ? 'bg-[#D4C4A9] text-[#433422]'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    <RiUserLine className="mr-2" />
                    Select Users ({selectedUsers.size})
                  </button>
                </div>
              </motion.div>

              {/* User Selector Modal */}
              <AnimatePresence>
                {showUserSelector && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 space-y-4">
                      <div className="relative">
                        <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Search users..."
                          className={`w-full pl-10 pr-4 py-3 rounded-xl transition-colors ${
                            currentTheme === 'dark'
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : currentTheme === 'eyeCare'
                              ? 'bg-[#F5E6D3] border-[#433422]/20'
                              : 'bg-gray-50 border-gray-200'
                          } focus:ring-2 focus:ring-blue-500`}
                        />
                      </div>
                      <div className="max-h-96 overflow-y-auto rounded-xl">
                        <CustomerList 
                          customers={filteredCustomers}
                          selectedUsers={selectedUsers}
                          onUserSelect={toggleUserSelection}
                          selectable={true}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex items-center justify-center px-4 py-2 md:px-6 md:py-3 rounded-lg text-white font-medium transition-colors ${
                    loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  <RiSendPlaneLine className="mr-2" />
                  {loading ? 'Sending...' : 'Send Notification'}
                </button>
              </motion.div>
            </form>

            {/* Preview Section */}
            <AnimatePresence>
              {(formData.title || formData.message) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mt-8"
                >
                  <h3 className="text-lg font-medium mb-4">Preview</h3>
                  <div className={`rounded-xl p-4 ${
                    currentTheme === 'dark'
                      ? 'bg-gray-700'
                      : currentTheme === 'eyeCare'
                      ? 'bg-[#D4C4A9]/50'
                      : 'bg-gray-50'
                  }`}>
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <RiNotification2Line className="h-6 w-6 text-blue-500" />
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="font-medium">{formData.title || 'No title'}</p>
                        <p className="mt-1 text-sm opacity-80">{formData.message || 'No message'}</p>
                        <p className="mt-2 text-xs opacity-60">
                          Sending to: {selectedUsers.size > 0 
                            ? `${selectedUsers.size} selected users` 
                            : 'All Users'}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminNotifications;
