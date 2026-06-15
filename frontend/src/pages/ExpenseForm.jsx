import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { createExpense, updateExpense, getExpenses } from '../api/accounting'

const CATEGORIES = [
  'RENT', 'UTILITIES', 'SALARIES', 'OFFICE_SUPPLIES', 
  'MARKETING', 'TRAVEL', 'PROFESSIONAL_SERVICES', 
  'SOFTWARE', 'HARDWARE', 'OTHER'
]

export default function ExpenseForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const [loading, setLoading] = useState(false)
  const [initLoading, setInitLoading] = useState(isEditing)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: 'OTHER',
    amount: ''
  })

  useEffect(() => {
    if (isEditing) {
      getExpenses()
        .then((res) => {
          const expense = res.data.find(e => e.id === Number(id))
          if (expense) {
            setFormData({
              date: expense.date,
              description: expense.description,
              category: expense.category,
              amount: expense.amount
            })
          } else {
            setError('Expense not found')
          }
        })
        .catch(() => setError('Failed to load expense'))
        .finally(() => setInitLoading(false))
    }
  }, [id, isEditing])

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isEditing) {
        await updateExpense(id, formData)
      } else {
        await createExpense(formData)
      }
      navigate('/expenses')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save expense. Please check your inputs.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/expenses')} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Expense' : 'New Expense'}
          </h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {initLoading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-6 space-y-6">
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    name="date"
                    required
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    name="amount"
                    required
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  name="description"
                  required
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="e.g., AWS Hosting, Office Rent"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>

            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/expenses')}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 transition-colors"
              >
                {loading ? 'Saving...' : 'Save Expense'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  )
}
