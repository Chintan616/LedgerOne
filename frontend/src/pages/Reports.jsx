import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { getSummary, getGstReport, getMonthly } from '../api/accounting'

const fmt = (val) =>
  `₹${Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const currentYear = new Date().getFullYear()
const YEARS = [currentYear, currentYear - 1, currentYear - 2]

export default function Reports() {
  const [year, setYear] = useState(currentYear)
  const [summary, setSummary] = useState(null)
  const [gst, setGst] = useState(null)
  const [monthly, setMonthly] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async (y) => {
    setLoading(true); setError('')
    try {
      const [sRes, gRes, mRes] = await Promise.all([getSummary(), getGstReport(y), getMonthly(y)])
      setSummary(sRes.data); setGst(gRes.data); setMonthly(mRes.data)
    } catch { setError('Failed to load reports.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load(year) }, [year])

  const maxIncome  = Math.max(...monthly.map(m => Number(m.revenue || 0)), 1)
  const maxExpense = Math.max(...monthly.map(m => Number(m.expenses || 0)), 1)
  const maxBar     = Math.max(maxIncome, maxExpense)

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">Reports</h1>
          <p className="text-sm text-gray-500 dark:text-[#8b90b4] mt-1">Financial insights, at a glance.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={year} onChange={e => setYear(Number(e.target.value))}
            className="px-3 py-2 text-sm rounded-lg bg-white dark:bg-[#132030] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/30"
          >
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-400 dark:text-[#8b90b4]">Loading reports...</div>
      ) : (
        <div className="space-y-6">

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SummaryCard label={`Income (${year})`} value={fmt(summary?.totalRevenue)} valueClass="text-green-600 dark:text-green-400" sub={`${summary?.paidInvoices || 0} paid invoices`} />
            <SummaryCard label={`Expenses (${year})`} value={fmt(summary?.totalExpenses)} valueClass="text-red-500 dark:text-red-400" sub={`${summary?.totalExpenseCount || 0} entries`} />
            <SummaryCard label="Net profit" value={fmt(summary?.netProfit)} valueClass={Number(summary?.netProfit || 0) >= 0 ? 'text-gray-900 dark:text-gray-100' : 'text-red-500 dark:text-red-400'} sub="Revenue − Expenses" />
          </div>

          {/* Two-column */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Bar chart */}
            <div className="lg:col-span-2 bg-white dark:bg-[#132030] rounded-2xl border border-gray-200 dark:border-white/[0.08] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Income vs expenses</h2>
                  <p className="text-xs text-gray-500 dark:text-[#8b90b4] mt-0.5">Monthly comparison</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-[#8b90b4]">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-700 dark:bg-blue-400" />Income</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-400 dark:bg-red-400/70" />Expense</span>
                </div>
              </div>
              <div className="flex items-end gap-2 h-64">
                {monthly.map((m, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-end justify-center gap-1">
                      <div
                        className="w-4 rounded-t-md bg-blue-700 dark:bg-blue-500 transition-all"
                        style={{ height: `${Math.max((Number(m.revenue || 0) / maxBar) * 220, 3)}px` }}
                        title={`Revenue: ${fmt(m.revenue)}`}
                      />
                      <div
                        className="w-4 rounded-t-md bg-red-400/70 dark:bg-red-400/60 transition-all"
                        style={{ height: `${Math.max((Number(m.expenses || 0) / maxBar) * 220, 3)}px` }}
                        title={`Expenses: ${fmt(m.expenses)}`}
                      />
                    </div>
                    <span className="text-[11px] text-gray-400 dark:text-[#8b90b4]">
                      {m.monthName?.charAt(0) + (m.monthName?.slice(1).toLowerCase() || '')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top clients / Invoice stats */}
            <div className="bg-white dark:bg-[#132030] rounded-2xl border border-gray-200 dark:border-white/[0.08] p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Invoice overview</h2>
              <div className="space-y-3">
                <StatRow label="Total invoices"  value={summary?.totalInvoices  ?? '—'} />
                <StatRow label="Paid"            value={summary?.paidInvoices   ?? '—'} valueClass="text-green-600 dark:text-green-400" />
                <StatRow label="Outstanding"     value={summary?.pendingInvoices ?? '—'} valueClass="text-amber-600 dark:text-amber-400" />
                <StatRow label="Overdue"         value={summary?.overdueInvoices ?? '—'} valueClass="text-red-500 dark:text-red-400" />
              </div>
              <div className="mt-6 pt-5 border-t border-gray-100 dark:border-white/[0.05]">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">GST summary — {year}</h2>
                <StatRow label="Taxable amount"  value={fmt(gst?.totalTaxableAmount)} />
                <StatRow label="GST collected"   value={fmt(gst?.totalGstCollected)} valueClass="text-blue-700 dark:text-blue-400" />
                <p className="text-[11px] text-gray-400 dark:text-[#8b90b4] mt-3">
                  Based on {gst?.paidInvoiceCount ?? 0} paid invoices. Consult a CA for GST filing.
                </p>
              </div>
            </div>
          </div>

          {/* Monthly table */}
          <div className="bg-white dark:bg-[#132030] rounded-2xl border border-gray-200 dark:border-white/[0.08] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.05]">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Monthly breakdown — {year}</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/70 dark:bg-white/[0.02]">
                  {['Month', 'Revenue', 'Expenses', 'Profit'].map((h, i) => (
                    <th key={h} className={`px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-[#8b90b4] ${i === 0 ? 'text-left' : 'text-right'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthly.map((m, i) => {
                  const profit = Number(m.profit || 0)
                  return (
                    <tr key={i} className="border-t border-gray-100 dark:border-white/[0.05] hover:bg-gray-50 dark:hover:bg-white/[0.03]">
                      <td className="px-6 py-3 font-medium text-gray-900 dark:text-gray-100">
                        {m.monthName?.charAt(0) + (m.monthName?.slice(1).toLowerCase() || '')}
                      </td>
                      <td className="px-6 py-3 text-right text-green-600 dark:text-green-400 font-medium">{fmt(m.revenue)}</td>
                      <td className="px-6 py-3 text-right text-red-500 dark:text-red-400">{fmt(m.expenses)}</td>
                      <td className={`px-6 py-3 text-right font-semibold ${profit >= 0 ? 'text-gray-900 dark:text-gray-100' : 'text-red-500 dark:text-red-400'}`}>
                        {fmt(m.profit)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
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

function StatRow({ label, value, valueClass }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-gray-600 dark:text-[#8b90b4]">{label}</span>
      <span className={`text-sm font-semibold ${valueClass || 'text-gray-900 dark:text-gray-100'}`}>{value}</span>
    </div>
  )
}
