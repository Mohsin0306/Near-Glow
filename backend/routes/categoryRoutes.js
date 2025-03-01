const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { categoryUploadMiddleware } = require('../middleware/upload');
const {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategories,
  getCategory
} = require('../controllers/categoryController');

// Get all categories
router.get('/', getCategories);

// Create category - requires auth and image upload
router.post('/', auth, categoryUploadMiddleware, createCategory);

// Update category
router.put('/:id', auth, categoryUploadMiddleware, updateCategory);

// Delete category
router.delete('/:id', auth, deleteCategory);

// Get single category
router.get('/:id', getCategory);

module.exports = router;