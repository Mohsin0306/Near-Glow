const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const { bannerUploadMiddleware } = require('../middleware/upload');
const { 
  getCampaigns, 
  createCampaign, 
  updateCampaignStatus, 
  deleteCampaign,
  getCampaignById,
  updateCampaign,
  getCampaignProducts,
  addProductToCampaign,
  removeProductFromCampaign,
  getActiveCampaigns,
  getProductsForCampaign,
  addProductsBatchToCampaign,
  applyBulkDiscount,
  removeProductsBatch
} = require('../controllers/campaignController');

// Public routes
router.get('/active', getActiveCampaigns);

// Admin product selection route
router.get('/products', adminAuth, getProductsForCampaign);

// Admin campaign routes
router.get('/', adminAuth, getCampaigns);
router.post('/', adminAuth, bannerUploadMiddleware, createCampaign);
router.get('/:id', adminAuth, getCampaignById);
router.put('/:id', adminAuth, bannerUploadMiddleware, updateCampaign);
router.put('/:id/status', adminAuth, updateCampaignStatus);
router.delete('/:id', adminAuth, deleteCampaign);

// Campaign products routes
router.get('/:id/products', adminAuth, getCampaignProducts);
router.post('/:id/products', adminAuth, addProductToCampaign);
router.post('/:id/products/batch', adminAuth, addProductsBatchToCampaign);
router.post('/:id/products/bulk-discount', adminAuth, applyBulkDiscount);
router.delete('/:id/products/:productId', adminAuth, removeProductFromCampaign);
router.delete('/:id/products/batch', adminAuth, removeProductsBatch);

module.exports = router; 