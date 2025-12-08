import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layouts/AdminLayout'
import { useToast } from '../../context/ToastContext'
import { Shield, Users, Plus, Edit2, Trash2, X, Check } from 'lucide-react'

const allPermissions = [
  { name: 'manage_users', display: 'Manage Users', desc: 'Create, update, suspend users' },
  { name: 'assign_roles', display: 'Assign Roles', desc: 'Assign roles to staff' },
  { name: 'manage_loans', display: 'Manage Loans', desc: 'Approve/reject loans' },
  { name: 'manage_kyc', display: 'Manage KYC', desc: 'Verify KYC documents' },
  { name: 'view_reports', display: 'View Reports', desc: 'Access dashboard' },
  { name: 'manage_settings', display: 'Manage Settings', desc: 'Update settings' },
]

const defaultRoles = [
  { id: 1, name: 'super_admin', display_name: 'Super Admin', description: 'Full system access', permissions: allPermissions.map(p => p.name), isCore: true },
  { id: 2, name: 'loan_manager', display_name: 'Loan Manager', description: 'Review loan applications', permissions: ['manage_loans', 'view_reports'], isCore: true },
  { id: 3, name: 'kyc_officer', display_name: 'KYC Officer', description: 'Verify KYC documents', permissions: ['manage_kyc', 'view_reports'], isCore: true },
  { id: 4, name: 'support', display_name: 'Support Staff', description: 'Read-only access', permissions: ['view_reports'], isCore: true },
]

const mockStaff = [
  { id: 1, name: 'Admin User', email: 'admin@digitmonie.com', roles: ['super_admin'] },
  { id: 2, name: 'John Manager', email: 'john.manager@digitmonie.com', roles: ['loan_manager'] },
  { id: 3, name: 'Jane KYC', email: 'jane.kyc@digitmonie.com', roles: ['kyc_officer'] },
]

export default function AdminRoles() {
  const [roles, setRoles] = useState(defaultRoles)
  const [staff, setStaff] = useState(mockStaff)
  const [activeTab, setActiveTab] = useState('roles')
  const [selectedRole, setSelectedRole] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('view')
  const [formData, setFormData] = useState({ display_name: '', description: '', permissions: [] })
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [staffRoles, setStaffRoles] = useState([])
  const toast = useToast()

  const openRoleModal = (role, type = 'view') => {
    setSelectedRole(role)
    setModalType(type)
    if (type === 'edit' || type === 'create') {
      setFormData(role ? { display_name: role.display_name, description: role.description, permissions: role.permissions } : { display_name: '', description: '', permissions: [] })
    }
    setShowModal(true)
  }

  const closeModal = () => { setShowModal(false); setSelectedRole(null); setSelectedStaff(null) }

  const togglePermission = (perm) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm) ? prev.permissions.filter(p => p !== perm) : [...prev.permissions, perm]
    }))
  }

  const handleSaveRole = () => {
    if (!formData.display_name.trim()) { toast.error('Role name is required'); return }
    if (modalType === 'create') {
      const newRole = { id: Date.now(), name: formData.display_name.toLowerCase().replace(/\s+/g, '_'), ...formData, isCore: false }
      setRoles([...roles, newRole])
      toast.success('Role created successfully')
    } else {
      setRoles(roles.map(r => r.id === selectedRole.id ? { ...r, ...formData } : r))
      toast.success('Role updated successfully')
    }
    closeModal()
  }

  const handleDeleteRole = (role) => {
    if (role.isCore) { toast.error('Cannot delete core roles'); return }
    setRoles(roles.filter(r => r.id !== role.id))
    toast.success('Role deleted')
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

  const handleSaveStaffRoles = () => {
    setStaff(staff.map(s => s.id === selectedStaff.id ? { ...s, roles: staffRoles } : s))
    toast.success('Roles updated')
    closeModal()
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
          <div className="card p-0">
            <table className="table">
              <thead><tr><th>Staff Member</th><th>Email</th><th>Roles</th><th>Actions</th></tr></thead>
              <tbody>
                {staff.map(user => (
                  <tr key={user.id}>
                    <td className="font-medium text-text">{user.name}</td>
                    <td className="text-text-muted">{user.email}</td>
                    <td><div className="flex flex-wrap gap-1">{user.roles.map(r => <span key={r} className="badge badge-info text-xs">{roles.find(role => role.name === r)?.display_name || r}</span>)}</div></td>
                    <td><button className="btn btn-outline btn-sm" onClick={() => openStaffModal(user)}><Edit2 size={14} /> Edit Roles</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{modalType === 'create' ? 'Create Role' : modalType === 'staff' ? 'Assign Roles' : 'Edit Role'}</h3>
                <button onClick={closeModal}><X size={20} /></button>
              </div>
              <div className="modal-body">
                {modalType === 'staff' ? (
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
                <button className="btn btn-outline" onClick={closeModal}>Cancel</button>
                <button className="btn btn-primary" onClick={modalType === 'staff' ? handleSaveStaffRoles : handleSaveRole}><Check size={16} /> Save</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
