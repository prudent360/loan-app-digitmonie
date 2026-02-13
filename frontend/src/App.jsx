import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { User, LogOut } from 'lucide-react'

// Pages
import Landing from './pages/Landing'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import VerifyEmail from './pages/auth/VerifyEmail'
import EmailVerificationPrompt from './pages/auth/EmailVerificationPrompt'

import CustomerDashboard from './pages/customer/Dashboard'
import CustomerLoans from './pages/customer/Loans'
import LoanApplication from './pages/customer/LoanApplication'
import LoanDetails from './pages/customer/LoanDetails'
import KYCUpload from './pages/customer/KYCUpload'
import Profile from './pages/customer/Profile'
import PaymentCallback from './pages/customer/PaymentCallback'
import PaymentHistory from './pages/customer/PaymentHistory'
import Savings from './pages/customer/Savings'
import Wallet from './pages/customer/Wallet'

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import UserDetail from './pages/admin/UserDetail'
import AdminLoans from './pages/admin/Loans'
import AdminKYC from './pages/admin/KYCReview'
import AdminSettings from './pages/admin/Settings'
import AdminRoles from './pages/admin/Roles'
import AdminSavingsPlans from './pages/admin/SavingsPlans'
import AdminWallets from './pages/admin/Wallets'
import AdminPayments from './pages/admin/Payments'
import AdminTransfers from './pages/admin/Transfers'
import AdminLoanDetails from './pages/admin/LoanDetails'
import AdminEmailTemplates from './pages/admin/EmailTemplates'

// Internal components
function ImpersonationBanner() {
  const { user, updateUser } = useAuth()
  const isAdminImpersonating = !!localStorage.getItem('admin_token')

  if (!isAdminImpersonating) return null

  const handleBackToAdmin = () => {
    const adminToken = localStorage.getItem('admin_token')
    const adminUserStr = localStorage.getItem('admin_user')
    
    if (!adminToken || !adminUserStr) return

    const adminUser = JSON.parse(adminUserStr)

    localStorage.setItem('token', adminToken)
    localStorage.setItem('user', adminUserStr)
    
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')

    updateUser(adminUser)
    window.location.href = '/admin/users'
  }

  return (
    <div className="bg-primary-600 text-white py-2 px-4 flex items-center justify-between sticky top-0 z-[100] shadow-md">
      <div className="flex items-center gap-2 text-sm font-medium">
        <User size={16} />
        <span>Impersonating: <strong className="ml-1">{user?.name}</strong></span>
      </div>
      <button 
        onClick={handleBackToAdmin}
        className="bg-white text-primary-600 px-3 py-1 rounded text-xs font-bold hover:bg-gray-100 transition-colors flex items-center gap-1"
      >
        <LogOut size={12} />
        Return to Admin
      </button>
    </div>
  )
}

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
  
  // Admin check covers all administrative roles
  const isAdmin = ['super_admin', 'loan_manager', 'kyc_officer', 'support'].includes(user.role) || user.role === 'admin'
  
  if (requiredRole === 'admin' && !isAdmin) {
    return <Navigate to="/dashboard" replace />
  }
  
  if (requiredRole === 'customer' && isAdmin) {
    // Admins can access customer dashboard via impersonation flag if we wanted, 
    // but the current structure of AuthContext/Redirects makes them distinct.
    // However, if they are impersonating, their user object HAS role='customer'.
    return <Navigate to="/admin" replace />
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
    const isAdmin = ['super_admin', 'loan_manager', 'kyc_officer', 'support'].includes(user.role) || user.role === 'admin'
    return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />
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
      <Route path="/verify-email/:id/:hash" element={<VerifyEmail />} />
      <Route path="/verify-email-prompt" element={<EmailVerificationPrompt />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      
      {/* Customer Routes */}
      <Route path="/dashboard" element={<ProtectedRoute requiredRole="customer"><CustomerDashboard /></ProtectedRoute>} />
      <Route path="/loans" element={<ProtectedRoute requiredRole="customer"><CustomerLoans /></ProtectedRoute>} />
      <Route path="/loans/apply" element={<ProtectedRoute requiredRole="customer"><LoanApplication /></ProtectedRoute>} />
      <Route path="/loans/:id" element={<ProtectedRoute requiredRole="customer"><LoanDetails /></ProtectedRoute>} />
      <Route path="/kyc" element={<ProtectedRoute requiredRole="customer"><KYCUpload /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute requiredRole="customer"><Profile /></ProtectedRoute>} />
      <Route path="/payments" element={<ProtectedRoute requiredRole="customer"><PaymentHistory /></ProtectedRoute>} />
      <Route path="/payment/callback" element={<ProtectedRoute requiredRole="customer"><PaymentCallback /></ProtectedRoute>} />
      <Route path="/savings" element={<ProtectedRoute requiredRole="customer"><Savings /></ProtectedRoute>} />
      <Route path="/wallet" element={<ProtectedRoute requiredRole="customer"><Wallet /></ProtectedRoute>} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute requiredRole="admin"><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/users/:id" element={<ProtectedRoute requiredRole="admin"><UserDetail /></ProtectedRoute>} />
      <Route path="/admin/loans" element={<ProtectedRoute requiredRole="admin"><AdminLoans /></ProtectedRoute>} />
      <Route path="/admin/loans/:id" element={<ProtectedRoute requiredRole="admin"><AdminLoanDetails /></ProtectedRoute>} />
      <Route path="/admin/savings" element={<ProtectedRoute requiredRole="admin"><AdminSavingsPlans /></ProtectedRoute>} />
      <Route path="/admin/kyc" element={<ProtectedRoute requiredRole="admin"><AdminKYC /></ProtectedRoute>} />
      <Route path="/admin/payments" element={<ProtectedRoute requiredRole="admin"><AdminPayments /></ProtectedRoute>} />
      <Route path="/admin/wallets" element={<ProtectedRoute requiredRole="admin"><AdminWallets /></ProtectedRoute>} />
      <Route path="/admin/transfers" element={<ProtectedRoute requiredRole="admin"><AdminTransfers /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute requiredRole="admin"><AdminSettings /></ProtectedRoute>} />
      <Route path="/admin/email-templates" element={<ProtectedRoute requiredRole="admin"><AdminEmailTemplates /></ProtectedRoute>} />
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
          <ImpersonationBanner />
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
