import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import * as googleAuth from '../../services/googleAuth';
import { APP_CONFIG } from '../../config';

vi.mock('../../services/googleAuth', () => ({
  initGoogleAuth: vi.fn().mockResolvedValue(true),
  signIn: vi.fn(),
  signOut: vi.fn(),
  getAccessToken: vi.fn().mockReturnValue(null),
  isAuthReady: vi.fn().mockReturnValue(true)
}));

const TestConsumer = () => {
  const { user, role, token, isAuthenticated, isLoading, signIn, signOut } = useAuth();
  return (
    <div>
      <div data-testid="loading">{String(isLoading)}</div>
      <div data-testid="authenticated">{String(isAuthenticated)}</div>
      <div data-testid="role">{role}</div>
      <div data-testid="email">{user?.email || 'none'}</div>
      <div data-testid="name">{user?.name || 'none'}</div>
      <div data-testid="token">{token || 'none'}</div>
      <button onClick={signIn}>Sign In</button>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
};

describe('AuthContext & AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with unauthenticated student defaults when storage is empty', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(screen.getByTestId('role').textContent).toBe('student');
    expect(screen.getByTestId('email').textContent).toBe('none');
    expect(screen.getByTestId('token').textContent).toBe('none');
  });

  it('restores saved user session from storage on mount', async () => {
    const savedSession = {
      user: {
        email: 'saved@tridorian.com',
        name: 'Saved User',
        picture: 'https://example.com/pic.jpg',
        role: 'student'
      },
      role: 'student',
      token: 'persisted-jwt-token'
    };
    localStorage.setItem('tridorian_user_session', JSON.stringify(savedSession));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('authenticated').textContent).toBe('true');
    expect(screen.getByTestId('role').textContent).toBe('student');
    expect(screen.getByTestId('email').textContent).toBe('saved@tridorian.com');
    expect(screen.getByTestId('name').textContent).toBe('Saved User');
    expect(screen.getByTestId('token').textContent).toBe('persisted-jwt-token');
  });

  it('signs in a regular user, assigns student role, and persists session', async () => {
    googleAuth.signIn.mockResolvedValue({ access_token: 'auth-token-123' });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        email: 'alice@student.org',
        name: 'Alice Student',
        picture: 'https://avatar.png'
      })
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });

    expect(screen.getByTestId('role').textContent).toBe('student');
    expect(screen.getByTestId('email').textContent).toBe('alice@student.org');
    expect(screen.getByTestId('name').textContent).toBe('Alice Student');
    expect(screen.getByTestId('token').textContent).toBe('auth-token-123');

    // Verify session persistence in localStorage
    const saved = JSON.parse(localStorage.getItem('tridorian_user_session'));
    expect(saved).toBeTruthy();
    expect(saved.user.email).toBe('alice@student.org');
    expect(saved.role).toBe('student');
    expect(saved.token).toBe('auth-token-123');
  });

  it('assigns admin role when signed in email is in APP_CONFIG.adminEmails', async () => {
    googleAuth.signIn.mockResolvedValue({ access_token: 'admin-token-xyz' });

    const adminEmail = APP_CONFIG.adminEmails[0] || 'taylor.granstaff@tridorian.com';
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        email: adminEmail,
        name: 'Taylor Granstaff',
        picture: 'https://avatar.png'
      })
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(screen.getByTestId('role').textContent).toBe('admin');
    });

    expect(screen.getByTestId('authenticated').textContent).toBe('true');
    expect(screen.getByTestId('email').textContent).toBe(adminEmail);

    const saved = JSON.parse(localStorage.getItem('tridorian_user_session'));
    expect(saved.role).toBe('admin');
  });

  it('signs out user, calls googleAuth.signOut, and clears session storage', async () => {
    const savedSession = {
      user: { email: 'user@tridorian.com', name: 'User', role: 'student' },
      role: 'student',
      token: 'tok-123'
    };
    localStorage.setItem('tridorian_user_session', JSON.stringify(savedSession));
    sessionStorage.setItem('tridorian_user_session', JSON.stringify(savedSession));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('authenticated').textContent).toBe('true');

    fireEvent.click(screen.getByText('Sign Out'));

    expect(googleAuth.signOut).toHaveBeenCalled();
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(screen.getByTestId('email').textContent).toBe('none');
    expect(screen.getByTestId('role').textContent).toBe('student');

    expect(localStorage.getItem('tridorian_user_session')).toBeNull();
    expect(sessionStorage.getItem('tridorian_user_session')).toBeNull();
  });
});
