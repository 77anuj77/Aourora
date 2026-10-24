import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '';
export const api = axios.create({ baseURL, timeout: 30000 });

export const unwrap = (p: Promise<any>) => p.then(r => r.data).catch(e => { throw e?.response?.data || e; });
