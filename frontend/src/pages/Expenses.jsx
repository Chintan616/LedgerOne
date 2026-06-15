import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { getExpenses, deleteExpense } from '../api/accounting'

const fmt = (val) =>
  val != null ? `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const load = async () => {
    try {
      setLoading(true)
      const res = await getExpenses()
      setExpenses(res.data)
    } catch {
      setError('Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return
    try {
      await deleteExpense(id)
      setExpenses((prev) => prev.filter((exp) => exp.id !== id))
    } catch (err) {
      setError(err.response?.data?.error || 'Delete failed')
    }
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage your business expenses</p>
        </div>
        <button
          onClick={() => navigate('/expenses/new')}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Expense
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
      ) : expenses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500 font-medium">No expenses yet</p>
          <p className="text-gray-400 text-sm mt-1">Record your first business expense to get started</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{exp.date}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{exp.description}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {exp.category?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-red-600">{fmt(exp.amount)}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => navigate(`/expenses/${exp.id}/edit`)}
                      className="text-indigo-600 hover:text-indigo-800 font-medium mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(exp.id)}
                      className="text-red-500 hover:text-red-700 font-medium"
                    >
                      Delete
                    </button>
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
