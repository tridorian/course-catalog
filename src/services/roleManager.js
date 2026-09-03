import { getAccessToken } from './googleAuth';
import { APP_CONFIG } from '../config';

/**
 * Checks the current user's role.
 * @param {Object} configOverrides - Optional configuration overrides.
 * @returns {Promise<string>} - Returns 'admin' or 'student'.
 */
export async function checkUserRole(configOverrides = {}) {
  const config = {
    testingMode: true,
    allowedAdmin: "taylor@tridorian.com",
    ...configOverrides
  };

  const token = getAccessToken();
  if (!token) {
    return 'student';
  }

  try {
    if (config.testingMode) {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }

      const userInfo = await response.json();
      const isAdmin = (config.allowedAdmin && userInfo.email === config.allowedAdmin) ||
        (Array.isArray(APP_CONFIG?.adminEmails) && APP_CONFIG.adminEmails.includes(userInfo.email));

      if (isAdmin) {
        return 'admin';
      }
      return 'student';
    } else {
      const folderId = '1UTsC7YPjz72BiwqJDyJx6VydyHGgW160';
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}?fields=capabilities&supportsAllDrives=true`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch folder capabilities');
      }

      const folderInfo = await response.json();
      if (folderInfo.capabilities && folderInfo.capabilities.canEdit) {
        return 'admin';
      }
      return 'student';
    }
  } catch (error) {
    // Return student role gracefully without noisy logs in test/offline environments
    return 'student';
  }
}
