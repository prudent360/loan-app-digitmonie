import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import CustomerLayout from '../../components/layouts/CustomerLayout'
import { loanAPI } from '../../services/api'
import { PlusCircle, FileText, Search, ChevronRight, Loader2 } from 'lucide-react'

export default function CustomerLoans() {
  const [loans, setLoans] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Fetch loans from API
  useEffect(() => {
    const loadLoans = async () => {
      try {
        const res = await loanAPI.getAll()
        const loansData = res.data.data || res.data.loans || res.data || []
        setLoans(loansData)
      } catch (err) {
        console.error('Failed to load loans:', err)
      } finally {
        setLoading(false)
      }
    }
    loadLoans()
  }, [])

  // Filter loans
  useEffect(() => {
    let result = loans
    if (search) result = result.filter(l => l.purpose?.toLowerCase().includes(search.toLowerCase()))
    if (statusFilter !== 'all') result = result.filter(l => l.status === statusFilter)
    setFiltered(result)
  }, [loans, search, statusFilter])

  const formatCurrency = (amount) => `₦${Number(amount).toLocaleString()}`
  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '-'
  const getStatusBadge = (s) => ({ pending: 'badge badge-warning', active: 'badge badge-success', completed: 'badge badge-info', rejected: 'badge badge-error', approved: 'badge badge-success', disbursed: 'badge badge-info' }[s] || 'badge')

  if (loading) {
    return (
      <CustomerLayout>
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex justify-between items-center">
            <div>
              <div className="animate-pulse bg-gray-200 rounded w-32 h-7 mb-2" />
              <div className="animate-pulse bg-gray-200 rounded w-56 h-4" />
            </div>
            <div className="animate-pulse bg-gray-200 rounded-lg w-36 h-10" />
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
                  {['Purpose','Amount','Interest','Tenure','Date','Status',''].map(h => (
                    <th key={h}><div className="animate-pulse bg-gray-200 rounded w-16 h-4" /></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1,2,3,4,5].map(i => (
                  <tr key={i}>
                    <td><div className="animate-pulse bg-gray-200 rounded w-28 h-4" /></td>
                    <td><div className="animate-pulse bg-gray-200 rounded w-24 h-4" /></td>
                    <td><div className="animate-pulse bg-gray-200 rounded w-16 h-4" /></td>
                    <td><div className="animate-pulse bg-gray-200 rounded w-16 h-4" /></td>
                    <td><div className="animate-pulse bg-gray-200 rounded w-20 h-4" /></td>
                    <td><div className="animate-pulse bg-gray-200 rounded-full w-16 h-6" /></td>
                    <td><div className="animate-pulse bg-gray-200 rounded w-10 h-4" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CustomerLayout>
    )
  }

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
            {['all', 'pending', 'approved', 'active', 'completed'].map(s => (
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
            <div className="overflow-x-auto">
              <table className="table min-w-[700px]">
                <thead>
                  <tr><th>Purpose</th><th>Amount</th><th>Interest</th><th>Tenure</th><th>Date</th><th>Status</th><th></th></tr>
                </thead>
                <tbody>
                  {filtered.map((loan) => (
                    <tr key={loan.id}>
                      <td className="font-medium text-text whitespace-nowrap">{loan.purpose || '-'}</td>
                      <td className="text-text whitespace-nowrap">{formatCurrency(loan.amount)}</td>
                      <td className="text-text-muted whitespace-nowrap">{loan.interest_rate}% p.a.</td>
                      <td className="text-text-muted whitespace-nowrap">{loan.tenure_months} months</td>
                      <td className="text-text-muted whitespace-nowrap">{formatDate(loan.created_at)}</td>
                      <td><span className={getStatusBadge(loan.status)}>{loan.status}</span></td>
                      <td><Link to={`/loans/${loan.id}`} className="text-primary-600 hover:underline text-sm flex items-center gap-1">View <ChevronRight size={14} /></Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </CustomerLayout>
  )
}
