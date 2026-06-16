import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import useInView from '../hooks/useInView'

const FEATURES = [
  {
    title: 'Professional Invoices',
    description: 'Create GST-compliant invoices and export them as polished, branded PDFs in one click.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    ),
  },
  {
    title: 'Client Management',
    description: 'Keep a clean, searchable directory of every client you bill — no more scattered spreadsheets.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    ),
  },
  {
    title: 'Expense Tracking',
    description: 'Log expenses by category and see exactly where your money goes, every month.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    ),
  },
  {
    title: 'Financial Reports',
    description: 'Real-time revenue, profit, and GST reports computed straight from your invoices — no manual rollups.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    ),
  },
  {
    title: 'Automatic Overdue Detection',
    description: 'A daily background job flags invoices past their due date automatically, so nothing slips through.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
  },
  {
    title: 'Secure by Design',
    description: 'JWT access + refresh tokens and Sign in with Google — your business data stays yours.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
    ),
  },
]

const STEPS = [
  { title: 'Add your business & clients', description: 'Set up your business profile and add the clients you work with.' },
  { title: 'Create & send invoices', description: 'Build GST-ready invoices in seconds and email them straight to your client.' },
  { title: 'Track payments & profit', description: 'Watch revenue, expenses, and outstanding amounts update live on your dashboard.' },
]

function Logo() {
  return (
    <Link to="/" className="flex items-center">
      <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-2.5">
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      </div>
      <span className="text-lg font-bold text-gray-900">LedgerOne</span>
    </Link>
  )
}

function Reveal({ children, delay = 0, className = '' }) {
  const [ref, inView] = useInView()
  // Safety net: if the IntersectionObserver never fires for any reason
  // (slow JS, an environment without it, a tool that snapshots the page
  // without scrolling), content must still become visible — never get
  // permanently stuck at opacity-0.
  const [forceShow, setForceShow] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setForceShow(true), 1200)
    return () => clearTimeout(t)
  }, [])

  const show = inView || forceShow

  return (
    <div
      ref={ref}
      style={{ animationDelay: show ? `${delay}ms` : undefined }}
      className={`${show ? 'animate-fade-in-up' : 'opacity-0'} ${className}`}
    >
      {children}
    </div>
  )
}

export default function Landing() {
  const { user } = useAuth()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Nav */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm' : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition hover:scale-105"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition">
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition hover:scale-105"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-36 pb-24 px-6 overflow-hidden">
        {/* decorative animated blobs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob" />
        <div className="absolute top-10 right-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" style={{ animationDelay: '4s' }} />

        <div className="relative max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full mb-5 animate-fade-in-up">
              Invoicing & Accounting, Simplified
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-5 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              Get paid faster.<br />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient-x">
                Know your numbers.
              </span>
            </h1>
            <p className="text-base text-gray-500 mb-8 max-w-md animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              LedgerOne is a lightweight invoicing and accounting platform for freelancers and small
              businesses — create invoices, track expenses, and see real-time profit, all in one place.
            </p>
            <div className="flex flex-wrap items-center gap-3 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              <Link
                to={user ? '/dashboard' : '/register'}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition transform hover:scale-105 hover:shadow-lg hover:shadow-indigo-200"
              >
                {user ? 'Go to Dashboard' : 'Get Started Free'}
              </Link>
              {!user && (
                <Link
                  to="/login"
                  className="px-6 py-3 border border-gray-200 hover:border-gray-300 text-gray-700 text-sm font-semibold rounded-lg transition hover:scale-105"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>

          {/* Mock invoice preview card */}
          <div className="animate-fade-in-up" style={{ animationDelay: '350ms' }}>
            <div className="animate-float bg-white rounded-2xl border border-gray-200 shadow-xl shadow-indigo-100 p-6 transition-transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Invoice</p>
                  <p className="text-sm font-bold text-gray-900">INV-2026-0001</p>
                </div>
                <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">PAID</span>
              </div>
              <div className="space-y-2.5 mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Website Development</span>
                  <span className="font-medium text-gray-900">₹20,000.00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Hosting & Maintenance</span>
                  <span className="font-medium text-gray-900">₹5,000.00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">GST (18%)</span>
                  <span className="font-medium text-gray-900">₹4,500.00</span>
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <span className="text-sm font-bold text-gray-900">Total</span>
                <span className="text-xl font-bold text-indigo-600">₹29,500.00</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal className="text-center max-w-xl mx-auto mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Everything you need to run the books</h2>
            <p className="text-gray-500">No bloated suite, no learning curve — just the tools a freelancer or small business actually uses.</p>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 80}>
                <div className="group bg-white rounded-xl border border-gray-200 p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:border-indigo-200">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {f.icon}
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal className="text-center max-w-xl mx-auto mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Up and running in minutes</h2>
            <p className="text-gray-500">Three steps between you and your first invoice.</p>
          </Reveal>
          <div className="grid sm:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <Reveal key={step.title} delay={i * 120} className="text-center">
                <div className="w-10 h-10 mx-auto bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold mb-4 shadow-md shadow-indigo-200 transition-transform hover:scale-110">
                  {i + 1}
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] animate-gradient-x overflow-hidden">
        <Reveal className="relative max-w-4xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">Ready to get paid faster?</h2>
          <p className="text-indigo-100 mb-8">Create your free account and send your first invoice today.</p>
          <Link
            to={user ? '/dashboard' : '/register'}
            className="inline-block px-8 py-3 bg-white hover:bg-indigo-50 text-indigo-700 text-sm font-semibold rounded-lg transition transform hover:scale-105 hover:shadow-xl"
          >
            {user ? 'Go to Dashboard' : 'Get Started Free'}
          </Link>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo />
          <p className="text-sm text-gray-400">© {new Date().getFullYear()} LedgerOne. Built with Spring Boot & React.</p>
        </div>
      </footer>
    </div>
  )
}
