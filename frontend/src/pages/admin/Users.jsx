import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layouts/AdminLayout'
import { useToast } from '../../context/ToastContext'
import { Search, Eye, UserCheck, UserX, X } from 'lucide-react'

const mockUsers = [
  { id: 1, name: 'John Doe', email: 'john@example.com', phone: '+234 801 234 5678', status: 'active', kyc_status: 'verified', loans_count: 3, created_at: '2024-06-15' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '+234 802 345 6789', status: 'active', kyc_status: 'verified', loans_count: 2, created_at: '2024-08-20' },
  { id: 3, name: 'Mike Johnson', email: 'mike@example.com', phone: '+234 803 456 7890', status: 'pending', kyc_status: 'pending', loans_count: 0, created_at: '2024-12-01' },
  { id: 4, name: 'Sarah Brown', email: 'sarah@example.com', phone: '+234 804 567 8901', status: 'suspended', kyc_status: 'verified', loans_count: 1, created_at: '2024-10-10' },
]

export default function AdminUsers() {
  const [users, setUsers] = useState(mockUsers)
  const [filtered, setFiltered] = useState(mockUsers)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const toast = useToast()

  useEffect(() => {
    let result = users
    if (search) result = result.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
    if (statusFilter !== 'all') result = result.filter(u => u.status === statusFilter)
    setFiltered(result)
  }, [users, search, statusFilter])

  const handleStatusChange = (userId, newStatus) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u))
    toast.success(`User ${newStatus === 'suspended' ? 'suspended' : 'activated'} successfully`)
    setSelectedUser(null)
  }

  const getStatusBadge = (s) => ({ active: 'badge-success', pending: 'badge-warning', suspended: 'badge-error' }[s] || '')
  const getKYCBadge = (s) => ({ verified: 'badge-success', pending: 'badge-warning', rejected: 'badge-error' }[s] || '')

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
              {filtered.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-medium">{user.name.split(' ').map(n => n[0]).join('')}</div>
                      <div><p className="font-medium text-text text-sm">{user.name}</p><p className="text-xs text-text-muted">{user.email}</p></div>
                    </div>
                  </td>
                  <td className="text-text-muted text-sm">{user.phone}</td>
                  <td><span className={`badge ${getStatusBadge(user.status)}`}>{user.status}</span></td>
                  <td><span className={`badge ${getKYCBadge(user.kyc_status)}`}>{user.kyc_status}</span></td>
                  <td className="text-text">{user.loans_count}</td>
                  <td className="text-text-muted text-sm">{user.created_at}</td>
                  <td>
                    <div className="flex gap-1">
                      <button className="p-1.5 rounded text-text-muted hover:text-text hover:bg-muted" onClick={() => setSelectedUser(user)}><Eye size={16} /></button>
                      {user.status === 'active' ? (
                        <button className="p-1.5 rounded text-text-muted hover:text-red-600 hover:bg-red-50" onClick={() => handleStatusChange(user.id, 'suspended')}><UserX size={16} /></button>
                      ) : (
                        <button className="p-1.5 rounded text-text-muted hover:text-primary-600 hover:bg-primary-50" onClick={() => handleStatusChange(user.id, 'active')}><UserCheck size={16} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
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
                  <div className="w-14 h-14 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-lg font-medium">{selectedUser.name.split(' ').map(n => n[0]).join('')}</div>
                  <div><h4 className="text-lg font-semibold text-text">{selectedUser.name}</h4><span className={`badge ${getStatusBadge(selectedUser.status)}`}>{selectedUser.status}</span></div>
                </div>
                <div className="space-y-3 text-sm">
                  {[['Email', selectedUser.email], ['Phone', selectedUser.phone], ['Joined', selectedUser.created_at], ['Total Loans', selectedUser.loans_count]].map(([l, v]) => (
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
