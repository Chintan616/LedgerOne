import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { getClients, createClient, updateClient, deleteClient } from '../api/clients'

const emptyForm = { name: '', companyName: '', email: '', phone: '', address: '', gstNumber: '' }

export default function Clients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const res = await getClients()
      setClients(res.data)
    } catch {
      setError('Failed to load clients')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (client) => {
    setEditing(client)
    setForm({
      name: client.name || '',
      companyName: client.companyName || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      gstNumber: client.gstNumber || '',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        await updateClient(editing.id, form)
      } else {
        await createClient(form)
      }
      setShowModal(false)
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this client?')) return
    try {
      await deleteClient(id)
      setClients((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      setError(err.response?.data?.error || 'Delete failed')
    }
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your client directory</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Client
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : clients.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-gray-500 font-medium">No clients yet</p>
          <p className="text-gray-400 text-sm mt-1">Add your first client to get started</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">GST No.</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{c.name}</td>
                  <td className="px-6 py-4 text-gray-600">{c.companyName || '—'}</td>
                  <td className="px-6 py-4 text-gray-600">{c.email || '—'}</td>
                  <td className="px-6 py-4 text-gray-600">{c.phone || '—'}</td>
                  <td className="px-6 py-4 text-gray-600 font-mono text-xs">{c.gstNumber || '—'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(c)}
                        className="text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-red-500 hover:text-red-700 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editing ? 'Edit Client' : 'New Client'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text" required value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Company</label>
                  <input
                    type="text" value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text" value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">GST Number</label>
                  <input
                    type="text" value={form.gstNumber}
                    onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text" value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={saving}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60"
                >
                  {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
