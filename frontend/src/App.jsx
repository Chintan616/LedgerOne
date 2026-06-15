import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import Invoices from './pages/Invoices'
import InvoiceForm from './pages/InvoiceForm'
import Expenses from './pages/Expenses'
import ExpenseForm from './pages/ExpenseForm'
import Reports from './pages/Reports'

function P({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<P><Dashboard /></P>} />
          <Route path="/clients" element={<P><Clients /></P>} />
          <Route path="/invoices" element={<P><Invoices /></P>} />
          <Route path="/invoices/new" element={<P><InvoiceForm /></P>} />
          <Route path="/invoices/:id/edit" element={<P><InvoiceForm /></P>} />
          <Route path="/expenses" element={<P><Expenses /></P>} />
          <Route path="/expenses/new" element={<P><ExpenseForm /></P>} />
          <Route path="/expenses/:id/edit" element={<P><ExpenseForm /></P>} />
          <Route path="/reports" element={<P><Reports /></P>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
