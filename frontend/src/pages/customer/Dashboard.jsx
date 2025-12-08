import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import CustomerLayout from '../../components/layouts/CustomerLayout'
import { loanAPI, dashboardAPI } from '../../services/api'
import { FileText, CreditCard, Loader2, PlusCircle } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function CustomerDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalBorrowed: 0, totalPaid: 0, outstandingBalance: 0, nextPayment: 0, nextPaymentDate: '-' })
  const [recentLoans, setRecentLoans] = useState([])
  const [chartData, setChartData] = useState([])

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch loans
        const loansRes = await loanAPI.getAll()
        const loans = loansRes.data.data || loansRes.data.loans || loansRes.data || []
        setRecentLoans(loans.slice(0, 5))

        // Calculate stats from loans
        const activeLoans = loans.filter(l => l.status === 'active' || l.status === 'disbursed')
        const totalBorrowed = loans.reduce((sum, l) => sum + Number(l.amount || 0), 0)
        const totalPaid = loans.reduce((sum, l) => sum + Number(l.total_paid || 0), 0)
        const outstandingBalance = activeLoans.reduce((sum, l) => sum + (Number(l.amount || 0) - Number(l.total_paid || 0)), 0)
        
        setStats({
          totalBorrowed,
          totalPaid,
          outstandingBalance,
          nextPayment: activeLoans.length > 0 ? Math.round(activeLoans[0].monthly_payment || 0) : 0,
          nextPaymentDate: activeLoans.length > 0 ? (activeLoans[0].next_payment_date || 'No active loans') : 'No active loans'
        })

        // Generate chart data from loans
        const monthlyData = {}
        loans.forEach(loan => {
          const date = new Date(loan.created_at)
          const monthKey = date.toLocaleString('default', { month: 'short' })
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { month: monthKey, borrowed: 0 }
          }
          monthlyData[monthKey].borrowed += Number(loan.amount || 0)
        })
        setChartData(Object.values(monthlyData))
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const formatCurrency = (amount) => `₦${Number(amount).toLocaleString()}`
  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '-'
  const getStatusBadge = (s) => ({ pending: 'badge badge-warning', active: 'badge badge-success', completed: 'badge badge-info', approved: 'badge badge-success', disbursed: 'badge badge-info', rejected: 'badge badge-error' }[s] || 'badge')
  const repaymentProgress = stats.totalBorrowed > 0 ? Math.round((stats.totalPaid / stats.totalBorrowed) * 100) : 0

  if (loading) {
    return <CustomerLayout><div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary-600" size={32} /></div></CustomerLayout>
  }

  return (
    <CustomerLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-text">Dashboard</h1>
          <p className="text-text-muted">Welcome back! Here's your loan overview.</p>
        </div>

        {/* Stats + Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Stats */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="card">
                <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Total Borrowed</p>
                <p className="text-2xl font-bold text-text">{formatCurrency(stats.totalBorrowed)}</p>
              </div>
              <div className="card">
                <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Total Repaid</p>
                <p className="text-2xl font-bold text-text">{formatCurrency(stats.totalPaid)}</p>
              </div>
              <div className="card">
                <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Outstanding Balance</p>
                <p className="text-2xl font-bold text-text">{formatCurrency(stats.outstandingBalance)}</p>
              </div>
              <div className="card">
                <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Next Payment Due</p>
                <p className="text-2xl font-bold text-text">{formatCurrency(stats.nextPayment)}</p>
                <p className="text-xs text-text-muted mt-1">{stats.nextPaymentDate}</p>
              </div>
            </div>
          </div>

          {/* Green Summary Card */}
          <div className="summary-card">
            <p className="label">Loan Overview</p>
            <p className="value">{recentLoans.length} Loans</p>
            <p className="text-sm text-primary-100 mt-2">{recentLoans.filter(l => l.status === 'active' || l.status === 'disbursed').length} Active</p>
            <div className="flex justify-between text-sm mt-4 pt-4 border-t border-primary-500">
              <span className="text-primary-100">Repayment Progress</span>
              <span className="font-medium">{repaymentProgress}%</span>
            </div>
            <Link to="/loans/apply" className="w-full mt-4 bg-white text-primary-600 font-medium py-2.5 rounded-lg hover:bg-primary-50 transition-colors flex items-center justify-center gap-2">
              <PlusCircle size={18} /> Apply for Loan
            </Link>
          </div>
        </div>

        {/* Loan Activity Chart */}
        {chartData.length > 0 && (
          <div className="card">
            <h3 className="text-sm font-medium text-text mb-4">Loan Activity Overview</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorBorrowed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} /><stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `₦${v/1000000}M`} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }} formatter={(v) => formatCurrency(v)} />
                  <Area type="monotone" dataKey="borrowed" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorBorrowed)" name="Total Borrowed" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Recent Loans Table */}
        <div className="card p-0">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h3 className="text-sm font-medium text-text">Recent Loans</h3>
            <Link to="/loans" className="text-sm text-primary-600 hover:underline">View All</Link>
          </div>
          {recentLoans.length === 0 ? (
            <div className="text-center py-10 text-text-muted">
              <FileText size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No loans yet</p>
              <Link to="/loans/apply" className="btn btn-primary mt-4">Apply for Loan</Link>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr><th>Purpose</th><th>Amount</th><th>Date</th><th>Status</th></tr>
              </thead>
              <tbody>
                {recentLoans.map((loan) => (
                  <tr key={loan.id}>
                    <td className="font-medium text-text">{loan.purpose || '-'}</td>
                    <td className="text-text">{formatCurrency(loan.amount)}</td>
                    <td className="text-text-muted">{formatDate(loan.created_at)}</td>
                    <td><span className={getStatusBadge(loan.status)}>{loan.status}</span></td>
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
