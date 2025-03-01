import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import config from './config/config';

// Log environment configuration on startup
console.log('Environment Configuration:', {
  API_BASE_URL: config.API_BASE_URL,
  BACKEND_URL: config.BACKEND_URL,
  NETWORK_URL: config.NETWORK_URL,
  LOCAL_URL: config.LOCAL_URL
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registration successful');
      })
      .catch(err => {
        console.log('ServiceWorker registration failed:', err);
      });
  });
}

