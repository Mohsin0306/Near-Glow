const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { createNotification, createOrderCancellationNotification } = require('./notificationController');
const Buyer = require('../models/Buyer');

exports.createOrder = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      paymentMethod,
      paymentDetails,
      useReferralCoins = false
    } = req.body;

    // Save the address to the buyer's profile
    await Buyer.findByIdAndUpdate(req.user.id, {
      $push: {
        savedAddresses: {
          firstName,
          lastName,
          email,
          phone,
          address,
          city,
          createdAt: new Date()
        }
      }
    });

    console.log('Creating order with params:', { 
      paymentMethod, 
      useReferralCoins,
      userId: req.user.id 
    });

    // Find cart and populate product details
    const cart = await Cart.findOne({ buyer: req.user.id })
      .populate('items.product');

    if (!cart || !cart.items.length) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Get ONLY selected items
    const selectedItems = cart.items.filter(item => item.isSelected === true);
    
    if (selectedItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items selected for order'
      });
    }

    // Get delivery price from the first product
    const deliveryPrice = selectedItems[0].product.deliveryPrice || 0;
    
    console.log('Order creation details:', {
      selectedItems: selectedItems.length,
      firstProduct: selectedItems[0].product._id,
      deliveryPrice,
      useReferralCoins
    });

    // Calculate amounts
    const subtotal = selectedItems.reduce((total, item) => 
      total + (item.price * item.quantity), 0);
    
    const totalAmount = subtotal;
    let finalAmount = totalAmount + deliveryPrice;
    let referralDiscount = 0;
    let coinsUsed = 0;

    // Apply referral discount if requested
    if (useReferralCoins) {
      const buyer = await Buyer.findById(req.user.id);
      if (!buyer) {
        throw new Error('Buyer not found');
      }

      console.log('Applying referral discount:', {
        availableCoins: buyer.referralCoins,
        totalAmount
      });

      const maxPossibleDiscount = Math.floor(totalAmount * 0.1); // 10% max discount
      const coinValue = buyer.referralCoins * 0.02;
      referralDiscount = Math.min(maxPossibleDiscount, coinValue);
      coinsUsed = Math.ceil(referralDiscount / 0.02);

      console.log('Calculated discount:', {
        maxPossibleDiscount,
        coinValue,
        referralDiscount,
        coinsUsed,
        currency: 'PKR'
      });

      finalAmount = totalAmount + deliveryPrice - referralDiscount;

      // Update buyer's coins
      buyer.referralCoins -= coinsUsed;
      await buyer.save();
    }

    // Create order with selected items
    const orderItems = selectedItems.map(item => ({
      product: item.product._id,
      quantity: item.quantity,
      price: item.price,
      selectedColor: item.selectedColor ? {
        name: item.selectedColor.name,
        media: item.selectedColor.media
      } : null
    }));

    console.log('Creating order with items:', orderItems);

    const order = new Order({
      buyer: req.user.id,
      seller: selectedItems[0].product.seller,
      items: orderItems,
      shippingAddress: {
        firstName,
        lastName,
        email,
        phone,
        address,
        city,
      },
      paymentMethod,
      paymentDetails: {
        ...paymentDetails,
        status: paymentMethod === 'cod' ? 'pending' : 'completed'
      },
      totalAmount,
      deliveryPrice,
      referralDiscount,
      coinsUsed,
      finalAmount,
      coinValueUsed: 0.02
    });

    await order.save();

    console.log('Order created successfully:', {
      orderId: order._id,
      orderNumber: order.orderId
    });

    // Return both the MongoDB _id and the formatted orderId
    res.json({
      success: true,
      message: 'Order created successfully',
      orderId: order._id, // MongoDB ID
      orderNumber: order.orderId, // Formatted order number (ORD-YYYYMMDD-XXXX)
      redirectUrl: `/order-confirmation/${order._id}`
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user.id })
      .populate({
        path: 'items.product',
        select: 'name media price salePrice'
      })
      .sort({ createdAt: -1 });

    const transformedOrders = orders.map(order => ({
      ...order.toObject(),
      items: order.items.map(item => ({
        ...item,
        productName: `${item.product.name}${item.selectedColor ? ` (${item.selectedColor.name})` : ''}`,
        imageUrl: item.selectedColor?.media?.url || item.product.media[0]?.url
      }))
    }));

    res.json({
      success: true,
      orders: transformedOrders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate({
        path: 'items.product',
        select: 'name price media',
        model: 'Product'
      })
      .populate('buyer', 'name email')
      .populate('seller', 'name');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify user has access to this order (either buyer or seller)
    if (order.buyer._id.toString() !== req.user.id && 
        order.seller._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Transform the order data to include image URLs and proper amounts
    const transformedOrder = {
      ...order.toObject(),
      items: order.items.map(item => ({
        ...item,
        product: {
          ...item.product,
          imageUrl: item.product.media?.[0]?.url || null
        }
      })),
      // Add these fields explicitly to ensure they're included
      totalAmount: order.totalAmount,
      referralDiscount: order.referralDiscount,
      finalAmount: order.finalAmount,
      coinsUsed: order.coinsUsed,
      payableAmount: order.finalAmount // Add this to explicitly show final payable amount
    };

    console.log('Order details:', {
      orderId: order._id,
      originalAmount: order.totalAmount,
      discount: order.referralDiscount,
      finalAmount: order.finalAmount,
      coinsUsed: order.coinsUsed
    });

    res.json({
      success: true,
      order: transformedOrder,
      message: order.coinsUsed > 0 ? 
        `Original amount: ₹${order.totalAmount.toFixed(2)}, Used ${order.coinsUsed} coins for ₹${order.referralDiscount.toFixed(2)} discount. Final amount: ₹${order.finalAmount.toFixed(2)}` : 
        `Amount: ₹${order.totalAmount.toFixed(2)}`
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message
    });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    console.log('Cancelling order:', req.params.id);
    
    const order = await Order.findById(req.params.id)
      .populate('buyer', 'name')
      .populate('seller', 'name');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify user owns this order
    if (order.buyer._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update order
    order.status = 'cancelled';
    order.cancelReason = req.body.cancelReason || 'Customer requested cancellation';
    
    // Create notifications before saving order
    try {
      console.log('Creating cancellation notifications');
      await createOrderCancellationNotification(order, order.buyer.name);
      
      // Also notify the seller
      await createNotification(
        [order.seller._id],
        'ORDER_CANCELLED',
        'Order Cancelled',
        `Order #${order.orderId} has been cancelled by ${order.buyer.name}`,
        {
          orderId: order._id,
          buyerId: order.buyer._id,
          orderStatus: 'cancelled',
          orderNumber: order.orderId,
          cancelReason: order.cancelReason
        }
      );
    } catch (notificationError) {
      console.error('Notification error:', notificationError);
    }

    await order.save();

    // Restore product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity }
      });
    }

    console.log('Order cancelled successfully');
    res.json({
      success: true,
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling order',
      error: error.message
    });
  }
};

exports.getAdminOrders = async (req, res) => {
  try {
    const { 
      status, 
      search, 
      sort = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 20
    } = req.query;
    
    // Build query
    let query = { seller: req.user.id };
    
    if (status && status !== 'all') {
      query.status = status;
    }

    // Add search functionality
    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { 'shippingAddress.firstName': { $regex: search, $options: 'i' } },
        { 'shippingAddress.lastName': { $regex: search, $options: 'i' } },
        { 'shippingAddress.city': { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count for pagination
    const total = await Order.countDocuments(query);

    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    // Execute query with pagination and sorting
    const orders = await Order.find(query)
      .populate({
        path: 'items.product',
        select: 'name price media status',
        match: { status: { $ne: null } } // Only populate products that exist
      })
      .populate('buyer', 'name email phoneNumber')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    // Safely transform orders with null check
    const transformedOrders = orders.map(order => {
      const orderObj = order.toObject();
      return {
        ...orderObj,
        items: orderObj.items.map(item => {
          // Handle case where product might be null or deleted
          if (!item.product) {
            return {
              ...item,
              product: {
                name: 'Product Unavailable',
                price: item.price,
                imageUrl: null
              }
            };
          }

          // Safely get image URL
          const imageUrl = item.product.media && 
                         Array.isArray(item.product.media) && 
                         item.product.media.length > 0
            ? item.product.media.find(m => m.type === 'image')?.url
            : null;

          return {
            ...item,
            product: {
              ...item.product,
              imageUrl
            }
          };
        })
      };
    });

    res.json({
      success: true,
      orders: transformedOrders,
      total,
      totalPages: Math.ceil(total / parseInt(limit))
    });

  } catch (error) {
    console.error('Error in getAdminOrders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin orders',
      error: error.message
    });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id)
      .populate('buyer', 'name referredBy')
      .populate('seller', 'name');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify user has permission to update this order
    if (order.seller._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const previousStatus = order.status;
    order.status = status;
    await order.save();

    // Get status message based on the status
    let statusMessage;
    switch (status) {
      case 'processing':
        statusMessage = 'is being processed';
        break;
      case 'shipped':
        statusMessage = 'has been shipped';
        break;
      case 'delivered':
        statusMessage = 'has been delivered';
        break;
      case 'cancelled':
        statusMessage = 'has been cancelled';
        break;
      default:
        statusMessage = `status updated to ${status}`;
    }

    // Send order status notification to buyer with proper orderId
    await createNotification(
      [order.buyer._id],
      'ORDER_STATUS',
      'Order Status Updated',
      `Order #${order.orderId} ${statusMessage}`,
      {
        orderId: order.orderId, // Using the actual order ID (ORD-YYYYMMDD-XXXX format)
        status: status,
        previousStatus: previousStatus
      }
    );

    // Process referral reward if needed
    if (status === 'delivered' && previousStatus !== 'delivered') {
      try {
        const buyer = await Buyer.findById(order.buyer._id).populate('referredBy');
        
        if (buyer && buyer.referredBy) {
          console.log('Processing referral reward for order:', order._id);
          
          // Calculate 5% of order amount as coins
          const rewardCoins = Math.floor(order.totalAmount * 0.02);
          console.log('Calculated reward coins:', rewardCoins);
          
          // Update referrer's coins and history
          await Buyer.findByIdAndUpdate(buyer.referredBy._id, {
            $inc: { referralCoins: rewardCoins },
            $push: {
              referralHistory: {
                referredUser: buyer._id,
                coinsEarned: rewardCoins,
                orderAmount: order.totalAmount,
                createdAt: new Date()
              }
            }
          });

          // Create notification for referrer about earned coins
          await createNotification(
            [buyer.referredBy._id],
            'REWARD_EARNED',
            'Referral Reward Earned',
            `You earned ${rewardCoins} coins from ${buyer.name}'s purchase!`,
            {
              coins: rewardCoins,
              orderId: order._id,
              referredUser: buyer.name
            }
          );
        }
      } catch (rewardError) {
        console.error('Error processing referral reward:', rewardError);
      }
    }

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: error.message
    });
  }
};

exports.calculateReferralDiscount = async (req, res) => {
  try {
    const { totalAmount } = req.body;
    const buyer = await Buyer.findById(req.user.id);
    
    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer not found'
      });
    }

    const availableCoins = buyer.referralCoins;
    const maxPossibleDiscount = Math.floor(totalAmount * 0.1); // 10% max discount
    
    // Convert coins to PKR (2 PKR per coin)
    const coinValue = availableCoins * 0.02;
    
    // Final discount is the lesser of maxPossibleDiscount and coinValue
    const finalDiscount = Math.min(maxPossibleDiscount, coinValue);

    console.log('Referral Discount Calculation:', {
      buyerId: buyer._id,
      availableCoins,
      totalAmount,
      maxPossibleDiscount,
      coinValue,
      finalDiscount,
      currency: 'PKR'
    });

    res.json({
      success: true,
      availableCoins,
      maxDiscount: finalDiscount,
      maxDiscountPercentage: 10,
      totalAmount,
      finalAmount: totalAmount - finalDiscount,
      coinValue: 0.02 // Value per coin in rupees
    });
  } catch (error) {
    console.error('Error calculating referral discount:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating referral discount',
      error: error.message
    });
  }
};

exports.getOrderConfirmation = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate({
        path: 'items.product',
        select: 'name images'
      });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Calculate totals
    const productSubtotal = order.items.reduce((total, item) => 
      total + (item.price * item.quantity), 0);
    
    const deliveryPrice = order.deliveryPrice || 0;
    const totalBeforeDiscount = productSubtotal + deliveryPrice;
    const referralDiscount = order.referralDiscount || 0;
    const finalAmount = order.finalAmount;

    const orderConfirmation = {
      orderId: order.orderId,
      items: order.items.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.price,
        images: item.product.images
      })),
      amounts: {
        productSubtotal,
        deliveryPrice,
        totalBeforeDiscount,
        referralDiscount,
        finalAmount
      },
      shippingAddress: order.shippingAddress,
      paymentMethod: order.paymentMethod,
      status: order.status,
      createdAt: order.createdAt
    };

    console.log('Sending order confirmation:', orderConfirmation);

    res.json({
      success: true,
      orderConfirmation
    });

  } catch (error) {
    console.error('Error in getOrderConfirmation:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order confirmation',
      error: error.message
    });
  }
};

// Add new endpoint to get saved addresses
exports.getSavedAddresses = async (req, res) => {
  try {
    const buyer = await Buyer.findById(req.user.id);
    const addresses = buyer.savedAddresses || [];
    
    // Sort by most recent first and get the latest address
    const latestAddress = addresses.sort((a, b) => b.createdAt - a.createdAt)[0];

    res.json({
      success: true,
      address: latestAddress // Return only the latest address
    });
  } catch (error) {
    console.error('Error fetching saved addresses:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching saved addresses',
      error: error.message
    });
  }
};

// Add this new function for direct purchase
exports.createDirectOrder = async (req, res) => {
  try {
    const {
      productId,
      quantity = 1,
      selectedColor,
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      paymentMethod,
      paymentDetails,
      useReferralCoins = false
    } = req.body;

    // Save the address to the buyer's profile
    await Buyer.findByIdAndUpdate(req.user.id, {
      $push: {
        savedAddresses: {
          firstName,
          lastName,
          email,
          phone,
          address,
          city,
          createdAt: new Date()
        }
      }
    });

    console.log('Creating direct order with params:', { 
      productId,
      quantity,
      selectedColor,
      paymentMethod, 
      useReferralCoins,
      userId: req.user.id 
    });

    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check stock availability
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

    // Get delivery price
    const deliveryPrice = product.deliveryPrice || 0;
    
    // Calculate amounts
    const price = product.salePrice || product.price;
    const subtotal = price * quantity;
    const totalAmount = subtotal;
    let finalAmount = totalAmount + deliveryPrice;
    let referralDiscount = 0;
    let coinsUsed = 0;

    // Apply referral discount if requested
    if (useReferralCoins) {
      const buyer = await Buyer.findById(req.user.id);
      if (!buyer) {
        throw new Error('Buyer not found');
      }

      console.log('Applying referral discount:', {
        availableCoins: buyer.referralCoins,
        totalAmount
      });

      const maxPossibleDiscount = Math.floor(totalAmount * 0.1); // 10% max discount
      const coinValue = buyer.referralCoins * 0.02;
      referralDiscount = Math.min(maxPossibleDiscount, coinValue);
      coinsUsed = Math.ceil(referralDiscount / 0.02);

      console.log('Calculated discount:', {
        maxPossibleDiscount,
        coinValue,
        referralDiscount,
        coinsUsed,
        currency: 'PKR'
      });

      finalAmount = totalAmount + deliveryPrice - referralDiscount;

      // Update buyer's coins
      buyer.referralCoins -= coinsUsed;
      await buyer.save();
    }

    // Create order item
    const orderItem = {
      product: product._id,
      quantity,
      price,
      selectedColor: colorData
    };

    console.log('Creating order with item:', orderItem);

    // Create the order
    const order = new Order({
      buyer: req.user.id,
      seller: product.seller,
      items: [orderItem],
      shippingAddress: {
        firstName,
        lastName,
        email,
        phone,
        address,
        city,
      },
      paymentMethod,
      paymentDetails: {
        ...paymentDetails,
        status: paymentMethod === 'cod' ? 'pending' : 'completed'
      },
      totalAmount,
      deliveryPrice,
      referralDiscount,
      coinsUsed,
      finalAmount,
      coinValueUsed: 0.02
    });

    await order.save();

    // Create notification for the seller
    try {
      await createNotification({
        recipient: product.seller,
        type: 'NEW_ORDER',
        title: 'New Order Received',
        message: `You have received a new order for ${product.name}`,
        data: {
          orderId: order._id
        }
      });
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
    }

    console.log('Direct order created successfully:', {
      orderId: order._id,
      orderNumber: order.orderId
    });

    // Return both the MongoDB _id and the formatted orderId
    res.json({
      success: true,
      message: 'Order created successfully',
      orderId: order._id, // MongoDB ID
      orderNumber: order.orderId, // Formatted order number (ORD-YYYYMMDD-XXXX)
      redirectUrl: `/order-confirmation/${order._id}`
    });

  } catch (error) {
    console.error('Create direct order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating direct order',
      error: error.message
    });
  }
};