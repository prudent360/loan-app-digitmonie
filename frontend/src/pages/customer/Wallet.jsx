import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import CustomerLayout from '../../components/layouts/CustomerLayout'
import api, { walletAPI } from '../../services/api'
import { Wallet as WalletIcon, Plus, ArrowUpRight, ArrowDownLeft, Loader2, X, TrendingUp, TrendingDown, History, RefreshCw, ExternalLink, Building2, CreditCard, Upload, CheckCircle, Clock, XCircle } from 'lucide-react'

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
  const [activeGateway, setActiveGateway] = useState('paystack')
  
  // Bank transfer states
  const [fundMethod, setFundMethod] = useState('card') // 'card' or 'transfer'
  const [transferRef, setTransferRef] = useState('')
  const [transferProof, setTransferProof] = useState(null)
  const [transferRequests, setTransferRequests] = useState([])
  const [submittingTransfer, setSubmittingTransfer] = useState(false)

  useEffect(() => {
    loadWallet()
    
    // Check for callback parameters from Flutterwave
    const status = searchParams.get('status')
    const txRef = searchParams.get('tx_ref')
    const transactionId = searchParams.get('transaction_id')
    
    console.log('Wallet callback params:', { status, txRef, transactionId })
    
    if (status === 'successful' && txRef && transactionId) {
      verifyPayment(txRef, transactionId)
    } else if (status === 'cancelled') {
      alert('Payment was cancelled')
      window.history.replaceState({}, document.title, '/wallet')
    } else if (status && status !== 'successful') {
      alert('Payment was not successful: ' + status)
      window.history.replaceState({}, document.title, '/wallet')
    }
  }, [searchParams])

  const loadWallet = async () => {
    try {
      const [walletRes, settingsRes, transfersRes] = await Promise.all([
        walletAPI.getBalance(),
        api.get('/settings/active-gateway').catch(() => ({ data: { gateway: 'paystack' } })),
        api.get('/customer/transfers').catch(() => ({ data: { data: [] } }))
      ])
      setWallet(walletRes.data.wallet)
      setSummary(walletRes.data.summary)
      setTransactions(walletRes.data.recent_transactions || [])
      setActiveGateway(settingsRes.data.gateway || 'paystack')
      setTransferRequests(transfersRes.data.data || [])
    } catch (err) {
      console.error('Failed to load wallet:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleBankTransfer = async (e) => {
    e.preventDefault()
    if (!fundAmount || parseFloat(fundAmount) < 100) {
      alert('Minimum amount is ₦100')
      return
    }
    if (!transferRef.trim()) {
      alert('Please enter your transfer reference')
      return
    }

    setSubmittingTransfer(true)
    try {
      const formData = new FormData()
      formData.append('amount', fundAmount)
      formData.append('reference', transferRef)
      if (transferProof) {
        formData.append('proof', transferProof)
      }

      const res = await api.post('/customer/transfers', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      alert(res.data.message || 'Transfer request submitted!')
      setShowFundModal(false)
      setFundAmount('')
      setTransferRef('')
      setTransferProof(null)
      loadWallet()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit transfer')
    } finally {
      setSubmittingTransfer(false)
    }
  }

  const verifyPayment = async (reference, transactionId) => {
    setVerifying(true)
    setLoading(false) // Allow UI to show verifying state
    console.log('Verifying payment:', { reference, transactionId })
    
    try {
      const res = await walletAPI.verifyFunding(reference, transactionId)
      console.log('Verification response:', res.data)
      
      if (res.data.success) {
        setWallet(res.data.wallet)
        alert('Wallet funded successfully! New balance: ' + res.data.wallet.formatted_balance)
        loadWallet() // Refresh data
      } else {
        alert(res.data.message || 'Payment verification failed')
      }
    } catch (err) {
      console.error('Verification error:', err)
      const errorMsg = err.response?.data?.message || 'Failed to verify payment. Please contact support.'
      alert(errorMsg)
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
        // Redirect to payment page
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

  const getGatewayName = () => {
    return activeGateway === 'flutterwave' ? 'Flutterwave' : 'Paystack'
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
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => setShowFundModal(true)} className="card text-center py-6 hover:border-primary-300 transition-all group">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <ArrowDownLeft size={24} />
            </div>
            <p className="font-medium text-text">Fund Wallet</p>
          </button>
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
          <div className="modal-overlay">
            <div className="modal-content max-w-lg">
              <div className="modal-header">
                <h3>Fund Wallet</h3>
                <button onClick={() => { setShowFundModal(false); setFundMethod('card'); }}><X size={20} /></button>
              </div>

              {/* Tab Selector */}
              <div className="flex border-b">
                <button
                  onClick={() => setFundMethod('card')}
                  className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${fundMethod === 'card' ? 'border-primary-600 text-primary-600' : 'border-transparent text-text-muted hover:text-text'}`}
                >
                  <CreditCard size={18} /> Card Payment
                </button>
                <button
                  onClick={() => setFundMethod('transfer')}
                  className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${fundMethod === 'transfer' ? 'border-primary-600 text-primary-600' : 'border-transparent text-text-muted hover:text-text'}`}
                >
                  <Building2 size={18} /> Bank Transfer
                </button>
              </div>

              {/* Card Payment Form */}
              {fundMethod === 'card' && (
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
                    </div>

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
                      Pay with Card
                    </button>
                  </div>
                </form>
              )}

              {/* Bank Transfer Form */}
              {fundMethod === 'transfer' && (
                <form onSubmit={handleBankTransfer}>
                  <div className="modal-body space-y-4">
                    {/* Bank Details */}
                    <div className="bg-gradient-to-r from-primary-50 to-blue-50 p-4 rounded-lg border border-primary-200">
                      <p className="text-sm font-medium text-primary-700 mb-2">Transfer to this account:</p>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-text-muted">Bank:</span> <strong>GTBank</strong></p>
                        <p><span className="text-text-muted">Account Number:</span> <strong>0123456789</strong></p>
                        <p><span className="text-text-muted">Account Name:</span> <strong>DigitMonie Ltd</strong></p>
                      </div>
                    </div>

                    <div>
                      <label className="form-label">Amount Transferred (₦)</label>
                      <input 
                        type="number" 
                        className="form-input"
                        placeholder="Enter amount"
                        min="100"
                        value={fundAmount}
                        onChange={e => setFundAmount(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="form-label">Transfer Reference</label>
                      <input 
                        type="text" 
                        className="form-input"
                        placeholder="Enter your bank transfer reference"
                        value={transferRef}
                        onChange={e => setTransferRef(e.target.value)}
                        required
                      />
                      <p className="text-xs text-text-muted mt-1">Find this in your bank app/receipt</p>
                    </div>

                    <div>
                      <label className="form-label">Payment Proof (Optional)</label>
                      <input 
                        type="file" 
                        accept="image/*"
                        className="form-input"
                        onChange={e => setTransferProof(e.target.files[0])}
                      />
                      <p className="text-xs text-text-muted mt-1">Screenshot of your transfer receipt</p>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline" onClick={() => setShowFundModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={submittingTransfer}>
                      {submittingTransfer ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                      Submit Transfer
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Transfer Requests History */}
        {transferRequests.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-semibold text-text mb-4">Bank Transfer Requests</h2>
            <div className="space-y-3">
              {transferRequests.slice(0, 5).map(tr => (
                <div key={tr.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">₦{Number(tr.amount).toLocaleString()}</p>
                    <p className="text-xs text-text-muted">Ref: {tr.reference}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {tr.status === 'pending' && <Clock size={16} className="text-amber-500" />}
                    {tr.status === 'approved' && <CheckCircle size={16} className="text-green-500" />}
                    {tr.status === 'rejected' && <XCircle size={16} className="text-red-500" />}
                    <span className={`text-xs font-medium capitalize ${tr.status === 'approved' ? 'text-green-600' : tr.status === 'rejected' ? 'text-red-600' : 'text-amber-600'}`}>
                      {tr.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </CustomerLayout>
  )
}
