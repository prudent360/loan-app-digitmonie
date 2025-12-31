import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/layouts/AdminLayout'
import { Search, Loader2, Wallet, TrendingUp, TrendingDown, Eye, ArrowUpRight, ArrowDownLeft } from 'lucide-react'

export default function Wallets() {
  const [wallets, setWallets] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState({ totalBalance: 0, totalCredits: 0, totalDebits: 0 })

  useEffect(() => {
    loadWallets()
  }, [])

  const loadWallets = async () => {
    try {
      const res = await fetch('/api/admin/wallets', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      const data = await res.json()
      const walletList = data.wallets?.data || data.wallets || data.data || []
      setWallets(walletList)
      
      // Calculate stats
      const totalBalance = walletList.reduce((sum, w) => sum + Number(w.balance || 0), 0)
      setStats({
        totalBalance,
        walletCount: walletList.length,
        activeWallets: walletList.filter(w => Number(w.balance) > 0).length,
      })
    } catch (err) {
      console.error('Failed to load wallets:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => `₦${Number(amount || 0).toLocaleString()}`

  const formatDate = (d) => d ? new Date(d).toLocaleString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric'
  }) : '-'

  // Filter wallets
  const filtered = wallets.filter(w => {
    if (!search) return true
    return w.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
           w.user?.email?.toLowerCase().includes(search.toLowerCase())
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
          <h1 className="text-2xl font-semibold text-text">Wallet Management</h1>
          <p className="text-text-muted">View and manage all user wallets</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center">
                <Wallet size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-text">{formatCurrency(stats.totalBalance)}</p>
                <p className="text-sm text-text-muted">Total Balance (All Wallets)</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-text">{stats.walletCount}</p>
                <p className="text-sm text-text-muted">Total Wallets</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <ArrowUpRight size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-text">{stats.activeWallets}</p>
                <p className="text-sm text-text-muted">Active Wallets (Balance &gt; 0)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="card">
          <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 bg-muted/50">
            <Search size={18} className="text-text-muted" />
            <input 
              type="text" 
              placeholder="Search by user name or email..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="flex-1 bg-transparent border-none text-text text-sm outline-none placeholder:text-text-muted" 
            />
          </div>
        </div>

        {/* Wallets Table */}
        <div className="card p-0">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Balance</th>
                <th>Currency</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-text-muted py-8">No wallets found</td>
                </tr>
              ) : (
                filtered.map((wallet) => (
                  <tr key={wallet.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-medium">
                          {wallet.user?.name?.split(' ').map(n => n[0]).join('') || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-text text-sm">{wallet.user?.name || 'Unknown'}</p>
                          <p className="text-xs text-text-muted">{wallet.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`font-semibold ${Number(wallet.balance) > 0 ? 'text-green-600' : 'text-text'}`}>
                      {formatCurrency(wallet.balance)}
                    </td>
                    <td className="text-text-muted">{wallet.currency || 'NGN'}</td>
                    <td>
                      <span className={`badge ${wallet.is_locked ? 'badge-error' : 'badge-success'}`}>
                        {wallet.is_locked ? 'Locked' : 'Active'}
                      </span>
                    </td>
                    <td className="text-text-muted text-sm">{formatDate(wallet.updated_at)}</td>
                    <td>
                      <Link 
                        to={`/admin/users/${wallet.user_id}`} 
                        className="p-1.5 rounded text-text-muted hover:text-primary-600 hover:bg-primary-50 inline-flex"
                      >
                        <Eye size={16} />
                      </Link>
                    </td>
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
