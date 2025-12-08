import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import CustomerLayout from '../../components/layouts/CustomerLayout'
import { PlusCircle, FileText, Search, ChevronRight, Clock, CheckCircle2, XCircle } from 'lucide-react'

const mockLoans = [
  { id: 1, amount: 500000, interest_rate: 15, tenure_months: 12, purpose: 'Business Expansion', status: 'completed', created_at: '2024-06-15', total_paid: 500000, total_due: 500000 },
  { id: 2, amount: 1000000, interest_rate: 12, tenure_months: 24, purpose: 'Education', status: 'active', created_at: '2024-10-01', total_paid: 350000, total_due: 1000000 },
  { id: 3, amount: 500000, interest_rate: 15, tenure_months: 6, purpose: 'Medical Emergency', status: 'pending', created_at: '2024-12-01', total_paid: 0, total_due: 0 },
]

export default function CustomerLoans() {
  const [loans] = useState(mockLoans)
  const [filtered, setFiltered] = useState(mockLoans)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    let result = loans
    if (search) result = result.filter(l => l.purpose.toLowerCase().includes(search.toLowerCase()))
    if (statusFilter !== 'all') result = result.filter(l => l.status === statusFilter)
    setFiltered(result)
  }, [loans, search, statusFilter])

  const formatCurrency = (amount) => `₦${amount.toLocaleString()}`
  const getStatusBadge = (s) => ({ pending: 'badge badge-warning', active: 'badge badge-success', completed: 'badge badge-info', rejected: 'badge badge-error' }[s] || 'badge')

  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-text">My Loans</h1>
            <p className="text-text-muted">View and manage your loan applications</p>
          </div>
          <Link to="/loans/apply" className="btn btn-primary">
            <PlusCircle size={18} /> Apply for Loan
          </Link>
        </div>

        {/* Filters */}
        <div className="card flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex items-center gap-2 flex-1 border border-border rounded-lg px-3 py-2 bg-muted/50">
            <Search size={18} className="text-text-muted" />
            <input type="text" placeholder="Search by purpose..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 bg-transparent border-none text-text text-sm outline-none placeholder:text-text-muted" />
          </div>
          <div className="flex gap-2">
            {['all', 'active', 'pending', 'completed'].map(s => (
              <button key={s} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${statusFilter === s ? 'bg-primary-600 text-white' : 'bg-muted text-text-muted hover:text-text'}`} onClick={() => setStatusFilter(s)}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Loans Table */}
        <div className="card p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <FileText size={40} className="text-text-muted mx-auto mb-3 opacity-40" />
              <p className="text-text-muted">No loans found</p>
              <Link to="/loans/apply" className="btn btn-primary mt-4">Apply Now</Link>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr><th>Purpose</th><th>Amount</th><th>Interest</th><th>Tenure</th><th>Date</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {filtered.map((loan) => (
                  <tr key={loan.id}>
                    <td className="font-medium text-text">{loan.purpose}</td>
                    <td className="text-text">{formatCurrency(loan.amount)}</td>
                    <td className="text-text-muted">{loan.interest_rate}% p.a.</td>
                    <td className="text-text-muted">{loan.tenure_months} months</td>
                    <td className="text-text-muted">{loan.created_at}</td>
                    <td><span className={getStatusBadge(loan.status)}>{loan.status}</span></td>
                    <td><Link to={`/loans/${loan.id}`} className="text-primary-600 hover:underline text-sm flex items-center gap-1">View <ChevronRight size={14} /></Link></td>
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
