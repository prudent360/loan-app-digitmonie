import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomerLayout from '../../components/layouts/CustomerLayout'
import { useToast } from '../../context/ToastContext'
import { loanSettingsAPI, loanAPI, paymentAPI } from '../../services/api'
import api from '../../services/api'
import { ArrowLeft, ArrowRight, Calculator, CheckCircle2, Loader2, CreditCard, AlertCircle } from 'lucide-react'

const loanPurposes = ['Business Expansion', 'Education', 'Medical Emergency', 'Home Renovation', 'Vehicle Purchase', 'Debt Consolidation', 'Personal', 'Other']

export default function LoanApplication() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [settings, setSettings] = useState({ min_amount: 50000, max_amount: 5000000, min_tenure: 3, max_tenure: 36, default_interest_rate: 15, admin_fee: 2 })
  const [formData, setFormData] = useState({ amount: 500000, tenure_months: 12, purpose: '', purpose_details: '', employment_type: '', monthly_income: '', bank_name: '', account_number: '' })
  const [createdLoan, setCreatedLoan] = useState(null)
  const [payingFee, setPayingFee] = useState(false)
  const [banks, setBanks] = useState([])
  const [selectedBankCode, setSelectedBankCode] = useState('')
  const [accountName, setAccountName] = useState('')
  const [verifyingAccount, setVerifyingAccount] = useState(false)
  const [verificationError, setVerificationError] = useState('')
  
  const toast = useToast()
  const navigate = useNavigate()

  // Fetch loan settings from API
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await loanSettingsAPI.get()
        setSettings(res.data)
        // Set default amount to midpoint
        setFormData(prev => ({ ...prev, amount: Math.floor((res.data.min_amount + res.data.max_amount) / 2) }))
      } catch (err) {
        console.error('Failed to load loan settings:', err)
      } finally {
        setSettingsLoading(false)
      }
    }
    loadSettings()

    // Fetch banks
    const loadBanks = async () => {
      try {
        const res = await api.get('/banks')
        setBanks(res.data.banks || [])
      } catch (err) {
        console.error('Failed to load banks:', err)
      }
    }
    loadBanks()
  }, [])

  // Auto-verify account when we have bank code and 10-digit account number
  useEffect(() => {
    const verifyAccount = async () => {
      if (!selectedBankCode || formData.account_number.length !== 10) {
        setAccountName('')
        setVerificationError('')
        return
      }

      setVerifyingAccount(true)
      setVerificationError('')
      setAccountName('')

      try {
        const res = await api.post('/banks/resolve', {
          account_number: formData.account_number,
          bank_code: selectedBankCode,
        })
        if (res.data.success && res.data.account_name) {
          setAccountName(res.data.account_name)
        } else {
          setVerificationError('Could not verify account')
        }
      } catch (err) {
        setVerificationError(err.response?.data?.message || 'Verification failed')
      } finally {
        setVerifyingAccount(false)
      }
    }

    // Debounce the verification
    const timer = setTimeout(verifyAccount, 500)
    return () => clearTimeout(timer)
  }, [selectedBankCode, formData.account_number])

  // Handle bank selection
  const handleBankChange = (e) => {
    const bankName = e.target.value
    const bank = banks.find(b => b.name === bankName)
    setFormData(prev => ({ ...prev, bank_name: bankName }))
    setSelectedBankCode(bank?.code || '')
    setAccountName('')
    setVerificationError('')
  }

  const interestRate = settings.default_interest_rate
  const adminFeePercent = settings.admin_fee || 0
  const adminFeeAmount = (formData.amount * adminFeePercent) / 100
  const monthlyRate = interestRate / 12 / 100
  const emi = (formData.amount * monthlyRate * Math.pow(1 + monthlyRate, formData.tenure_months)) / (Math.pow(1 + monthlyRate, formData.tenure_months) - 1)
  const totalPayment = emi * formData.tenure_months
  const totalInterest = totalPayment - formData.amount

  const formatCurrency = (amount) => `₦${Math.round(amount).toLocaleString()}`
  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const loanData = {
        amount: formData.amount,
        tenure_months: formData.tenure_months,
        interest_rate: interestRate,
        purpose: formData.purpose,
        purpose_details: formData.purpose_details,
        employment_type: formData.employment_type,
        monthly_income: formData.monthly_income,
        bank_name: formData.bank_name,
        account_number: formData.account_number,
      }
      const res = await loanAPI.apply(loanData)
      const loan = res.data.loan
      setCreatedLoan(loan)
      
      // If admin fee is required and not paid, go to payment step
      if (loan.admin_fee > 0 && !loan.admin_fee_paid) {
        toast.success('Loan submitted! Please pay the admin fee to complete.')
        setStep(4) // Admin fee payment step
      } else {
        toast.success('Loan application submitted successfully!')
        setStep(5) // Success step
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to submit loan application'
      toast.error(message)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handlePayAdminFee = async () => {
    if (!createdLoan) return
    setPayingFee(true)
    try {
      const res = await paymentAPI.initialize({
        loan_id: createdLoan.id,
        amount: createdLoan.admin_fee,
        payment_type: 'admin_fee',
      })
      if (res.data.authorization_url) {
        window.location.href = res.data.authorization_url
      } else {
        toast.error('Failed to initialize payment')
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Payment initialization failed'
      toast.error(message)
    } finally {
      setPayingFee(false)
    }
  }

  const isStep1Valid = formData.amount >= settings.min_amount && formData.tenure_months >= settings.min_tenure
  const isStep2Valid = formData.purpose && formData.employment_type && formData.monthly_income
  const isStep3Valid = formData.bank_name && formData.account_number.length === 10 && accountName

  if (settingsLoading) {
    return <CustomerLayout><div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary-600" size={32} /></div></CustomerLayout>
  }

  return (
    <CustomerLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button className="flex items-center gap-2 text-text-muted hover:text-text mb-4 text-sm" onClick={() => navigate('/loans')}>
            <ArrowLeft size={16} /> Back to Loans
          </button>
          <h1 className="text-2xl font-semibold text-text">Apply for Loan</h1>
          <p className="text-text-muted">Complete the form below to submit your application</p>
        </div>

        {/* Progress Steps */}
        {step < 4 && (
          <div className="flex items-center justify-center gap-2 mb-10">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${step > s ? 'bg-primary-600 text-white' : step === s ? 'bg-primary-600 text-white' : 'bg-muted text-text-muted'}`}>
                  {step > s ? <CheckCircle2 size={16} /> : s}
                </div>
                {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-primary-600' : 'bg-border'}`} />}
              </div>
            ))}
          </div>
        )}

        {/* Step 1 */}
        {step === 1 && (
          <div className="card">
            <h2 className="text-lg font-semibold text-text mb-1">Loan Details</h2>
            <p className="text-text-muted text-sm mb-8">Choose your loan amount and repayment tenure</p>

            <div className="mb-8">
              <label className="form-label">Loan Amount</label>
              <div className="text-3xl font-bold text-text mb-4">{formatCurrency(formData.amount)}</div>
              <input type="range" name="amount" min={settings.min_amount} max={settings.max_amount} step="50000" value={formData.amount} onChange={handleChange} className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary-600" />
              <div className="flex justify-between text-xs text-text-muted mt-2"><span>{formatCurrency(settings.min_amount)}</span><span>{formatCurrency(settings.max_amount)}</span></div>
            </div>

            <div className="mb-8">
              <label className="form-label">Repayment Tenure</label>
              <div className="flex flex-wrap gap-2">
                {[3, 6, 12, 18, 24, 36].filter(m => m >= settings.min_tenure && m <= settings.max_tenure).map((months) => (
                  <button key={months} type="button" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${formData.tenure_months === months ? 'bg-primary-600 text-white' : 'bg-muted text-text hover:bg-border'}`} onClick={() => setFormData(prev => ({ ...prev, tenure_months: months }))}>
                    {months} months
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-muted rounded-lg p-5 mb-6">
              <div className="flex items-center gap-2 text-primary-600 mb-4"><Calculator size={18} /><span className="font-medium text-sm">Loan Summary</span></div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-text-muted">Principal</span><p className="font-semibold text-text">{formatCurrency(formData.amount)}</p></div>
                <div><span className="text-text-muted">Interest Rate</span><p className="font-semibold text-text">{interestRate}% p.a.</p></div>
                <div><span className="text-text-muted">Monthly EMI</span><p className="font-semibold text-primary-600">{formatCurrency(emi)}</p></div>
                <div><span className="text-text-muted">Total Interest</span><p className="font-semibold text-text">{formatCurrency(totalInterest)}</p></div>
                {adminFeePercent > 0 && <div><span className="text-text-muted">Admin Fee ({adminFeePercent}%)</span><p className="font-semibold text-amber-600">{formatCurrency(adminFeeAmount)}</p></div>}
              </div>
              <div className="flex justify-between items-center pt-4 mt-4 border-t border-border text-sm">
                <span className="text-text-muted">Total Payable</span>
                <span className="text-xl font-bold text-primary-600">{formatCurrency(totalPayment + adminFeeAmount)}</span>
              </div>
              {adminFeePercent > 0 && <p className="text-xs text-text-muted mt-2">*Admin fee is deducted from disbursement amount</p>}
            </div>

            <button className="btn btn-primary w-full" onClick={() => setStep(2)} disabled={!isStep1Valid}>Continue <ArrowRight size={16} /></button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="card">
            <h2 className="text-lg font-semibold text-text mb-1">Personal Information</h2>
            <p className="text-text-muted text-sm mb-6">Tell us about the loan purpose</p>

            <div className="form-group">
              <label className="form-label">Loan Purpose</label>
              <select name="purpose" className="form-input form-select" value={formData.purpose} onChange={handleChange}>
                <option value="">Select purpose</option>
                {loanPurposes.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Purpose Details (Optional)</label>
              <textarea name="purpose_details" className="form-input" rows={3} placeholder="Describe how you plan to use this loan..." value={formData.purpose_details} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label className="form-label">Employment Type</label>
              <select name="employment_type" className="form-input form-select" value={formData.employment_type} onChange={handleChange}>
                <option value="">Select type</option>
                <option value="employed">Employed (Full-time)</option>
                <option value="self_employed">Self Employed</option>
                <option value="business">Business Owner</option>
                <option value="contract">Contract/Freelance</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Monthly Income</label>
              <input type="number" name="monthly_income" className="form-input" placeholder="Enter monthly income" value={formData.monthly_income} onChange={handleChange} />
            </div>

            <div className="flex gap-3 mt-6">
              <button className="btn btn-outline flex-1" onClick={() => setStep(1)}><ArrowLeft size={16} /> Back</button>
              <button className="btn btn-primary flex-1" onClick={() => setStep(3)} disabled={!isStep2Valid}>Continue <ArrowRight size={16} /></button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="card">
            <h2 className="text-lg font-semibold text-text mb-1">Bank Details</h2>
            <p className="text-text-muted text-sm mb-6">Where should we deposit the loan amount?</p>

            <div className="form-group">
              <label className="form-label">Bank Name</label>
              <select name="bank_name" className="form-input form-select" value={formData.bank_name} onChange={handleBankChange}>
                <option value="">Select bank</option>
                {banks.map(b => <option key={b.code} value={b.name}>{b.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Account Number</label>
              <input 
                type="text" 
                name="account_number" 
                className="form-input" 
                placeholder="10-digit account number" 
                maxLength={10} 
                value={formData.account_number} 
                onChange={handleChange} 
              />
              
              {/* Verification Status */}
              {verifyingAccount && (
                <div className="flex items-center gap-2 mt-2 text-sm text-text-muted">
                  <Loader2 size={14} className="animate-spin" />
                  Verifying account...
                </div>
              )}
              {accountName && (
                <div className="flex items-center gap-2 mt-2 text-sm text-green-600 bg-green-50 p-2 rounded-lg">
                  <CheckCircle2 size={16} />
                  <span className="font-medium">{accountName}</span>
                </div>
              )}
              {verificationError && (
                <div className="flex items-center gap-2 mt-2 text-sm text-red-600 bg-red-50 p-2 rounded-lg">
                  <AlertCircle size={16} />
                  {verificationError}
                </div>
              )}
            </div>

            <div className="bg-muted rounded-lg p-4 mb-6 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-text-muted">Amount</span><p className="font-medium text-text">{formatCurrency(formData.amount)}</p></div>
                <div><span className="text-text-muted">Tenure</span><p className="font-medium text-text">{formData.tenure_months} months</p></div>
                <div><span className="text-text-muted">EMI</span><p className="font-medium text-text">{formatCurrency(emi)}</p></div>
                <div><span className="text-text-muted">Purpose</span><p className="font-medium text-text">{formData.purpose}</p></div>
              </div>
            </div>

            <label className="flex items-start gap-2 mb-6 cursor-pointer text-sm">
              <input type="checkbox" className="mt-0.5 accent-primary-600" required />
              <span className="text-text-muted">I agree to the <a href="#" className="text-primary-600">Terms & Conditions</a></span>
            </label>

            <div className="flex gap-3">
              <button className="btn btn-outline flex-1" onClick={() => setStep(2)}><ArrowLeft size={16} /> Back</button>
              <button className="btn btn-primary flex-1" onClick={handleSubmit} disabled={!isStep3Valid || loading}>{loading ? 'Submitting...' : 'Submit Application'}</button>
            </div>
          </div>
        )}

        {/* Step 4 - Admin Fee Payment */}
        {step === 4 && createdLoan && (
          <div className="card text-center py-12">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CreditCard size={32} className="text-amber-600" />
            </div>
            <h2 className="text-xl font-semibold text-text mb-2">Pay Admin Fee</h2>
            <p className="text-text-muted mb-6 max-w-sm mx-auto">Your loan application has been submitted. Please pay the admin fee to complete your application.</p>
            
            <div className="bg-muted rounded-lg p-6 mb-8 max-w-xs mx-auto">
              <p className="text-text-muted text-sm mb-2">Admin Fee</p>
              <p className="text-3xl font-bold text-amber-600">{formatCurrency(createdLoan.admin_fee)}</p>
              <p className="text-xs text-text-muted mt-2">for Loan #{createdLoan.id}</p>
            </div>
            
            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <button className="btn btn-primary w-full" onClick={handlePayAdminFee} disabled={payingFee}>
                {payingFee ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : 'Pay Admin Fee'}
              </button>
              <button className="btn btn-outline w-full" onClick={() => navigate('/loans')}>Pay Later</button>
            </div>
            <p className="text-xs text-text-muted mt-4">You can also pay from the loan details page later.</p>
          </div>
        )}

        {/* Step 5 - Success */}
        {step === 5 && (
          <div className="card text-center py-12">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={32} className="text-primary-600" />
            </div>
            <h2 className="text-xl font-semibold text-text mb-2">Application Submitted!</h2>
            <p className="text-text-muted mb-8 max-w-sm mx-auto">Your loan application has been submitted. We'll review it and get back to you within 24 hours.</p>
            <div className="flex justify-center gap-8 mb-8 text-sm">
              <div><span className="text-text-muted">Application ID</span><p className="font-semibold text-text">#{createdLoan?.id || Date.now().toString().slice(-8)}</p></div>
              <div><span className="text-text-muted">Amount</span><p className="font-semibold text-text">{formatCurrency(formData.amount)}</p></div>
            </div>
            <button className="btn btn-primary" onClick={() => navigate('/loans')}>View My Loans</button>
          </div>
        )}
      </div>
    </CustomerLayout>
  )
}
