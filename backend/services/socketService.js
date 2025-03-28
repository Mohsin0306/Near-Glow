const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

let io;
const connectedUsers = new Map(); // Track connected users

const initializeSocket = (server, allowedOrigins) => {
  io = socketIO(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"]
    },
    transports: ['websocket', 'polling']
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('authenticate', (userId) => {
      if (socket.userId === userId) {
        connectedUsers.set(userId, socket.id);
        socket.join(`user_${userId}`);
        console.log(`User ${userId} authenticated on socket ${socket.id}`);
      }
    });

    socket.on('disconnect', () => {
      if (socket.userId) {
        connectedUsers.delete(socket.userId);
      }
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

const sendPushNotification = async (userId, notification) => {
  try {
    const subscriptions = await PushSubscription.find({ userId });
    
    const pushPromises = subscriptions.map(async ({ subscription }) => {
      try {
        await webpush.sendNotification(subscription, JSON.stringify(notification));
      } catch (error) {
        console.error('Error sending push notification:', error);
        if (error.statusCode === 410) {
          // Subscription has expired or is no longer valid
          await PushSubscription.deleteOne({ subscription });
        }
      }
    });

    await Promise.all(pushPromises);
  } catch (error) {
    console.error('Error in sendPushNotification:', error);
  }
};

const getNotificationContent = (notification) => {
  const { type, data } = notification;
  let title, message, icon;

  switch (type) {
    case 'ORDER_STATUS':
      switch (data?.status) {
        case 'processing':
          title = 'Order Processing';
          message = `Order #${data.orderId} is being processed`;
          icon = '🔄';
          break;
        case 'shipped':
          title = 'Order Shipped';
          message = `Order #${data.orderId} has been shipped`;
          icon = '🚚';
          break;
        case 'delivered':
          title = 'Order Delivered';
          message = `Order #${data.orderId} has been delivered`;
          icon = '📦';
          break;
        case 'cancelled':
          title = 'Order Cancelled';
          message = `Order #${data.orderId} has been cancelled`;
          icon = '❌';
          break;
        default:
          title = 'Order Update';
          message = `Order #${data.orderId} status updated to ${data.status}`;
          icon = '📋';
      }
      break;

    case 'PRICE_DROP':
      title = 'Price Drop Alert! 🏷️';
      message = `${data.productName} is now ${data.newPrice}! Save ${data.savings}`;
      icon = '💰';
      break;

    case 'STOCK_UPDATE':
      title = 'Back in Stock';
      message = `${data.productName} is now available!`;
      icon = '✨';
      break;

    case 'NEW_ORDER':
      title = 'New Order Received';
      message = `Order #${data.orderId} has been placed`;
      icon = '🛍️';
      break;

    case 'PRODUCT_UPDATE':
      title = 'Product Updated';
      message = `${data.productName} has been updated`;
      icon = '📝';
      break;

    case 'ADMIN_MESSAGE':
      title = 'Message from Admin';
      message = notification.message;
      icon = '👋';
      break;

    default:
      title = notification.title;
      message = notification.message;
      icon = '🔔';
  }

  return {
    title: `${icon} ${title}`,
    message,
    type,
    data
  };
};

const emitNotification = async (recipientId, notification, senderId) => {
  if (!io) {
    console.log('Socket.io not initialized');
    return;
  }

  const notificationContent = getNotificationContent(notification);
  
  const notificationData = {
    ...notification,
    ...notificationContent,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    senderId,
    timestamp: new Date().toISOString(),
    priority: notification.type === 'NEW_ORDER' ? 'high' : 'default'
  };

  // Check if user is connected via socket
  const isUserConnected = io.sockets.adapter.rooms.has(`user_${recipientId}`);

  if (isUserConnected) {
    // If user is connected, send via socket only
    io.to(`user_${recipientId}`).emit('notification', notificationData);
  } else {
    // If user is not connected, send push notification only
    try {
      await sendPushNotification(recipientId, notificationData);
    } catch (error) {
      console.error('Push notification error:', error);
    }
  }
};

const emitNotificationToAll = async (notification, senderId) => {
  if (!io) return;

  const notificationData = {
    ...notification,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    senderId,
    timestamp: new Date().toISOString()
  };

  // Get all connected sockets except sender
  const sockets = Array.from(io.sockets.sockets.values())
    .filter(socket => socket.userId !== senderId);

  // Emit to all connected users except sender
  sockets.forEach(socket => {
    console.log(`Emitting notification to user ${socket.userId}`);
    socket.emit('notification', notificationData);
  });

  // Send push notifications to all except sender
  try {
    const subscriptions = await PushSubscription.find({ userId: { $ne: senderId } });
    for (const sub of subscriptions) {
      await sendPushNotification(sub.userId, notificationData);
    }
  } catch (error) {
    console.error('Error sending notifications to all:', error);
  }
};

module.exports = {
  initializeSocket,
  emitNotification,
  emitNotificationToAll
}; 