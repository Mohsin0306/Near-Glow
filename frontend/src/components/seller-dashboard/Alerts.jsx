import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { recentAPI, createAPI } from '../../utils/api';
import {
  RiNotification3Line,
  RiShoppingBagLine,
  RiHeartLine,
  RiArrowLeftLine,
  RiMailLine,
  RiCheckDoubleLine,
} from 'react-icons/ri';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

const Alerts = () => {
  const { currentTheme } = useTheme();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { type } = useParams();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(type || 'all');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [notificationPreferences, setNotificationPreferences] = useState({
    orderUpdates: true,
    priceAlerts: true,
    promotions: false
  });
  const ITEMS_PER_PAGE = 20;

  // Fetch notifications with pagination and date filter
  const fetchNotifications = async (pageNum = 1, reset = false) => {
    try {
      setLoading(true);
      const api = createAPI(token);
      
      // First get user preferences
      const prefsResponse = await api.get('/notifications/preferences');
      setNotificationPreferences(prefsResponse.data.preferences);

      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const response = await recentAPI.getRecentActivities(token, {
        page: pageNum,
        limit: ITEMS_PER_PAGE,
        after: oneMonthAgo.toISOString()
      });

      if (response.data.success) {
        const newNotifications = response.data.notifications.filter(notification => {
          // Filter notifications based on user preferences
          switch (notification.type) {
            case 'ORDER_STATUS':
            case 'NEW_ORDER':
              return notificationPreferences.orderUpdates;
            case 'PRICE_DROP':
              return notificationPreferences.priceAlerts;
            case 'PROMOTION':
              return notificationPreferences.promotions;
            default:
              return true; // Show other types by default
          }
        });

        setNotifications(prev => reset ? newNotifications : [...prev, ...newNotifications]);
        setHasMore(response.data.hasMore);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error(error.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(1, true);
  }, [token]);

  // Update active tab when route changes
  useEffect(() => {
    if (type) {
      setActiveTab(type);
    }
  }, [type]);

  // Listen for browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event) => {
      if (location.pathname === `/${user?._id}/alerts`) {
        setActiveTab('all');
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [location]);

  // Categories with real-time counts
  const categories = useMemo(() => {
    return [
      {
        id: 'orders',
        label: 'Orders',
        description: 'Track orders',
        icon: RiShoppingBagLine,
        count: notificationPreferences.orderUpdates ? 
          notifications.filter(n => n.type === 'ORDER_STATUS' && !n.read).length : 0,
        path: `/${user?._id}/alerts/orders`,
        color: currentTheme === 'eyeCare' ? 'bg-[#B59B6D]' : 'bg-purple-500'
      },
      {
        id: 'notifications',
        label: 'Notifications',
        description: 'Updates',
        icon: RiNotification3Line,
        count: notificationPreferences.priceAlerts ? 
          notifications.filter(n => (n.type === 'PRICE_DROP' || n.type === 'STOCK_UPDATE') && !n.read).length : 0,
        path: `/${user?._id}/alerts/notifications`,
        color: currentTheme === 'eyeCare' ? 'bg-[#C1A173]' : 'bg-green-500'
      },
      {
        id: 'wishlist',
        label: 'Wishlist',
        description: 'Saved items',
        icon: RiHeartLine,
        count: notifications.filter(n => n.type === 'WISHLIST' && !n.read).length,
        path: `/${user?._id}/alerts/wishlist`,
        color: currentTheme === 'eyeCare' ? 'bg-[#C17373]' : 'bg-red-500'
      }
    ];
  }, [notifications, notificationPreferences, currentTheme, user]);

  // Handle category click
  const handleCategoryClick = (path) => {
    navigate(path);
  };

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    try {
      // Mark notification as read
      await recentAPI.markAsRead(notification._id, token);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n)
      );

      // Debug log to see notification structure
      console.log('Notification data:', notification);

      // Navigate based on notification type
      switch (notification.type) {
        case 'ORDER_STATUS':
          // Check if orderId exists in data and navigate
          if (notification.data?.orderId?._id) {
            navigate(`/${user._id}/alerts/orders/${notification.data.orderId._id}`);
          } else if (notification.data?.orderId) {
            // If orderId is a string
            navigate(`/${user._id}/alerts/orders/${notification.data.orderId}`);
          } else {
            console.error('Invalid order ID in notification:', notification);
            toast.error('Invalid order reference');
          }
          break;
        case 'PRICE_DROP':
        case 'STOCK_UPDATE':
        case 'WISHLIST':
        case 'ADMIN_MESSAGE':
          // Navigate to NotificationDetail page
          navigate(`/${user._id}/alerts/notifications/${notification._id}`);
          break;
        default:
          console.warn('Unknown notification type:', notification.type);
          toast.error('Unknown notification type');
      }
    } catch (error) {
      console.error('Error handling notification:', error);
      toast.error('Failed to process notification');
    }
  };

  const handleBack = () => {
    navigate(`/${user?._id}/alerts`, { 
      replace: true,
      state: { preserveScroll: true }
    });
  };

  // Handle load more
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNotifications(nextPage);
    }
  };

  // Handle clear all
  const handleClearAll = async () => {
    try {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      await recentAPI.clearRecentActivities(token, {
        before: new Date().toISOString()
      });

      setNotifications([]);
      toast.success('Recent activities cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast.error('Failed to clear notifications');
    }
  };

  // Handle mark as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      await recentAPI.markAsRead(notificationId, token);
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === notificationId
            ? { ...notif, isRead: true }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  // Get notification icon and color
  const getNotificationDetails = (type) => {
    const details = {
      ORDER_STATUS: {
        icon: RiShoppingBagLine,
        color: currentTheme === 'eyeCare' ? 'bg-[#B59B6D]' : 'bg-purple-500'
      },
      ADMIN_MESSAGE: {
        icon: RiMailLine,
        color: currentTheme === 'eyeCare' ? 'bg-[#C1A173]' : 'bg-blue-500'
      },
      PRICE_DROP: {
        icon: RiNotification3Line,
        color: currentTheme === 'eyeCare' ? 'bg-[#C1A173]' : 'bg-green-500'
      },
      STOCK_UPDATE: {
        icon: RiHeartLine,
        color: currentTheme === 'eyeCare' ? 'bg-[#C17373]' : 'bg-red-500'
      }
    };
    return details[type] || details.ADMIN_MESSAGE;
  };

  return (
    <div className={`min-h-screen ${
      currentTheme === 'dark' ? 'bg-gray-900 text-white' 
      : currentTheme === 'eyeCare' ? 'bg-[#F5E6D3] text-[#433422]'
      : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Back Button for sub-routes */}
        {location.pathname.split('/').length > 2 && (
          <button
            onClick={handleBack}
            className={`flex items-center gap-2 mb-6 px-3 py-2 rounded-lg transition-all ${
              currentTheme === 'dark' 
                ? 'hover:bg-gray-800' 
                : currentTheme === 'eyeCare'
                ? 'hover:bg-[#D4C3AA]'
                : 'hover:bg-gray-100'
            }`}
          >
            <RiArrowLeftLine size={20} />
            <span>Back to Alerts</span>
          </button>
        )}

        {/* Quick Access Categories */}
        <div className="grid grid-cols-4 gap-2 md:gap-4 mb-8">
          {categories.map((category) => (
            <motion.button
              key={category.id}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCategoryClick(category.path)}
              className={`relative p-3 md:p-4 rounded-xl transition-all ${
                category.id === type ? (
                  currentTheme === 'dark'
                    ? 'bg-gray-700'
                    : currentTheme === 'eyeCare'
                    ? 'bg-[#D4C3AA]'
                    : 'bg-gray-100'
                ) : (
                  currentTheme === 'dark'
                    ? 'bg-gray-800 hover:bg-gray-700'
                    : currentTheme === 'eyeCare'
                    ? 'bg-[#E6D5BC] hover:bg-[#D4C3AA]'
                    : 'bg-white hover:bg-gray-50'
                )
              } shadow-sm`}
            >
              {category.count > 0 && (
                <span className={`absolute -top-2 -right-2 w-5 h-5 md:w-6 md:h-6 flex items-center justify-center text-xs font-bold rounded-full text-white ${category.color}`}>
                  {category.count}
                </span>
              )}
              <div className="flex flex-col items-center gap-1 md:gap-2">
                <category.icon size={20} className="md:text-2xl" />
                <div className="text-center">
                  <span className="text-xs md:text-sm font-medium block">{category.label}</span>
                  <span className="hidden md:block text-xs opacity-75">{category.description}</span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Recent Activities Section */}
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl font-semibold">Recent Activities</h2>
            {notifications.length > 0 && (
              <button 
                onClick={handleClearAll}
                className={`px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm rounded-lg transition-all ${
                  currentTheme === 'dark' 
                    ? 'hover:bg-gray-800' 
                    : currentTheme === 'eyeCare'
                    ? 'hover:bg-[#D4C3AA]'
                    : 'hover:bg-gray-100'
                }`}
              >
                Clear All
              </button>
            )}
          </div>

          <AnimatePresence>
            {notifications.map((notification) => {
              const { icon: Icon, color } = getNotificationDetails(notification.type);
              return (
                <motion.div
                  key={notification._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 rounded-xl border cursor-pointer hover:shadow-md transition-all ${
                    currentTheme === 'dark'
                      ? 'bg-gray-800 border-gray-700 hover:bg-gray-750'
                      : currentTheme === 'eyeCare'
                      ? 'bg-[#E6D5BC] border-[#D4C3AA] hover:bg-[#D4C3AA]'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  } ${!notification.isRead ? 'border-l-4 border-l-blue-500' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${color}`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium">{notification.title}</h3>
                      <p className="text-sm opacity-75 mt-1">{notification.message}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs opacity-60">
                          {new Date(notification.createdAt).toLocaleString()}
                        </span>
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification._id)}
                            className="text-xs flex items-center gap-1 opacity-60 hover:opacity-100"
                          >
                            <RiCheckDoubleLine className="w-4 h-4" />
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Load More Button */}
          {hasMore && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={handleLoadMore}
              disabled={loading}
              className={`w-full py-2 rounded-lg text-sm transition-all ${
                currentTheme === 'dark'
                  ? 'bg-gray-800 hover:bg-gray-700'
                  : currentTheme === 'eyeCare'
                  ? 'bg-[#E6D5BC] hover:bg-[#D4C3AA]'
                  : 'bg-white hover:bg-gray-50'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Loading...' : 'Load More'}
            </motion.button>
          )}

          {/* Empty State */}
          {!loading && notifications.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`p-6 text-center rounded-xl ${
                currentTheme === 'dark'
                  ? 'bg-gray-800'
                  : currentTheme === 'eyeCare'
                  ? 'bg-[#E6D5BC]'
                  : 'bg-white'
              }`}
            >
              <RiNotification3Line className="mx-auto h-12 w-12 opacity-20" />
              <h3 className="mt-2 text-sm font-medium">No Recent Activities</h3>
              <p className="mt-1 text-xs opacity-60">
                Your recent activities will appear here
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Alerts; 