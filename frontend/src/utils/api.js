import axios from 'axios';
import { toast } from 'sonner';
import config from '../config/config';

const API_URL = 'http://localhost:5000/api'; // Replace with your actual API base URL

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('ur-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    currencyDisplay: 'narrowSymbol'
  }).format(amount).replace('PKR', 'Rs');
};

// Create API instance with auth token
const createAPI = (token) => {
  const baseURL = (process.env.REACT_APP_API_BASE_URL || 'http://192.168.100.17:5000').replace(/\/+$/, '');
  
  console.log('Creating API instance:', {
    baseURL: `${baseURL}/api`,
    hasToken: !!token
  });

  const api = axios.create({
    baseURL: `${baseURL}/api`,
    headers: {
      'Content-Type': 'application/json',
    }
  });
  
  // Add auth token if provided
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // Add request interceptor for logging
  api.interceptors.request.use(
    (config) => {
      console.log('Making API Request:', {
        method: config.method,
        url: config.url,
        data: config.data,
        headers: config.headers
      });
      return config;
    },
    (error) => {
      console.error('API Request Error:', error);
      return Promise.reject(error);
    }
  );

  // Add response interceptor for logging
  api.interceptors.response.use(
    (response) => {
      console.log('API Response:', {
        status: response.status,
        data: response.data,
        url: response.config.url
      });
      return response;
    },
    (error) => {
      console.error('API Response Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      return Promise.reject(error);
    }
  );

  // Modify the response interceptor to not redirect for product routes
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Don't redirect if it's a product route
        const isProductRoute = window.location.pathname.match(/^\/products\/[^/]+$/);
        if (!isProductRoute) {
          // Only remove token if it exists
          const existingToken = localStorage.getItem('authToken');
          if (existingToken) {
            localStorage.removeItem('authToken');
            toast.error('Session expired. Please login again.');
            window.location.href = '/login';
          } else {
            toast.error('Please login to continue');
          }
        }
      }
      return Promise.reject(error);
    }
  );

  // Add response interceptor for handling token expiration
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      // Handle token expiration
      if (error.response && error.response.status === 401) {
        // Check if the error is due to token expiration
        if (error.response.data.message === 'Token expired' || 
            error.response.data.message === 'Invalid token') {
          // Clear auth data from local storage
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          
          // Redirect to login page
          window.location.href = '/login?expired=true';
        }
      }
      
      return Promise.reject(error);
    }
  );

  return api;
};

const orderAPI = {
  createOrder: async (orderData, token) => {
    const api = createAPI(token);
    return api.post('/orders', orderData);
  },

  getOrders: async (token) => {
    const api = createAPI(token);
    return api.get('/orders');
  },

  getOrderById: async (orderId, token) => {
    const api = createAPI(token);
    return api.get(`/orders/${orderId}`);
  },

  cancelOrder: async (orderId, token) => {
    const api = createAPI(token);
    return api.post(`/orders/${orderId}/cancel`);
  },

  updateOrderStatus: async (orderId, data, token) => {
    const api = createAPI(token);
    return api.put(`/orders/${orderId}/status`, data);
  },

  getAdminOrders: async (token, filters = {}) => {
    const api = createAPI(token);
    const {
      status,
      search,
      sort = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 20
    } = filters;

    const params = new URLSearchParams({
      ...(status !== 'all' && { status }),
      ...(search && { search }),
      sort,
      order,
      page: page.toString(),
      limit: limit.toString()
    });

    return api.get(`/orders/admin/orders?${params}`);
  },

  calculateReferralDiscount: async (totalAmount, token) => {
    const api = createAPI(token);
    return api.post('/orders/calculate-discount', { totalAmount });
  },

  getOrderConfirmation: async (orderId, token) => {
    if (!orderId) {
      console.error('No order ID provided');
      throw new Error('Order ID is required');
    }
    
    const api = createAPI(token);
    console.log('Fetching order confirmation for:', orderId);
    return api.get(`/orders/${orderId}/confirmation`);
  },

  getSavedAddresses: async (token) => {
    try {
      const response = await axios({
        method: 'GET',
        url: `/api/orders/saved-addresses`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response;
    } catch (error) {
      console.error('Error fetching saved address:', error);
      throw error;
    }
  },

  saveAddress: async (addressData, token) => {
    try {
      const response = await axios.post('/api/orders/save-address', addressData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  createDirectOrder: async (orderData, token) => {
    try {
      console.log('Creating direct order with params:', {
        productId: orderData.productId,
        quantity: orderData.quantity,
        colorId: orderData.colorId,
        paymentMethod: orderData.paymentMethod,
        useReferralCoins: orderData.useReferralCoins,
        // Include other relevant fields for debugging
      });
      
      const api = createAPI(token);
      const response = await api.post('/orders/direct-purchase', orderData);
      return response;
    } catch (error) {
      console.error('Error creating direct order:', error);
      throw error;
    }
  }
};

const buyerAPI = {
  getBuyerDetails: async (buyerId, token) => {
    const api = createAPI(token);
    return api.get(`/buyers/${buyerId}`);
  },

  getBuyerOrders: async (buyerId, token) => {
    const api = createAPI(token);
    return api.get(`/buyers/${buyerId}/orders`);
  },

  getBuyerCart: async (buyerId, token) => {
    const api = createAPI(token);
    return api.get(`/buyers/${buyerId}/cart`);
  },

  getBuyerWishlist: async (buyerId, token) => {
    const api = createAPI(token);
    return api.get(`/buyers/${buyerId}/wishlist`);
  },

  getBuyerFullDetails: async (buyerId, token) => {
    const api = createAPI(token);
    return api.get(`/buyers/${buyerId}/full-details`);
  }
};

const cartAPI = {
  addToCart: async (data, token) => {
    const api = createAPI(token);
    return api.post('/cart/add', {
      productId: data.productId,
      quantity: data.quantity,
      colorId: data.colorId
    });
  },

  removeFromCart: async (productId, token) => {
    const api = createAPI(token);
    return api.delete(`/cart/remove/${productId}`);
  },

  updateCartItem: async (itemId, data) => {
    const api = createAPI(localStorage.getItem('authToken'));
    return api.patch(`/cart/update/${itemId}`, data);
  },

  getCart: async (token) => {
    const api = createAPI(token);
    return api.get('/cart');
  },

  clearCart: async (token) => {
    const api = createAPI(token);
    return api.delete('/cart/clear');
  },

  toggleItemSelection: async (productId, selected, token) => {
    const api = createAPI(token);
    return api.put('/cart/toggle-selection', { productId, selected });
  },

  validateCartForCheckout: async (token) => {
    const api = createAPI(token);
    return api.get('/cart/validate-checkout');
  },

  directPurchase: async (productId, orderData, token) => {
    const api = createAPI(token);
    try {
      // Only include selectedColor if it exists
      const payload = {
        productId,
        quantity: orderData.quantity,
        ...(orderData.selectedColor && { selectedColor: orderData.selectedColor }),
        shippingAddress: orderData.shippingAddress,
        paymentMethod: orderData.paymentMethod || 'cod',
        paymentDetails: orderData.paymentDetails || {},
        useReferralCoins: orderData.useReferralCoins || false,
        finalAmount: orderData.totalAmount,
        totalAmount: orderData.totalAmount,
        deliveryPrice: orderData.deliveryPrice || 0
      };
      
      console.log('Direct purchase payload:', payload);
      
      const response = await api.post('/cart/direct-purchase', payload);
      console.log('Direct purchase response:', response.data);
      return response;
    } catch (error) {
      console.error('Direct purchase error:', error);
      throw error;
    }
  },

  validateDirectPurchase: async (data, token) => {
    try {
      console.log('Validating direct purchase with data:', data);
      const api = createAPI(token);
      
      // Ensure we're sending the correct format for color
      const payload = {
        productId: data.productId,
        quantity: data.quantity || 1,
        // Only send colorId if it exists
        ...(data.colorId && { colorId: data.colorId })
      };
      
      console.log('Sending payload to validate-direct-purchase:', payload);
      
      const response = await api.post('/cart/validate-direct-purchase', payload);
      
      console.log('Direct purchase validation response:', response.data);
      return response;
    } catch (error) {
      console.error('Direct purchase validation error:', error);
      throw error;
    }
  }
};

const productAPI = {
  getProducts: async () => {
    const api = createAPI();
    return api.get('/products');
  },

  createProduct: async (formData, token) => {
    const api = createAPI(token);
    return api.post('/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  updateProduct: async (productId, formData, token) => {
    const api = createAPI(token);
    return api.put(`/products/${productId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  deleteProduct: async (productId, token) => {
    const api = createAPI(token);
    return api.delete(`/products/${productId}`);
  },

  getProductById: async (productId) => {
    const api = createAPI();
    return api.get(`/products/${productId}`);
  }
};

const notificationAPI = {
  sendAdminMessage: async (notificationData, token) => {
    const api = createAPI(token);
    return api.post('/notifications/admin-message', {
      ...notificationData,
      type: 'ADMIN_MESSAGE'
    });
  },

  getUserNotifications: async (token, params = {}) => {
    const api = createAPI(token);
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 20,
      filter: params.filter || 'all',
      search: params.search || '',
      isAdmin: params.isAdmin || false
    });
    return api.get(`/notifications/list?${queryParams}`);
  },

  getAdminNotifications: async (token, params = {}) => {
    const api = createAPI(token);
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 20,
      filter: params.filter || 'all',
      search: params.search || '',
      isAdmin: true
    });
    return api.get(`/notifications/admin/list?${queryParams}`);
  },

  markAsRead: async (notificationId, token) => {
    const api = createAPI(token);
    return api.put(`/notifications/${notificationId}/read`);
  },

  markAllAsRead: async (token) => {
    const api = createAPI(token);
    return api.put('/notifications/read-all');
  },

  getCustomers: async (token) => {
    const api = createAPI(token);
    return api.get('/chat/admin-buyer-chats');
  },

  getNotificationById: async (notificationId, token) => {
    const api = createAPI(token);
    return api.get(`/notifications/${notificationId}`);
  },

  getNotificationPreferences: async (token) => {
    const api = createAPI(token);
    return api.get('/notifications/preferences');
  },

  updateNotificationPreferences: async (preferences, token) => {
    const api = createAPI(token);
    return api.put('/notifications/preferences', preferences);
  },

  registerPushSubscription: async (subscription, token) => {
    const api = createAPI(token);
    return api.post('/push-subscription', { subscription });
  }
};

const adminProfileAPI = {
  getProfile: async (token) => {
    const api = createAPI(token);
    return api.get('/admin/profile');
  },

  updateProfile: async (profileData, token) => {
    const api = createAPI(token);
    return api.put('/admin/profile', {
      username: profileData.username,
      name: profileData.name,
      email: profileData.email,
      phoneNumber: profileData.phoneNumber,
      bio: profileData.bio,
      socialLinks: profileData.socialLinks,
      businessDetails: profileData.businessDetails
    });
  },

  updateProfilePicture: async (formData, token) => {
    const api = createAPI(token);
    return api.put('/admin/profile/picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  deleteProfilePicture: async (token) => {
    const api = createAPI(token);
    return api.delete('/admin/profile/picture');
  },

  getPublicInfo: async () => {
    const api = createAPI();
    return api.get('/admin/profile/public-info');
  }
};

const chatAPI = {
  createChat: async (participantId, token) => {
    console.log('Creating chat with:', { participantId, hasToken: !!token });

    if (!participantId || !token) {
      throw new Error(`Invalid parameters: participantId=${participantId}, hasToken=${!!token}`);
    }

    const api = createAPI(token);
    return api.post('/chat/create', { adminId: participantId });
  },

  getBuyerAdminChats: async (token) => {
    const api = createAPI(token);
    return api.get('/chat/buyer-admin-chats');
  },

  getAdminBuyerChats: async (token) => {
    const api = createAPI(token);
    return api.get('/chat/admin-buyer-chats');
  },

  sendMessage: async (chatId, content, token) => {
    const api = createAPI(token);
    return api.post(`/chat/${chatId}/messages`, { content });
  },

  getChatMessages: async (chatId, token) => {
    const api = createAPI(token);
    return api.get(`/chat/${chatId}/messages`);
  }
};

const categoryAPI = {
  getCategories: async () => {
    const api = createAPI();
    return api.get('/categories');
  },

  getCategoryById: async (categoryId) => {
    const api = createAPI();
    return api.get(`/categories/${categoryId}`);
  },

  getCategoryProducts: async (categoryId) => {
    const api = createAPI();
    return api.get(`/products/category/${categoryId}`);
  }
};

const recentAPI = {
  getRecentActivities: async (token, params = {}) => {
    try {
      const api = createAPI(token);
      console.log('API Request params:', params); // Debug log
      const response = await api.get('/recent', { params });
      return response;
    } catch (error) {
      console.error('API Error:', error.response || error);
      throw error.response?.data || error;
    }
  },

  markAsRead: async (notificationId, token) => {
    const api = createAPI(token);
    return api.put(`/recent/${notificationId}/read`);
  },

  markAllAsRead: async (token) => {
    const api = createAPI(token);
    return api.put('/recent/read-all');
  },

  clearRecentActivities: async (token, params = {}) => {
    try {
      const api = createAPI(token);
      console.log('Clearing recent activities with params:', params);
      
      const response = await api.post('/recent/clear', {}, {
        params,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('Clear response:', response.data);
      return response;
    } catch (error) {
      console.error('Clear activities error:', error.response || error);
      throw {
        success: false,
        message: error.response?.data?.message || 'Failed to clear activities',
        error: error.response?.data?.error || error.message
      };
    }
  }
};

const bannerAPI = {
  getBanners: async () => {
    const api = createAPI();
    return api.get('/banners');
  },

  createBanner: async (formData, token) => {
    const api = createAPI(token);
    return api.post('/banners', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  updateBanner: async (bannerId, formData, token) => {
    const api = createAPI(token);
    return api.put(`/banners/${bannerId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  deleteBanner: async (bannerId, token) => {
    const api = createAPI(token);
    return api.delete(`/banners/${bannerId}`);
  }
};

const referralAPI = {
  getReferralCode: async (token) => {
    const api = createAPI(token);
    return api.get('/referral/code');
  },

  getReferralStats: async (token) => {
    const api = createAPI(token);
    return api.get('/referral/stats');
  },

  useReferralCoins: async (coinsToUse, token) => {
    const api = createAPI(token);
    return api.post('/referral/use-coins', { coinsToUse });
  }
};

const campaignAPI = {
  getCampaigns: async (token) => {
    const api = createAPI(token);
    return api.get('/campaigns', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  getCampaignById: async (campaignId, token) => {
    const api = createAPI(token);
    return api.get(`/campaigns/${campaignId}`);
  },

  getCampaignProducts: async (campaignId, token) => {
    const api = createAPI(token);
    return api.get(`/campaigns/${campaignId}/products`);
  },

  addProductToCampaign: async (campaignId, productId, discountPercent, token) => {
    const api = createAPI(token);
    return api.post(`/campaigns/${campaignId}/products`, {
      productId,
      discountPercent
    });
  },

  removeProductFromCampaign: async (campaignId, productId, token) => {
    const api = createAPI(token);
    return api.delete(`/campaigns/${campaignId}/products/${productId}`);
  },

  createCampaign: async (formData, token) => {
    try {
      console.log('Creating campaign with data:', {
        title: formData.get('title'),
        hasLink: !!formData.get('link'),
        hasImage: !!formData.get('image')
      });
      
      const api = createAPI(token);
      return api.post('/campaigns', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  },

  updateCampaign: async (formData, token) => {
    const api = createAPI(token);
    return api.put(`/campaigns/${formData.get('campaignId')}`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  updateCampaignStatus: async (campaignId, token) => {
    const api = createAPI(token);
    return api.put(`/campaigns/${campaignId}/status`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  deleteCampaign: async (campaignId, token) => {
    const api = createAPI(token);
    return api.delete(`/campaigns/${campaignId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  getActiveCampaigns: async () => {
    const api = createAPI();
    return api.get('/campaigns/active');
  },

  addProductsBatchToCampaign: async (campaignId, data, token) => {
    try {
      console.log('API call - adding products to campaign:', campaignId, data);
      console.log('Using API URL:', API_URL);
      
      // Format the data correctly for the API
      const formattedData = {
        products: data.products,
        discount: data.discount
      };
      
      return await axios.post(
        `${API_URL}/campaigns/${campaignId}/products/batch`,
        formattedData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
    } catch (error) {
      console.error('API Error - addProductsBatchToCampaign:', error);
      throw error;
    }
  },

  getCampaignProducts: async (campaignId, token) => {
    return axios.get(`/api/campaigns/${campaignId}/products`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  removeProductFromCampaign: async (campaignId, productId, token) => {
    return axios.delete(`/api/campaigns/${campaignId}/products/${productId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
};

// Export all APIs
export {
  createAPI,
  formatCurrency,
  orderAPI,
  buyerAPI,
  cartAPI,
  productAPI,
  notificationAPI,
  adminProfileAPI,
  chatAPI,
  categoryAPI,
  recentAPI,
  bannerAPI,
  referralAPI,
  campaignAPI
};

// Export a default API instance without auth
export default axios.create({
  baseURL: config.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});