const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const orderController = require('../controllers/orderController');

// Admin routes should be before other routes to prevent conflicts
router.get('/admin/orders', auth, adminAuth, orderController.getAdminOrders);
router.put('/:id/status', auth, adminAuth, orderController.updateOrderStatus);

// Add this route before other routes to prevent conflicts
router.get('/saved-addresses', auth, orderController.getSavedAddresses);

// Add this new route for calculating referral discount
router.post('/calculate-discount', auth, orderController.calculateReferralDiscount);

// Add this new route for direct purchase
router.post('/direct-purchase', auth, orderController.createDirectOrder);

// Other routes
router.post('/', auth, orderController.createOrder);
router.get('/', auth, orderController.getOrders);
router.get('/:id', auth, orderController.getOrderById);
router.post('/:id/cancel', auth, orderController.cancelOrder);

router.get('/:id/confirmation', auth, orderController.getOrderConfirmation);

module.exports = router; 