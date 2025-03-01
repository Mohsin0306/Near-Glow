// Force service worker to activate immediately
self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

// Preload notification sound
const notificationSound = new Audio('/sounds/notification.wav');
notificationSound.volume = 1.0;

self.addEventListener('push', async function(event) {
  if (!event.data) return;

  const notification = event.data.json();
  
  const options = {
    body: notification.message,
    icon: '/icons/notification-icon.png',
    badge: '/icons/badge-icon.png',
    tag: notification._id,
    vibrate: [200, 100, 200, 100, 200, 100, 200],
    renotify: true,
    requireInteraction: true,
    data: notification,
    actions: [
      {
        action: 'open',
        title: 'Open'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ],
    // Add Android specific options
    android: {
      priority: 'high',
      importance: 'high',
      visibility: 'public',
      channelId: 'perfume-store-notifications'
    }
  };

  event.waitUntil(
    self.registration.showNotification(notification.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  const notification = event.notification.data;
  let url = '/';
  
  if (event.action === 'open' || !event.action) {
    switch (notification.type) {
      case 'ORDER_CANCELLED':
        url = `/admin/orders/${notification.data.orderId}`;
        break;
      case 'ORDER_STATUS':
        url = `/alerts/orders/${notification.data.orderId}`;
        break;
      case 'PRICE_DROP':
      case 'STOCK_UPDATE':
      case 'NEW_PRODUCT':
        url = `/products/${notification.data.productId}`;
        break;
      default:
        url = '/alerts/notifications';
    }

    event.waitUntil(
      clients.openWindow(url)
    );
  }
}); 