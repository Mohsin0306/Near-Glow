import React from 'react';
import Sidebar from '../components/layout/Sidebar';
import { Outlet } from 'react-router-dom';
import { useMediaQuery } from '@mui/material';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const BuyerDashboard = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { currentTheme } = useTheme();
  const { isAuthenticated } = useAuth();

  return (
    <div className={`flex min-h-screen ${
      currentTheme === 'dark' ? 'bg-gray-900' 
      : currentTheme === 'eyeCare' ? 'bg-[#F5E6D3]'
      : 'bg-gray-50'
    }`}>
      <Sidebar />
      <main 
        className={`flex-1 overflow-y-auto ${
          isMobile ? 'pt-16 pb-10' : 'pt-16'
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default BuyerDashboard; 