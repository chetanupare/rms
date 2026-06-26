import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [permission, setPermission] = useState(Notification.permission);

  useEffect(() => {
    if (!user) return;
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(setPermission);
    }
  }, [user]);

  const notify = useCallback((title, options = {}) => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/icon-192.png',
        ...options,
      });
    }
  }, []);

  const requestPermission = useCallback(() => {
    if ('Notification' in window) {
      Notification.requestPermission().then(setPermission);
    }
  }, []);

  return (
    <NotificationContext.Provider value={{ permission, notify, requestPermission }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used inside NotificationProvider');
  return ctx;
}
