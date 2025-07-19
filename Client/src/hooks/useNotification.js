import { useState, useCallback } from 'react';

const useNotification = () => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      message,
      type,
      timestamp: Date.now()
    };

    setNotifications(prev => [...prev, notification]);

    // Auto remove after 2 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  });

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  });

  const showSuccess = useCallback((message) => {
    showNotification(message, 'success');
  });

  const showError = useCallback((message) => {
    showNotification(message, 'error');
  });

  const showWarning = useCallback((message) => {
    showNotification(message, 'warning');
  });

  const showInfo = useCallback((message) => {
    showNotification(message, 'info');
  });

  return {
    notifications,
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeNotification
  };
};

export default useNotification; 