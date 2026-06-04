import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('googleAuth', () => {
  let googleAuth;

  beforeEach(async () => {
    vi.resetModules();

    window.google = {
      accounts: {
        oauth2: {
          initTokenClient: vi.fn(),
          revoke: vi.fn()
        }
      }
    };

    document.body.innerHTML = '';

    googleAuth = await import('../services/googleAuth.js');
  });

  afterEach(() => {
    delete window.google;
  });

  describe('initGoogleAuth', () => {
    it('should inject script and resolve to true on load', async () => {
      const clientId = 'test-client-id';
      const mockTokenClient = { requestAccessToken: vi.fn() };
      window.google.accounts.oauth2.initTokenClient.mockReturnValue(mockTokenClient);

      const initPromise = googleAuth.initGoogleAuth(clientId);

      const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      expect(script).toBeTruthy();

      script.onload();

      const result = await initPromise;
      expect(result).toBe(true);

      expect(window.google.accounts.oauth2.initTokenClient).toHaveBeenCalledWith(
        expect.objectContaining({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/generative-language',
          callback: expect.any(Function)
        })
      );
    });

    it('should reject if script fails to load', async () => {
      const initPromise = googleAuth.initGoogleAuth('test-id');
      const script = document.querySelector('script');

      const error = new Error('Script load failed');
      script.onerror(error);

      await expect(initPromise).rejects.toBe(error);
    });

    it('should reject if initTokenClient throws', async () => {
      const error = new Error('Init failed');
      window.google.accounts.oauth2.initTokenClient.mockImplementation(() => {
        throw error;
      });

      const initPromise = googleAuth.initGoogleAuth('test-id');
      const script = document.querySelector('script');
      script.onload();

      await expect(initPromise).rejects.toBe(error);
    });

    it('should update access token when callback in init function is invoked successfully (though typically not called directly there)', async () => {
        let oauthCallback;
        window.google.accounts.oauth2.initTokenClient.mockImplementation((config) => {
          oauthCallback = config.callback;
          return {};
        });

        const initPromise = googleAuth.initGoogleAuth('test-id');
        document.querySelector('script').onload();
        await initPromise;

        // At this point, the initial promise for initGoogleAuth is resolved, but calling callback might try to resolve it again
        // However, Promise can only be resolved once. Let's just check if it sets the access token and resolves if called.
        // Wait, the callback in initGoogleAuth resolves/rejects the *same* promise!
        // So actually, if initTokenClient is successful, `resolve(true)` is called immediately in onload.
        // Calling callback later would be ignored for the promise, but it DOES update the access token.
        oauthCallback({ access_token: 'init-test-token' });

        expect(googleAuth.getAccessToken()).toBe('init-test-token');
    });

    it('should handle callback error in init function', async () => {
        let oauthCallback;
        window.google.accounts.oauth2.initTokenClient.mockImplementation((config) => {
          oauthCallback = config.callback;
          return {};
        });

        const initPromise = googleAuth.initGoogleAuth('test-id');
        document.querySelector('script').onload();
        await initPromise;

        // This will reject, but since the promise is already resolved (resolve(true)), it might be a no-op or unhandled rejection?
        // Actually, reject is ignored if already resolved.
        oauthCallback({ error: 'some_error' });
    });
  });

  describe('signIn', () => {
    it('should reject if auth not initialized', async () => {
      await expect(googleAuth.signIn()).rejects.toBe('Auth not initialized');
    });

    it('should request access token and resolve on successful callback', async () => {
      // Setup init first
      const mockTokenClient = { requestAccessToken: vi.fn() };
      window.google.accounts.oauth2.initTokenClient.mockReturnValue(mockTokenClient);

      const initPromise = googleAuth.initGoogleAuth('test-id');
      document.querySelector('script').onload();
      await initPromise;

      // Mock requestAccessToken to immediately call the callback (simulate user auth)
      mockTokenClient.requestAccessToken.mockImplementation(function() {
        // the callback gets reassigned in signIn
        this.callback({ access_token: 'test-access-token' });
      });

      const result = await googleAuth.signIn();

      expect(mockTokenClient.requestAccessToken).toHaveBeenCalledWith({ prompt: 'select_account' });
      expect(result).toEqual({ access_token: 'test-access-token' });
      expect(googleAuth.getAccessToken()).toBe('test-access-token');

      // Test that second sign in doesn't prompt
      mockTokenClient.requestAccessToken.mockClear();
      mockTokenClient.requestAccessToken.mockImplementation(function() {
        this.callback({ access_token: 'test-access-token-2' });
      });

      await googleAuth.signIn();
      expect(mockTokenClient.requestAccessToken).toHaveBeenCalledWith({ prompt: '' });
      expect(googleAuth.getAccessToken()).toBe('test-access-token-2');
    });

    it('should reject on error callback', async () => {
      const mockTokenClient = { requestAccessToken: vi.fn() };
      window.google.accounts.oauth2.initTokenClient.mockReturnValue(mockTokenClient);

      const initPromise = googleAuth.initGoogleAuth('test-id');
      document.querySelector('script').onload();
      await initPromise;

      mockTokenClient.requestAccessToken.mockImplementation(function() {
        this.callback({ error: 'access_denied' });
      });

      await expect(googleAuth.signIn()).rejects.toEqual({ error: 'access_denied' });
    });
  });

  describe('signOut', () => {
    it('should revoke token and reset access token if token exists', async () => {
      // Setup and sign in to get a token
      const mockTokenClient = { requestAccessToken: vi.fn() };
      window.google.accounts.oauth2.initTokenClient.mockReturnValue(mockTokenClient);

      const initPromise = googleAuth.initGoogleAuth('test-id');
      document.querySelector('script').onload();
      await initPromise;

      mockTokenClient.requestAccessToken.mockImplementation(function() {
        this.callback({ access_token: 'test-token-to-revoke' });
      });

      await googleAuth.signIn();
      expect(googleAuth.getAccessToken()).toBe('test-token-to-revoke');

      // Mock revoke to call its callback
      window.google.accounts.oauth2.revoke.mockImplementation((token, cb) => {
        cb();
      });

      googleAuth.signOut();

      expect(window.google.accounts.oauth2.revoke).toHaveBeenCalledWith(
        'test-token-to-revoke',
        expect.any(Function)
      );
      expect(googleAuth.getAccessToken()).toBeNull();
    });

    it('should do nothing if access token is null', async () => {
      expect(googleAuth.getAccessToken()).toBeNull();

      googleAuth.signOut();

      expect(window.google.accounts.oauth2.revoke).not.toHaveBeenCalled();
    });
  });
});
