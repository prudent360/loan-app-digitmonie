import { useState, useEffect } from 'react'
import CustomerLayout from '../../components/layouts/CustomerLayout'
import { billPaymentAPI, receiptAPI } from '../../services/api'
import { Phone, Wifi, Zap, Tv, Globe, Loader2, CheckCircle2, X, ArrowRight, History, Search, Download } from 'lucide-react'

const CATEGORIES = [
  { id: 'AIRTIME', label: 'Airtime', icon: Phone, color: 'bg-green-100 text-green-600' },
  { id: 'DATA_BUNDLE', label: 'Data', icon: Wifi, color: 'bg-blue-100 text-blue-600' },
  { id: 'POWER', label: 'Electricity', icon: Zap, color: 'bg-yellow-100 text-yellow-600' },
  { id: 'CABLE', label: 'Cable TV', icon: Tv, color: 'bg-purple-100 text-purple-600' },
  { id: 'INTERNET', label: 'Internet', icon: Globe, color: 'bg-cyan-100 text-cyan-600' },
]

// Nigerian Telecom Providers with Flutterwave biller codes
const NIGERIAN_TELECOMS = {
  AIRTIME: [
    { biller_code: 'BIL099', name: 'MTN Nigeria', biller_name: 'MTN' },
    { biller_code: 'BIL100', name: 'Airtel Nigeria', biller_name: 'AIRTEL' },
    { biller_code: 'BIL102', name: 'Glo Nigeria', biller_name: 'GLO' },
    { biller_code: 'BIL103', name: '9mobile Nigeria', biller_name: '9MOBILE' },
  ],
  DATA_BUNDLE: [
    { biller_code: 'BIL108', name: 'MTN Data', biller_name: 'MTN' },
    { biller_code: 'BIL110', name: 'Airtel Data', biller_name: 'AIRTEL' },
    { biller_code: 'BIL109', name: 'Glo Data', biller_name: 'GLO' },
    { biller_code: 'BIL111', name: '9mobile Data', biller_name: '9MOBILE' },
  ],
}

export default function BillPayments() {
  const [activeTab, setActiveTab] = useState('pay') // 'pay' or 'history'
  const [step, setStep] = useState(1) // 1: category, 2: biller, 3: details, 4: confirm, 5: success
  const [loading, setLoading] = useState(false)
  
  // Selection state
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [billers, setBillers] = useState([])
  const [selectedBiller, setSelectedBiller] = useState(null)
  const [items, setItems] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  
  // Form state
  const [customerId, setCustomerId] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [amount, setAmount] = useState('')
  const [validating, setValidating] = useState(false)
  const [validated, setValidated] = useState(false)
  
  // Result state
  const [transaction, setTransaction] = useState(null)
  
  // History state
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory()
    }
  }, [activeTab])

  const loadHistory = async () => {
    setHistoryLoading(true)
    try {
      const res = await billPaymentAPI.getHistory()
      setHistory(res.data.transactions?.data || res.data.transactions || [])
    } catch (err) {
      console.error('Failed to load history:', err)
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleCategorySelect = async (category) => {
    setSelectedCategory(category)
    setLoading(true)
    
    try {
      // For Airtime and Data, use our hardcoded Nigerian telecoms
      if (category.id === 'AIRTIME' || category.id === 'DATA_BUNDLE') {
        setBillers(NIGERIAN_TELECOMS[category.id] || [])
        setStep(2)
      } else {
        // For other categories, fetch from API
        const res = await billPaymentAPI.getBillers(category.id)
        setBillers(res.data.billers || [])
        setStep(2)
      }
    } catch (err) {
      console.error('Failed to load billers:', err)
      alert('Failed to load billers. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBillerSelect = async (biller) => {
    setSelectedBiller(biller)
    setLoading(true)
    try {
      const res = await billPaymentAPI.getItems(biller.biller_code)
      setItems(res.data.items || [])
      setStep(3)
    } catch (err) {
      console.error('Failed to load items:', err)
      // For airtime, we don't need items
      setItems([])
      setStep(3)
    } finally {
      setLoading(false)
    }
  }

  const handleValidate = async () => {
    if (!customerId) return
    setValidating(true)
    try {
      const res = await billPaymentAPI.validateCustomer({
        item_code: selectedItem?.item_code || selectedBiller?.biller_code,
        biller_code: selectedBiller.biller_code,
        customer_id: customerId,
      })
      if (res.data.success) {
        setCustomerName(res.data.customer?.name || res.data.customer?.Customer_Name || '')
        setValidated(true)
      } else {
        alert(res.data.message || 'Validation failed')
      }
    } catch (err) {
      // For airtime, validation is optional
      if (selectedCategory?.id === 'AIRTIME' || selectedCategory?.id === 'DATA_BUNDLE') {
        setValidated(true)
      } else {
        alert(err.response?.data?.message || 'Failed to validate customer')
      }
    } finally {
      setValidating(false)
    }
  }

  const handleProceed = () => {
    setStep(4)
  }

  const handlePayment = async () => {
    setLoading(true)
    try {
      const paymentData = {
        category: selectedCategory.id,
        biller_code: selectedBiller.biller_code,
        biller_name: selectedBiller.name || selectedBiller.biller_name,
        item_code: selectedItem?.item_code,
        item_name: selectedItem?.name || selectedItem?.biller_name,
        customer_id: customerId,
        customer_name: customerName,
        amount: parseFloat(amount || selectedItem?.amount || 0),
        type: selectedCategory.id,
      }
      
      const res = await billPaymentAPI.pay(paymentData)
      if (res.data.success) {
        setTransaction(res.data.transaction)
        setStep(5)
      } else {
        alert(res.data.message || 'Payment failed')
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setStep(1)
    setSelectedCategory(null)
    setSelectedBiller(null)
    setSelectedItem(null)
    setBillers([])
    setItems([])
    setCustomerId('')
    setCustomerName('')
    setAmount('')
    setValidated(false)
    setTransaction(null)
  }

  const getStatusBadge = (status) => {
    const styles = {
      successful: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      failed: 'bg-red-100 text-red-700',
    }
    return styles[status] || 'bg-gray-100 text-gray-600'
  }

  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-text">Bill Payments</h1>
            <p className="text-text-muted">Pay for airtime, data, electricity, and more</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => { setActiveTab('pay'); resetForm(); }}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'pay' ? 'bg-primary-600 text-white' : 'bg-muted text-text-muted hover:text-text'}`}
            >
              Pay Bills
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'history' ? 'bg-primary-600 text-white' : 'bg-muted text-text-muted hover:text-text'}`}
            >
              <History size={18} className="inline mr-1" /> History
            </button>
          </div>
        </div>

        {activeTab === 'pay' ? (
          <div className="card">
            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-8">
              {['Category', 'Provider', 'Details', 'Confirm', 'Done'].map((label, idx) => (
                <div key={label} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step > idx + 1 ? 'bg-primary-600 text-white' : 
                    step === idx + 1 ? 'bg-primary-100 text-primary-600 border-2 border-primary-600' : 
                    'bg-muted text-text-muted'
                  }`}>
                    {step > idx + 1 ? <CheckCircle2 size={16} /> : idx + 1}
                  </div>
                  <span className={`hidden sm:block ml-2 text-sm ${step >= idx + 1 ? 'text-text' : 'text-text-muted'}`}>{label}</span>
                  {idx < 4 && <div className={`w-8 sm:w-16 h-0.5 mx-2 ${step > idx + 1 ? 'bg-primary-600' : 'bg-muted'}`}></div>}
                </div>
              ))}
            </div>

            {loading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="animate-spin text-primary-600" size={32} />
              </div>
            )}

            {/* Step 1: Category Selection */}
            {!loading && step === 1 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategorySelect(cat)}
                      className="p-6 rounded-xl border border-border hover:border-primary-300 hover:shadow-lg transition-all text-center group"
                    >
                      <div className={`w-14 h-14 rounded-xl ${cat.color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                        <Icon size={28} />
                      </div>
                      <p className="font-medium text-text">{cat.label}</p>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Step 2: Biller Selection */}
            {!loading && step === 2 && (
              <div>
                <button onClick={() => setStep(1)} className="text-primary-600 text-sm mb-4 hover:underline">
                  ← Back to categories
                </button>
                <h3 className="text-lg font-medium text-text mb-4">Select {selectedCategory?.label} Provider</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {billers.map((biller) => (
                    <button
                      key={biller.biller_code}
                      onClick={() => handleBillerSelect(biller)}
                      className="p-4 rounded-lg border border-border hover:border-primary-300 hover:shadow-md transition-all text-left"
                    >
                      <p className="font-medium text-text">{biller.name || biller.biller_name}</p>
                      <p className="text-xs text-text-muted mt-1">{biller.biller_code}</p>
                    </button>
                  ))}
                </div>
                {billers.length === 0 && (
                  <p className="text-center text-text-muted py-8">No providers found for this category</p>
                )}
              </div>
            )}

            {/* Step 3: Details */}
            {!loading && step === 3 && (
              <div className="max-w-md mx-auto">
                <button onClick={() => setStep(2)} className="text-primary-600 text-sm mb-4 hover:underline">
                  ← Back to providers
                </button>
                <h3 className="text-lg font-medium text-text mb-4">Enter Details</h3>
                
                <div className="space-y-4">
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-xs text-text-muted">Provider</p>
                    <p className="font-medium text-text">{selectedBiller?.name || selectedBiller?.biller_name}</p>
                  </div>

                  {items.length > 0 && (
                    <div>
                      <label className="form-label">Select Package</label>
                      <select 
                        className="form-input form-select"
                        value={selectedItem?.item_code || ''}
                        onChange={(e) => {
                          const item = items.find(i => i.item_code === e.target.value)
                          setSelectedItem(item)
                          if (item?.amount) setAmount(item.amount)
                        }}
                      >
                        <option value="">Select a package</option>
                        {items.map((item) => (
                          <option key={item.item_code} value={item.item_code}>
                            {item.name || item.biller_name} - ₦{Number(item.amount).toLocaleString()}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="form-label">
                      {selectedCategory?.id === 'AIRTIME' || selectedCategory?.id === 'DATA_BUNDLE' 
                        ? 'Phone Number' 
                        : selectedCategory?.id === 'POWER' 
                        ? 'Meter Number'
                        : selectedCategory?.id === 'CABLE'
                        ? 'Smart Card / IUC Number'
                        : 'Customer ID'
                      }
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        className="form-input flex-1"
                        placeholder="Enter number"
                        value={customerId}
                        onChange={(e) => { setCustomerId(e.target.value); setValidated(false); }}
                      />
                      {(selectedCategory?.id === 'POWER' || selectedCategory?.id === 'CABLE') && (
                        <button 
                          onClick={handleValidate}
                          disabled={validating || !customerId}
                          className="btn btn-outline"
                        >
                          {validating ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                          Verify
                        </button>
                      )}
                    </div>
                    {validated && customerName && (
                      <p className="text-sm text-green-600 mt-2">✓ {customerName}</p>
                    )}
                  </div>

                  {(selectedCategory?.id === 'AIRTIME' || !selectedItem?.amount) && (
                    <div>
                      <label className="form-label">Amount (₦)</label>
                      <input 
                        type="number"
                        className="form-input"
                        placeholder="Enter amount"
                        min="50"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>
                  )}

                  <button 
                    onClick={handleProceed}
                    disabled={!customerId || (!amount && !selectedItem?.amount)}
                    className="btn btn-primary w-full"
                  >
                    Continue <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {!loading && step === 4 && (
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-medium text-text mb-4 text-center">Confirm Payment</h3>
                
                <div className="bg-muted rounded-xl p-6 space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Category</span>
                    <span className="text-text font-medium">{selectedCategory?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Provider</span>
                    <span className="text-text font-medium">{selectedBiller?.name || selectedBiller?.biller_name}</span>
                  </div>
                  {selectedItem && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">Package</span>
                      <span className="text-text font-medium">{selectedItem.name || selectedItem.biller_name}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-text-muted">Recipient</span>
                    <span className="text-text font-medium">{customerId}</span>
                  </div>
                  {customerName && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">Name</span>
                      <span className="text-text font-medium">{customerName}</span>
                    </div>
                  )}
                  <hr className="border-border" />
                  <div className="flex justify-between text-lg">
                    <span className="text-text font-medium">Total</span>
                    <span className="text-primary-600 font-bold">₦{Number(amount || selectedItem?.amount || 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(3)} className="btn btn-outline flex-1">Back</button>
                  <button onClick={handlePayment} className="btn btn-primary flex-1">
                    Pay Now
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: Success */}
            {!loading && step === 5 && transaction && (
              <div className="max-w-md mx-auto text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={40} className="text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-text mb-2">Payment Successful!</h3>
                <p className="text-text-muted mb-6">Your {selectedCategory?.label} payment has been processed.</p>
                
                <div className="bg-muted rounded-xl p-6 text-left space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Reference</span>
                    <span className="text-text font-mono text-sm">{transaction.reference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Amount</span>
                    <span className="text-text font-medium">₦{Number(transaction.amount).toLocaleString()}</span>
                  </div>
                  {transaction.token && (
                    <div className="bg-primary-50 p-4 rounded-lg mt-4">
                      <p className="text-sm text-primary-600 font-medium mb-1">Your Token:</p>
                      <p className="text-xl font-mono font-bold text-primary-700">{transaction.token}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => receiptAPI.downloadBillReceipt(transaction.id)} 
                    className="btn btn-outline flex-1"
                  >
                    <Download size={18} /> Download Receipt
                  </button>
                  <button onClick={resetForm} className="btn btn-primary flex-1">
                    New Payment
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* History Tab */
          <div className="card">
            <h3 className="text-lg font-medium text-text mb-4">Payment History</h3>
            
            {historyLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="animate-spin text-primary-600" size={32} />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-16">
                <History size={48} className="text-text-muted mx-auto mb-4 opacity-40" />
                <p className="text-text-muted">No payment history yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Provider</th>
                      <th>Recipient</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((tx) => (
                      <tr key={tx.id}>
                        <td className="text-text-muted">{new Date(tx.created_at).toLocaleDateString()}</td>
                        <td className="text-text capitalize">{tx.category}</td>
                        <td className="font-medium text-text">{tx.biller_name}</td>
                        <td className="text-text-muted">{tx.customer_id}</td>
                        <td className="text-text">₦{Number(tx.amount).toLocaleString()}</td>
                        <td>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(tx.status)}`}>
                            {tx.status}
                          </span>
                        </td>
                        <td>
                          <button 
                            onClick={() => receiptAPI.downloadBillReceipt(tx.id)}
                            className="text-primary-600 hover:text-primary-700"
                            title="Download Receipt"
                          >
                            <Download size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </CustomerLayout>
  )
}
