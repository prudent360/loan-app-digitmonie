import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import CustomerLayout from '../../components/layouts/CustomerLayout'
import { loanAPI } from '../../services/api'
import { ArrowLeft, Calendar, CheckCircle2, Clock, CreditCard, Download, Loader2 } from 'lucide-react'

export default function LoanDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [loan, setLoan] = useState(null)
  const [repayments, setRepayments] = useState([])

  useEffect(() => {
    const loadLoan = async () => {
      try {
        const res = await loanAPI.getOne(id)
        setLoan(res.data)
        setRepayments(res.data.repayments || [])
      } catch (err) {
        console.error('Failed to load loan:', err)
        navigate('/loans')
      } finally {
        setLoading(false)
      }
    }
    loadLoan()
  }, [id])

  const formatCurrency = (amount) => `₦${Number(amount).toLocaleString()}`
  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '-'
  const getStatusBadge = (s) => `badge ${({ pending: 'badge-warning', paid: 'badge-success', active: 'badge-success', approved: 'badge-success', disbursed: 'badge-info', overdue: 'badge-error', rejected: 'badge-error', completed: 'badge-info' }[s] || 'badge-info')}`

  if (loading) {
    return <CustomerLayout><div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary-600" size={32} /></div></CustomerLayout>
  }

  if (!loan) {
    return <CustomerLayout><div className="text-center py-16 text-text-muted">Loan not found</div></CustomerLayout>
  }

  const progressPercent = loan.total_payable ? Math.round((Number(loan.total_paid || 0) / Number(loan.total_payable)) * 100) : 0

  return (
    <CustomerLayout>
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <button className="flex items-center gap-2 text-text-muted hover:text-text mb-4 text-sm" onClick={() => navigate('/loans')}>
            <ArrowLeft size={16} /> Back to Loans
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-text">{loan.purpose || 'Loan Application'}</h1>
              <p className="text-text-muted">Application ID: #LN-{String(loan.id).padStart(6, '0')}</p>
            </div>
            <span className={getStatusBadge(loan.status)}>{loan.status}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Loan Overview */}
          <div className="lg:col-span-2 card">
            <div className="flex flex-wrap gap-8 mb-6">
              <div><span className="text-xs text-text-muted uppercase tracking-wide">Loan Amount</span><p className="text-2xl font-bold text-text">{formatCurrency(loan.amount)}</p></div>
              <div><span className="text-xs text-text-muted uppercase tracking-wide">Monthly EMI</span><p className="text-2xl font-bold text-text">{formatCurrency(loan.emi || 0)}</p></div>
              <div><span className="text-xs text-text-muted uppercase tracking-wide">Interest Rate</span><p className="text-2xl font-bold text-text">{loan.interest_rate}%</p></div>
              <div><span className="text-xs text-text-muted uppercase tracking-wide">Tenure</span><p className="text-2xl font-bold text-text">{loan.tenure_months} mo</p></div>
            </div>
            {(loan.status === 'active' || loan.status === 'completed' || loan.status === 'disbursed') && (
              <div className="pt-4 border-t border-border">
                <div className="flex justify-between text-sm mb-2"><span className="text-text-muted">Repayment Progress</span><span className="font-medium text-text">{progressPercent}%</span></div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary-600 rounded-full transition-all" style={{ width: `${progressPercent}%` }} /></div>
                <div className="flex justify-between text-xs text-text-muted mt-2"><span>Paid: {formatCurrency(loan.total_paid || 0)}</span><span>Remaining: {formatCurrency(loan.remaining_balance || 0)}</span></div>
              </div>
            )}
          </div>

          {/* Summary Card */}
          <div className="summary-card">
            <p className="label">Next Payment Due</p>
            <p className="value">{formatCurrency(loan.emi || 0)}</p>
            <p className="text-sm text-primary-100 mt-1">{loan.next_payment?.due_date ? formatDate(loan.next_payment.due_date) : 'No payments scheduled'}</p>
            <button className="w-full mt-6 bg-white text-primary-600 font-medium py-2.5 rounded-lg hover:bg-primary-50 transition-colors flex items-center justify-center gap-2">
              <CreditCard size={18} /> Make Payment
            </button>
          </div>
        </div>

        {/* Loan Details & Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="card">
            <h3 className="text-sm font-medium text-text mb-4">Loan Details</h3>
            <div className="space-y-3 text-sm">
              {[['Principal Amount', formatCurrency(loan.amount)], ['Total Interest', formatCurrency(loan.total_interest || 0)], ['Total Payable', formatCurrency(loan.total_payable || 0)], ['Purpose', loan.purpose_details || loan.purpose || '-']].map(([l, v]) => (
                <div key={l} className="flex justify-between"><span className="text-text-muted">{l}</span><span className="font-medium text-text">{v}</span></div>
              ))}
            </div>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-text mb-4">Timeline</h3>
            <div className="space-y-4">
              {[['Submitted', loan.created_at, true], ['Approved', loan.approved_at, !!loan.approved_at], ['Disbursed', loan.disbursed_at, !!loan.disbursed_at]].map(([label, date, done]) => (
                <div key={label} className="flex items-center gap-3 text-sm">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${done ? 'bg-primary-600 text-white' : 'bg-muted text-text-muted'}`}>
                    {done ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                  </div>
                  <div className="flex-1"><p className="font-medium text-text">{label}</p></div>
                  <span className="text-text-muted">{date ? formatDate(date) : '-'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Repayment Schedule */}
        <div className="card p-0">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h3 className="text-sm font-medium text-text">Repayment Schedule</h3>
            <button className="btn btn-outline btn-sm"><Download size={14} /> Download</button>
          </div>
          {repayments.length === 0 ? (
            <div className="text-center py-10 text-text-muted">No repayment schedule yet</div>
          ) : (
            <table className="table">
              <thead><tr><th>#</th><th>Due Date</th><th>Amount</th><th>Paid On</th><th>Status</th></tr></thead>
              <tbody>
                {repayments.map((p, i) => (
                  <tr key={p.id}>
                    <td className="text-text">{i + 1}</td>
                    <td className="text-text">{formatDate(p.due_date)}</td>
                    <td className="font-medium text-text">{formatCurrency(p.amount)}</td>
                    <td className="text-text-muted">{p.paid_at ? formatDate(p.paid_at) : '-'}</td>
                    <td><span className={getStatusBadge(p.status)}>{p.status}</span></td>
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
