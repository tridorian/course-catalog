import { getAccessToken } from './googleAuth';

/**
 * Checks the current user's role.
 * @param {Object} configOverrides - Optional configuration overrides.
 * @returns {Promise<string>} - Returns 'admin' or 'student'.
 */
export async function checkUserRole(configOverrides = {}) {
  console.log('checkUserRole trace:', new Error().stack);
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
      if (userInfo.email === config.allowedAdmin) {
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
    console.error('Error checking user role:', error);
    return 'student';
  }
}
