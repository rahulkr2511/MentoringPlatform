/* eslint-disable no-restricted-globals */

const BROADCAST_CHANNEL = 'mp-notifications';
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(BROADCAST_CHANNEL) : null;

self.addEventListener('install', (event) => {
  console.log('🔧 [Service Worker] Installing...');
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  console.log('✅ [Service Worker] Activating and claiming clients...');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('🔔 [Service Worker] ========== PUSH NOTIFICATION RECEIVED ==========');
  console.log('🔔 [Service Worker] Push event:', event);
  
  if (!event.data) {
    console.warn('⚠️ [Service Worker] Push event has no data - this might be a silent push');
    // Even if there's no data, we should still process it
    return;
  }

  let payload;
  try {
    payload = event.data.json();
    console.log('✅ [Service Worker] Push notification payload parsed:', payload);
  } catch (err) {
    console.error('❌ [Service Worker] Failed to parse push payload:', err);
    payload = { title: 'New notification', body: event.data.text() };
  }

  console.log('📦 [Service Worker] Push notification payload:', payload);

  const {
    title = 'Mentoring Platform',
    body = '',
    deepLink = '/',
    notificationId,
    type,
    actorName,
    sessionId,
    meetingId,
    createdAt,
  } = payload || {};

  const notificationOptions = {
    body,
    data: {
      deepLink,
      notificationId,
      type,
      actorName,
      sessionId,
      meetingId,
      createdAt,
    },
    tag: notificationId || `${type || 'notification'}-${Date.now()}`,
    renotify: false,
    badge: '/logo192.png',
    icon: '/logo192.png',
  };

  if (channel) {
    console.log('📡 [Service Worker] Sending notification via BroadcastChannel');
    const broadcastPayload = {
      notificationId,
      title,
      body,
      deepLink,
      actorName,
      sessionId,
      meetingId,
      createdAt,
      read: false,
      receivedAt: new Date().toISOString(),
      source: 'push',
    };
    console.log('📡 [Service Worker] BroadcastChannel payload:', broadcastPayload);
    
    channel.postMessage({
      type: 'PUSH_NOTIFICATION_RECEIVED',
      payload: broadcastPayload,
    });
    console.log('✅ [Service Worker] Message sent to BroadcastChannel');
  } else {
    console.error('❌ [Service Worker] BroadcastChannel not available!');
  }

  const promiseChain = (async () => {
    const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const hasVisibleClient = allClients.some((client) => {
      // @ts-ignore experimental focused property
      if ('focused' in client && client.focused) {
        return true;
      }
      if ('visibilityState' in client && client.visibilityState === 'visible') {
        return true;
      }
      return false;
    });

    if (!hasVisibleClient) {
      await self.registration.showNotification(title, notificationOptions);
    }
  })();

  event.waitUntil(promiseChain);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification?.data?.deepLink || '/';

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const matchingClient = allClients.find((client) => client.url.includes(self.location.origin));

      if (matchingClient) {
        await matchingClient.focus();
        if (targetUrl && matchingClient.url !== new URL(targetUrl, self.location.origin).href) {
          matchingClient.navigate(targetUrl);
        }
      } else if (self.clients.openWindow) {
        await self.clients.openWindow(targetUrl);
      }
    })(),
  );
});

self.addEventListener('message', (event) => {
  console.log('📨 [Service Worker] Message received:', event.data);
  if (event.data && event.data.type === 'PING') {
    console.log('🏓 [Service Worker] Responding to PING with PONG');
    event.ports[0]?.postMessage({ type: 'PONG' });
  }
});

// Log when service worker is ready
console.log('✅ [Service Worker] Service worker script loaded and ready');
console.log('✅ [Service Worker] Push event listener registered');
