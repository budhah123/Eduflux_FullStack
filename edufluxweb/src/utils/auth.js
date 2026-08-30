const STORAGE_KEYS = {
  accessToken: 'accessToken',
  refreshToken: 'refreshToken',
};

export const AUTH_STORAGE_KEYS = STORAGE_KEYS;

export const getStoredToken = (key) => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(key) || localStorage.getItem(key);
};

export const getAccessToken = () => getStoredToken(STORAGE_KEYS.accessToken);
export const getRefreshToken = () => getStoredToken(STORAGE_KEYS.refreshToken);

export const setAuthTokens = ({ accessToken, refreshToken }) => {
  if (typeof window === 'undefined') return;

  if (accessToken) {
    sessionStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
    localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
  }

  if (refreshToken) {
    sessionStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
    localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
  }
};

export const clearAuthTokens = () => {
  if (typeof window === 'undefined') return;

  Object.values(STORAGE_KEYS).forEach((key) => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  });
};

export const decodeTokenPayload = (token) => {
  if (!token) return null;

  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(
      decodeURIComponent(
        window
          .atob(base64)
          .split('')
          .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
          .join(''),
      ),
    );

    const expiresAt = payload.exp ? payload.exp * 1000 : null;
    if (expiresAt && expiresAt <= Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
};

export const getAuthHeaders = (token) => {
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};
