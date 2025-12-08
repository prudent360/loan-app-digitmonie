import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { Mail, Lock, User, Phone, Eye, EyeOff, Wallet, ArrowRight } from 'lucide-react'

export default function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', password_confirmation: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.phone || !formData.password) { toast.error('Please fill in all fields'); return }
    if (formData.password !== formData.password_confirmation) { toast.error('Passwords do not match'); return }
    if (formData.password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      await register(formData)
      toast.success('Registration successful!')
      navigate('/dashboard')
    } catch (err) {
      const errors = err.response?.data?.errors
      if (errors) Object.values(errors).flat().forEach(e => toast.error(e))
      else toast.error('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <Wallet size={20} className="text-white" />
          </div>
          <span className="text-xl font-semibold text-text">DigitMonie</span>
        </Link>

        {/* Card */}
        <div className="card">
          <div className="text-center mb-6">
            <h1 className="text-xl font-semibold text-text mb-1">Create an account</h1>
            <p className="text-text-muted text-sm">Start your loan application in minutes</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group"><label className="form-label">Full Name</label><input type="text" name="name" className="form-input" placeholder="John Doe" value={formData.name} onChange={handleChange} /></div>
            <div className="form-group"><label className="form-label">Email Address</label><input type="email" name="email" className="form-input" placeholder="name@example.com" value={formData.email} onChange={handleChange} /></div>
            <div className="form-group"><label className="form-label">Phone Number</label><input type="tel" name="phone" className="form-input" placeholder="+234 xxx xxx xxxx" value={formData.phone} onChange={handleChange} /></div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} name="password" className="form-input pr-10" placeholder="Create a password" value={formData.password} onChange={handleChange} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
              <p className="text-xs text-text-muted mt-1">Min 8 characters</p>
            </div>
            <div className="form-group"><label className="form-label">Confirm Password</label><input type={showPassword ? 'text' : 'password'} name="password_confirmation" className="form-input" placeholder="Confirm password" value={formData.password_confirmation} onChange={handleChange} /></div>

            <label className="flex items-start gap-2 mb-6 cursor-pointer">
              <input type="checkbox" className="mt-0.5 accent-primary-600" required />
              <span className="text-xs text-text-muted">I agree to the <a href="#" className="text-primary-600">Terms</a> and <a href="#" className="text-primary-600">Privacy Policy</a></span>
            </label>

            <button type="submit" className="btn btn-primary w-full" disabled={loading}>{loading ? 'Creating account...' : 'Create Account'} <ArrowRight size={16} /></button>
          </form>

          <p className="text-center text-text-muted text-sm mt-6">Already have an account? <Link to="/login" className="text-primary-600 hover:underline font-medium">Sign in</Link></p>
        </div>

        <p className="text-center text-text-muted text-xs mt-8">© 2024 DigitMonie. All rights reserved.</p>
      </div>
    </div>
  )
}
