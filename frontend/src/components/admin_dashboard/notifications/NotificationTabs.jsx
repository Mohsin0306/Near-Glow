import React from 'react';
import { RiSendPlaneLine, RiInboxLine } from 'react-icons/ri';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import { motion } from 'framer-motion';
import { useMediaQuery } from 'react-responsive';

const NotificationTabs = ({ unreadCount = 0 }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentTheme } = useTheme();
    const isMobile = useMediaQuery({
        query: '(max-width: 768px)'
    });

    const isReceived = location.pathname.includes('/received');

    const getTabStyle = (isActive) => `
        relative flex items-center justify-center px-4 py-3 rounded-lg transition-all
        ${isActive
            ? currentTheme === 'dark'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-600 text-white'
            : currentTheme === 'dark'
                ? 'bg-gray-800/80 text-gray-400 hover:bg-gray-700'
                : 'bg-white text-gray-500 hover:bg-gray-50'
        }
    `;

    return (
        <div className={`${
            isMobile ? 'sticky top-16' : 'sticky top-0'
        } z-10 ${
            currentTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
        } border-b ${
            currentTheme === 'dark' ? 'border-gray-800' : 'border-gray-200'
        }`}>
            <div className="max-w-5xl mx-auto px-4 py-3">
                <h1 className={`text-xl font-semibold mb-3 ${
                    isMobile ? '' : 'mt-3'
                }`}>
                    Notifications
                </h1>
                <div className="grid grid-cols-2 gap-2">
                    <motion.button
                        onClick={() => navigate('../notifications')}
                        className={getTabStyle(!isReceived)}
                        whileTap={{ scale: 0.98 }}
                    >
                        <RiSendPlaneLine className="text-lg mr-2" />
                        <span className="font-medium">Send</span>
                    </motion.button>
                    <motion.button
                        onClick={() => navigate('../notifications/received')}
                        className={getTabStyle(isReceived)}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="relative flex items-center">
                            <RiInboxLine className="text-lg mr-2" />
                            <span className="font-medium">Receive</span>
                            {unreadCount > 0 && (
                                <span className={`absolute ${
                                    isMobile ? '-bottom-4' : '-top-4'
                                } -right-1 flex items-center justify-center min-w-[18px] h-[18px] text-xs text-white bg-red-500 rounded-full px-1`}>
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                    </motion.button>
                </div>
            </div>
        </div>
    );
};

export default NotificationTabs; 