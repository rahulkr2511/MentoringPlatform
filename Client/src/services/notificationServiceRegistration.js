/* eslint-disable no-console */
import { registerSubscription } from './notificationService';
import { VAPID_PUBLIC_KEY, PUBLIC_URL_BASE } from '../config/env';

const SERVICE_WORKER_PATH = `${PUBLIC_URL_BASE}/notificationServiceWorker.js`;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function subscribeToPush(registration) {
  if (!VAPID_PUBLIC_KEY) {
    console.warn('VAPID public key missing; skipping push subscription.');
    return;
  }

  const token = localStorage.getItem('token');
  if (!token) {
    console.warn('No auth token found; deferring push subscription until login.');
    return;
  }

  try {
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      console.log('✅ Existing push subscription found, re-registering:', existingSubscription.endpoint);
      try {
        await registerSubscription(existingSubscription);
        console.log('✅ Push subscription re-registered successfully with server');
      } catch (regError) {
        console.error('❌ Failed to re-register existing subscription:', regError);
        // Don't return, try to create a new one
        console.log('🔄 Attempting to create new subscription...');
      }
    }

    // If no existing subscription or re-registration failed, create new one
    if (!existingSubscription) {
      console.log('📝 Creating new push subscription...');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      console.log('✅ Push subscription created:', subscription.endpoint);
      await registerSubscription(subscription);
      console.log('✅ Push subscription registered with server');
    }
  } catch (error) {
    console.error('❌ Push subscription failed:', error);
    console.error('Error details:', error.message, error.stack);
  }
}

export async function registerNotificationServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers not supported in this browser.');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register(SERVICE_WORKER_PATH);
    console.info('Notification service worker registered', registration);

    // Wait for service worker to be ready
    if (registration.installing) {
      console.log('⏳ Service worker is installing...');
      registration.installing.addEventListener('statechange', (e) => {
        if (e.target.state === 'activated') {
          console.log('✅ Service worker activated');
        }
      });
    } else if (registration.waiting) {
      console.log('⏳ Service worker is waiting...');
    } else if (registration.active) {
      console.log('✅ Service worker is active');
    }

    // Verify service worker can receive messages
    if (navigator.serviceWorker.controller) {
      console.log('✅ Service worker controller is available');
    } else {
      console.log('⏳ Waiting for service worker controller...');
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('✅ Service worker controller is now available');
      });
    }

    if (Notification.permission === 'granted') {
      await subscribeToPush(registration);
      return;
    }

    const permissionResult = await Notification.requestPermission();
    if (permissionResult === 'granted') {
      await subscribeToPush(registration);
    } else {
      console.warn('Notification permission denied.');
    }
  } catch (error) {
    console.error('Failed to register notification service worker', error);
  }
}
