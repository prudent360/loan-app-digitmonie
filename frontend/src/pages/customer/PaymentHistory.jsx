import { useState, useEffect } from 'react'
import CustomerLayout from '../../components/layouts/CustomerLayout'
import { paymentAPI } from '../../services/api'
import { CreditCard, CheckCircle2, XCircle, Clock, Loader2, Download } from 'lucide-react'

export default function PaymentHistory() {
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState([])

  useEffect(() => {
    const loadPayments = async () => {
      try {
        const res = await paymentAPI.getHistory()
        setPayments(res.data || [])
      } catch (err) {
        console.error('Failed to load payments:', err)
      } finally {
        setLoading(false)
      }
    }
    loadPayments()
  }, [])

  const formatCurrency = (amount) => `₦${Number(amount).toLocaleString()}`
  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '-'
  const formatDateTime = (d) => d ? new Date(d).toLocaleString() : '-'

  const getStatusIcon = (status) => {
    if (status === 'success') return <CheckCircle2 size={16} className="text-green-600" />
    if (status === 'failed') return <XCircle size={16} className="text-red-600" />
    return <Clock size={16} className="text-amber-600" />
  }

  const getStatusBadge = (status) => {
    const classes = { success: 'badge badge-success', failed: 'badge badge-error', pending: 'badge badge-warning' }
    return classes[status] || 'badge'
  }

  const downloadCSV = () => {
    const headers = ['Date', 'Reference', 'Loan ID', 'Amount', 'Gateway', 'Status']
    const rows = payments.map(p => [
      formatDateTime(p.created_at),
      p.reference,
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
    a.download = `payment-history-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return <CustomerLayout><div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary-600" size={32} /></div></CustomerLayout>
  }

  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-text">Payment History</h1>
            <p className="text-text-muted">View all your payment transactions</p>
          </div>
          {payments.length > 0 && (
            <button className="btn btn-outline" onClick={downloadCSV}>
              <Download size={16} /> Export CSV
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card">
            <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Total Transactions</p>
            <p className="text-2xl font-bold text-text">{payments.length}</p>
          </div>
          <div className="card">
            <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Successful</p>
            <p className="text-2xl font-bold text-green-600">{payments.filter(p => p.status === 'success').length}</p>
          </div>
          <div className="card">
            <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Pending</p>
            <p className="text-2xl font-bold text-amber-600">{payments.filter(p => p.status === 'pending').length}</p>
          </div>
          <div className="card">
            <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Total Paid</p>
            <p className="text-2xl font-bold text-primary-600">
              {formatCurrency(payments.filter(p => p.status === 'success').reduce((sum, p) => sum + Number(p.amount), 0))}
            </p>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="card p-0">
          {payments.length === 0 ? (
            <div className="text-center py-16">
              <CreditCard size={40} className="text-text-muted mx-auto mb-3 opacity-40" />
              <p className="text-text-muted">No payment transactions yet</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr><th>Date</th><th>Reference</th><th>Loan</th><th>Amount</th><th>Gateway</th><th>Status</th></tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="text-text-muted text-sm">{formatDateTime(payment.created_at)}</td>
                    <td className="font-mono text-xs text-text">{payment.reference}</td>
                    <td className="text-text">#LN-{String(payment.loan_id).padStart(6, '0')}</td>
                    <td className="font-semibold text-text">{formatCurrency(payment.amount)}</td>
                    <td className="text-text-muted capitalize">{payment.gateway}</td>
                    <td>
                      <span className={`${getStatusBadge(payment.status)} inline-flex items-center gap-1`}>
                        {getStatusIcon(payment.status)} {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </CustomerLayout>
  )
}
