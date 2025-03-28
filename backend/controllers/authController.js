const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Buyer = require('../models/Buyer');
const Seller = require('../models/Seller');
const crypto = require('crypto');

// Add the generateReferralCode function at the top of the file
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

// Buyer Registration
exports.registerBuyer = async (req, res) => {
  try {
    const { username, name, phoneNumber, referralCode } = req.body;
    console.log('Received registration data:', { username, name, phoneNumber, referralCode }); // Debug log

    // Check if user already exists
    const existingUser = await Buyer.findOne({ 
      $or: [{ username }, { phoneNumber }] 
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username or phone number already exists'
      });
    }

    // Create new buyer
    const buyer = new Buyer({
      username,
      name,
      phoneNumber
    });

    // Generate unique referral code for new user
    buyer.referralCode = await generateReferralCode();

    // If referral code provided, process it
    if (referralCode) {
      console.log('Processing referral code:', referralCode);
      const referrer = await Buyer.findOne({ referralCode });
      if (referrer) {
        console.log('Found referrer:', referrer._id);
        buyer.referredBy = referrer._id;
        
        // Only increment total referrals count, no coins
        await Buyer.findByIdAndUpdate(referrer._id, {
          $inc: { totalReferrals: 1 }
        });
      }
    }

    await buyer.save();
    console.log('New buyer saved:', buyer._id); // Debug log

    // Generate JWT token
    const token = jwt.sign(
      { id: buyer._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: buyer._id,
        username: buyer.username,
        name: buyer.name,
        phoneNumber: buyer.phoneNumber,
        role: buyer.role,
        referralCode: buyer.referralCode
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during registration',
      error: error.message
    });
  }
};

// Login with phone number only
exports.login = async (req, res) => {
  try {
    const { phoneNumber } = req.body; 

    let user = await Seller.findOne({ phoneNumber });

    if (!user) {
      user = await Buyer.findOne({ phoneNumber });
    }

    // If no user found
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'No account found with this phone number'
      });
    }

    // Create token
    const token = jwt.sign(
      { 
        id: user._id,
        type: user.isAdmin ? 'seller' : 'buyer',
        username: user.username,
        isAdmin: user.isAdmin || false
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Send response
    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        username: user.username,
        name: user.name,
        phoneNumber: user.phoneNumber,
        role: user.isAdmin ? 'seller' : 'buyer',
        isAdmin: user.isAdmin || false
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Add this new endpoint for Seller Registration
exports.registerSeller = async (req, res) => {
  try {
    const { 
      username,
      name,
      email,
      password,
      phoneNumber,
      businessDetails
    } = req.body;

    // Check if seller exists
    let sellerExists = await Seller.findOne({ 
      $or: [
        { username },
        { email },
        { phoneNumber }
      ]
    });
    
    if (sellerExists) {
      return res.status(400).json({ 
        success: false,
        message: 'Seller already exists'
      });
    }

    // Create new seller
    const seller = new Seller({
      username,
      name,
      email,
      password,
      phoneNumber,
      businessDetails,
      isAdmin: true
    });

    // Save seller
    await seller.save();

    // Create token
    const token = jwt.sign(
      { 
        id: seller._id,
        type: 'seller',
        username: seller.username,
        isAdmin: true
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: seller._id,
        username: seller.username,
        name: seller.name,
        email: seller.email,
        phoneNumber: seller.phoneNumber,
        isAdmin: true
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed'
    });
  }
}; 