import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { LogIn, Shield, User, X, AlertCircle } from 'lucide-react';
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
  signOut: () => googleAuth.signOut(),
  openAuthModal: () => {},
  closeAuthModal: () => {},
  loginWithEmail: () => {}
});

const SESSION_KEY = 'tridorian_user_session';

function AuthModal({ isOpen, onClose, onLoginWithEmail, isAuthReady, onTriggerGoogleSignIn }) {
  const [customEmail, setCustomEmail] = useState('');
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-panel border border-border-main w-full max-w-md rounded-2xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 text-main"
        style={{ boxShadow: 'var(--shadow-accent), 0 25px 50px -12px rgba(0,0,0,0.7)' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-text-muted hover:text-main rounded-md hover:bg-muted transition-colors"
          aria-label="Close authentication modal"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent-border flex items-center justify-center text-accent-text">
            <LogIn size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black text-main uppercase tracking-wider">Authenticate Identity</h2>
            <p className="text-xs text-text-muted">Sign in to unlock all courses & save progress</p>
          </div>
        </div>

        {isAuthReady ? (
          <div className="mb-4">
            <button
              onClick={onTriggerGoogleSignIn}
              className="w-full py-3 px-4 bg-accent text-accent-fg font-bold rounded-xl text-xs uppercase tracking-wider hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-accent"
            >
              <LogIn size={15} /> Sign In with Google
            </button>
          </div>
        ) : (
          <div className="bg-muted/70 border border-border-subtle rounded-xl p-3.5 mb-4 text-xs text-text-muted">
            <span className="text-amber-400 font-bold block mb-1 flex items-center gap-1.5">
              <AlertCircle size={14} /> Evaluation / Demo Mode Active
            </span>
            Google OAuth Client ID is not configured on this deployment. Choose an identity profile below to test:
          </div>
        )}

        <div className="space-y-2 mb-4">
          <div className="text-[10px] font-mono text-text-muted uppercase tracking-wider mb-1">Quick Access Profiles</div>
          <button
            onClick={() => onLoginWithEmail('taylor.granstaff@tridorian.com', 'Taylor Granstaff')}
            className="w-full py-2.5 px-4 bg-muted hover:bg-elevated border border-accent-border/60 hover:border-accent-border text-main font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-between"
          >
            <span className="flex items-center gap-2 text-accent-text">
              <Shield size={14} /> Administrator
            </span>
            <span className="text-[10px] font-mono text-text-muted lowercase font-normal">taylor.granstaff@tridorian.com</span>
          </button>

          <button
            onClick={() => onLoginWithEmail('student@tridorian.com', 'Demo Student')}
            className="w-full py-2.5 px-4 bg-muted hover:bg-elevated border border-border-main text-main font-medium rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <User size={14} /> Student Access
            </span>
            <span className="text-[10px] font-mono text-text-muted lowercase font-normal">student@tridorian.com</span>
          </button>
        </div>

        <div className="border-t border-border-subtle pt-3">
          <label className="text-[10px] font-mono text-text-muted uppercase tracking-wider block mb-1.5">
            Or sign in with custom email:
          </label>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (customEmail.trim()) onLoginWithEmail(customEmail.trim());
            }}
            className="flex gap-2"
          >
            <input
              type="email"
              placeholder="name@company.com"
              value={customEmail}
              onChange={(e) => setCustomEmail(e.target.value)}
              className="flex-1 bg-muted border border-border-main rounded-lg px-3 py-1.5 text-xs text-main focus:outline-none focus:border-accent-border"
              required
            />
            <button
              type="submit"
              className="px-4 py-1.5 bg-elevated hover:bg-accent/20 border border-border-main hover:border-accent-border text-xs text-main font-mono rounded-lg transition-all"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('student');
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

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
    if (APP_CONFIG.googleClientId && !APP_CONFIG.googleClientId.startsWith('your-')) {
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

  const openAuthModal = useCallback(() => setIsAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => setIsAuthModalOpen(false), []);

  const loginWithEmail = useCallback((email, optionalName) => {
    const trimmed = (email || '').trim();
    if (!trimmed) return null;

    const isAdmin = Boolean(
      Array.isArray(APP_CONFIG.adminEmails) && (
        APP_CONFIG.adminEmails.includes(trimmed) ||
        APP_CONFIG.adminEmails.some(e => e.toLowerCase() === trimmed.toLowerCase())
      )
    );
    const userRole = isAdmin ? 'admin' : 'student';
    const userData = {
      email: trimmed,
      name: optionalName || trimmed.split('@')[0] || 'User',
      picture: '',
      role: userRole
    };

    const dummyToken = `demo-token-${Date.now()}`;
    setUser(userData);
    setRole(userRole);
    setToken(dummyToken);
    setIsAuthenticated(true);

    const sessionPayload = {
      user: userData,
      role: userRole,
      token: dummyToken
    };

    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionPayload));
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionPayload));
    } catch (e) {}

    setIsAuthModalOpen(false);
    return userData;
  }, []);

  const triggerGoogleSignIn = useCallback(async () => {
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

      setIsAuthModalOpen(false);
      return userData;
    } catch (err) {
      console.warn('Google sign-in attempt failed or cancelled:', err);
      // Keep modal open if sign-in failed
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signIn = useCallback(async () => {
    // If googleAuth.isAuthReady is a function and explicitly false, open modal directly
    if (typeof googleAuth.isAuthReady === 'function' && !googleAuth.isAuthReady()) {
      setIsAuthModalOpen(true);
      return;
    }
    // Attempt Google sign-in, falling back to modal if failed
    try {
      return await triggerGoogleSignIn();
    } catch (err) {
      setIsAuthModalOpen(true);
    }
  }, [triggerGoogleSignIn]);

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
    signOut,
    openAuthModal,
    closeAuthModal,
    loginWithEmail
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        onLoginWithEmail={loginWithEmail}
        isAuthReady={typeof googleAuth.isAuthReady === 'function' ? googleAuth.isAuthReady() : false}
        onTriggerGoogleSignIn={triggerGoogleSignIn}
      />
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
      signOut: () => googleAuth.signOut(),
      openAuthModal: () => {},
      closeAuthModal: () => {},
      loginWithEmail: () => {}
    };
  }
  return context;
};

export default AuthContext;
