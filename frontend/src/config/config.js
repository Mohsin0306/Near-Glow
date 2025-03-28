// Improved configuration with better fallbacks
const config = {
  // Prioritize development with localhost fallbacks
  API_BASE_URL: process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5000' 
    : (process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'),
  
  BACKEND_URL: process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5000' 
    : (process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'),
  
  NETWORK_URL: process.env.REACT_APP_NETWORK_URL || 'http://localhost:5000',
  LOCAL_URL: process.env.REACT_APP_LOCAL_URL || 'http://localhost:3000',
  VAPID_PUBLIC_KEY: process.env.REACT_APP_VAPID_PUBLIC_KEY
};

// Log the configuration on load for debugging
console.log('Config loaded:', config);

export default config; 