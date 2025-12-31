import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layouts/AdminLayout'
import { Search, Loader2, Phone, Wifi, Zap, Tv, Globe, Eye, Download } from 'lucide-react'

export default function BillTransactions() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    loadTransactions()
  }, [])

  const loadTransactions = async () => {
    try {
      const res = await fetch('/api/admin/bills', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      const data = await res.json()
      setTransactions(data.transactions?.data || data.transactions || data.data || [])
    } catch (err) {
      console.error('Failed to load transactions:', err)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryIcon = (category) => {
    const icons = {
      airtime: Phone,
      data: Wifi,
      data_bundle: Wifi,
      electricity: Zap,
      power: Zap,
      cable: Tv,
      internet: Globe,
    }
    const Icon = icons[category?.toLowerCase()] || Phone
    return <Icon size={16} />
  }

  const getCategoryColor = (category) => {
    const colors = {
      airtime: 'bg-green-100 text-green-600',
      data: 'bg-blue-100 text-blue-600',
      data_bundle: 'bg-blue-100 text-blue-600',
      electricity: 'bg-yellow-100 text-yellow-600',
      power: 'bg-yellow-100 text-yellow-600',
      cable: 'bg-purple-100 text-purple-600',
      internet: 'bg-cyan-100 text-cyan-600',
    }
    return colors[category?.toLowerCase()] || 'bg-gray-100 text-gray-600'
  }

  const getStatusBadge = (status) => {
    const styles = {
      successful: 'badge-success',
      pending: 'badge-warning',
      failed: 'badge-error',
    }
    return styles[status] || ''
  }

  const formatDate = (d) => d ? new Date(d).toLocaleString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : '-'

  const formatCurrency = (amount) => `₦${Number(amount || 0).toLocaleString()}`

  // Filter transactions
  const filtered = transactions.filter(tx => {
    const matchesSearch = !search || 
      tx.customer_id?.toLowerCase().includes(search.toLowerCase()) ||
      tx.biller_name?.toLowerCase().includes(search.toLowerCase()) ||
      tx.reference?.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || tx.category?.toLowerCase() === categoryFilter
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter
    return matchesSearch && matchesCategory && matchesStatus
  })

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-primary-600" size={32} />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-text">Bill Transactions</h1>
          <p className="text-text-muted">View all airtime, data, electricity, and cable TV transactions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card text-center">
            <p className="text-2xl font-bold text-text">{transactions.length}</p>
            <p className="text-sm text-text-muted">Total Transactions</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-green-600">{transactions.filter(t => t.status === 'successful').length}</p>
            <p className="text-sm text-text-muted">Successful</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-yellow-600">{transactions.filter(t => t.status === 'pending').length}</p>
            <p className="text-sm text-text-muted">Pending</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-red-600">{transactions.filter(t => t.status === 'failed').length}</p>
            <p className="text-sm text-text-muted">Failed</p>
          </div>
        </div>

        {/* Filters */}
        <div className="card flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex items-center gap-2 flex-1 border border-border rounded-lg px-3 py-2 bg-muted/50">
            <Search size={18} className="text-text-muted" />
            <input 
              type="text" 
              placeholder="Search by phone, biller, or reference..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="flex-1 bg-transparent border-none text-text text-sm outline-none placeholder:text-text-muted" 
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-sm border border-border bg-surface text-text"
            >
              <option value="all">All Categories</option>
              <option value="airtime">Airtime</option>
              <option value="data_bundle">Data</option>
              <option value="electricity">Electricity</option>
              <option value="cable">Cable TV</option>
              <option value="internet">Internet</option>
            </select>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-sm border border-border bg-surface text-text"
            >
              <option value="all">All Status</option>
              <option value="successful">Successful</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="card p-0">
          <table className="table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Biller</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center text-text-muted py-8">No transactions found</td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-lg ${getCategoryColor(tx.category)}`}>
                        {getCategoryIcon(tx.category)}
                        <span className="text-xs font-medium capitalize">{tx.category?.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="text-text font-medium text-sm">{tx.biller_name}</td>
                    <td className="text-text-muted text-sm">{tx.customer_id}</td>
                    <td className="text-text font-medium">{formatCurrency(tx.amount)}</td>
                    <td><span className={`badge ${getStatusBadge(tx.status)}`}>{tx.status}</span></td>
                    <td className="text-text-muted text-sm">{formatDate(tx.created_at)}</td>
                    <td className="text-text-muted text-xs font-mono">{tx.reference?.slice(0, 15)}...</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}
