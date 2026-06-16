import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import { getInvoices } from '../api/invoices'
import { getSummary } from '../api/accounting'

const fmt = (val) =>
  `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [recentInvoices, setRecentInvoices] = useState([])

  useEffect(() => {
    Promise.all([getInvoices(), getSummary()])
      .then(([invRes, sumRes]) => {
        const invoices = invRes.data
        setStats(sumRes.data)
        setRecentInvoices(invoices.slice(0, 5))
      })
      .catch(() => {})
  }, [])

  const STATUS_STYLES = {
    DRAFT:   'bg-gray-100 text-gray-600',
    SENT:    'bg-blue-100 text-blue-700',
    PAID:    'bg-green-100 text-green-700',
    OVERDUE: 'bg-red-100 text-red-700',
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-sm text-gray-500 mt-1">Here's your business at a glance.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          label="Total Revenue"
          value={fmt(stats?.totalRevenue)}
          icon="💰"
          color="green"
        />
        <StatCard
          label="Outstanding Amount"
          value={fmt(stats?.totalOutstandingAmount)}
          icon="⏳"
          color="blue"
        />
        <StatCard
          label="Total Clients"
          value={stats?.totalClients ?? '—'}
          icon="👥"
          color="indigo"
          onClick={() => navigate('/clients')}
        />
        <StatCard
          label="Paid Rate"
          value={stats ? `${(((stats.totalRevenue || 0) / ((stats.totalRevenue || 0) + (stats.totalOutstandingAmount || 0)) || 0) * 100).toFixed(0)}%` : '—'}
          icon="📈"
          color="purple"
        />
        <StatCard
          label="Unpaid Invoices"
          value={stats?.unpaidInvoices ?? '—'}
          icon="⚠️"
          color="red"
          onClick={() => navigate('/invoices')}
        />
      </div>

      {/* Recent Invoices */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Recent Invoices</h2>
          <button
            onClick={() => navigate('/invoices')}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            View all
          </button>
        </div>

        {recentInvoices.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            No invoices yet.{' '}
            <button
              onClick={() => navigate('/invoices/new')}
              className="text-indigo-600 hover:underline"
            >
              Create your first invoice
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-mono text-xs font-semibold text-gray-800">
                    {inv.invoiceNumber}
                  </td>
                  <td className="px-6 py-3 text-gray-700">{inv.client?.name}</td>
                  <td className="px-6 py-3 text-gray-500">{inv.dueDate}</td>
                  <td className="px-6 py-3 font-semibold text-gray-900">{fmt(inv.totalAmount)}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[inv.status]}`}>
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  )
}

function StatCard({ label, value, icon, color, onClick }) {
  const colorMap = {
    green:  'bg-green-50 text-green-700',
    blue:   'bg-blue-50 text-blue-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    purple: 'bg-purple-50 text-purple-700',
    red:    'bg-red-50 text-red-700',
  }

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-gray-200 p-5 ${onClick ? 'cursor-pointer hover:border-indigo-300 transition-colors' : ''}`}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
        <span className={`text-lg p-1.5 rounded-lg ${colorMap[color]}`}>{icon}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}
