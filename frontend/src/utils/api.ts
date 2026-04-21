const API_URL = (import.meta as any).env?.VITE_API_URL || '';

export const api = {
  get: async (url: string) => {
    const res = await fetch(API_URL + url, { credentials: 'include' as any });
    if (!res.ok) throw new Error(await res.text());
    return { data: await res.json() };
  },
  post: async (url: string, data?: any) => {
    const res = await fetch(API_URL + url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
      credentials: 'include' as any
    });
    if (!res.ok) throw new Error(await res.text());
    return { data: await res.json() };
  },
  put: async (url: string, data?: any) => {
    const res = await fetch(API_URL + url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
      credentials: 'include' as any
    });
    if (!res.ok) throw new Error(await res.text());
    return { data: await res.json() };
  },
  delete: async (url: string) => {
    const res = await fetch(API_URL + url, { method: 'DELETE', credentials: 'include' as any });
    if (!res.ok) throw new Error(await res.text());
    return { data: await res.json() };
  }
};
