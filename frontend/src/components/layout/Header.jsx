import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useSidebar } from '../../context/SidebarContext';
import {
  RiShoppingCartLine,
  RiShoppingCartFill,
  RiNotification3Line,
  RiNotification3Fill,
  RiUser3Line,
  RiUser3Fill,
  RiStore2Line,
  RiStore2Fill,
  RiSettings4Line,
  RiLogoutBoxRLine,
  RiMoonFill,
  RiEyeFill,
  RiSunLine,
  RiSearchLine,
} from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { createAPI } from '../../utils/api';

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

const Header = ({ className = '' }) => {
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
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const token = localStorage.getItem('authToken');
  const api = createAPI(token);

  // Add helper function for logout cleanup first - before any useEffect
  const handleLogoutCleanup = useCallback(() => {
    if (isAuthenticated || user) {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth-change'));
    }
  }, [isAuthenticated, user, setIsAuthenticated]);

  // Now we can safely use handleLogoutCleanup in our other effects
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
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
  }, [updateUser, hasFetched, token, handleLogoutCleanup, setIsAuthenticated]);

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
  }, [hasFetched, isAuthenticated, user, setIsAuthenticated, handleLogoutCleanup]);

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

  // Only keep the functions we actually use
  const isProductDetailPage = () => {
    return location.pathname.match(/\/[^/]+\/products\/[^/]+$/);
  };

  const isChatInterface = () => {
    return location.pathname.includes('/chat');
  };

  // Add this function to handle search button click
  const handleSearchClick = () => {
    setShowSearchModal(true);
    navigate('/search', { 
      state: { 
        initialQuery: '' 
      }
    });
  };

  // Fetch cart count
  useEffect(() => {
    const fetchCartCount = async () => {
      try {
        if (isAuthenticated && !isAdmin) {
          const response = await api.get('/api/cart/count');
          setCartCount(response.data.count);
        }
      } catch (error) {
        console.error('Error fetching cart count:', error);
      }
    };
    fetchCartCount();
  }, [isAuthenticated, isAdmin, api]);

  // Fetch notification count
  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        if (isAuthenticated) {
          const response = await api.get('/api/notifications/unread-count');
          setNotificationCount(response.data.count);
        }
      } catch (error) {
        console.error('Error fetching notification count:', error);
      }
    };
    fetchNotificationCount();
  }, [isAuthenticated, api]);

  // Fetch wishlist count
  useEffect(() => {
    const fetchWishlistCount = async () => {
      try {
        if (isAuthenticated && !isAdmin) {
          const response = await api.get('/api/wishlist/count');
          setWishlistCount(response.data.count);
        }
      } catch (error) {
        console.error('Error fetching wishlist count:', error);
      }
    };
    fetchWishlistCount();
  }, [isAuthenticated, isAdmin, api]);

  // Desktop Header
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
              <div className="h-16 flex items-center justify-between gap-4">
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

                {/* Search Bar in middle */}
                <div className="flex-1 max-w-xl mx-auto">
                  <div className={`relative rounded-full overflow-hidden border ${
                    currentTheme === 'dark' 
                      ? 'border-gray-700 bg-gray-800' 
                      : currentTheme === 'eyeCare'
                      ? 'border-[#E6D5B8] bg-[#E6D5B8]/30'
                      : 'border-gray-200 bg-gray-100'
                  }`}>
                    <input
                      type="text"
                      placeholder="Search products..."
                      className={`w-full py-2 pl-5 pr-12 text-sm outline-none ${
                        currentTheme === 'dark' 
                          ? 'bg-gray-800 text-gray-200 placeholder-gray-500' 
                          : currentTheme === 'eyeCare'
                          ? 'bg-transparent text-[#433422] placeholder-[#433422]/70'
                          : 'bg-transparent text-gray-700 placeholder-gray-500'
                      }`}
                      onClick={handleSearchClick}
                    />
                    <button
                      onClick={handleSearchClick}
                      className={`absolute right-0 top-0 h-full px-4 flex items-center justify-center ${
                        currentTheme === 'dark' 
                          ? 'text-gray-400 hover:text-white' 
                          : currentTheme === 'eyeCare'
                          ? 'text-[#433422] hover:text-[#433422]/80'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <RiSearchLine size={18} />
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-4">
                  {/* Theme Toggle */}
                  <button
                    onClick={() => toggleTheme(
                      currentTheme === 'light' ? 'dark' 
                      : currentTheme === 'dark' ? 'eyeCare' 
                      : 'light'
                    )}
                    className={`p-2 rounded-full transition-colors ${
                      currentTheme === 'dark'
                        ? 'text-white hover:bg-gray-800'
                        : currentTheme === 'eyeCare'
                        ? 'text-[#433422] hover:bg-[#E6D5BC]'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {currentTheme === 'dark' ? (
                      <RiSunLine size={20} />
                    ) : currentTheme === 'eyeCare' ? (
                      <RiEyeFill size={20} />
                    ) : (
                      <RiMoonFill size={20} />
                    )}
                  </button>

                  {/* Cart Link */}
                  {isAuthenticated && (
                    <Link
                      to={`/${user?._id}/cart`}
                      className={`p-2 rounded-full transition-colors ${
                        currentTheme === 'dark'
                          ? 'text-white hover:bg-gray-800'
                          : currentTheme === 'eyeCare'
                          ? 'text-[#433422] hover:bg-[#E6D5BC]'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <RiShoppingCartLine size={20} />
                    </Link>
                  )}

                  {/* Profile Button */}
                  {isAuthenticated ? (
                    <div className="relative">
                      <button
                        onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                        className={`p-1 rounded-full transition-colors ${
                          currentTheme === 'dark'
                            ? 'hover:bg-gray-800'
                            : currentTheme === 'eyeCare'
                            ? 'hover:bg-[#E6D5BC]'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <ProfileButton user={user} currentTheme={currentTheme} showLabel={false} />
                      </button>
                      
                      {/* Profile Dropdown */}
                      <AnimatePresence>
                        {showProfileDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className={`absolute right-0 mt-2 w-48 rounded-xl shadow-lg overflow-hidden z-50 ${
                              currentTheme === 'dark'
                                ? 'bg-gray-800 border border-gray-700'
                                : currentTheme === 'eyeCare'
                                ? 'bg-[#F5E6D3] border border-[#E6D5BC]'
                                : 'bg-white border border-gray-100'
                            }`}
                          >
                            {profileMenuItems.map((item, index) => (
                              <div key={index}>
                                {item.onClick ? (
                                  <button
                                    onClick={() => {
                                      setShowProfileDropdown(false);
                                      item.onClick();
                                    }}
                                    className={`w-full text-left px-4 py-3 flex items-center gap-3 ${
                                      currentTheme === 'dark'
                                        ? 'hover:bg-gray-700 text-gray-200'
                                        : currentTheme === 'eyeCare'
                                        ? 'hover:bg-[#E6D5BC] text-[#433422]'
                                        : 'hover:bg-gray-50 text-gray-700'
                                    }`}
                                  >
                                    <item.icon size={18} />
                                    <span>{item.name}</span>
                                  </button>
                                ) : (
                                  <Link
                                    to={item.path}
                                    onClick={() => setShowProfileDropdown(false)}
                                    className={`block px-4 py-3 flex items-center gap-3 ${
                                      currentTheme === 'dark'
                                        ? 'hover:bg-gray-700 text-gray-200'
                                        : currentTheme === 'eyeCare'
                                        ? 'hover:bg-[#E6D5BC] text-[#433422]'
                                        : 'hover:bg-gray-50 text-gray-700'
                                    }`}
                                  >
                                    <item.icon size={18} />
                                    <span>{item.name}</span>
                                  </Link>
                                )}
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Link
                        to="/login"
                        className={`px-4 py-2 rounded-full text-sm font-medium ${
                          currentTheme === 'dark'
                            ? 'bg-white text-gray-900 hover:bg-gray-200'
                            : currentTheme === 'eyeCare'
                            ? 'bg-[#433422] text-[#F5E6D3] hover:bg-[#433422]/90'
                            : 'bg-gray-900 text-white hover:bg-gray-800'
                        }`}
                      >
                        Login
                      </Link>
                      <Link
                        to="/signup"
                        className={`px-4 py-2 rounded-full text-sm font-medium border ${
                          currentTheme === 'dark'
                            ? 'border-white text-white hover:bg-white hover:text-gray-900'
                            : currentTheme === 'eyeCare'
                            ? 'border-[#433422] text-[#433422] hover:bg-[#433422] hover:text-[#F5E6D3]'
                            : 'border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white'
                        }`}
                      >
                        Register
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation - Modern compact design */}
      {!isChatInterface() && !isProductDetailPage() && (
        <div className="block md:hidden">
          <div className={`fixed bottom-0 left-0 right-0 z-50 
            ${currentTheme === 'dark' 
              ? 'bg-gray-900/95 border-t border-gray-800/50' 
              : currentTheme === 'eyeCare' 
              ? 'bg-[#F5E6D3]/95 border-t border-[#E6D5B8]/50'
              : 'bg-white/95 border-t border-gray-200/50'
            } backdrop-blur-lg`}
            style={{
              boxShadow: '0 -1px 8px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div className="px-2 py-1.5 relative max-w-md mx-auto">
              {/* Icon Navigation - Compact and Modern */}
              <div className="flex items-center justify-between relative h-12">
                {/* Home */}
                <Link
                  to={`/${user?._id}`}
                  className="flex flex-col items-center justify-center w-14"
                >
                  <div className={`flex flex-col items-center transition-all duration-200 transform ${
                    location.pathname === `/${user?._id}` ? 'scale-105' : 'opacity-70 hover:opacity-100'
                  }`}>
                    {location.pathname === `/${user?._id}` ? (
                      <div className="relative">
                        <RiStore2Fill size={19} className={`${
                          currentTheme === 'dark' ? 'text-white' : 
                          currentTheme === 'eyeCare' ? 'text-[#433422]' : 
                          'text-gray-900'
                        }`} />
                        <div className={`h-0.5 w-4 rounded-full absolute -bottom-1 left-1/2 transform -translate-x-1/2 ${
                          currentTheme === 'dark' ? 'bg-white/90' : 
                          currentTheme === 'eyeCare' ? 'bg-[#433422]/90' : 
                          'bg-gray-900/90'
                        }`}></div>
                      </div>
                    ) : (
                      <RiStore2Line size={19} className={`${
                        currentTheme === 'dark' ? 'text-gray-400' : 
                        currentTheme === 'eyeCare' ? 'text-[#433422]/70' : 
                        'text-gray-500'
                      }`} />
                    )}
                    <span className={`text-[10px] mt-0.5 font-medium ${
                      location.pathname === `/${user?._id}` 
                        ? currentTheme === 'dark' ? 'text-white' : 
                          currentTheme === 'eyeCare' ? 'text-[#433422]' : 'text-gray-900'
                        : currentTheme === 'dark' ? 'text-gray-400' : 
                          currentTheme === 'eyeCare' ? 'text-[#433422]/70' : 'text-gray-500'
                    }`}>Home</span>
                  </div>
                </Link>

                {/* Alerts */}
                <Link
                  to={`/${user?._id}/alerts`}
                  className="flex flex-col items-center justify-center w-14"
                >
                  <div className={`flex flex-col items-center transition-all duration-200 transform ${
                    location.pathname.includes(`/${user?._id}/alerts`) ? 'scale-105' : 'opacity-70 hover:opacity-100'
                  }`}>
                    {location.pathname.includes(`/${user?._id}/alerts`) ? (
                      <div className="relative">
                        <RiNotification3Fill size={19} className={`${
                          currentTheme === 'dark' ? 'text-white' : 
                          currentTheme === 'eyeCare' ? 'text-[#433422]' : 
                          'text-gray-900'
                        }`} />
                        <div className={`h-0.5 w-4 rounded-full absolute -bottom-1 left-1/2 transform -translate-x-1/2 ${
                          currentTheme === 'dark' ? 'bg-white/90' : 
                          currentTheme === 'eyeCare' ? 'bg-[#433422]/90' : 
                          'bg-gray-900/90'
                        }`}></div>
                      </div>
                    ) : (
                      <RiNotification3Line size={19} className={`${
                        currentTheme === 'dark' ? 'text-gray-400' : 
                        currentTheme === 'eyeCare' ? 'text-[#433422]/70' : 
                        'text-gray-500'
                      }`} />
                    )}
                    <span className={`text-[10px] mt-0.5 font-medium ${
                      location.pathname.includes(`/${user?._id}/alerts`) 
                        ? currentTheme === 'dark' ? 'text-white' : 
                          currentTheme === 'eyeCare' ? 'text-[#433422]' : 'text-gray-900'
                        : currentTheme === 'dark' ? 'text-gray-400' : 
                          currentTheme === 'eyeCare' ? 'text-[#433422]/70' : 'text-gray-500'
                    }`}>Alerts</span>
                  </div>
                </Link>

                {/* Center Search Button - Premium look */}
                <div className="flex flex-col items-center justify-center relative w-14">
                  <button
                    onClick={handleSearchClick}
                    className={`w-11 h-11 rounded-full flex items-center justify-center 
                      absolute -top-4 left-1/2 transform -translate-x-1/2
                      ${currentTheme === 'dark' 
                        ? 'bg-gradient-to-br from-gray-800 to-black border border-gray-700/30' 
                        : currentTheme === 'eyeCare'
                        ? 'bg-gradient-to-br from-[#433422] to-[#2A2015] border border-[#E6D5B8]/20'
                        : 'bg-gradient-to-br from-gray-900 to-black border border-white/10'
                      }
                      shadow-md transition-transform hover:scale-105 active:scale-95`}
                    style={{
                      boxShadow: '0 3px 10px rgba(0, 0, 0, 0.15)'
                    }}
                  >
                    <RiSearchLine size={20} className="text-white" />
                  </button>
                  <span className={`text-[10px] mt-6 font-medium ${
                    currentTheme === 'dark' ? 'text-gray-400' : 
                    currentTheme === 'eyeCare' ? 'text-[#433422]/70' : 'text-gray-500'
                  }`}>Search</span>
                </div>

                {/* Cart */}
                <Link
                  to={`/${user?._id}/cart`}
                  className="flex flex-col items-center justify-center w-14"
                >
                  <div className={`flex flex-col items-center transition-all duration-200 transform ${
                    location.pathname === `/${user?._id}/cart` ? 'scale-105' : 'opacity-70 hover:opacity-100'
                  }`}>
                    {location.pathname === `/${user?._id}/cart` ? (
                      <div className="relative">
                        <RiShoppingCartFill size={19} className={`${
                          currentTheme === 'dark' ? 'text-white' : 
                          currentTheme === 'eyeCare' ? 'text-[#433422]' : 
                          'text-gray-900'
                        }`} />
                        <div className={`h-0.5 w-4 rounded-full absolute -bottom-1 left-1/2 transform -translate-x-1/2 ${
                          currentTheme === 'dark' ? 'bg-white/90' : 
                          currentTheme === 'eyeCare' ? 'bg-[#433422]/90' : 
                          'bg-gray-900/90'
                        }`}></div>
                      </div>
                    ) : (
                      <RiShoppingCartLine size={19} className={`${
                        currentTheme === 'dark' ? 'text-gray-400' : 
                        currentTheme === 'eyeCare' ? 'text-[#433422]/70' : 
                        'text-gray-500'
                      }`} />
                    )}
                    <span className={`text-[10px] mt-0.5 font-medium ${
                      location.pathname === `/${user?._id}/cart` 
                        ? currentTheme === 'dark' ? 'text-white' : 
                          currentTheme === 'eyeCare' ? 'text-[#433422]' : 'text-gray-900'
                        : currentTheme === 'dark' ? 'text-gray-400' : 
                          currentTheme === 'eyeCare' ? 'text-[#433422]/70' : 'text-gray-500'
                    }`}>Cart</span>
                  </div>
                </Link>

                {/* Profile/Login */}
                <Link
                  to={localStorage.getItem('authToken') ? `/${user?._id}/profile` : '/login'}
                  className="flex flex-col items-center justify-center w-14"
                >
                  <div className={`flex flex-col items-center transition-all duration-200 transform ${
                    location.pathname.includes(`/${user?._id}/profile`) || location.pathname === '/login' ? 'scale-105' : 'opacity-70 hover:opacity-100'
                  }`}>
                    {localStorage.getItem('authToken') ? (
                      location.pathname.includes(`/${user?._id}/profile`) ? (
                        <div className="relative">
                          {user?.profilePicture?.url ? (
                            <div className="w-6 h-6 rounded-full overflow-hidden border border-white shadow-sm">
                              <img 
                                src={user.profilePicture.url} 
                                alt="Profile" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center overflow-hidden ${
                              currentTheme === 'dark'
                                ? 'bg-gradient-to-br from-white to-gray-200'
                                : currentTheme === 'eyeCare'
                                ? 'bg-[#E6D5B8]'
                                : 'bg-gradient-to-br from-gray-800 to-black'
                            }`}>
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
                            </div>
                          )}
                          <div className={`h-0.5 w-4 rounded-full absolute -bottom-1 left-1/2 transform -translate-x-1/2 ${
                            currentTheme === 'dark' ? 'bg-white/90' : 
                            currentTheme === 'eyeCare' ? 'bg-[#433422]/90' : 
                            'bg-gray-900/90'
                          }`}></div>
                        </div>
                      ) : (
                        <>
                          {user?.profilePicture?.url ? (
                            <div className="w-6 h-6 rounded-full overflow-hidden">
                              <img 
                                src={user.profilePicture.url} 
                                alt="Profile" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center overflow-hidden ${
                              currentTheme === 'dark'
                                ? 'bg-gradient-to-br from-white/90 to-gray-200/90'
                                : currentTheme === 'eyeCare'
                                ? 'bg-[#E6D5B8]/90'
                                : 'bg-gradient-to-br from-gray-800/90 to-black/90'
                            }`}>
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
                            </div>
                          )}
                        </>
                      )
                    ) : (
                      <RiUser3Line size={19} className={`${
                        currentTheme === 'dark' ? 'text-gray-400' : 
                        currentTheme === 'eyeCare' ? 'text-[#433422]/70' : 
                        'text-gray-500'
                      }`} />
                    )}
                    <span className={`text-[10px] mt-0.5 font-medium ${
                      localStorage.getItem('authToken') 
                        ? (location.pathname.includes(`/${user?._id}/profile`) 
                            ? currentTheme === 'dark' ? 'text-white' : 
                              currentTheme === 'eyeCare' ? 'text-[#433422]' : 'text-gray-900'
                            : currentTheme === 'dark' ? 'text-gray-400' : 
                              currentTheme === 'eyeCare' ? 'text-[#433422]/70' : 'text-gray-500')
                        : (location.pathname === '/login'
                            ? currentTheme === 'dark' ? 'text-white' : 
                              currentTheme === 'eyeCare' ? 'text-[#433422]' : 'text-gray-900'
                            : currentTheme === 'dark' ? 'text-gray-400' : 
                              currentTheme === 'eyeCare' ? 'text-[#433422]/70' : 'text-gray-500')
                    }`}>{localStorage.getItem('authToken') ? 'Profile' : 'Login'}</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add LogoutModal at the end */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
      />
    </>
  );
};

// Add LogoutModal component
const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
  const { currentTheme } = useTheme();
  
  return (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
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
        </React.Fragment>
      )}
    </AnimatePresence>
  );
};

export default Header; 