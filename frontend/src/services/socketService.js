import io from 'socket.io-client';
import { toast } from 'react-hot-toast';
import { RiNotification3Line, RiCloseLine } from 'react-icons/ri';

const SOCKET_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.notificationCallbacks = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.notificationSound = new Audio('/sounds/notification.wav');
    this.notificationSound.volume = 1.0;
    this.hasRequestedPermission = false;
    this.vapidPublicKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
  }

  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  async requestMobileNotificationPermission() {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (!isMobile) return this.requestNotificationPermission();

    try {
      // First request notification permission
      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return false;
      }

      // Then register service worker if not already registered
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        
        // Request push subscription using environment variable
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
        });

        // Send subscription to backend
        await this.sendSubscriptionToBackend(subscription);
        return true;
      }
    } catch (error) {
      console.error('Error setting up notifications:', error);
      return false;
    }
    return false;
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
      
      await this.sendSubscriptionToBackend(subscription);
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
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/push-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ subscription })
      });
      return response.ok;
    } catch (error) {
      console.error('Error sending subscription to backend:', error);
      return false;
    }
  }

  connect(userId, token) {
    if (this.socket?.connected) {
      return this.socket;
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      auth: { token },
      query: { userId }
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.socket.emit('authenticate', userId);
    });

    // Remove any existing listeners before adding new ones
    this.socket.off('notification');
    
    this.socket.on('notification', (notification) => {
      // Add a debounce to prevent multiple rapid notifications
      if (this._lastNotification?.id === notification.id && 
          Date.now() - this._lastNotificationTime < 1000) {
        return;
      }
      
      this._lastNotification = notification;
      this._lastNotificationTime = Date.now();
      
      this.notificationCallbacks.forEach(callback => callback(notification));
      this.playNotificationSound();
      this.showBrowserNotification(notification);
    });

    return this.socket;
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
    if (Notification.permission === 'granted') {
      const notif = new Notification(notification.title, {
        body: notification.message,
        icon: '/logo192.png'
      });

      notif.onclick = () => {
        window.focus();
        window.dispatchEvent(new CustomEvent('notificationClick', { 
          detail: notification 
        }));
      };
    }
  }

  playNotificationSound() {
    this.notificationSound.play().catch(err => console.log('Error playing sound:', err));
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
              <RiNotification3Line className="h-10 w-10 text-blue-500" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">
                {notification.title}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {notification.message}
              </p>
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