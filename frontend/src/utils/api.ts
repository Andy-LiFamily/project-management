const API_URL = import.meta.env.VITE_API_URL || '';

interface ApiOptions {
  headers?: Record<string, string>;
  credentials?: boolean;
}

export const api = {
  get: async (url: string, opts?: ApiOptions) => {
    const token = localStorage.getItem('token');
    const res = await fetch(API_URL + url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(opts?.headers || {})
      }
    });
    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('未登录');
    }
    if (!res.ok) throw new Error(await res.text());
    return { data: await res.json() };
  },
  post: async (url: string, data?: any, opts?: ApiOptions) => {
    const token = localStorage.getItem('token');
    const isFormData = data instanceof FormData;
    const res = await fetch(API_URL + url, {
      method: 'POST',
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(opts?.headers || {})
      },
      body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
      credentials: opts?.credentials ? 'include' : undefined
    });
    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('未登录');
    }
    if (!res.ok) throw new Error(await res.text());
    return { data: await res.json() };
  },
  put: async (url: string, data?: any, opts?: ApiOptions) => {
    const token = localStorage.getItem('token');
    const isFormData = data instanceof FormData;
    const res = await fetch(API_URL + url, {
      method: 'PUT',
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(opts?.headers || {})
      },
      body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
      credentials: opts?.credentials ? 'include' : undefined
    });
    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('未登录');
    }
    if (!res.ok) throw new Error(await res.text());
    return { data: await res.json() };
  },
  delete: async (url: string, opts?: ApiOptions) => {
    const token = localStorage.getItem('token');
    const res = await fetch(API_URL + url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(opts?.headers || {})
      },
      credentials: opts?.credentials ? 'include' : undefined
    });
    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('未登录');
    }
    if (!res.ok) throw new Error(await res.text());
    return { data: await res.json() };
  }
};
