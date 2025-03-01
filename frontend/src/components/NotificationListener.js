import React, { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import socketService from '../services/socketService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const NotificationListener = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const notificationTimeouts = useRef(new Map());

  const handleNotificationClick = useCallback((notification) => {
    if ('clearAppBadge' in navigator) {
      navigator.clearAppBadge().catch(error => {
        console.log('Error clearing app badge:', error);
      });
    }
    
    switch (notification.type) {
      case 'ORDER_CANCELLED':
        navigate(`/${user._id}/admin/orders/${notification.data.orderId}`);
        break;
      case 'ADMIN_MESSAGE':
        navigate('/notifications');
        break;
      default:
        navigate('/notifications');
    }
  }, [navigate, user]);

  const handleNotification = useCallback((notification) => {
    // Skip if no user is logged in
    if (!user?._id) return;

    // Don't show notification if the current user is the sender
    if (notification.senderId === user._id) return;

    // Create a unique notification ID if not present
    const notificationId = notification.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Show toast notification
    toast((t) => (
      <div onClick={() => handleNotificationClick(notification)}>
        <h4 className="font-bold">{notification.title}</h4>
        <p>{notification.message}</p>
      </div>
    ), {
      id: notificationId,
      duration: 5000,
      icon: '🔔',
    });

    // Play notification sound if available
    if (socketService.notificationSound) {
      socketService.notificationSound.play().catch(err => console.log('Error playing sound:', err));
    }
  }, [user, handleNotificationClick]);

  useEffect(() => {
    if (user?._id && token) {
      // Connect to socket
      socketService.connect(user._id, token);
      
      // Register notification handler
      const cleanup = socketService.onNotification(handleNotification);

      return () => {
        cleanup();
        socketService.disconnect();
      };
    }
  }, [user, token, handleNotification]);

  return null;
};

export default NotificationListener; 