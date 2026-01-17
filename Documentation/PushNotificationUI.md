# Push Notification UI Implementation

This document describes how push notifications are handled in the frontend UI of the Mentoring Platform.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Service Worker Registration](#service-worker-registration)
4. [Push Subscription Flow](#push-subscription-flow)
5. [Notification Reception Flow](#notification-reception-flow)
6. [UI Components](#ui-components)
7. [State Management](#state-management)
8. [User Interactions](#user-interactions)
9. [Data Flow Diagram](#data-flow-diagram)

## Overview

The push notification system in the UI consists of several key components:

- **Service Worker**: Handles push events in the background, even when the app is closed
- **Notification Context**: React context that provides notification state and methods throughout the app
- **useNotification Hook**: Custom hook managing notification state and business logic
- **NotificationDrawer**: UI component displaying system notifications
- **NotificationBell**: UI component showing unread notification count
- **BroadcastChannel**: Communication channel between service worker and main app thread

## Architecture

### Component Hierarchy

```
App
├── NotificationProvider (Context Provider)
│   └── useNotification Hook
│       ├── Toast Notifications (in-memory)
│       └── System Notifications (from server)
│           ├── NotificationBell (unread count indicator)
│           └── NotificationDrawer (notification list)
└── Service Worker (background)
    └── BroadcastChannel (communication)
```

### Key Files

- **`/Client/src/services/notificationServiceRegistration.js`**: Service worker registration and push subscription
- **`/Client/public/notificationServiceWorker.js`**: Service worker implementation
- **`/Client/src/hooks/useNotification.js`**: Notification state management hook
- **`/Client/src/contexts/NotificationContext.js`**: React context provider
- **`/Client/src/components/NotificationDrawer.jsx`**: Notification drawer UI
- **`/Client/src/components/NotificationBell.jsx`**: Notification bell icon
- **`/Client/src/styles/NotificationDrawer.css`**: Drawer styling

## Service Worker Registration

### Initialization

The service worker is registered in two places:

1. **On App Load** (`/Client/src/index.js`):
   ```javascript
   registerNotificationServiceWorker();
   ```
   This ensures the service worker is registered as early as possible.

2. **On User Login** (`/Client/src/App.js`):
   ```javascript
   useEffect(() => {
     const token = localStorage.getItem('token');
     if (token && user) {
       registerNotificationServiceWorker();
     }
   }, []);
   ```
   Re-registers when user is already logged in or after successful login.

### Registration Process

The `registerNotificationServiceWorker()` function (`notificationServiceRegistration.js`):

1. **Checks Browser Support**:
   - Verifies `serviceWorker` is available in `navigator`
   - Returns early if not supported

2. **Registers Service Worker**:
   - Registers `/notificationServiceWorker.js` from the public directory
   - Waits for service worker to be ready (installing → waiting → active)

3. **Requests Notification Permission**:
   - Checks if permission is already granted
   - If not, requests permission from user
   - Only proceeds if permission is granted

4. **Subscribes to Push**:
   - Calls `subscribeToPush()` to create or reuse push subscription

## Push Subscription Flow

### Subscription Process

The `subscribeToPush()` function handles push subscription:

1. **Prerequisites Check**:
   - Verifies VAPID public key is available
   - Checks for authentication token in localStorage
   - Returns early if prerequisites are missing

2. **Existing Subscription Check**:
   - Checks if a push subscription already exists
   - If exists, re-registers it with the server
   - If re-registration fails, attempts to create a new subscription

3. **New Subscription Creation**:
   - Creates new push subscription using VAPID public key
   - Converts VAPID key from base64 to Uint8Array format
   - Sets `userVisibleOnly: true` to ensure notifications are shown

4. **Server Registration**:
   - Sends subscription to server via `registerSubscription()` API call
   - Server stores subscription for later push message delivery

### VAPID Key Conversion

The VAPID public key is converted from base64 URL-safe format to Uint8Array:

```javascript
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
```

## Notification Reception Flow

### Service Worker Push Event Handler

When a push notification is received, the service worker (`notificationServiceWorker.js`) handles it:

1. **Push Event Reception**:
   ```javascript
   self.addEventListener('push', (event) => {
     // Parse payload from event.data
     const payload = event.data.json();
   });
   ```

2. **Payload Processing**:
   - Extracts notification data (title, body, deepLink, etc.)
   - Handles parsing errors gracefully
   - Sets default values for missing fields

3. **BroadcastChannel Communication**:
   - Creates BroadcastChannel with name `'mp-notifications'`
   - Sends notification payload to main app thread
   - Allows app to update UI even when tab is open

4. **Browser Notification Display**:
   - Checks if any client window is visible
   - Only shows browser notification if no visible window
   - Prevents duplicate notifications when app is open

### BroadcastChannel Integration

The main app thread listens for messages via BroadcastChannel:

1. **Channel Setup** (`useNotification.js`):
   ```javascript
   const channel = new BroadcastChannel('mp-notifications');
   channel.onmessage = (event) => {
     // Process notification payload
   };
   ```

2. **Notification Normalization**:
   - Normalizes payload structure
   - Maps server fields to UI format
   - Handles different payload formats

3. **State Update**:
   - Adds notification to `systemNotifications` state
   - Increments `unreadCount`
   - Prevents duplicate notifications

## UI Components

### NotificationBell Component

**Location**: `/Client/src/components/NotificationBell.jsx`

**Purpose**: Displays notification icon with unread count badge

**Features**:
- Shows bell icon (🔔)
- Displays unread count badge when count > 0
- Clicking toggles notification drawer
- Uses `useNotificationContext()` for state

**Usage**:
```jsx
<NotificationBell />
```

### NotificationDrawer Component

**Location**: `/Client/src/components/NotificationDrawer.jsx`

**Purpose**: Displays list of system notifications in a slide-out drawer

**Features**:
- Slide-out drawer from right side
- Shows all system notifications sorted by date (newest first)
- Marks notifications as read/unread
- "Mark all as read" functionality
- Loading and empty states
- Clickable notifications with deep links

**Structure**:
- **Header**: Title, "Mark all as read" button, close button
- **Content**: Scrollable list of notifications
- **Notification Item**: Title, body, timestamp, "Mark as read" button

**Styling**: Uses `/Client/src/styles/NotificationDrawer.css`

### Toast Notifications

**Purpose**: In-app toast notifications for immediate user feedback

**Types**:
- `success`: Green toast for successful actions
- `error`: Red toast for errors
- `warning`: Yellow toast for warnings
- `info`: Blue toast for informational messages

**Features**:
- Auto-dismiss after 5 seconds
- Manual dismissal
- Stacked display (multiple toasts)

**Usage**:
```javascript
const { showSuccess, showError, showWarning, showInfo } = useNotificationContext();
showSuccess('Operation completed successfully!');
```

## State Management

### useNotification Hook

**Location**: `/Client/src/hooks/useNotification.js`

**State Variables**:

1. **Toast Notifications**:
   - `notifications`: Array of toast notification objects
   - Managed in-memory, not persisted

2. **System Notifications**:
   - `systemNotifications`: Array of server notifications
   - `unreadCount`: Count of unread notifications
   - `isDrawerOpen`: Drawer visibility state
   - `isLoading`: Loading state for API calls

**Key Functions**:

1. **Toast Functions**:
   - `showNotification(message, type)`: Generic notification
   - `showSuccess(message)`: Success toast
   - `showError(message)`: Error toast
   - `showWarning(message)`: Warning toast
   - `showInfo(message)`: Info toast
   - `removeNotification(id)`: Remove toast

2. **System Notification Functions**:
   - `loadNotifications()`: Fetch notifications from server
   - `markSystemNotificationRead(id, options)`: Mark single as read
   - `markAllSystemNotificationsRead()`: Mark all as read
   - `toggleDrawer()`: Toggle drawer visibility
   - `openDrawer()`: Open drawer
   - `closeDrawer()`: Close drawer

### NotificationContext

**Location**: `/Client/src/contexts/NotificationContext.js`

**Purpose**: Provides notification state and methods to all components

**Usage**:
```javascript
import { useNotificationContext } from '../contexts/NotificationContext';

function MyComponent() {
  const { unreadCount, systemNotifications, showSuccess } = useNotificationContext();
  // Use notification state and methods
}
```

**Provider Setup**:
```jsx
<NotificationProvider>
  <App />
</NotificationProvider>
```

## User Interactions

### Notification Click Handling

When a user clicks on a browser notification:

1. **Service Worker Handler** (`notificationServiceWorker.js`):
   ```javascript
   self.addEventListener('notificationclick', (event) => {
     const targetUrl = event.notification.data.deepLink || '/';
     // Focus existing window or open new window
   });
   ```

2. **Navigation**:
   - If app window exists, focuses it
   - Navigates to `deepLink` if different from current URL
   - If no window exists, opens new window with `deepLink`

### Marking Notifications as Read

**Single Notification**:
- User clicks "Mark as read" button in drawer
- Calls `markSystemNotificationRead(notificationId, { removeImmediately: true })`
- Updates local state immediately
- Sends API request to server
- Reloads notifications from server

**All Notifications**:
- User clicks "Mark all as read" in drawer header
- Calls `markAllSystemNotificationsRead()`
- Clears local state
- Sends API request to server
- Reloads notifications from server

### Drawer Interactions

- **Open**: Click notification bell icon
- **Close**: Click close button (✕) in header
- **Toggle**: Click bell icon again to close

## Data Flow Diagram

```
┌─────────────────┐
│   Backend API   │
│  (Push Server)  │
└────────┬────────┘
         │ Push Message
         ▼
┌─────────────────────────┐
│   Service Worker        │
│  (Background Thread)    │
│                         │
│  1. Receive push event  │
│  2. Parse payload       │
│  3. BroadcastChannel    │
│  4. Show browser notif  │
└────────┬────────────────┘
         │ BroadcastChannel Message
         ▼
┌─────────────────────────┐
│   Main App Thread       │
│                         │
│  useNotification Hook   │
│  1. Listen to channel   │
│  2. Update state        │
│  3. Increment count     │
└────────┬────────────────┘
         │ State Update
         ▼
┌─────────────────────────┐
│   React Components      │
│                         │
│  - NotificationBell     │
│  - NotificationDrawer   │
│  - Toast                │
└─────────────────────────┘
```

## Notification Payload Structure

### From Server (Push Message)

```javascript
{
  title: "Notification Title",
  body: "Notification body text",
  deepLink: "/path/to/resource",
  notificationId: "unique-id",
  type: "SESSION_NOTIFICATION",
  actorName: "John Doe",
  sessionId: "session-123",
  meetingId: "meeting-456",
  createdAt: "2024-01-01T00:00:00Z"
}
```

### Normalized in UI

```javascript
{
  id: "unique-id",
  title: "Notification Title",
  body: "Notification body text",
  deepLink: "/path/to/resource",
  notificationType: "SESSION_NOTIFICATION",
  meetingId: "meeting-456",
  sessionId: "session-123",
  actorUserId: "user-123",
  actorName: "John Doe",
  read: false,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  source: "push"
}
```

## API Integration

### Notification Service

The hook uses the following API endpoints (via `notificationService.js`):

1. **Fetch Notifications**: `GET /api/notifications`
   - Returns all notifications for current user
   - Used by `loadNotifications()`

2. **Mark as Read**: `PUT /api/notifications/:id/read`
   - Marks single notification as read
   - Used by `markSystemNotificationRead()`

3. **Mark All as Read**: `PUT /api/notifications/read-all`
   - Marks all notifications as read
   - Used by `markAllSystemNotificationsRead()`

4. **Register Subscription**: `POST /api/notifications/subscribe`
   - Registers push subscription with server
   - Used by `registerSubscription()`

## Error Handling

### Service Worker Errors

- **Push Event Without Data**: Logs warning, continues processing
- **JSON Parse Error**: Falls back to text data with default title
- **BroadcastChannel Unavailable**: Logs error, continues with browser notification

### Subscription Errors

- **Missing VAPID Key**: Logs warning, skips subscription
- **No Auth Token**: Logs warning, defers subscription
- **Subscription Failure**: Logs error with details
- **Re-registration Failure**: Attempts to create new subscription

### API Errors

- **Fetch Failures**: Logs error, shows warning in console
- **Authentication Errors**: Handles gracefully, doesn't crash app
- **Network Errors**: User can retry by reopening drawer

## Browser Compatibility

### Required Features

- **Service Workers**: Required for push notifications
- **Push API**: Required for receiving push messages
- **Notifications API**: Required for displaying browser notifications
- **BroadcastChannel**: Used for service worker ↔ main thread communication

### Fallback Behavior

- If service workers not supported: Push notifications disabled
- If BroadcastChannel not available: Notifications still work, but UI updates may be delayed
- If notifications permission denied: Push subscription still created, but no browser notifications shown

## Best Practices

1. **Permission Handling**: Always request permission before subscribing
2. **Error Logging**: Comprehensive logging for debugging
3. **State Synchronization**: Reload notifications after marking as read
4. **Duplicate Prevention**: Check for existing notifications before adding
5. **User Experience**: Show browser notifications only when app is not visible
6. **Deep Linking**: Always include `deepLink` in notification payload
7. **Cleanup**: Close BroadcastChannel on component unmount

## Future Enhancements

Potential improvements:

1. **Notification Actions**: Add action buttons to notifications
2. **Notification Grouping**: Group related notifications
3. **Sound/Vibration**: Add audio/visual feedback
4. **Notification History**: Persist notification history
5. **Filtering**: Filter notifications by type
6. **Search**: Search through notification history
7. **Settings**: User preferences for notification types
