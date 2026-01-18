export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/monitoringPlatform';

export const WS_BASE_URL = process.env.REACT_APP_WS_BASE_URL || 'http://localhost:8080/ws';

// Update the VAPID public key to your own
export const VAPID_PUBLIC_KEY =
  process.env.REACT_APP_VAPID_PUBLIC_KEY ||
  'BLvt0WNCKhjo54kvt4q0k85sBJnXVRaNhg2XKIrztma3FgoFfJrnLZY0gBg6U2f2KD-86EYAfrvg7Dt1VWuPxJI';

export const PUBLIC_URL_BASE = process.env.PUBLIC_URL || '';
