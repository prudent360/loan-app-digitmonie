import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layouts/AdminLayout'
import { PiggyBank, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Loader2, Users, TrendingUp, X, Clock } from 'lucide-react'
import api from '../../services/api'

export default function SavingsPlans() {
  const [plans, setPlans] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    min_amount: '',
    max_amount: '',
    allow_early_withdrawal: true,
    durations: [{ lock_period_days: 30, interest_rate: '', early_withdrawal_penalty: 0 }]
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [plansRes, statsRes] = await Promise.all([
        api.get('/admin/savings'),
        api.get('/admin/savings/stats')
      ])
      setPlans(plansRes.data.plans || [])
      setStats(statsRes.data || {})
    } catch (err) {
      console.error('Failed to load savings data:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => `₦${Number(amount || 0).toLocaleString()}`

  const openCreateModal = () => {
    setEditingPlan(null)
    setForm({
      name: '',
      description: '',
      min_amount: '',
      max_amount: '',
      allow_early_withdrawal: true,
      durations: [{ lock_period_days: 30, interest_rate: '', early_withdrawal_penalty: 0 }]
    })
    setShowModal(true)
  }

  const openEditModal = (plan) => {
    setEditingPlan(plan)
    setForm({
      name: plan.name,
      description: plan.description || '',
      min_amount: plan.min_amount,
      max_amount: plan.max_amount || '',
      allow_early_withdrawal: plan.allow_early_withdrawal !== false,
      durations: plan.durations?.length > 0 
        ? plan.durations.map(d => ({
            id: d.id,
            lock_period_days: d.lock_period_days,
            interest_rate: d.interest_rate,
            early_withdrawal_penalty: d.early_withdrawal_penalty
          }))
        : [{ lock_period_days: 30, interest_rate: '', early_withdrawal_penalty: 0 }]
    })
    setShowModal(true)
  }

  const addDuration = () => {
    setForm({
      ...form,
      durations: [...form.durations, { lock_period_days: 30, interest_rate: '', early_withdrawal_penalty: 0 }]
    })
  }

  const removeDuration = (index) => {
    if (form.durations.length <= 1) return
    setForm({
      ...form,
      durations: form.durations.filter((_, i) => i !== index)
    })
  }

  const updateDuration = (index, field, value) => {
    const newDurations = [...form.durations]
    newDurations[index] = { ...newDurations[index], [field]: value }
    setForm({ ...form, durations: newDurations })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate durations
    const invalidDuration = form.durations.find(d => d.interest_rate === '' || d.lock_period_days === '')
    if (invalidDuration) {
      alert('Please fill in both Lock Period and Interest Rate for all duration options.')
      return
    }

    setSubmitting(true)
    try {
      if (editingPlan) {
        await api.put(`/admin/savings/${editingPlan.id}`, form)
      } else {
        await api.post('/admin/savings', form)
      }
      setShowModal(false)
      loadData()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save plan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this plan?')) return
    try {
      await api.delete(`/admin/savings/${id}`)
      loadData()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete plan')
    }
  }

  const handleToggle = async (id) => {
    try {
      await api.post(`/admin/savings/${id}/toggle`)
      loadData()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle status')
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text">Savings Plans</h1>
            <p className="text-text-muted">Create and manage savings plans for customers</p>
          </div>
          <button onClick={openCreateModal} className="btn btn-primary">
            <Plus size={18} /> Create Plan
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
                <PiggyBank size={20} />
              </div>
              <div>
                <p className="text-xs text-text-muted">Total Plans</p>
                <p className="text-lg font-semibold text-text">{stats.total_plans || 0}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                <ToggleRight size={20} />
              </div>
              <div>
                <p className="text-xs text-text-muted">Active Plans</p>
                <p className="text-lg font-semibold text-green-600">{stats.active_plans || 0}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <Users size={20} />
              </div>
              <div>
                <p className="text-xs text-text-muted">Subscriptions</p>
                <p className="text-lg font-semibold text-text">{stats.total_subscriptions || 0}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-xs text-text-muted">Total Saved</p>
                <p className="text-lg font-semibold text-text">{formatCurrency(stats.total_saved)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Plans List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-primary-600" size={32} />
          </div>
        ) : plans.length === 0 ? (
          <div className="card text-center py-12">
            <PiggyBank size={48} className="mx-auto text-text-muted mb-4" />
            <h3 className="text-lg font-semibold text-text mb-2">No savings plans yet</h3>
            <p className="text-text-muted mb-4">Create your first savings plan for customers</p>
            <button onClick={openCreateModal} className="btn btn-primary">
              Create Plan
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div key={plan.id} className={`card ${plan.status === 'inactive' ? 'opacity-60' : ''}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-text">{plan.name}</h3>
                    <p className="text-xs text-text-muted">{plan.user_savings_count || 0} subscriptions</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    plan.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {plan.status}
                  </span>
                </div>
                
                {plan.description && (
                  <p className="text-sm text-text-muted mb-3">{plan.description}</p>
                )}

                {/* Duration chips */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {plan.durations?.map((d) => (
                    <span key={d.id} className="px-2 py-1 bg-primary-50 text-primary-700 rounded text-xs font-medium">
                      {d.lock_period_days === 0 ? 'Flex' : `${d.lock_period_days}d`} @ {d.interest_rate}%
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div className="bg-muted/50 rounded p-2">
                    <p className="text-text-muted text-xs">Min Deposit</p>
                    <p className="font-semibold text-text">{formatCurrency(plan.min_amount)}</p>
                  </div>
                  <div className="bg-muted/50 rounded p-2">
                    <p className="text-text-muted text-xs">Early Withdrawal</p>
                    <p className={`font-semibold ${plan.allow_early_withdrawal !== false ? 'text-green-600' : 'text-red-600'}`}>
                      {plan.allow_early_withdrawal !== false ? 'Allowed' : 'Not Allowed'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => handleToggle(plan.id)} className="btn btn-outline btn-sm flex-1">
                    {plan.status === 'active' ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
                    {plan.status === 'active' ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => openEditModal(plan)} className="btn btn-outline btn-sm">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(plan.id)} className="btn btn-outline btn-sm text-red-500 hover:bg-red-50">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-2xl w-full max-w-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-text">
                  {editingPlan ? 'Edit Plan' : 'Create Savings Plan'}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-text-muted hover:text-text">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="form-label">Plan Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., Digitlock, FlexSave"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    placeholder="Brief description of this plan"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Min Deposit (₦) *</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g., 1000"
                      value={form.min_amount}
                      onChange={(e) => setForm({ ...form, min_amount: e.target.value })}
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Max Deposit (₦)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="Leave empty for no limit"
                      value={form.max_amount}
                      onChange={(e) => setForm({ ...form, max_amount: e.target.value })}
                      min="0"
                    />
                  </div>
                </div>

                {/* Durations Section */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center mb-3">
                    <label className="form-label mb-0">Duration Options *</label>
                    <button type="button" onClick={addDuration} className="btn btn-outline btn-sm">
                      <Plus size={14} /> Add Duration
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {form.durations.map((duration, index) => (
                      <div key={index} className="bg-muted/30 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock size={14} className="text-text-muted" />
                          <span className="text-sm font-medium text-text">Duration {index + 1}</span>
                          {form.durations.length > 1 && (
                            <button 
                              type="button" 
                              onClick={() => removeDuration(index)}
                              className="ml-auto text-red-500 hover:text-red-700"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-xs text-text-muted">Lock Period (days)</label>
                            <input
                              type="number"
                              className="form-input mt-1"
                              placeholder="0 = flexible"
                              value={duration.lock_period_days}
                              onChange={(e) => updateDuration(index, 'lock_period_days', Number(e.target.value))}
                              min="0"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-xs text-text-muted">Interest Rate (% p.a.) *</label>
                            <input
                              type="number"
                              className="form-input mt-1"
                              placeholder="e.g., 17"
                              value={duration.interest_rate}
                              onChange={(e) => updateDuration(index, 'interest_rate', e.target.value)}
                              min="0"
                              max="100"
                              step="0.1"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-xs text-text-muted">Penalty (%)</label>
                            <input
                              type="number"
                              className="form-input mt-1"
                              placeholder="e.g., 2"
                              value={duration.early_withdrawal_penalty}
                              onChange={(e) => updateDuration(index, 'early_withdrawal_penalty', Number(e.target.value))}
                              min="0"
                              max="100"
                              step="0.1"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-muted/30 rounded-lg p-4">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="font-medium text-text">Allow Early Withdrawal</p>
                      <p className="text-xs text-text-muted">If disabled, users cannot withdraw until maturity</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, allow_early_withdrawal: !form.allow_early_withdrawal })}
                      className={`w-12 h-6 rounded-full transition-colors ${form.allow_early_withdrawal ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${form.allow_early_withdrawal ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  </label>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline flex-1">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="btn btn-primary flex-1">
                    {submitting ? <Loader2 className="animate-spin" size={18} /> : (editingPlan ? 'Update Plan' : 'Create Plan')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
