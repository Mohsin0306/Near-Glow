import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
    RiNotification2Line,
    RiCheckLine,
    RiTimeLine,
    RiMailOpenLine,
    RiMailLine,
    RiShoppingBag3Line,
    RiCloseLine
} from 'react-icons/ri';
import { notificationAPI } from '../../../utils/api';
import { useTheme } from '../../../context/ThemeContext';
import { toast } from 'react-hot-toast';
import NotificationTabs from './NotificationTabs';
import { useMediaQuery } from 'react-responsive';

const ReceivedNotifications = () => {
    const { token, isAuthenticated, user } = useAuth();
    const navigate = useNavigate();
    const { currentTheme } = useTheme();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);

    const isMobile = useMediaQuery({
        query: '(max-width: 768px)'
    });

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        }
        fetchNotifications();
    }, [isAuthenticated, navigate, token]);

    useEffect(() => {
        const count = notifications.filter(notif => !notif.isRead).length;
        setUnreadCount(count);
    }, [notifications]);

    const fetchNotifications = async () => {
        try {
            const response = await notificationAPI.getUserNotifications(token);
            if (response.data.success) {
                setNotifications(response.data.notifications);
            }
        } catch (error) {
            toast.error('Failed to fetch notifications');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            await notificationAPI.markAsRead(notificationId, token);
            setNotifications(notifications.map(notif =>
                notif._id === notificationId ? { ...notif, isRead: true } : notif
            ));
        } catch (error) {
            toast.error('Failed to mark as read');
        }
    };

    const NotificationCard = ({ notification, onMarkAsRead }) => {
        const navigate = useNavigate();
        const { currentTheme } = useTheme();
        const { user } = useAuth();

        const handleNotificationClick = async (notification) => {
            try {
                // Mark as read when clicked
                if (!notification.isRead) {
                    await onMarkAsRead(notification._id);
                }

                // Handle different notification types
                switch (notification.type) {
                    case 'NEW_ORDER':
                    case 'ORDER_CANCELLED':
                        const orderId = notification.data?.orderId;
                        if (orderId) {
                            navigate(`/${user._id}/admin/orders/${orderId}`);
                        } else {
                            console.error('Order ID not found in notification data');
                            toast.error('Could not find order details');
                        }
                        break;
                    default:
                        // For other notification types, show detail modal
                        setSelectedNotification(notification);
                        break;
                }
            } catch (error) {
                console.error('Notification click error:', error);
                toast.error('Failed to process notification');
            }
        };

        // Get notification icon based on type
        const getNotificationIcon = (type) => {
            switch (type) {
                case 'NEW_ORDER':
                    return <RiShoppingBag3Line className={`h-5 w-5 ${notification.isRead ? 'text-gray-400' : 'text-green-500'
                        }`} />;
                case 'ORDER_CANCELLED':
                    return <RiCloseLine className={`h-5 w-5 ${
                        notification.isRead ? 'text-gray-400' : 'text-red-500'
                    }`} />;
                default:
                    return <RiNotification2Line className={`h-5 w-5 ${notification.isRead ? 'text-gray-400' : 'text-blue-500'
                        }`} />;
            }
        };

        return (
            <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-4 border-b last:border-b-0 cursor-pointer transition-all ${notification.isRead
                        ? currentTheme === 'dark'
                            ? 'hover:bg-gray-800/80 border-gray-700'
                            : 'hover:bg-gray-50 border-gray-100'
                        : currentTheme === 'dark'
                            ? `${notification.type === 'NEW_ORDER' ? 'bg-green-900/20' : 'bg-blue-900/20'} hover:bg-gray-800/80 border-gray-700`
                            : `${notification.type === 'NEW_ORDER' ? 'bg-green-50' : 'bg-blue-50'} hover:bg-gray-50 border-gray-100`
                    }`}
                onClick={() => handleNotificationClick(notification)}
            >
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <h3 className={`font-medium truncate ${!notification.isRead &&
                                (notification.type === 'NEW_ORDER' ? 'text-green-600' : 'text-blue-600')
                                }`}>
                                {notification.title}
                            </h3>
                            {!notification.isRead && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onMarkAsRead(notification._id);
                                    }}
                                    className="flex-shrink-0 text-blue-500 hover:text-blue-600 p-1"
                                >
                                    <RiMailOpenLine className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <p className="mt-0.5 text-sm opacity-80 line-clamp-2">{notification.message}</p>
                        <div className="mt-1.5 flex items-center gap-3 text-xs opacity-60">
                            <span className="flex items-center">
                                <RiTimeLine className="mr-1 h-3 w-3" />
                                {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                            </span>
                            {notification.sender && (
                                <span className="truncate">From: {notification.sender.name}</span>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <div className={`${
            currentTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50'
        } min-h-screen`}>
            <div className="flex flex-col h-full">
                {/* Notification Tabs */}
                <NotificationTabs unreadCount={unreadCount} />

                {/* Main Content */}
                <div className={`flex-1 w-full ${
                    isMobile ? 'mt-16' : 'max-w-4xl mx-auto px-4 py-4'
                }`}>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`rounded-xl shadow-sm ${
                            currentTheme === 'dark'
                                ? 'bg-gray-800/50 border-gray-700'
                                : 'bg-white border-gray-200'
                        } ${
                            isMobile 
                                ? 'border-t border-b' 
                                : 'border rounded-xl'
                        }`}
                    >
                        <div className={`${isMobile ? 'pb-16' : 'p-4'}`}>
                            {/* Loading State */}
                            {loading ? (
                                <div className="flex justify-center items-center h-48">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                </div>
                            ) : notifications.length > 0 ? (
                                <div className={`divide-y ${
                                    currentTheme === 'dark' ? 'divide-gray-700' : 'divide-gray-100'
                                }`}>
                                    <AnimatePresence initial={false}>
                                        {notifications.map(notification => (
                                            <NotificationCard
                                                key={notification._id}
                                                notification={notification}
                                                onMarkAsRead={handleMarkAsRead}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <RiMailLine className={`mx-auto h-12 w-12 mb-3 ${
                                        currentTheme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                                    }`} />
                                    <h3 className="text-lg font-medium mb-1">No notifications</h3>
                                    <p className={`text-sm ${
                                        currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                    }`}>
                                        You're all caught up!
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Notification Detail Modal */}
            <AnimatePresence>
                {selectedNotification && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                        onClick={() => setSelectedNotification(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className={`w-full max-w-lg p-6 rounded-xl shadow-lg ${currentTheme === 'dark'
                                    ? 'bg-gray-800 border border-gray-700'
                                    : 'bg-white'
                                }`}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <h3 className="text-xl font-bold">{selectedNotification.title}</h3>
                                <button
                                    onClick={() => setSelectedNotification(null)}
                                    className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700`}
                                >
                                    <RiCloseLine className="h-5 w-5" />
                                </button>
                            </div>
                            <p className="mb-4 leading-relaxed">{selectedNotification.message}</p>
                            <div className={`text-sm ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                <p>Sent: {format(new Date(selectedNotification.createdAt), 'PPpp')}</p>
                                {selectedNotification.sender && (
                                    <p className="mt-1">From: {selectedNotification.sender.name}</p>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ReceivedNotifications; 