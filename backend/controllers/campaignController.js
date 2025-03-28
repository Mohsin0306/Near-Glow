const Campaign = require('../models/Campaign');
const Product = require('../models/Product'); // Import Product model
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// @desc    Get all campaigns
// @route   GET /api/campaigns
// @access  Private/Admin
const getCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find()
      .sort('-createdAt')
      .select('title image link description isActive');
    
    res.status(200).json({
      success: true,
      count: campaigns.length,
      data: campaigns
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching campaigns'
    });
  }
};

// @desc    Create new campaign
// @route   POST /api/campaigns
// @access  Private/Admin
const createCampaign = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Please upload an image'
      });
    }

    const { title, link = '', description = '' } = req.body;

    if (!title) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        error: 'Please add a title'
      });
    }

    // Upload image to cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'campaigns'
    });

    // Remove file from server
    fs.unlinkSync(req.file.path);

    const campaign = await Campaign.create({
      title,
      link,
      description,
      image: {
        url: result.secure_url,
        public_id: result.public_id
      },
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: campaign
    });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({
      success: false,
      error: 'Error creating campaign'
    });
  }
};

// @desc    Get campaign by ID
// @route   GET /api/campaigns/:id
// @access  Private/Admin
const getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: campaign
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching campaign'
    });
  }
};

// @desc    Update campaign status (enable/disable)
// @route   PUT /api/campaigns/:id/status
// @access  Private/Admin
const updateCampaignStatus = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    campaign.isActive = !campaign.isActive;
    await campaign.save();

    res.status(200).json({
      success: true,
      data: campaign
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error updating campaign status'
    });
  }
};

// @desc    Update campaign
// @route   PUT /api/campaigns/:id
// @access  Private/Admin
const updateCampaign = async (req, res) => {
  try {
    let campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    const { title, link = '', description = '' } = req.body;
    
    // Update campaign data
    if (title) {
      campaign.title = title;
    }
    campaign.link = link;
    campaign.description = description; // Update description

    // Update image if provided
    if (req.file) {
      // Delete old image from cloudinary
      if (campaign.image.public_id) {
        await cloudinary.uploader.destroy(campaign.image.public_id);
      }

      // Upload new image
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'campaigns'
      });

      // Remove file from server
      fs.unlinkSync(req.file.path);

      campaign.image = {
        url: result.secure_url,
        public_id: result.public_id
      };
    }

    await campaign.save();

    res.status(200).json({
      success: true,
      data: campaign
    });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({
      success: false,
      error: 'Error updating campaign'
    });
  }
};

// @desc    Delete campaign
// @route   DELETE /api/campaigns/:id
// @access  Private/Admin
const deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    // Delete image from cloudinary
    if (campaign.image.public_id) {
      await cloudinary.uploader.destroy(campaign.image.public_id);
    }

    await campaign.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error deleting campaign'
    });
  }
};

// CAMPAIGN PRODUCTS CONTROLLERS

// @desc    Get products in a campaign
// @route   GET /api/campaigns/:id/products
// @access  Private/Admin
const getCampaignProducts = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate({
        path: 'products.product',
        select: 'name price media category stock',
        model: 'Product'
      });
    
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }
    
    // Format the response with proper image structure from media field and correct discount
    const products = campaign.products.map(item => {
      const product = item.product;
      
      // Safely handle discount percentage
      const discountPercent = parseInt(item.discountPercent) || 0;
      
      // Get the first media item (image) from the product
      let imageUrl = '';
      if (product.media && product.media.length > 0) {
        // Use the url from the first media item
        imageUrl = product.media[0].url;
      }
      
      // Handle price calculations
      const originalPrice = parseFloat(product.price) || 0;
      const discountedPrice = Math.round(originalPrice * (1 - (discountPercent / 100)));
      
      return {
        _id: product._id,
        name: product.name,
        price: originalPrice,
        image: {
          url: imageUrl
        },
        category: product.category,
        stock: product.stock || 0,
        discountPercent: discountPercent, // Always return a numeric value
        discountedPrice: discountedPrice, // Add calculated discounted price
        addedAt: item.addedAt
      };
    });
    
    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error fetching campaign products'
    });
  }
};

// @desc    Add product to campaign with discount
// @route   POST /api/campaigns/:id/products
// @access  Private/Admin
const addProductToCampaign = async (req, res) => {
  try {
    const { productId, discountPercent } = req.body;
    
    if (!productId || !discountPercent) {
      return res.status(400).json({
        success: false,
        error: 'Please provide productId and discountPercent'
      });
    }
    
    // Validate discount percentage
    if (discountPercent < 1 || discountPercent > 100) {
      return res.status(400).json({
        success: false,
        error: 'Discount percentage must be between 1 and 100'
      });
    }
    
    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    // Find the campaign
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }
    
    // Check if product is already in campaign
    const existingProduct = campaign.products.find(
      p => p.product.toString() === productId
    );
    
    if (existingProduct) {
      // Update discount if product already exists
      existingProduct.discountPercent = discountPercent;
      existingProduct.addedAt = Date.now();
    } else {
      // Add new product to campaign
      campaign.products.push({
        product: productId,
        discountPercent: discountPercent
      });
    }
    
    await campaign.save();
    
    res.status(200).json({
      success: true,
      message: 'Product added to campaign successfully',
      data: campaign
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error adding product to campaign'
    });
  }
};

// @desc    Remove product from campaign
// @route   DELETE /api/campaigns/:id/products/:productId
// @access  Private/Admin
const removeProductFromCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }
    
    // Find index of product in campaign products array
    const productIndex = campaign.products.findIndex(
      p => p.product.toString() === req.params.productId
    );
    
    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Product not found in this campaign'
      });
    }
    
    // Remove product from array
    campaign.products.splice(productIndex, 1);
    await campaign.save();
    
    res.status(200).json({
      success: true,
      message: 'Product removed from campaign',
      data: campaign
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error removing product from campaign'
    });
  }
};

// @desc    Get all active campaigns with products for public view
// @route   GET /api/campaigns/active
// @access  Public
const getActiveCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ isActive: true })
      .select('title image link description')
      .populate({
        path: 'products.product',
        select: 'name price media category stock description slug',
        model: 'Product'
      });
    
    // Format response to include discounted products with calculated prices
    const formattedCampaigns = campaigns.map(campaign => {
      const products = campaign.products
        .filter(item => item.product) // Filter out any invalid products
        .map(item => {
          const product = item.product;
          const discountPercent = parseInt(item.discountPercent) || 0;
          const originalPrice = parseFloat(product.price) || 0;
          const discountAmount = Math.round(originalPrice * (discountPercent / 100));
          const discountedPrice = originalPrice - discountAmount;
          
          // Get image URL from media
          let imageUrl = '';
          if (product.media && product.media.length > 0) {
            imageUrl = product.media[0].url;
          } else if (product.images && product.images.length > 0) {
            imageUrl = typeof product.images[0] === 'string' ? 
              product.images[0] : product.images[0].url || '';
          }
          
          return {
            _id: product._id,
            name: product.name,
            slug: product.slug,
            description: product.description,
            originalPrice,
            discountPercent, // Ensure this is a number
            discountAmount,
            discountedPrice,
            image: { url: imageUrl },
            category: product.category,
            stock: product.stock || 0
          };
        });
      
      return {
        _id: campaign._id,
        title: campaign.title,
        link: campaign.link || '',
        description: campaign.description || '',
        image: campaign.image,
        productsCount: products.length,
        products
      };
    });
    
    res.status(200).json({
      success: true,
      count: formattedCampaigns.length,
      data: formattedCampaigns
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error fetching active campaigns'
    });
  }
};

// Add this function to get all products for admin selection
// @desc    Get all products for admin to select
// @route   GET /api/campaigns/products
// @access  Private/Admin
const getProductsForCampaign = async (req, res) => {
  try {
    // Get all active products with essential fields for selection
    const products = await Product.find({ isActive: true })
      .select('name price images category stock')
      .sort('name');
    
    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error fetching products'
    });
  }
};

// @desc    Add multiple products to campaign with discount
// @route   POST /api/campaigns/:id/products/batch
// @access  Private/Admin
const addProductsBatchToCampaign = async (req, res) => {
  try {
    const { products, discount } = req.body;
    const productIds = Array.isArray(products) ? products : [];
    
    // Ensure discountValue is a valid number
    const discountValue = parseInt(discount) || 10;
    
    if (productIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an array of product IDs'
      });
    }
    
    // Find the campaign
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }
    
    // Process each product ID
    for (const productId of productIds) {
      // Check if product exists
      const productExists = await Product.exists({ _id: productId });
      if (!productExists) {
        continue; // Skip invalid products
      }
      
      // Check if product is already in campaign
      const existingProductIndex = campaign.products.findIndex(
        p => p.product.toString() === productId
      );
      
      if (existingProductIndex !== -1) {
        // Update discount if product already exists
        campaign.products[existingProductIndex].discountPercent = discountValue;
        campaign.products[existingProductIndex].addedAt = Date.now();
      } else {
        // Add new product to campaign
        campaign.products.push({
          product: productId,
          discountPercent: discountValue
        });
      }
    }
    
    await campaign.save();
    
    res.status(200).json({
      success: true,
      message: 'Products added to campaign successfully',
      data: campaign
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error adding products to campaign'
    });
  }
};

// Add a function to apply the same discount to multiple products
// @desc    Apply same discount to multiple products
// @route   POST /api/campaigns/:id/products/bulk-discount
// @access  Private/Admin
const applyBulkDiscount = async (req, res) => {
  try {
    const { productIds, discountPercent } = req.body;
    
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an array of product IDs'
      });
    }
    
    if (!discountPercent || discountPercent < 1 || discountPercent > 100) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid discount percentage (1-100)'
      });
    }
    
    // Find the campaign
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }
    
    // Process each product ID
    for (const productId of productIds) {
      // Check if product exists
      const productExists = await Product.exists({ _id: productId });
      if (!productExists) {
        continue; // Skip non-existent products
      }
      
      // Check if product is already in campaign
      const existingProductIndex = campaign.products.findIndex(
        p => p.product.toString() === productId
      );
      
      if (existingProductIndex !== -1) {
        // Update discount if product already exists
        campaign.products[existingProductIndex].discountPercent = discountPercent;
        campaign.products[existingProductIndex].addedAt = Date.now();
      } else {
        // Add new product to campaign
        campaign.products.push({
          product: productId,
          discountPercent: discountPercent
        });
      }
    }
    
    await campaign.save();
    
    res.status(200).json({
      success: true,
      message: `Discount of ${discountPercent}% applied to ${productIds.length} products`,
      data: campaign
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error applying bulk discount'
    });
  }
};

// Add function to remove multiple products at once
// @desc    Remove multiple products from campaign
// @route   DELETE /api/campaigns/:id/products/batch
// @access  Private/Admin
const removeProductsBatch = async (req, res) => {
  try {
    const { productIds } = req.body;
    
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an array of product IDs'
      });
    }
    
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }
    
    // Filter out the products to be removed
    campaign.products = campaign.products.filter(
      p => !productIds.includes(p.product.toString())
    );
    
    await campaign.save();
    
    res.status(200).json({
      success: true,
      message: `${productIds.length} products removed from campaign`,
      data: campaign
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error removing products from campaign'
    });
  }
};

module.exports = {
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
}; 