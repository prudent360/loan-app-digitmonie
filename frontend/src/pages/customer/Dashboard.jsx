import { useState } from 'react'
import CustomerLayout from '../../components/layouts/CustomerLayout'
import { FileText, TrendingUp, CreditCard, Calendar, Download } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const mockStats = { totalBorrowed: 2500000, totalPaid: 1850000, outstandingBalance: 650000, nextPayment: 47073, nextPaymentDate: '2025-01-15' }
const mockChartData = [
  { month: 'Jul', borrowed: 500000, paid: 0 }, { month: 'Aug', borrowed: 500000, paid: 50000 },
  { month: 'Sep', borrowed: 1000000, paid: 150000 }, { month: 'Oct', borrowed: 1500000, paid: 350000 },
  { month: 'Nov', borrowed: 2000000, paid: 650000 }, { month: 'Dec', borrowed: 2500000, paid: 1100000 },
]
const mockRecentLoans = [
  { id: 1, purpose: 'Business Expansion', amount: 500000, status: 'completed', date: '2024-06-15' },
  { id: 2, purpose: 'Education', amount: 1000000, status: 'active', date: '2024-10-01' },
  { id: 3, purpose: 'Medical Emergency', amount: 500000, status: 'pending', date: '2024-12-01' },
]

export default function CustomerDashboard() {
  const formatCurrency = (amount) => `₦${amount.toLocaleString()}`
  const getStatusBadge = (s) => ({ pending: 'badge badge-warning', active: 'badge badge-success', completed: 'badge badge-info' }[s] || 'badge')

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
                <p className="text-2xl font-bold text-text">{formatCurrency(mockStats.totalBorrowed)}</p>
              </div>
              <div className="card">
                <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Total Repaid</p>
                <p className="text-2xl font-bold text-text">{formatCurrency(mockStats.totalPaid)}</p>
              </div>
              <div className="card">
                <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Outstanding Balance</p>
                <p className="text-2xl font-bold text-text">{formatCurrency(mockStats.outstandingBalance)}</p>
              </div>
              <div className="card">
                <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Next Payment Due</p>
                <p className="text-2xl font-bold text-text">{formatCurrency(mockStats.nextPayment)}</p>
                <p className="text-xs text-text-muted mt-1">{mockStats.nextPaymentDate}</p>
              </div>
            </div>
          </div>

          {/* Green Summary Card */}
          <div className="summary-card">
            <p className="label">Estimated Next Payment</p>
            <p className="value">{formatCurrency(mockStats.nextPayment)}</p>
            <p className="text-sm text-primary-100 mt-2">Due on {mockStats.nextPaymentDate}</p>
            <div className="flex justify-between text-sm mt-4 pt-4 border-t border-primary-500">
              <span className="text-primary-100">Repayment Progress</span>
              <span className="font-medium">74%</span>
            </div>
            <button className="w-full mt-4 bg-white text-primary-600 font-medium py-2.5 rounded-lg hover:bg-primary-50 transition-colors flex items-center justify-center gap-2">
              <CreditCard size={18} /> Make Payment
            </button>
          </div>
        </div>

        {/* Loan Activity Chart */}
        <div className="card">
          <h3 className="text-sm font-medium text-text mb-4">Loan Activity Overview</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData}>
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

        {/* Recent Loans Table */}
        <div className="card p-0">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h3 className="text-sm font-medium text-text">Recent Loans</h3>
            <a href="/loans" className="text-sm text-primary-600 hover:underline">View All</a>
          </div>
          <table className="table">
            <thead>
              <tr><th>Purpose</th><th>Amount</th><th>Date</th><th>Status</th></tr>
            </thead>
            <tbody>
              {mockRecentLoans.map((loan) => (
                <tr key={loan.id}>
                  <td className="font-medium text-text">{loan.purpose}</td>
                  <td className="text-text">{formatCurrency(loan.amount)}</td>
                  <td className="text-text-muted">{loan.date}</td>
                  <td><span className={getStatusBadge(loan.status)}>{loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </CustomerLayout>
  )
}
