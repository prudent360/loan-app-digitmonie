import { useState, useEffect } from 'react'
import CustomerLayout from '../../components/layouts/CustomerLayout'
import { PiggyBank, Plus, TrendingUp, Lock, Unlock, Loader2, ArrowRight, Clock, Wallet, AlertCircle, CheckCircle, X, Sparkles } from 'lucide-react'
import api from '../../services/api'

export default function Savings() {
  const [plans, setPlans] = useState([])
  const [mySavings, setMySavings] = useState([])
  const [walletBalance, setWalletBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('lock') // 'lock' or 'my-savings'

  // Form state
  const [amount, setAmount] = useState('')
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [selectedDuration, setSelectedDuration] = useState(null)
  const [savingsName, setSavingsName] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [plansRes, savingsRes, walletRes] = await Promise.all([
        api.get('/customer/savings/plans'),
        api.get('/customer/savings'),
        api.get('/customer/wallet').catch(() => ({ data: { wallet: { balance: 0 } } }))
      ])
      setPlans(plansRes.data.plans || [])
      setMySavings(savingsRes.data.savings || [])
      setWalletBalance(walletRes.data.wallet?.balance || 0)
    } catch (err) {
      console.error('Failed to load savings:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => `₦${Number(amount || 0).toLocaleString()}`

  const handleLockFunds = async (e) => {
    e.preventDefault()
    if (!selectedPlan || !selectedDuration || !amount) return

    if (Number(amount) > walletBalance) {
      alert('Insufficient wallet balance')
      return
    }

    if (Number(amount) < selectedPlan.min_amount) {
      alert(`Minimum amount is ${formatCurrency(selectedPlan.min_amount)}`)
      return
    }

    setSubmitting(true)
    try {
      await api.post('/customer/savings', {
        savings_plan_id: selectedPlan.id,
        savings_plan_duration_id: selectedDuration.id,
        name: savingsName || null,
        amount: Number(amount)
      })
      setActiveTab('my-savings')
      setAmount('')
      setSavingsName('')
      setSelectedPlan(null)
      setSelectedDuration(null)
      loadData()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to lock funds')
    } finally {
      setSubmitting(false)
    }
  }

  const handleWithdraw = async (id) => {
    const saving = mySavings.find(s => s.id === id)
    const penalty = saving?.withdrawal_penalty || 0
    
    const msg = penalty > 0 
      ? `Early withdrawal penalty of ${formatCurrency(penalty)} will be applied. Proceed?`
      : 'Withdraw this savings to your wallet?'
    
    if (!confirm(msg)) return

    try {
      const res = await api.post(`/customer/savings/${id}/withdraw`)
      alert(`Withdrawn ${formatCurrency(res.data.amount)} to wallet${res.data.penalty > 0 ? ` (Penalty: ${formatCurrency(res.data.penalty)})` : ''}`)
      loadData()
    } catch (err) {
      alert(err.response?.data?.message || 'Withdrawal failed')
    }
  }

  const totalSaved = mySavings.filter(s => s.status === 'active').reduce((sum, s) => sum + Number(s.total_balance || 0), 0)

  // Calculate expected return for selected duration
  const expectedReturn = selectedDuration && amount 
    ? Number(amount) * (selectedDuration.interest_rate / 100) * (selectedDuration.lock_period_days / 365)
    : 0

  if (loading) {
    return (
      <CustomerLayout>
        <div className="space-y-6">
          <div className="animate-pulse bg-gray-200 rounded-2xl h-32" />
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[1,2,3,4,5,6].map(i => <div key={i} className="animate-pulse bg-gray-200 rounded-xl h-16" />)}
          </div>
          <div className="animate-pulse bg-gray-200 rounded-xl h-14" />
          <div className="animate-pulse bg-gray-200 rounded-xl h-12" />
        </div>
      </CustomerLayout>
    )
  }

  return (
    <CustomerLayout>
      <div className="space-y-6 max-w-xl mx-auto">
        {/* Header with Wallet Balance */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text">Lock Funds</h1>
            <p className="text-text-muted text-sm">Grow your money with fixed returns</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-muted">Wallet Balance</p>
            <p className="text-lg font-bold text-primary-600">{formatCurrency(walletBalance)}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('lock')}
            className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'lock' 
                ? 'bg-white shadow-sm text-primary-600' 
                : 'text-text-muted hover:text-text'
            }`}
          >
            <Lock size={16} className="inline mr-1.5" />
            Lock Funds
          </button>
          <button
            onClick={() => setActiveTab('my-savings')}
            className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'my-savings' 
                ? 'bg-white shadow-sm text-primary-600' 
                : 'text-text-muted hover:text-text'
            }`}
          >
            <PiggyBank size={16} className="inline mr-1.5" />
            My Savings ({mySavings.filter(s => s.status === 'active').length})
          </button>
        </div>

        {activeTab === 'lock' ? (
          <form onSubmit={handleLockFunds} className="space-y-6">
            {/* Select Savings Plan */}
            {plans.length > 1 && (
              <div>
                <label className="block text-sm text-text-muted mb-3">Select Plan</label>
                <div className="grid grid-cols-2 gap-2">
                  {plans.map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => {
                        setSelectedPlan(plan)
                        setSelectedDuration(null)
                      }}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        selectedPlan?.id === plan.id 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <p className="font-bold text-text">{plan.name}</p>
                      <p className="text-xs text-text-muted">{plan.durations?.length || 0} duration options</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Auto-select single plan */}
            {plans.length === 1 && !selectedPlan && setSelectedPlan(plans[0])}

            {/* Amount Input */}
            <div className="card">
              <label className="block text-sm text-text-muted mb-2">How much do you want to lock?</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-text">₦</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full text-3xl font-bold text-text py-4 pl-12 pr-4 bg-transparent border-none focus:outline-none focus:ring-0"
                  required
                />
                {amount && (
                  <button type="button" onClick={() => setAmount('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text">
                    <X size={20} />
                  </button>
                )}
              </div>
              {walletBalance < Number(amount || 0) && (
                <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                  <AlertCircle size={14} /> Insufficient funds
                </p>
              )}
            </div>

            {/* Duration Selection */}
            {selectedPlan && (
              <div>
                <label className="block text-sm text-text-muted mb-3">For how long?</label>
                {(!selectedPlan.durations || selectedPlan.durations.length === 0) ? (
                  <div className="text-center text-text-muted py-6">No duration options available</div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {selectedPlan.durations.map((duration) => (
                      <button
                        key={duration.id}
                        type="button"
                        onClick={() => setSelectedDuration(duration)}
                        className={`relative p-4 rounded-xl border-2 text-center transition-all ${
                          selectedDuration?.id === duration.id 
                            ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200' 
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        {selectedDuration?.id === duration.id && (
                          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                            <CheckCircle size={14} className="text-white" />
                          </div>
                        )}
                        <p className="font-bold text-text">
                          {duration.lock_period_days === 0 ? 'Flex' : `${duration.lock_period_days} days`}
                        </p>
                        <p className={`text-xs mt-0.5 ${selectedDuration?.id === duration.id ? 'text-primary-600' : 'text-text-muted'}`}>
                          {duration.interest_rate}% P.A.
                        </p>
                        {duration.early_withdrawal_penalty > 0 && duration.lock_period_days > 0 && (
                          <span className="absolute top-1 right-1">
                            <Lock size={12} className="text-orange-500" />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Savings Name */}
            <div className="card">
              <label className="block text-sm text-text-muted mb-2">Name your savings (optional)</label>
              <input
                type="text"
                value={savingsName}
                onChange={(e) => setSavingsName(e.target.value)}
                placeholder="e.g., Emergency Fund, Vacation, etc."
                className="form-input"
                maxLength={100}
              />
            </div>

            {/* Expected Return Preview */}
            {selectedDuration && amount && Number(amount) >= (selectedPlan?.min_amount || 0) && (
              <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-5 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={18} />
                  <span className="font-medium">Expected Return</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-primary-100 text-xs">You Lock</p>
                    <p className="font-bold text-lg">{formatCurrency(amount)}</p>
                  </div>
                  <div>
                    <p className="text-primary-100 text-xs">Interest</p>
                    <p className="font-bold text-lg text-green-300">+{formatCurrency(expectedReturn)}</p>
                  </div>
                  <div>
                    <p className="text-primary-100 text-xs">You Get</p>
                    <p className="font-bold text-lg">{formatCurrency(Number(amount) + expectedReturn)}</p>
                  </div>
                </div>
                {selectedDuration.lock_period_days > 0 && (
                  <p className="text-xs text-primary-100 mt-3 text-center">
                    Matures in {selectedDuration.lock_period_days} days • Early withdrawal penalty: {selectedDuration.early_withdrawal_penalty}%
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !selectedPlan || !selectedDuration || !amount || Number(amount) > walletBalance || Number(amount) < (selectedPlan?.min_amount || 0)}
              className="btn btn-primary w-full py-4 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 className="animate-spin mx-auto" size={24} /> : 'Continue'}
            </button>
          </form>
        ) : (
          /* My Savings List */
          <div className="space-y-4">
            {/* Total Balance Card */}
            <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-6 text-white">
              <p className="text-violet-100 text-sm">Total Savings Balance</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(totalSaved)}</p>
            </div>

            {mySavings.length === 0 ? (
              <div className="card text-center py-12">
                <Wallet size={48} className="mx-auto text-text-muted mb-4" />
                <h3 className="text-lg font-semibold text-text mb-2">No savings yet</h3>
                <p className="text-text-muted mb-4">Lock your funds and start earning</p>
                <button onClick={() => setActiveTab('lock')} className="btn btn-primary">
                  Lock Funds
                </button>
              </div>
            ) : (
              mySavings.map((saving) => (
                <div key={saving.id} className={`card ${saving.status !== 'active' ? 'opacity-60' : ''}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        saving.status === 'active' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <PiggyBank size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-text">{saving.name || saving.savings_plan?.name}</h3>
                        <p className="text-xs text-text-muted">
                          {saving.duration?.interest_rate || 0}% P.A. • {saving.duration?.lock_period_days === 0 ? 'Flexible' : `${saving.duration?.lock_period_days || 0} days`}
                        </p>
                      </div>
                    </div>
                    {saving.status === 'active' && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>
                    )}
                    {saving.status === 'withdrawn' && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">Withdrawn</span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center py-3 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-text-muted">Deposited</p>
                      <p className="font-semibold text-text">{formatCurrency(saving.amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">Interest</p>
                      <p className="font-semibold text-green-600">+{formatCurrency(saving.calculated_interest)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">Total</p>
                      <p className="font-bold text-primary-600">{formatCurrency(saving.total_balance)}</p>
                    </div>
                  </div>
                  {saving.status === 'active' && (
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                      {!saving.can_withdraw && saving.maturity_date && (
                        <p className="text-xs text-text-muted flex items-center gap-1">
                          <Clock size={12} /> Matures {new Date(saving.maturity_date).toLocaleDateString()}
                        </p>
                      )}
                      {saving.can_withdraw && <span />}
                      
                      {/* Show withdraw button based on conditions */}
                      {saving.can_withdraw ? (
                        <button 
                          onClick={() => handleWithdraw(saving.id)}
                          className="btn btn-sm btn-primary"
                        >
                          Withdraw
                        </button>
                      ) : saving.savings_plan?.allow_early_withdrawal !== false ? (
                        <button 
                          onClick={() => handleWithdraw(saving.id)}
                          className="btn btn-sm btn-outline"
                        >
                          Withdraw Early
                        </button>
                      ) : (
                        <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 flex items-center gap-1">
                          <Lock size={12} /> Locked
                        </span>
                      )}
                    </div>
                  )}
                  {saving.status === 'active' && !saving.can_withdraw && saving.savings_plan?.allow_early_withdrawal !== false && saving.withdrawal_penalty > 0 && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-orange-600 bg-orange-50 rounded p-2">
                      <AlertCircle size={14} />
                      Early withdrawal penalty: {formatCurrency(saving.withdrawal_penalty)}
                    </div>
                  )}
                  {saving.status === 'active' && !saving.can_withdraw && saving.savings_plan?.allow_early_withdrawal === false && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded p-2">
                      <Lock size={14} />
                      Early withdrawal not allowed. Wait until maturity.
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </CustomerLayout>
  )
}
