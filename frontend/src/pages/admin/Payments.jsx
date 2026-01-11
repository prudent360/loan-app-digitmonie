import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layouts/AdminLayout'
import { useToast } from '../../context/ToastContext'
import api from '../../services/api'
import { Search, CreditCard, CheckCircle2, XCircle, Clock, Loader2, Download, Eye, X } from 'lucide-react'

export default function AdminPayments() {
  const [payments, setPayments] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [gatewayFilter, setGatewayFilter] = useState('all')
  const [selectedLoan, setSelectedLoan] = useState(null)
  const [repayments, setRepayments] = useState([])
  const [loadingRepayments, setLoadingRepayments] = useState(false)
  const toast = useToast()

  useEffect(() => {
    const loadPayments = async () => {
      try {
        const res = await api.get('/admin/payments')
        setPayments(res.data || [])
      } catch (err) {
        console.error('Failed to load payments:', err)
        toast.error('Failed to load payments')
      } finally {
        setLoading(false)
      }
    }
    loadPayments()
  }, [])

  useEffect(() => {
    let result = payments
    if (search) {
      result = result.filter(p => 
        p.reference?.toLowerCase().includes(search.toLowerCase()) ||
        p.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.user?.email?.toLowerCase().includes(search.toLowerCase())
      )
    }
    if (statusFilter !== 'all') result = result.filter(p => p.status === statusFilter)
    if (gatewayFilter !== 'all') result = result.filter(p => p.gateway === gatewayFilter)
    setFiltered(result)
  }, [payments, search, statusFilter, gatewayFilter])

  const viewLoanRepayments = async (loanId) => {
    setLoadingRepayments(true)
    try {
      const res = await api.get(`/admin/loans/${loanId}/repayments`)
      setSelectedLoan(res.data.loan)
      setRepayments(res.data.repayments || [])
    } catch (err) {
      toast.error('Failed to load repayment schedule')
      console.error(err)
    } finally {
      setLoadingRepayments(false)
    }
  }

  const formatCurrency = (amount) => `₦${Number(amount).toLocaleString()}`
  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '-'
  const formatDateTime = (d) => d ? new Date(d).toLocaleString() : '-'

  const getStatusIcon = (status) => {
    if (status === 'success') return <CheckCircle2 size={14} className="text-green-600" />
    if (status === 'failed') return <XCircle size={14} className="text-red-600" />
    return <Clock size={14} className="text-amber-600" />
  }

  const getStatusBadge = (status) => {
    const classes = { success: 'badge badge-success', failed: 'badge badge-error', pending: 'badge badge-warning', paid: 'badge badge-success' }
    return classes[status] || 'badge'
  }

  const downloadCSV = () => {
    const headers = ['Date', 'Reference', 'User', 'Email', 'Loan ID', 'Amount', 'Gateway', 'Status']
    const rows = filtered.map(p => [
      formatDateTime(p.created_at),
      p.reference,
      p.user?.name || 'Unknown',
      p.user?.email || '-',
      `#LN-${String(p.loan_id).padStart(6, '0')}`,
      p.amount,
      p.gateway,
      p.status
    ])
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Stats
  const totalPayments = payments.length
  const successfulPayments = payments.filter(p => p.status === 'success').length
  const totalAmount = payments.filter(p => p.status === 'success').reduce((sum, p) => sum + Number(p.amount), 0)

  if (loading) {
    return <AdminLayout><div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary-600" size={32} /></div></AdminLayout>
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-text">Payment Transactions</h1>
            <p className="text-text-muted">View all user payment transactions</p>
          </div>
          {filtered.length > 0 && (
            <button className="btn btn-outline" onClick={downloadCSV}>
              <Download size={16} /> Export CSV
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card">
            <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Total Transactions</p>
            <p className="text-2xl font-bold text-text">{totalPayments}</p>
          </div>
          <div className="card">
            <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Successful</p>
            <p className="text-2xl font-bold text-green-600">{successfulPayments}</p>
          </div>
          <div className="card">
            <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Failed/Pending</p>
            <p className="text-2xl font-bold text-amber-600">{totalPayments - successfulPayments}</p>
          </div>
          <div className="card">
            <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Total Collected</p>
            <p className="text-2xl font-bold text-primary-600">{formatCurrency(totalAmount)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="card flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
          <div className="flex items-center gap-2 flex-1 border border-border rounded-lg px-3 py-2 bg-muted/50">
            <Search size={18} className="text-text-muted" />
            <input type="text" placeholder="Search by user or reference..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 bg-transparent border-none text-text text-sm outline-none placeholder:text-text-muted" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'success', 'pending', 'failed'].map(s => (
              <button key={s} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${statusFilter === s ? 'bg-primary-600 text-white' : 'bg-muted text-text-muted hover:text-text'}`} onClick={() => setStatusFilter(s)}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
            ))}
          </div>
          <div className="flex gap-2">
            {['all', 'paystack', 'flutterwave'].map(g => (
              <button key={g} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${gatewayFilter === g ? 'bg-primary-600 text-white' : 'bg-muted text-text-muted hover:text-text'}`} onClick={() => setGatewayFilter(g)}>{g.charAt(0).toUpperCase() + g.slice(1)}</button>
            ))}
          </div>
        </div>

        {/* Payments Table */}
        <div className="card p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <CreditCard size={40} className="text-text-muted mx-auto mb-3 opacity-40" />
              <p className="text-text-muted">No payment transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table min-w-[900px]">
                <thead>
                  <tr><th>Date</th><th>User</th><th>Reference</th><th>Loan</th><th>Amount</th><th>Gateway</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filtered.map((payment) => (
                    <tr key={payment.id}>
                      <td className="text-text-muted text-sm whitespace-nowrap">{formatDateTime(payment.created_at)}</td>
                      <td className="whitespace-nowrap">
                        <p className="font-medium text-text text-sm">{payment.user?.name || 'Unknown'}</p>
                        <p className="text-xs text-text-muted">{payment.user?.email || '-'}</p>
                      </td>
                      <td className="font-mono text-xs text-text whitespace-nowrap">{payment.reference}</td>
                      <td className="text-text whitespace-nowrap">#LN-{String(payment.loan_id).padStart(6, '0')}</td>
                      <td className="font-semibold text-text whitespace-nowrap">{formatCurrency(payment.amount)}</td>
                      <td className="text-text-muted capitalize whitespace-nowrap">{payment.gateway}</td>
                      <td>
                        <span className={`${getStatusBadge(payment.status)} inline-flex items-center gap-1`}>
                          {getStatusIcon(payment.status)} {payment.status}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="p-1.5 rounded text-text-muted hover:text-primary-600 hover:bg-primary-50" 
                          onClick={() => viewLoanRepayments(payment.loan_id)}
                          title="View Repayment Schedule"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Repayment Schedule Modal */}
        {selectedLoan && (
          <div className="modal-overlay" onClick={() => setSelectedLoan(null)}>
            <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Repayment Schedule - #LN-{String(selectedLoan.id).padStart(6, '0')}</h3>
                <button onClick={() => setSelectedLoan(null)}><X size={20} /></button>
              </div>
              <div className="modal-body">
                {loadingRepayments ? (
                  <div className="flex items-center justify-center py-8"><Loader2 className="animate-spin text-primary-600" size={24} /></div>
                ) : (
                  <>
                    {/* Loan Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div><span className="text-xs text-text-muted">Borrower</span><p className="font-medium text-text">{selectedLoan.user?.name || 'Unknown'}</p></div>
                      <div><span className="text-xs text-text-muted">Amount</span><p className="font-medium text-text">{formatCurrency(selectedLoan.amount)}</p></div>
                      <div><span className="text-xs text-text-muted">Status</span><p className="font-medium text-text capitalize">{selectedLoan.status}</p></div>
                      <div><span className="text-xs text-text-muted">Tenure</span><p className="font-medium text-text">{selectedLoan.tenure_months} months</p></div>
                    </div>

                    {/* Repayments Table */}
                    {repayments.length === 0 ? (
                      <p className="text-center text-text-muted py-8">No repayment schedule generated yet</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="table">
                          <thead><tr><th>#</th><th>Due Date</th><th>Amount</th><th>Status</th><th>Paid On</th></tr></thead>
                          <tbody>
                            {repayments.map((r, i) => (
                              <tr key={r.id}>
                                <td className="text-text">{i + 1}</td>
                                <td className="text-text">{formatDate(r.due_date)}</td>
                                <td className="font-medium text-text">{formatCurrency(r.amount)}</td>
                                <td><span className={getStatusBadge(r.status)}>{r.status}</span></td>
                                <td className="text-text-muted">{r.paid_at ? formatDate(r.paid_at) : '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setSelectedLoan(null)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
