import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import CustomerLayout from '../../components/layouts/CustomerLayout'
import { paymentAPI } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

export default function PaymentCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [status, setStatus] = useState('verifying') // verifying, success, failed
  const [message, setMessage] = useState('')

  useEffect(() => {
    const verifyPayment = async () => {
      const reference = searchParams.get('reference') || searchParams.get('trxref')
      const transactionId = searchParams.get('transaction_id')
      const txStatus = searchParams.get('status')

      // Flutterwave sends status=cancelled if user cancels
      if (txStatus === 'cancelled') {
        setStatus('failed')
        setMessage('Payment was cancelled')
        return
      }

      if (!reference && !transactionId) {
        setStatus('failed')
        setMessage('Invalid payment reference')
        return
      }

      try {
        await paymentAPI.verify({ reference, transaction_id: transactionId })
        setStatus('success')
        setMessage('Your payment has been processed successfully!')
        toast.success('Payment successful!')
      } catch (err) {
        setStatus('failed')
        setMessage(err.response?.data?.message || 'Payment verification failed')
        toast.error('Payment verification failed')
      }
    }

    verifyPayment()
  }, [searchParams])

  return (
    <CustomerLayout>
      <div className="max-w-md mx-auto mt-16">
        <div className="card text-center">
          {status === 'verifying' && (
            <>
              <Loader2 size={64} className="animate-spin text-primary-600 mx-auto mb-6" />
              <h2 className="text-xl font-semibold text-text mb-2">Verifying Payment</h2>
              <p className="text-text-muted">Please wait while we confirm your payment...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} className="text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-text mb-2">Payment Successful!</h2>
              <p className="text-text-muted mb-6">{message}</p>
              <button className="btn btn-primary" onClick={() => navigate('/loans')}>
                Back to My Loans
              </button>
            </>
          )}

          {status === 'failed' && (
            <>
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle size={40} className="text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-text mb-2">Payment Failed</h2>
              <p className="text-text-muted mb-6">{message}</p>
              <div className="flex gap-3 justify-center">
                <button className="btn btn-outline" onClick={() => navigate('/loans')}>
                  Back to Loans
                </button>
                <button className="btn btn-primary" onClick={() => window.history.back()}>
                  Try Again
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </CustomerLayout>
  )
}
