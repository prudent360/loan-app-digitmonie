import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/layouts/AdminLayout'
import { adminAPI } from '../../services/api'
import api from '../../services/api'
import { Users, FileText, Wallet, Clock, Loader2, TrendingUp, PiggyBank, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ 
    totalUsers: 0, 
    activeLoans: 0, 
    totalDisbursed: 0, 
    pendingReview: 0,
    totalSavings: 0,
    pendingTransfers: 0 
  })
  const [recentLoans, setRecentLoans] = useState([])
  const [chartData, setChartData] = useState([])
  const [loanStatusData, setLoanStatusData] = useState([])
  const [chartPeriod, setChartPeriod] = useState(6)
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch all data
        const [usersRes, loansRes, savingsRes, transfersRes] = await Promise.all([
          adminAPI.getUsers(),
          adminAPI.getLoans(),
          api.get('/admin/savings/stats').catch(() => ({ data: { total_savings: 0 } })),
          api.get('/admin/transfers').catch(() => ({ data: { stats: { pending: 0 } } }))
        ])
        
        const users = usersRes.data.data || usersRes.data || []
        const loans = loansRes.data.data || loansRes.data || []
        
        // Calculate stats
        const activeLoans = loans.filter(l => l.status === 'active' || l.status === 'disbursed').length
        const pendingLoans = loans.filter(l => l.status === 'pending' || l.status === 'pending_review').length
        const approvedLoans = loans.filter(l => l.status === 'approved').length
        const rejectedLoans = loans.filter(l => l.status === 'rejected').length
        const completedLoans = loans.filter(l => l.status === 'completed').length
        const totalDisbursed = loans.filter(l => ['active', 'disbursed', 'completed'].includes(l.status)).reduce((sum, l) => sum + Number(l.amount || 0), 0)
        
        setStats({
          totalUsers: users.length,
          activeLoans,
          totalDisbursed,
          pendingReview: pendingLoans,
          totalSavings: savingsRes.data.total_savings || savingsRes.data.stats?.total_savings || 0,
          pendingTransfers: transfersRes.data.stats?.pending || 0
        })
        
        setRecentLoans(loans.slice(0, 5))
        
        // Loan status pie chart data
        setLoanStatusData([
          { name: 'Active', value: activeLoans, color: '#22c55e' },
          { name: 'Pending', value: pendingLoans, color: '#f59e0b' },
          { name: 'Approved', value: approvedLoans, color: '#3b82f6' },
          { name: 'Completed', value: completedLoans, color: '#8b5cf6' },
          { name: 'Rejected', value: rejectedLoans, color: '#ef4444' },
        ].filter(d => d.value > 0))
        
        // Generate chart data from loans
        const monthlyData = {}
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        
        // Get current month index and calculate which months to show
        const currentMonth = new Date().getMonth()
        const monthsToShow = []
        for (let i = chartPeriod - 1; i >= 0; i--) {
          const monthIndex = (currentMonth - i + 12) % 12
          monthsToShow.push(months[monthIndex])
        }
        
        monthsToShow.forEach(m => { monthlyData[m] = { month: m, disbursed: 0, applications: 0 } })
        
        loans.forEach(loan => {
          const date = new Date(loan.created_at)
          const monthKey = months[date.getMonth()]
          if (monthlyData[monthKey]) {
            monthlyData[monthKey].applications += 1
            if (['active', 'disbursed', 'completed'].includes(loan.status)) {
              monthlyData[monthKey].disbursed += Number(loan.amount || 0)
            }
          }
        })
        setChartData(monthsToShow.map(m => monthlyData[m]))
      } catch (err) {
        console.error('Failed to load dashboard:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [chartPeriod])

  const formatCurrency = (amount) => `₦${Number(amount).toLocaleString()}`
  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '-'
  const getStatusBadge = (s) => ({ 
    pending: 'bg-amber-100 text-amber-700', 
    pending_review: 'bg-blue-100 text-blue-700',
    approved: 'bg-green-100 text-green-700', 
    active: 'bg-emerald-100 text-emerald-700', 
    disbursed: 'bg-purple-100 text-purple-700', 
    rejected: 'bg-red-100 text-red-700', 
    completed: 'bg-gray-100 text-gray-700' 
  }[s] || 'bg-gray-100 text-gray-700')

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex justify-between items-center">
            <div>
              <div className="animate-pulse bg-gray-200 rounded w-32 h-8 mb-2" />
              <div className="animate-pulse bg-gray-200 rounded w-48 h-4" />
            </div>
          </div>
          
          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex justify-between mb-4">
                  <div className="animate-pulse bg-gray-200 rounded-xl w-12 h-12" />
                  <div className="animate-pulse bg-gray-200 rounded-full w-16 h-6" />
                </div>
                <div className="animate-pulse bg-gray-200 rounded w-24 h-7 mb-1" />
                <div className="animate-pulse bg-gray-200 rounded w-28 h-4" />
              </div>
            ))}
          </div>
          
          {/* Charts Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="animate-pulse bg-gray-200 rounded w-40 h-5 mb-6" />
              <div className="animate-pulse bg-gray-200 rounded w-full h-64" />
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="animate-pulse bg-gray-200 rounded w-40 h-5 mb-6" />
              <div className="flex justify-center">
                <div className="animate-pulse bg-gray-200 rounded-full w-48 h-48" />
              </div>
            </div>
          </div>
          
          {/* Table Skeleton */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100">
              <div className="animate-pulse bg-gray-200 rounded w-48 h-5" />
            </div>
            <div className="p-4 space-y-4">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex items-center gap-4">
                  <div className="animate-pulse bg-gray-200 rounded-full w-10 h-10" />
                  <div className="flex-1">
                    <div className="animate-pulse bg-gray-200 rounded w-32 h-4 mb-1" />
                    <div className="animate-pulse bg-gray-200 rounded w-24 h-3" />
                  </div>
                  <div className="animate-pulse bg-gray-200 rounded w-20 h-4" />
                  <div className="animate-pulse bg-gray-200 rounded-full w-16 h-6" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text">Dashboard</h1>
            <p className="text-text-muted">Welcome back! Here's your overview</p>
          </div>
          <div className="text-sm text-text-muted">
            {new Date().toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Stats Grid - H-care style */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: Users, bgColor: 'bg-gradient-to-br from-blue-500 to-blue-600', trend: '+12%', up: true },
            { label: 'Active Loans', value: stats.activeLoans, icon: FileText, bgColor: 'bg-gradient-to-br from-emerald-500 to-emerald-600', trend: '+8%', up: true },
            { label: 'Total Disbursed', value: formatCurrency(stats.totalDisbursed), icon: Wallet, bgColor: 'bg-gradient-to-br from-purple-500 to-purple-600', trend: '+23%', up: true },
            { label: 'Pending Review', value: stats.pendingReview, icon: Clock, bgColor: 'bg-gradient-to-br from-amber-500 to-orange-500', trend: '-5%', up: false },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center text-white shadow-lg`}>
                  <stat.icon size={22} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${stat.up ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {stat.trend}
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Second row - Savings & Transfers */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <PiggyBank size={24} />
              </div>
              <div>
                <p className="text-teal-100 text-sm">Total Savings</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalSavings)}</p>
              </div>
            </div>
            <Link to="/admin/savings" className="text-sm text-teal-100 hover:text-white flex items-center gap-1">
              View Details <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-orange-100 text-sm">Pending Transfers</p>
                <p className="text-2xl font-bold">{stats.pendingTransfers}</p>
              </div>
            </div>
            <Link to="/admin/transfers" className="text-sm text-orange-100 hover:text-white flex items-center gap-1">
              Review Now <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Area Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900">Loan Disbursement Trend</h3>
              <div className="relative">
                <button 
                  onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                  className="text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors cursor-pointer"
                >
                  Last {chartPeriod} months
                  <svg className={`w-3 h-3 transition-transform ${showPeriodDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showPeriodDropdown && (
                  <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10 min-w-[120px]">
                    {[3, 6, 12].map((period) => (
                      <button
                        key={period}
                        onClick={() => {
                          setChartPeriod(period)
                          setShowPeriodDropdown(false)
                        }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${
                          chartPeriod === period ? 'text-purple-600 font-medium bg-purple-50' : 'text-gray-600'
                        }`}
                      >
                        Last {period} months
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorDisbursed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} axisLine={false} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000000 ? `₦${v/1000000}M` : `₦${v/1000}K`} />
                  <Tooltip 
                    contentStyle={{ background: '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontSize: '12px' }} 
                    formatter={(v) => formatCurrency(v)} 
                  />
                  <Area type="monotone" dataKey="disbursed" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorDisbursed)" name="Disbursed" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-6">Loans by Status</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={loanStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {loanStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 justify-center mt-4">
              {loanStatusData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-gray-600">{d.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Applications */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Recent Loan Applications</h3>
            <Link to="/admin/loans" className="text-sm text-purple-600 hover:text-purple-700 font-medium">View All →</Link>
          </div>
          {recentLoans.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No loan applications yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentLoans.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {(app.user?.name || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{app.user?.name || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">{app.user?.email || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">{formatCurrency(app.amount)}</td>
                      <td className="px-6 py-4 text-gray-600">{app.purpose || '-'}</td>
                      <td className="px-6 py-4 text-gray-500">{formatDate(app.created_at)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(app.status)}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link to="/admin/loans" className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
