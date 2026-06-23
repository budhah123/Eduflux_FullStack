const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const request = async (url, options = {}) => {
  const token = sessionStorage.getItem('accessToken');
  
  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Auto set content-type to application/json if not sending FormData
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const errMsg = data 
      ? (Array.isArray(data.message) ? data.message.join(', ') : data.message) 
      : `HTTP error! status: ${response.status}`;
    throw new Error(errMsg || 'Something went wrong');
  }

  return data;
};

export const apiClient = {
  get: (url, options = {}) => request(url, { ...options, method: 'GET' }),
  post: (url, body, options = {}) => request(url, { ...options, method: 'POST', body }),
  patch: (url, body, options = {}) => request(url, { ...options, method: 'PATCH', body }),
  delete: (url, options = {}) => request(url, { ...options, method: 'DELETE' }),
};
