import { api } from './api';

export const dbApi = {
  schema: () => api.get('/api/database/schema').then(r => r.data),
  tables: () => api.get('/api/database/tables').then(r => r.data),
  tableRows: (table: string, limit = 50, offset = 0) => api.get(`/api/database/tables/${table}/rows`, { params: { limit, offset } }).then(r => r.data),
  tableSchema: (table: string) => api.get(`/api/database/tables/${table}/schema`).then(r => r.data),
  triggers: () => api.get('/api/database/triggers').then(r => r.data),
  views: () => api.get('/api/database/views').then(r => r.data),
  indexes: () => api.get('/api/database/indexes').then(r => r.data),
  mongoCollections: () => api.get('/api/database/mongo/collections').then(r => r.data),
  mongoRows: (collection: string, limit = 50) => api.get(`/api/database/mongo/collections/${collection}/rows`, { params: { limit } }).then(r => r.data),
  executeSql: (payload: any) => api.post('/api/query/sql/execute', payload).then(r => r.data),
  executeMongo: (payload: any) => api.post('/api/query/mongodb/execute', payload).then(r => r.data),
  history: (limit = 50) => api.get('/api/query/history', { params: { limit } }).then(r => r.data),
  categories: (type?: string) => api.get('/api/categories', { params: type ? { type } : {} }).then(r => r.data),
  createCategory: (payload: any) => api.post('/api/categories', payload).then(r => r.data),
};
