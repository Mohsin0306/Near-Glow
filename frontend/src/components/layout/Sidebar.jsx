import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiHome4Line,
  RiStore2Line,
  RiPriceTag3Line,
  RiShoppingCartLine,
  RiMenuFoldLine,
  RiMenuUnfoldLine,
  RiSettings4Line,
  RiUser3Line,
  RiLogoutBoxRLine,
  RiDashboardLine,
  RiSunLine,
  RiMoonLine,
  RiEyeLine,
  RiNotificationLine,
  RiArrowDownSLine,
  RiPlantFill,
  RiFireLine,
  RiDropFill,
  RiVipCrownLine,
  RiLeafLine,
  RiLayoutGridLine,
  RiLoginBoxLine,
  RiCloseLine,
  RiLoader4Line,
  RiStarLine,
  RiHeartLine,
  RiFlashlightLine,
  RiWaterFlashLine,
  RiPlantLine,
  RiLightbulbLine,
  RiMistLine,
  RiContrastLine,
  RiPaintBrushLine,
  RiTeamLine
} from 'react-icons/ri';
import { useTheme } from '../../context/ThemeContext';
import { themes } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { adminProfileAPI } from '../../utils/api';

// Create an icons mapping object
const iconMapping = {
  RiPlantFill,
  RiFireLine,
  RiDropFill,
  RiVipCrownLine,
  RiLeafLine,
  RiStarLine,
  RiHeartLine,
  RiFlashlightLine,
  RiWaterFlashLine,
  RiPlantLine,
  RiLightbulbLine,
  RiMistLine,
  RiContrastLine,
  RiPaintBrushLine,
  RiTeamLine
};

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeItem, setActiveItem] = useState('/');
  const location = useLocation();
  const navigate = useNavigate();
  const { currentTheme, toggleTheme } = useTheme();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showMobileProfile, setShowMobileProfile] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [hasAuthToken, setHasAuthToken] = useState(localStorage.getItem('authToken'));
  const [userData, setUserData] = useState(null);
  const { user, updateUser } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [adminInfo, setAdminInfo] = useState({
    businessName: 'Loading...',
    profilePicture: { url: '' }
  });

  useEffect(() => {
    setActiveItem(location.pathname);
  }, [location]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setIsExpanded(false);
    }
  }, [location.pathname, isMobile]);

  useEffect(() => {
    if (!isMobile) {
      const mainContent = document.body;
      mainContent.style.transition = 'padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      mainContent.style.paddingLeft = isExpanded ? '280px' : '70px';
    } else {
      document.body.style.transition = 'none';
      document.body.style.paddingLeft = '0';
    }

    return () => {
      document.body.style.transition = 'none';
      document.body.style.paddingLeft = '0';
    };
  }, [isExpanded, isMobile]);

  useEffect(() => {
    // This will re-check the auth token whenever it changes
    const checkAuthToken = () => {
      setHasAuthToken(localStorage.getItem('authToken'));
    };

    window.addEventListener('storage', checkAuthToken);
    checkAuthToken(); // Initial check

    return () => {
      window.removeEventListener('storage', checkAuthToken);
    };
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const response = await axios.get(
          'http://192.168.100.17:5000/api/buyers/profile',
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            withCredentials: true
          }
        );

        if (response.data.success && response.data.buyer) {
          updateUser(response.data.buyer); // Update the user in context
          setUserData(response.data.buyer); // Update local state
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          handleLogout();
        }
      }
    };

    fetchUserProfile();
  }, []); // Run once on mount

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('http://192.168.100.17:5000/api/categories');
        if (response.data.success && Array.isArray(response.data.data)) {
          // Map the categories to the format we need
          const mappedCategories = response.data.data.map(category => ({
            name: category.name,
            icon: category.icon && iconMapping[category.icon] ? iconMapping[category.icon] : RiPlantFill,
            path: `/categories/${category._id}`,
            description: category.description
          }));
          setCategories(mappedCategories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchAdminInfo = async () => {
      try {
        const response = await adminProfileAPI.getPublicInfo();
        setAdminInfo(response.data.data);
      } catch (error) {
        console.error('Failed to fetch admin info:', error);
        setAdminInfo({
          businessName: 'Admin Store',
          profilePicture: { url: '' }
        });
      }
    };

    fetchAdminInfo();
  }, []);

  const getSafePath = (basePath) => {
    if (userData && userData._id) {
      return `/${userData._id}${basePath}`;
    }
    return basePath;
  };

  const menuItems = [
    { 
      name: 'Home', 
      icon: <RiHome4Line />, 
      path: getSafePath('')
    },
    { 
      name: 'Categories', 
      icon: <RiLayoutGridLine />, 
      path: getSafePath('/categories'),
      hasDropdown: true,
      onClick: () => handleCategoryClick(getSafePath('/categories'))
    },
    { 
      path: getSafePath(`/products`), 
      name: 'Products', 
      icon: <RiStore2Line /> 
    },
    { 
      path: getSafePath(`/cart`), 
      name: 'Orders', 
      icon: <RiShoppingCartLine /> 
    },
    { 
      path: getSafePath(`/team`), 
      name: 'Team', 
      icon: <RiTeamLine /> 
    }
  ];



  // Profile menu items
  const profileMenuItems = [
    { name: 'Profile', icon: RiUser3Line, path: `/${userData?._id}/profile` },
    { name: 'Settings', icon: RiSettings4Line, path: `/${userData?._id}/settings` },
    { name: 'Login', icon: RiLogoutBoxRLine, onClick: () => navigate('/login') },
  ];

  // Animation variants
  const sidebarVariants = {
    expanded: {
      width: 240,
      transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
    },
    collapsed: {
      width: 64,
      transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
    },
    mobileExpanded: {
      x: 0,
      transition: { 
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    mobileCollapsed: {
      x: -240,
      transition: { 
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  const dropdownVariants = {
    open: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.2,
        ease: [0.4, 0, 0.2, 1]
      }
    },
    closed: {
      opacity: 0,
      y: -10,
      scale: 0.95,
      transition: {
        duration: 0.15,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };

  const overlayVariants = {
    open: {
      opacity: 1,
      transition: { duration: 0.3 }
    },
    closed: {
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  const getThemeStyles = (element) => {
    switch (currentTheme) {
      case 'dark':
        return themes.dark[element];
      case 'eyeCare':
        return themes.eyeCare[element];
      default:
        return themes.light[element];
    }
  };

  // Add this function to check if we're on a product detail page
  const isProductDetailPage = () => {
    return location.pathname.match(/\/[^/]+\/products\/[^/]+$/);
  };

  // Mobile Navbar Component with improved theme support
  const MobileNavbar = () => (
    !isProductDetailPage() && (
      <motion.div
        initial={false}
        animate={{
          backdropFilter: isExpanded ? "blur(8px)" : "blur(0px)",
          backgroundColor: isExpanded 
            ? currentTheme === 'dark' 
              ? 'rgba(17, 24, 39, 0.85)'
              : currentTheme === 'eyeCare'
              ? 'rgba(245, 230, 200, 0.85)'
              : 'rgba(255, 255, 255, 0.85)'
            : currentTheme === 'dark'
              ? 'rgb(17, 24, 39)'
              : currentTheme === 'eyeCare'
              ? 'rgb(245, 230, 200)'
              : 'rgb(255, 255, 255)'
        }}
        transition={{ duration: 0.2 }}
        className={`w-full px-4 py-3 flex items-center justify-between fixed top-0 left-0 right-0 z-50
          ${currentTheme === 'dark' 
            ? 'border-gray-800 text-gray-100' 
            : currentTheme === 'eyeCare'
            ? 'border-[#E6D5B8] text-[#433422]'
            : 'border-gray-200 text-gray-900'
          } border-b shadow-sm`}
      >
        {/* Left section with compact store name */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(true)}
            className={`flex items-center gap-2 p-1 rounded-lg transition-all duration-200 ${
              currentTheme === 'dark' 
                ? 'hover:bg-gray-800/50' 
                : currentTheme === 'eyeCare'
                ? 'hover:bg-[#E6D5B8]/50'
                : 'hover:bg-gray-100/50'
            }`}
          >
            {adminInfo.profilePicture?.url ? (
              <img 
                src={adminInfo.profilePicture.url}
                alt={adminInfo.businessName}
                className="w-8 h-8 rounded-lg object-cover shadow-md"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-gray-500 dark:text-gray-300 text-lg">
                  {adminInfo.businessName?.charAt(0) || 'A'}
                </span>
              </div>
            )}
            <span className={`text-base font-semibold truncate max-w-[120px] ${
              currentTheme === 'dark' 
                ? 'text-white' 
                : currentTheme === 'eyeCare'
                ? 'text-[#433422]'
                : 'text-gray-900'
            }`}>
              {adminInfo.businessName || 'Loading...'}
            </span>
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleTheme(
              currentTheme === 'light' ? 'dark' 
              : currentTheme === 'dark' ? 'eyeCare' 
              : 'light'
            )}
            className={`p-2 rounded-md transition-all duration-200 ${
              currentTheme === 'dark' 
                ? 'bg-gray-800 text-gray-400' 
                : currentTheme === 'eyeCare'
                ? 'bg-[#E6D5B8] text-[#433422]'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {currentTheme === 'dark' ? <RiMoonLine size={18} />
              : currentTheme === 'light' ? <RiSunLine size={18} />
              : <RiEyeLine size={18} />}
          </button>
          
          {hasAuthToken && userData ? (
            // Show Profile Button when logged in
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md overflow-hidden
                  ${!userData?.profilePicture?.url && (
                    currentTheme === 'dark'
                      ? 'bg-gradient-to-br from-white to-gray-200'
                      : 'bg-gradient-to-br from-gray-800 to-black'
                  )}
                `}
              >
                {userData?.profilePicture?.url ? (
                  <img 
                    src={userData.profilePicture.url} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className={`text-sm font-medium ${
                    currentTheme === 'dark' ? 'text-gray-900' : 'text-white'
                  }`}>
                    {userData?.firstName?.charAt(0)?.toUpperCase() || 
                     userData?.username?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showProfileDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
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
                        {userData?.username || 'User'}
                      </p>
                      <p className={`text-xs truncate max-w-[160px] ${
                        currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`} title={userData?.email || 'email@example.com'}>
                        {userData?.email || 'email@example.com'}
                      </p>
                    </div>
                    <div className="py-1">
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
                              <item.icon className="w-4 h-4 mr-3 flex-shrink-0" />
                              <span className="truncate">{item.name}</span>
                            </Link>
                          ) : (
                            <button
                              onClick={() => {
                                setShowProfileDropdown(false);
                                setShowLogoutModal(true);
                              }}
                              className={`w-full flex items-center px-3 py-2 text-sm rounded-md ${
                                currentTheme === 'dark' 
                                  ? 'text-red-400 hover:bg-gray-700' 
                                  : 'text-red-600 hover:bg-gray-100'
                              }`}
                            >
                              <RiLogoutBoxRLine className="w-4 h-4 mr-3 flex-shrink-0" />
                              <span className="truncate">Logout</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            // Show Login Button when not logged in
            <Link
              to="/login"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200
                bg-gradient-to-r from-gray-800 to-black hover:from-black hover:to-gray-900
                text-white shadow-md`}
            >
              <RiLoginBoxLine size={18} />
              <span className="text-sm font-medium">Login</span>
            </Link>
          )}
        </div>
      </motion.div>
    )
  );

  // Sidebar header with persistent admin name
  const SidebarHeader = () => (
    <div className={`p-4 flex items-center justify-between border-b ${
      currentTheme === 'dark' ? 'border-gray-800' : 'border-gray-200'
    }`}>
      <div className="flex items-center gap-2">
        {/* Store Logo */}
        {adminInfo.profilePicture?.url ? (
          <img 
            src={adminInfo.profilePicture.url}
            alt={adminInfo.businessName}
            className="w-8 h-8 rounded-lg object-cover shadow-md"
          />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <span className="text-gray-500 dark:text-gray-300 text-lg">
              {adminInfo.businessName?.charAt(0) || 'A'}
            </span>
          </div>
        )}

        {/* Store Name - Show only when expanded */}
        {isExpanded && (
          <div className="flex items-center">
            <h1 className={`font-semibold text-base whitespace-nowrap ${
              currentTheme === 'dark' 
                ? 'text-white' 
                : currentTheme === 'eyeCare'
                ? 'text-[#433422]'
                : 'text-gray-900'
            }`}>
              {adminInfo.businessName || 'Loading...'}
            </h1>
          </div>
        )}
      </div>

      {/* Mobile Close Button Only */}
      {isMobile && isExpanded && (
        <button
          onClick={() => setIsExpanded(false)}
          className={`p-1.5 rounded-lg transition-all duration-200 ${
            currentTheme === 'dark' 
              ? 'hover:bg-gray-800 text-gray-400' 
              : currentTheme === 'eyeCare'
              ? 'hover:bg-[#E6D5B8] text-[#433422]'
              : 'hover:bg-gray-100 text-gray-600'
          }`}
          title="Close sidebar"
        >
          <RiCloseLine size={18} />
        </button>
      )}
    </div>
  );

  // Profile dropdown with improved theme support
  const ProfileDropdown = () => (
    <AnimatePresence>
      {showProfileDropdown && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg py-1 z-50
            ${currentTheme === 'dark' ? 'bg-gray-800 border-gray-700' 
            : currentTheme === 'eyeCare' ? 'bg-[#F5E6C8] border-[#E6D5B8]'
            : 'bg-white border-gray-200'}
            border`}
        >
          <div className={`px-4 py-2 border-b ${
            currentTheme === 'dark' ? 'border-gray-700' 
            : currentTheme === 'eyeCare' ? 'border-[#E6D5B8]'
            : 'border-gray-200'
          }`}>
            <p className={`text-sm font-medium truncate ${
              currentTheme === 'dark' ? 'text-white' 
              : currentTheme === 'eyeCare' ? 'text-[#433422]'
              : 'text-gray-900'
            }`}>
              {userData?.username || 'User'}
            </p>
            <p className={`text-xs truncate max-w-[160px] ${
              currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`} title={userData?.email || 'email@example.com'}>
              {userData?.email || 'email@example.com'}
            </p>
          </div>
          <div className="py-1">
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
                    <item.icon className="w-4 h-4 mr-3 flex-shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      setShowLogoutModal(true);
                    }}
                    className={`w-full flex items-center px-3 py-2 text-sm rounded-md ${
                      currentTheme === 'dark' 
                        ? 'text-red-400 hover:bg-gray-700' 
                        : 'text-red-600 hover:bg-gray-100'
                    }`}
                  >
                    <RiLogoutBoxRLine className="w-4 h-4 mr-3 flex-shrink-0" />
                    <span className="truncate">Logout</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const handleCategoryClick = (path, isDropdownItem = false) => {
    if (!isDropdownItem) {
      // Main category button click
      setShowCategoryDropdown(!showCategoryDropdown);
    } else {
      // Dropdown item click
      setShowCategoryDropdown(false);
      const fullPath = getSafePath(path); // Get the correct path with user ID
      navigate(fullPath);
      
      // Only reload if we're already on a category page
      if (location.pathname.includes('/categories')) {
        window.location.reload();
      }
      
      if (isMobile) {
        setIsExpanded(false);
      }
    }
  };

  const getScrollbarStyle = () => {
    if (currentTheme === 'dark') {
      return `
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #1f2937;
        }
        ::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `;
    } else if (currentTheme === 'eyeCare') {
      return `
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #F5E6D3;
        }
        ::-webkit-scrollbar-thumb {
          background: #D4C3AA;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #433422;
        }
      `;
    } else {
      return `
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #f3f4f6;
        }
        ::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUserData(null);
    setHasAuthToken(null);
    navigate('/login');
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    handleLogout();
  };

  const handleAuthAction = () => {
    if (hasAuthToken) {
      handleLogout();
    } else {
      navigate('/login');
    }
  };

  const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop with higher z-index */}
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
            
            {/* Modal Container - ensures center positioning */}
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

  const UserProfileSection = () => {
    const isLoggedIn = userData && hasAuthToken;

    // Helper function to format name
    const formatDisplayName = () => {
      if (userData?.firstName && userData?.lastName) {
        const fullName = `${userData.firstName} ${userData.lastName}`;
        // If name is too long, truncate it
        return fullName.length > 18 
          ? `${fullName.substring(0, 18)}...`
          : fullName;
      }
      return userData?.username || 'User';
    };

    if (!isLoggedIn) {
      return (
        <div className={`mt-auto p-4 border-t ${
          currentTheme === 'dark' ? 'border-gray-800' : 'border-gray-200'
        }`}>
          <Link
            to="/login"
            className={`flex items-center justify-center gap-2 p-3 rounded-lg transition-all duration-200
              ${currentTheme === 'dark'
                ? 'bg-gradient-to-r from-gray-800 to-black hover:from-black hover:to-gray-900'
                : currentTheme === 'eyeCare'
                ? 'bg-[#8B4513] hover:bg-[#654321]'
                : 'bg-gradient-to-r from-gray-800 to-black hover:from-black hover:to-gray-900'
              } text-white shadow-lg`}
          >
            <RiLoginBoxLine size={20} />
            {isExpanded && <span className="font-medium">Login</span>}
          </Link>
        </div>
      );
    }

    return (
      <div className={`mt-auto p-4 border-t ${
        currentTheme === 'dark' ? 'border-gray-800' : 'border-gray-200'
      }`}>
        <div className="flex items-center w-full">
          <Link
            to={`/${userData?._id}/profile`}
            className={`flex items-center gap-3 ${isExpanded ? 'flex-1' : ''} 
              transition-all duration-200 rounded-lg
              ${currentTheme === 'dark' 
                ? 'hover:bg-gray-800' 
                : currentTheme === 'eyeCare'
                ? 'hover:bg-[#E6D5B8]'
                : 'hover:bg-gray-100'
              }
              p-2
            `}
          >
            {/* Profile Picture or Initial */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md 
              ${userData?.profilePicture?.url 
                ? '' 
                : currentTheme === 'dark'
                  ? 'bg-gradient-to-br from-white to-gray-200'
                  : 'bg-gradient-to-br from-gray-800 to-black'
              }`}
            >
              {userData?.profilePicture?.url ? (
                <img 
                  src={userData.profilePicture.url} 
                  alt="Profile" 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className={`text-sm font-medium ${
                  currentTheme === 'dark' ? 'text-gray-900' : 'text-white'
                }`}>
                  {userData?.firstName?.charAt(0)?.toUpperCase() || 
                   userData?.username?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              )}
            </div>

            {/* User Details - Only when expanded */}
            {isExpanded && (
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium truncate ${
                  currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}
                  title={userData?.firstName 
                    ? `${userData.firstName} ${userData.lastName || ''}`
                    : userData?.username || 'User'}
                >
                  {formatDisplayName()}
                </p>
                <p className={`text-xs truncate ${
                  currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`} 
                  title={userData?.email}
                >
                  {userData?.email?.length > 20 
                    ? `${userData.email.substring(0, 17)}...` 
                    : userData?.email || ''}
                </p>
              </div>
            )}
          </Link>

          {/* Logout Button - Only when expanded */}
          {isExpanded && (
            <button
              onClick={() => setShowLogoutModal(true)}
              className={`flex-shrink-0 p-2 rounded-lg transition-all duration-200 ml-2 ${
                currentTheme === 'dark' 
                  ? 'text-gray-400 hover:bg-gray-800 hover:text-white' 
                  : currentTheme === 'eyeCare'
                  ? 'text-[#433422] hover:bg-[#E6D5B8]'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Logout"
            >
              <RiLogoutBoxRLine size={20} />
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderCategoryDropdown = () => {
    if (categoriesLoading) {
      return (
        <div className={`w-full flex items-center justify-center py-4 ${
          currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          <RiLoader4Line className="animate-spin text-xl" />
        </div>
      );
    }

    if (categories.length === 0) {
      return (
        <div className={`w-full text-center py-4 ${
          currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          No categories available
        </div>
      );
    }

    return categories.map((category) => {
      const IconComponent = category.icon;
      return (
        <button
          key={category.path}
          onClick={() => handleCategoryClick(category.path, true)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200
            ${currentTheme === 'dark'
              ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
              : currentTheme === 'eyeCare'
              ? 'text-[#433422] hover:bg-[#E6D5B8]'
              : 'text-gray-600 hover:bg-gray-100'
            }`}
          title={category.description}
        >
          <IconComponent size={18} />
          <span className="font-medium">{category.name}</span>
        </button>
      );
    });
  };

  return (
    <>
      <style>
        {getScrollbarStyle()}
      </style>
      
      {isMobile && <MobileNavbar />}
      
      <AnimatePresence>
        {isMobile && isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>

      <div className="relative">
        {/* Hamburger Button - Desktop Only */}
        {!isMobile && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`fixed top-1/2 -translate-y-1/2 -translate-x-1/2 
              w-6 h-16 rounded-r-lg
              flex items-center justify-center shadow-lg
              transition-all duration-300 ease-in-out z-30
              ${currentTheme === 'dark' 
                ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' 
                : currentTheme === 'eyeCare'
                ? 'bg-[#E6D5B8] text-[#433422] hover:bg-[#D4C3A3]'
                : 'bg-white text-gray-600 hover:bg-gray-50'
              }
              ${getThemeStyles('border')}
              border-t border-r border-b
            `}
            style={{
              left: isExpanded ? '280px' : '70px',
              transform: 'translate(-50%, -50%)'
            }}
            title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isExpanded 
              ? <RiMenuFoldLine size={14} /> 
              : <RiMenuUnfoldLine size={14} />
            }
          </button>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key="sidebar"
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
              overflow: 'hidden',
              backgroundColor: currentTheme === 'dark' 
                ? '#111827' // dark theme
                : currentTheme === 'eyeCare'
                ? '#F5E6C8' // eye care theme
                : '#ffffff', // light theme
            }}
            transition={isMobile ? {
              type: "spring",
              stiffness: 300,
              damping: 30
            } : {
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1]
            }}
            className={`fixed top-0 left-0 h-screen flex flex-col border-r z-50
              ${getThemeStyles('border')}
              ${!isMobile && 'group'}
              overflow-x-hidden
              shadow-xl
            `}
          >
            <SidebarHeader />
            
            {/* Sidebar Content - Added overflow control */}
            <div className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
              <div className="px-3 space-y-1 overflow-y-auto overflow-x-hidden max-h-[calc(100vh-200px)]">
                {menuItems.map((item) => (
                  <motion.div
                    key={item.path}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {item.hasDropdown ? (
                      <div className="flex flex-col">
                        <div className="flex">
                          <Link 
                            to={item.path}
                            className={`flex-grow w-[70%] flex items-center gap-3 px-3 py-2.5 rounded-l-lg transition-all duration-200
                              ${activeItem === item.path
                                ? currentTheme === 'dark'
                                  ? 'bg-gradient-to-r from-white to-gray-200 text-gray-900 shadow-md'
                                  : 'bg-gradient-to-r from-gray-800 to-black text-white shadow-md'
                                : currentTheme === 'dark'
                                ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                : currentTheme === 'eyeCare'
                                ? 'text-[#433422] hover:bg-[#E6D5B8]'
                                : 'text-gray-600 hover:bg-gray-100'
                              }
                            `}
                          >
                            <span className="text-xl">{item.icon}</span>
                            {isExpanded && (
                              <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="font-medium text-sm"
                              >
                                {item.name}
                              </motion.span>
                            )}
                          </Link>

                          {isExpanded && (
                            <button 
                              onClick={handleCategoryClick}
                              className={`dropdown-trigger w-[30%] flex items-center justify-center rounded-r-lg transition-all duration-200
                                ${activeItem === item.path
                                  ? currentTheme === 'dark'
                                    ? 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-900'
                                    : 'bg-gradient-to-r from-gray-700 to-gray-800 text-white'
                                  : currentTheme === 'dark'
                                  ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                  : currentTheme === 'eyeCare'
                                  ? 'text-[#433422] hover:bg-[#E6D5B8]'
                                  : 'text-gray-600 hover:bg-gray-100'
                                }
                              `}
                            >
                              <RiArrowDownSLine 
                                className={`transform transition-transform duration-200 ${
                                  showCategoryDropdown ? 'rotate-180' : ''
                                }`} 
                              />
                            </button>
                          )}
                        </div>

                        {/* Categories Dropdown */}
                        {showCategoryDropdown && isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mt-1 ml-2 space-y-1"
                          >
                            {renderCategoryDropdown()}
                          </motion.div>
                        )}
                      </div>
                    ) : (
                      <Link 
                        to={item.path}
                        onClick={() => isMobile && setIsExpanded(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 whitespace-nowrap
                          ${activeItem === item.path
                            ? currentTheme === 'dark'
                              ? 'bg-gradient-to-r from-white to-gray-200 text-gray-900 shadow-md'
                              : 'bg-gradient-to-r from-gray-800 to-black text-white shadow-md'
                            : currentTheme === 'dark'
                            ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            : currentTheme === 'eyeCare'
                            ? 'text-[#433422] hover:bg-[#E6D5B8]'
                            : 'text-gray-600 hover:bg-gray-100'
                          }
                          ${!isExpanded && 'justify-center'}
                        `}
                      >
                        <span className="text-xl min-w-[20px] flex items-center justify-center">{item.icon}</span>
                        <AnimatePresence mode="wait">
                          {isExpanded && (
                            <motion.span
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -10 }}
                              className="font-medium text-sm overflow-hidden text-ellipsis"
                            >
                              {item.name}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </Link>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Settings Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-6 px-3 pt-6 border-t ${
                  currentTheme === 'dark' ? 'border-gray-800' : 'border-gray-200'
                }`}
              >
                {[
                  { name: 'Settings', icon: RiSettings4Line, path: `/${userData?._id}/settings` },
                  { name: 'Notifications', icon: RiNotificationLine, path: `/${userData?._id}/alerts` },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all duration-200
                        ${currentTheme === 'dark'
                          ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                        }
                        ${!isExpanded && 'justify-center'}
                      `}
                    >
                      <span className="text-xl"><item.icon /></span>
                      {isExpanded && (
                        <span className="font-medium text-sm">{item.name}</span>
                      )}
                    </Link>
                  </motion.div>
                ))}
              </motion.div>

              {/* Replace the old logout button with the new UserProfileSection */}
              <UserProfileSection />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Add the logout modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
      />
    </>
  );
};

export default Sidebar;