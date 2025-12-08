import { useState } from 'react'
import AdminLayout from '../../components/layouts/AdminLayout'
import { Users, FileText, Wallet, Clock, TrendingUp } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const mockStats = { totalUsers: 1247, activeLoans: 324, totalDisbursed: 125000000, pendingReview: 18 }
const mockChartData = [
  { month: 'Jul', disbursed: 15000000 }, { month: 'Aug', disbursed: 18000000 }, { month: 'Sep', disbursed: 22000000 },
  { month: 'Oct', disbursed: 28000000 }, { month: 'Nov', disbursed: 35000000 }, { month: 'Dec', disbursed: 45000000 },
]
const mockApplications = [
  { id: 1, user: 'John Doe', amount: 500000, purpose: 'Business', date: '2024-12-08', status: 'pending' },
  { id: 2, user: 'Jane Smith', amount: 1000000, purpose: 'Education', date: '2024-12-07', status: 'pending' },
  { id: 3, user: 'Mike Johnson', amount: 750000, purpose: 'Medical', date: '2024-12-06', status: 'approved' },
]

export default function AdminDashboard() {
  const formatCurrency = (amount) => `₦${amount.toLocaleString()}`
  const getStatusBadge = (s) => ({ pending: 'badge badge-warning', approved: 'badge badge-success' }[s] || 'badge')

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div><h1 className="text-2xl font-semibold text-text">Admin Dashboard</h1><p className="text-text-muted">Overview of your loan management system</p></div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: mockStats.totalUsers.toLocaleString(), icon: Users, color: 'bg-blue-100 text-blue-600' },
            { label: 'Active Loans', value: mockStats.activeLoans, icon: FileText, color: 'bg-primary-100 text-primary-600' },
            { label: 'Total Disbursed', value: formatCurrency(mockStats.totalDisbursed), icon: Wallet, color: 'bg-purple-100 text-purple-600' },
            { label: 'Pending Review', value: mockStats.pendingReview, icon: Clock, color: 'bg-amber-100 text-amber-600' },
          ].map((stat) => (
            <div key={stat.label} className="card">
              <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}><stat.icon size={20} /></div>
              <p className="text-xs text-text-muted uppercase tracking-wide mb-1">{stat.label}</p>
              <p className="text-xl font-bold text-text">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="card">
          <h3 className="text-sm font-medium text-text mb-4">Loan Disbursement Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData}>
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

        {/* Recent Applications */}
        <div className="card p-0">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h3 className="text-sm font-medium text-text">Recent Loan Applications</h3>
            <a href="/admin/loans" className="text-sm text-primary-600 hover:underline">View All</a>
          </div>
          <table className="table">
            <thead><tr><th>Applicant</th><th>Amount</th><th>Purpose</th><th>Date</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {mockApplications.map((app) => (
                <tr key={app.id}>
                  <td className="font-medium text-text">{app.user}</td>
                  <td className="text-text">{formatCurrency(app.amount)}</td>
                  <td className="text-text-muted">{app.purpose}</td>
                  <td className="text-text-muted">{app.date}</td>
                  <td><span className={getStatusBadge(app.status)}>{app.status}</span></td>
                  <td><a href={`/admin/loans/${app.id}`} className="text-primary-600 hover:underline text-sm">Review</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}
