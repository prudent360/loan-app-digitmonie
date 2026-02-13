import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import { Mail, ArrowLeft, Loader2, CheckCircle, Wallet } from 'lucide-react'

export default function EmailVerificationPrompt() {
  const [loading, setLoading] = useState(false)
  const [resent, setResent] = useState(false)
  const toast = useToast()
  const navigate = useNavigate()
  
  // Get email from localStorage (stored during login attempt)
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const email = user.email

  const handleResend = async () => {
    setLoading(true)
    try {
      await authAPI.resendVerification()
      setResent(true)
      toast.success('Verification link resent successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend verification link.')
    } finally {
      setLoading(false)
    }
  }

  if (!email) {
    navigate('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <Wallet size={20} className="text-white" />
          </div>
          <span className="text-xl font-semibold text-text">DigitMonie</span>
        </div>

        <div className="card text-center py-10">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
              <Mail className="w-10 h-10 text-primary-600" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-text mb-2">Verify your email</h1>
          <p className="text-text-muted mb-8 px-6">
            We've sent a verification link to <span className="font-semibold text-text">{email}</span>. 
            Please check your inbox (and spam folder) and click the link to activate your account.
          </p>

          <div className="space-y-4 px-6">
            <button 
              onClick={handleResend}
              disabled={loading || resent}
              className={`btn w-full ${resent ? 'btn-outline text-green-600 border-green-200 bg-green-50' : 'btn-primary'}`}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Resending...</>
              ) : resent ? (
                <><CheckCircle className="w-4 h-4 mr-2" /> Link Resent</>
              ) : (
                'Resend Verification Link'
              )}
            </button>

            <Link to="/login" className="btn btn-ghost w-full flex items-center justify-center gap-2">
              <ArrowLeft size={16} /> Back to Sign In
            </Link>
          </div>
          
          <p className="mt-8 text-xs text-text-muted px-6 italic">
            Note: You won't be able to access your dashboard until your email is verified.
          </p>
        </div>

        <p className="text-center text-text-muted text-xs mt-8">
          © {new Date().getFullYear()} DigitMonie. All rights reserved.
        </p>
      </div>
    </div>
  )
}
