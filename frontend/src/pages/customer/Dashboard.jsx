import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import CustomerLayout from '../../components/layouts/CustomerLayout'
import { loanAPI } from '../../services/api'
import api from '../../services/api'
import { FileText, Loader2, PlusCircle, Wallet, PiggyBank, CreditCard, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'

export default function CustomerDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ 
    totalBorrowed: 0, 
    totalPaid: 0, 
    outstandingBalance: 0, 
    nextPayment: 0, 
    nextPaymentDate: '-',
    walletBalance: 0,
    totalSavings: 0
  })
  const [recentLoans, setRecentLoans] = useState([])
  const [chartData, setChartData] = useState([])
  const [loanStatusData, setLoanStatusData] = useState([])
  const [chartPeriod, setChartPeriod] = useState(6) // months
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false)


  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch all data - use dashboard stats API for accurate calculations
        const [loansRes, walletRes, savingsRes, statsRes] = await Promise.all([
          loanAPI.getAll(),
          api.get('/customer/wallet').catch(() => ({ data: { wallet: { balance: 0 } } })),
          api.get('/customer/savings').catch(() => ({ data: { data: [] } })),
          api.get('/customer/dashboard/stats').catch(() => ({ data: null }))
        ])
        
        const loans = loansRes.data.data || loansRes.data.loans || loansRes.data || []
        setRecentLoans(loans.slice(0, 5))

        // Use stats from dedicated API if available, otherwise calculate from loans
        const apiStats = statsRes.data
        
        // Calculate loan status counts
        const activeLoans = loans.filter(l => l.status === 'active' || l.status === 'disbursed')
        const pendingLoans = loans.filter(l => l.status === 'pending' || l.status === 'pending_review')
        const completedLoans = loans.filter(l => l.status === 'completed')
        
        // Savings total
        const savings = savingsRes.data.data || savingsRes.data || []
        const totalSavings = savings.reduce((sum, s) => sum + Number(s.current_balance || 0), 0)
        
        // Use API stats if available (more accurate), fallback to manual calculation
        if (apiStats && apiStats.totalBorrowed !== undefined) {
          setStats({
            totalBorrowed: apiStats.totalBorrowed || 0,
            totalPaid: apiStats.totalPaid || 0,
            outstandingBalance: apiStats.outstandingBalance || 0,
            nextPayment: apiStats.nextPayment || 0,
            nextPaymentDate: apiStats.nextPaymentDate || (activeLoans.length > 0 ? 'Due soon' : 'No active loans'),
            walletBalance: walletRes.data.wallet?.balance || 0,
            totalSavings
          })
        } else {
          // Fallback: calculate manually from loans
          const totalBorrowed = loans.filter(l => ['active', 'disbursed', 'completed'].includes(l.status)).reduce((sum, l) => sum + Number(l.amount || 0), 0)
          const totalPaid = loans.reduce((sum, l) => sum + Number(l.total_paid || 0), 0)
          const outstandingBalance = activeLoans.reduce((sum, l) => sum + Number(l.remaining_balance || 0), 0)
          
          setStats({
            totalBorrowed,
            totalPaid,
            outstandingBalance,
            nextPayment: activeLoans.length > 0 ? Math.round(activeLoans[0].emi || 0) : 0,
            nextPaymentDate: activeLoans.length > 0 ? (activeLoans[0].next_payment_date || 'Due soon') : 'No active loans',
            walletBalance: walletRes.data.wallet?.balance || 0,
            totalSavings
          })
        }

        // Loan status pie chart
        setLoanStatusData([
          { name: 'Active', value: activeLoans.length, color: '#22c55e' },
          { name: 'Pending', value: pendingLoans.length, color: '#f59e0b' },
          { name: 'Completed', value: completedLoans.length, color: '#8b5cf6' },
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
        
        monthsToShow.forEach(m => { monthlyData[m] = { month: m, borrowed: 0, repaid: 0 } })
        
        loans.forEach(loan => {
          const date = new Date(loan.created_at)
          const monthKey = months[date.getMonth()]
          if (monthlyData[monthKey]) {
            if (['active', 'disbursed', 'completed'].includes(loan.status)) {
              monthlyData[monthKey].borrowed += Number(loan.amount || 0)
            }
            monthlyData[monthKey].repaid += Number(loan.total_paid || 0)
          }
        })
        setChartData(monthsToShow.map(m => monthlyData[m]))

      } catch (err) {
        console.error('Failed to load dashboard data:', err)
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
    active: 'bg-green-100 text-green-700', 
    disbursed: 'bg-purple-100 text-purple-700',
    completed: 'bg-gray-100 text-gray-700', 
    rejected: 'bg-red-100 text-red-700',
    approved: 'bg-emerald-100 text-emerald-700'
  }[s] || 'bg-gray-100 text-gray-700')
  
  const repaymentProgress = stats.totalBorrowed > 0 ? Math.round((stats.totalPaid / stats.totalBorrowed) * 100) : 0

  if (loading) {
    return (
      <CustomerLayout>
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex justify-between items-center">
            <div>
              <div className="animate-pulse bg-gray-200 rounded w-32 h-8 mb-2" />
              <div className="animate-pulse bg-gray-200 rounded w-64 h-4" />
            </div>
            <div className="animate-pulse bg-gray-200 rounded-lg w-36 h-10" />
          </div>
          
          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex justify-between mb-4">
                  <div className="animate-pulse bg-gray-200 rounded-xl w-12 h-12" />
                  <div className="animate-pulse bg-gray-200 rounded-full w-12 h-6" />
                </div>
                <div className="animate-pulse bg-gray-200 rounded w-24 h-7 mb-1" />
                <div className="animate-pulse bg-gray-200 rounded w-20 h-4" />
              </div>
            ))}
          </div>
          
          {/* Wallet/Savings Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1,2].map(i => (
              <div key={i} className="rounded-2xl p-6 bg-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="animate-pulse bg-gray-300 rounded w-24 h-4 mb-2" />
                    <div className="animate-pulse bg-gray-300 rounded w-32 h-8 mb-2" />
                    <div className="animate-pulse bg-gray-300 rounded w-20 h-3" />
                  </div>
                  <div className="animate-pulse bg-gray-300 rounded-xl w-12 h-12" />
                </div>
              </div>
            ))}
          </div>
          
          {/* Charts Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1,2].map(i => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="animate-pulse bg-gray-200 rounded w-40 h-5 mb-6" />
                <div className="animate-pulse bg-gray-200 rounded w-full h-64" />
              </div>
            ))}
          </div>
          
          {/* Table Skeleton */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-0">
            <div className="p-4 border-b border-gray-100">
              <div className="animate-pulse bg-gray-200 rounded w-40 h-5" />
            </div>
            <div className="p-4 space-y-4">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex justify-between items-center">
                  <div className="animate-pulse bg-gray-200 rounded w-24 h-4" />
                  <div className="animate-pulse bg-gray-200 rounded w-20 h-4" />
                  <div className="animate-pulse bg-gray-200 rounded w-16 h-4" />
                  <div className="animate-pulse bg-gray-200 rounded-full w-16 h-6" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </CustomerLayout>
    )
  }

  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text">Dashboard</h1>
            <p className="text-text-muted">Welcome back! Here's your financial overview</p>
          </div>
          <Link to="/loans/apply" className="btn btn-primary">
            <PlusCircle size={18} /> Apply for Loan
          </Link>
        </div>

        {/* Stats Grid - Modern style */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Borrowed', value: formatCurrency(stats.totalBorrowed), icon: FileText, bgColor: 'bg-gradient-to-br from-purple-500 to-purple-600', trend: null },
            { label: 'Total Repaid', value: formatCurrency(stats.totalPaid), icon: CreditCard, bgColor: 'bg-gradient-to-br from-green-500 to-emerald-600', trend: `${repaymentProgress}%` },
            { label: 'Outstanding', value: formatCurrency(stats.outstandingBalance), icon: TrendingUp, bgColor: 'bg-gradient-to-br from-orange-500 to-red-500', trend: null },
            { label: 'Next Payment', value: formatCurrency(stats.nextPayment), icon: CreditCard, bgColor: 'bg-gradient-to-br from-blue-500 to-cyan-600', subtext: stats.nextPaymentDate },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center text-white shadow-lg`}>
                  <stat.icon size={22} />
                </div>
                {stat.trend && (
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    {stat.trend}
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
              {stat.subtext && <p className="text-xs text-gray-400 mt-1">{stat.subtext}</p>}
            </div>
          ))}
        </div>

        {/* Wallet & Savings Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Link to="/wallet" className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Wallet size={24} />
              </div>
              <div>
                <p className="text-teal-100 text-sm">Wallet Balance</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.walletBalance)}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm text-teal-100">
              Fund Wallet <ArrowUpRight size={14} />
            </div>
          </Link>
          <Link to="/savings" className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <PiggyBank size={24} />
              </div>
              <div>
                <p className="text-violet-100 text-sm">Total Savings</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalSavings)}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm text-violet-100">
              View Savings <ArrowUpRight size={14} />
            </div>
          </Link>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Area Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900">Loan & Repayment Trend</h3>
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
                    <linearGradient id="colorBorrowed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorRepaid" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} axisLine={false} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000000 ? `₦${v/1000000}M` : `₦${v/1000}K`} />
                  <Tooltip 
                    contentStyle={{ background: '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontSize: '12px' }} 
                    formatter={(v) => formatCurrency(v)} 
                  />
                  <Area type="monotone" dataKey="borrowed" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorBorrowed)" name="Borrowed" />
                  <Area type="monotone" dataKey="repaid" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorRepaid)" name="Repaid" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-6 mt-4 justify-center">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-gray-600">Borrowed</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-gray-600">Repaid</span>
              </div>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-6">Loans by Status</h3>
            {loanStatusData.length > 0 ? (
              <>
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
                      <span className="text-gray-600">{d.name} ({d.value})</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400">
                No loans yet
              </div>
            )}
          </div>
        </div>

        {/* Recent Loans Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Recent Loans</h3>
            <Link to="/loans" className="text-sm text-purple-600 hover:text-purple-700 font-medium">View All →</Link>
          </div>
          {recentLoans.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 mb-4">No loans yet</p>
              <Link to="/loans/apply" className="btn btn-primary">Apply for Loan</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentLoans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{loan.purpose || '-'}</td>
                      <td className="px-6 py-4 font-semibold text-gray-900">{formatCurrency(loan.amount)}</td>
                      <td className="px-6 py-4 text-gray-500">{formatDate(loan.created_at)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(loan.status)}`}>
                          {loan.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link to={`/loans/${loan.id}`} className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                          View
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
    </CustomerLayout>
  )
}
