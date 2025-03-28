const Buyer = require('../models/Buyer');
const crypto = require('crypto');

// Generate unique referral code
const generateReferralCode = async (length = 8) => {
  let code;
  let isUnique = false;
  
  while (!isUnique) {
    code = crypto.randomBytes(length).toString('hex').toUpperCase().slice(0, length);
    const existingBuyer = await Buyer.findOne({ referralCode: code });
    if (!existingBuyer) {
      isUnique = true;
    }
  }
  
  return code;
};

// Get or generate referral code
const getReferralCode = async (req, res) => {
  try {
    const buyer = await Buyer.findById(req.user.id);
    
    if (!buyer.referralCode) {
      buyer.referralCode = await generateReferralCode();
      await buyer.save();
    }
    
    const referralLink = `https://nearglow.com/ref/${buyer.referralCode}`;
    
    res.json({
      success: true,
      referralCode: buyer.referralCode,
      referralLink,
      referralCoins: buyer.referralCoins,
      totalReferrals: buyer.totalReferrals
    });
  } catch (error) {
    console.error('Error getting referral code:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting referral code',
      error: error.message
    });
  }
};

// Get referral statistics
const getReferralStats = async (req, res) => {
  try {
    const buyer = await Buyer.findById(req.user.id)
      .populate('referralHistory.referredUser', 'name username profilePicture');
    
    // Get detailed referral history with purchase info
    const referralHistory = await Promise.all(buyer.referralHistory.map(async (ref) => {
      const referredUser = await Buyer.findById(ref.referredUser);
      return {
        ...ref.toObject(),
        referredUser: {
          _id: referredUser._id,
          name: referredUser.name,
          username: referredUser.username,
          profilePicture: referredUser.profilePicture
        },
        orderAmount: ref.orderAmount,
        date: ref.createdAt
      };
    }));

    const stats = {
      totalReferrals: buyer.totalReferrals,
      referralCoins: buyer.referralCoins,
      referralHistory: referralHistory.sort((a, b) => b.date - a.date)
    };
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting referral stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting referral statistics',
      error: error.message
    });
  }
};

// Apply referral code during registration
const applyReferralCode = async (referralCode, newUserId) => {
  try {
    const referrer = await Buyer.findOne({ referralCode });
    if (!referrer) return false;
    
    // Update the new user with referrer info
    await Buyer.findByIdAndUpdate(newUserId, {
      referredBy: referrer._id
    });
    
    // Update referrer's stats
    referrer.totalReferrals += 1;
    await referrer.save();
    
    return true;
  } catch (error) {
    console.error('Error applying referral code:', error);
    return false;
  }
};

// Use referral coins for discount
const useReferralCoins = async (req, res) => {
  try {
    const { coinsToUse, totalAmount } = req.body;
    const buyer = await Buyer.findById(req.user.id);
    
    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer not found'
      });
    }

    console.log('Using referral coins:', {
      coinsToUse,
      totalAmount,
      availableCoins: buyer.referralCoins
    });
    
    if (coinsToUse > buyer.referralCoins) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient referral coins'
      });
    }
    
    // Calculate maximum possible discount (10% of total amount)
    const maxPossibleDiscount = Math.floor(totalAmount * 0.1);
    
    // Convert coins to discount (0.02 rupees per coin)
    const potentialDiscount = coinsToUse * 0.02;
    
    // Final discount is the lesser of maxPossibleDiscount and potentialDiscount
    const finalDiscount = Math.min(maxPossibleDiscount, potentialDiscount);
    
    console.log('Discount calculation:', {
      maxPossibleDiscount,
      potentialDiscount,
      finalDiscount
    });

    res.json({
      success: true,
      discount: finalDiscount,
      coinsToUse,
      remainingCoins: buyer.referralCoins - coinsToUse
    });
  } catch (error) {
    console.error('Error using referral coins:', error);
    res.status(500).json({
      success: false,
      message: 'Error applying referral discount',
      error: error.message
    });
  }
};

module.exports = {
  getReferralCode,
  getReferralStats,
  applyReferralCode,
  useReferralCoins
}; 