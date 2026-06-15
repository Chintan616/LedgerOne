import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { getSummary, getGstReport, getMonthly } from '../api/accounting'

const fmt = (val) =>
  `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

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
    setLoading(true)
    setError('')
    try {
      const [sRes, gRes, mRes] = await Promise.all([
        getSummary(),
        getGstReport(y),
        getMonthly(y),
      ])
      setSummary(sRes.data)
      setGst(gRes.data)
      setMonthly(mRes.data)
    } catch (err) {
      setError('Failed to load reports. Make sure the Accounting Service is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(year) }, [year])

  const maxRevenue = Math.max(...monthly.map((m) => Number(m.revenue || 0)), 1)

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Financial overview and analytics</p>
        </div>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {YEARS.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading reports...</div>
      ) : (
        <div className="space-y-6">

          {/* ── Summary Cards ───────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              label="Total Revenue"
              value={fmt(summary?.totalRevenue)}
              sub={`${summary?.paidInvoices || 0} paid invoices`}
              color="green"
            />
            <SummaryCard
              label="Total Expenses"
              value={fmt(summary?.totalExpenses)}
              sub={`${summary?.totalExpenseCount || 0} entries`}
              color="red"
            />
            <SummaryCard
              label="Net Profit"
              value={fmt(summary?.netProfit)}
              sub="Revenue − Expenses"
              color={Number(summary?.netProfit || 0) >= 0 ? 'green' : 'red'}
            />
            <SummaryCard
              label="GST Collected"
              value={fmt(summary?.totalGstCollected)}
              sub={`FY ${year}`}
              color="indigo"
            />
          </div>

          {/* ── Invoice Stats ────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatPill label="Total Invoices"  value={summary?.totalInvoices  ?? '—'} />
            <StatPill label="Paid"            value={summary?.paidInvoices   ?? '—'} color="green" />
            <StatPill label="Outstanding"     value={summary?.pendingInvoices ?? '—'} color="blue" />
            <StatPill label="Overdue"         value={summary?.overdueInvoices ?? '—'} color="red" />
          </div>

          {/* ── Monthly Revenue Chart ────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-6">
              Monthly Revenue — {year}
            </h2>
            <div className="flex items-end gap-2 h-40">
              {monthly.map((m, i) => {
                const height = (Number(m.revenue || 0) / maxRevenue) * 100
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="relative w-full">
                      <div
                        className="w-full bg-indigo-500 rounded-t transition-all duration-300 group-hover:bg-indigo-600"
                        style={{ height: `${Math.max(height, 2)}px`, minHeight: '2px' }}
                        title={`${MONTH_NAMES[i]}: ${fmt(m.revenue)}`}
                      />
                    </div>
                    <span className="text-xs text-gray-400">{MONTH_NAMES[i]}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Monthly Breakdown Table ──────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Monthly Breakdown — {year}</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Month</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Expenses</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {monthly.map((m, i) => {
                  const profit = Number(m.profit || 0)
                  return (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium text-gray-900">
                        {m.monthName.charAt(0) + m.monthName.slice(1).toLowerCase()}
                      </td>
                      <td className="px-6 py-3 text-right text-green-700 font-medium">{fmt(m.revenue)}</td>
                      <td className="px-6 py-3 text-right text-red-600">{fmt(m.expenses)}</td>
                      <td className={`px-6 py-3 text-right font-semibold ${profit >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                        {fmt(m.profit)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* ── GST Report ───────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">GST Summary — {year}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <GstCard label="Taxable Amount (Sales)" value={fmt(gst?.totalTaxableAmount)} />
              <GstCard label="Output GST Collected"   value={fmt(gst?.totalGstCollected)} highlight />
              <GstCard label="Paid Invoices"           value={gst?.paidInvoiceCount ?? 0} unit="invoices" />
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Based on {gst?.paidInvoiceCount ?? 0} paid invoices with issue date in {year}.
              Consult a CA for actual GST filing.
            </p>
          </div>

        </div>
      )}
    </Layout>
  )
}

function SummaryCard({ label, value, sub, color }) {
  const colorMap = {
    green:  'text-green-700 bg-green-50',
    red:    'text-red-600 bg-red-50',
    indigo: 'text-indigo-700 bg-indigo-50',
  }
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{label}</p>
      <p className={`text-xl font-bold ${colorMap[color]?.split(' ')[0] || 'text-gray-900'}`}>
        {value}
      </p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  )
}

function StatPill({ label, value, color }) {
  const colorMap = {
    green: 'bg-green-50 text-green-700',
    blue:  'bg-blue-50 text-blue-700',
    red:   'bg-red-50 text-red-700',
  }
  return (
    <div className={`rounded-xl border border-gray-200 p-4 ${colorMap[color] || 'bg-white'}`}>
      <p className="text-xs font-medium opacity-70 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  )
}

function GstCard({ label, value, highlight, unit }) {
  return (
    <div className={`rounded-lg p-4 ${highlight ? 'bg-indigo-50 border border-indigo-200' : 'bg-gray-50 border border-gray-200'}`}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-lg font-bold ${highlight ? 'text-indigo-700' : 'text-gray-900'}`}>
        {value} {unit && <span className="text-sm font-normal text-gray-500">{unit}</span>}
      </p>
    </div>
  )
}
