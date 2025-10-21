export const API_BASE = (import.meta?.env?.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

export const apiUrl = (path = '') => {
  if (!path) return API_BASE;
  return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
};
