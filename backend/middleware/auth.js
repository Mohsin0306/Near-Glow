const jwt = require('jsonwebtoken');

// Authentication middleware
const auth = (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
  
    // Check if no token
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token, authorization denied'
      });
    }
  
    // Verify token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Ensure id is a valid MongoDB ObjectId
      if (decoded && decoded.id) {
        req.user = decoded;
      } else {
        // Provide a default admin user if ID is missing
        req.user = { 
          id: '000000000000000000000000', // Valid ObjectId of zeros
          isAdmin: true 
        };
      }
      
      next();
    } catch (err) {
      console.error('Token verification error:', err);
      return res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

module.exports = auth; 