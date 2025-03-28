import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { orderAPI } from '../../../utils/api';
import {
  RiTruckLine,
  RiMoneyDollarCircleLine,
  RiMapPinLine,
  RiUserLine,
  RiCalendarEventLine,
  RiCheckboxCircleLine,
  RiTimeLine,
  RiCloseLine,
  RiSearchLine,
  RiFilterLine,
  RiRefreshLine,
  RiShoppingBag3Line,
  RiArrowUpLine,
  RiArrowDownLine
} from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getStatusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-500 text-white',
    processing: 'bg-blue-500 text-white',
    shipped: 'bg-purple-500 text-white',
    delivered: 'bg-green-500 text-white',
    cancelled: 'bg-red-500 text-white'
  };
  return colors[status] || colors.pending;
};

const cancelReasons = [
  'Location not serviceable',
  'Out of stock',
  'Customer requested cancellation',
  'Delivery issues',
  'Payment issues',
  'Other'
];

const AdminOrders = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    sort: 'createdAt',
    order: 'desc',
    page: 1
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0
  });
  const ITEMS_PER_PAGE = 20;
  const navigate = useNavigate();

  const getThemeStyles = () => ({
    background: theme.background,
    text: theme.text,
    card: theme.card,
    border: theme.border,
    input: theme.input,
  });

  const styles = getThemeStyles();

  const statusOptions = [
    { value: 'pending', label: 'Pending', icon: RiTimeLine, color: 'yellow' },
    { value: 'processing', label: 'Processing', icon: RiTruckLine, color: 'blue' },
    { value: 'shipped', label: 'Shipped', icon: RiTruckLine, color: 'purple' },
    { value: 'delivered', label: 'Delivered', icon: RiCheckboxCircleLine, color: 'green' },
    { value: 'cancelled', label: 'Cancelled', icon: RiCloseLine, color: 'red' }
  ];

  const groupOrdersByDate = (orders) => {
    const grouped = orders.reduce((acc, order) => {
      const date = new Date(order.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(order);
      return acc;
    }, {});
    return grouped;
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await orderAPI.getAdminOrders(token, {
        ...filters,
        limit: ITEMS_PER_PAGE
      });
      
      if (response.data.success) {
        setOrders(response.data.orders);
        setPagination({
          currentPage: filters.page,
          totalPages: response.data.totalPages,
          totalOrders: response.data.total
        });
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const handleStatusChange = async (order, newStatus) => {
    setSelectedOrder(order);
    setSelectedStatus(newStatus);
    if (newStatus === 'cancelled') {
      setCancelReason('');
    }
    setShowStatusModal(true);
  };

  const handleUpdateStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const data = {
        status: selectedStatus,
        ...(selectedStatus === 'cancelled' && { cancelReason })
      };
      
      const response = await orderAPI.updateOrderStatus(selectedOrder._id, data, token);
      
      if (response.data.success) {
        setOrders(orders.map(order => 
          order._id === selectedOrder._id 
            ? { ...order, status: selectedStatus } 
            : order
        ));
        setShowStatusModal(false);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleOrderClick = (orderId) => {
    navigate(`/${user._id}/admin/orders/${orderId}`);
  };

  const handleSortChange = (e) => {
    const [sort, order] = e.target.value.split('_');
    setFilters(prev => ({
      ...prev,
      sort,
      order,
      page: 1
    }));
  };

  const getPageNumbers = () => {
    const pages = [];
    const totalPages = pagination.totalPages;
    const currentPage = filters.page;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      for (let i = Math.max(2, currentPage - 1); i <= Math.min(currentPage + 1, totalPages - 1); i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const sortOptions = [
    { value: 'createdAt_desc', label: 'Latest Orders First' },
    { value: 'createdAt_asc', label: 'Oldest Orders First' },
    { value: 'totalAmount_desc', label: 'Amount (High to Low)' },
    { value: 'totalAmount_asc', label: 'Amount (Low to High)' },
    { value: 'status_asc', label: 'Status (A to Z)' },
    { value: 'status_desc', label: 'Status (Z to A)' }
  ];

  const PaginationControls = () => (
    <div className="flex flex-col items-center gap-4 mt-8 pb-8">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
          disabled={filters.page === 1}
          className={`
            px-3 py-2 rounded-lg
            ${theme.currentTheme === 'dark' 
              ? 'bg-gray-800 text-white hover:bg-gray-700 disabled:bg-gray-900'
              : theme.currentTheme === 'eyeCare'
              ? 'bg-[#E6D5BC] text-[#433422] hover:bg-[#D4C3AA] disabled:bg-[#F5E6D3]'
              : 'bg-white text-gray-900 hover:bg-gray-50 disabled:bg-gray-100'
            }
            border ${theme.border}
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          `}
        >
          Previous
        </button>

        <div className="flex items-center">
          {getPageNumbers().map((pageNum, idx) => (
            <React.Fragment key={idx}>
              {pageNum === '...' ? (
                <span className={`px-2 ${theme.textSecondary}`}>...</span>
              ) : (
                <button
                  onClick={() => setFilters(prev => ({ ...prev, page: pageNum }))}
                  className={`
                    w-10 h-10 rounded-lg mx-1
                    flex items-center justify-center
                    transition-colors
                    ${pageNum === filters.page
                      ? theme.currentTheme === 'dark'
                        ? 'bg-blue-600 text-white'
                        : theme.currentTheme === 'eyeCare'
                        ? 'bg-[#433422] text-[#F5E6D3]'
                        : 'bg-blue-600 text-white'
                      : theme.currentTheme === 'dark'
                      ? 'bg-gray-800 text-white hover:bg-gray-700'
                      : theme.currentTheme === 'eyeCare'
                      ? 'bg-[#E6D5BC] text-[#433422] hover:bg-[#D4C3AA]'
                      : 'bg-white text-gray-900 hover:bg-gray-50'
                    }
                    border ${theme.border}
                  `}
                >
                  {pageNum}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        <button
          onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
          disabled={filters.page === pagination.totalPages}
          className={`
            px-3 py-2 rounded-lg
            ${theme.currentTheme === 'dark' 
              ? 'bg-gray-800 text-white hover:bg-gray-700 disabled:bg-gray-900'
              : theme.currentTheme === 'eyeCare'
              ? 'bg-[#E6D5BC] text-[#433422] hover:bg-[#D4C3AA] disabled:bg-[#F5E6D3]'
              : 'bg-white text-gray-900 hover:bg-gray-50 disabled:bg-gray-100'
            }
            border ${theme.border}
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          `}
        >
          Next
        </button>
      </div>

      <div className={`text-sm ${theme.textSecondary}`}>
        Showing {((filters.page - 1) * ITEMS_PER_PAGE) + 1} to {
          Math.min(filters.page * ITEMS_PER_PAGE, pagination.totalOrders)
        } of {pagination.totalOrders} orders
      </div>
    </div>
  );

  const transformOrders = (orders) => {
    return orders.map(order => ({
      id: order._id,
      orderId: order.orderId,
      customer: `${order.shippingAddress?.firstName || 'N/A'} ${order.shippingAddress?.lastName || ''}`,
      date: new Date(order.createdAt).toLocaleDateString(),
      totalAmount: order.totalAmount || 0,
      deliveryPrice: order.deliveryPrice || 0,
      referralDiscount: order.referralDiscount || 0,
      finalAmount: order.finalAmount || order.totalAmount || 0,
      status: order.status,
      paymentStatus: order.paymentDetails?.status || 'pending',
      items: order.items,
      shippingAddress: order.shippingAddress || {}
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ur-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const renderOrderRow = (order) => {
    // Add safe checks for shipping address
    const shippingAddress = order.shippingAddress || {};
    const customerName = `${shippingAddress.firstName || 'N/A'} ${shippingAddress.lastName || ''}`.trim();
    const address = `${shippingAddress.address || 'N/A'}, ${shippingAddress.city || 'N/A'}`;

    return (
      <motion.tr
        key={order._id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`${styles.border} hover:bg-opacity-5 hover:bg-current`}
      >
        <td className="py-4 px-6">
          <div className="flex items-center gap-3">
            <div>
              <div className="font-medium">{order.orderId || 'N/A'}</div>
              <div className="text-sm opacity-60">
                {formatDate(order.createdAt)}
              </div>
            </div>
          </div>
        </td>
        <td className="py-4 px-6">
          <div className="flex items-center gap-3">
            <RiUserLine size={20} className="opacity-50" />
            <div>
              <div className="font-medium">{customerName}</div>
              <div className="text-sm opacity-60">{address}</div>
            </div>
          </div>
        </td>
        {/* ... rest of the row rendering ... */}
      </motion.tr>
    );
  };

  return (
    <div className={`min-h-screen ${theme.background}`}>
      {/* Header Section - Added mt-16 for mobile to account for navbar */}
      <div className={`mt-16 md:mt-0 p-4 md:p-6 ${theme.card} border-b ${theme.border} sticky top-[64px] md:top-0 z-10`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <RiShoppingBag3Line className={`text-2xl ${theme.text}`} />
            <h1 className={`text-lg md:text-2xl font-semibold ${theme.text}`}>
              Orders Management
            </h1>
          </div>
          <button
            onClick={() => fetchOrders()}
            className={`p-2 rounded-full ${theme.hover} ${theme.text} flex items-center gap-2`}
          >
            <RiRefreshLine className="text-xl" />
            <span className="hidden md:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="p-6">
        <div className="relative">
          {/* Search bar with filter icon */}
          <div className={`md:grid md:grid-cols-3 gap-4`}>
            {/* Search bar container */}
            <div className={`relative ${theme.card} rounded-xl`}>
              <RiSearchLine className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme.textSecondary}`} />
              <input
                type="text"
                placeholder="Search orders..."
                className={`w-full pl-12 pr-16 py-3 rounded-xl bg-transparent ${theme.text} focus:outline-none`}
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
              {/* Filter icon for mobile */}
              <button
                className={`md:hidden absolute right-4 top-1/2 -translate-y-1/2 ${theme.text} p-2`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <RiFilterLine className={`text-xl ${showFilters ? 'text-blue-500' : ''}`} />
              </button>
            </div>

            {/* Desktop filters */}
            <div className="hidden md:flex gap-4 col-span-2">
              <select
                className={`flex-1 px-4 py-3 rounded-xl ${theme.input} focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all`}
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="all">All Status</option>
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={`${filters.sort}_${filters.order}`}
                onChange={handleSortChange}
                className={`w-full px-4 py-2.5 rounded-lg ${theme.input} ${theme.text}`}
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mobile filters dropdown */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className={`md:hidden absolute w-full mt-2 z-20 ${theme.card} rounded-xl shadow-lg overflow-hidden`}
              >
                <div className="p-4 space-y-3">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${theme.text}`}>
                      Status
                    </label>
                    <select
                      className={`w-full px-4 py-2.5 rounded-lg ${theme.input} focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all text-sm`}
                      value={filters.status}
                      onChange={(e) => {
                        setFilters({ ...filters, status: e.target.value });
                        setShowFilters(false);
                      }}
                    >
                      <option value="all">All Status</option>
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${theme.text}`}>
                      Sort By
                    </label>
                    <select
                      className={`w-full px-4 py-2.5 rounded-lg ${theme.input} focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all text-sm`}
                      value={`${filters.sort}_${filters.order}`}
                      onChange={handleSortChange}
                    >
                      {sortOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Orders Grid */}
        <div className={`grid gap-4 ${showFilters ? 'mt-32' : 'mt-6'} md:mt-6`}>
          {loading ? (
            // Loading skeleton
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className={`h-32 ${theme.card} rounded-xl`} />
              ))}
            </div>
          ) : orders.length === 0 ? (
            // Empty state
            <div className={`text-center py-12 ${theme.card} rounded-xl`}>
              <RiShoppingBag3Line className={`text-6xl mx-auto mb-4 ${theme.textSecondary}`} />
              <h3 className={`text-xl font-medium ${theme.text}`}>No Orders Found</h3>
              <p className={`mt-2 ${theme.textSecondary}`}>Try adjusting your filters</p>
            </div>
          ) : (
            // Orders list grouped by date
            Object.entries(groupOrdersByDate(orders)).map(([date, dateOrders]) => (
              <div key={date}>
                <h3 className={`text-lg font-semibold ${theme.text} mb-4`}>
                  {date}
                </h3>
                <div className="space-y-4">
                  {dateOrders.map(order => (
                    <motion.div
                      key={order._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => handleOrderClick(order._id)}
                      className={`p-4 rounded-xl ${theme.card} border ${theme.border} hover:shadow-lg transition-all cursor-pointer group`}
                    >
                      {/* Desktop Layout */}
                      <div className="hidden lg:block">
                        <div className="flex justify-between items-start mb-4">
                          {/* Order Info */}
                          <div className="flex-grow">
                            <div className="flex items-center justify-between mb-3">
                              <span className={`text-lg font-semibold ${theme.text} group-hover:text-blue-500 transition-colors`}>
                                {order.orderId}
                              </span>
                              <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                            </div>

                            {/* Order Details Grid */}
                            <div className="grid grid-cols-3 gap-6 mb-3">
                              <div className="flex items-center gap-2">
                                <RiUserLine className={theme.textSecondary} />
                                <span className={`text-sm ${theme.text}`}>
                                  {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <RiMoneyDollarCircleLine className={theme.textSecondary} />
                                <span className={`text-sm ${theme.text}`}>
                                  {order.referralDiscount > 0 ? (
                                    <Box sx={{ textAlign: 'right' }}>
                                      <Typography 
                                        variant="body2" 
                                        sx={{ 
                                          textDecoration: 'line-through',
                                          color: 'text.secondary',
                                          fontSize: '0.75rem'
                                        }}
                                      >
                                        {formatCurrency(order.totalAmount)}
                                      </Typography>
                                      <Typography variant="body1">
                                        {formatCurrency(order.finalAmount)}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: 'success.main' }}>
                                        Discount: {formatCurrency(order.referralDiscount)}
                                      </Typography>
                                    </Box>
                                  ) : (
                                    <>
                                      <Typography variant="body1">
                                        {formatCurrency(order.totalAmount)}
                                      </Typography>
                                      {order.deliveryPrice > 0 && (
                                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                                          + {formatCurrency(order.deliveryPrice)} delivery
                                        </Typography>
                                      )}
                                    </>
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <RiCalendarEventLine className={theme.textSecondary} />
                                <span className={`text-sm ${theme.text}`}>
                                  {formatDate(order.createdAt)}
                                </span>
                              </div>
                            </div>

                            {/* Address */}
                            <div className="flex items-start gap-2">
                              <RiMapPinLine className={`mt-1 ${theme.textSecondary}`} />
                              <span className={`text-sm ${theme.text}`}>
                                {order.shippingAddress.address}, {order.shippingAddress.city}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status Buttons - Horizontal */}
                        <div className="flex gap-2 mt-3">
                          {statusOptions.map(option => (
                            <StatusButton
                              key={option.value}
                              option={option}
                              currentStatus={order.status}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(order, option.value);
                              }}
                              theme={theme}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Mobile Layout */}
                      <div className="lg:hidden">
                        <div className="flex justify-between items-start mb-4">
                          <span className={`text-base font-semibold ${theme.text}`}>
                            {order.orderId}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <RiUserLine className={theme.textSecondary} />
                            <span className={`text-sm ${theme.text}`}>
                              {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <RiMoneyDollarCircleLine className={theme.textSecondary} />
                            <span className={`text-sm ${theme.text}`}>
                              {order.referralDiscount > 0 ? (
                                <Box sx={{ textAlign: 'right' }}>
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      textDecoration: 'line-through',
                                      color: 'text.secondary',
                                      fontSize: '0.75rem'
                                    }}
                                  >
                                    {formatCurrency(order.totalAmount)}
                                  </Typography>
                                  <Typography variant="body1">
                                    {formatCurrency(order.finalAmount)}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: 'success.main' }}>
                                    Discount: {formatCurrency(order.referralDiscount)}
                                  </Typography>
                                </Box>
                              ) : (
                                <>
                                  <Typography variant="body1">
                                    {formatCurrency(order.totalAmount)}
                                  </Typography>
                                  {order.deliveryPrice > 0 && (
                                    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                                      + {formatCurrency(order.deliveryPrice)} delivery
                                    </Typography>
                                  )}
                                </>
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <RiMapPinLine className={theme.textSecondary} />
                            <span className={`text-sm ${theme.text}`}>
                              {order.shippingAddress.address}, {order.shippingAddress.city}
                            </span>
                          </div>
                        </div>

                        {/* Mobile Status Buttons */}
                        <div className="flex flex-wrap gap-2 mt-4">
                          {statusOptions.map(option => (
                            <StatusButton
                              key={option.value}
                              option={option}
                              currentStatus={order.status}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(order, option.value);
                              }}
                              theme={theme}
                              isMobile={true}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && <PaginationControls />}

      {/* Status Update Modal */}
      <StatusModal
        show={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        selectedStatus={selectedStatus}
        cancelReason={cancelReason}
        onCancelReasonChange={setCancelReason}
        onUpdate={handleUpdateStatus}
        theme={theme}
      />
    </div>
  );
};

// Helper Components
const InfoItem = ({ icon: Icon, label, theme }) => (
  <div className="flex items-center gap-2">
    <Icon className={theme.textSecondary} />
    <span className={`text-sm ${theme.text}`}>{label}</span>
  </div>
);

const StatusButton = ({ option, currentStatus, onClick, theme, isMobile }) => (
  <button
    onClick={onClick}
    disabled={currentStatus === option.value}
    className={`
      ${isMobile ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}
      rounded-lg font-medium
      flex items-center gap-2 whitespace-nowrap
      transition-all
      ${currentStatus === option.value ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}
      ${getStatusColor(option.value)}
    `}
  >
    <option.icon className={isMobile ? 'text-base' : 'text-lg'} />
    {option.label}
  </button>
);

const StatusModal = ({ show, onClose, selectedStatus, cancelReason, onCancelReasonChange, onUpdate, theme }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className={`w-full max-w-md p-6 rounded-xl shadow-xl ${theme.modalBg} border ${theme.border}`}
        >
          <h3 className={`text-lg font-semibold mb-4 ${theme.text}`}>
            Update Order Status
          </h3>

          {selectedStatus === 'cancelled' && (
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${theme.text}`}>
                Cancellation Reason
              </label>
              <select
                value={cancelReason}
                onChange={(e) => onCancelReasonChange(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.input} ${theme.text}`}
              >
                <option value="">Select a reason</option>
                {cancelReasons.map(reason => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${theme.button}`}
            >
              Cancel
            </button>
            <button
              onClick={onUpdate}
              disabled={selectedStatus === 'cancelled' && !cancelReason}
              className={`
                px-4 py-2 
                rounded-lg 
                text-sm 
                font-medium 
                ${getStatusColor(selectedStatus)}
                disabled:opacity-50
                disabled:cursor-not-allowed
              `}
            >
              Update Status
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default AdminOrders; 