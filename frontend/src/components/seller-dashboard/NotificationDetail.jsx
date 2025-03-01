import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { notificationAPI } from '../../utils/api';
import { toast } from 'react-hot-toast';
import {
  RiArrowLeftLine,
  RiCheckboxCircleLine,
  RiErrorWarningLine,
  RiInformationLine,
  RiShoppingBagLine,
  RiMailLine,
  RiSecurePaymentLine,
  RiUserFollowLine,
  RiTimeLine,
  RiCalendarLine,
  RiFileTextLine,
  RiMapPinLine,
} from 'react-icons/ri';

const NotificationDetail = () => {
  const { currentTheme } = useTheme();
  const { notificationId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotificationDetail = async () => {
      try {
        const response = await notificationAPI.getNotificationById(notificationId, token);
        if (response.data.success) {
          setNotification(response.data.notification);
        }
      } catch (error) {
        console.error('Error fetching notification:', error);
        toast.error('Failed to fetch notification details');
      } finally {
        setLoading(false);
      }
    };

    if (notificationId) {
      fetchNotificationDetail();
    }
  }, [notificationId, token]);

  const getTypeStyles = (type) => {
    switch (type) {
      case 'ADMIN_MESSAGE':
        return currentTheme === 'dark' 
          ? 'bg-green-500/10 text-green-400 ring-green-400/30' 
          : 'bg-green-50 text-green-700 ring-green-600/20';
      case 'ORDER_STATUS':
        return currentTheme === 'dark'
          ? 'bg-blue-500/10 text-blue-400 ring-blue-400/30'
          : 'bg-blue-50 text-blue-700 ring-blue-600/20';
      case 'ORDER_CANCELLED':
        return currentTheme === 'dark'
          ? 'bg-red-500/10 text-red-400 ring-red-400/30'
          : 'bg-red-50 text-red-700 ring-red-600/20';
      default:
        return currentTheme === 'dark'
          ? 'bg-gray-500/10 text-gray-400 ring-gray-400/30'
          : 'bg-gray-50 text-gray-700 ring-gray-600/20';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'ADMIN_MESSAGE':
        return RiMailLine;
      case 'ORDER_STATUS':
        return RiShoppingBagLine;
      case 'ORDER_CANCELLED':
        return RiErrorWarningLine;
      default:
        return RiInformationLine;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!notification) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RiErrorWarningLine className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-2 text-lg font-medium">Notification not found</h2>
        </div>
      </div>
    );
  }

  const NotificationIcon = getNotificationIcon(notification.type);

  return (
    <div className={`min-h-screen pb-20 md:pb-0 ${
      currentTheme === 'dark' ? 'bg-gray-900 text-white' 
      : currentTheme === 'eyeCare' ? 'bg-[#F5E6D3] text-[#433422]'
      : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className={`flex items-center gap-2 mb-8 px-4 py-2 rounded-xl transition-all ${
            currentTheme === 'dark' 
              ? 'bg-gray-800/50 hover:bg-gray-700/50 backdrop-blur-xl' 
              : currentTheme === 'eyeCare'
              ? 'bg-[#E6D5BC]/50 hover:bg-[#D4C3AA]/50 backdrop-blur-xl'
              : 'bg-white/50 hover:bg-gray-100/50 backdrop-blur-xl'
          }`}
        >
          <RiArrowLeftLine size={20} />
          <span>Back</span>
        </motion.button>

        {/* Notification Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl overflow-hidden shadow-lg ${
            currentTheme === 'dark' 
              ? 'bg-gray-800/50 backdrop-blur-xl' 
              : currentTheme === 'eyeCare'
              ? 'bg-[#E6D5BC]/50 backdrop-blur-xl'
              : 'bg-white/50 backdrop-blur-xl'
          }`}
        >
          {/* Header */}
          <div className={`p-6 relative overflow-hidden ${getTypeStyles(notification.type)}`}>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <NotificationIcon size={24} />
                <h1 className="text-2xl font-bold">{notification.title}</h1>
              </div>
              <p className="text-base opacity-80 leading-relaxed">{notification.message}</p>
              <div className="flex items-center gap-4 text-sm opacity-60">
                <div className="flex items-center gap-1">
                  <RiTimeLine size={14} />
                  <span>{new Date(notification.createdAt).toLocaleString()}</span>
                </div>
                {notification.sender && (
                  <>
                    <div className="w-1 h-1 rounded-full bg-current opacity-30" />
                    <div className="flex items-center gap-1">
                      <RiUserFollowLine size={14} />
                      <span>From: {notification.sender.name}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Additional Details */}
          {notification.data && Object.keys(notification.data).length > 0 && (
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(notification.data).map(([key, value], index) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0,
                      transition: { delay: index * 0.1 }
                    }}
                    className={`p-4 rounded-xl ${
                      currentTheme === 'dark' 
                        ? 'bg-gray-700/30' 
                        : currentTheme === 'eyeCare'
                        ? 'bg-[#D4C3AA]/30'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <RiFileTextLine size={20} className="opacity-70" />
                      <div>
                        <p className="text-sm opacity-60">{key}</p>
                        <p className="font-medium">{value}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default NotificationDetail; 