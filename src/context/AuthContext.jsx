import { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import { api, setLogoutHandler } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('slcg_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('slcg_token'));
  const [initializing, setInitializing] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('slcg_token');
    localStorage.removeItem('slcg_user');
    delete api.defaults.headers.common.Authorization;
  }, []);

  useEffect(() => {
    setLogoutHandler(logout);
  }, [logout]);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common.Authorization;
    }
  }, [token]);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  useEffect(() => {
    if (token && !user) {
      api.get('/auth/me').then(({ data }) => {
        setUser(data.user);
        localStorage.setItem('slcg_user', JSON.stringify(data.user));
      }).catch((err) => {
        if (err.response?.status === 401) {
          logout();
        }
      }).finally(() => setInitializing(false));
    } else {
      setInitializing(false);
    }
  }, [token, logout]);

  async function login(username, password) {
    const { data } = await api.post('/auth/login', { username, password });
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('slcg_token', data.token);
    localStorage.setItem('slcg_user', JSON.stringify(data.user));
    return data.user;
  }

  const value = useMemo(() => ({ user, token, login, logout, initializing, isOnline }), [user, token, initializing, isOnline, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
