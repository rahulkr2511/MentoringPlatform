import { API_BASE_URL } from '../config/env';

async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || response.statusText);
  }

  return response.json();
}

export async function registerSubscription(subscription) {
  const json = subscription.toJSON();
  const payload = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: json?.keys?.p256dh || '',
      auth: json?.keys?.auth || '',
    },
  };

  try {
    console.log('📤 Registering push subscription with server:', subscription.endpoint);
    const response = await apiRequest('/push-subscriptions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    console.log('✅ Push subscription registered successfully with server:', response);
    return response;
  } catch (error) {
    console.error('❌ Failed to register push subscription with server:', error);
    throw error;
  }
}

export async function fetchNotifications() {
  const response = await apiRequest('/notifications', {
    method: 'GET',
  });
  return response?.data || [];
}

export async function markNotificationRead(notificationId) {
  await apiRequest(`/notifications/${notificationId}/read`, {
    method: 'PATCH',
  });
}

export async function markAllNotificationsRead() {
  await apiRequest('/notifications/mark-all-read', {
    method: 'POST',
  });
}
