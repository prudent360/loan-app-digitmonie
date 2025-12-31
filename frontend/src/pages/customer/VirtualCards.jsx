import { useState, useEffect } from 'react'
import CustomerLayout from '../../components/layouts/CustomerLayout'
import { virtualCardAPI } from '../../services/api'
import { CreditCard, Plus, DollarSign, Lock, Unlock, Trash2, Loader2, Eye, EyeOff, ArrowDownLeft, ArrowUpRight, X } from 'lucide-react'

export default function VirtualCards() {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showFundModal, setShowFundModal] = useState(false)
  const [selectedCard, setSelectedCard] = useState(null)
  const [showCardDetails, setShowCardDetails] = useState({})
  const [actionLoading, setActionLoading] = useState(false)

  // Form state
  const [createForm, setCreateForm] = useState({
    currency: 'USD',
    amount: 10,
    billing_address: '',
    billing_city: '',
    billing_state: '',
    billing_postal_code: '',
    date_of_birth: '',
    title: 'Mr',
    gender: 'M',
  })
  const [fundAmount, setFundAmount] = useState('')

  useEffect(() => {
    loadCards()
  }, [])

  const loadCards = async () => {
    try {
      const res = await virtualCardAPI.getAll()
      setCards(res.data.cards || [])
    } catch (err) {
      console.error('Failed to load cards:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCard = async (e) => {
    e.preventDefault()
    setActionLoading(true)
    try {
      const res = await virtualCardAPI.create(createForm)
      if (res.data.success) {
        setCards([res.data.card, ...cards])
        setShowCreateModal(false)
        setCreateForm({
          currency: 'USD',
          amount: 10,
          billing_address: '',
          billing_city: '',
          billing_state: '',
          billing_postal_code: '',
          date_of_birth: '',
          title: 'Mr',
          gender: 'M',
        })
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create card')
    } finally {
      setActionLoading(false)
    }
  }

  const handleFundCard = async (e) => {
    e.preventDefault()
    if (!selectedCard || !fundAmount) return
    setActionLoading(true)
    try {
      const res = await virtualCardAPI.fund(selectedCard.id, parseFloat(fundAmount))
      if (res.data.success) {
        setCards(cards.map(c => c.id === selectedCard.id ? res.data.card : c))
        setShowFundModal(false)
        setFundAmount('')
        setSelectedCard(null)
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to fund card')
    } finally {
      setActionLoading(false)
    }
  }

  const handleBlockToggle = async (card) => {
    const action = card.status === 'active' ? 'block' : 'unblock'
    if (!confirm(`Are you sure you want to ${action} this card?`)) return
    try {
      const res = await virtualCardAPI.toggleBlock(card.id, action)
      if (res.data.success) {
        setCards(cards.map(c => c.id === card.id ? res.data.card : c))
      }
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${action} card`)
    }
  }

  const handleTerminate = async (card) => {
    if (!confirm('Are you sure you want to permanently terminate this card? This action cannot be undone.')) return
    try {
      const res = await virtualCardAPI.terminate(card.id)
      if (res.data.success) {
        setCards(cards.map(c => c.id === card.id ? { ...c, status: 'terminated' } : c))
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to terminate card')
    }
  }

  const toggleCardDetails = (cardId) => {
    setShowCardDetails(prev => ({ ...prev, [cardId]: !prev[cardId] }))
  }

  const getCurrencySymbol = (currency) => {
    const symbols = { USD: '$', NGN: '₦', GBP: '£', EUR: '€' }
    return symbols[currency] || currency
  }

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-700',
      blocked: 'bg-red-100 text-red-700',
      terminated: 'bg-gray-100 text-gray-500',
    }
    return colors[status] || 'bg-gray-100 text-gray-600'
  }

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-primary-600" size={32} />
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
            <h1 className="text-2xl font-semibold text-text">Virtual Cards</h1>
            <p className="text-text-muted">Create and manage your virtual cards for online payments</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            <Plus size={18} /> Create Card
          </button>
        </div>

        {/* Cards Grid */}
        {cards.length === 0 ? (
          <div className="card text-center py-16">
            <CreditCard size={48} className="text-text-muted mx-auto mb-4 opacity-40" />
            <h3 className="text-lg font-medium text-text mb-2">No Virtual Cards</h3>
            <p className="text-text-muted mb-4">Create your first virtual card to start shopping online</p>
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
              <Plus size={18} /> Create Card
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card) => (
              <div key={card.id} className="card p-0 overflow-hidden">
                {/* Card Visual */}
                <div className={`p-6 text-white relative overflow-hidden ${card.status === 'terminated' ? 'bg-gray-400' : 'bg-gradient-to-br from-primary-600 via-primary-700 to-purple-700'}`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                  
                  <div className="flex justify-between items-start mb-8">
                    <div className="w-10 h-7 bg-gradient-to-br from-yellow-200 to-yellow-400 rounded"></div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(card.status)}`}>
                      {card.status}
                    </span>
                  </div>
                  
                  <div className="mb-6">
                    <p className="font-mono text-lg tracking-widest">
                      {showCardDetails[card.id] 
                        ? `•••• •••• •••• ${card.card_pan || '****'}`
                        : '•••• •••• •••• ••••'
                      }
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-white/60">Balance</p>
                      <p className="text-xl font-bold">
                        {showCardDetails[card.id] 
                          ? `${getCurrencySymbol(card.currency)}${Number(card.balance).toLocaleString()}`
                          : '••••••'
                        }
                      </p>
                    </div>
                    <button 
                      onClick={() => toggleCardDetails(card.id)}
                      className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                    >
                      {showCardDetails[card.id] ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-4 space-y-3">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setSelectedCard(card); setShowFundModal(true); }}
                      disabled={card.status !== 'active'}
                      className="flex-1 btn btn-primary btn-sm disabled:opacity-50"
                    >
                      <ArrowDownLeft size={16} /> Fund
                    </button>
                    <button 
                      onClick={() => handleBlockToggle(card)}
                      disabled={card.status === 'terminated'}
                      className="btn btn-outline btn-sm disabled:opacity-50"
                    >
                      {card.status === 'blocked' ? <Unlock size={16} /> : <Lock size={16} />}
                    </button>
                    <button 
                      onClick={() => handleTerminate(card)}
                      disabled={card.status === 'terminated'}
                      className="btn btn-danger btn-sm disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="text-xs text-text-muted text-center">
                    Created {new Date(card.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Card Modal */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Create Virtual Card</h3>
                <button onClick={() => setShowCreateModal(false)}><X size={20} /></button>
              </div>
              <form onSubmit={handleCreateCard}>
                <div className="modal-body space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Currency</label>
                      <select 
                        className="form-input form-select"
                        value={createForm.currency}
                        onChange={e => setCreateForm({...createForm, currency: e.target.value})}
                      >
                        <option value="USD">USD ($)</option>
                        <option value="NGN">NGN (₦)</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Initial Amount</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        min="5"
                        value={createForm.amount}
                        onChange={e => setCreateForm({...createForm, amount: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="form-label">Date of Birth</label>
                    <input 
                      type="date" 
                      className="form-input"
                      value={createForm.date_of_birth}
                      onChange={e => setCreateForm({...createForm, date_of_birth: e.target.value})}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Title</label>
                      <select 
                        className="form-input form-select"
                        value={createForm.title}
                        onChange={e => setCreateForm({...createForm, title: e.target.value})}
                      >
                        <option value="Mr">Mr</option>
                        <option value="Mrs">Mrs</option>
                        <option value="Miss">Miss</option>
                        <option value="Ms">Ms</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Gender</label>
                      <select 
                        className="form-input form-select"
                        value={createForm.gender}
                        onChange={e => setCreateForm({...createForm, gender: e.target.value})}
                      >
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Billing Address</label>
                    <input 
                      type="text" 
                      className="form-input"
                      placeholder="Street address"
                      value={createForm.billing_address}
                      onChange={e => setCreateForm({...createForm, billing_address: e.target.value})}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">City</label>
                      <input 
                        type="text" 
                        className="form-input"
                        value={createForm.billing_city}
                        onChange={e => setCreateForm({...createForm, billing_city: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label">State</label>
                      <input 
                        type="text" 
                        className="form-input"
                        value={createForm.billing_state}
                        onChange={e => setCreateForm({...createForm, billing_state: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Postal Code</label>
                    <input 
                      type="text" 
                      className="form-input"
                      value={createForm.billing_postal_code}
                      onChange={e => setCreateForm({...createForm, billing_postal_code: e.target.value})}
                      required
                    />
                  </div>

                  <div className="bg-muted p-3 rounded-lg text-sm text-text-muted">
                    <p>💡 A card creation fee of approximately $3 will be charged.</p>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setShowCreateModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                    {actionLoading ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                    Create Card
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Fund Card Modal */}
        {showFundModal && selectedCard && (
          <div className="modal-overlay" onClick={() => setShowFundModal(false)}>
            <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Fund Card</h3>
                <button onClick={() => setShowFundModal(false)}><X size={20} /></button>
              </div>
              <form onSubmit={handleFundCard}>
                <div className="modal-body space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm text-text-muted">Card ending in</p>
                    <p className="text-lg font-medium text-text">•••• {selectedCard.card_pan || '****'}</p>
                    <p className="text-sm text-text-muted mt-2">Current Balance: {getCurrencySymbol(selectedCard.currency)}{Number(selectedCard.balance).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="form-label">Amount to Fund (₦)</label>
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
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setShowFundModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                    {actionLoading ? <Loader2 className="animate-spin" size={18} /> : <DollarSign size={18} />}
                    Fund Card
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
