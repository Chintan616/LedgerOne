import api from './auth'

export const getInvoices = () => api.get('/invoices')
export const getInvoice = (id) => api.get(`/invoices/${id}`)
export const createInvoice = (data) => api.post('/invoices', data)
export const updateInvoice = (id, data) => api.put(`/invoices/${id}`, data)
export const updateInvoiceStatus = (id, status) =>
  api.patch(`/invoices/${id}/status`, { status })
export const deleteInvoice = (id) => api.delete(`/invoices/${id}`)
export const downloadInvoicePdf = async (id, invoiceNumber) => {
  const res = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' })
  const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `${invoiceNumber}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}

export const getInvoicePdfUrl = async (id) => {
  const res = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' })
  return URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
}
