import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { getClients, createClient, updateClient, deleteClient } from '../api/clients'

const emptyForm = { name: '', companyName: '', email: '', phone: '', address: '', gstNumber: '' }

const inputCls = `w-full px-3 py-2 text-sm rounded-lg
  bg-white dark:bg-[#1a2a3e]
  border border-gray-200 dark:border-white/[0.12]
  text-gray-900 dark:text-gray-100
  placeholder-gray-400 dark:placeholder-[#8b90b4]
  focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 dark:focus:border-blue-500`

export default function Clients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const load = async () => {
    try { setLoading(true); const res = await getClients(); setClients(res.data) }
    catch { setError('Failed to load clients') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true) }
  const openEdit = (c) => {
    setEditing(c)
    setForm({ name: c.name || '', companyName: c.companyName || '', email: c.email || '', phone: c.phone || '', address: c.address || '', gstNumber: c.gstNumber || '' })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      editing ? await updateClient(editing.id, form) : await createClient(form)
      setShowModal(false); load()
    } catch (err) { setError(err.response?.data?.error || 'Save failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this client?')) return
    try { await deleteClient(id); setClients((p) => p.filter((c) => c.id !== id)) }
    catch (err) { setError(err.response?.data?.error || 'Delete failed') }
  }

  const filtered = clients.filter(c => {
    if (!search) return true
    const t = search.toLowerCase()
    return c.name?.toLowerCase().includes(t) || c.companyName?.toLowerCase().includes(t) || c.email?.toLowerCase().includes(t)
  })

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">Clients</h1>
          <p className="text-sm text-gray-500 dark:text-[#8b90b4] mt-1">
            {clients.length} active {clients.length === 1 ? 'client' : 'clients'} in your workspace.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-white
            bg-blue-700 dark:bg-[#2563eb] hover:opacity-90 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add client
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-5">
        <div className="relative max-w-md w-full">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-[#8b90b4]"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)}
            className={`${inputCls} pl-9`} />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-400 dark:text-[#8b90b4]">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#132030] rounded-2xl border border-gray-200 dark:border-white/[0.08]">
          <p className="text-gray-500 dark:text-[#8b90b4] font-medium">No clients found</p>
          <p className="text-gray-400 dark:text-[#8b90b4]/70 text-sm mt-1">
            {search ? 'Try a different search term' : 'Add your first client to get started'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#132030] rounded-2xl border border-gray-200 dark:border-white/[0.08] shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/70 dark:bg-white/[0.02]">
                <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-[#8b90b4]">Client</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-[#8b90b4]">Contact</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-[#8b90b4]">GST No.</th>
                <th className="text-right px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-[#8b90b4]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t border-gray-100 dark:border-white/[0.05] hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0
                        bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 font-semibold text-sm">
                        {c.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{c.name}</p>
                        {c.companyName && <p className="text-xs text-gray-400 dark:text-[#8b90b4]">{c.companyName}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-0.5">
                      {c.email && (
                        <p className="text-sm text-gray-600 dark:text-[#8b90b4] flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {c.email}
                        </p>
                      )}
                      {c.phone && (
                        <p className="text-sm text-gray-600 dark:text-[#8b90b4] flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {c.phone}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-600 dark:text-[#8b90b4]">
                    {c.gstNumber || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => openEdit(c)} className="text-xs font-medium text-blue-700 dark:text-blue-400 hover:underline">Edit</button>
                      <button onClick={() => handleDelete(c.id)} className="text-xs font-medium text-red-500 dark:text-red-400 hover:underline">Delete</button>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#132030] rounded-2xl shadow-xl w-full max-w-lg border border-gray-200 dark:border-white/[0.08]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/[0.06]">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {editing ? 'Edit Client' : 'Add Client'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Name *">
                  <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputCls} />
                </Field>
                <Field label="Company">
                  <input type="text" value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} className={inputCls} />
                </Field>
                <Field label="Email">
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className={inputCls} />
                </Field>
                <Field label="Phone">
                  <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className={inputCls} />
                </Field>
                <Field label="GST Number">
                  <input type="text" value={form.gstNumber} onChange={e => setForm({...form, gstNumber: e.target.value})} className={`${inputCls} font-mono`} placeholder="22AAAAA0000A1Z5" />
                </Field>
                <Field label="Address">
                  <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className={inputCls} />
                </Field>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-gray-300 bg-white dark:bg-white/[0.03] hover:bg-gray-50 dark:hover:bg-white/[0.06]">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg bg-blue-700 dark:bg-[#2563eb] hover:opacity-90 disabled:opacity-60">
                  {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 dark:text-[#8b90b4] mb-1">{label}</label>
      {children}
    </div>
  )
}
