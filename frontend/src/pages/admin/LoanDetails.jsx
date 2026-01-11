import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/layouts/AdminLayout'
import { useToast } from '../../context/ToastContext'
import api from '../../services/api'
import { ArrowLeft, User, FileText, CheckCircle, XCircle, Clock, Loader2, Download, Banknote, AlertCircle, Circle } from 'lucide-react'

export default function AdminLoanDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [loan, setLoan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)
  const [timelineSteps, setTimelineSteps] = useState([])
  const [timelineLoading, setTimelineLoading] = useState(false)

  useEffect(() => {
    loadLoan()
  }, [id])

  const loadLoan = async () => {
    setError(null)
    try {
      const res = await api.get(`/admin/loans/${id}`)
      setLoan(res.data)
      loadTimeline()
    } catch (err) {
      console.error('Failed to load loan:', err)
      setError(err.response?.data?.message || 'Failed to load loan details. Make sure you have uploaded the latest backend files.')
      toast.error('Failed to load loan details')
    } finally {
      setLoading(false)
    }
  }

  const loadTimeline = async () => {
    setTimelineLoading(true)
    try {
      const res = await api.get(`/admin/loans/${id}/timeline`)
      setTimelineSteps(res.data.steps || [])
    } catch (err) {
      console.error('Timeline not available:', err)
    } finally {
      setTimelineLoading(false)
    }
  }

  const handleUpdateStep = async (stepId, status) => {
    try {
      await api.put(`/admin/loans/${id}/timeline/${stepId}`, { status })
      toast.success('Step updated!')
      loadTimeline()
    } catch (err) {
      toast.error('Failed to update step')
    }
  }

  const handleApprove = async () => {
    setActionLoading('approve')
    try {
      await api.post(`/admin/loans/${id}/approve`)
      toast.success('Loan approved!')
      loadLoan()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async () => {
    const reason = prompt('Enter rejection reason:')
    if (!reason) return
    setActionLoading('reject')
    try {
      await api.post(`/admin/loans/${id}/reject`, { reason })
      toast.success('Loan rejected')
      loadLoan()
    } catch (err) {
      toast.error('Failed to reject')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDisburse = async () => {
    setActionLoading('disburse')
    try {
      await api.post(`/admin/loans/${id}/disburse`)
      toast.success('Loan disbursed!')
      loadLoan()
    } catch (err) {
      toast.error('Failed to disburse')
    } finally {
      setActionLoading(null)
    }
  }

  const formatCurrency = (amount) => `₦${Number(amount || 0).toLocaleString()}`
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'
  
  const getStatusBadge = (s) => {
    const badges = { pending: 'badge-warning', pending_review: 'badge-info', approved: 'badge-success', rejected: 'badge-error', disbursed: 'badge-info', active: 'badge-success', completed: 'badge-primary' }
    return `badge ${badges[s] || ''}`
  }

  // Skeleton component
  const Skeleton = ({ className }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  )

  if (loading) {
    return (
      <AdminLayout>
        <div className="inline-flex items-center gap-2 text-text-muted mb-6">
          <Skeleton className="w-4 h-4" />
          <Skeleton className="w-40 h-4" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content Skeleton */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card Skeleton */}
            <div className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <Skeleton className="w-48 h-6 mb-2" />
                  <Skeleton className="w-32 h-4" />
                </div>
                <Skeleton className="w-20 h-6 rounded-full" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1,2,3,4].map(i => (
                  <div key={i}>
                    <Skeleton className="w-16 h-3 mb-2" />
                    <Skeleton className="w-24 h-6" />
                  </div>
                ))}
              </div>
            </div>

            {/* Bank Details Skeleton */}
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Skeleton className="w-5 h-5 rounded" />
                <Skeleton className="w-28 h-5" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[1,2,3,4].map(i => (
                  <div key={i}>
                    <Skeleton className="w-20 h-3 mb-2" />
                    <Skeleton className="w-32 h-4" />
                  </div>
                ))}
              </div>
            </div>

            {/* Documents Skeleton */}
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Skeleton className="w-5 h-5 rounded" />
                <Skeleton className="w-36 h-5" />
              </div>
              <div className="space-y-3">
                {[1,2].map(i => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-8 h-8 rounded" />
                      <div>
                        <Skeleton className="w-32 h-4 mb-1" />
                        <Skeleton className="w-20 h-3" />
                      </div>
                    </div>
                    <Skeleton className="w-16 h-6 rounded-full" />
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline Skeleton */}
            <div className="card">
              <Skeleton className="w-40 h-5 mb-6" />
              <div className="space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                    <div className="flex-1">
                      <Skeleton className="w-40 h-4 mb-2" />
                      <Skeleton className="w-full h-3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Skeleton */}
          <div className="space-y-6">
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Skeleton className="w-5 h-5 rounded-full" />
                <Skeleton className="w-20 h-5" />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div>
                  <Skeleton className="w-28 h-4 mb-1" />
                  <Skeleton className="w-36 h-3" />
                </div>
              </div>
            </div>
            <div className="card">
              <Skeleton className="w-28 h-5 mb-4" />
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex justify-between mb-2">
                  <Skeleton className="w-20 h-3" />
                  <Skeleton className="w-24 h-3" />
                </div>
              ))}
            </div>
            <div className="card">
              <Skeleton className="w-20 h-5 mb-4" />
              <Skeleton className="w-full h-10 rounded-lg mb-2" />
              <Skeleton className="w-full h-10 rounded-lg" />
            </div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (error || !loan) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <p className="text-text-muted mb-2">{error || 'Loan not found'}</p>
          <div className="flex justify-center gap-3 mt-4">
            <Link to="/admin/loans" className="btn btn-outline">← Back to Loans</Link>
            <button onClick={loadLoan} className="btn btn-primary">Retry</button>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <Link to="/admin/loans" className="inline-flex items-center gap-2 text-text-muted hover:text-text mb-6">
        <ArrowLeft size={18} /> Back to Loan Applications
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-text">{loan.purpose || 'Loan Application'}</h1>
                <p className="text-text-muted">ID: #LN-{String(loan.id).padStart(6, '0')}</p>
              </div>
              <span className={getStatusBadge(loan.status)}>{loan.status?.replace('_', ' ')}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><p className="text-text-muted">Amount</p><p className="font-bold text-xl text-text">{formatCurrency(loan.amount)}</p></div>
              <div><p className="text-text-muted">Tenure</p><p className="font-medium text-text">{loan.tenure_months} months</p></div>
              <div><p className="text-text-muted">Interest Rate</p><p className="font-medium text-text">{loan.interest_rate}% p.a.</p></div>
              <div><p className="text-text-muted">Applied</p><p className="font-medium text-text">{formatDate(loan.created_at)}</p></div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Banknote size={20} className="text-primary-600" />
              <h2 className="text-lg font-semibold text-text">Bank Details</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-text-muted">Bank Name</p><p className="font-medium text-text">{loan.bank_name || '-'}</p></div>
              <div><p className="text-text-muted">Account Number</p><p className="font-medium text-text font-mono">{loan.account_number || '-'}</p></div>
              <div><p className="text-text-muted">Monthly Income</p><p className="font-medium text-text">{formatCurrency(loan.monthly_income)}</p></div>
              <div><p className="text-text-muted">Employment Type</p><p className="font-medium text-text capitalize">{loan.employment_type?.replace('_', ' ') || '-'}</p></div>
            </div>
          </div>

          {/* Customer Documents */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={20} className="text-primary-600" />
              <h2 className="text-lg font-semibold text-text">Uploaded Documents</h2>
            </div>
            {loan.documents && loan.documents.length > 0 ? (
              <div className="space-y-3">
                {loan.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText size={20} className="text-primary-600" />
                      <div>
                        <p className="font-medium text-text">{doc.name || doc.type}</p>
                        <p className="text-xs text-text-muted">{formatDate(doc.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${doc.status === 'approved' ? 'badge-success' : doc.status === 'rejected' ? 'badge-error' : 'badge-warning'}`}>
                        {doc.status || 'pending'}
                      </span>
                      {doc.url && (
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline">
                          <Download size={14} /> View
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-text-muted">
                <FileText size={32} className="mx-auto mb-2 opacity-40" />
                <p>No documents uploaded by customer</p>
              </div>
            )}
          </div>

          {/* Progress Timeline with Controls */}
          <div className="card">
            <h2 className="text-lg font-semibold text-text mb-6">Processing Progress</h2>
            {timelineLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="animate-spin" size={24} /></div>
            ) : timelineSteps.length > 0 ? (
              <div className="relative">
                {timelineSteps.map((step, idx) => (
                  <div key={step.id} className="flex gap-4 pb-6 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        step.status === 'completed' ? 'bg-green-100 text-green-600' :
                        step.status === 'in_progress' ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-500' :
                        step.status === 'failed' ? 'bg-red-100 text-red-600' :
                        'bg-gray-100 text-gray-400'
                      }`}>
                        {step.status === 'completed' ? <CheckCircle size={20} /> :
                         step.status === 'in_progress' ? <Clock size={20} className="animate-pulse" /> :
                         step.status === 'failed' ? <XCircle size={20} /> :
                         <Circle size={20} />}
                      </div>
                      {idx < timelineSteps.length - 1 && (
                        <div className={`w-0.5 flex-1 mt-2 ${step.status === 'completed' ? 'bg-green-300' : 'bg-gray-200'}`} />
                      )}
                    </div>
                    <div className="pt-2 pb-4 flex-1">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className={`font-semibold ${
                            step.status === 'completed' ? 'text-green-700' :
                            step.status === 'in_progress' ? 'text-blue-600' :
                            step.status === 'failed' ? 'text-red-600' :
                            'text-gray-400'
                          }`}>{step.title}</h3>
                          <p className="text-sm text-text-muted">{step.description}</p>
                          {step.completed_at && <p className="text-xs text-green-600 mt-1">Completed: {formatDate(step.completed_at)}</p>}
                        </div>
                        <select 
                          value={step.status} 
                          onChange={(e) => handleUpdateStep(step.id, e.target.value)}
                          className="text-sm border rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="failed">Failed</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-text-muted">
                <AlertCircle size={32} className="mx-auto mb-2 opacity-40" />
                <p>Timeline steps not available</p>
                <p className="text-xs mt-1">Run migration to enable: <code>php artisan migrate</code></p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <User size={20} className="text-primary-600" />
              <h2 className="text-lg font-semibold text-text">Applicant</h2>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-lg">
                {loan.user?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <p className="font-medium text-text">{loan.user?.name || 'Unknown'}</p>
                <p className="text-sm text-text-muted">{loan.user?.email}</p>
              </div>
            </div>
            <div className="text-sm space-y-2">
              <div className="flex justify-between"><span className="text-text-muted">Phone</span><span className="text-text">{loan.user?.phone || '-'}</span></div>
            </div>
          </div>

          {/* Loan Summary */}
          <div className="card">
            <h2 className="text-lg font-semibold text-text mb-4">Loan Summary</h2>
            <div className="text-sm space-y-2">
              <div className="flex justify-between"><span className="text-text-muted">Principal</span><span className="font-medium text-text">{formatCurrency(loan.amount)}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Interest Rate</span><span className="text-text">{loan.interest_rate}%</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Admin Fee</span><span className="text-text">{formatCurrency(loan.admin_fee)}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Fee Paid</span><span className={loan.admin_fee_paid ? 'text-green-600' : 'text-amber-600'}>{loan.admin_fee_paid ? 'Yes' : 'No'}</span></div>
              <div className="flex justify-between border-t pt-2 mt-2"><span className="text-text-muted">EMI</span><span className="font-bold text-text">{formatCurrency(loan.emi)}/mo</span></div>
            </div>
          </div>

          {/* Actions */}
          <div className="card">
            <h2 className="text-lg font-semibold text-text mb-4">Actions</h2>
            <div className="space-y-2">
              {(loan.status === 'pending' || loan.status === 'pending_review') && (
                <>
                  <button onClick={handleApprove} className="btn btn-primary w-full" disabled={actionLoading}>
                    {actionLoading === 'approve' ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                    Approve Loan
                  </button>
                  <button onClick={handleReject} className="btn btn-outline w-full text-red-600 hover:bg-red-50" disabled={actionLoading}>
                    {actionLoading === 'reject' ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                    Reject Loan
                  </button>
                </>
              )}
              {loan.status === 'approved' && (
                <button onClick={handleDisburse} className="btn btn-primary w-full" disabled={actionLoading}>
                  {actionLoading === 'disburse' ? <Loader2 size={16} className="animate-spin" /> : <Banknote size={16} />}
                  Disburse Funds
                </button>
              )}
              {loan.status === 'rejected' && loan.rejection_reason && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-700">Rejection Reason:</p>
                  <p className="text-sm text-red-600">{loan.rejection_reason}</p>
                </div>
              )}
              {['active', 'disbursed', 'completed'].includes(loan.status) && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                  <CheckCircle size={24} className="mx-auto text-green-600 mb-2" />
                  <p className="text-sm font-medium text-green-700">Loan {loan.status}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
