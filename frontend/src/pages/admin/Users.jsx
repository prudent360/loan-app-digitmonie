import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layouts/AdminLayout'
import { useToast } from '../../context/ToastContext'
import { adminAPI } from '../../services/api'
import { Search, Eye, UserCheck, UserX, X, Loader2, Pencil, Trash2 } from 'lucide-react'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [editUser, setEditUser] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', status: '' })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
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

  const handleOpenEdit = (user) => {
    setEditUser(user)
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      status: user.status || 'active'
    })
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await adminAPI.updateUser(editUser.id, editForm)
      setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, ...res.data.user } : u))
      toast.success('User updated successfully')
      setEditUser(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (user) => {
    if (!confirm(`Are you sure you want to delete ${user.name}? This will permanently remove their account and all associated data.`)) {
      return
    }
    setDeleting(user.id)
    try {
      await adminAPI.deleteUser(user.id)
      setUsers(prev => prev.filter(u => u.id !== user.id))
      toast.success('User deleted successfully')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user')
      console.error(err)
    } finally {
      setDeleting(null)
    }
  }

  const getStatusBadge = (s) => ({ active: 'badge-success', pending: 'badge-warning', suspended: 'badge-error' }[s] || '')
  const getKYCBadge = (s) => ({ verified: 'badge-success', pending: 'badge-warning', rejected: 'badge-error' }[s] || 'badge-warning')
  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '-'

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <div className="animate-pulse bg-gray-200 rounded w-40 h-7 mb-2" />
            <div className="animate-pulse bg-gray-200 rounded w-56 h-4" />
          </div>
          <div className="card flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="animate-pulse bg-gray-200 rounded-lg flex-1 h-10" />
            <div className="flex gap-2">
              {[1,2,3,4].map(i => <div key={i} className="animate-pulse bg-gray-200 rounded-lg w-20 h-8" />)}
            </div>
          </div>
          <div className="card p-0">
            <table className="table">
              <thead><tr>{['User','Contact','Status','KYC','Loans','Joined','Actions'].map(h => <th key={h}><div className="animate-pulse bg-gray-200 rounded w-16 h-4" /></th>)}</tr></thead>
              <tbody>
                {[1,2,3,4,5].map(i => (
                  <tr key={i}>
                    <td><div className="flex items-center gap-3"><div className="animate-pulse bg-gray-200 rounded-full w-8 h-8" /><div><div className="animate-pulse bg-gray-200 rounded w-24 h-4 mb-1" /><div className="animate-pulse bg-gray-200 rounded w-32 h-3" /></div></div></td>
                    <td><div className="animate-pulse bg-gray-200 rounded w-24 h-4" /></td>
                    <td><div className="animate-pulse bg-gray-200 rounded-full w-16 h-6" /></td>
                    <td><div className="animate-pulse bg-gray-200 rounded-full w-16 h-6" /></td>
                    <td><div className="animate-pulse bg-gray-200 rounded w-8 h-4" /></td>
                    <td><div className="animate-pulse bg-gray-200 rounded w-20 h-4" /></td>
                    <td><div className="animate-pulse bg-gray-200 rounded w-12 h-6" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </AdminLayout>
    )
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
                        <a href={`/admin/users/${user.id}`} className="p-1.5 rounded text-text-muted hover:text-text hover:bg-muted" title="View"><Eye size={16} /></a>
                        <button className="p-1.5 rounded text-text-muted hover:text-primary-600 hover:bg-primary-50" onClick={() => handleOpenEdit(user)} title="Edit"><Pencil size={16} /></button>
                        {user.status === 'active' ? (
                          <button className="p-1.5 rounded text-text-muted hover:text-orange-600 hover:bg-orange-50" onClick={() => handleStatusChange(user.id, 'suspended')} title="Suspend"><UserX size={16} /></button>
                        ) : (
                          <button className="p-1.5 rounded text-text-muted hover:text-green-600 hover:bg-green-50" onClick={() => handleStatusChange(user.id, 'active')} title="Activate"><UserCheck size={16} /></button>
                        )}
                        <button 
                          className="p-1.5 rounded text-text-muted hover:text-red-600 hover:bg-red-50" 
                          onClick={() => handleDelete(user)} 
                          disabled={deleting === user.id}
                          title="Delete"
                        >
                          {deleting === user.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Edit User Modal */}
        {editUser && (
          <div className="modal-overlay" onClick={() => setEditUser(null)}>
            <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
              <div className="modal-header"><h3 className="font-semibold text-text">Edit User</h3><button onClick={() => setEditUser(null)}><X size={20} /></button></div>
              <form onSubmit={handleEditSubmit}>
                <div className="modal-body space-y-4">
                  <div className="form-group">
                    <label className="form-label">Name *</label>
                    <input type="text" className="form-input" value={editForm.name} onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input type="email" className="form-input" value={editForm.email} onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input type="text" className="form-input" value={editForm.phone} onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={editForm.status} onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value }))}>
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setEditUser(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View User Modal (kept for compatibility) */}
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

