import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { getClients } from '../api/clients'
import { createInvoice, updateInvoice, getInvoice } from '../api/invoices'

const emptyItem = { description: '', quantity: 1, unitPrice: '' }

const today = () => new Date().toISOString().slice(0, 10)
const daysLater = (n) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export default function InvoiceForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [clients, setClients] = useState([])
  const [form, setForm] = useState({
    clientId: '',
    issueDate: today(),
    dueDate: daysLater(30),
    gstRate: '18',
    notes: '',
  })
  const [items, setItems] = useState([{ ...emptyItem }])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const init = async () => {
      try {
        const clientsRes = await getClients()
        setClients(clientsRes.data)

        if (isEdit) {
          const invRes = await getInvoice(id)
          const inv = invRes.data
          setForm({
            clientId: String(inv.client.id),
            issueDate: inv.issueDate,
            dueDate: inv.dueDate,
            gstRate: String(inv.gstRate),
            notes: inv.notes || '',
          })
          setItems(inv.items.map((it) => ({
            description: it.description,
            quantity: it.quantity,
            unitPrice: String(it.unitPrice),
          })))
        }
      } catch {
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [id, isEdit])

  const addItem = () => setItems([...items, { ...emptyItem }])
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i))
  const updateItem = (i, field, value) => {
    const next = [...items]
    next[i] = { ...next[i], [field]: value }
    setItems(next)
  }

  const subtotal = items.reduce((sum, it) => {
    const qty = Number(it.quantity) || 0
    const price = Number(it.unitPrice) || 0
    return sum + qty * price
  }, 0)

  const gstAmount = (subtotal * (Number(form.gstRate) || 0)) / 100
  const total = subtotal + gstAmount

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (items.some((it) => !it.description || !it.unitPrice)) {
      setError('All items need a description and unit price')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = {
        clientId: Number(form.clientId),
        issueDate: form.issueDate,
        dueDate: form.dueDate,
        gstRate: Number(form.gstRate),
        notes: form.notes,
        items: items.map((it) => ({
          description: it.description,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
        })),
      }
      if (isEdit) {
        await updateInvoice(id, payload)
      } else {
        await createInvoice(payload)
      }
      navigate('/invoices')
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-16 text-gray-400">Loading...</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/invoices')} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Edit Invoice' : 'New Invoice'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {isEdit ? 'Update draft invoice details' : 'Create a new invoice for a client'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client & Dates */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Invoice Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Client *</label>
                <select
                  required value={form.clientId}
                  onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select a client...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.companyName ? ` — ${c.companyName}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Issue Date *</label>
                <input
                  type="date" required value={form.issueDate}
                  onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Due Date *</label>
                <input
                  type="date" required value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">GST Rate (%)</label>
                <input
                  type="number" min="0" max="100" step="0.01" value={form.gstRate}
                  onChange={(e) => setForm({ ...form, gstRate: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                <input
                  type="text" value={form.notes} placeholder="Payment terms, bank details..."
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Line Items</h2>
              <button
                type="button" onClick={addItem}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Item
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 px-1">
                <span className="col-span-6 text-xs font-medium text-gray-500 uppercase">Description</span>
                <span className="col-span-2 text-xs font-medium text-gray-500 uppercase">Qty</span>
                <span className="col-span-3 text-xs font-medium text-gray-500 uppercase">Unit Price</span>
                <span className="col-span-1" />
              </div>

              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    className="col-span-6 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Service or product description"
                    value={item.description}
                    onChange={(e) => updateItem(i, 'description', e.target.value)}
                    required
                  />
                  <input
                    className="col-span-2 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    type="number" min="1" placeholder="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                    required
                  />
                  <input
                    className="col-span-3 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    type="number" min="0" step="0.01" placeholder="0.00"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(i, 'unitPrice', e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => items.length > 1 && removeItem(i)}
                    disabled={items.length === 1}
                    className="col-span-1 flex justify-center text-red-400 hover:text-red-600 disabled:text-gray-200 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Totals preview */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="max-w-xs ml-auto space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>GST ({form.gstRate || 0}%)</span>
                <span>₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2 mt-2">
                <span>Total</span>
                <span className="text-indigo-600">
                  ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button" onClick={() => navigate('/invoices')}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={saving}
              className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
