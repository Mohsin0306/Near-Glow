const Cart = require('../models/Cart');
const Product = require('../models/Product');
const mongoose = require('mongoose');

exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, selectedColor } = req.body;
    const buyerId = req.user.id;

    // Validate product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Validate color if provided
    let colorData = null;
    if (selectedColor && selectedColor.name) {
      const color = product.colors?.find(c => c.name === selectedColor.name);
      if (!color) {
        return res.status(400).json({
          success: false,
          message: 'Selected color not available for this product'
        });
      }
      colorData = {
        name: color.name,
        media: color.media[0] // Use first media item
      };
    }

    // Find or create cart
    let cart = await Cart.findOne({ buyer: buyerId });
    if (!cart) {
      cart = new Cart({ buyer: buyerId, items: [] });
    }

    // Check if item with same product and color exists
    const existingItemIndex = cart.items.findIndex(item => 
      item.product.toString() === productId &&
      ((!colorData && !item.selectedColor) || 
       (item.selectedColor?.name === colorData?.name))
    );

    if (existingItemIndex !== -1) {
      // Update existing item quantity
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        quantity,
        price: product.salePrice,
        selectedColor: colorData,
        isSelected: true
      });
    }

    await cart.save();

    // Populate product details
    const populatedCart = await Cart.findById(cart._id)
      .populate({
        path: 'items.product',
        select: 'name media price salePrice stock colors'
      });

    // Only send one success message
    res.json({
      success: true,
      cart: populatedCart,
      message: `Added ${product.name}${colorData ? ` (${colorData.name})` : ''} to cart`
    });

  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding item to cart',
      error: error.message
    });
  }
};

exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ buyer: req.user.id })
      .populate({
        path: 'items.product',
        select: 'name media price salePrice stock colors'
      });

    res.json({
      success: true,
      cart: cart || { 
        items: [], 
        totalAmount: 0 
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching cart',
      error: error.message
    });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const { productId, quantity, selectedColor } = req.body;
    
    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    const cart = await Cart.findOne({ buyer: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId &&
             item.selectedColor?.name === (selectedColor?.name || null)
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    // Check stock availability
    const product = await Product.findById(productId);
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock'
      });
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();
    await cart.populate('items.product', 'name media price stock');

    res.json({
      success: true,
      cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating cart item',
      error: error.message
    });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const { productId, selectedColor } = req.params;
    
    const cart = await Cart.findOne({ buyer: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Filter items considering both productId and color
    cart.items = cart.items.filter(item => {
      if (item.product.toString() !== productId) return true;
      if (selectedColor) {
        return item.selectedColor?.name !== selectedColor;
      }
      return item.selectedColor !== null; // Keep items with different colors
    });

    await cart.save();
    await cart.populate('items.product', 'name media price stock');

    res.json({
      success: true,
      cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing item from cart',
      error: error.message
    });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ buyer: req.user.id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.json({
      success: true,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error clearing cart',
      error: error.message
    });
  }
};

exports.toggleItemSelection = async (req, res) => {
  try {
    const { productId, selected, selectedColor } = req.body;
    console.log('Toggle selection request:', { productId, selected, selectedColor });
    
    const cart = await Cart.findOne({ buyer: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Debug log to see what's in the cart
    console.log('Cart items before toggle:', cart.items.map(item => ({
      productId: item.product.toString(),
      selectedColor: item.selectedColor,
    })));

    // First, set all items to unselected
    cart.items.forEach(item => {
      item.isSelected = false;
    });

    // Then, find and select only the specific item
    const itemIndex = cart.items.findIndex(item => {
      const productMatch = item.product.toString() === productId;
      
      if (!selectedColor) {
        // For products without color, match if the item has no selectedColor or selectedColor is null
        return productMatch && (!item.selectedColor || item.selectedColor === null);
      }
      
      // For products with color, match both product and color
      return productMatch && item.selectedColor && item.selectedColor.name === selectedColor.name;
    });

    console.log('Found item index:', itemIndex);

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    // Update only the specific item's selection status
    cart.items[itemIndex].isSelected = selected;
    console.log(`Updated item selection: Product ${productId}, Color ${selectedColor?.name || 'none'}, Selected: ${selected}`);

    await cart.save();
    
    await cart.populate({
      path: 'items.product',
      select: 'name media price salePrice stock colors'
    });

    res.json({
      success: true,
      cart
    });
  } catch (error) {
    console.error('Toggle selection error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating item selection',
      error: error.message
    });
  }
};

exports.validateCartForCheckout = async (req, res) => {
  try {
    const cart = await Cart.findOne({ buyer: req.user.id })
      .populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    const selectedItems = cart.items.filter(item => item.isSelected);
    if (selectedItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items selected for checkout'
      });
    }

    // Verify stock availability for selected items
    for (const item of selectedItems) {
      if (!item.product || item.product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product: ${item.product?.name || 'Unknown product'}`
        });
      }
    }

    res.json({
      success: true,
      selectedItems,
      totalAmount: cart.totalAmount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error validating cart',
      error: error.message
    });
  }
};

// Update the direct purchase endpoint to be more comprehensive
exports.directPurchase = async (req, res) => {
  try {
    const { productId, quantity = 1, selectedColor } = req.body;
    const buyerId = req.user.id;

    // Validate product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock'
      });
    }

    // Validate color if provided
    let colorData = null;
    if (selectedColor) {
      const color = product.colors?.find(c => c.name === selectedColor);
      if (!color) {
        return res.status(400).json({
          success: false,
          message: 'Selected color not available for this product'
        });
      }
      colorData = {
        name: color.name,
        media: color.media[0] // Use first media item
      };
    }

    // Calculate amounts
    const price = product.salePrice || product.price;
    const subtotal = price * quantity;
    const deliveryPrice = product.deliveryPrice || 0;
    const totalAmount = subtotal + deliveryPrice;

    // Get buyer's referral coins for potential discount
    const buyer = await mongoose.model('Buyer').findById(buyerId);
    const availableCoins = buyer ? buyer.referralCoins : 0;
    const maxPossibleDiscount = Math.floor(subtotal * 0.1); // 10% max discount
    const maxUsableCoins = Math.ceil(maxPossibleDiscount / 0.02);

    // Create temporary order details for direct purchase
    const directPurchaseDetails = {
      product: {
        _id: product._id,
        name: product.name,
        price: price,
        media: product.media,
        deliveryPrice
      },
      quantity,
      selectedColor: colorData,
      amounts: {
        subtotal,
        deliveryPrice,
        totalAmount
      },
      referral: {
        availableCoins,
        maxUsableCoins,
        coinValue: 0.02,
        maxPossibleDiscount
      }
    };

    res.json({
      success: true,
      directPurchaseDetails,
      message: 'Ready for direct purchase'
    });

  } catch (error) {
    console.error('Error processing direct purchase:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing direct purchase',
      error: error.message
    });
  }
}; 