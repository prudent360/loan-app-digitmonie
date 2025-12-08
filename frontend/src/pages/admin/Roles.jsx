import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layouts/AdminLayout'
import { useToast } from '../../context/ToastContext'
import api from '../../services/api'
import { Shield, Users, Plus, Edit2, Trash2, X, Check, Loader2, UserPlus } from 'lucide-react'

const allPermissions = [
  { name: 'manage_users', display: 'Manage Users', desc: 'Create, update, suspend users' },
  { name: 'assign_roles', display: 'Assign Roles', desc: 'Assign roles to staff' },
  { name: 'manage_loans', display: 'Manage Loans', desc: 'Approve/reject loans' },
  { name: 'manage_kyc', display: 'Manage KYC', desc: 'Verify KYC documents' },
  { name: 'view_reports', display: 'View Reports', desc: 'Access dashboard' },
  { name: 'manage_settings', display: 'Manage Settings', desc: 'Update settings' },
]

export default function AdminRoles() {
  const [loading, setLoading] = useState(true)
  const [roles, setRoles] = useState([])
  const [staff, setStaff] = useState([])
  const [activeTab, setActiveTab] = useState('roles')
  const [selectedRole, setSelectedRole] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('view')
  const [formData, setFormData] = useState({ display_name: '', description: '', permissions: [] })
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [staffRoles, setStaffRoles] = useState([])
  const [saving, setSaving] = useState(false)
  const [newStaff, setNewStaff] = useState({ name: '', email: '', password: '', roles: [] })
  const toast = useToast()

  // Fetch roles and staff from API
  useEffect(() => {
    const loadData = async () => {
      try {
        const rolesRes = await api.get('/admin/roles')
        const rolesData = rolesRes.data.roles || rolesRes.data || []
        setRoles(rolesData.map(r => ({
          ...r,
          display_name: r.display_name || r.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          permissions: r.permissions?.map(p => p.name || p) || [],
          isCore: ['super_admin', 'loan_manager', 'kyc_officer', 'support'].includes(r.name)
        })))
        
        const staffRes = await api.get('/admin/staff')
        const staffData = staffRes.data.users || staffRes.data || []
        setStaff(staffData.map(u => ({
          ...u,
          roles: u.roles?.map(r => r.name || r) || []
        })))
      } catch (err) {
        console.error('Failed to load roles:', err)
        toast.error('Failed to load roles data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const openRoleModal = (role, type = 'view') => {
    setSelectedRole(role)
    setModalType(type)
    if (type === 'edit' || type === 'create') {
      setFormData(role ? { display_name: role.display_name, description: role.description || '', permissions: role.permissions } : { display_name: '', description: '', permissions: [] })
    }
    setShowModal(true)
  }

  const openAddStaffModal = () => {
    setNewStaff({ name: '', email: '', password: '', roles: [] })
    setModalType('addStaff')
    setShowModal(true)
  }

  const closeModal = () => { setShowModal(false); setSelectedRole(null); setSelectedStaff(null) }

  const togglePermission = (perm) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm) ? prev.permissions.filter(p => p !== perm) : [...prev.permissions, perm]
    }))
  }

  const toggleNewStaffRole = (roleName) => {
    setNewStaff(prev => ({
      ...prev,
      roles: prev.roles.includes(roleName) ? prev.roles.filter(r => r !== roleName) : [...prev.roles, roleName]
    }))
  }

  const handleSaveRole = async () => {
    if (!formData.display_name.trim()) { toast.error('Role name is required'); return }
    setSaving(true)
    try {
      if (modalType === 'create') {
        const res = await api.post('/admin/roles', {
          name: formData.display_name.toLowerCase().replace(/\s+/g, '_'),
          display_name: formData.display_name,
          description: formData.description,
          permissions: formData.permissions
        })
        setRoles([...roles, { ...res.data.role, permissions: formData.permissions, isCore: false }])
        toast.success('Role created successfully')
      } else {
        await api.put(`/admin/roles/${selectedRole.id}`, { permissions: formData.permissions })
        setRoles(roles.map(r => r.id === selectedRole.id ? { ...r, permissions: formData.permissions } : r))
        toast.success('Role updated successfully')
      }
      closeModal()
    } catch (err) {
      toast.error('Failed to save role')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteRole = async (role) => {
    if (role.isCore) { toast.error('Cannot delete core roles'); return }
    try {
      await api.delete(`/admin/roles/${role.id}`)
      setRoles(roles.filter(r => r.id !== role.id))
      toast.success('Role deleted')
    } catch (err) {
      toast.error('Failed to delete role')
      console.error(err)
    }
  }

  const openStaffModal = (user) => {
    setSelectedStaff(user)
    setStaffRoles(user.roles)
    setShowModal(true)
    setModalType('staff')
  }

  const toggleStaffRole = (roleName) => {
    setStaffRoles(prev => prev.includes(roleName) ? prev.filter(r => r !== roleName) : [...prev, roleName])
  }

  const handleSaveStaffRoles = async () => {
    setSaving(true)
    try {
      await api.put(`/admin/users/${selectedStaff.id}/roles`, { roles: staffRoles })
      setStaff(staff.map(s => s.id === selectedStaff.id ? { ...s, roles: staffRoles } : s))
      toast.success('Roles updated')
      closeModal()
    } catch (err) {
      toast.error('Failed to update roles')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleAddStaff = async () => {
    if (!newStaff.name.trim() || !newStaff.email.trim() || !newStaff.password.trim()) {
      toast.error('Please fill in all required fields')
      return
    }
    if (newStaff.roles.length === 0) {
      toast.error('Please select at least one role')
      return
    }
    setSaving(true)
    try {
      const res = await api.post('/admin/staff', newStaff)
      const newUser = res.data.user
      setStaff([...staff, { ...newUser, roles: newStaff.roles }])
      toast.success('Staff member added successfully')
      closeModal()
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to add staff member'
      toast.error(message)
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveStaff = async (user) => {
    if (!confirm(`Remove ${user.name} from staff?`)) return
    try {
      await api.put(`/admin/users/${user.id}/roles`, { roles: [] })
      setStaff(staff.filter(s => s.id !== user.id))
      toast.success('Staff member removed')
    } catch (err) {
      toast.error('Failed to remove staff member')
      console.error(err)
    }
  }

  if (loading) {
    return <AdminLayout><div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary-600" size={32} /></div></AdminLayout>
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-semibold text-text">Role Management</h1><p className="text-text-muted">Manage admin roles and assign privileges</p></div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border pb-1">
          <button className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${activeTab === 'roles' ? 'bg-primary-50 text-primary-600 border-b-2 border-primary-600' : 'text-text-muted hover:text-text'}`} onClick={() => setActiveTab('roles')}><Shield size={16} className="inline mr-2" />Roles & Permissions</button>
          <button className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${activeTab === 'staff' ? 'bg-primary-50 text-primary-600 border-b-2 border-primary-600' : 'text-text-muted hover:text-text'}`} onClick={() => setActiveTab('staff')}><Users size={16} className="inline mr-2" />Staff Members</button>
        </div>

        {/* Roles Tab */}
        {activeTab === 'roles' && (
          <>
            <div className="flex justify-end"><button className="btn btn-primary btn-sm" onClick={() => openRoleModal(null, 'create')}><Plus size={16} /> Create Role</button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roles.map(role => (
                <div key={role.id} className="card">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-text">{role.display_name}</h3>
                      <p className="text-sm text-text-muted">{role.description}</p>
                    </div>
                    <div className="flex gap-1">
                      <button className="p-1.5 rounded text-text-muted hover:text-primary-600 hover:bg-primary-50" onClick={() => openRoleModal(role, 'edit')}><Edit2 size={16} /></button>
                      {!role.isCore && <button className="p-1.5 rounded text-text-muted hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteRole(role)}><Trash2 size={16} /></button>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-3 border-t border-border">
                    {role.permissions.map(p => <span key={p} className="badge badge-success text-xs">{allPermissions.find(ap => ap.name === p)?.display || p}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Staff Tab */}
        {activeTab === 'staff' && (
          <>
            <div className="flex justify-end"><button className="btn btn-primary btn-sm" onClick={openAddStaffModal}><UserPlus size={16} /> Add Staff Member</button></div>
            <div className="card p-0">
              {staff.length === 0 ? (
                <div className="text-center py-10 text-text-muted">No staff members found. Add your first staff member above.</div>
              ) : (
                <table className="table">
                  <thead><tr><th>Staff Member</th><th>Email</th><th>Roles</th><th>Actions</th></tr></thead>
                  <tbody>
                    {staff.map(user => (
                      <tr key={user.id}>
                        <td className="font-medium text-text">{user.name}</td>
                        <td className="text-text-muted">{user.email}</td>
                        <td><div className="flex flex-wrap gap-1">{user.roles.map(r => <span key={r} className="badge badge-info text-xs">{roles.find(role => role.name === r)?.display_name || r}</span>)}</div></td>
                        <td>
                          <div className="flex gap-1">
                            <button className="btn btn-outline btn-sm" onClick={() => openStaffModal(user)}><Edit2 size={14} /> Edit Roles</button>
                            <button className="p-1.5 rounded text-text-muted hover:text-red-600 hover:bg-red-50" onClick={() => handleRemoveStaff(user)}><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{modalType === 'create' ? 'Create Role' : modalType === 'staff' ? 'Assign Roles' : modalType === 'addStaff' ? 'Add Staff Member' : 'Edit Role'}</h3>
                <button onClick={closeModal}><X size={20} /></button>
              </div>
              <div className="modal-body">
                {modalType === 'addStaff' ? (
                  <div className="space-y-4">
                    <div className="form-group"><label className="form-label">Full Name *</label><input type="text" className="form-input" value={newStaff.name} onChange={e => setNewStaff({ ...newStaff, name: e.target.value })} placeholder="John Doe" /></div>
                    <div className="form-group"><label className="form-label">Email *</label><input type="email" className="form-input" value={newStaff.email} onChange={e => setNewStaff({ ...newStaff, email: e.target.value })} placeholder="john@digitmonie.com" /></div>
                    <div className="form-group"><label className="form-label">Password *</label><input type="password" className="form-input" value={newStaff.password} onChange={e => setNewStaff({ ...newStaff, password: e.target.value })} placeholder="Minimum 8 characters" /></div>
                    <div className="form-group">
                      <label className="form-label">Assign Roles *</label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {roles.map(role => (
                          <label key={role.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${newStaff.roles.includes(role.name) ? 'border-primary-500 bg-primary-50' : 'border-border hover:border-primary-300'}`}>
                            <input type="checkbox" checked={newStaff.roles.includes(role.name)} onChange={() => toggleNewStaffRole(role.name)} className="accent-primary-600" />
                            <div><strong className="text-text text-sm">{role.display_name}</strong><p className="text-xs text-text-muted">{role.description}</p></div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : modalType === 'staff' ? (
                  <div className="space-y-2">
                    <p className="text-sm text-text-muted mb-4">Select roles for <strong>{selectedStaff.name}</strong></p>
                    {roles.map(role => (
                      <label key={role.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${staffRoles.includes(role.name) ? 'border-primary-500 bg-primary-50' : 'border-border hover:border-primary-300'}`}>
                        <input type="checkbox" checked={staffRoles.includes(role.name)} onChange={() => toggleStaffRole(role.name)} className="accent-primary-600" />
                        <div><strong className="text-text text-sm">{role.display_name}</strong><p className="text-xs text-text-muted">{role.description}</p></div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="form-group"><label className="form-label">Role Name</label><input type="text" className="form-input" value={formData.display_name} onChange={e => setFormData({ ...formData, display_name: e.target.value })} placeholder="e.g., Auditor" disabled={selectedRole?.isCore} /></div>
                    <div className="form-group"><label className="form-label">Description</label><input type="text" className="form-input" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Role description" /></div>
                    <div className="form-group">
                      <label className="form-label">Permissions</label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {allPermissions.map(perm => (
                          <label key={perm.name} className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${formData.permissions.includes(perm.name) ? 'border-primary-500 bg-primary-50' : 'border-border'} ${selectedRole?.isCore && selectedRole?.name === 'super_admin' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <input type="checkbox" checked={formData.permissions.includes(perm.name)} onChange={() => !selectedRole?.isCore && togglePermission(perm.name)} className="accent-primary-600" disabled={selectedRole?.isCore && selectedRole?.name === 'super_admin'} />
                            <div><strong className="text-text text-sm">{perm.display}</strong><p className="text-xs text-text-muted">{perm.desc}</p></div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline" onClick={closeModal} disabled={saving}>Cancel</button>
                <button className="btn btn-primary" onClick={modalType === 'staff' ? handleSaveStaffRoles : modalType === 'addStaff' ? handleAddStaff : handleSaveRole} disabled={saving}><Check size={16} /> {saving ? 'Saving...' : 'Save'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
