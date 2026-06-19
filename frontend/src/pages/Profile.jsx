import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { getProfile, updateProfile } from '../api/profile'

const inputCls = `w-full px-3 py-2 text-sm rounded-lg
  bg-white dark:bg-[#1a2a3e]
  border border-gray-200 dark:border-white/[0.12]
  text-gray-900 dark:text-gray-100
  placeholder-gray-400 dark:placeholder-[#8b90b4]
  focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 dark:focus:border-blue-500`

export default function Profile() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({
    companyName: '', address: '', phone: '', email: '', gstNumber: '',
    bankName: '', accountNumber: '', ifscCode: ''
  })

  useEffect(() => {
    getProfile()
      .then(res => { if (res.data) setForm({ companyName: res.data.companyName || '', address: res.data.address || '', phone: res.data.phone || '', email: res.data.email || '', gstNumber: res.data.gstNumber || '', bankName: res.data.bankName || '', accountNumber: res.data.accountNumber || '', ifscCode: res.data.ifscCode || '' }) })
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError(''); setSuccess('')
    try { await updateProfile(form); setSuccess('Profile updated successfully!') }
    catch (err) { setError(err.response?.data?.error || 'Failed to update profile') }
    finally { setSaving(false) }
  }

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">Business Profile</h1>
          <p className="text-sm text-gray-500 dark:text-[#8b90b4] mt-1">This information appears on your invoices.</p>
        </div>
        <button
          type="submit" form="profile-form" disabled={saving}
          className="px-3.5 py-2 rounded-lg text-sm font-medium text-white
            bg-blue-700 dark:bg-[#2563eb] hover:opacity-90 disabled:opacity-60 transition-opacity"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      {error && (
        <div className="mb-5 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-5 p-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-400 rounded-lg text-sm">
          {success}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-400 dark:text-[#8b90b4]">Loading...</div>
      ) : (
        <form id="profile-form" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left: business card */}
            <div className="bg-white dark:bg-[#132030] rounded-2xl border border-gray-200 dark:border-white/[0.08] p-6 shadow-sm h-fit">
              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563eb)' }}>
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
                  {form.companyName || 'Your Business'}
                </p>
                <p className="text-xs text-gray-400 dark:text-[#8b90b4] mb-5">Business profile</p>
                <button type="button"
                  className="w-full px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors">
                  Upload logo
                </button>
                <p className="text-[11px] text-gray-400 dark:text-[#8b90b4] mt-2">PNG or SVG, 1:1 ratio, max 2MB.</p>
              </div>
            </div>

            {/* Right: form sections */}
            <div className="lg:col-span-2 space-y-5">

              <FormSection title="Business details">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Business name">
                    <input type="text" required value={form.companyName} onChange={set('companyName')} className={inputCls} placeholder="Acme Corp" />
                  </Field>
                  <Field label="Contact email">
                    <input type="email" value={form.email} onChange={set('email')} className={inputCls} placeholder="billing@acmecorp.com" />
                  </Field>
                  <Field label="Phone">
                    <input type="text" value={form.phone} onChange={set('phone')} className={inputCls} placeholder="+91 98xxx xxxxx" />
                  </Field>
                  <Field label="Website">
                    <input type="text" className={inputCls} placeholder="yourwebsite.com" readOnly />
                  </Field>
                </div>
              </FormSection>

              <FormSection title="Address">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Street">
                    <input type="text" value={form.address} onChange={set('address')} className={inputCls} placeholder="221B, Linking Road" />
                  </Field>
                  <Field label="City">
                    <input type="text" className={inputCls} placeholder="Mumbai" readOnly />
                  </Field>
                  <Field label="State">
                    <input type="text" className={inputCls} placeholder="Maharashtra" readOnly />
                  </Field>
                  <Field label="PIN code">
                    <input type="text" className={inputCls} placeholder="400050" readOnly />
                  </Field>
                </div>
              </FormSection>

              <FormSection title="Tax & compliance">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="GSTIN">
                    <input type="text" value={form.gstNumber} onChange={set('gstNumber')} className={`${inputCls} font-mono`} placeholder="27ABCDE1234F1Z5" />
                  </Field>
                  <Field label="PAN">
                    <input type="text" className={`${inputCls} font-mono`} placeholder="ABCDE1234F" readOnly />
                  </Field>
                </div>
              </FormSection>

              <FormSection title="Bank details (for invoices)">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Account holder">
                    <input type="text" className={inputCls} placeholder="Acme Corp LLP" readOnly />
                  </Field>
                  <Field label="Bank name">
                    <input type="text" value={form.bankName} onChange={set('bankName')} className={inputCls} placeholder="HDFC Bank" />
                  </Field>
                  <Field label="Account number">
                    <input type="text" value={form.accountNumber} onChange={set('accountNumber')} className={`${inputCls} font-mono`} placeholder="5020xxxxxxxxxx" />
                  </Field>
                  <Field label="IFSC">
                    <input type="text" value={form.ifscCode} onChange={set('ifscCode')} className={`${inputCls} font-mono`} placeholder="HDFC0001234" />
                  </Field>
                </div>
              </FormSection>

            </div>
          </div>
        </form>
      )}
    </Layout>
  )
}

function FormSection({ title, children }) {
  return (
    <div className="bg-white dark:bg-[#132030] rounded-2xl border border-gray-200 dark:border-white/[0.08] p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
      {children}
    </div>
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
