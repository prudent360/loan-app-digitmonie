import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/layouts/AdminLayout'
import { adminAPI } from '../../services/api'
import { Users, FileText, Wallet, Clock, Loader2 } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalUsers: 0, activeLoans: 0, totalDisbursed: 0, pendingReview: 0 })
  const [recentLoans, setRecentLoans] = useState([])
  const [chartData, setChartData] = useState([])

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch users
        const usersRes = await adminAPI.getUsers()
        const users = usersRes.data.data || usersRes.data || []
        
        // Fetch loans
        const loansRes = await adminAPI.getLoans()
        const loans = loansRes.data.data || loansRes.data || []
        
        // Calculate stats
        const activeLoans = loans.filter(l => l.status === 'active' || l.status === 'disbursed').length
        const pendingLoans = loans.filter(l => l.status === 'pending').length
        const totalDisbursed = loans.filter(l => l.status !== 'pending' && l.status !== 'rejected').reduce((sum, l) => sum + Number(l.amount || 0), 0)
        
        setStats({
          totalUsers: users.length,
          activeLoans,
          totalDisbursed,
          pendingReview: pendingLoans
        })
        
        setRecentLoans(loans.slice(0, 5))
        
        // Generate chart data from loans
        const monthlyData = {}
        loans.filter(l => l.status !== 'pending' && l.status !== 'rejected').forEach(loan => {
          const date = new Date(loan.created_at)
          const monthKey = date.toLocaleString('default', { month: 'short' })
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { month: monthKey, disbursed: 0 }
          }
          monthlyData[monthKey].disbursed += Number(loan.amount || 0)
        })
        setChartData(Object.values(monthlyData))
      } catch (err) {
        console.error('Failed to load dashboard:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const formatCurrency = (amount) => `₦${Number(amount).toLocaleString()}`
  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '-'
  const getStatusBadge = (s) => ({ pending: 'badge badge-warning', approved: 'badge badge-success', active: 'badge badge-success', disbursed: 'badge badge-info', rejected: 'badge badge-error', completed: 'badge badge-info' }[s] || 'badge')

  if (loading) {
    return <AdminLayout><div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary-600" size={32} /></div></AdminLayout>
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div><h1 className="text-2xl font-semibold text-text">Admin Dashboard</h1><p className="text-text-muted">Overview of your loan management system</p></div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: Users, color: 'bg-blue-100 text-blue-600' },
            { label: 'Active Loans', value: stats.activeLoans, icon: FileText, color: 'bg-primary-100 text-primary-600' },
            { label: 'Total Disbursed', value: formatCurrency(stats.totalDisbursed), icon: Wallet, color: 'bg-purple-100 text-purple-600' },
            { label: 'Pending Review', value: stats.pendingReview, icon: Clock, color: 'bg-amber-100 text-amber-600' },
          ].map((stat) => (
            <div key={stat.label} className="card">
              <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}><stat.icon size={20} /></div>
              <p className="text-xs text-text-muted uppercase tracking-wide mb-1">{stat.label}</p>
              <p className="text-xl font-bold text-text">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="card">
            <h3 className="text-sm font-medium text-text mb-4">Loan Disbursement Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorDisbursed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} /><stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `₦${v/1000000}M`} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }} formatter={(v) => formatCurrency(v)} />
                  <Area type="monotone" dataKey="disbursed" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorDisbursed)" name="Disbursed" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Recent Applications */}
        <div className="card p-0">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h3 className="text-sm font-medium text-text">Recent Loan Applications</h3>
            <Link to="/admin/loans" className="text-sm text-primary-600 hover:underline">View All</Link>
          </div>
          {recentLoans.length === 0 ? (
            <div className="text-center py-10 text-text-muted">No loan applications yet</div>
          ) : (
            <table className="table">
              <thead><tr><th>Applicant</th><th>Amount</th><th>Purpose</th><th>Date</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {recentLoans.map((app) => (
                  <tr key={app.id}>
                    <td className="font-medium text-text">{app.user?.name || 'Unknown'}</td>
                    <td className="text-text">{formatCurrency(app.amount)}</td>
                    <td className="text-text-muted">{app.purpose || '-'}</td>
                    <td className="text-text-muted">{formatDate(app.created_at)}</td>
                    <td><span className={getStatusBadge(app.status)}>{app.status}</span></td>
                    <td><Link to="/admin/loans" className="text-primary-600 hover:underline text-sm">Review</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
