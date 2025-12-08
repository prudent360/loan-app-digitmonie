import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import CustomerLayout from '../../components/layouts/CustomerLayout'
import { ArrowLeft, Calendar, CheckCircle2, Clock, CreditCard, Download } from 'lucide-react'

const mockLoan = { id: 2, amount: 1000000, interest_rate: 12, tenure_months: 24, purpose: 'Education', purpose_details: 'Masters degree program', status: 'active', created_at: '2024-10-01', approved_at: '2024-10-02', disbursed_at: '2024-10-03', emi: 47073, total_interest: 129753, total_payable: 1129753, total_paid: 350000, remaining_balance: 779753, next_payment_date: '2025-01-15' }
const mockRepayments = [
  { id: 1, amount: 47073, due_date: '2024-11-01', paid_at: '2024-10-30', status: 'paid' },
  { id: 2, amount: 47073, due_date: '2024-12-01', paid_at: '2024-11-28', status: 'paid' },
  { id: 3, amount: 47073, due_date: '2025-01-01', paid_at: null, status: 'pending' },
  { id: 4, amount: 47073, due_date: '2025-02-01', paid_at: null, status: 'pending' },
]

export default function LoanDetails() {
  const navigate = useNavigate()
  const [loan] = useState(mockLoan)
  const [repayments] = useState(mockRepayments)

  const formatCurrency = (amount) => `₦${amount.toLocaleString()}`
  const progressPercent = Math.round((loan.total_paid / loan.total_payable) * 100)
  const getStatusBadge = (s) => `badge ${({ pending: 'badge-warning', paid: 'badge-success', active: 'badge-success', overdue: 'badge-error' }[s] || 'badge-info')}`

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
              <h1 className="text-2xl font-semibold text-text">{loan.purpose}</h1>
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
              <div><span className="text-xs text-text-muted uppercase tracking-wide">Monthly EMI</span><p className="text-2xl font-bold text-text">{formatCurrency(loan.emi)}</p></div>
              <div><span className="text-xs text-text-muted uppercase tracking-wide">Interest Rate</span><p className="text-2xl font-bold text-text">{loan.interest_rate}%</p></div>
              <div><span className="text-xs text-text-muted uppercase tracking-wide">Tenure</span><p className="text-2xl font-bold text-text">{loan.tenure_months} mo</p></div>
            </div>
            {(loan.status === 'active' || loan.status === 'completed') && (
              <div className="pt-4 border-t border-border">
                <div className="flex justify-between text-sm mb-2"><span className="text-text-muted">Repayment Progress</span><span className="font-medium text-text">{progressPercent}%</span></div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary-600 rounded-full transition-all" style={{ width: `${progressPercent}%` }} /></div>
                <div className="flex justify-between text-xs text-text-muted mt-2"><span>Paid: {formatCurrency(loan.total_paid)}</span><span>Remaining: {formatCurrency(loan.remaining_balance)}</span></div>
              </div>
            )}
          </div>

          {/* Summary Card */}
          <div className="summary-card">
            <p className="label">Next Payment Due</p>
            <p className="value">{formatCurrency(loan.emi)}</p>
            <p className="text-sm text-primary-100 mt-1">{loan.next_payment_date}</p>
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
              {[['Principal Amount', formatCurrency(loan.amount)], ['Total Interest', formatCurrency(loan.total_interest)], ['Total Payable', formatCurrency(loan.total_payable)], ['Purpose', loan.purpose_details || loan.purpose]].map(([l, v]) => (
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
                  <span className="text-text-muted">{date || '-'}</span>
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
          <table className="table">
            <thead><tr><th>#</th><th>Due Date</th><th>Amount</th><th>Paid On</th><th>Status</th></tr></thead>
            <tbody>
              {repayments.map((p, i) => (
                <tr key={p.id}>
                  <td className="text-text">{i + 1}</td>
                  <td className="text-text">{p.due_date}</td>
                  <td className="font-medium text-text">{formatCurrency(p.amount)}</td>
                  <td className="text-text-muted">{p.paid_at || '-'}</td>
                  <td><span className={getStatusBadge(p.status)}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </CustomerLayout>
  )
}
