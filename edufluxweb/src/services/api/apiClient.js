import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
} from '../../utils/auth';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const isAuthRoute = (url) => url.startsWith('/auth/');

const getAuthErrorMessage = (data, status) => {
  if (!data) return `HTTP error! status: ${status}`;
  if (Array.isArray(data.message)) return data.message.join(', ');
  if (typeof data.message === 'string') return data.message;
  if (typeof data.error === 'string') return data.error;
  return `HTTP error! status: ${status}`;
};

const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${refreshToken}`,
      },
    });

    const data = response.headers
      .get('content-type')
      ?.includes('application/json')
      ? await response.json()
      : null;

    if (!response.ok) {
      throw new Error(data?.message || 'Refresh failed');
    }

    const nextAccessToken = data?.accessToken;
    const nextRefreshToken = data?.refreshToken;

    if (!nextAccessToken) {
      throw new Error('No access token in refresh response');
    }

    setAuthTokens({
      accessToken: nextAccessToken,
      refreshToken: nextRefreshToken || refreshToken,
    });

    return nextAccessToken;
  } catch {
    clearAuthTokens();
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    return null;
  }
};

const request = async (url, options = {}) => {
  let token = getAccessToken();

  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let body = options.body;

  if (body && !(body instanceof FormData)) {
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    if (typeof body === 'object') {
      body = JSON.stringify(body);
    }
  }

  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
    cache: options.cache || 'no-store',
    body,
  });

  const isJson = response.headers
    .get('content-type')
    ?.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (response.status === 401 && !isAuthRoute(url)) {
    const retriedToken = await refreshAccessToken();
    if (retriedToken) {
      const retryHeaders = {
        ...options.headers,
        Authorization: `Bearer ${retriedToken}`,
      };

      let retryBody = options.body;
      if (retryBody && !(retryBody instanceof FormData)) {
        if (!retryHeaders['Content-Type']) {
          retryHeaders['Content-Type'] = 'application/json';
        }
        if (typeof retryBody === 'object') {
          retryBody = JSON.stringify(retryBody);
        }
      }

      const retryResponse = await fetch(`${BASE_URL}${url}`, {
        ...options,
        headers: retryHeaders,
        cache: options.cache || 'no-store',
        body: retryBody,
      });

      const retryIsJson = retryResponse.headers
        .get('content-type')
        ?.includes('application/json');
      const retryData = retryIsJson ? await retryResponse.json() : null;

      if (!retryResponse.ok) {
        const retryError = new Error(
          getAuthErrorMessage(retryData, retryResponse.status),
        );
        retryError.status = retryResponse.status;
        retryError.data = retryData;
        throw retryError;
      }

      return retryData;
    }
  }

  if (!response.ok) {
    const error = new Error(getAuthErrorMessage(data, response.status));
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const apiClient = {
  get: (url, options = {}) => request(url, { ...options, method: 'GET' }),
  post: (url, body, options = {}) =>
    request(url, { ...options, method: 'POST', body }),
  patch: (url, body, options = {}) =>
    request(url, { ...options, method: 'PATCH', body }),
  delete: (url, options = {}) => request(url, { ...options, method: 'DELETE' }),
};

export const forgotPassword = async (email) => {
  return apiClient.post('/auth/forgot-password', { email });
};

export const resetPassword = async (email, token, password) => {
  return apiClient.post('/auth/reset-password', { email, token, password });
};

export const getMyProfile = async () => {
  return apiClient.get('/users/me');
};

export const updateMyProfile = async (data) => {
  return apiClient.patch('/users/me', data);
};

export const changeMyPassword = async (data) => {
  return apiClient.patch('/users/me/password', data);
};

export const uploadMyAvatar = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post('/users/me/avatar', formData);
};
