// Force service worker to activate immediately
self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

// Preload notification sound
// const notificationSound = new Audio('/sounds/notification.wav');
// notificationSound.volume = 1.0;

self.addEventListener('push', async function(event) {
  if (!event.data) return;

  try {
    const notification = event.data.json();
    
    // Set notification message for order status and new orders
    if (notification.type === 'NEW_ORDER') {
      notification.title = '🛍️ New Order Received';
      notification.message = `Order #${notification.data.orderId} has been placed successfully!`;
    } else if (notification.type === 'ORDER_STATUS') {
      switch (notification.data?.status) {
        case 'pending':
          notification.title = '🛍️ Order Placed';
          notification.message = `Order #${notification.data.orderId} has been placed successfully!`;
          break;
        case 'processing':
          notification.title = '🔄 Order Processing';
          notification.message = `Order #${notification.data.orderId} is being processed`;
          break;
        case 'shipped':
          notification.title = '🚚 Order Shipped';
          notification.message = `Order #${notification.data.orderId} has been shipped`;
          break;
        case 'delivered':
          notification.title = '📦 Order Delivered';
          notification.message = `Order #${notification.data.orderId} has been delivered`;
          break;
        case 'cancelled':
          notification.title = '❌ Order Cancelled';
          notification.message = `Order #${notification.data.orderId} has been cancelled`;
          break;
        default:
          notification.title = '🛍️ Order Update';
          notification.message = `Order #${notification.data.orderId} has been placed successfully!`;
      }
    }

    // Check for existing notifications
    const existingNotifications = await self.registration.getNotifications({
      tag: notification.id
    });

    if (existingNotifications.length > 0) {
      return;
    }

    // Set notification options
    const options = {
      body: notification.message,
      icon: '/images/fav.png',
      badge: '/images/fav.png',
      tag: notification.id || Date.now().toString(),
      vibrate: [200, 100, 200],
      renotify: false,
      requireInteraction: true,
      data: notification,
      actions: [
        {
          action: 'open',
          title: 'View Order'
        },
        {
          action: 'close',
          title: 'Dismiss'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(
        notification.title,
        options
      )
    );

  } catch (error) {
    console.error('Push event handling error:', error);
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const notification = event.notification.data;
  const rootUrl = self.registration.scope;
  
  // Ensure we have userId
  const userId = notification.userId || notification.recipientId;
  if (!userId) {
    console.error('No userId found in notification data:', notification);
    return;
  }

  let url = rootUrl;

  if (event.action === 'open' || !event.action) {
    // Determine the URL based on user role and notification type
    if (notification.isAdmin || notification.userRole === 'admin') {
      url = `${rootUrl}${userId}/admin/notifications/${notification._id}`;
    } else {
      switch (notification.type) {
        case 'ORDER_CANCELLED':
        case 'ORDER_STATUS':
        case 'NEW_ORDER':
          url = `${rootUrl}${userId}/alerts/orders/${notification.data?.orderId || ''}`;
          break;
        case 'PRICE_DROP':
        case 'STOCK_UPDATE':
        case 'NEW_PRODUCT':
        case 'PRODUCT_UPDATE':
        case 'PRICE_UPDATE':
          url = `${rootUrl}${userId}/products/${notification.data?.productId || ''}`;
          break;
        case 'ADMIN_MESSAGE':
          url = `${rootUrl}${userId}/notifications/${notification._id}`;
          break;
        default:
          url = `${rootUrl}${userId}/notifications/${notification._id}`;
      }
    }

    // Add query parameter to mark as read
    url = `${url}?read=true`;

    // Log the URL for debugging
    console.log('Opening URL:', url);

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(windowClients => {
          // Check if there's already a window with the target URL
          for (let client of windowClients) {
            if (client.url === url && 'focus' in client) {
              return client.focus();
            }
          }
          // If no existing window, open a new one
          return clients.openWindow(url);
        })
    );
  }
});

// Handle notification close
self.addEventListener('notificationclose', function(event) {
  console.log('Notification was closed', event.notification.data);
}); 