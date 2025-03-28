import io from 'socket.io-client';
import { toast } from 'react-hot-toast';
import { RiNotification3Line, RiCloseLine, RiShoppingBag3Line } from 'react-icons/ri';

const SOCKET_URL = process.env.REACT_APP_BACKEND_URL || 'http://192.168.100.17:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.notificationCallbacks = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.notificationSound = null;
    this.audioContext = null;
    this.audioBuffer = null;
    this.hasRequestedPermission = false;
    this.vapidPublicKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
    this.audio = new Audio('/sounds/notification.wav');
    this.audio.preload = 'auto';
  }

  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    try {
      // Register service worker first
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/'
        });
        console.log('ServiceWorker registration successful:', registration);
      }

      // Then request permission
      if (Notification.permission === 'granted') {
        return true;
      }

      if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          // After permission is granted, register push subscription
          await this.registerPushSubscription();
          return true;
        }
      }
    } catch (error) {
      console.error('Error in requestNotificationPermission:', error);
    }
    return false;
  }

  async requestMobileNotificationPermission() {
    try {
      // Request notification permission first
      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return false;
      }

      // Register service worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/'
        });

        // Add message listener for sound
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'PLAY_NOTIFICATION_SOUND') {
            this.playNotificationSound();
          }
        });

        // Subscribe to push notifications
        const subscribeOptions = {
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
        };

        let subscription = await registration.pushManager.getSubscription();
        
        if (!subscription) {
          subscription = await registration.pushManager.subscribe(subscribeOptions);
        }

        // Send subscription to backend
        await this.sendSubscriptionToBackend(subscription);
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error setting up mobile notifications:', error);
      return false;
    }
  }

  async registerPushSubscription() {
    try {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
        });
      }
      
      // Send the subscription to the backend
      const success = await this.sendSubscriptionToBackend(subscription);
      if (!success) {
        throw new Error('Failed to send subscription to backend');
      }
      
      return true;
    } catch (error) {
      console.error('Error registering push subscription:', error);
      return false;
    }
  }

  // Helper function to convert VAPID key
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async sendSubscriptionToBackend(subscription) {
    try {
      // Fix the API URL construction
      const baseUrl = process.env.NODE_ENV === 'production'
        ? window.location.origin
        : process.env.REACT_APP_API_URL || 'http://localhost:5000';

      const apiUrl = `${baseUrl}/api/push-subscription`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ subscription }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error sending subscription to backend:', error);
      return false;
    }
  }

  async initializeAudio() {
    try {
      // Create both audio methods for fallback
      this.audio = new Audio('/sounds/notification.wav');
      this.audio.preload = 'auto';
      
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const response = await fetch('/sounds/notification.wav');
      const arrayBuffer = await response.arrayBuffer();
      this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.error('Error initializing audio:', error);
    }
  }

  async playNotificationSound() {
    try {
      // Try multiple sound playing methods
      const methods = [
        // Method 1: HTML5 Audio
        async () => {
          const audio = new Audio('/sounds/notification.wav');
          audio.volume = 1.0;
          await audio.play();
        },
        // Method 2: AudioContext
        async () => {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const response = await fetch('/sounds/notification.wav');
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContext.destination);
          source.start(0);
        },
        // Method 3: Vibration
        async () => {
          if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
          }
        }
      ];

      // Try each method until one works
      for (const method of methods) {
        try {
          await method();
          break; // Stop if successful
        } catch (error) {
          console.error('Sound method failed:', error);
          continue; // Try next method
        }
      }
    } catch (error) {
      console.error('All sound methods failed:', error);
    }
  }

  async initializeAdminNotifications() {
    if (!this.socket) return;

    this.socket.on('adminNotification', async (notification) => {
      console.log('Received admin notification:', notification);
      
      // Play notification sound
      if (this.audio) {
        try {
          await this.audio.play();
        } catch (error) {
          console.error('Error playing notification sound:', error);
        }
      }

      // Show push notification if permission is granted
      if (Notification.permission === 'granted') {
        try {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification(notification.title, {
            body: notification.message,
            icon: '/logo192.png',
            badge: '/logo192.png',
            tag: notification._id,
            data: notification,
            vibrate: [200, 100, 200],
            requireInteraction: true
          });
        } catch (error) {
          console.error('Error showing push notification:', error);
        }
      }

      // Show toast notification
      this.showToastNotification(notification);

      // Notify all callbacks
      this.notificationCallbacks.forEach(callback => callback(notification));
    });
  }

  async connect(userId, userRole) {
    try {
      if (this.socket?.connected) return;

      this.socket = io(SOCKET_URL, {
        auth: {
          userId,
          userRole
        }
      });

      this.socket.on('connect', () => {
        console.log('Socket connected');
        if (userRole === 'admin') {
          this.initializeAdminNotifications();
        }
      });

      // Initialize audio when connecting
      this.initializeAudio();
      
      // Add message listener for sound playback
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'PLAY_NOTIFICATION_SOUND') {
          this.playNotificationSound();
        }
      });

      this.setupSocketListeners(userId);
    } catch (error) {
      console.error('Socket connection error:', error);
    }
  }

  setupSocketListeners(userId) {
    this.socket.on('connect', async () => {
      console.log('Connected to socket server');
      this.socket.emit('authenticate', userId);
      
      // Request permissions on connect for mobile
      if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        await this.requestMobileNotificationPermission();
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
    });

    this.socket.on('reconnect_attempt', () => {
      this.reconnectAttempts++;
      console.log(`Reconnection attempt ${this.reconnectAttempts}`);
    });
  }

  async showBrowserNotification(notification) {
    try {
      if (Notification.permission !== 'granted') {
        await this.requestNotificationPermission();
      }

      if (Notification.permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        
        // Add isAdmin flag to notification data
        const notificationData = {
          ...notification,
          isAdmin: notification.userRole === 'admin' // or however you determine admin status
        };

        await registration.showNotification(notification.title, {
          body: notification.message,
          icon: '/images/fav.png',
          badge: '/images/fav.png',
          tag: notification.id || Date.now().toString(),
          requireInteraction: true,
          vibrate: [200, 100, 200],
          data: notificationData, // Pass the enhanced notification data
          actions: [
            {
              action: 'open',
              title: 'View'
            },
            {
              action: 'close',
              title: 'Dismiss'
            }
          ]
        });
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  async handleNotificationClick(notification) {
    try {
      // Get service worker registration first
      const registration = await navigator.serviceWorker.ready;
      
      // Close any existing notification
      if (notification.tag) {
        const notifications = await registration.getNotifications({ tag: notification.tag });
        notifications.forEach(n => n.close());
      }

      // Determine the correct URL based on notification type and data
      let url;
      const userId = notification.userId || notification.recipientId;

      if (!userId) {
        console.error('No userId found in notification:', notification);
        return;
      }

      if (notification.userRole === 'admin') {
        url = `/${userId}/admin/notifications/${notification._id}`;
      } else {
        switch (notification.type) {
          case 'ORDER_CANCELLED':
          case 'ORDER_STATUS':
          case 'NEW_ORDER':
            url = `/${userId}/orders/${notification.data?.orderId}`;
            break;
          case 'PRICE_DROP':
          case 'STOCK_UPDATE':
          case 'NEW_PRODUCT':
          case 'PRODUCT_UPDATE':
          case 'PRICE_UPDATE':
            url = `/${userId}/products/${notification.data?.productId}`;
            break;
          case 'ADMIN_MESSAGE':
            url = `/${userId}/notifications/${notification._id}`;
            break;
          default:
            url = `/${userId}/notifications/${notification._id}`;
        }
      }

      // Add query parameter to mark as read
      url = `${url}?read=true`;

      // Log for debugging
      console.log('Navigating to:', url, 'Notification:', notification);

      // Navigate to the URL
      window.location.href = url;

    } catch (error) {
      console.error('Error handling notification click:', error);
      // Fallback navigation if service worker isn't available
      const userId = notification.userId || notification.recipientId;
      const url = notification.userRole === 'admin' 
        ? `/${userId}/admin/notifications/${notification._id}`
        : `/${userId}/notifications/${notification._id}`;
      window.location.href = `${url}?read=true`;
    }
  }

  onNotification(callback) {
    this.notificationCallbacks.add(callback);
    return () => this.notificationCallbacks.delete(callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  showToastNotification(notification) {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 cursor-pointer`}
        onClick={() => {
          this.handleNotificationClick(notification);
          toast.dismiss(t.id);
        }}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              {notification.type === 'NEW_ORDER' ? (
                <RiShoppingBag3Line className="h-10 w-10 text-green-500" />
              ) : (
                <RiNotification3Line className="h-10 w-10 text-blue-500" />
              )}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">
                {notification.title}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {notification.message}
              </p>
              {notification.type === 'NEW_ORDER' && (
                <p className="mt-1 text-xs text-green-600">
                  New order received! Click to view details.
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toast.dismiss(t.id);
            }}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none"
          >
            <RiCloseLine className="w-5 h-5" />
          </button>
        </div>
      </div>
    ), {
      duration: 5000,
      position: 'top-right',
    });
  }
}

export default new SocketService(); 