import axios from 'axios';
import { toast } from 'sonner';
import config from '../config/config';

const createAPI = (token = null) => {
  const baseURL = config.API_BASE_URL;
  
  console.log('Creating API instance:', {
    baseURL: `${baseURL}/api`,
    hasToken: !!token
  });

  const api = axios.create({
    baseURL: `${baseURL}/api`,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    },
    withCredentials: true
  });

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
  addToCart: async (productId, token) => {
    const api = createAPI(token);
    return api.post('/cart/add', { productId });
  },

  removeFromCart: async (productId, token) => {
    const api = createAPI(token);
    return api.delete(`/cart/remove/${productId}`);
  },

  updateCartItem: async (productId, quantity, token) => {
    const api = createAPI(token);
    return api.put('/cart/update', { productId, quantity });
  },

  getCart: async (token) => {
    const api = createAPI(token);
    return api.get('/cart');
  },

  clearCart: async (token) => {
    const api = createAPI(token);
    return api.delete('/cart/clear');
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
      search: params.search || ''
    });
    return api.get(`/notifications?${queryParams}`);
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
      name: profileData.name,
      username: profileData.username,
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

// Export all APIs
export {
  createAPI,
  orderAPI,
  buyerAPI,
  cartAPI,
  productAPI,
  notificationAPI,
  adminProfileAPI,
  chatAPI,
  categoryAPI,
  recentAPI,
  bannerAPI
};