import { useState, useCallback, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { SidebarProvider } from './context/SidebarContext';
import BuyerDashboard from './pages/BuyerDashboard';
import Header from './components/layout/Header';
import Banner from './components/seller-dashboard/Banner';
import SearchBar from './components/seller-dashboard/SearchBar';
import Products from './components/seller-dashboard/Products';
import Categories from './components/seller-dashboard/Categories';
import ProductDetail from './components/seller-dashboard/ProductDetail';
import CartPage from './components/seller-dashboard/CartPage';
import CategoryProducts from './components/seller-dashboard/CategoryProducts';
import Alerts from './components/seller-dashboard/Alerts';
import Profile from './components/seller-dashboard/Profile';
import Settings from './components/seller-dashboard/Settings';
import Referrals from './components/seller-dashboard/Referrals';
import Orders from './components/seller-dashboard/Orders';
import Notifications from './components/seller-dashboard/Notifications';
import Wishlist from './components/seller-dashboard/Wishlist';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import AdminSidebar from './components/admin_dashboard/sidebar';
import AdminCategories from './components/admin_dashboard/categories/Categories';
import Product from './components/admin_dashboard/products/Products';
import ProductDetails from './components/admin_dashboard/products/ProductDetails';
import CheckoutPage from './components/seller-dashboard/checkout/CheckoutPage';
import OrderConfirmation from './components/seller-dashboard/checkout/OrderConfirmation';
import SubcategoryView from './components/seller-dashboard/SubcategoryView';
import Customers from './components/admin_dashboard/customers/Customers';
import CustomerDetails from './components/admin_dashboard/customers/CustomerDetails';
import OrderDetails from './components/seller-dashboard/OrderDetails';
import AdminOrders from './components/admin_dashboard/orders/AdminOrders';
import OrderDetail from './components/admin_dashboard/orders/OrderDetails';
import Search from './pages/Search';
import AdminNotifications from './components/admin_dashboard/notifications/AdminNotifications';
import NotificationListener from './components/NotificationListener';
import ReceivedNotifications from './components/admin_dashboard/notifications/ReceivedNotifications';
import ProfileA from './components/admin_dashboard/Profile';
import { Toaster } from 'sonner';
import NotificationDetail from './components/seller-dashboard/NotificationDetail';
import AdminBanner from './components/admin_dashboard/AdminBanner';
import FloatingContact from './components/FloatingContact';
import Team from './components/Team';

function AppRoutes() {
  const { currentTheme } = useTheme();
  const [cartItems, setCartItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);

  // Add this temporarily to debug
  useEffect(() => {
    console.log('Environment Variables:', {
      API_BASE_URL: process.env.REACT_APP_API_BASE_URL,
      BACKEND_URL: process.env.REACT_APP_BACKEND_URL,
      NETWORK_URL: process.env.REACT_APP_NETWORK_URL
    });
  }, []);

  // Props objects for components
  const cartProps = {
    cartItems,
    setCartItems,
    cartLoading,
    setCartLoading
  };

  // Create shared props for SearchBar and Products
  const categoryProps = {
    selectedCategories,
    setSelectedCategories,
    onCategoryChange: setSelectedCategories
  };

  return (
    <div className={`min-h-screen ${currentTheme === 'dark' ? 'dark' : ''}`}>
      <NotificationListener />
      <Routes>
        <Route path="/products" element={<Products {...categoryProps} />} />
        <Route path="/products/:productId" element={<ProductDetail {...cartProps} />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/categories/:categoryId" element={<CategoryProducts />} />

        <Route path="/" element={
          <>
            <Header className="fixed top-0 w-full z-50" />
            <BuyerDashboard />
            <FloatingContact />
          </>
        }>
          <Route index element={
            <>
              <Banner />
              <SearchBar {...categoryProps} />
              <Products {...categoryProps} />
            </>
          } />

          <Route path="products" element={<Products {...categoryProps} />} />
          <Route path="products/:productId" element={<ProductDetail {...cartProps} />} />
          <Route path="categories" element={<Categories />} />
          <Route path="categories/:categoryId" element={<CategoryProducts />} />
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/register" element={<Navigate to="/signup" replace />} />
        
        <Route path="/:userId/admin/*" element={
          <PrivateRoute>
            <div className="flex">
              <AdminSidebar />
              <main className="flex-1">
                <Routes>
                 
                  <Route path="dashboard" element={<div>Dashboard Coming Soon</div>} />
                  <Route path="products" element={<Product />} />
                  <Route path="product/:id" element={<ProductDetails />} />
                  <Route path="sellers" element={<div>Sellers Coming Soon</div>} />
                  <Route path="customers" element={<Customers />} />
                  <Route path="customers/:id" element={<CustomerDetails />} />
                  <Route path="orders" element={<AdminOrders/>} />
                  <Route path="orders/:id" element={<OrderDetail/>} />
                  <Route path="analytics" element={<div>Analytics Coming Soon</div>} />
                  <Route path="notifications" element={<AdminNotifications />} />
                  <Route path="notifications/received" element={<ReceivedNotifications />} />
                  <Route path="notifications/:notificationId" element={<NotificationDetail />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="banners" element={<AdminBanner />} />
                  <Route path="transactions" element={<div>Transactions Coming Soon</div>} />
                  <Route path="support" element={<div>Support Coming Soon</div>} />
                  <Route path="settings" element={<ProfileA />} />
                </Routes>
              </main>
              <FloatingContact />
            </div>
          </PrivateRoute>
        } />

        <Route path="/:userId/*" element={
          <PrivateRoute>
            <>
              <Header className="fixed top-0 w-full z-50" />
              <BuyerDashboard />
              <FloatingContact />
            </>
          </PrivateRoute>
        }>
          <Route index element={
            <>
              <Banner />
              <SearchBar {...categoryProps} />
              <Products {...categoryProps} />
            </>
          } />

          <Route path="products" element={<Products {...categoryProps} />} />
          <Route path="products/:productId" element={<ProductDetail {...cartProps} />} />
          <Route path="categories" element={<Categories />} />
          <Route path="categories/:categoryId" element={<CategoryProducts />} />
          <Route path="categories/:categoryId/subcategory/:subcategoryName" element={<SubcategoryView />} />

          <Route path="cart" element={<CartPage {...cartProps} />} />
          <Route path="checkout" element={<CheckoutPage {...cartProps} />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<Profile />} />
          <Route path="alerts/*" element={
            <Routes>
              <Route index element={<Alerts />} />

              <Route path="orders" element={<Orders />} />
              <Route path="orders/:orderId" element={<OrderDetails />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="notifications/:notificationId" element={<NotificationDetail />} />
              <Route path="wishlist" element={<Wishlist />} />
            </Routes>
          } />
          <Route path="checkout/confirmation" element={<OrderConfirmation currentTheme={currentTheme} />} />

          <Route path="team" element={
            <div className="pt-16 pb-24 md:pb-0">
              <Team />
            </div>
          } />
        </Route>

        <Route path="/" element={
          <PrivateRoute>
            <RootRedirect />
          </PrivateRoute>
        } />

        <Route path="referral" element={<Referrals />} />
        <Route path="/search" element={<Search />} />

        <Route path="/team" element={
          <>
            <Header className="fixed top-0 w-full z-50" />
            <div className="pt-16 pb-24 md:pb-0">
              <Team />
            </div>
            <FloatingContact />
          </>
        } />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <SidebarProvider>
            <Toaster position="top-center" richColors />
            <AppRoutes />
          </SidebarProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

const RootRedirect = () => {
  const { user } = useAuth();
  
  if (!user) return null;
  
  switch (user.role) {
    case 'seller':
      return <Navigate to={`/${user._id}/admin/dashboard`} />;
    case 'buyer':
      return <Navigate to={`/${user._id}/`} />;
    default:
      return null;
  }
};

export default App;