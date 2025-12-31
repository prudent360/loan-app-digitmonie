import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import AdminLayout from '../../components/layouts/AdminLayout'
import { adminAPI } from '../../services/api'
import { 
  ArrowLeft, User, Mail, Phone, Calendar, Shield, CreditCard, 
  FileText, Wallet, CheckCircle, XCircle, Clock, Edit, 
  UserCheck, UserX, Loader2, AlertTriangle
} from 'lucide-react'

export default function UserDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadUser()
  }, [id])

  const loadUser = async () => {
    try {
      setLoading(true)
      const res = await adminAPI.getUser(id)
      setUser(res.data.user || res.data)
    } catch (err) {
      console.error('Failed to load user:', err)
      setError('Failed to load user details')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    if (!confirm(`Are you sure you want to ${newStatus === 'suspended' ? 'suspend' : 'activate'} this user?`)) return
    
    setActionLoading(true)
    try {
      await adminAPI.updateUserStatus(id, newStatus)
      setUser(prev => ({ ...prev, status: newStatus }))
    } catch (err) {
      console.error('Failed to update status:', err)
      alert('Failed to update user status')
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 border-green-200'
      case 'suspended': return 'bg-red-100 text-red-700 border-red-200'
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getKYCColor = (status) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-700'
      case 'rejected': return 'bg-red-100 text-red-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : '-'

  const formatCurrency = (amount) => `₦${Number(amount || 0).toLocaleString()}`

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-primary-600" size={32} />
        </div>
      </AdminLayout>
    )
  }

  if (error || !user) {
    return (
      <AdminLayout>
        <div className="text-center py-16">
          <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-text mb-2">User Not Found</h2>
          <p className="text-text-muted mb-4">{error || 'The requested user could not be found.'}</p>
          <Link to="/admin/users" className="btn btn-primary">Back to Users</Link>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin/users')} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft size={20} className="text-text-muted" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-text">User Details</h1>
              <p className="text-text-muted">View and manage user information</p>
            </div>
          </div>
          <div className="flex gap-2">
            {user.status === 'active' ? (
              <button 
                onClick={() => handleStatusChange('suspended')} 
                disabled={actionLoading}
                className="btn bg-red-100 text-red-700 hover:bg-red-200"
              >
                {actionLoading ? <Loader2 className="animate-spin" size={18} /> : <UserX size={18} />}
                Suspend User
              </button>
            ) : (
              <button 
                onClick={() => handleStatusChange('active')} 
                disabled={actionLoading}
                className="btn btn-primary"
              >
                {actionLoading ? <Loader2 className="animate-spin" size={18} /> : <UserCheck size={18} />}
                Activate User
              </button>
            )}
          </div>
        </div>

        {/* User Profile Card */}
        <div className="card">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center text-2xl font-semibold">
              {user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h2 className="text-xl font-semibold text-text">{user.name}</h2>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(user.status)}`}>
                  {user.status?.charAt(0).toUpperCase() + user.status?.slice(1)}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getKYCColor(user.kyc_status)}`}>
                  KYC: {user.kyc_status || 'Pending'}
                </span>
              </div>
              <p className="text-text-muted">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Contact Information */}
          <div className="card">
            <h3 className="font-medium text-text mb-4 flex items-center gap-2">
              <User size={18} className="text-primary-600" /> Contact Information
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-text-muted" />
                <div>
                  <p className="text-xs text-text-muted">Email</p>
                  <p className="text-sm text-text">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-text-muted" />
                <div>
                  <p className="text-xs text-text-muted">Phone</p>
                  <p className="text-sm text-text">{user.phone || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar size={16} className="text-text-muted" />
                <div>
                  <p className="text-xs text-text-muted">Joined</p>
                  <p className="text-sm text-text">{formatDate(user.created_at)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div className="card">
            <h3 className="font-medium text-text mb-4 flex items-center gap-2">
              <Shield size={18} className="text-primary-600" /> Account Status
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-text-muted text-sm">Status</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(user.status)}`}>
                  {user.status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted text-sm">KYC Verification</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getKYCColor(user.kyc_status)}`}>
                  {user.kyc_status || 'pending'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted text-sm">Role</span>
                <span className="text-sm text-text capitalize">{user.role || 'customer'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted text-sm">Email Verified</span>
                {user.email_verified_at ? (
                  <CheckCircle size={16} className="text-green-600" />
                ) : (
                  <XCircle size={16} className="text-red-500" />
                )}
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="card">
            <h3 className="font-medium text-text mb-4 flex items-center gap-2">
              <Wallet size={18} className="text-primary-600" /> Financial Summary
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-text-muted text-sm">Wallet Balance</span>
                <span className="text-sm font-semibold text-text">{formatCurrency(user.wallet?.balance)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted text-sm">Total Loans</span>
                <span className="text-sm text-text">{user.loans_count || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted text-sm">Active Loans</span>
                <span className="text-sm text-text">{user.active_loans_count || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted text-sm">Total Borrowed</span>
                <span className="text-sm text-text">{formatCurrency(user.total_borrowed)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Loans */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-text flex items-center gap-2">
                <FileText size={18} className="text-primary-600" /> Recent Loans
              </h3>
              <Link to={`/admin/loans?user=${user.id}`} className="text-primary-600 text-sm hover:underline">View All</Link>
            </div>
            {user.loans && user.loans.length > 0 ? (
              <div className="space-y-3">
                {user.loans.slice(0, 5).map(loan => (
                  <div key={loan.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-text">{formatCurrency(loan.amount)}</p>
                      <p className="text-xs text-text-muted">{formatDate(loan.created_at)}</p>
                    </div>
                    <span className={`badge ${
                      loan.status === 'approved' ? 'badge-success' :
                      loan.status === 'pending' ? 'badge-warning' :
                      loan.status === 'rejected' ? 'badge-error' : ''
                    }`}>{loan.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-muted text-sm text-center py-8">No loans yet</p>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-text flex items-center gap-2">
                <CreditCard size={18} className="text-primary-600" /> Recent Transactions
              </h3>
            </div>
            {user.wallet_transactions && user.wallet_transactions.length > 0 ? (
              <div className="space-y-3">
                {user.wallet_transactions.slice(0, 5).map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-text">{tx.description}</p>
                      <p className="text-xs text-text-muted">{formatDate(tx.created_at)}</p>
                    </div>
                    <span className={`text-sm font-semibold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-muted text-sm text-center py-8">No transactions yet</p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
