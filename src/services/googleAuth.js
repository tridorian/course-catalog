/**
 * Google Identity Services (GIS) wrapper for OAuth2 flow.
 */

let tokenClient;
let accessToken = null;

export const initGoogleAuth = (clientId) => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => {
      try {
        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file',
          callback: (response) => {
            if (response.error !== undefined) {
              reject(response);
            }
            accessToken = response.access_token;
            resolve(response);
          },
        });
        resolve(true);
      } catch (err) {
        reject(err);
      }
    };
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

export const signIn = () => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) return reject('Auth not initialized');

    tokenClient.callback = (response) => {
      if (response.error !== undefined) {
        reject(response);
      }
      accessToken = response.access_token;
      resolve(response);
    };

    // Requesting a token
    tokenClient.requestAccessToken({ prompt: accessToken ? '' : 'select_account' });
  });
};

export const signOut = () => {
  if (accessToken) {
    window.google.accounts.oauth2.revoke(accessToken, () => {
      accessToken = null;
    });
  }
};

export const getAccessToken = () => accessToken;
