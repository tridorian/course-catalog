import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as googleAuth from '../services/googleAuth';
import { initGoogleAuth } from '../services/googleAuth';
import { APP_CONFIG } from '../config';

export const AuthContext = createContext({
  user: null,
  role: 'student',
  token: null,
  isAuthenticated: false,
  isLoading: false,
  signIn: async () => googleAuth.signIn(),
  signOut: () => googleAuth.signOut()
});

const SESSION_KEY = 'tridorian_user_session';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('student');
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage/sessionStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.user || parsed.token)) {
          const restoredUser = parsed.user || null;
          const restoredRole = parsed.role || (restoredUser && restoredUser.role) || 'student';
          const restoredToken = parsed.token || null;
          
          setUser(restoredUser);
          setRole(restoredRole);
          setToken(restoredToken);
          setIsAuthenticated(Boolean(restoredUser || restoredToken));
        }
      }
    } catch (err) {
      console.warn('Failed to parse saved user session:', err);
    } finally {
      setIsLoading(false);
    }

    // Initialize GIS if client ID is configured
    if (APP_CONFIG.googleClientId) {
      try {
        const initPromise = initGoogleAuth(APP_CONFIG.googleClientId);
        if (initPromise && typeof initPromise.catch === 'function') {
          initPromise.catch((err) => {
            console.warn('Google Identity Services initialization notice:', err);
          });
        }
      } catch (e) {
        console.warn('Google Identity Services initialization error:', e);
      }
    }
  }, []);

  const signIn = useCallback(async () => {
    setIsLoading(true);
    try {
      const authRes = await googleAuth.signIn();
      const accessToken = authRes?.access_token || googleAuth.getAccessToken();

      let userInfo = {};
      if (accessToken) {
        try {
          const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          });
          if (res.ok) {
            userInfo = await res.json();
          }
        } catch (err) {
          console.warn('Failed to fetch userinfo from Google API:', err);
        }
      }

      const email = userInfo.email || '';
      const isAdmin = Boolean(
        Array.isArray(APP_CONFIG.adminEmails) && (
          APP_CONFIG.adminEmails.includes(email) ||
          APP_CONFIG.adminEmails.some(e => e.toLowerCase() === email.toLowerCase())
        )
      );
      const userRole = isAdmin ? 'admin' : 'student';

      const userData = {
        email: email,
        name: userInfo.name || email.split('@')[0] || 'User',
        picture: userInfo.picture || '',
        role: userRole
      };

      setUser(userData);
      setRole(userRole);
      setToken(accessToken || null);
      setIsAuthenticated(true);

      const sessionPayload = {
        user: userData,
        role: userRole,
        token: accessToken || null
      };

      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionPayload));
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionPayload));
      } catch (e) {
        console.warn('Failed to save session to storage:', e);
      }

      return userData;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(() => {
    try {
      googleAuth.signOut();
    } catch (err) {
      console.warn('Sign out error:', err);
    }

    try {
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_KEY);
    } catch (e) {}

    setUser(null);
    setRole('student');
    setToken(null);
    setIsAuthenticated(false);
  }, []);

  const value = {
    user,
    role,
    token,
    isAuthenticated,
    isLoading,
    signIn,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      role: 'student',
      token: null,
      isAuthenticated: false,
      isLoading: false,
      signIn: async () => googleAuth.signIn(),
      signOut: () => googleAuth.signOut()
    };
  }
  return context;
};

export default AuthContext;
