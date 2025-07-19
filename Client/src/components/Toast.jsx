import React from 'react';
import '../styles/Toast.css';

const Toast = ({ notifications, onRemove }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return 'ℹ️';
    }
  };

  const getTypeClass = (type) => {
    switch (type) {
      case 'success':
        return 'toast-success';
      case 'error':
        return 'toast-error';
      case 'warning':
        return 'toast-warning';
      case 'info':
        return 'toast-info';
      default:
        return 'toast-info';
    }
  };

  return (
    <div className="toast-container">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`toast ${getTypeClass(notification.type)}`}
          onClick={() => onRemove(notification.id)}
        >
          <div className="toast-content">
            <div className="toast-icon">
              {getIcon(notification.type)}
            </div>
            <div className="toast-message">
              {notification.message}
            </div>
            <button
              className="toast-close"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(notification.id);
              }}
            >
              ×
            </button>
          </div>
          <div className="toast-progress"></div>
        </div>
      ))}
    </div>
  );
};

export default Toast; 