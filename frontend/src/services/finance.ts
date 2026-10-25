import { api } from './api';

export const financeApi = {
  users: () => api.get('/api/users').then(r => r.data),
  createUser: (d: any) => api.post('/api/users', d).then(r => r.data),
  transactions: (params?: any) => api.get('/api/transactions', { params }).then(r => r.data),
  transactionsWithUser: (params?: any) => api.get('/api/transactions/with-user', { params }).then(r => r.data),
  createTransaction: (d: any) => api.post('/api/transactions', d).then(r => r.data),
  updateTransaction: (id: number, d: any) => api.put(`/api/transactions/${id}`, d).then(r => r.data),
  deleteTransaction: (id: number) => api.delete(`/api/transactions/${id}`).then(r => r.data),
  exportCsv: (params?: any) => api.post('/api/transactions/export', null, { params, responseType: 'text' }).then(r => r.data),
  importCsv: (text: string) => api.post('/api/transactions/import', null, { params: { csv_text: text } }).then(r => r.data),
  budgets: (params?: any) => api.get('/api/budgets', { params }).then(r => r.data),
  createBudget: (d: any) => api.post('/api/budgets', d).then(r => r.data),
  updateBudget: (id: number, d: any) => api.put(`/api/budgets/${id}`, d).then(r => r.data),
  deleteBudget: (id: number) => api.delete(`/api/budgets/${id}`).then(r => r.data),
  budgetVsActual: (month?: string) => api.get('/api/budgets/vs-actual', { params: { month } }).then(r => r.data),
  dashboardSummary: () => api.get('/api/dashboard/summary').then(r => r.data),
  insights: () => api.get('/api/insights').then(r => r.data),
  categories: (type?: string) => api.get('/api/categories', { params: { type } }).then(r => r.data),
  createCategory: (d: any) => api.post('/api/categories', d).then(r => r.data),
};
