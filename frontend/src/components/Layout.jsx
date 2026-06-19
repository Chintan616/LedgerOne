import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import ChatWidget from './ChatWidget'
import { useTheme } from '../context/ThemeContext'

const PAGE_LABELS = {
  '/dashboard': 'Dashboard',
  '/clients': 'Clients',
  '/invoices': 'Invoices',
  '/invoices/new': 'Invoices',
  '/expenses': 'Expenses',
  '/expenses/new': 'Expenses',
  '/reports': 'Reports',
  '/profile': 'Business Profile',
}


function SunIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  )
}

export default function Layout({ children }) {
  const location = useLocation()
  const { dark, toggle } = useTheme()
  const pageName = PAGE_LABELS[location.pathname] || 'LedgerOne'

  return (
    <div className="flex h-screen bg-[#f7f8fd] dark:bg-[#0d1526]">
      <Sidebar />

      <div className="flex-1 ml-64 flex flex-col min-h-screen overflow-hidden">
        {/* Sticky Header */}
        <header className="h-16 shrink-0 sticky top-0 z-30
          bg-[#f7f8fd]/80 dark:bg-[#0d1526]/80 backdrop-blur-md
          border-b border-gray-200 dark:border-white/[0.06]
          flex items-center justify-between px-8 gap-4">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm min-w-0">
            <span className="text-gray-400 dark:text-[#8b90b4] shrink-0">LedgerOne</span>
            <span className="text-gray-300 dark:text-white/20">/</span>
            <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{pageName}</span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Theme toggle */}
            <button
              onClick={toggle}
              className="grid h-9 w-9 place-items-center rounded-lg
                border border-gray-200 dark:border-white/[0.08]
                bg-white dark:bg-white/[0.03]
                text-gray-500 dark:text-[#8b90b4]
                hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>

          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>

      <ChatWidget />
    </div>
  )
}
