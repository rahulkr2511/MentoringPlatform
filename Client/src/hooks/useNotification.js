import { useState, useCallback, useEffect, useRef } from 'react';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../services/notificationService';

const BROADCAST_CHANNEL_NAME = 'mp-notifications';

const useNotification = () => {
  // Toast notifications
  const [notifications, setNotifications] = useState([]);
  // System (server) notifications
  const [systemNotifications, setSystemNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const broadcastChannelRef = useRef(null);

  const showNotification = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      message,
      type,
      timestamp: Date.now(),
    };

    setNotifications((prev) => [...prev, notification]);

    // Auto remove after 2 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  });

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const showSuccess = useCallback(
    (message) => {
      showNotification(message, 'success');
    },
    [showNotification],
  );

  const showError = useCallback(
    (message) => {
      showNotification(message, 'error');
    },
    [showNotification],
  );

  const showWarning = useCallback(
    (message) => {
      showNotification(message, 'warning');
    },
    [showNotification],
  );

  const showInfo = useCallback(
    (message) => {
      showNotification(message, 'info');
    },
    [showNotification],
  );

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setSystemNotifications([]);
        setUnreadCount(0);
        setIsLoading(false);
        return;
      }

      const data = await fetchNotifications();
      const normalized = data.map((item) => ({
        ...item,
        read: item.read ?? item.isRead ?? false,
      }));
      const unreadItems = normalized.filter((item) => !item.read);
      setSystemNotifications(unreadItems);
      setUnreadCount(unreadItems.length);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
      console.warn('Unable to load notifications. User may not be authenticated.', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadNotifications();
    }
  }, [loadNotifications]);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') {
      return () => undefined;
    }

    const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    broadcastChannelRef.current = channel;

    channel.onmessage = (event) => {
      console.log('📨 [BroadcastChannel] Notification received from service worker:', event.data);
      
      const payload = event?.data?.payload || event?.data;
      if (!payload) {
        console.warn('⚠️ [BroadcastChannel] No payload in message');
        return;
      }

      console.log('📦 [BroadcastChannel] Processing notification payload:', payload);

      const notificationId = payload.notificationId || payload.id || Date.now();
      const normalized = {
        id: notificationId,
        title: payload.title || 'New notification',
        body: payload.body || '',
        deepLink: payload.deepLink || '/',
        notificationType: payload.notificationType || payload.type || 'SESSION_NOTIFICATION',
        meetingId: payload.meetingId,
        sessionId: payload.sessionId,
        actorUserId: payload.actorUserId,
        actorName: payload.actorName,
        read: false,
        createdAt: payload.createdAt || new Date().toISOString(),
        updatedAt: payload.updatedAt || new Date().toISOString(),
        source: payload.source || 'push',
      };

      setSystemNotifications((prev) => {
        const exists = prev.some((n) => n.id === normalized.id && !n.read);
        if (exists) {
          return prev;
        }
        return [normalized, ...prev];
      });
      setUnreadCount((prev) => prev + 1);
    };

    return () => {
      channel.close();
    };
  }, [loadNotifications]);

  const handleMarkAsRead = useCallback(async (notificationId, options = { removeImmediately: false }) => {
    if (options.removeImmediately) {
      setSystemNotifications((prev) => prev.filter((item) => item.id !== notificationId));
      setUnreadCount((prev) => Math.max(prev - 1, 0));
      try {
        await markNotificationRead(notificationId);
        await loadNotifications();
      } catch (error) {
        console.error('Failed to mark notification as read', error);
      }
      return;
    }

    let shouldDecrement = false;
    setSystemNotifications((prev) =>
      prev.map((item) => {
        if (item.id === notificationId && !item.read) {
          shouldDecrement = true;
          return { ...item, read: true };
        }
        return item;
      }),
    );
    if (shouldDecrement) {
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    }
    try {
      await markNotificationRead(notificationId);
      await loadNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  }, [loadNotifications]);

  const handleMarkAllRead = useCallback(async () => {
    setSystemNotifications([]);
    setUnreadCount(0);
    try {
      await markAllNotificationsRead();
      await loadNotifications();
    } catch (error) {
      console.error('Failed to mark all notifications as read', error);
    }
  }, [loadNotifications]);

  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen((prev) => !prev);
  }, []);

  const openDrawer = useCallback(() => {
    setIsDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  return {
    // Toast
    notifications,
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeNotification,
    // System notifications
    systemNotifications,
    unreadCount,
    isDrawerOpen,
    isLoading,
    loadNotifications,
    markSystemNotificationRead: handleMarkAsRead,
    markAllSystemNotificationsRead: handleMarkAllRead,
    toggleDrawer,
    openDrawer,
    closeDrawer,
  };
};

export default useNotification; 