import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import { authAPI } from '../../services/api'
import { CheckCircle, XCircle, Loader2, ArrowRight, Mail } from 'lucide-react'

export default function VerifyEmail() {
  const { id, hash } = useParams()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('verifying') // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const verify = async () => {
      try {
        const expires = searchParams.get('expires')
        const signature = searchParams.get('signature')
        
        await authAPI.verifyEmail(id, hash, { expires, signature })
        setStatus('success')
        setMessage('Your email has been successfully verified! You can now access all features of your account.')
      } catch (err) {
        setStatus('error')
        setMessage(err.response?.data?.message || 'Email verification failed. The link may have expired or is invalid.')
      }
    }

    if (id && hash) {
      verify()
    } else {
      setStatus('error')
      setMessage('Invalid verification link.')
    }
  }, [id, hash, searchParams])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <Mail size={20} className="text-white" />
          </div>
          <span className="text-xl font-semibold text-text">DigitMonie</span>
        </div>

        <div className="card space-y-6 py-10">
          {status === 'verifying' && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <Loader2 className="w-16 h-16 text-primary-600 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-text">Verifying your email...</h1>
              <p className="text-text-muted text-sm">Please wait while we confirm your email address.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-text">Verification Successful!</h1>
              <p className="text-text-muted text-sm">{message}</p>
              <div className="pt-4">
                <Link to="/login" className="btn btn-primary w-full shadow-lg shadow-primary-500/20">
                  Sign In to Your Account <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-10 h-10 text-red-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-text">Verification Failed</h1>
              <p className="text-text-muted text-sm">{message}</p>
              <div className="pt-4 space-y-3">
                <Link to="/login" className="btn btn-outline w-full">
                  Return to Login
                </Link>
                <p className="text-xs text-text-muted">
                  Need another link? <Link to="/login" className="text-primary-600 hover:underline">Sign in</Link> to request one.
                </p>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-text-muted text-xs mt-8">
          © {new Date().getFullYear()} DigitMonie. All rights reserved.
        </p>
      </div>
    </div>
  )
}
