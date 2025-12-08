import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layouts/AdminLayout'
import { useToast } from '../../context/ToastContext'
import { adminAPI } from '../../services/api'
import { Search, Eye, CheckCircle, XCircle, X, Loader2 } from 'lucide-react'

export default function AdminLoans() {
  const [loans, setLoans] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedLoan, setSelectedLoan] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
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

  const handleApprove = async (id) => {
    setActionLoading(true)
    try {
      await adminAPI.approveLoan(id)
      setLoans(prev => prev.map(l => l.id === id ? { ...l, status: 'approved' } : l))
      toast.success('Loan approved!')
      setSelectedLoan(null)
    } catch (err) {
      toast.error('Failed to approve loan')
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

  const formatCurrency = (amount) => `₦${Number(amount).toLocaleString()}`
  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '-'
  const getStatusBadge = (s) => ({ pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-error', disbursed: 'badge-info' }[s] || '')

  if (loading) {
    return <AdminLayout><div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary-600" size={32} /></div></AdminLayout>
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
            {['all', 'pending', 'approved', 'rejected'].map(s => (
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
                        <button className="p-1.5 rounded text-text-muted hover:text-text hover:bg-muted" onClick={() => setSelectedLoan(loan)}><Eye size={16} /></button>
                        {loan.status === 'pending' && (
                          <>
                            <button className="p-1.5 rounded text-text-muted hover:text-primary-600 hover:bg-primary-50" onClick={() => handleApprove(loan.id)}><CheckCircle size={16} /></button>
                            <button className="p-1.5 rounded text-text-muted hover:text-red-600 hover:bg-red-50" onClick={() => setSelectedLoan({ ...loan, showReject: true })}><XCircle size={16} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Loan Modal */}
        {selectedLoan && (
          <div className="modal-overlay" onClick={() => { setSelectedLoan(null); setRejectReason('') }}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header"><h3 className="font-semibold text-text">{selectedLoan.showReject ? 'Reject Application' : 'Loan Details'}</h3><button onClick={() => { setSelectedLoan(null); setRejectReason('') }}><X size={20} /></button></div>
              <div className="modal-body">
                {selectedLoan.showReject ? (
                  <div className="form-group"><label className="form-label">Rejection Reason</label><textarea className="form-input" rows={4} placeholder="Explain why..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} /></div>
                ) : (
                  <>
                    <div className="text-center mb-6"><p className="text-2xl font-bold text-text">{formatCurrency(selectedLoan.amount)}</p><span className={`badge ${getStatusBadge(selectedLoan.status)}`}>{selectedLoan.status}</span></div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {[['Applicant', selectedLoan.user?.name || 'Unknown'], ['Purpose', selectedLoan.purpose || '-'], ['Tenure', `${selectedLoan.tenure_months} months`], ['Applied', formatDate(selectedLoan.created_at)]].map(([l, v]) => (
                        <div key={l}><span className="text-text-muted">{l}</span><p className="font-medium text-text">{v}</p></div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                {selectedLoan.showReject ? (
                  <><button className="btn btn-outline" onClick={() => setSelectedLoan(null)} disabled={actionLoading}>Cancel</button><button className="btn btn-danger" onClick={() => handleReject(selectedLoan.id)} disabled={actionLoading}>{actionLoading ? 'Rejecting...' : 'Reject'}</button></>
                ) : selectedLoan.status === 'pending' && (
                  <><button className="btn btn-danger" onClick={() => setSelectedLoan({ ...selectedLoan, showReject: true })}>Reject</button><button className="btn btn-primary" onClick={() => handleApprove(selectedLoan.id)} disabled={actionLoading}>{actionLoading ? 'Approving...' : 'Approve'}</button></>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
