import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createAPI, buyerAPI } from '../../../utils/api';
import { format } from 'date-fns';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import {
  Box,
  Container,
  Grid,
  Typography,
  Paper,
  Avatar,
  Chip,
  Divider,
  Skeleton,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemAvatar
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  LocationOn,
  Cake,
  Update,
  Info,
  Circle as CircleIcon,
  ArrowBack
} from '@mui/icons-material';
import {
  RiShoppingCart2Line,
  RiHeartLine,
  RiShoppingBag3Line,
  RiMoneyDollarCircleLine
} from 'react-icons/ri';

// Helper Components
const EmptyState = ({ message, icon: Icon, styles }) => (
  <Box sx={{ textAlign: 'center', py: 3 }}>
    <Icon size={24} style={{ color: styles.textSecondary.color, marginBottom: 8 }} />
    <Typography sx={styles.textSecondary}>{message}</Typography>
  </Box>
);

const StatsCard = ({ icon: Icon, title, value, styles }) => (
  <Grid item xs={6}>
    <Box sx={styles.statsCard}>
      <Icon 
        size={20} 
        style={{ color: styles.textSecondary.color, marginBottom: 8 }} 
      />
      <Typography variant="body2" sx={styles.textSecondary} gutterBottom>
        {title}
      </Typography>
      <Typography variant="h6" sx={styles.text}>
        {value}
      </Typography>
    </Box>
  </Grid>
);

const InfoList = ({ buyer, styles }) => (
  <List disablePadding>
    {[
      { icon: Phone, label: 'Phone', value: buyer?.phoneNumber },
      { icon: LocationOn, label: 'Address', value: buyer?.address },
      { icon: Cake, label: 'Birthday', value: buyer?.dateOfBirth ? new Date(buyer.dateOfBirth).toLocaleDateString() : 'Not provided' },
      { icon: Person, label: 'Gender', value: buyer?.gender }
    ].map((item, index) => (
      <ListItem key={index} sx={styles.listItem}>
        <ListItemIcon>
          <item.icon fontSize="small" sx={{ color: styles.textSecondary.color }} />
        </ListItemIcon>
        <ListItemText 
          primary={item.label}
          secondary={item.value || 'Not provided'}
          primaryTypographyProps={{ sx: styles.textSecondary }}
          secondaryTypographyProps={{ sx: styles.text }}
        />
      </ListItem>
    ))}
  </List>
);

const CartItemsList = ({ items, styles }) => (
  <List disablePadding>
    {items.length === 0 ? (
      <EmptyState message="Cart is empty" icon={RiShoppingCart2Line} styles={styles} />
    ) : (
      items.map((item) => (
        <ListItem key={item._id} sx={styles.listItem}>
          <ListItemAvatar>
            <Avatar src={item.product?.media?.[0]?.url} variant="rounded" />
          </ListItemAvatar>
          <ListItemText
            primary={item.product?.name}
            secondary={`Quantity: ${item.quantity} • Rs. ${item.price?.toLocaleString()}`}
            primaryTypographyProps={{ sx: styles.text }}
            secondaryTypographyProps={{ sx: styles.textSecondary }}
          />
        </ListItem>
      ))
    )}
  </List>
);

const WishlistItemsList = ({ products, styles }) => (
  <List disablePadding>
    {products.length === 0 ? (
      <EmptyState message="Wishlist is empty" icon={RiHeartLine} styles={styles} />
    ) : (
      products.map((product) => (
        <ListItem key={product._id} sx={styles.listItem}>
          <ListItemAvatar>
            <Avatar src={product?.media?.[0]?.url} variant="rounded" />
          </ListItemAvatar>
          <ListItemText
            primary={product.name}
            secondary={`Rs. ${product.price?.toLocaleString()}`}
            primaryTypographyProps={{ sx: styles.text }}
            secondaryTypographyProps={{ sx: styles.textSecondary }}
          />
        </ListItem>
      ))
    )}
  </List>
);

const getStatusColor = (status, theme) => {
  const statusColors = {
    pending: {
      bg: 'rgba(255, 193, 7, 0.1)',
      text: '#ffc107',
      border: 'rgba(255, 193, 7, 0.3)'
    },
    processing: {
      bg: 'rgba(33, 150, 243, 0.1)',
      text: '#2196f3',
      border: 'rgba(33, 150, 243, 0.3)'
    },
    shipped: {
      bg: 'rgba(33, 150, 243, 0.1)',
      text: '#2196f3',
      border: 'rgba(33, 150, 243, 0.3)'
    },
    delivered: {
      bg: 'rgba(76, 175, 80, 0.1)',
      text: '#4caf50',
      border: 'rgba(76, 175, 80, 0.3)'
    },
    cancelled: {
      bg: 'rgba(244, 67, 54, 0.1)',
      text: '#f44336',
      border: 'rgba(244, 67, 54, 0.3)'
    }
  };

  return statusColors[status.toLowerCase()] || {
    bg: 'rgba(158, 158, 158, 0.1)',
    text: '#9e9e9e',
    border: 'rgba(158, 158, 158, 0.3)'
  };
};

const OrdersList = ({ orders, styles }) => {
  const { themeValue } = useTheme();
  
  return (
    <List disablePadding>
      {orders.length === 0 ? (
        <EmptyState message="No orders yet" icon={RiShoppingBag3Line} styles={styles} />
      ) : (
        orders.map((order) => {
          const statusColor = getStatusColor(order.status, themeValue);
          return (
            <ListItem key={order._id} sx={styles.listItem}>
              <ListItemText
                primary={`Order #${order.orderId}`}
                secondary={`${order.items?.length} items • Rs. ${order.totalAmount?.toLocaleString()}`}
                primaryTypographyProps={{ sx: styles.text }}
                secondaryTypographyProps={{ sx: styles.textSecondary }}
              />
              <Chip 
                label={order.status} 
                size="small"
                sx={{
                  ...styles.chip,
                  backgroundColor: statusColor.bg,
                  color: statusColor.text,
                  border: `1px solid ${statusColor.border}`,
                  '& .MuiChip-label': {
                    px: 1,
                    fontSize: '0.75rem',
                    fontWeight: 500
                  }
                }}
              />
            </ListItem>
          );
        })
      )}
    </List>
  );
};

const PersonalInfoSection = ({ buyer, styles }) => (
  <Grid container spacing={3}>
    {/* Basic Information */}
    <Grid item xs={12} md={6}>
      <Paper elevation={0} sx={{ ...styles.paper, ...styles.mobileCard }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
          Basic Information
        </Typography>
        <Divider sx={{ ...styles.divider, mb: 2 }} />
        
        <Grid container spacing={2}>
          <InfoItem icon={Person} label="Username" value={buyer.username} />
          <InfoItem icon={Email} label="Email" value={buyer.email} />
          <InfoItem icon={Phone} label="Phone" value={buyer.phoneNumber || 'Not provided'} />
          <InfoItem icon={Cake} label="Date of Birth" value={new Date(buyer.dateOfBirth).toLocaleDateString()} />
          <InfoItem icon={Info} label="Gender" value={buyer.gender} />
        </Grid>
      </Paper>
    </Grid>

    {/* Address Information */}
    <Grid item xs={12} md={6}>
      <Paper elevation={0} sx={{ ...styles.paper, ...styles.mobileCard }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
          Address Information
        </Typography>
        <Divider sx={{ ...styles.divider, mb: 2 }} />
        
        <Grid container spacing={2}>
          <InfoItem icon={LocationOn} label="Address" value={buyer.address || 'Not provided'} />
          <InfoItem icon={LocationOn} label="City" value={buyer.city || 'Not provided'} />
          <InfoItem icon={LocationOn} label="Country" value={buyer.country || 'Not provided'} />
        </Grid>
      </Paper>
    </Grid>

    {/* Preferences */}
    <Grid item xs={12} md={6}>
      <Paper elevation={0} sx={{ ...styles.paper, ...styles.mobileCard }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
          Preferences
        </Typography>
        <Divider sx={{ ...styles.divider, mb: 2 }} />
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Preferred Scents
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {buyer.preferredScents?.length > 0 ? (
              buyer.preferredScents.map((scent, index) => (
                <Chip
                  key={index}
                  label={scent}
                  size="small"
                  sx={styles.preferenceChip}
                />
              ))
            ) : (
              <Typography variant="body2" sx={styles.secondaryText}>
                No preferences set
              </Typography>
            )}
          </Box>
        </Box>

        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Allergies
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {buyer.allergies?.length > 0 ? (
              buyer.allergies.map((allergy, index) => (
                <Chip
                  key={index}
                  label={allergy}
                  size="small"
                  sx={styles.allergyChip}
                />
              ))
            ) : (
              <Typography variant="body2" sx={styles.secondaryText}>
                No allergies listed
              </Typography>
            )}
          </Box>
        </Box>
      </Paper>
    </Grid>

    {/* Account Information */}
    <Grid item xs={12} md={6}>
      <Paper elevation={0} sx={{ ...styles.paper, ...styles.mobileCard }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
          Account Information
        </Typography>
        <Divider sx={{ ...styles.divider, mb: 2 }} />
        
        <Grid container spacing={2}>
          <InfoItem 
            icon={Update} 
            label="Member Since" 
            value={new Date(buyer.createdAt).toLocaleDateString()} 
          />
          <InfoItem 
            icon={Update} 
            label="Last Updated" 
            value={new Date(buyer.lastUpdated).toLocaleDateString()} 
          />
        </Grid>
        {buyer.bio && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Bio
            </Typography>
            <Typography variant="body2" sx={styles.secondaryText}>
              {buyer.bio}
            </Typography>
          </Box>
        )}
      </Paper>
    </Grid>
  </Grid>
);

const InfoItem = ({ icon: Icon, label, value }) => (
  <Grid item xs={12}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Icon fontSize="small" color="action" />
      <Box>
        <Typography variant="caption" color="textSecondary">
          {label}
        </Typography>
        <Typography variant="body2">
          {value}
        </Typography>
      </Box>
    </Box>
  </Grid>
);

const CustomerDetails = () => {
  const { theme, themeValue } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id } = useParams();
  const [buyer, setBuyer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [buyerData, setBuyerData] = useState({
    cart: null,
    wishlist: null,
    orders: [],
    stats: null
  });

  // Handle back button
  const handleBack = () => {
    navigate(`/${user._id}/admin/customers`);
  };

  useEffect(() => {
    const fetchBuyerDetails = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await buyerAPI.getBuyerDetails(id, token);
        
        if (response.data.success) {
          const { buyer, cart, wishlist, orders, stats } = response.data.data;
          setBuyer(buyer);
          setBuyerData({ cart, wishlist, orders, stats });
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching buyer details');
      } finally {
        setLoading(false);
      }
    };

    fetchBuyerDetails();
  }, [id]);

  // Handle browser back button and manual navigation
  useEffect(() => {
    const handlePopState = () => {
      handleBack();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [user._id]);

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: themeValue.background,
      pt: { 
        xs: '72px', // Space for mobile navbar
        md: '0'     // No extra space for desktop
      },
      pb: 3,
      color: themeValue.text
    },
    section: {
      backgroundColor: themeValue.card,
      borderRadius: 1.5,
      p: { xs: 1.5, sm: 2 },
      mb: 2,
      border: `1px solid ${themeValue.border}`,
      transition: 'all 0.3s ease',
      color: themeValue.text,
      '&:hover': {
        boxShadow: themeValue.name === 'dark' 
          ? '0 4px 20px rgba(0,0,0,0.4)' 
          : '0 4px 20px rgba(0,0,0,0.1)'
      }
    },
    scrollContainer: {
      maxHeight: '300px',
      overflowY: 'auto',
      pr: 1,
      '&::-webkit-scrollbar': {
        width: '4px'
      },
      '&::-webkit-scrollbar-track': {
        background: themeValue.background
      },
      '&::-webkit-scrollbar-thumb': {
        background: themeValue.border,
        borderRadius: '2px'
      }
    },
    statsCard: {
      p: 1.5,
      borderRadius: 1,
      backgroundColor: themeValue.card,
      border: `1px solid ${themeValue.border}`,
      height: '100%',
      color: themeValue.text
    },
    divider: {
      my: 1.5,
      borderColor: themeValue.border
    },
    chip: {
      height: '24px',
      backgroundColor: themeValue.background,
      color: themeValue.text,
      border: `1px solid ${themeValue.border}`,
      '& .MuiChip-label': {
        px: 1,
        fontSize: '0.75rem'
      }
    },
    title: {
      fontSize: { xs: '1rem', sm: '1.25rem' },
      fontWeight: 500,
      color: themeValue.text,
      mb: 1
    },
    subtitle: {
      fontSize: '0.875rem',
      color: themeValue.textSecondary,
      mb: 0.5
    },
    text: {
      fontSize: '0.875rem',
      color: themeValue.text
    },
    textSecondary: {
      fontSize: '0.75rem',
      color: themeValue.textSecondary
    },
    listItem: {
      px: 0,
      py: 0.75,
      '& .MuiListItemIcon-root': {
        color: themeValue.textSecondary,
        minWidth: 32
      },
      '& .MuiListItemText-primary': {
        fontSize: '0.75rem',
        color: themeValue.textSecondary
      },
      '& .MuiListItemText-secondary': {
        fontSize: '0.875rem',
        color: themeValue.text
      }
    },
    avatar: {
      width: { xs: 60, sm: 80 },
      height: { xs: 60, sm: 80 },
      mx: 'auto',
      mb: 1
    }
  };

  if (loading) {
    return (
      <Box sx={styles.container}>
        <Container maxWidth="lg" sx={styles.mainContent}>
          <LoadingSkeleton />
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={styles.container}>
        <Container maxWidth="lg" sx={styles.mainContent}>
          <Typography color="error" variant="h6" align="center">
            {error}
          </Typography>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={styles.container}>
      <Container 
        maxWidth="xl" 
        sx={{ 
          px: { xs: 1, sm: 2 },
          py: { xs: 1, sm: 2 }
        }}
      >
        {/* Add Back Button */}
        <Box sx={{ mb: 2 }}>
          <IconButton 
            onClick={handleBack}
            sx={{ 
              color: themeValue.text,
              '&:hover': {
                backgroundColor: themeValue.name === 'dark' 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            <ArrowBack />
          </IconButton>
        </Box>

        <Grid container spacing={2}>
          {/* Left Column */}
          <Grid item xs={12} md={4}>
            {/* Profile Card */}
            <Paper elevation={0} sx={styles.section}>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Avatar
                  src={buyer?.profilePicture?.url}
                  sx={styles.avatar}
                />
                <Typography sx={styles.title}>
                  {buyer?.name}
                </Typography>
                <Typography sx={styles.textSecondary}>
                  {buyer?.email}
                </Typography>
              </Box>
              
              <Divider sx={styles.divider} />
              
              {/* Quick Stats */}
              <Grid container spacing={1}>
                <StatsCard
                  icon={RiShoppingBag3Line}
                  title="Orders"
                  value={buyerData.stats?.totalOrders || 0}
                  styles={styles}
                />
                <StatsCard
                  icon={RiMoneyDollarCircleLine}
                  title="Spent"
                  value={`Rs. ${buyerData.stats?.totalSpent?.toLocaleString() || 0}`}
                  styles={styles}
                />
              </Grid>
            </Paper>

            {/* Personal Info */}
            <Paper elevation={0} sx={styles.section}>
              <Typography sx={styles.title}>
                Personal Info
              </Typography>
              <InfoList buyer={buyer} styles={styles} />
            </Paper>
          </Grid>

          {/* Right Column */}
          <Grid item xs={12} md={8}>
            {/* Shopping Sections */}
            <Grid container spacing={2}>
              {/* Cart Section */}
              <Grid item xs={12}>
                <Paper elevation={0} sx={styles.section}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography sx={styles.title}>
                      Cart
                    </Typography>
                    <Chip 
                      label={`${buyerData.cart?.items?.length || 0} items`}
                      sx={styles.chip}
                    />
                  </Box>
                  <Box sx={styles.scrollContainer}>
                    <CartItemsList items={buyerData.cart?.items || []} styles={styles} />
                  </Box>
                </Paper>
              </Grid>

              {/* Wishlist Section */}
              <Grid item xs={12}>
                <Paper elevation={0} sx={styles.section}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography sx={styles.title}>
                      Wishlist
                    </Typography>
                    <Chip 
                      label={`${buyerData.wishlist?.products?.length || 0} items`}
                      sx={styles.chip}
                    />
                  </Box>
                  <Box sx={styles.scrollContainer}>
                    <WishlistItemsList products={buyerData.wishlist?.products || []} styles={styles} />
                  </Box>
                </Paper>
              </Grid>

              {/* Orders Section */}
              <Grid item xs={12}>
                <Paper elevation={0} sx={styles.section}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography sx={styles.title}>
                      Orders
                    </Typography>
                    <Chip 
                      label={`${buyerData.orders?.length || 0} orders`}
                      sx={styles.chip}
                    />
                  </Box>
                  <Box sx={styles.scrollContainer}>
                    <OrdersList orders={buyerData.orders || []} styles={styles} />
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

const LoadingSkeleton = () => (
  <Box sx={{ p: 4 }}>
    <Skeleton variant="rectangular" height={200} sx={{ mb: 3, borderRadius: 3 }} />
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} />
      </Grid>
      <Grid item xs={12} md={6}>
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} />
      </Grid>
    </Grid>
  </Box>
);

const ErrorMessage = ({ error }) => (
  <Box sx={{ p: 4, textAlign: 'center' }}>
    <Typography color="error" variant="h6">
      {error}
    </Typography>
  </Box>
);

export default CustomerDetails;
