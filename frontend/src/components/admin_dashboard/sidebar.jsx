import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from '@mui/material';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
  RiDashboardLine,
  RiShoppingBag3Line,
  RiUserLine,
  RiSettings4Line,
  RiLogoutBoxRLine,
  RiMenuFoldLine,
  RiMenuUnfoldLine,
  RiCloseLine,
  RiStore2Line,
  RiFileList3Line,
  RiBarChartLine,
  RiNotificationLine,
  RiShieldUserLine,
  RiMoneyDollarCircleLine,
  RiCustomerService2Line,
  RiSunLine,
  RiMoonLine,
  RiEyeLine,
  RiNotification2Line,
  RiArrowDownSLine,
  RiMessage2Line,
  RiImageLine,
} from 'react-icons/ri';
import { notificationAPI } from '../../utils/api';
import axios from 'axios';

const AdminSidebar = () => {
  const { currentTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isExpanded, setIsExpanded] = useState(!isMobile);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [activeItem, setActiveItem] = useState('/');
  const { user, logout } = useAuth();
  const [showMobileProfile, setShowMobileProfile] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Menu items for admin
  const menuItems = [
    {
      name: 'Dashboard',
      icon: RiDashboardLine,
      path: `/${user?._id}/admin/dashboard`
    },
    {
      name: 'Products',
      icon: RiShoppingBag3Line,
      path: `/${user?._id}/admin/products`
    },

    {
      name: 'Customers',
      icon: RiUserLine,
      path: `/${user?._id}/admin/customers`
    },
    {
      name: 'Orders',
      icon: RiFileList3Line,
      path: `/${user?._id}/admin/orders`
    },

    {
      name: 'Notifications',
      icon: ({ className }) => (
        <div className="relative">
          <RiNotificationLine className={className} />
          {unreadNotifications > 0 && (
            <span className="absolute -top-3 -right-2 flex items-center justify-center min-w-[18px] h-[18px] text-xs text-white bg-red-500 rounded-full px-1">
              {unreadNotifications}
            </span>
          )}
        </div>
      ),
      path: `/${user?._id}/admin/notifications/received`
    },
    {
      name: 'Categories',
      icon: RiShieldUserLine,
      path: `/${user?._id}/admin/categories`
    },
    {
      name: 'Banners',
      icon: RiImageLine,
      path: `/${user?._id}/admin/banners`
    },
    {
      name: 'Settings',
      icon: RiSettings4Line,
      path: `/${user?._id}/admin/settings`
    },
   
  ];

  useEffect(() => {
    setActiveItem(location.pathname);
  }, [location]);

  // Handle mobile sidebar
  useEffect(() => {
    if (isMobile) {
      setIsExpanded(false);
    }
  }, [location.pathname, isMobile]);

  // Handle sidebar width adjustment
  useEffect(() => {
    if (!isMobile) {
      const mainContent = document.body;
      mainContent.style.transition = 'padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      mainContent.style.paddingLeft = isExpanded ? '280px' : '70px';
    }

    return () => {
      document.body.style.paddingLeft = '0';
    };
  }, [isExpanded, isMobile]);

  // Add this effect to fetch unread notifications count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await notificationAPI.getUserNotifications(user.token);
        if (response.data.success) {
          const count = response.data.notifications.filter(n => !n.isRead).length;
          setUnreadNotifications(count);
        }
      } catch (error) {
        console.error('Failed to fetch notifications count:', error);
      }
    };

    if (user.token) {
      fetchUnreadCount();
      // Set up polling every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user.token]);

  // Update the fetchUnreadMessages function to handle admin messages
  useEffect(() => {
    const fetchUnreadMessages = async () => {
      try {
        const response = await axios.get('/api/chat/unread-count', {
          headers: { Authorization: `Bearer ${user.token}` },
          params: { isAdmin: true }
        });
        setUnreadMessages(response.data.count);
      } catch (error) {
        console.error('Failed to fetch unread messages:', error);
      }
    };

    if (user?.token) {
      fetchUnreadMessages();
      const interval = setInterval(fetchUnreadMessages, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.token]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Sidebar Header Component - Remove hamburger for desktop
  const SidebarHeader = () => (
    <div className={`p-4 flex items-center justify-between border-b ${
      currentTheme === 'dark' ? 'border-gray-800' : 'border-gray-200'
    }`}>
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          currentTheme === 'dark'
            ? 'bg-gradient-to-br from-purple-600 to-blue-600'
            : currentTheme === 'eyeCare'
            ? 'bg-gradient-to-br from-[#8B4513] to-[#654321]'
            : 'bg-gradient-to-br from-gray-800 to-black'
        }`}>
          <span className="text-white text-lg font-bold">A</span>
        </div>
        {isExpanded && (
          <span className={`text-lg font-semibold ${
            currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Admin Panel
          </span>
        )}
      </div>
    </div>
  );

  // SidebarToggle - Only show on desktop
  const SidebarToggle = () => (
    !isMobile && (
      <div className="absolute -right-3 top-1/2 transform -translate-y-1/2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`p-1.5 rounded-full shadow-lg border transition-colors
            ${currentTheme === 'dark' 
              ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-400' 
              : currentTheme === 'eyeCare'
              ? 'bg-[#F5E6D3] border-[#E6D5B8] hover:bg-[#E6D5B8] text-[#433422]'
              : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-600'
            }`}
        >
          {isExpanded ? (
            <RiMenuFoldLine size={16} />
          ) : (
            <RiMenuUnfoldLine size={16} />
          )}
        </button>
      </div>
    )
  );

  // Mobile Navbar - Keep hamburger only for mobile
  const MobileNavbar = () => {
    const isProductDetails = location.pathname.includes('/admin/product/');
    if (isProductDetails) return null;

    return (
      <motion.div
        initial={false}
        animate={{
          backdropFilter: "blur(12px)",
          backgroundColor: currentTheme === 'dark' 
            ? 'rgba(17, 24, 39, 0.85)'
            : currentTheme === 'eyeCare'
            ? 'rgba(245, 230, 211, 0.95)'
            : 'rgba(255, 255, 255, 0.92)'
        }}
        className={`w-full px-4 py-2.5 flex items-center justify-between fixed top-0 left-0 right-0 z-50
          ${currentTheme === 'dark' 
            ? 'border-gray-800/50 text-gray-100' 
            : currentTheme === 'eyeCare'
            ? 'border-[#E6D5B8]/50 text-[#433422]'
            : 'border-gray-200/50 text-gray-900'
          } border-b shadow-sm`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExpanded(true)}
            className={`p-2 rounded-full transition-all duration-200 ${
              currentTheme === 'dark' 
                ? 'hover:bg-gray-800/70' 
                : 'hover:bg-gray-100/70'
            }`}
          >
            <RiMenuUnfoldLine size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              currentTheme === 'dark'
                ? 'bg-gradient-to-br from-purple-600 to-blue-600'
                : currentTheme === 'eyeCare'
                ? 'bg-gradient-to-br from-[#8B4513] to-[#654321]'
                : 'bg-gradient-to-br from-gray-800 to-black'
            }`}>
              <span className="text-white text-sm font-bold">A</span>
            </div>
            <span className="font-medium text-sm">Admin</span>
          </div>
        </div>

        {/* Right Section - Updated with modern styling */}
        <div className="flex items-center gap-1">
          <Link
            to={`/${user?._id}/admin/notifications`}
            className="relative p-2 rounded-full hover:bg-gray-100/70 dark:hover:bg-gray-800/70 transition-all duration-200"
          >
            <div className="relative">
              <RiNotification2Line size={22} />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] text-xs text-white bg-red-500 rounded-full px-1">
                  {unreadNotifications}
                </span>
              )}
            </div>
          </Link>

          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="relative p-1.5 rounded-full hover:bg-gray-100/70 dark:hover:bg-gray-800/70 transition-all duration-200"
          >
            <div className="w-7 h-7 rounded-full overflow-hidden ring-2 ring-gray-200/50 dark:ring-gray-700/50">
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className={`w-full h-full flex items-center justify-center text-sm font-medium
                  ${currentTheme === 'dark' ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-700'}
                `}>
                  {user?.name?.[0]?.toUpperCase() || 'A'}
                </div>
              )}
            </div>
          </button>
        </div>
      </motion.div>
    );
  };

  // Sidebar Navigation Item Component - New component for cleaner code
  const NavItem = ({ item }) => (
    <motion.div>
      <Link
        to={item.path}
        className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg transition-all duration-200
          ${activeItem === item.path 
            ? currentTheme === 'dark'
              ? 'bg-gray-800/80 text-white'
              : currentTheme === 'eyeCare'
              ? 'bg-[#E6D5B8]/80 text-[#433422]'
              : 'bg-gray-100/80 text-gray-900'
            : currentTheme === 'dark'
            ? 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
            : currentTheme === 'eyeCare'
            ? 'text-[#6B5D4D] hover:bg-[#E6D5B8]/50 hover:text-[#433422]'
            : 'text-gray-600 hover:bg-gray-100/50 hover:text-gray-900'
          }`}
      >
        <div className="flex items-center gap-3">
          <item.icon size={20} className="flex-shrink-0" />
          {isExpanded && (
            <motion.span
              initial={false}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm font-medium whitespace-nowrap"
            >
              {item.name}
            </motion.span>
          )}
        </div>
      </Link>
    </motion.div>
  );

  // Update the bottom section to show only logout when collapsed
  const BottomSection = () => (
    <div className={`${isMobile ? 'fixed bottom-0 left-0 w-[280px]' : ''} 
      ${currentTheme === 'dark' 
        ? 'bg-gray-900/95 border-gray-800/50' 
        : currentTheme === 'eyeCare'
        ? 'bg-[#F5E6D3]/95 border-[#E6D5B8]/50'
        : 'bg-white/95 border-gray-200/50'
      } border-t backdrop-blur-md`}
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          {isExpanded ? (
            <>
              <button
                onClick={() => toggleTheme(
                  currentTheme === 'light' ? 'dark' 
                  : currentTheme === 'dark' ? 'eyeCare' 
                  : 'light'
                )}
                className={`p-2 rounded-lg ${
                  currentTheme === 'dark' 
                    ? 'hover:bg-gray-800 text-gray-400' 
                    : currentTheme === 'eyeCare'
                    ? 'hover:bg-[#E6D5B8] text-[#433422]'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                {currentTheme === 'dark' ? <RiMoonLine size={20} />
                  : currentTheme === 'light' ? <RiSunLine size={20} />
                  : <RiEyeLine size={20} />}
              </button>
              <button
                onClick={() => setShowLogoutModal(true)}
                className={`p-2 rounded-lg ${
                  currentTheme === 'dark' 
                    ? 'text-red-400 hover:bg-gray-800' 
                    : currentTheme === 'eyeCare'
                    ? 'text-red-500 hover:bg-[#E6D5B8]'
                    : 'text-red-600 hover:bg-gray-100'
                }`}
              >
                <RiLogoutBoxRLine size={20} />
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowLogoutModal(true)}
              className={`w-full p-2 rounded-lg ${
                currentTheme === 'dark' 
                  ? 'text-red-400 hover:bg-gray-800' 
                  : currentTheme === 'eyeCare'
                  ? 'text-red-500 hover:bg-[#E6D5B8]'
                  : 'text-red-600 hover:bg-gray-100'
              }`}
            >
              <RiLogoutBoxRLine size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {isMobile && <MobileNavbar />}
      
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobile && isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>

      {/* Main Sidebar */}
      <motion.div
        initial={false}
        animate={isMobile ? 
          (isExpanded ? { x: 0 } : { x: -280 }) :
          {
            width: isExpanded ? 280 : 70,
            transition: {
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1]
            }
          }
        }
        style={{
          width: isMobile ? 280 : undefined,
        }}
        transition={isMobile ? {
          type: "spring",
          stiffness: 300,
          damping: 30
        } : {
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1]
        }}
        className={`fixed top-0 left-0 h-full flex flex-col z-50 
          ${currentTheme === 'dark' 
            ? 'bg-gray-900/95 border-gray-800/50' 
            : currentTheme === 'eyeCare'
            ? 'bg-[#F5E6D3]/95 border-[#E6D5B8]/50'
            : 'bg-white/95 border-gray-200/50'
          } border-r backdrop-blur-md`}
      >
        <SidebarHeader />
        <SidebarToggle />
        
        {/* Navigation Items */}
        <div className={`flex-1 py-4 overflow-y-auto ${isMobile ? 'pb-32' : ''}`}>
          <div className="px-3 space-y-1">
            {menuItems.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </div>
        </div>

        <BottomSection />
      </motion.div>

      {/* Logout Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-sm p-6 rounded-xl shadow-xl ${
                currentTheme === 'dark' 
                  ? 'bg-gray-800' 
                  : currentTheme === 'eyeCare'
                  ? 'bg-[#FFF8ED]'
                  : 'bg-white'
              }`}
            >
              <h3 className={`text-xl font-semibold mb-4 ${
                currentTheme === 'dark' 
                  ? 'text-white' 
                  : currentTheme === 'eyeCare'
                  ? 'text-[#433422]'
                  : 'text-gray-900'
              }`}>
                Confirm Logout
              </h3>
              <p className={
                currentTheme === 'dark' 
                  ? 'text-gray-300' 
                  : currentTheme === 'eyeCare'
                  ? 'text-[#6B5D4D]'
                  : 'text-gray-600'
              }>
                Are you sure you want to logout from the admin panel?
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className={`flex-1 px-4 py-2 rounded-lg ${
                    currentTheme === 'dark'
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : currentTheme === 'eyeCare'
                      ? 'bg-[#E6D5B8] text-[#433422] hover:bg-[#D4C3A3]'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className={`flex-1 px-4 py-2 rounded-lg ${
                    currentTheme === 'eyeCare'
                      ? 'bg-red-500 text-[#FFF8ED] hover:bg-red-600'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  Logout
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AdminSidebar;
