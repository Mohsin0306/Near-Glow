import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(true);
  const [referralData, setReferralData] = useState({
    referralCode: '',
    referralLink: '',
    referralCoins: 0,
    totalReferrals: 0
  });

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('authToken');
      const userData = localStorage.getItem('user');
      const lastLoginTime = localStorage.getItem('lastLoginTime');
      
      // Check if we have valid stored credentials and they haven't expired
      if (storedToken && userData && lastLoginTime) {
        try {
          // Check if the login has expired (e.g., after 30 days)
          const loginExpiry = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
          const loginTime = parseInt(lastLoginTime);
          const currentTime = new Date().getTime();

          if (currentTime - loginTime < loginExpiry) {
            setToken(storedToken);
            setIsAuthenticated(true);
            setUser(JSON.parse(userData));
          } else {
            // Login expired, clear storage
            logout();
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          logout();
          toast.error('Authentication error. Please login again.');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (newToken, userData) => {
    if (newToken) {
      // Store auth data with timestamp
      localStorage.setItem('authToken', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('lastLoginTime', new Date().getTime().toString());
      
      setToken(newToken);
      setIsAuthenticated(true);
      setUser(userData);
      toast.success('Successfully logged in!');
    }
  };

  const logout = () => {
    const hadToken = localStorage.getItem('authToken');
    // Clear all auth-related data
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('lastLoginTime');
    localStorage.removeItem('redirectPath');
    
    setToken(null);
    setIsAuthenticated(false);
    setUser(null);
    
    if (hadToken) {
      toast.success('Successfully logged out');
    }
  };

  const isAdmin = user?.role === 'seller';

  const checkAuthorizedPath = (pathname) => {
    // Public routes that don't require authentication
    const publicPaths = [
      '/products',
      '/categories',
      '/login',
      '/signup',
      '/register'
    ];

    // Check if it's a product detail page or category detail page
    const isProductDetailPage = pathname.match(/^\/products\/[^/]+$/);
    const isCategoryDetailPage = pathname.match(/^\/categories\/[^/]+$/);
    
    // If it's a public page, allow access
    if (isProductDetailPage || isCategoryDetailPage || publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'))) {
      return true;
    }
    
    if (!isAuthenticated) {
      // Don't store redirect path for public routes
      if (!isProductDetailPage && !isCategoryDetailPage && !publicPaths.some(path => pathname.startsWith(path))) {
        localStorage.setItem('redirectPath', pathname);
      }
      return false;
    }
    
    // If user is admin, they should only access admin routes
    if (isAdmin) {
      return pathname.includes('/admin');
    }
    // If user is not admin, they shouldn't access admin routes
    return !pathname.includes('/admin');
  };

  const updateUser = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const updateReferralData = (data) => {
    setReferralData(data);
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      setIsAuthenticated, 
      user, 
      setUser,
      token,
      updateUser,
      loading,
      login,
      logout,
      isAdmin,
      checkAuthorizedPath,
      referralData,
      updateReferralData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 