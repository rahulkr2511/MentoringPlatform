import React, { useMemo } from 'react';
import { useNotificationContext } from '../contexts/NotificationContext';
import '../styles/NotificationDrawer.css';

const NotificationDrawer = () => {
  const {
    systemNotifications,
    isDrawerOpen,
    closeDrawer,
    markSystemNotificationRead,
    markAllSystemNotificationsRead,
    isLoading,
  } = useNotificationContext();

  const sortedNotifications = useMemo(
    () =>
      [...systemNotifications].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [systemNotifications],
  );

  return (
    <div className={`notification-drawer ${isDrawerOpen ? 'open' : ''}`}>
      <div className="drawer-header">
        <h2>Notifications</h2>
        <div className="drawer-actions">
          {systemNotifications.length > 0 && (
            <button type="button" className="mark-all-btn" onClick={markAllSystemNotificationsRead}>
              Mark all as read
            </button>
          )}
          <button type="button" className="close-btn" onClick={closeDrawer}>
            ✕
          </button>
        </div>
      </div>

      <div className="drawer-content">
        {isLoading && <div className="drawer-status">Loading notifications...</div>}

        {!isLoading && sortedNotifications.length === 0 && (
          <div className="drawer-status">You are all caught up!</div>
        )}

        {!isLoading &&
          sortedNotifications.map((item) => (
            <div key={item.id} className={`drawer-item ${item.read ? '' : 'unread'}`}>
              <div className="drawer-item-header">
                <time>{new Date(item.createdAt).toLocaleString()}</time>
              </div>
              <div className="drawer-item-body">
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
              {!item.read && (
                <div className="drawer-item-actions">
                  <button
                    type="button"
                    className="mark-read-btn"
                    onClick={() => markSystemNotificationRead(item.id, { removeImmediately: true })}
                  >
                    Mark as read
                  </button>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};

export default NotificationDrawer;
