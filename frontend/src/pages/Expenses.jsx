import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { getExpenses, deleteExpense } from '../api/accounting'

const fmt = (val) =>
  val != null ? `₹${Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—'

const CATEGORY_TINT = {
  SOFTWARE:       'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300',
  HARDWARE:       'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300',
  OFFICE_SUPPLIES:'bg-cyan-100 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300',
  TRAVEL:         'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300',
  MEALS:          'bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300',
  MARKETING:      'bg-pink-100 dark:bg-pink-500/15 text-pink-700 dark:text-pink-300',
  LEGAL:          'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300',
  OTHER:          'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400',
}

const catLabel = (cat) => (cat || 'OTHER').replace(/_/g, ' ')

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const navigate = useNavigate()

  const load = async () => {
    try { setLoading(true); const res = await getExpenses(); setExpenses(res.data) }
    catch { setError('Failed to load expenses') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return
    try { await deleteExpense(id); setExpenses((p) => p.filter((e) => e.id !== id)) }
    catch (err) { setError(err.response?.data?.error || 'Delete failed') }
  }

  const filtered = useMemo(() => expenses
    .filter(e => categoryFilter === 'ALL' || e.category === categoryFilter)
    .filter(e => !search || e.description?.toLowerCase().includes(search.toLowerCase())),
    [expenses, search, categoryFilter])

  const byCategory = useMemo(() => {
    const grouped = expenses.reduce((acc, e) => {
      const cat = e.category || 'OTHER'
      acc[cat] = (acc[cat] || 0) + Number(e.amount || 0)
      return acc
    }, {})
    return Object.entries(grouped).sort((a, b) => b[1] - a[1])
  }, [expenses])

  const thisMonthTotal = useMemo(() => {
    const now = new Date()
    return expenses
      .filter(e => { const d = new Date(e.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() })
      .reduce((s, e) => s + Number(e.amount || 0), 0)
  }, [expenses])

  const maxCat = byCategory[0]?.[1] || 1

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">Expenses</h1>
          <p className="text-sm text-gray-500 dark:text-[#8b90b4] mt-1">Track every rupee leaving the business.</p>
        </div>
        <button
          onClick={() => navigate('/expenses/new')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-white
            bg-blue-700 dark:bg-[#2563eb] hover:opacity-90 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add expense
        </button>
      </div>

      {/* Summary */}
      {expenses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          {/* This month card */}
          <div className="bg-white dark:bg-[#132030] rounded-2xl border border-gray-200 dark:border-white/[0.08] p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-[#8b90b4] mb-3">This month</p>
            <p className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">{fmt(thisMonthTotal)}</p>
            <p className="text-xs text-gray-400 dark:text-[#8b90b4] mt-1">{expenses.length} entries</p>
          </div>

          {/* By category bars */}
          <div className="sm:col-span-3 bg-white dark:bg-[#132030] rounded-2xl border border-gray-200 dark:border-white/[0.08] p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-[#8b90b4] mb-4">By category</p>
            <div className="space-y-3">
              {byCategory.slice(0, 5).map(([cat, total]) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-28 text-center shrink-0 ${CATEGORY_TINT[cat] || CATEGORY_TINT.OTHER}`}>
                    {catLabel(cat)}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-white/10">
                    <div
                      className="h-1.5 rounded-full bg-blue-700 dark:bg-blue-400 transition-all"
                      style={{ width: `${(total / maxCat) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-20 text-right shrink-0">
                    {fmt(total)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex gap-3 mb-5">
        <div className="relative max-w-md w-full">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-[#8b90b4]"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Search vendor or note..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-white dark:bg-[#132030] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-[#8b90b4] focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 dark:focus:border-blue-500" />
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
      ) : expenses.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#132030] rounded-2xl border border-gray-200 dark:border-white/[0.08]">
          <p className="text-gray-500 dark:text-[#8b90b4] font-medium">No expenses yet</p>
          <p className="text-gray-400 dark:text-[#8b90b4]/70 text-sm mt-1">Record your first business expense to get started</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#132030] rounded-2xl border border-gray-200 dark:border-white/[0.08] shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/70 dark:bg-white/[0.02]">
                {['Date', 'Vendor', 'Category', 'Note', 'Amount'].map((h, i) => (
                  <th key={h} className={`px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-[#8b90b4] ${i === 4 ? 'text-right' : 'text-left'}`}>
                    {h}
                  </th>
                ))}
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((exp) => (
                <tr key={exp.id} className="border-t border-gray-100 dark:border-white/[0.05] hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
                  <td className="px-6 py-4 text-gray-600 dark:text-[#8b90b4] whitespace-nowrap">{exp.date}</td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{exp.description}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${CATEGORY_TINT[exp.category] || CATEGORY_TINT.OTHER}`}>
                      {catLabel(exp.category)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-[#8b90b4] text-sm">—</td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-gray-100">
                    {fmt(exp.amount)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => navigate(`/expenses/${exp.id}/edit`)}
                        className="text-xs font-medium text-blue-700 dark:text-blue-400 hover:underline">Edit</button>
                      <button onClick={() => handleDelete(exp.id)}
                        className="text-xs font-medium text-red-500 dark:text-red-400 hover:underline">Delete</button>
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
