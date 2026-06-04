import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkUserRole } from '../../services/roleManager';
import * as googleAuth from '../../services/googleAuth';

vi.mock('../../services/googleAuth');

describe('roleManager Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset global fetch mock
    global.fetch = vi.fn();
  });

  it('returns student role if not authenticated', async () => {
    googleAuth.getAccessToken.mockReturnValue(null);
    const role = await checkUserRole();
    expect(role).toBe('student');
  });

  it('returns admin role in testing mode if email matches allowed admin', async () => {
    googleAuth.getAccessToken.mockReturnValue('valid-token');

    // Mock UserInfo response
    global.fetch.mockImplementation((url) => {
      if (url.includes('userinfo')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ email: 'taylor@tridorian.com' })
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const role = await checkUserRole({ testingMode: true, allowedAdmin: 'taylor@tridorian.com' });
    expect(role).toBe('admin');
  });

  it('returns student role in testing mode if email does not match allowed admin', async () => {
    googleAuth.getAccessToken.mockReturnValue('valid-token');

    global.fetch.mockImplementation((url) => {
      if (url.includes('userinfo')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ email: 'student@tridorian.com' })
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const role = await checkUserRole({ testingMode: true, allowedAdmin: 'taylor@tridorian.com' });
    expect(role).toBe('student');
  });

  it('performs Drive capability check if testing mode is disabled', async () => {
    googleAuth.getAccessToken.mockReturnValue('valid-token');

    // Mock folder capabilities check
    global.fetch.mockImplementation((url) => {
      if (url.includes('userinfo')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ email: 'other@tridorian.com' })
        });
      }
      if (url.includes('files/1UTsC7YPjz72BiwqJDyJx6VydyHGgW160')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            capabilities: { canEdit: true }
          })
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const role = await checkUserRole({ testingMode: false });
    expect(role).toBe('admin');
  });
});
