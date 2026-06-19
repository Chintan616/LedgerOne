import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const inputCls = `w-full px-3 py-2.5 text-sm rounded-lg
  bg-[#f7f8fd] dark:bg-[#1a2a3e]
  border border-gray-200 dark:border-white/[0.12]
  text-gray-900 dark:text-gray-100
  placeholder-gray-400 dark:placeholder-[#8b90b4]
  focus:bg-white dark:focus:bg-[#1e3350]
  focus:border-blue-400 dark:focus:border-blue-500
  focus:ring-2 focus:ring-blue-500/30 transition`

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const googleButtonRef = useRef(null)

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try { await login(email, password); navigate('/dashboard') }
    catch (err) { setError(err.response?.data?.error || 'Something went wrong. Please try again.') }
    finally { setLoading(false) }
  }

  const handleGoogleCredential = async (response) => {
    setError(''); setLoading(true)
    try { await loginWithGoogle(response.credential); navigate('/dashboard') }
    catch (err) { setError(err.response?.data?.error || 'Google sign-in failed.') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    const render = () => {
      if (!window.google || !googleButtonRef.current) return
      window.google.accounts.id.initialize({ client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID, callback: handleGoogleCredential })
      window.google.accounts.id.renderButton(googleButtonRef.current, { theme: 'outline', size: 'large', width: 320 })
    }
    const id = 'google-identity-script'
    if (document.getElementById(id)) { render(); return }
    const s = document.createElement('script')
    s.id = id; s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.defer = true; s.onload = render
    document.body.appendChild(s)
  }, [])

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#f7f8fd] dark:bg-[#0d1526]">

      {/* Left panel — brand */}
      <div className="hidden lg:flex flex-col justify-between p-12 text-white"
        style={{ background: 'linear-gradient(135deg, #0f2044, #2563eb, #3b82f6)' }}>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-base font-semibold">LedgerOne</span>
        </div>

        <div>
          <p className="text-3xl font-semibold leading-snug mb-6">
            "Finally, invoicing that<br />doesn't feel like work."
          </p>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center font-semibold">A</div>
            <div>
              <p className="font-medium text-sm">Arjun Mehta</p>
              <p className="text-white/60 text-xs">Freelance designer, Mumbai</p>
            </div>
          </div>
        </div>

        <p className="text-white/50 text-xs">© {new Date().getFullYear()} LedgerOne. Finance for founders.</p>
      </div>

      {/* Right panel — form */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex lg:hidden justify-center mb-8">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563eb)' }}>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">LedgerOne</span>
            </div>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 mb-1">Welcome back</h1>
          <p className="text-sm text-gray-500 dark:text-[#8b90b4] mb-8">Sign in to your account to continue.</p>

          {error && (
            <div className="mb-5 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-[#8b90b4] mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-[#8b90b4] mb-1.5">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" placeholder="••••••••" className={inputCls} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-medium text-white bg-blue-700 dark:bg-[#2563eb] hover:opacity-90 disabled:opacity-60 transition-opacity">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign in'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200 dark:bg-white/[0.08]" />
            <span className="text-xs text-gray-400 dark:text-[#8b90b4] uppercase tracking-wide">or</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-white/[0.08]" />
          </div>

          <div ref={googleButtonRef} className="flex justify-center" />

          <p className="text-center text-sm text-gray-500 dark:text-[#8b90b4] mt-8">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-blue-700 dark:text-blue-400 hover:underline font-medium">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
