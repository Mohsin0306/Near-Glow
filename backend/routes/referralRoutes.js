const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getReferralCode,
  getReferralStats,
  useReferralCoins
} = require('../controllers/referralController');

// Get referral code and link
router.get('/code', auth, getReferralCode);

// Get referral statistics
router.get('/stats', auth, getReferralStats);

// Use referral coins for discount
router.post('/use-coins', auth, useReferralCoins);

module.exports = router; 