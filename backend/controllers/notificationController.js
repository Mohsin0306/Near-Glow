const Notification = require('../models/Notification');
const Buyer = require('../models/Buyer');
const { emitNotification, emitNotificationToAll } = require('../services/socketService');
const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

// Create notification for multiple users
const createNotification = async (notificationData) => {
  try {
    const { recipient, recipients, type, title, message, data } = notificationData;
    
    // Handle both single recipient and multiple recipients
    const notificationRecipients = recipients || (recipient ? [recipient] : []);
    
    // Create notifications for each recipient
    for (const recipientId of notificationRecipients) {
      const notification = new Notification({
        recipient: recipientId,
        type,
        title,
        message,
        data
      });
      
      await notification.save();
      
      // Emit socket event if needed
      if (global.io) {
        global.io.to(recipientId.toString()).emit('notification', {
          type,
          title,
          message,
          data
        });
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error creating notifications:', error);
    throw error;
  }
};

// Get user's notifications
const getUserNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const filter = req.query.filter || 'all';
    const search = req.query.search || '';
    const isAdmin = req.query.isAdmin === 'true';

    // For admin users, we don't need to check buyer preferences
    if (isAdmin) {
      let query = {};

      // Apply filters
      if (filter === 'unread') {
        query.isRead = false;
      }

      // Apply search
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { message: { $regex: search, $options: 'i' } }
        ];
      }

      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('sender', 'name username profilePicture businessDetails')
        .populate('recipient', 'name username profilePicture')
        .lean();

      const formattedNotifications = notifications.map(notification => ({
        _id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
        sender: notification.sender ? {
          ...notification.sender,
          name: notification.sender.businessDetails?.companyName || notification.sender.name
        } : null,
        recipient: notification.recipient,
        data: notification.data
      }));

      return res.json({
        success: true,
        notifications: formattedNotifications,
        page,
        hasMore: notifications.length === limit
      });
    }

    // For regular users, continue with existing logic
    const buyer = await Buyer.findById(req.user.id);
    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer not found'
      });
    }

    // Initialize preferences if they don't exist
    if (!buyer.notificationPreferences) {
      buyer.notificationPreferences = {
        orderUpdates: true,
        promotions: false,
        priceAlerts: true
      };
      await buyer.save();
    }

    let query = { recipient: req.user.id };

    // Apply filters
    if (filter === 'unread') {
      query.isRead = false;
    }

    // Apply search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('sender', 'name username profilePicture')
      .lean();

    const formattedNotifications = notifications.map(notification => ({
      _id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      sender: notification.sender,
      data: notification.data
    }));

    res.json({
      success: true,
      notifications: formattedNotifications,
      page,
      hasMore: notifications.length === limit
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
};

// Helper function to determine notification color
const getNotificationColor = (type) => {
  switch (type) {
    case 'ORDER_STATUS':
    case 'NEW_ORDER':
      return 'blue';
    case 'ADMIN_MESSAGE':
      return 'green';
    case 'ORDER_CANCELLED':
      return 'red';
    default:
      return 'blue';
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    // If not admin, only allow marking own notifications
    if (!req.user.isAdmin) {
      query.recipient = req.user.id;
    }

    const notification = await Notification.findOneAndUpdate(
      query,
      { isRead: true },
      { new: true }
    ).populate('sender', 'name username profilePicture businessDetails')
     .populate('recipient', 'name username profilePicture');

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Format the response
    const formattedNotification = {
      ...notification.toObject(),
      sender: notification.sender ? {
        ...notification.sender.toObject(),
        name: notification.sender.businessDetails?.companyName || notification.sender.name
      } : null,
      recipient: notification.recipient ? {
        ...notification.recipient.toObject(),
        name: notification.recipient.name
      } : null
    };

    res.json({
      success: true,
      notification: formattedNotification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message
    });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    let query = {};
    
    // If not admin, only mark own notifications
    if (!req.user.isAdmin) {
      query.recipient = req.user.id;
    }

    await Notification.updateMany(query, { isRead: true });

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notifications as read',
      error: error.message
    });
  }
};

// Send admin message
const sendAdminMessage = async (req, res) => {
  try {
    const { recipientIds, title, message, type = 'ADMIN_MESSAGE' } = req.body;
    const senderId = req.user.id;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    let recipients;
    if (recipientIds && recipientIds.length > 0) {
      // Send to specific users
      recipients = recipientIds;
    } else {
      // Send to all users except sender
      const buyers = await Buyer.find({ _id: { $ne: senderId } }).select('_id');
      recipients = buyers.map(buyer => buyer._id);
    }

    // Create notifications in the database
    const notifications = await Notification.create(
      recipients.map(recipientId => ({
        recipient: recipientId,
        sender: senderId,
        type,
        title,
        message,
        data: {},
        isRead: false
      }))
    );

    // Emit socket notifications
    for (const notification of notifications) {
      try {
        await emitNotification(
          notification.recipient.toString(),
          {
            _id: notification._id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data: notification.data,
            createdAt: notification.createdAt,
            senderId,
            recipientId: notification.recipient
          }
        );

        // Send push notification if available
        const subscriptions = await PushSubscription.find({
          userId: notification.recipient
        });

        for (const sub of subscriptions) {
          try {
            await webpush.sendNotification(
              sub.subscription,
              JSON.stringify({
                title: notification.title,
                message: notification.message,
                timestamp: Date.now(),
                priority: 'high',
                vibrate: [200, 100, 200]
              })
            );
          } catch (error) {
            if (error.statusCode === 410) {
              await PushSubscription.deleteOne({ _id: sub._id });
            }
          }
        }
      } catch (error) {
        console.error('Error sending notification:', error);
      }
    }

    res.json({
      success: true,
      message: 'Notifications sent successfully',
      notifications
    });
  } catch (error) {
    console.error('Error sending admin message:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending notifications',
      error: error.message
    });
  }
};

// Add this function to create order cancellation notification
const createOrderCancellationNotification = async (order, buyerName) => {
  try {
    console.log('Creating cancellation notification for order:', order._id);
    
    // Create array to hold all notifications
    let notifications = [];

    // 1. Create notification for admin users
    const adminUsers = await Buyer.find({ role: 'admin' }).select('_id');
    if (adminUsers && adminUsers.length > 0) {
      const adminNotifications = await Notification.create(
        adminUsers.map(admin => ({
          recipient: admin._id,
          sender: order.buyer,
          type: 'ORDER_CANCELLED',
          title: 'Order Cancelled',
          message: `Order #${order.orderId} has been cancelled by ${buyerName}`,
          data: {
            orderId: order._id,
            buyerId: order.buyer,
            orderStatus: 'cancelled',
            orderNumber: order.orderId,
            cancelReason: order.cancelReason
          },
          isRead: false
        }))
      );
      notifications = notifications.concat(adminNotifications);
    }

    // 2. Create notification for the buyer
    const buyerNotification = await Notification.create({
      recipient: order.buyer,
      type: 'ORDER_CANCELLED',
      title: 'Order Cancelled',
      message: `Your order #${order.orderId} has been cancelled successfully`,
      data: {
        orderId: order._id,
        orderStatus: 'cancelled',
        orderNumber: order.orderId,
        cancelReason: order.cancelReason
      },
      isRead: false
    });
    notifications.push(buyerNotification);

    // 3. Emit socket notifications to all recipients
    for (const notification of notifications) {
      try {
        await emitNotification(
          notification.recipient.toString(),
          {
            _id: notification._id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data: notification.data,
            createdAt: notification.createdAt,
            senderId: order.buyer,
            recipientId: notification.recipient
          },
          order.buyer.toString()
        );
      } catch (error) {
        console.error('Error emitting notification:', error);
      }
    }

    return notifications;
  } catch (error) {
    console.error('Error in createOrderCancellationNotification:', error);
    throw error;
  }
};

// Get notification by ID
const getNotificationById = async (req, res) => {
  try {
    console.log('Fetching notification with ID:', req.params.id);
    console.log('User ID:', req.user.id);

    const notification = await Notification.findOne({
      _id: req.params.id,
      $or: [
        { recipient: req.user.id },
        { sender: req.user.id }
      ]
    })
    .populate('sender', 'name username profilePicture businessDetails')
    .populate('recipient', 'name username profilePicture');

    console.log('Found notification:', notification);

    if (!notification) {
      console.log('Notification not found');
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Format the sender name based on whether it's a business or regular user
    const formattedNotification = {
      ...notification.toObject(),
      sender: notification.sender ? {
        ...notification.sender.toObject(),
        name: notification.sender.businessDetails?.companyName || notification.sender.name
      } : null,
      recipient: notification.recipient ? {
        ...notification.recipient.toObject(),
        name: notification.recipient.name
      } : null
    };

    // Mark notification as read when viewed
    if (!notification.isRead && notification.recipient.toString() === req.user.id) {
      await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    }

    console.log('Sending formatted notification:', formattedNotification);

    res.json({
      success: true,
      notification: formattedNotification
    });
  } catch (error) {
    console.error('Error fetching notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notification details',
      error: error.message
    });
  }
};

// Get notification preferences
const getNotificationPreferences = async (req, res) => {
  try {
    const buyer = await Buyer.findById(req.user.id);
    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer not found'
      });
    }

    // Get or initialize preferences
    const preferences = {
      orderUpdates: buyer.notificationPreferences?.orderUpdates ?? true,
      promotions: buyer.notificationPreferences?.promotions ?? false,
      priceAlerts: buyer.notificationPreferences?.priceAlerts ?? true
    };

    res.json({
      success: true,
      preferences
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching notification preferences',
      error: error.message
    });
  }
};

// Update notification preferences
const updateNotificationPreferences = async (req, res) => {
  try {
    const { type, enabled } = req.body;

    // Validate the notification type
    if (!['orderUpdates', 'promotions', 'priceAlerts'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification type'
      });
    }

    const buyer = await Buyer.findById(req.user.id);
    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer not found'
      });
    }

    // Initialize preferences if they don't exist
    if (!buyer.notificationPreferences) {
      buyer.notificationPreferences = {
        orderUpdates: true,
        promotions: false,
        priceAlerts: true
      };
    }

    // Update the specific preference
    buyer.notificationPreferences[type] = enabled;

    await buyer.save();

    // Return all preferences
    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      preferences: buyer.notificationPreferences
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notification preferences',
      error: error.message
    });
  }
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  sendAdminMessage,
  createOrderCancellationNotification,
  getNotificationById,
  getNotificationPreferences,
  updateNotificationPreferences
}; 