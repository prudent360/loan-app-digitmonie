import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import CustomerLayout from '../../components/layouts/CustomerLayout'
import { walletAPI } from '../../services/api'
import { Wallet as WalletIcon, Plus, ArrowUpRight, ArrowDownLeft, Loader2, X, TrendingUp, TrendingDown, History, RefreshCw, ExternalLink } from 'lucide-react'

export default function Wallet() {
  const [searchParams] = useSearchParams()
  const [wallet, setWallet] = useState(null)
  const [summary, setSummary] = useState({ monthly_credits: 0, monthly_debits: 0 })
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFundModal, setShowFundModal] = useState(false)
  const [fundAmount, setFundAmount] = useState('')
  const [funding, setFunding] = useState(false)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    loadWallet()
    
    // Check for callback parameters
    const status = searchParams.get('status')
    const txRef = searchParams.get('tx_ref')
    const transactionId = searchParams.get('transaction_id')
    
    if (status === 'successful' && txRef && transactionId) {
      verifyPayment(txRef, transactionId)
    }
  }, [])

  const loadWallet = async () => {
    try {
      const res = await walletAPI.getBalance()
      setWallet(res.data.wallet)
      setSummary(res.data.summary)
      setTransactions(res.data.recent_transactions || [])
    } catch (err) {
      console.error('Failed to load wallet:', err)
    } finally {
      setLoading(false)
    }
  }

  const verifyPayment = async (reference, transactionId) => {
    setVerifying(true)
    try {
      const res = await walletAPI.verifyFunding(reference, transactionId)
      if (res.data.success) {
        setWallet(res.data.wallet)
        alert('Wallet funded successfully!')
        loadWallet() // Refresh data
      } else {
        alert(res.data.message || 'Payment verification failed')
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to verify payment')
    } finally {
      setVerifying(false)
      // Clean URL
      window.history.replaceState({}, document.title, '/wallet')
    }
  }

  const handleFundWallet = async (e) => {
    e.preventDefault()
    if (!fundAmount || parseFloat(fundAmount) < 100) {
      alert('Minimum funding amount is ₦100')
      return
    }

    setFunding(true)
    try {
      const res = await walletAPI.initializeFunding(parseFloat(fundAmount))
      if (res.data.success && res.data.payment_link) {
        // Redirect to Flutterwave payment page
        window.location.href = res.data.payment_link
      } else {
        alert(res.data.message || 'Failed to initialize funding')
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to initialize funding')
    } finally {
      setFunding(false)
    }
  }

  const formatCurrency = (amount) => `₦${Number(amount || 0).toLocaleString()}`
  const formatDate = (date) => new Date(date).toLocaleDateString('en-NG', { 
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
  })

  if (loading || verifying) {
    return (
      <CustomerLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Loader2 className="animate-spin text-primary-600" size={32} />
          {verifying && <p className="text-text-muted">Verifying your payment...</p>}
        </div>
      </CustomerLayout>
    )
  }

  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-text">My Wallet</h1>
            <p className="text-text-muted">Manage your wallet balance</p>
          </div>
          <button onClick={() => setShowFundModal(true)} className="btn btn-primary">
            <Plus size={18} /> Fund Wallet
          </button>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-purple-700 rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <WalletIcon size={24} />
              </div>
              <div>
                <p className="text-white/60 text-sm">Available Balance</p>
                <p className="text-3xl font-bold">{wallet?.formatted_balance || '₦0.00'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 text-green-300 mb-1">
                  <TrendingUp size={18} />
                  <span className="text-sm">Credits (This Month)</span>
                </div>
                <p className="text-xl font-semibold">{formatCurrency(summary.monthly_credits)}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 text-red-300 mb-1">
                  <TrendingDown size={18} />
                  <span className="text-sm">Debits (This Month)</span>
                </div>
                <p className="text-xl font-semibold">{formatCurrency(summary.monthly_debits)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button onClick={() => setShowFundModal(true)} className="card text-center py-6 hover:border-primary-300 transition-all group">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <ArrowDownLeft size={24} />
            </div>
            <p className="font-medium text-text">Fund Wallet</p>
          </button>
          <a href="/bills" className="card text-center py-6 hover:border-primary-300 transition-all group">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <ArrowUpRight size={24} />
            </div>
            <p className="font-medium text-text">Pay Bills</p>
          </a>
          <a href="/cards" className="card text-center py-6 hover:border-primary-300 transition-all group">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <ExternalLink size={24} />
            </div>
            <p className="font-medium text-text">Fund Card</p>
          </a>
          <button onClick={loadWallet} className="card text-center py-6 hover:border-primary-300 transition-all group">
            <div className="w-12 h-12 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <RefreshCw size={24} />
            </div>
            <p className="font-medium text-text">Refresh</p>
          </button>
        </div>

        {/* Transaction History */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History size={20} className="text-primary-600" />
              <h3 className="font-medium text-text">Recent Transactions</h3>
            </div>
            <a href="/wallet/transactions" className="text-primary-600 text-sm hover:underline">View All</a>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <History size={40} className="text-text-muted mx-auto mb-3 opacity-40" />
              <p className="text-text-muted">No transactions yet</p>
              <p className="text-sm text-text-muted">Fund your wallet to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {tx.type === 'credit' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                    </div>
                    <div>
                      <p className="font-medium text-text">{tx.description}</p>
                      <p className="text-xs text-text-muted">{formatDate(tx.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </p>
                    <p className="text-xs text-text-muted">Bal: {formatCurrency(tx.balance_after)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fund Modal */}
        {showFundModal && (
          <div className="modal-overlay" onClick={() => setShowFundModal(false)}>
            <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Fund Wallet</h3>
                <button onClick={() => setShowFundModal(false)}><X size={20} /></button>
              </div>
              <form onSubmit={handleFundWallet}>
                <div className="modal-body space-y-4">
                  <div className="bg-muted p-4 rounded-lg text-center">
                    <p className="text-sm text-text-muted">Current Balance</p>
                    <p className="text-2xl font-bold text-text">{wallet?.formatted_balance || '₦0.00'}</p>
                  </div>
                  
                  <div>
                    <label className="form-label">Amount to Fund (₦)</label>
                    <input 
                      type="number" 
                      className="form-input text-xl font-semibold"
                      placeholder="₦0.00"
                      min="100"
                      max="1000000"
                      value={fundAmount}
                      onChange={e => setFundAmount(e.target.value)}
                      required
                    />
                    <p className="text-xs text-text-muted mt-1">Minimum: ₦100 | Maximum: ₦1,000,000</p>
                  </div>

                  {/* Quick amounts */}
                  <div className="grid grid-cols-4 gap-2">
                    {[500, 1000, 2000, 5000].map(amt => (
                      <button 
                        key={amt} 
                        type="button"
                        onClick={() => setFundAmount(String(amt))}
                        className={`py-2 rounded-lg text-sm font-medium transition-all ${fundAmount === String(amt) ? 'bg-primary-600 text-white' : 'bg-muted text-text-muted hover:text-text'}`}
                      >
                        ₦{amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setShowFundModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={funding}>
                    {funding ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                    Pay with Flutterwave
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </CustomerLayout>
  )
}
