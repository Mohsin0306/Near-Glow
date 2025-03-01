import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('authToken');
      const userData = localStorage.getItem('user');
      
      if (storedToken && userData) {
        try {
          setToken(storedToken);
          setIsAuthenticated(true);
          setUser(JSON.parse(userData));
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
      localStorage.setItem('authToken', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(newToken);
      setIsAuthenticated(true);
      setUser(userData);
      toast.success('Successfully logged in!');
    }
  };

  const logout = () => {
    const hadToken = localStorage.getItem('authToken');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
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
      checkAuthorizedPath
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 