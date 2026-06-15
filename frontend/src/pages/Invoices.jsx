import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { getInvoices, updateInvoiceStatus, deleteInvoice, downloadInvoicePdf } from '../api/invoices'

const STATUS_STYLES = {
  DRAFT:   'bg-gray-100 text-gray-600',
  SENT:    'bg-blue-100 text-blue-700',
  PAID:    'bg-green-100 text-green-700',
  OVERDUE: 'bg-red-100 text-red-700',
}

const NEXT_STATUS = {
  DRAFT:   ['SENT'],
  SENT:    ['PAID', 'OVERDUE'],
  PAID:    [],
  OVERDUE: ['PAID'],
}

const fmt = (val) =>
  val != null ? `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'

export default function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const navigate = useNavigate()

  const load = async () => {
    try {
      setLoading(true)
      const res = await getInvoices()
      setInvoices(res.data)
    } catch {
      setError('Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleStatusChange = async (id, status) => {
    setActionLoading(id + status)
    try {
      await updateInvoiceStatus(id, status)
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Status update failed')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this invoice?')) return
    try {
      await deleteInvoice(id)
      setInvoices((prev) => prev.filter((inv) => inv.id !== id))
    } catch (err) {
      setError(err.response?.data?.error || 'Delete failed')
    }
  }

  const handleDownload = async (inv) => {
    setActionLoading(inv.id + 'pdf')
    try {
      await downloadInvoicePdf(inv.id, inv.invoiceNumber)
    } catch {
      setError('PDF download failed')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage your invoices</p>
        </div>
        <button
          onClick={() => navigate('/invoices/new')}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Invoice
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center justify-between">
          {error}
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 ml-4">✕</button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 font-medium">No invoices yet</p>
          <p className="text-gray-400 text-sm mt-1">Create your first invoice to get started</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice #</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Issue Date</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-gray-900 font-semibold">
                    {inv.invoiceNumber}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{inv.client?.name}</p>
                    <p className="text-xs text-gray-400">{inv.client?.companyName}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{inv.issueDate}</td>
                  <td className="px-6 py-4 text-gray-600">{inv.dueDate}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900">{fmt(inv.totalAmount)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[inv.status]}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {/* Status transitions */}
                      {NEXT_STATUS[inv.status]?.map((next) => (
                        <button
                          key={next}
                          onClick={() => handleStatusChange(inv.id, next)}
                          disabled={actionLoading === inv.id + next}
                          className="text-xs px-2 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium disabled:opacity-50"
                        >
                          {next === 'PAID' ? 'Mark Paid' : next === 'SENT' ? 'Mark Sent' : 'Mark Overdue'}
                        </button>
                      ))}

                      {/* Download PDF */}
                      <button
                        onClick={() => handleDownload(inv)}
                        disabled={actionLoading === inv.id + 'pdf'}
                        title="Download PDF"
                        className="text-gray-500 hover:text-indigo-600 disabled:opacity-50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>

                      {/* Edit (DRAFT only) */}
                      {inv.status === 'DRAFT' && (
                        <button
                          onClick={() => navigate(`/invoices/${inv.id}/edit`)}
                          className="text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          Edit
                        </button>
                      )}

                      {/* Delete */}
                      {inv.status !== 'PAID' && (
                        <button
                          onClick={() => handleDelete(inv.id)}
                          className="text-red-500 hover:text-red-700 font-medium"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  )
}
