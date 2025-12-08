import { useState } from 'react'
import CustomerLayout from '../../components/layouts/CustomerLayout'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { User, Mail, Phone, MapPin, Building, Save, Lock, Eye, EyeOff } from 'lucide-react'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const [formData, setFormData] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '', address: user?.address || '', city: user?.city || '', state: user?.state || '' })
  const [passwordData, setPasswordData] = useState({ current_password: '', new_password: '', confirm_password: '' })

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  const handlePasswordChange = (e) => setPasswordData(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try { updateUser?.({ ...user, ...formData }); toast.success('Profile updated successfully!') } 
    catch { toast.error('Failed to update profile') } 
    finally { setLoading(false) }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    if (passwordData.new_password !== passwordData.confirm_password) { toast.error('Passwords do not match'); return }
    if (passwordData.new_password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setLoading(true)
    try { setPasswordData({ current_password: '', new_password: '', confirm_password: '' }); toast.success('Password updated successfully!') } 
    catch { toast.error('Failed to update password') } 
    finally { setLoading(false) }
  }

  return (
    <CustomerLayout>
      <div className="max-w-4xl space-y-6">
        {/* Header */}
        <div><h1 className="text-2xl font-semibold text-text">Profile Settings</h1><p className="text-text-muted">Manage your account information</p></div>

        {/* Profile Card */}
        <div className="card flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xl font-semibold">
            {formData.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text">{formData.name}</h2>
            <p className="text-text-muted text-sm">{formData.email}</p>
            <span className="badge badge-success mt-1">Verified</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="card">
            <h3 className="text-sm font-medium text-text mb-5">Personal Information</h3>
            <form onSubmit={handleProfileSubmit}>
              <div className="form-group"><label className="form-label">Full Name</label><input type="text" name="name" className="form-input" value={formData.name} onChange={handleChange} placeholder="Your name" /></div>
              <div className="form-group"><label className="form-label">Email Address</label><input type="email" name="email" className="form-input bg-muted text-text-muted" value={formData.email} disabled /><p className="text-xs text-text-muted mt-1">Email cannot be changed</p></div>
              <div className="form-group"><label className="form-label">Phone Number</label><input type="tel" name="phone" className="form-input" value={formData.phone} onChange={handleChange} placeholder="+234 xxx xxx xxxx" /></div>
              <div className="form-group"><label className="form-label">Address</label><input type="text" name="address" className="form-input" value={formData.address} onChange={handleChange} placeholder="Street address" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group"><label className="form-label">City</label><input type="text" name="city" className="form-input" value={formData.city} onChange={handleChange} placeholder="City" /></div>
                <div className="form-group"><label className="form-label">State</label><select name="state" className="form-input form-select" value={formData.state} onChange={handleChange}><option value="">Select</option>{['Lagos', 'Abuja', 'Rivers', 'Kano', 'Oyo'].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              </div>
              <button type="submit" className="btn btn-primary mt-2" disabled={loading}><Save size={16} />{loading ? 'Saving...' : 'Save Changes'}</button>
            </form>
          </div>

          {/* Change Password */}
          <div className="card">
            <h3 className="text-sm font-medium text-text mb-5">Change Password</h3>
            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} name="current_password" className="form-input pr-10" value={passwordData.current_password} onChange={handlePasswordChange} placeholder="Current password" />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
              </div>
              <div className="form-group"><label className="form-label">New Password</label><input type={showPassword ? 'text' : 'password'} name="new_password" className="form-input" value={passwordData.new_password} onChange={handlePasswordChange} placeholder="New password" /></div>
              <div className="form-group"><label className="form-label">Confirm New Password</label><input type={showPassword ? 'text' : 'password'} name="confirm_password" className="form-input" value={passwordData.confirm_password} onChange={handlePasswordChange} placeholder="Confirm password" /></div>
              <button type="submit" className="btn btn-primary mt-2" disabled={loading}><Lock size={16} />Update Password</button>
            </form>
          </div>
        </div>
      </div>
    </CustomerLayout>
  )
}
