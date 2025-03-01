import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading, user, checkAuthorizedPath } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Add public paths that don't require authentication
  const publicPaths = ['/', '/login', '/signup', '/products', '/categories'];
  
  // Check if the current path is a public path or starts with one
  const isPublicPath = publicPaths.some(path => 
    location.pathname === path || 
    location.pathname.startsWith('/products/') || 
    location.pathname.startsWith('/categories/')
  );

  useEffect(() => {
    // Handle back button from login page
    const handlePopState = (event) => {
      if (location.pathname === '/login' && !isAuthenticated) {
        navigate(-1);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [location.pathname, isAuthenticated, navigate]);

  if (isPublicPath) {
    return children;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    // Store the current location for redirect after login
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // For authenticated users, check if they're accessing their own routes
  const pathUserId = location.pathname.split('/')[1];
  if (pathUserId && pathUserId !== user._id) {
    // If trying to access another user's route, redirect to their own
    if (user.role === 'seller') {
      return <Navigate to={`/${user._id}/admin/dashboard`} replace />;
    }
    return <Navigate to={`/${user._id}/home`} replace />;
  }

  // Check if user is authorized for this path
  if (!checkAuthorizedPath(location.pathname)) {
    // Redirect admin to admin dashboard
    if (user?.role === 'seller') {
      return <Navigate to={`/${user._id}/admin/dashboard`} replace />;
    }
    // Redirect regular user to home
    return <Navigate to={`/${user._id}/home`} replace />;
  }

  return children;
};

export default PrivateRoute; 