import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { Mail, Lock, Eye, EyeOff, Wallet, ArrowRight } from 'lucide-react'

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.email || !formData.password) { toast.error('Please fill in all fields'); return }
    setLoading(true)
    try {
      const user = await login(formData)
      toast.success('Login successful!')
      // Redirect based on role
      if (user.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials')
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
          <div className="text-center mb-8">
            <h1 className="text-xl font-semibold text-text mb-1">Welcome back</h1>
            <p className="text-text-muted text-sm">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" name="email" className="form-input" placeholder="name@example.com" value={formData.email} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} name="password" className="form-input pr-10" placeholder="••••••••" value={formData.password} onChange={handleChange} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end mb-6">
              <Link to="/forgot-password" className="text-sm text-primary-600 hover:underline">Forgot password?</Link>
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'} <ArrowRight size={16} />
            </button>
          </form>

          <p className="text-center text-text-muted text-sm mt-6">
            Don't have an account? <Link to="/register" className="text-primary-600 hover:underline font-medium">Sign up</Link>
          </p>
        </div>

        <p className="text-center text-text-muted text-xs mt-8">© {new Date().getFullYear()} DigitMonie. All rights reserved.</p>
      </div>
    </div>
  )
}
