import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useSidebar } from '../../context/SidebarContext';
import {
  RiShoppingCartLine,
  RiShoppingCartFill,
  RiNotification3Line,
  RiNotification3Fill,
  RiMapPinLine,
  RiMapPinFill,
  RiWallet3Line,
  RiWallet3Fill,
  RiUser3Line,
  RiUser3Fill,
  RiHeartLine,
  RiHeartFill,
  RiArrowDownSLine,
  RiStore2Line,
  RiStore2Fill,
  RiSettings4Line,
  RiLogoutBoxRLine,
  RiMoonFill,
  RiEyeFill,
  RiSunLine,
} from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const ProfileButton = ({ user, currentTheme, showLabel = true }) => (
  <>
    <div className={`w-6 h-6 rounded-full flex items-center justify-center overflow-hidden ${
      !user?.profilePicture?.url && (
        currentTheme === 'dark'
          ? 'bg-gradient-to-br from-white to-gray-200'
          : currentTheme === 'eyeCare'
          ? 'bg-[#E6D5B8]'
          : 'bg-gradient-to-br from-gray-800 to-black'
      )
    }`}>
      {user?.profilePicture?.url ? (
        <img 
          src={user.profilePicture.url} 
          alt="Profile" 
          className="w-full h-full object-cover"
        />
      ) : (
        <span className={`text-xs font-medium ${
          currentTheme === 'dark' 
            ? 'text-gray-900' 
            : currentTheme === 'eyeCare'
            ? 'text-[#433422]'
            : 'text-white'
        }`}>
          {user?.firstName?.charAt(0)?.toUpperCase() || 
           user?.username?.charAt(0)?.toUpperCase() || 'U'}
        </span>
      )}
    </div>
    {showLabel && (
      <span className="text-xs mt-1">
        {user ? 'Profile' : 'Login'}
      </span>
    )}
  </>
);

const Header = () => {
  const { currentTheme, toggleTheme } = useTheme();
  const { isExpanded } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [lastAlertsRoute, setLastAlertsRoute] = useState('/alerts');
  const [lastVisitedRoute, setLastVisitedRoute] = useState('/alerts');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, setIsAuthenticated, updateUser, isAdmin } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userData, setUserData] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setIsLoading(false);
          setHasFetched(true);
          return;
        }

        const response = await axios.get(
          'http://192.168.100.38:5000/api/buyers/profile',
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            withCredentials: true
          }
        );

        if (response.data.success && response.data.buyer) {
          setUserData(response.data.buyer);
          updateUser(response.data.buyer);
          setUser(response.data.buyer);
          setIsAuthenticated(true);
          localStorage.setItem('user', JSON.stringify(response.data.buyer));
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          handleLogoutCleanup();
        }
      } finally {
        setIsLoading(false);
        setHasFetched(true);
      }
    };

    // Only fetch if we haven't fetched yet and there's an auth token
    if (!hasFetched && localStorage.getItem('authToken')) {
      fetchUserProfile();
    } else {
      setIsLoading(false);
      setHasFetched(true);
    }
  }, [updateUser, hasFetched]);

  // Add a shorter timeout to prevent infinite loading
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        setHasFetched(true);
        console.error('Profile fetch timeout');
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timeoutId);
  }, [isLoading]);

  // Update checkAuthState to use axios
  useEffect(() => {
    const checkAuthState = async () => {
      const token = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (!user || user._id !== parsedUser._id) {
            setUser(parsedUser);
            setIsAuthenticated(true);
            if (!hasFetched) {
              // Trigger a fresh fetch if needed
              setHasFetched(false);
            }
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
          handleLogoutCleanup();
        }
      } else if (isAuthenticated) {
        handleLogoutCleanup();
      }
      setIsLoading(false);
    };

    checkAuthState();
    
    const handleStorageChange = () => {
      checkAuthState();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-change', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-change', handleStorageChange);
    };
  }, [hasFetched, isAuthenticated, user]);

  const handleLogout = () => {
    setShowLogoutModal(true);
    setShowProfileDropdown(false);
  };

  const handleConfirmLogout = () => {
    if (!isAuthenticated) return;
    
    handleLogoutCleanup();
    setShowLogoutModal(false);
    setShowProfileDropdown(false);
    navigate('/login', { replace: true });
  };

  // Track route changes
  useEffect(() => {
    if (location.pathname.startsWith('/alerts')) {
      setLastVisitedRoute(location.pathname);
    }
  }, [location.pathname]);

  // Add helper function for logout cleanup
  const handleLogoutCleanup = () => {
    if (isAuthenticated || user) {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth-change'));
    }
  };

  // Now define profileMenuItems after handleLogout is declared
  const profileMenuItems = [
    { name: 'Profile', icon: RiUser3Line, path: `/${user?._id}/profile` },
    { name: 'Settings', icon: RiSettings4Line, path: `/${user?._id}/settings` },
    { name: 'Logout', icon: RiLogoutBoxRLine, onClick: handleLogout },
  ];

  const isNotificationRoute = (path) => {
    return path.startsWith('/alerts');
  };

  const isProductRoute = (path) => {
    return path.startsWith('/product') || path.startsWith('/products');
  };

  const isHomeActive = (currentPath) => {
    // Check if the URL has a 'from=cart' parameter
    const searchParams = new URLSearchParams(window.location.search);
    const fromCart = searchParams.get('from') === 'cart';

    // Only return true for home and product routes if we didn't come from cart
    return (currentPath === `/${user?._id}` || (isProductRoute(currentPath) && !fromCart));
  };

  const isCartActive = (currentPath) => {
    // Check if the URL has a 'from=cart' parameter
    const searchParams = new URLSearchParams(window.location.search);
    const fromCart = searchParams.get('from') === 'cart';

    // Return true for cart page and product routes that came from cart
    return currentPath === '/cart' || (isProductRoute(currentPath) && fromCart);
  };

  const handleNavigation = (path) => {
    const currentPath = location.pathname;

    if (path === '/') {
      // Redirect to user's root path for home navigation
      navigate(`/${user?._id}`, { replace: true });
      if (currentPath === `/${user?._id}`) {
        window.location.reload();
      }
    } else if (path === currentPath) {
      // If clicking the same route, reload the page
      navigate(path, { replace: true });
      window.location.reload();
    } else {
      // For other routes
      navigate(path, { 
        replace: true,
        state: { preserveScroll: true }
      });
    }
  };

  const isAlertRoute = (path) => {
    return path.startsWith(`/${user?._id}/alerts`);
  };

  // Add this function to check if we're on a product detail page
  const isProductDetailPage = () => {
    return location.pathname.match(/\/[^/]+\/products\/[^/]+$/);
  };

  // Add this function to check if we're in the chat interface
  const isChatInterface = () => {
    return location.pathname.includes('/chat');
  };

  // Update the mobile navigation array
  const mobileNavItems = isAuthenticated ? [
    { 
      path: '/', 
      icon: RiStore2Line, 
      activeIcon: RiStore2Fill, 
      label: 'Home',
      isActive: (path) => isHomeActive(path)
    },
    { 
      path: `/${user?._id}/alerts`, 
      icon: RiNotification3Line, 
      activeIcon: RiNotification3Fill, 
      label: 'Alerts',
      isActive: (path) => path.startsWith(`/${user?._id}/alerts`)
    },
    { 
      path: `/${user?._id}/wishlist`, 
      icon: RiHeartLine, 
      activeIcon: RiHeartFill, 
      label: 'Wishlist',
      isActive: (path) => path === `/${user?._id}/wishlist`
    },
    { 
      path: `/${user?._id}/cart`, 
      icon: RiShoppingCartLine, 
      activeIcon: RiShoppingCartFill, 
      label: 'Cart',
      isActive: (path) => isCartActive(path)
    },
    { 
      path: `/${user?._id}/profile`, 
      icon: RiUser3Line, 
      activeIcon: RiUser3Fill, 
      label: 'Profile',
      isActive: (path) => path === `/${user?._id}/profile`
    },
  ] : [
    { 
      path: '/', 
      icon: RiStore2Line, 
      activeIcon: RiStore2Fill, 
      label: 'Home',
      isActive: (path) => isHomeActive(path)
    },
    { 
      path: '/login', 
      icon: RiUser3Line, 
      activeIcon: RiUser3Fill, 
      label: 'Login',
      isActive: (path) => path === '/login'
    },
  ];

  // Add this function to cycle through themes
  const handleThemeToggle = () => {
    const themes = ['light', 'dark', 'eyeCare'];
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    toggleTheme(themes[nextIndex]);
  };

  // Theme icon mapping
  const getThemeIcon = () => {
    switch (currentTheme) {
      case 'dark':
        return <RiMoonFill size={20} />;
      case 'eyeCare':
        return <RiEyeFill size={20} />;
      default:
        return <RiSunLine size={20} />;
    }
  };

  // Simplified desktop header action buttons with alerts and profile
  const desktopActionButtons = (
    <div className="flex items-center gap-3">
      {!isAuthenticated ? (
        <>
          <Link
            to="/login"
            className={`px-4 py-2 rounded-lg transition-all ${
              currentTheme === 'dark'
                ? 'text-gray-300 hover:bg-gray-800'
                : currentTheme === 'eyeCare'
                ? 'text-[#433422] hover:bg-[#E6D5BC]'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Login
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-gray-800 to-black text-white hover:from-black hover:to-gray-900 transition-all"
          >
            Register
          </Link>
        </>
      ) : (
        <>
          {/* Wishlist Button */}
          <Link
            to={`/${user?._id}/alerts/wishlist`}
            className={`p-2 rounded-full transition-all ${
              currentTheme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                : currentTheme === 'eyeCare'
                ? 'text-[#433422] hover:bg-[#E6D5BC]'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {location.pathname === `/${user?._id}/alerts/wishlist` ? (
              <RiHeartFill size={20} className="text-red-500" />
            ) : (
              <RiHeartLine size={20} />
            )}
          </Link>

          {/* Alerts Button */}
          <Link
            to={`/${user?._id}/alerts`}
            className={`p-2 rounded-full transition-all ${
              currentTheme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                : currentTheme === 'eyeCare'
                ? 'text-[#433422] hover:bg-[#E6D5BC]'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {location.pathname === `/${user?._id}/alerts` ? (
              <RiNotification3Fill size={20} />
            ) : (
              <RiNotification3Line size={20} />
            )}
          </Link>

          {/* Cart Button */}
          <Link
            to={`/${user?._id}/cart`}
            className={`p-2 rounded-full transition-all ${
              currentTheme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                : currentTheme === 'eyeCare'
                ? 'text-[#433422] hover:bg-[#E6D5BC]'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {location.pathname === `/${user?._id}/cart` ? (
              <RiShoppingCartFill size={20} />
            ) : (
              <RiShoppingCartLine size={20} />
            )}
          </Link>

          {/* Theme Toggle */}
          <button
            onClick={handleThemeToggle}
            className={`p-2 rounded-full transition-all ${
              currentTheme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                : currentTheme === 'eyeCare'
                ? 'text-[#433422] hover:bg-[#E6D5BC]'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {getThemeIcon()}
          </button>

          {/* User Profile - Updated with profile picture */}
          <div className="relative">
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md overflow-hidden
                ${!user?.profilePicture?.url && (
                  currentTheme === 'dark'
                    ? 'bg-gradient-to-br from-white to-gray-200'
                    : 'bg-gradient-to-br from-gray-800 to-black'
                )}
              `}
            >
              {user?.profilePicture?.url ? (
                <img 
                  src={user.profilePicture.url} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className={`text-sm font-medium ${
                  currentTheme === 'dark' ? 'text-gray-900' : 'text-white'
                }`}>
                  {user?.firstName?.charAt(0)?.toUpperCase() || 
                   user?.username?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              )}
            </button>

            {/* Profile Dropdown */}
            <AnimatePresence>
              {showProfileDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg py-1 z-50
                    ${currentTheme === 'dark' ? 'bg-gray-800' : 'bg-white'}
                    border ${currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
                >
                  <div className={`px-4 py-2 border-b ${
                    currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    <p className={`text-sm font-medium truncate ${
                      currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {user?.firstName 
                        ? `${user.firstName} ${user.lastName || ''}`
                        : user?.username || 'User'}
                    </p>
                    <p className={`text-xs truncate max-w-[160px] ${
                      currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`} title={user?.email}>
                      {user?.email || 'email@example.com'}
                    </p>
                  </div>
                  {profileMenuItems.map((item, index) => (
                    <div key={index} className="px-1">
                      {item.path ? (
                        <Link
                          to={item.path}
                          className={`flex items-center px-3 py-2 text-sm rounded-md ${
                            currentTheme === 'dark' 
                              ? 'text-gray-300 hover:bg-gray-700' 
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                          onClick={() => setShowProfileDropdown(false)}
                        >
                          <item.icon className="w-4 h-4 mr-3" />
                          {item.name}
                        </Link>
                      ) : (
                        <button
                          onClick={item.onClick}
                          className={`w-full flex items-center px-3 py-2 text-sm rounded-md ${
                            currentTheme === 'dark' 
                              ? 'text-red-400 hover:bg-gray-700' 
                              : 'text-red-600 hover:bg-gray-100'
                          }`}
                        >
                          <item.icon className="w-4 h-4 mr-3" />
                          {item.name}
                        </button>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );

  // Updated MobileProfileIcon component
  const MobileProfileIcon = () => {
    if (isLoading) {
      return (
        <div className="w-6 h-6 rounded-full flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (!isAuthenticated) {
      return <RiUser3Line size={24} />;
    }

    return (
      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
        currentTheme === 'dark'
          ? 'bg-gradient-to-br from-white to-gray-200 text-gray-900'
          : 'bg-gradient-to-br from-gray-800 to-black text-white'
      }`}>
        <span className="text-xs font-medium">
          {user?.username?.charAt(0)?.toUpperCase() || 'A'}
        </span>
      </div>
    );
  };

  // Updated mobile navigation
  const mobileNav = (
    // Only render if NOT on chat interface and NOT on product detail page
    !isChatInterface() && !isProductDetailPage() && (
      <div className="block md:hidden">
        <div className={`fixed bottom-0 left-0 right-0 z-50 border-t ${
          currentTheme === 'dark' 
            ? 'bg-gray-900/80 backdrop-blur-xl border-gray-800' 
            : currentTheme === 'eyeCare' 
            ? 'bg-[#F5E6D3]/80 backdrop-blur-xl border-[#E6D5BC]'
            : 'bg-white/80 backdrop-blur-xl border-gray-100'
        }`}>
          <div className="flex items-center justify-around h-16">
            {/* Home - Always visible */}
            <Link
              to={`/${user?._id}`}
              className={`flex flex-col items-center p-2 ${
                currentTheme === 'dark' 
                  ? 'text-gray-400 hover:text-white' 
                  : currentTheme === 'eyeCare'
                  ? 'text-[#433422] hover:text-[#433422]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {location.pathname === `/${user?._id}` ? <RiStore2Fill size={24} /> : <RiStore2Line size={24} />}
              <span className="text-xs mt-1">Home</span>
            </Link>

            {/* Conditional rendering based on auth state */}
            {localStorage.getItem('authToken') && (
              <>
                <Link
                  to={`/${user?._id}/alerts`}
                  className={`flex flex-col items-center p-2 ${
                    currentTheme === 'dark' 
                      ? 'text-gray-400 hover:text-white' 
                      : currentTheme === 'eyeCare'
                      ? 'text-[#433422] hover:text-[#433422]'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {location.pathname === `/${user?._id}/alerts` ? (
                    <RiNotification3Fill size={24} />
                  ) : (
                    <RiNotification3Line size={24} />
                  )}
                  <span className="text-xs mt-1">Alerts</span>
                </Link>

                <Link
                  to={`/${user?._id}/cart`}
                  className={`flex flex-col items-center p-2 ${
                    currentTheme === 'dark' 
                      ? 'text-gray-400 hover:text-white' 
                      : currentTheme === 'eyeCare'
                      ? 'text-[#433422] hover:text-[#433422]'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {location.pathname === `/${user?._id}/cart` ? (
                    <RiShoppingCartFill size={24} />
                  ) : (
                    <RiShoppingCartLine size={24} />
                  )}
                  <span className="text-xs mt-1">Cart</span>
                </Link>
              </>
            )}

            {/* Profile/Login - Changes based on auth state */}
            <Link
              to={localStorage.getItem('authToken') ? `/${user?._id}/profile` : '/login'}
              className={`flex flex-col items-center p-2 ${
                currentTheme === 'dark' 
                  ? 'text-gray-400 hover:text-white' 
                  : currentTheme === 'eyeCare'
                  ? 'text-[#433422] hover:text-[#433422]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {localStorage.getItem('authToken') ? (
                <ProfileButton user={user} currentTheme={currentTheme} />
              ) : (
                <>
                  <RiUser3Line size={24} />
                  <span className="text-xs mt-1">Login</span>
                </>
              )}
            </Link>
          </div>
        </div>
      </div>
    )
  );

  // Add LogoutModal component
  const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              style={{ 
                position: 'fixed',
                zIndex: 99998 
              }}
            />
            
            {/* Modal Container */}
            <div 
              className="fixed inset-0 flex items-center justify-center"
              style={{ zIndex: 99999 }}
            >
              {/* Modal Content */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={`w-[90%] max-w-[400px] rounded-2xl shadow-2xl
                  ${currentTheme === 'dark' 
                    ? 'bg-gray-800/95 border border-gray-700' 
                    : currentTheme === 'eyeCare'
                    ? 'bg-[#F5E6C8] border border-[#E6D5B8]'
                    : 'bg-white/95 border border-gray-200'
                  }
                `}
              >
                <div className="p-8">
                  <div className="w-16 h-16 rounded-full bg-red-100 mx-auto mb-6 flex items-center justify-center">
                    <RiLogoutBoxRLine className="text-red-500 text-2xl" />
                  </div>
                  
                  <h3 className={`text-xl font-semibold text-center mb-3
                    ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}
                  `}>
                    Confirm Logout
                  </h3>
                  
                  <p className={`text-base text-center mb-8
                    ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}
                  `}>
                    Are you sure you want to logout from your account?
                  </p>
                  
                  <div className="flex gap-4">
                    <button
                      onClick={onClose}
                      className={`flex-1 px-6 py-3 rounded-xl text-sm font-medium transition-all
                        ${currentTheme === 'dark'
                          ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                          : currentTheme === 'eyeCare'
                          ? 'bg-[#E6D5B8] hover:bg-[#D4C3A3] text-[#433422]'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }
                      `}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={onConfirm}
                      className="flex-1 px-6 py-3 rounded-xl text-sm font-medium
                        bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 
                        text-white transition-all shadow-lg shadow-red-500/25"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    );
  };

  // Reset hasFetched when auth token changes
  useEffect(() => {
    const handleStorageChange = () => {
      setHasFetched(false);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Render loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-16">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Don't render the header if we're in chat interface and not an admin
  if (isChatInterface() && !isAdmin) {
    return null;
  }

  return (
    <>
      {/* Desktop Header */}
      <div className="hidden md:block">
        <div className={`fixed top-0 left-0 right-0 z-30 border-b transition-all duration-300 ${
          currentTheme === 'dark' 
            ? 'bg-gray-900/80 backdrop-blur-xl border-gray-800' 
            : currentTheme === 'eyeCare' 
            ? 'bg-[#F5E6D3]/80 backdrop-blur-xl border-[#E6D5BC]'
            : 'bg-white/80 backdrop-blur-xl border-gray-100'
        }`}>
          <div className={`transition-all duration-300 ${isExpanded ? 'ml-64' : 'ml-20'}`}>
            <div className="max-w-7xl mx-auto px-4">
              <div className="h-16 flex items-center justify-between gap-8">
                {/* Logo */}
                <AnimatePresence>
                  {!isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-2"
                    >
                      <RiStore2Line size={24} className="text-purple-500" />
                      <span className="text-xl font-serif italic">Essence</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Center Title */}
                <div className={`flex-1 flex items-center justify-center transition-all duration-300 ${
                  isExpanded ? '-ml-20' : 'ml-0'
                }`}>
                  <div className={`px-12 py-2 relative ${
                    currentTheme === 'dark' 
                      ? 'text-gray-300' 
                      : currentTheme === 'eyeCare'
                      ? 'text-[#433422]'
                      : 'text-gray-600'
                  }`}>
                    <div className="absolute left-0 top-1/2 w-8 h-[1px] bg-current transform -translate-y-1/2" />
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="font-serif italic text-lg">Luxury Fragrances</span>
                      <span className="text-[10px] tracking-[0.3em] uppercase font-light">
                        Exclusive Collection
                      </span>
                    </div>
                    <div className="absolute right-0 top-1/2 w-8 h-[1px] bg-current transform -translate-y-1/2" />
                  </div>
                </div>

                {/* Replace the Action Buttons section with the simplified version */}
                {desktopActionButtons}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileNav}

      {/* Add LogoutModal at the end */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
      />
    </>
  );
};

export default Header; 