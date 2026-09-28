import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('iams_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('iams_token'));
  const [isLoading, setIsLoading] = useState(true);

  // Validate or sync current officer session on mount
  useEffect(() => {
    const verifySession = async () => {
      const savedToken = localStorage.getItem('iams_token');
      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        if (res.success && res.data?.user) {
          setUser(res.data.user);
          localStorage.setItem('iams_user', JSON.stringify(res.data.user));
        }
      } catch (err) {
        console.warn('Session verification failed:', err.message);
        api.clearAuthSession();
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();

    // Listen for unauthorized events from API client
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('iams:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('iams:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.success && res.data?.token) {
      api.setAuthSession(res.data.token, res.data.user);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data.user;
    }
    throw new Error(res.error?.message || 'Login failed');
  };

  const logout = () => {
    api.clearAuthSession();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};

export default AuthContext;
