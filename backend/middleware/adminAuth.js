const Seller = require('../models/Seller');
const jwt = require('jsonwebtoken');

const adminAuth = async (req, res, next) => {
  try {
    // Check if Authorization header exists
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Get token from header
    const token = authHeader.split(' ')[1];
    
    // Verify token and get user data
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user data to request
    req.user = decoded;
    
    // Find seller/admin
    const seller = await Seller.findById(decoded.id);
    
    if (!seller || !seller.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: error.message
    });
  }
};

module.exports = adminAuth; 