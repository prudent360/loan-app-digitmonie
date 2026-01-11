import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/layouts/AdminLayout'
import { useToast } from '../../context/ToastContext'
import { adminAPI } from '../../services/api'
import api from '../../services/api'
import { Search, Eye, CheckCircle, XCircle, X, Loader2, Banknote, Clock, CheckCircle2, AlertCircle } from 'lucide-react'

export default function AdminLoans() {
  const [loans, setLoans] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedLoan, setSelectedLoan] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [timelineSteps, setTimelineSteps] = useState([])
  const [timelineLoading, setTimelineLoading] = useState(false)
  const toast = useToast()

  // Fetch loans from API
  useEffect(() => {
    const loadLoans = async () => {
      try {
        const res = await adminAPI.getLoans()
        const loansData = res.data.data || res.data.loans || res.data || []
        setLoans(loansData)
      } catch (err) {
        console.error('Failed to load loans:', err)
        toast.error('Failed to load loans')
      } finally {
        setLoading(false)
      }
    }
    loadLoans()
  }, [])

  // Filter loans
  useEffect(() => {
    let result = loans
    if (search) result = result.filter(l => l.user?.name?.toLowerCase().includes(search.toLowerCase()) || l.user?.email?.toLowerCase().includes(search.toLowerCase()))
    if (statusFilter !== 'all') result = result.filter(l => l.status === statusFilter)
    setFiltered(result)
  }, [loans, search, statusFilter])

  // Load timeline when loan is selected
  useEffect(() => {
    if (selectedLoan && !selectedLoan.showReject) {
      loadTimeline(selectedLoan.id)
    }
  }, [selectedLoan?.id])

  const loadTimeline = async (loanId) => {
    setTimelineLoading(true)
    try {
      const res = await api.get(`/admin/loans/${loanId}/timeline`)
      setTimelineSteps(res.data.steps || [])
    } catch (err) {
      console.error('Failed to load timeline:', err)
    } finally {
      setTimelineLoading(false)
    }
  }

  const handleUpdateStep = async (stepId, status, notes = '') => {
    try {
      await api.put(`/admin/loans/${selectedLoan.id}/timeline/${stepId}`, { status, admin_notes: notes })
      loadTimeline(selectedLoan.id)
      toast.success('Step updated!')
    } catch (err) {
      toast.error('Failed to update step')
    }
  }

  const handleApprove = async (id) => {
    setActionLoading(true)
    try {
      await adminAPI.approveLoan(id)
      setLoans(prev => prev.map(l => l.id === id ? { ...l, status: 'approved' } : l))
      toast.success('Loan approved!')
      loadTimeline(id) // Refresh timeline
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve loan')
      console.error(err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async (id) => {
    if (!rejectReason.trim()) { toast.error('Provide rejection reason'); return }
    setActionLoading(true)
    try {
      await adminAPI.rejectLoan(id, rejectReason)
      setLoans(prev => prev.map(l => l.id === id ? { ...l, status: 'rejected' } : l))
      toast.success('Loan rejected')
      setSelectedLoan(null)
      setRejectReason('')
    } catch (err) {
      toast.error('Failed to reject loan')
      console.error(err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDisburse = async (id) => {
    setActionLoading(true)
    try {
      await adminAPI.disburseLoan(id)
      setLoans(prev => prev.map(l => l.id === id ? { ...l, status: 'disbursed' } : l))
      toast.success('Loan disbursed successfully!')
      loadTimeline(id) // Refresh timeline
    } catch (err) {
      toast.error('Failed to disburse loan')
      console.error(err)
    } finally {
      setActionLoading(false)
    }
  }

  const formatCurrency = (amount) => `₦${Number(amount).toLocaleString()}`
  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '-'
  const getStatusBadge = (s) => ({ pending: 'badge-warning', pending_review: 'badge-info', approved: 'badge-success', rejected: 'badge-error', disbursed: 'badge-info', active: 'badge-success', completed: 'badge-primary' }[s] || '')

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex justify-between items-center">
            <div>
              <div className="animate-pulse bg-gray-200 rounded w-40 h-8 mb-2" />
              <div className="animate-pulse bg-gray-200 rounded w-64 h-4" />
            </div>
          </div>
          
          {/* Filters Skeleton */}
          <div className="card flex items-center gap-4">
            <div className="animate-pulse bg-gray-200 rounded-lg flex-1 h-10" />
            <div className="flex gap-2">
              {[1,2,3,4,5].map(i => <div key={i} className="animate-pulse bg-gray-200 rounded-lg w-20 h-8" />)}
            </div>
          </div>
          
          {/* Table Skeleton */}
          <div className="card p-0">
            <table className="table">
              <thead>
                <tr>
                  {['Applicant','Amount','Tenure','Purpose','Date','Status','Actions'].map(h => (
                    <th key={h}><div className="animate-pulse bg-gray-200 rounded w-16 h-4" /></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1,2,3,4,5,6,7,8].map(i => (
                  <tr key={i}>
                    <td>
                      <div className="animate-pulse bg-gray-200 rounded w-28 h-4 mb-1" />
                      <div className="animate-pulse bg-gray-200 rounded w-36 h-3" />
                    </td>
                    <td><div className="animate-pulse bg-gray-200 rounded w-24 h-4" /></td>
                    <td><div className="animate-pulse bg-gray-200 rounded w-12 h-4" /></td>
                    <td><div className="animate-pulse bg-gray-200 rounded w-24 h-4" /></td>
                    <td><div className="animate-pulse bg-gray-200 rounded w-20 h-4" /></td>
                    <td><div className="animate-pulse bg-gray-200 rounded-full w-16 h-6" /></td>
                    <td><div className="flex gap-1">{[1,2,3].map(j => <div key={j} className="animate-pulse bg-gray-200 rounded w-7 h-7" />)}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-semibold text-text">Loan Applications</h1><p className="text-text-muted">Review and manage loan applications</p></div>

        {/* Filters */}
        <div className="card flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex items-center gap-2 flex-1 border border-border rounded-lg px-3 py-2 bg-muted/50">
            <Search size={18} className="text-text-muted" />
            <input type="text" placeholder="Search by applicant..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 bg-transparent border-none text-text text-sm outline-none placeholder:text-text-muted" />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {['all', 'pending', 'approved', 'disbursed', 'rejected'].map(s => (
              <button key={s} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${statusFilter === s ? 'bg-primary-600 text-white' : 'bg-muted text-text-muted hover:text-text'}`} onClick={() => setStatusFilter(s)}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
            ))}
          </div>
        </div>

        {/* Loans Table */}
        <div className="card p-0">
          <table className="table">
            <thead><tr><th>Applicant</th><th>Amount</th><th>Tenure</th><th>Purpose</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="7" className="text-center text-text-muted py-8">No loan applications found</td></tr>
              ) : (
                filtered.map((loan) => (
                  <tr key={loan.id}>
                    <td><p className="font-medium text-text text-sm">{loan.user?.name || 'Unknown'}</p><p className="text-xs text-text-muted">{loan.user?.email || '-'}</p></td>
                    <td className="font-medium text-text">{formatCurrency(loan.amount)}</td>
                    <td className="text-text-muted">{loan.tenure_months} mo</td>
                    <td className="text-text-muted">{loan.purpose || '-'}</td>
                    <td className="text-text-muted">{formatDate(loan.created_at)}</td>
                    <td><span className={`badge ${getStatusBadge(loan.status)}`}>{loan.status}</span></td>
                    <td>
                      <div className="flex gap-1">
                        <Link to={`/admin/loans/${loan.id}`} className="p-1.5 rounded text-text-muted hover:text-text hover:bg-muted"><Eye size={16} /></Link>
                        {(loan.status === 'pending' || loan.status === 'pending_review') && (
                          <>
                            <button className="p-1.5 rounded text-text-muted hover:text-primary-600 hover:bg-primary-50" onClick={() => handleApprove(loan.id)} title="Approve"><CheckCircle size={16} /></button>
                            <button className="p-1.5 rounded text-text-muted hover:text-red-600 hover:bg-red-50" onClick={() => setSelectedLoan({ ...loan, showReject: true })} title="Reject"><XCircle size={16} /></button>
                          </>
                        )}
                        {loan.status === 'approved' && (
                          <button className="p-1.5 rounded text-text-muted hover:text-green-600 hover:bg-green-50" onClick={() => handleDisburse(loan.id)} title="Disburse"><Banknote size={16} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Loan Modal with Timeline Management */}
        {selectedLoan && (
          <div className="modal-overlay" onClick={() => { setSelectedLoan(null); setRejectReason(''); setTimelineSteps([]) }}>
            <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
              <div className="modal-header"><h3 className="font-semibold text-text">{selectedLoan.showReject ? 'Reject Application' : 'Loan Details & Timeline'}</h3><button onClick={() => { setSelectedLoan(null); setRejectReason(''); setTimelineSteps([]) }}><X size={20} /></button></div>
              <div className="modal-body max-h-[70vh] overflow-y-auto">
                {selectedLoan.showReject ? (
                  <div className="form-group"><label className="form-label">Rejection Reason</label><textarea className="form-input" rows={4} placeholder="Explain why..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} /></div>
                ) : (
                  <>
                    {/* Loan Info */}
                    <div className="text-center mb-6">
                      <p className="text-2xl font-bold text-text">{formatCurrency(selectedLoan.amount)}</p>
                      <span className={`badge ${getStatusBadge(selectedLoan.status)}`}>{selectedLoan.status}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                      {[['Applicant', selectedLoan.user?.name || 'Unknown'], ['Purpose', selectedLoan.purpose || '-'], ['Tenure', `${selectedLoan.tenure_months} months`], ['Applied', formatDate(selectedLoan.created_at)]].map(([l, v]) => (
                        <div key={l}><span className="text-text-muted">{l}</span><p className="font-medium text-text">{v}</p></div>
                      ))}
                    </div>

                    {/* Timeline Steps Management */}
                    <div className="border-t border-border pt-6">
                      <h4 className="font-semibold text-text mb-4">Progress Timeline</h4>
                      {timelineLoading ? (
                        <div className="flex justify-center py-4"><Loader2 className="animate-spin" size={24} /></div>
                      ) : (
                        <div className="space-y-3">
                          {timelineSteps.map((step) => (
                            <div key={step.id} className={`flex items-start gap-3 p-3 rounded-lg border ${step.status === 'completed' ? 'bg-green-50 border-green-200' : step.status === 'in_progress' ? 'bg-blue-50 border-blue-200' : step.status === 'failed' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${step.status === 'completed' ? 'bg-green-500 text-white' : step.status === 'in_progress' ? 'bg-blue-500 text-white' : step.status === 'failed' ? 'bg-red-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                                {step.status === 'completed' ? <CheckCircle2 size={16} /> : step.status === 'failed' ? <AlertCircle size={16} /> : <span className="text-sm font-bold">{step.step_number}</span>}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-text">{step.title}</p>
                                <p className="text-xs text-text-muted">{step.description}</p>
                                {step.completed_at && <p className="text-xs text-green-600 mt-1">Completed: {new Date(step.completed_at).toLocaleString()}</p>}
                                {step.admin_notes && <p className="text-xs text-gray-600 mt-1 italic">Note: {step.admin_notes}</p>}
                              </div>
                              <div className="flex-shrink-0">
                                <select 
                                  value={step.status} 
                                  onChange={(e) => handleUpdateStep(step.id, e.target.value)}
                                  className="text-xs border rounded px-2 py-1 bg-white"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="in_progress">In Progress</option>
                                  <option value="completed">Completed</option>
                                  <option value="failed">Failed</option>
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                {selectedLoan.showReject ? (
                  <><button className="btn btn-outline" onClick={() => setSelectedLoan(null)} disabled={actionLoading}>Cancel</button><button className="btn btn-danger" onClick={() => handleReject(selectedLoan.id)} disabled={actionLoading}>{actionLoading ? 'Rejecting...' : 'Reject'}</button></>
                ) : (selectedLoan.status === 'pending' || selectedLoan.status === 'pending_review') ? (
                  <><button className="btn btn-danger" onClick={() => setSelectedLoan({ ...selectedLoan, showReject: true })}>Reject</button><button className="btn btn-primary" onClick={() => handleApprove(selectedLoan.id)} disabled={actionLoading}>{actionLoading ? 'Approving...' : 'Approve'}</button></>
                ) : selectedLoan.status === 'approved' && (
                  <button className="btn btn-primary" onClick={() => handleDisburse(selectedLoan.id)} disabled={actionLoading}><Banknote size={16} /> {actionLoading ? 'Disbursing...' : 'Disburse Funds'}</button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
