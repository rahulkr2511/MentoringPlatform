import React, { createContext, useContext } from 'react';
import useNotification from '../hooks/useNotification';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const notificationHook = useNotification();

  return (
    <NotificationContext.Provider value={notificationHook}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
}; 