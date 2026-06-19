import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { getInvoices, updateInvoiceStatus, deleteInvoice, downloadInvoicePdf, getInvoicePdfUrl } from '../api/invoices'

const STATUS_PILL = {
  PAID:    'bg-green-500/15 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/30',
  SENT:    'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30',
  OVERDUE: 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30',
  DRAFT:   'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/[0.08]',
}

const STATUS_FILTERS = ['ALL', 'PAID', 'SENT', 'OVERDUE', 'DRAFT']
const FILTER_LABELS  = { ALL: 'All', PAID: 'Paid', SENT: 'Pending', OVERDUE: 'Overdue', DRAFT: 'Draft' }

const NEXT_STATUS = { DRAFT: ['SENT'], SENT: ['PAID', 'OVERDUE'], PAID: [], OVERDUE: ['PAID'] }

const fmt = (val) =>
  val != null ? `₹${Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—'

export default function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [modalUrl, setModalUrl] = useState(null)
  const navigate = useNavigate()

  const load = async () => {
    try { setLoading(true); const res = await getInvoices(); setInvoices(res.data) }
    catch { setError('Failed to load invoices') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleStatusChange = async (id, status) => {
    setActionLoading(id + status)
    try { await updateInvoiceStatus(id, status); load() }
    catch (err) { setError(err.response?.data?.error || 'Status update failed') }
    finally { setActionLoading(null) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this invoice?')) return
    try { await deleteInvoice(id); setInvoices((p) => p.filter((i) => i.id !== id)) }
    catch (err) { setError(err.response?.data?.error || 'Delete failed') }
  }

  const handleDownload = async (inv) => {
    setActionLoading(inv.id + 'pdf')
    try { await downloadInvoicePdf(inv.id, inv.invoiceNumber) }
    catch { setError('PDF download failed') }
    finally { setActionLoading(null) }
  }

  const handleView = async (inv) => {
    setActionLoading(inv.id + 'view')
    try { setModalUrl(await getInvoicePdfUrl(inv.id)) }
    catch { setError('PDF load failed') }
    finally { setActionLoading(null) }
  }

  const closeModal = () => { if (modalUrl) { URL.revokeObjectURL(modalUrl); setModalUrl(null) } }

  const totalBilled   = invoices.reduce((s, i) => s + Number(i.totalAmount || 0), 0)
  const totalCollected = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + Number(i.totalAmount || 0), 0)
  const totalOutstanding = invoices.filter(i => ['SENT', 'OVERDUE'].includes(i.status)).reduce((s, i) => s + Number(i.totalAmount || 0), 0)

  const filtered = invoices
    .filter(i => statusFilter === 'ALL' || i.status === statusFilter)
    .filter(i => {
      if (!search) return true
      const t = search.toLowerCase()
      return i.invoiceNumber?.toLowerCase().includes(t) || i.client?.name?.toLowerCase().includes(t)
    })

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">Invoices</h1>
          <p className="text-sm text-gray-500 dark:text-[#8b90b4] mt-1">Track everything you've billed.</p>
        </div>
        <button
          onClick={() => navigate('/invoices/new')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-white
            bg-blue-700 dark:bg-[#2563eb] hover:opacity-90 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create invoice
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <SummaryCard label="Total billed" value={fmt(totalBilled)} sub={`${invoices.length} invoices`} />
        <SummaryCard label="Collected"    value={fmt(totalCollected)} valueClass="text-green-600 dark:text-green-400" />
        <SummaryCard label="Outstanding"  value={fmt(totalOutstanding)} valueClass="text-amber-600 dark:text-amber-400" />
      </div>

      {/* Search + filter pills */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-[#8b90b4]"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text" placeholder="Search invoice or client..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg
              bg-white dark:bg-[#132030]
              border border-gray-200 dark:border-white/[0.08]
              text-gray-900 dark:text-gray-100
              placeholder-gray-400 dark:placeholder-[#8b90b4]
              focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 dark:focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300'
                  : 'text-gray-500 dark:text-[#8b90b4] hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-white/[0.05]'
              }`}
            >
              {FILTER_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 rounded-lg text-sm flex items-center justify-between">
          {error}
          <button onClick={() => setError('')} className="ml-4 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-400 dark:text-[#8b90b4]">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#132030] rounded-2xl border border-gray-200 dark:border-white/[0.08]">
          <p className="text-gray-500 dark:text-[#8b90b4] font-medium">No invoices found</p>
          <p className="text-gray-400 dark:text-[#8b90b4]/70 text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#132030] rounded-2xl border border-gray-200 dark:border-white/[0.08] shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/70 dark:bg-white/[0.02]">
                {['Invoice #', 'Client', 'Issued', 'Due', 'Amount', 'Status', ''].map((h, i) => (
                  <th key={i} className={`px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-[#8b90b4] ${i >= 4 ? 'text-right' : 'text-left'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id} className="border-t border-gray-100 dark:border-white/[0.05] hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
                  <td className="px-6 py-4 font-mono text-[13px] font-semibold text-gray-800 dark:text-gray-200">
                    {inv.invoiceNumber}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{inv.client?.name}</p>
                    {inv.client?.companyName && (
                      <p className="text-xs text-gray-400 dark:text-[#8b90b4]">{inv.client.companyName}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-[#8b90b4]">{inv.issueDate}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-[#8b90b4]">{inv.dueDate}</td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-gray-100">
                    {fmt(inv.totalAmount)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide ${STATUS_PILL[inv.status] || STATUS_PILL.DRAFT}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {NEXT_STATUS[inv.status]?.map((next) => (
                        <button
                          key={next}
                          onClick={() => handleStatusChange(inv.id, next)}
                          disabled={actionLoading === inv.id + next}
                          className="text-xs px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-500/25 font-medium disabled:opacity-50 transition-colors"
                        >
                          {next === 'PAID' ? 'Mark Paid' : next === 'SENT' ? 'Mark Sent' : 'Mark Overdue'}
                        </button>
                      ))}
                      <button onClick={() => handleView(inv)} disabled={actionLoading === inv.id + 'view'}
                        title="View PDF" className="text-gray-400 dark:text-[#8b90b4] hover:text-blue-700 dark:hover:text-blue-400 disabled:opacity-50">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDownload(inv)} disabled={actionLoading === inv.id + 'pdf'}
                        title="Download PDF" className="text-gray-400 dark:text-[#8b90b4] hover:text-blue-700 dark:hover:text-blue-400 disabled:opacity-50">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                      {inv.status === 'DRAFT' && (
                        <button onClick={() => navigate(`/invoices/${inv.id}/edit`)}
                          className="text-xs font-medium text-blue-700 dark:text-blue-400 hover:underline">Edit</button>
                      )}
                      {inv.status !== 'PAID' && (
                        <button onClick={() => handleDelete(inv.id)}
                          className="text-xs font-medium text-red-500 dark:text-red-400 hover:underline">Delete</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PDF Modal */}
      {modalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white dark:bg-[#132030] rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-white/[0.08]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/[0.06]">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Invoice Viewer</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 bg-gray-100 dark:bg-[#0d1526] p-4">
              <iframe src={modalUrl} className="w-full h-full rounded-lg border border-gray-200 dark:border-white/[0.08]" title="PDF Viewer" />
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

function SummaryCard({ label, value, sub, valueClass }) {
  return (
    <div className="bg-white dark:bg-[#132030] rounded-2xl border border-gray-200 dark:border-white/[0.08] p-5 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-[#8b90b4] mb-2">{label}</p>
      <p className={`text-2xl font-semibold tracking-tight ${valueClass || 'text-gray-900 dark:text-gray-100'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-[#8b90b4] mt-1">{sub}</p>}
    </div>
  )
}
