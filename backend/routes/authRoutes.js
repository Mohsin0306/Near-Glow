const express = require('express');
const router = express.Router();
const { 
  registerBuyer, 
  login,
  registerSeller
} = require('../controllers/authController');

// Register route for buyer only
router.post('/register/buyer', registerBuyer);

// Login route
router.post('/login', login);

// Register route for seller
router.post('/register-seller', registerSeller);

module.exports = router; 