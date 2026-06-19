import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import { getInvoices } from '../api/invoices'
import { getSummary, getMonthly } from '../api/accounting'

const fmt = (val) =>
  `₹${Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const STATUS_PILL = {
  PAID:    'bg-green-500/15 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/30',
  SENT:    'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30',
  OVERDUE: 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30',
  DRAFT:   'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/[0.08]',
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [monthly, setMonthly] = useState([])
  const year = new Date().getFullYear()

  useEffect(() => {
    Promise.all([getInvoices(), getSummary(), getMonthly(year)])
      .then(([invRes, sumRes, monRes]) => {
        setInvoices(invRes.data)
        setStats(sumRes.data)
        setMonthly(monRes.data)
      })
      .catch(() => {})
  }, [])

  const recentInvoices = invoices.slice(0, 5)

  const collected = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + Number(i.totalAmount || 0), 0)
  const pending   = invoices.filter(i => i.status === 'SENT').reduce((s, i) => s + Number(i.totalAmount || 0), 0)
  const overdue   = invoices.filter(i => i.status === 'OVERDUE').reduce((s, i) => s + Number(i.totalAmount || 0), 0)
  const cashTotal = collected + pending + overdue || 1

  const last6 = (() => {
    const now = new Date()
    const result = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const m = d.getMonth() + 1
      const found = monthly.find(r => Number(r.month ?? r.monthNumber ?? 0) === m || r.monthName === MONTH_NAMES[m - 1].toUpperCase())
      result.push({
        label: MONTH_NAMES[d.getMonth()],
        income: Number(found?.revenue || 0),
        expense: Number(found?.expenses || 0),
      })
    }
    return result
  })()

  const maxBar = Math.max(...last6.map(m => Math.max(m.income, m.expense)), 1)

  const paidRate = stats
    ? Math.round(((stats.totalRevenue || 0) / ((stats.totalRevenue || 0) + (stats.totalOutstandingAmount || 0) || 1)) * 100)
    : 0

  return (
    <Layout>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-sm text-gray-500 dark:text-[#8b90b4] mt-1">Here's your business at a glance.</p>
        </div>
        <button
          onClick={() => navigate('/invoices/new')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-white
            bg-blue-700 dark:bg-[#2563eb] hover:opacity-90 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New invoice
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
        <StatCard
          label="Total Revenue"
          value={fmt(stats?.totalRevenue)}
          icon={<RupeeIcon />}
          tint="blue"
        />
        <StatCard
          label="Outstanding"
          value={fmt(stats?.totalOutstandingAmount)}
          icon={<ClockIcon />}
          tint="amber"
          sub={`${stats?.unpaidInvoices ?? 0} invoices`}
        />
        <StatCard
          label="Total Clients"
          value={stats?.totalClients ?? '—'}
          icon={<UsersIcon />}
          tint="cyan"
          onClick={() => navigate('/clients')}
        />
        <StatCard
          label="Paid Rate"
          value={`${paidRate}%`}
          icon={<TrendIcon />}
          tint="blue"
        />
        <StatCard
          label="Unpaid"
          value={stats?.unpaidInvoices ?? '—'}
          icon={<AlertIcon />}
          tint="red"
          onClick={() => navigate('/invoices')}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Income vs Expenses bar chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#132030] rounded-2xl border border-gray-200 dark:border-white/[0.08] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Income vs expenses</h2>
              <p className="text-xs text-gray-500 dark:text-[#8b90b4] mt-0.5">Last 6 months</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-[#8b90b4]">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-700 dark:bg-blue-400" />
                Income
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-gray-300 dark:bg-white/25" />
                Expense
              </span>
            </div>
          </div>
          <div className="flex items-end gap-2 h-40">
            {last6.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center gap-1">
                  <div
                    className="w-3 rounded-t-md bg-blue-700 dark:bg-blue-500 transition-all"
                    style={{ height: `${Math.max((m.income / maxBar) * 140, 3)}px` }}
                    title={fmt(m.income)}
                  />
                  <div
                    className="w-3 rounded-t-md bg-gray-200 dark:bg-white/20 transition-all"
                    style={{ height: `${Math.max((m.expense / maxBar) * 140, 3)}px` }}
                    title={fmt(m.expense)}
                  />
                </div>
                <span className="text-[11px] text-gray-400 dark:text-[#8b90b4]">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cash flow */}
        <div className="bg-white dark:bg-[#132030] rounded-2xl border border-gray-200 dark:border-white/[0.08] p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Cash flow</h2>
          <p className="text-xs text-gray-500 dark:text-[#8b90b4] mb-5">This quarter</p>
          <div className="space-y-4">
            <CashRow label="Collected" value={fmt(collected)} amount={collected} total={cashTotal} color="bg-green-500" />
            <CashRow label="Pending"   value={fmt(pending)}   amount={pending}   total={cashTotal} color="bg-amber-400" />
            <CashRow label="Overdue"   value={fmt(overdue)}   amount={overdue}   total={cashTotal} color="bg-red-500" />
          </div>
        </div>
      </div>

      {/* Recent invoices */}
      <div className="bg-white dark:bg-[#132030] rounded-2xl border border-gray-200 dark:border-white/[0.08] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/[0.05]">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Recent invoices</h2>
          <button
            onClick={() => navigate('/invoices')}
            className="text-sm text-blue-700 dark:text-blue-400 hover:underline font-medium flex items-center gap-1"
          >
            View all
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
        </div>
        {recentInvoices.length === 0 ? (
          <div className="py-14 text-center text-sm text-gray-400 dark:text-[#8b90b4]">
            No invoices yet.{' '}
            <button onClick={() => navigate('/invoices/new')} className="text-blue-700 dark:text-blue-400 hover:underline">
              Create your first invoice
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/70 dark:bg-white/[0.02]">
                {['Invoice', 'Client', 'Due', 'Amount', 'Status'].map((h, i) => (
                  <th key={h} className={`px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-[#8b90b4] ${i >= 3 ? 'text-right' : 'text-left'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentInvoices.map((inv) => (
                <tr key={inv.id} className="border-t border-gray-100 dark:border-white/[0.05] hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
                  <td className="px-6 py-3.5 font-mono text-[13px] font-semibold text-gray-800 dark:text-gray-200">
                    {inv.invoiceNumber}
                  </td>
                  <td className="px-6 py-3.5 text-gray-700 dark:text-gray-300">{inv.client?.name}</td>
                  <td className="px-6 py-3.5 text-gray-500 dark:text-[#8b90b4]">{inv.dueDate}</td>
                  <td className="px-6 py-3.5 text-right font-semibold text-gray-900 dark:text-gray-100">
                    {fmt(inv.totalAmount)}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide ${STATUS_PILL[inv.status] || STATUS_PILL.DRAFT}`}>
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

function StatCard({ label, value, icon, tint, sub, onClick }) {
  const tintMap = {
    blue:   'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10',
    amber:  'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10',
    cyan:   'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10',

    red:    'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10',
  }
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden bg-white dark:bg-[#132030] rounded-2xl border border-gray-200 dark:border-white/[0.08] p-5 shadow-sm
        ${onClick ? 'cursor-pointer hover:border-blue-300 dark:hover:border-blue-500/40 transition-colors' : ''}`}
    >
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-40 blur-2xl ${tintMap[tint]?.split(' ')[1] || ''}`} />
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-[#8b90b4]">{label}</p>
        <span className={`p-1.5 rounded-lg ${tintMap[tint] || ''}`}>{icon}</span>
      </div>
      <p className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">{value}</p>
      {sub && (
        <p className="text-xs mt-1 text-gray-500 dark:text-[#8b90b4]">{sub}</p>
      )}
    </div>
  )
}

function CashRow({ label, value, amount, total, color }) {
  const pct = Math.round((amount / total) * 100)
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 dark:bg-white/10">
        <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function RupeeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
function ClockIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
function UsersIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
function TrendIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  )
}
function AlertIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
}
