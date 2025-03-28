import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useTheme as useCustomTheme } from '../../../context/ThemeContext';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  useMediaQuery
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { orderAPI } from '../../../utils/api';

const StyledCard = styled(Card)(({ theme, customtheme }) => ({
  margin: theme.spacing(1),
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  borderRadius: '8px',
  background: customtheme.card,
  color: customtheme.text,
  [theme.breakpoints.down('sm')]: {
    margin: theme.spacing(0.5),
    marginBottom: theme.spacing(1),
  },
}));

const StyledPaper = styled(Paper)(({ theme, customtheme }) => ({
  backgroundColor: customtheme.card,
  color: customtheme.text,
  marginBottom: theme.spacing(2),
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: customtheme.hover,
  }
}));

const OrderDetails = () => {
  const { themeValue: customTheme } = useCustomTheme();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  const { user } = useAuth();
  const theme = useMuiTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await orderAPI.getOrderById(id, token);
        
        if (response.data.success) {
          setOrder(response.data.order);
        } else {
          setError(response.data.message || 'Failed to fetch order details');
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        setError(err.response?.data?.message || 'Failed to fetch order details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ur-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleProductClick = (productId) => {
    if (order?.seller?._id) {
      navigate(`/${order.seller._id}/admin/product/${productId}`);
    }
  };

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!order) return <Typography>Order not found</Typography>;

  const getStatusColor = (status) => {
    const statusColors = {
      pending: 'warning',
      processing: 'info',
      shipped: 'primary',
      delivered: 'success',
      cancelled: 'error',
    };
    return statusColors[status] || 'default';
  };

  return (
    <Box sx={{ 
      maxWidth: '1200px', 
      margin: '0 auto',
      p: { xs: 0.5, sm: 2 },
      mt: { xs: '64px', sm: 0 },
      mb: { xs: 7, sm: 2 },
      bgcolor: customTheme.background,
      color: customTheme.text
    }}>
      {/* Order Header */}
      <StyledCard customtheme={customTheme}>
        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Grid container spacing={1} alignItems="center">
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                    color: customTheme.text
                  }}
                >
                  #{order.orderId}
                </Typography>
                <Chip
                  label={order.status?.toUpperCase()}
                  color={getStatusColor(order.status)}
                  size="small"
                  sx={{ ml: 'auto' }}
                />
              </Box>
              {order.status === 'cancelled' && order.cancelReason && (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    mt: 0.5,
                    p: 1,
                    bgcolor: 'error.main',
                    color: '#fff',
                    borderRadius: 1,
                    fontSize: '0.875rem'
                  }}
                >
                  Cancelled: {order.cancelReason}
                </Typography>
              )}
              <Typography 
                variant="body2" 
                sx={{ mt: 1, color: customTheme.textSecondary }}
              >
                Ordered on {new Date(order.createdAt).toLocaleDateString()}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </StyledCard>

      {/* Customer & Shipping Info */}
      <StyledCard customtheme={customTheme}>
        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography 
                variant="subtitle2" 
                sx={{ color: customTheme.textSecondary }} 
                gutterBottom
              >
                Customer Details
              </Typography>
              <Typography variant="body2" sx={{ color: customTheme.text }}>
                {order.buyer?.name}
              </Typography>
              <Typography variant="body2" sx={{ color: customTheme.textSecondary }}>
                {order.buyer?.email}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography 
                variant="subtitle2" 
                sx={{ color: customTheme.textSecondary }} 
                gutterBottom
              >
                Shipping Address
              </Typography>
              {order.shippingAddress && (
                <Box sx={{ fontSize: '0.875rem' }}>
                  <Typography variant="body2" sx={{ color: customTheme.text }}>
                    {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                  </Typography>
                  <Typography variant="body2" sx={{ color: customTheme.text }}>
                    {order.shippingAddress.address}
                  </Typography>
                  <Typography variant="body2" sx={{ color: customTheme.text }}>
                    {order.shippingAddress.city}, {order.shippingAddress.country}
                  </Typography>
                  <Typography variant="body2" sx={{ color: customTheme.textSecondary }}>
                    {order.shippingAddress.phoneNumber}
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </StyledCard>

      {/* Order Items */}
      <StyledCard customtheme={customTheme}>
        <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              color: customTheme.textSecondary,
              mb: 1,
              fontSize: { xs: '0.8rem', sm: '0.875rem' }
            }}
          >
            Order Items
          </Typography>
          <List sx={{ p: 0 }}>
            {order?.items?.[0]?.__parentArray?.map((item) => (
              <StyledPaper
                key={item._id}
                elevation={0}
                customtheme={customTheme}
                onClick={() => handleProductClick(item.product._id)}
                sx={{ mb: 1 }}
              >
                <ListItem 
                  sx={{ 
                    px: { xs: 1, sm: 2 }, 
                    py: { xs: 1, sm: 1.5 },
                    gap: 1
                  }}
                >
                  <ListItemAvatar sx={{ minWidth: 'auto' }}>
                    <Avatar
                      variant="rounded"
                      src={item.product?.media?.[0]?.url}
                      alt={item.product?.name}
                      sx={{ 
                        width: { xs: 50, sm: 60 },
                        height: { xs: 50, sm: 60 },
                        borderRadius: 1
                      }}
                    />
                  </ListItemAvatar>
                  <Box sx={{ 
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.5
                  }}>
                    <Typography 
                      sx={{ 
                        color: customTheme.text,
                        fontSize: { xs: '0.9rem', sm: '1rem' },
                        fontWeight: 500,
                        lineHeight: 1.2
                      }}
                    >
                      {item.product?.name}
                    </Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 1
                    }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: customTheme.textSecondary,
                          fontSize: { xs: '0.8rem', sm: '0.875rem' }
                        }}
                      >
                        {item.quantity} × {formatCurrency(item.price)}
                      </Typography>
                      <Typography 
                        sx={{ 
                          fontWeight: 600,
                          color: customTheme.text,
                          fontSize: { xs: '0.9rem', sm: '1rem' }
                        }}
                      >
                        {formatCurrency(item.quantity * item.price)}
                      </Typography>
                    </Box>
                  </Box>
                </ListItem>
              </StyledPaper>
            ))}
          </List>
          <Box sx={{ 
            mt: 1.5,
            pt: 1.5,
            borderTop: '1px solid',
            borderColor: customTheme.divider,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: { xs: 1, sm: 2 }
          }}>
            <Typography 
              sx={{ 
                color: customTheme.textSecondary,
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }}
            >
              Total Amount
            </Typography>
            <Typography 
              sx={{ 
                fontWeight: 600,
                color: customTheme.text,
                fontSize: { xs: '1.1rem', sm: '1.25rem' }
              }}
            >
              {formatCurrency(order?.totalAmount)}
            </Typography>
          </Box>
        </CardContent>
      </StyledCard>

      {/* Payment Info */}
      <StyledCard customtheme={customTheme}>
        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Typography 
            variant="subtitle2" 
            sx={{ color: customTheme.textSecondary }} 
            gutterBottom
          >
            Payment Details
          </Typography>
          <Grid container spacing={1} sx={{ fontSize: '0.875rem' }}>
            <Grid item xs={12}>
              <Typography variant="body2" sx={{ color: customTheme.textSecondary }}>
                Subtotal: {formatCurrency(order.totalAmount || 0)}
              </Typography>
            </Grid>
            
            {(order.deliveryPrice > 0) && (
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ color: customTheme.textSecondary }}>
                  Delivery Fee: {formatCurrency(order.deliveryPrice)}
                </Typography>
              </Grid>
            )}
            
            {(order.referralDiscount > 0) && (
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ color: 'success.main' }}>
                  Referral Discount: -{formatCurrency(order.referralDiscount)}
                </Typography>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: customTheme.text,
                  fontWeight: 600,
                  mt: 1
                }}
              >
                Final Amount: {formatCurrency(order.finalAmount || order.totalAmount)}
              </Typography>
            </Grid>

            <Grid item xs={6}>
              <Typography variant="body2" sx={{ color: customTheme.text }}>
                Method: {order.paymentMethod?.toUpperCase() || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" sx={{ color: customTheme.text }}>
                Status: {order.paymentDetails?.status?.toUpperCase() || 'PENDING'}
              </Typography>
            </Grid>
            
            {order.paymentDetails?.transactionId && (
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ color: customTheme.textSecondary }}>
                  Transaction ID: {order.paymentDetails.transactionId}
                </Typography>
              </Grid>
            )}
            
            {order.coinsUsed > 0 && (
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ color: customTheme.textSecondary }}>
                  Referral Coins Used: {order.coinsUsed}
                </Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </StyledCard>
    </Box>
  );
};

export default OrderDetails;
