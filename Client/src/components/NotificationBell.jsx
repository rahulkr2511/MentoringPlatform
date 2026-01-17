import React from 'react';
import { useNotificationContext } from '../contexts/NotificationContext';
import '../styles/NotificationBell.css';

const NotificationBell = () => {
  const { unreadCount, toggleDrawer } = useNotificationContext();

  return (
    <button
      type="button"
      className="notification-bell"
      onClick={toggleDrawer}
      aria-label="Notifications"
    >
      <span className="bell-icon">🔔</span>
      {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
    </button>
  );
};

export default NotificationBell;
