import api from './auth'

export const getExpenses = () => api.get('/accounting/expenses')
export const createExpense = (data) => api.post('/accounting/expenses', data)
export const updateExpense = (id, data) => api.put(`/accounting/expenses/${id}`, data)
export const deleteExpense = (id) => api.delete(`/accounting/expenses/${id}`)

export const getSummary = () => api.get('/accounting/summary')
export const getGstReport = (year) => api.get('/accounting/gst-report', { params: { year } })
export const getMonthly = (year) => api.get('/accounting/monthly', { params: { year } })
