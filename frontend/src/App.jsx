import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'

// Pages
import Landing from './pages/Landing'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'

// Customer Pages
import CustomerDashboard from './pages/customer/Dashboard'
import CustomerLoans from './pages/customer/Loans'
import LoanApplication from './pages/customer/LoanApplication'
import LoanDetails from './pages/customer/LoanDetails'
import KYCUpload from './pages/customer/KYCUpload'
import Profile from './pages/customer/Profile'
import PaymentCallback from './pages/customer/PaymentCallback'
import PaymentHistory from './pages/customer/PaymentHistory'

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminLoans from './pages/admin/Loans'
import AdminKYC from './pages/admin/KYCReview'
import AdminSettings from './pages/admin/Settings'
import AdminRoles from './pages/admin/Roles'
import AdminPayments from './pages/admin/Payments'

// Protected Route Component
function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="page-loader">
        <div className="loader"></div>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />
  }
  
  return children
}

// Public Route (redirect if authenticated)
function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="page-loader">
        <div className="loader"></div>
      </div>
    )
  }
  
  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />
  }
  
  return children
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      
      {/* Customer Routes */}
      <Route path="/dashboard" element={<ProtectedRoute requiredRole="customer"><CustomerDashboard /></ProtectedRoute>} />
      <Route path="/loans" element={<ProtectedRoute requiredRole="customer"><CustomerLoans /></ProtectedRoute>} />
      <Route path="/loans/apply" element={<ProtectedRoute requiredRole="customer"><LoanApplication /></ProtectedRoute>} />
      <Route path="/loans/:id" element={<ProtectedRoute requiredRole="customer"><LoanDetails /></ProtectedRoute>} />
      <Route path="/kyc" element={<ProtectedRoute requiredRole="customer"><KYCUpload /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute requiredRole="customer"><Profile /></ProtectedRoute>} />
      <Route path="/payments" element={<ProtectedRoute requiredRole="customer"><PaymentHistory /></ProtectedRoute>} />
      <Route path="/payment/callback" element={<ProtectedRoute requiredRole="customer"><PaymentCallback /></ProtectedRoute>} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute requiredRole="admin"><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/loans" element={<ProtectedRoute requiredRole="admin"><AdminLoans /></ProtectedRoute>} />
      <Route path="/admin/kyc" element={<ProtectedRoute requiredRole="admin"><AdminKYC /></ProtectedRoute>} />
      <Route path="/admin/payments" element={<ProtectedRoute requiredRole="admin"><AdminPayments /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute requiredRole="admin"><AdminSettings /></ProtectedRoute>} />
      <Route path="/admin/roles" element={<ProtectedRoute requiredRole="admin"><AdminRoles /></ProtectedRoute>} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
