import { useState, useEffect } from 'react'
import CustomerLayout from '../../components/layouts/CustomerLayout'
import { PiggyBank, Plus, TrendingUp, Lock, Unlock, Loader2, ArrowRight, Clock, Wallet, AlertCircle } from 'lucide-react'
import api from '../../services/api'

export default function Savings() {
  const [plans, setPlans] = useState([])
  const [mySavings, setMySavings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('plans') // 'plans' or 'my-savings'

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [plansRes, savingsRes] = await Promise.all([
        api.get('/customer/savings/plans'),
        api.get('/customer/savings')
      ])
      setPlans(plansRes.data.plans || [])
      setMySavings(savingsRes.data.savings || [])
    } catch (err) {
      console.error('Failed to load savings:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => `₦${Number(amount || 0).toLocaleString()}`

  const openSubscribeModal = (plan) => {
    setSelectedPlan(plan)
    setAmount('')
    setShowModal(true)
  }

  const handleSubscribe = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/customer/savings', {
        savings_plan_id: selectedPlan.id,
        amount: Number(amount)
      })
      setShowModal(false)
      setActiveTab('my-savings')
      loadData()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create savings')
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

  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text">Savings</h1>
            <p className="text-text-muted">Grow your money with competitive interest rates</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-muted">Total Balance</p>
            <p className="text-xl font-bold text-primary-600">{formatCurrency(totalSaved)}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'plans' 
                ? 'border-primary-600 text-primary-600' 
                : 'border-transparent text-text-muted hover:text-text'
            }`}
          >
            Available Plans
          </button>
          <button
            onClick={() => setActiveTab('my-savings')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'my-savings' 
                ? 'border-primary-600 text-primary-600' 
                : 'border-transparent text-text-muted hover:text-text'
            }`}
          >
            My Savings ({mySavings.filter(s => s.status === 'active').length})
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-primary-600" size={32} />
          </div>
        ) : activeTab === 'plans' ? (
          /* Available Plans */
          plans.length === 0 ? (
            <div className="card text-center py-12">
              <PiggyBank size={48} className="mx-auto text-text-muted mb-4" />
              <h3 className="text-lg font-semibold text-text mb-2">No savings plans available</h3>
              <p className="text-text-muted">Check back later for new savings options</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <div key={plan.id} className="card hover:shadow-lg transition-shadow border-2 border-transparent hover:border-primary-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center">
                      {plan.lock_period_days === 0 ? <Unlock size={24} /> : <Lock size={24} />}
                    </div>
                    <span className="text-2xl font-bold text-primary-600">{plan.interest_rate}%</span>
                  </div>
                  <h3 className="font-semibold text-text text-lg mb-1">{plan.name}</h3>
                  {plan.description && (
                    <p className="text-sm text-text-muted mb-3">{plan.description}</p>
                  )}
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Lock Period</span>
                      <span className="font-medium text-text">
                        {plan.lock_period_days === 0 ? 'Flexible (No Lock)' : `${plan.lock_period_days} days`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Min Deposit</span>
                      <span className="font-medium text-text">{formatCurrency(plan.min_amount)}</span>
                    </div>
                    {plan.early_withdrawal_penalty > 0 && (
                      <div className="flex justify-between">
                        <span className="text-text-muted">Early Penalty</span>
                        <span className="font-medium text-orange-600">{plan.early_withdrawal_penalty}%</span>
                      </div>
                    )}
                  </div>
                  <button onClick={() => openSubscribeModal(plan)} className="btn btn-primary w-full">
                    Start Saving <ArrowRight size={16} />
                  </button>
                </div>
              ))}
            </div>
          )
        ) : (
          /* My Savings */
          mySavings.length === 0 ? (
            <div className="card text-center py-12">
              <Wallet size={48} className="mx-auto text-text-muted mb-4" />
              <h3 className="text-lg font-semibold text-text mb-2">No savings yet</h3>
              <p className="text-text-muted mb-4">Choose a plan and start growing your money</p>
              <button onClick={() => setActiveTab('plans')} className="btn btn-primary">
                View Plans
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {mySavings.map((saving) => (
                <div key={saving.id} className={`card ${saving.status !== 'active' ? 'opacity-60' : ''}`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        saving.status === 'active' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <PiggyBank size={24} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-text">{saving.savings_plan?.name}</h3>
                        <p className="text-xs text-text-muted">
                          {saving.savings_plan?.interest_rate}% p.a. • 
                          Created {new Date(saving.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="text-center">
                        <p className="text-xs text-text-muted">Deposited</p>
                        <p className="font-semibold text-text">{formatCurrency(saving.amount)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-text-muted">Interest</p>
                        <p className="font-semibold text-green-600">+{formatCurrency(saving.calculated_interest)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-text-muted">Total</p>
                        <p className="font-bold text-primary-600">{formatCurrency(saving.total_balance)}</p>
                      </div>
                      {saving.status === 'active' && (
                        <button 
                          onClick={() => handleWithdraw(saving.id)}
                          className={`btn btn-sm ${saving.can_withdraw ? 'btn-primary' : 'btn-outline'}`}
                        >
                          {saving.can_withdraw ? 'Withdraw' : (
                            <>
                              <Clock size={14} />
                              {saving.maturity_date && `Until ${new Date(saving.maturity_date).toLocaleDateString()}`}
                            </>
                          )}
                        </button>
                      )}
                      {saving.status !== 'active' && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          saving.status === 'withdrawn' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {saving.status}
                        </span>
                      )}
                    </div>
                  </div>
                  {saving.status === 'active' && !saving.can_withdraw && saving.withdrawal_penalty > 0 && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-orange-600 bg-orange-50 rounded p-2">
                      <AlertCircle size={14} />
                      Early withdrawal penalty: {formatCurrency(saving.withdrawal_penalty)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {/* Subscribe Modal */}
        {showModal && selectedPlan && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-2xl w-full max-w-md p-6 shadow-xl">
              <h2 className="text-xl font-bold text-text mb-2">Subscribe to {selectedPlan.name}</h2>
              <p className="text-text-muted text-sm mb-4">
                {selectedPlan.interest_rate}% annual returns • 
                {selectedPlan.lock_period_days === 0 ? ' Flexible withdrawal' : ` ${selectedPlan.lock_period_days} day lock`}
              </p>

              <form onSubmit={handleSubscribe} className="space-y-4">
                <div>
                  <label className="form-label">Amount to Save (₦)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder={`Min: ${formatCurrency(selectedPlan.min_amount)}`}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min={selectedPlan.min_amount}
                    max={selectedPlan.max_amount || undefined}
                    required
                  />
                  <p className="text-xs text-text-muted mt-1">
                    Amount will be deducted from your wallet
                  </p>
                </div>

                {amount && Number(amount) >= selectedPlan.min_amount && (
                  <div className="bg-primary-50 border border-primary-100 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-primary-700 font-medium mb-2">
                      <TrendingUp size={16} />
                      Projected Returns (1 year)
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-text-muted">Your Deposit</p>
                        <p className="font-semibold">{formatCurrency(amount)}</p>
                      </div>
                      <div>
                        <p className="text-text-muted">Interest (1yr)</p>
                        <p className="font-semibold text-green-600">
                          +{formatCurrency(Number(amount) * (selectedPlan.interest_rate / 100))}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline flex-1">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="btn btn-primary flex-1">
                    {submitting ? <Loader2 className="animate-spin" size={18} /> : 'Start Saving'}
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
