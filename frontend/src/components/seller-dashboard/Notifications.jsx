import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { createAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
  RiNotification3Line,
  RiMailLine,
  RiShoppingBagLine,
  RiHeartLine,
  RiCheckDoubleLine,
  RiTimeLine,
  RiDeleteBinLine,
  RiFilterLine,
  RiSearchLine,
  RiInboxUnarchiveLine,
  RiCloseLine
} from 'react-icons/ri';
import socketService from '../../services/socketService';
import { toast } from 'react-hot-toast';

const Notifications = () => {
  const { currentTheme } = useTheme();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const api = createAPI(localStorage.getItem('authToken'));

  const getThemeStyles = () => ({
    background: currentTheme === 'dark' ? 'bg-gray-900' 
      : currentTheme === 'eyeCare' ? 'bg-[#F5E6D3]' 
      : 'bg-gray-50',
    text: currentTheme === 'dark' ? 'text-white' 
      : currentTheme === 'eyeCare' ? 'text-[#433422]' 
      : 'text-gray-900',
    card: currentTheme === 'dark' ? 'bg-gray-800' 
      : currentTheme === 'eyeCare' ? 'bg-[#E6D5BC]' 
      : 'bg-white',
    border: currentTheme === 'dark' ? 'border-gray-700' 
      : currentTheme === 'eyeCare' ? 'border-[#D4C3AA]' 
      : 'border-gray-200',
    button: currentTheme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' 
      : currentTheme === 'eyeCare' ? 'bg-[#C1A173] hover:bg-[#B39164]' 
      : 'bg-white hover:bg-gray-50',
  });

  const styles = getThemeStyles();

  const fetchNotifications = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      const newPage = reset ? 1 : page;
      
      // First get user preferences
      const prefsResponse = await api.get('/notifications/preferences');
      const preferences = prefsResponse.data.preferences;

      const response = await api.get(`/notifications?page=${newPage}&filter=${filter}&search=${searchQuery}`);
      
      if (response.data.success) {
        const newNotifications = response.data.notifications.filter(notification => {
          // Filter notifications based on user preferences
          switch (notification.type) {
            case 'ORDER_STATUS':
            case 'NEW_ORDER':
              return preferences.orderUpdates;
            case 'PRICE_DROP':
              return preferences.priceAlerts;
            case 'PROMOTION':
              return preferences.promotions;
            default:
              return true; // Show other types by default
          }
        });

        setNotifications(prev => reset ? newNotifications : [...prev, ...newNotifications]);
        setHasMore(response.data.hasMore);
        if (!reset) setPage(newPage + 1);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [page, filter, searchQuery]);

  useEffect(() => {
    fetchNotifications(true);
  }, [filter, searchQuery]);

  useEffect(() => {
    // Update unread count
    const count = notifications.filter(n => !n.read).length;
    setUnreadCount(count);
    
    // Update document title with unread count
    document.title = count > 0 ? `(${count}) New Notifications` : 'Notifications';
    
    return () => {
      document.title = 'Perfume Store'; // Reset title on unmount
    };
  }, [notifications]);

  useEffect(() => {
    // Request notification permission when component mounts
    if ('Notification' in window) {
      Notification.requestPermission();
    }

    // Connect to socket and listen for notifications
    if (user?._id) {
      const socket = socketService.connect(user._id);
      
      const handleNewNotification = (notification) => {
        setNotifications(prev => {
          // Check if notification already exists
          const exists = prev.some(n => n._id === notification._id);
          if (exists) return prev;
          return [notification, ...prev];
        });
      };

      const cleanup = socketService.onNotification(handleNewNotification);

      // Fetch initial notifications
      fetchNotifications(true);

      return () => {
        cleanup();
        socketService.disconnect();
      };
    }
  }, [user?._id]); // Only re-run if user ID changes

  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`);
      if (response.data.success) {
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId 
              ? { ...notif, read: true }
              : notif
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      if (response.data.success) {
        setNotifications(prev => 
          prev.filter(notif => notif._id !== notificationId)
        );
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationColor = (color) => {
    const colors = {
      blue: currentTheme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600',
      green: currentTheme === 'dark' ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600',
      red: currentTheme === 'dark' ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600',
    };
    return colors[color] || colors.blue;
  };

  // Optimized animation variants
  const filterPanelVariants = {
    hidden: { 
      opacity: 0,
      y: -8,
      height: 0,
      transition: {
        duration: 0.15,
        ease: [0.4, 0, 0.2, 1],
        opacity: { duration: 0.1 }
      }
    },
    visible: { 
      opacity: 1,
      y: 0,
      height: "auto",
      transition: {
        duration: 0.2,
        ease: [0.4, 0, 0.2, 1],
        opacity: { duration: 0.15 }
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.2,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };

  const getTextColor = (type = 'primary') => {
    switch(type) {
      case 'primary':
        return currentTheme === 'dark' ? 'text-gray-100' : 'text-gray-900';
      case 'secondary':
        return currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700';
      case 'tertiary':
        return currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500';
      default:
        return currentTheme === 'dark' ? 'text-gray-100' : 'text-gray-900';
    }
  };

  // Early return for loading state
  if (loading && (!notifications || notifications.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen p-3 md:p-6 ${styles.background}`}
    >
      {/* Compact Header */}
      <motion.div 
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="mb-4"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2.5 rounded-xl ${styles.card} ${styles.border} shadow-sm`}>
            <RiInboxUnarchiveLine className={`w-5 h-5 ${getTextColor('primary')}`} />
          </div>
          <div>
            <h1 className={`text-xl md:text-2xl font-bold ${getTextColor('primary')}`}>
              Notifications
            </h1>
            <p className={`text-xs md:text-sm ${getTextColor('tertiary')}`}>
              Stay updated with your latest activities
            </p>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="space-y-3">
          <div className="flex gap-2 w-full">
            <div className="relative flex-1">
              <RiSearchLine className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${getTextColor('tertiary')}`} />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 text-sm rounded-xl border ${styles.border} ${styles.card}
                  focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${getTextColor('primary')}`}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.1 }}
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2 rounded-xl border ${styles.border} ${styles.button}
                flex items-center justify-center gap-1.5 min-w-[90px]`}
            >
              <RiFilterLine className="w-4 h-4" />
              <span className="text-sm">Filter</span>
            </motion.button>
          </div>

          {/* Optimized Filter Panel Animation */}
          <AnimatePresence mode="wait">
            {showFilters && (
              <motion.div
                variants={filterPanelVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className={`w-full rounded-xl border ${styles.border} ${styles.card} shadow-sm
                  overflow-hidden`}
              >
                <div className="p-3">
                  <div className="flex flex-wrap gap-2">
                    {['All', 'Unread', 'Messages', 'Orders'].map((type) => (
                      <motion.button
                        key={type}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.1 }}
                        onClick={() => setFilter(type.toLowerCase())}
                        className={`px-3 py-1.5 text-xs rounded-lg transition-colors duration-200
                          ${filter === type.toLowerCase() 
                            ? 'bg-blue-500 text-white' 
                            : `${styles.button} border ${styles.border} ${getTextColor('secondary')}`
                          }`}
                      >
                        {type}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Notifications List with Optimized Animations */}
      <motion.div 
        className="space-y-2"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.05
            }
          }
        }}
      >
        {loading ? (
          // Loading Skeleton
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`h-16 rounded-xl ${styles.card} ${styles.border}`} />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          // Empty State
          <motion.div 
            variants={cardVariants}
            className={`py-6 text-center ${styles.card} rounded-xl border ${styles.border}`}
          >
            <RiNotification3Line className={`mx-auto h-8 w-8 ${getTextColor('tertiary')}`} />
            <h3 className={`mt-2 text-sm font-medium ${getTextColor('primary')}`}>
              No Notifications
            </h3>
            <p className={`mt-1 text-xs ${getTextColor('tertiary')}`}>
              You're all caught up!
            </p>
          </motion.div>
        ) : (
          // Notification Cards with Optimized Animations
          notifications.map((notification) => (
            <motion.div
              key={notification._id}
              variants={cardVariants}
              className={`p-3 rounded-xl border ${styles.border} ${styles.card}
                ${!notification.read ? 'border-l-4 border-l-blue-500' : ''}
                hover:shadow-sm transition-all duration-200`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg shrink-0 ${getNotificationColor(notification.color)}`}>
                  {notification.type === 'message' && <RiMailLine className="w-4 h-4" />}
                  {notification.type === 'order' && <RiShoppingBagLine className="w-4 h-4" />}
                  {notification.type === 'wishlist' && <RiHeartLine className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`text-sm font-medium ${getTextColor('primary')} line-clamp-1`}>
                      {notification.title}
                    </h3>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs ${getTextColor('tertiary')}`}>
                        {notification.createdAt}
                      </span>
                      {!notification.read && (
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      )}
                    </div>
                  </div>
                  <p className={`text-xs ${getTextColor('secondary')} line-clamp-1 mt-0.5`}>
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <button className={`text-xs flex items-center gap-1 transition-colors duration-200
                      ${getTextColor('tertiary')} hover:${getTextColor('primary')}`}
                      onClick={() => handleMarkAsRead(notification._id)}
                    >
                      <RiCheckDoubleLine className="w-3.5 h-3.5" />
                      Mark as read
                    </button>
                    <button className={`text-xs flex items-center gap-1 transition-colors duration-200
                      ${getTextColor('tertiary')} hover:${getTextColor('primary')}`}
                      onClick={() => handleDelete(notification._id)}
                    >
                      <RiDeleteBinLine className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>
    </motion.div>
  );
};

export default Notifications; 