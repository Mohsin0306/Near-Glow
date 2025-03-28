const Product = require('../models/Product');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');
const mongoose = require('mongoose');
const { createNotification } = require('./notificationController');
const Buyer = require('../models/Buyer');

const cleanSubcategories = (subcategories) => {
  if (!subcategories) return [];
  
  try {
    const parsed = typeof subcategories === 'string' 
      ? JSON.parse(subcategories) 
      : subcategories;
    
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Take only the first subcategory and clean it
      const firstSub = parsed[0];
      let cleanedSub = firstSub;
      
      // Keep parsing until we get a clean string
      while (typeof cleanedSub === 'string' && 
             (cleanedSub.startsWith('[') || cleanedSub.startsWith('"'))) {
        cleanedSub = JSON.parse(cleanedSub);
      }
      
      return [typeof cleanedSub === 'string' 
        ? cleanedSub.trim() 
        : String(cleanedSub)];
    }
    return [];
  } catch (error) {
    console.error('Error parsing subcategories:', error);
    return [];
  }
};

const notifyFollowers = async (product, type, title, message, data = {}) => {
  try {
    const buyers = await Buyer.find();
    if (buyers.length > 0) {
      await createNotification(
        buyers.map(buyer => buyer._id),
        type,
        title,
        message,
        { productId: product._id, ...data }
      );
    }
  } catch (error) {
    console.error('Error sending notifications:', error);
  }
};

exports.createProduct = async (req, res) => {
  try {
    console.log('Files received:', req.files);
    console.log('Body received:', req.body);
    const {
      name,
      description,
      marketPrice,
      salePrice,
      deliveryPrice,
      category,
      brand,
      stock,
      status,
      specifications,
      features,
      colors
    } = req.body;

    // Set price to salePrice to satisfy schema requirement
    const price = salePrice;

    let media = [];
    let colorVariants = [];
    
    // Handle main product images/videos
    if (req.files && req.files.images) {
      const imageUploadPromises = req.files.images.map(file => 
        uploadToCloudinary(file, false)
      );
      const uploadedImages = await Promise.all(imageUploadPromises);
      media = [...media, ...uploadedImages];
    }

    // Handle color variant images
    if (colors) {
      const parsedColors = JSON.parse(colors);
      
      for (const color of parsedColors) {
        const colorFieldName = `colorImage_${color.name}`;
        if (req.files && req.files[colorFieldName]) {
          const colorImagePromises = req.files[colorFieldName].map(file =>
            uploadToCloudinary(file, false)
          );
          const uploadedColorImages = await Promise.all(colorImagePromises);
          
          colorVariants.push({
            name: color.name,
            media: uploadedColorImages
          });
        } else {
          // If no images uploaded for this color, still add the color
          colorVariants.push({
            name: color.name,
            media: []
          });
        }
      }
    }

    // Parse subcategories
    let subcategories = [];
    if (req.body.subcategories) {
      try {
        subcategories = JSON.parse(req.body.subcategories);
      } catch (error) {
        subcategories = [req.body.subcategories];
      }
    }

    // Create product with both price structures
    const product = await Product.create({
      name,
      description,
      price: parseFloat(price), // Add this for schema compatibility
      marketPrice: parseFloat(marketPrice),
      salePrice: parseFloat(salePrice),
      deliveryPrice: parseFloat(deliveryPrice || 0),
      category,
      subcategories,
      brand,
      stock,
      status: status || 'draft',
      specifications: JSON.parse(specifications || '[]'),
      features: JSON.parse(features || '[]'),
      media,
      colors: colorVariants,
      seller: req.user.id
    });

    // Notify about new product if it's published
    if (product.status === 'published') {
      await notifyFollowers(
        product,
        'NEW_PRODUCT',
        'New Product Available',
        `Check out our new product: ${product.name}`
      );
    }

    res.status(201).json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Validate prices if they're being updated
    if (req.body.marketPrice && req.body.salePrice) {
      if (parseFloat(req.body.salePrice) > parseFloat(req.body.marketPrice)) {
        return res.status(400).json({
          success: false,
          message: 'Sale price cannot be greater than market price'
        });
      }
    }

    // Check for price decrease only
    if (req.body.price && req.body.price < product.price) {
      await notifyFollowers(
        product,
        'PRICE_DROP',
        'Price Drop Alert!',
        `The price of ${product.name} has dropped from $${product.price} to $${req.body.price}`,
        {
          oldPrice: product.price,
          newPrice: req.body.price
        }
      );
    }

    // Check for stock updates
    if (req.body.stock !== undefined) {
      const newStock = parseInt(req.body.stock);
      const oldStock = product.stock;

      // Notify if stock was 0 and now available
      if (oldStock === 0 && newStock > 0) {
        await notifyFollowers(
          product,
          'STOCK_UPDATE',
          'Back in Stock',
          `${product.name} is back in stock with ${newStock} units available!`
        );
      }
      // Notify if stock is running low (less than or equal to 5)
      else if (newStock <= 5 && newStock > 0 && oldStock > 5) {
        await notifyFollowers(
          product,
          'STOCK_UPDATE',
          'Low Stock Alert',
          `Only ${newStock} units left of ${product.name}! Get it before it's gone.`
        );
      }
    }

    // Initialize media array with existing media from the product
    let media = [...product.media];
    let colorVariants = [...(product.colors || [])];

    // Handle removed media for main product
    if (req.body.removedMedia) {
      try {
        const removedMediaIds = JSON.parse(req.body.removedMedia);
        // Remove items from media array
        media = media.filter(item => !removedMediaIds.includes(item.public_id));
        // Delete from cloudinary
        for (const publicId of removedMediaIds) {
          await deleteFromCloudinary(publicId);
        }
      } catch (error) {
        console.error('Error processing removedMedia:', error);
      }
    }

    // Handle removed color variant media
    if (req.body.removedColorMedia) {
      try {
        const removedColorMedia = JSON.parse(req.body.removedColorMedia);
        for (const item of removedColorMedia) {
          const colorIndex = colorVariants.findIndex(c => c.name === item.colorName);
          if (colorIndex !== -1) {
            colorVariants[colorIndex].media = colorVariants[colorIndex].media.filter(
              m => !item.mediaIds.includes(m.public_id)
            );
            // Delete from cloudinary
            for (const publicId of item.mediaIds) {
              await deleteFromCloudinary(publicId);
            }
          }
        }
      } catch (error) {
        console.error('Error processing removedColorMedia:', error);
      }
    }

    // Handle new uploads
    if (req.files && req.files.images) {
      const imageUploadPromises = req.files.images.map(file => 
        uploadToCloudinary(file, false)
      );
      const uploadedImages = await Promise.all(imageUploadPromises);
      media = [...media, ...uploadedImages];
    }

    // Process subcategories
    let subcategories = [];
    if (req.body.subcategories) {
      try {
        subcategories = JSON.parse(req.body.subcategories);
      } catch (error) {
        subcategories = [req.body.subcategories];
      }
    }

    // Handle new color variants and their media
    if (req.body.colors) {
      const parsedColors = JSON.parse(req.body.colors);
      
      for (const color of parsedColors) {
        let existingColorIndex = colorVariants.findIndex(c => c.name === color.name);
        
        if (req.files && req.files[`color_${color.name}`]) {
          const colorImagePromises = req.files[`color_${color.name}`].map(file =>
            uploadToCloudinary(file, false)
          );
          const uploadedColorImages = await Promise.all(colorImagePromises);
          
          if (existingColorIndex !== -1) {
            colorVariants[existingColorIndex].media.push(...uploadedColorImages);
          } else {
            colorVariants.push({
              name: color.name,
              media: uploadedColorImages
            });
          }
        }
      }
    }

    // Update product with new price fields
    const updateData = {
      name: req.body.name,
      description: req.body.description,
      marketPrice: req.body.marketPrice ? parseFloat(req.body.marketPrice) : product.marketPrice,
      salePrice: req.body.salePrice ? parseFloat(req.body.salePrice) : product.salePrice,
      deliveryPrice: req.body.deliveryPrice ? parseFloat(req.body.deliveryPrice) : product.deliveryPrice,
      category: req.body.category,
      brand: req.body.brand,
      stock: req.body.stock,
      status: req.body.status || product.status,
      specifications: JSON.parse(req.body.specifications || '[]'),
      features: JSON.parse(req.body.features || '[]'),
      subcategories,
      media,
      colors: colorVariants,
    };

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updateData,
      { new: true, runValidators: true }
    ).populate('category');

    res.json({
      success: true,
      product: updatedProduct
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: error.message
    });
  }
};

exports.getProducts = async (req, res) => {
  try {
    let query = {};
    
    // If seller (admin) is requesting, show their products
    if (req.user && req.user.role === 'seller') {
      query = { seller: req.user.id };
    }

    // Get all products for this seller
    const products = await Product.find(query)
      .populate('category')
      .populate('seller', 'name')
      .sort({ createdAt: -1 }); // Sort by newest first

    // Calculate metrics
    const metrics = {
      totalProducts: products.length,
      productsWithOrders: products.filter(p => p.orderCount > 0).length,
      totalOrders: products.reduce((sum, p) => sum + (p.orderCount || 0), 0),
      averageOrders: products.length ? products.reduce((sum, p) => sum + (p.orderCount || 0), 0) / products.length : 0
    };

    // Sort products by orderCount and viewCount for topSales and trending
    const topSales = [...products].sort((a, b) => (b.orderCount || 0) - (a.orderCount || 0)).slice(0, 15);
    const trending = [...products].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 15);

    res.json({
      success: true,
      data: {
        topSales,
        trending
      },
      metrics
    });

  } catch (error) {
    console.error('Error in getProducts:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const now = new Date();
      const product = await Product.findById(req.params.id).session(session);

      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Always increment view count for better trending calculation
      await Product.findByIdAndUpdate(
        req.params.id,
        { 
          $inc: { viewCount: 1 },
          lastViewedAt: now
        },
        { session }
      );

      await session.commitTransaction();

      const updatedProduct = await Product.findById(req.params.id)
        .populate('category', 'name')
        .populate('seller', 'name');

      res.json({
        success: true,
        product: updatedProduct
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      seller: req.user.id
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or unauthorized'
      });
    }

    // Delete media from Cloudinary
    if (product.media && product.media.length > 0) {
      for (const mediaItem of product.media) {
        if (mediaItem.public_id) {
          await deleteFromCloudinary(mediaItem.public_id);
        }
      }
    }

    // Delete the product
    await Product.deleteOne({ _id: req.params.id });

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message
    });
  }
};

exports.getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const products = await Product.find({ 
      category: categoryId,
      status: 'published' // Only get published products
    })
    .populate('category')
    .populate('seller', 'name');

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Make sure this is being called when orders are created
exports.incrementOrderCount = async (productId) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { $inc: { orderCount: 1 } },
      { new: true }
    );
    console.log(`Updated order count for product ${productId}:`, updatedProduct.orderCount);
    return updatedProduct;
  } catch (error) {
    console.error('Error incrementing order count:', error);
    throw error;
  }
};

exports.searchProducts = async (req, res) => {
  try {
    const { q: query } = req.query;
    
    if (!query) {
      return res.json({
        success: true,
        data: [] // Return empty array instead of error
      });
    }

    // Create search criteria
    const searchCriteria = {
      status: 'published',
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { brand: { $regex: query, $options: 'i' } },
        { subcategories: { $regex: query, $options: 'i' } }
      ]
    };

    // Fetch products with populated category
    const products = await Product.find(searchCriteria)
      .populate('category', 'name')
      .sort({ orderCount: -1, viewCount: -1 })
      .limit(20);

    res.json({
      success: true,
      data: products || [] // Ensure we always return an array
    });

  } catch (error) {
    console.error('Search error:', error);
    res.json({
      success: true,
      data: [] // Return empty array on error
    });
  }
};

exports.getSearchSuggestions = async (req, res) => {
  try {
    const { q: query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json({
        success: true,
        suggestions: []
      });
    }

    // Find products matching the query
    const products = await Product.find({
      status: 'published',
      name: { $regex: query, $options: 'i' }
    })
    .select('name brand')
    .limit(5);
    
    // Extract unique suggestions from product names and brands
    const suggestions = [...new Set([
      ...products.map(p => p.name),
      ...products.map(p => p.brand)
    ])].slice(0, 8);

    res.json({
      success: true,
      suggestions
    });
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    res.json({
      success: true,
      suggestions: []
    });
  }
};

exports.getTrendingProducts = async (req, res) => {
  try {
    // Get trending products based on view count and recent views
    const trendingProducts = await Product.find({ 
      status: 'published',
      stock: { $gt: 0 }
    })
    .sort({ viewCount: -1, lastViewedAt: -1 })
    .limit(10)
    .populate('category', 'name')
    .populate('seller', 'name');

    res.json({
      success: true,
      products: trendingProducts
    });
  } catch (error) {
    console.error('Error fetching trending products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trending products',
      error: error.message
    });
  }
}; 