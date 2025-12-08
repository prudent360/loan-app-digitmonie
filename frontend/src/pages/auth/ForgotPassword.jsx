import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import { Mail, Wallet, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const toast = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) { toast.error('Please enter your email'); return }
    setLoading(true)
    await new Promise(r => setTimeout(r, 1500))
    setSent(true)
    toast.success('Reset link sent!')
    setLoading(false)
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
          {sent ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 size={28} className="text-primary-600" />
              </div>
              <h1 className="text-xl font-semibold text-text mb-2">Check your email</h1>
              <p className="text-text-muted text-sm mb-6">We've sent a password reset link to <strong className="text-text">{email}</strong></p>
              <p className="text-xs text-text-muted mb-6">Didn't receive the email? Check your spam folder.</p>
              <button className="btn btn-outline w-full mb-3" onClick={() => setSent(false)}>Try another email</button>
              <Link to="/login" className="btn btn-primary w-full"><ArrowLeft size={16} /> Back to Login</Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-xl font-semibold text-text mb-1">Forgot password?</h1>
                <p className="text-text-muted text-sm">No worries, we'll send you reset instructions</p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input type="email" className="form-input" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>

                <button type="submit" className="btn btn-primary w-full mb-3" disabled={loading}>{loading ? 'Sending...' : 'Send Reset Link'} <ArrowRight size={16} /></button>
                <Link to="/login" className="btn btn-outline w-full"><ArrowLeft size={16} /> Back to Login</Link>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-text-muted text-xs mt-8">© 2024 DigitMonie. All rights reserved.</p>
      </div>
    </div>
  )
}
