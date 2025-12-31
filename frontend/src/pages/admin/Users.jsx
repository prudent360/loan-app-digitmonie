import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layouts/AdminLayout'
import { useToast } from '../../context/ToastContext'
import { adminAPI } from '../../services/api'
import { Search, Eye, UserCheck, UserX, X, Loader2 } from 'lucide-react'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const toast = useToast()

  // Fetch users from API
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await adminAPI.getUsers()
        // Laravel pagination returns users in .data property
        const userData = res.data.data || res.data.users || res.data || []
        setUsers(userData)
      } catch (err) {
        console.error('Failed to load users:', err)
        toast.error('Failed to load users')
      } finally {
        setLoading(false)
      }
    }
    loadUsers()
  }, [])

  // Filter users
  useEffect(() => {
    let result = users
    if (search) result = result.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
    if (statusFilter !== 'all') result = result.filter(u => u.status === statusFilter)
    setFiltered(result)
  }, [users, search, statusFilter])

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await adminAPI.updateUserStatus(userId, newStatus)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u))
      toast.success(`User ${newStatus === 'suspended' ? 'suspended' : 'activated'} successfully`)
      setSelectedUser(null)
    } catch (err) {
      toast.error('Failed to update user status')
      console.error(err)
    }
  }

  const getStatusBadge = (s) => ({ active: 'badge-success', pending: 'badge-warning', suspended: 'badge-error' }[s] || '')
  const getKYCBadge = (s) => ({ verified: 'badge-success', pending: 'badge-warning', rejected: 'badge-error' }[s] || 'badge-warning')
  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '-'

  if (loading) {
    return <AdminLayout><div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary-600" size={32} /></div></AdminLayout>
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-semibold text-text">User Management</h1><p className="text-text-muted">Manage registered customers</p></div>

        {/* Filters */}
        <div className="card flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex items-center gap-2 flex-1 border border-border rounded-lg px-3 py-2 bg-muted/50">
            <Search size={18} className="text-text-muted" />
            <input type="text" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 bg-transparent border-none text-text text-sm outline-none placeholder:text-text-muted" />
          </div>
          <div className="flex gap-2">
            {['all', 'active', 'pending', 'suspended'].map(s => (
              <button key={s} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${statusFilter === s ? 'bg-primary-600 text-white' : 'bg-muted text-text-muted hover:text-text'}`} onClick={() => setStatusFilter(s)}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <div className="card p-0">
          <table className="table">
            <thead><tr><th>User</th><th>Contact</th><th>Status</th><th>KYC</th><th>Loans</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="7" className="text-center text-text-muted py-8">No users found</td></tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-medium">{user.name?.split(' ').map(n => n[0]).join('') || '?'}</div>
                        <div><p className="font-medium text-text text-sm">{user.name}</p><p className="text-xs text-text-muted">{user.email}</p></div>
                      </div>
                    </td>
                    <td className="text-text-muted text-sm">{user.phone || '-'}</td>
                    <td><span className={`badge ${getStatusBadge(user.status)}`}>{user.status}</span></td>
                    <td><span className={`badge ${getKYCBadge(user.kyc_status)}`}>{user.kyc_status || 'pending'}</span></td>
                    <td className="text-text">{user.loans_count || 0}</td>
                    <td className="text-text-muted text-sm">{formatDate(user.created_at)}</td>
                    <td>
                      <div className="flex gap-1">
                        <a href={`/admin/users/${user.id}`} className="p-1.5 rounded text-text-muted hover:text-text hover:bg-muted"><Eye size={16} /></a>
                        {user.status === 'active' ? (
                          <button className="p-1.5 rounded text-text-muted hover:text-red-600 hover:bg-red-50" onClick={() => handleStatusChange(user.id, 'suspended')}><UserX size={16} /></button>
                        ) : (
                          <button className="p-1.5 rounded text-text-muted hover:text-primary-600 hover:bg-primary-50" onClick={() => handleStatusChange(user.id, 'active')}><UserCheck size={16} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* User Modal */}
        {selectedUser && (
          <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header"><h3 className="font-semibold text-text">User Details</h3><button onClick={() => setSelectedUser(null)}><X size={20} /></button></div>
              <div className="modal-body">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-lg font-medium">{selectedUser.name?.split(' ').map(n => n[0]).join('') || '?'}</div>
                  <div><h4 className="text-lg font-semibold text-text">{selectedUser.name}</h4><span className={`badge ${getStatusBadge(selectedUser.status)}`}>{selectedUser.status}</span></div>
                </div>
                <div className="space-y-3 text-sm">
                  {[['Email', selectedUser.email], ['Phone', selectedUser.phone || '-'], ['Joined', formatDate(selectedUser.created_at)], ['Total Loans', selectedUser.loans_count || 0]].map(([l, v]) => (
                    <div key={l} className="flex justify-between"><span className="text-text-muted">{l}</span><span className="text-text">{v}</span></div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                {selectedUser.status === 'active' ? (
                  <button className="btn btn-danger" onClick={() => handleStatusChange(selectedUser.id, 'suspended')}>Suspend User</button>
                ) : (
                  <button className="btn btn-primary" onClick={() => handleStatusChange(selectedUser.id, 'active')}>Activate User</button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
