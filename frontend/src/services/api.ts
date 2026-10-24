import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '';
export const api = axios.create({ baseURL, timeout: 30000 });

api.interceptors.request.use(async (config) => {
  try {
    const clerk = (window as any).Clerk;
    if (clerk?.session) {
      const token = await clerk.session.getToken();
      if (token) { if (!config.headers) config.headers = {} as any; (config.headers as any).Authorization = `Bearer ${token}`; }
    }
  } catch {}
  return config;
});

export const unwrap = (p: Promise<any>) => p.then(r => r.data).catch(e => { throw e?.response?.data || e; });
