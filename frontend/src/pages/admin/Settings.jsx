import { useState, useEffect, useRef } from 'react'
import AdminLayout from '../../components/layouts/AdminLayout'
import { useToast } from '../../context/ToastContext'
import api, { adminAPI } from '../../services/api'
import { Save, DollarSign, Percent, Mail, Loader2, CreditCard, Eye, EyeOff, Upload, Trash2, Image, Settings, FileText } from 'lucide-react'

const defaultCurrencies = [
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', active: true },
  { code: 'USD', symbol: '$', name: 'US Dollar', active: false },
  { code: 'GBP', symbol: '£', name: 'British Pound', active: false },
]

const defaultPaymentGateways = {
  active_gateway: 'paystack',
  paystack: { public_key: '', secret_key: '', enabled: true },
  flutterwave: { public_key: '', secret_key: '', enabled: false },
}

const tabs = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'loan', label: 'Loan Configuration', icon: Percent },
  { id: 'payment', label: 'Payment Settings', icon: CreditCard },
  { id: 'email', label: 'Email Templates', icon: Mail },
]

export default function AdminSettings() {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('general')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [currencies, setCurrencies] = useState(defaultCurrencies)
  const [loanSettings, setLoanSettings] = useState({ min_amount: 50000, max_amount: 5000000, min_tenure: 3, max_tenure: 36, default_interest_rate: 15, admin_fee: 2 })
  const [notificationSettings, setNotificationSettings] = useState({ reminder_days_before: 3, overdue_notification: true, approval_notification: true, disbursement_notification: true })
  const [paymentGateways, setPaymentGateways] = useState(defaultPaymentGateways)
  const [showSecrets, setShowSecrets] = useState({ paystack: false, flutterwave: false })
  const [logoUrl, setLogoUrl] = useState(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const logoInputRef = useRef(null)

  // Email templates state
  const [emailTemplates, setEmailTemplates] = useState([
    { id: 'loan_approved', name: 'Loan Approved', subject: 'Your Loan Has Been Approved!', enabled: true },
    { id: 'loan_rejected', name: 'Loan Rejected', subject: 'Loan Application Update', enabled: true },
    { id: 'loan_disbursed', name: 'Loan Disbursed', subject: 'Your Loan Has Been Disbursed', enabled: true },
    { id: 'payment_reminder', name: 'Payment Reminder', subject: 'Upcoming Payment Reminder', enabled: true },
    { id: 'payment_received', name: 'Payment Received', subject: 'Payment Confirmation', enabled: true },
    { id: 'payment_overdue', name: 'Payment Overdue', subject: 'Urgent: Payment Overdue', enabled: true },
    { id: 'kyc_verified', name: 'KYC Verified', subject: 'KYC Verification Complete', enabled: true },
    { id: 'kyc_rejected', name: 'KYC Rejected', subject: 'KYC Verification Update', enabled: true },
  ])

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true)
      try {
        const res = await adminAPI.getSettings()
        if (res.data.currencies?.length) setCurrencies(res.data.currencies)
        if (res.data.loan_settings) setLoanSettings(res.data.loan_settings)
        if (res.data.notification_settings) setNotificationSettings(res.data.notification_settings)
        if (res.data.payment_gateways) setPaymentGateways(res.data.payment_gateways)
        if (res.data.logo_url) setLogoUrl(res.data.logo_url)
        if (res.data.email_templates) setEmailTemplates(res.data.email_templates)
      } catch (err) {
        console.error('Failed to load settings:', err)
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  const handleCurrencyChange = (code) => setCurrencies(prev => prev.map(c => ({ ...c, active: c.code === code })))
  const handleLoanSettingChange = (e) => setLoanSettings(prev => ({ ...prev, [e.target.name]: Number(e.target.value) }))
  const handleNotificationChange = (e) => setNotificationSettings(prev => ({ ...prev, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : Number(e.target.value) }))

  const handlePaymentGatewayChange = (gateway, field, value) => {
    setPaymentGateways(prev => ({
      ...prev,
      [gateway]: { ...prev[gateway], [field]: value }
    }))
  }

  const handleActiveGatewayChange = (gateway) => {
    setPaymentGateways(prev => ({
      ...prev,
      active_gateway: gateway,
      paystack: { ...prev.paystack, enabled: gateway === 'paystack' },
      flutterwave: { ...prev.flutterwave, enabled: gateway === 'flutterwave' },
    }))
  }

  const handleEmailTemplateToggle = (templateId) => {
    setEmailTemplates(prev => prev.map(t => t.id === templateId ? { ...t, enabled: !t.enabled } : t))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await adminAPI.updateSettings({
        currencies,
        loan_settings: loanSettings,
        notification_settings: notificationSettings,
        payment_gateways: paymentGateways,
        email_templates: emailTemplates,
      })
      toast.success('Settings saved successfully!')
    } catch (err) {
      toast.error('Failed to save settings')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    
    const formData = new FormData()
    formData.append('logo', file)
    
    setUploadingLogo(true)
    try {
      const res = await api.post('/admin/settings/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setLogoUrl(res.data.logo_url)
      toast.success('Logo uploaded successfully!')
    } catch (err) {
      toast.error('Failed to upload logo')
      console.error(err)
    } finally {
      setUploadingLogo(false)
      if (logoInputRef.current) logoInputRef.current.value = ''
    }
  }

  const handleDeleteLogo = async () => {
    if (!confirm('Remove the current logo?')) return
    try {
      await api.delete('/admin/settings/logo')
      setLogoUrl(null)
      toast.success('Logo removed')
    } catch (err) {
      toast.error('Failed to remove logo')
      console.error('Delete logo error:', err)
    }
  }

  // Build full logo URL for display
  const getLogoDisplayUrl = (url) => {
    if (!url) return null
    if (url.startsWith('http')) return url
    return `${import.meta.env.PROD ? 'https://app.digitmonie.com/api' : 'http://localhost:8001'}${url}`
  }

  if (loading) {
    return <AdminLayout><div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary-600" size={32} /></div></AdminLayout>
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-text">System Settings</h1>
            <p className="text-text-muted">Configure your loan management system</p>
          </div>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={16} />{saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <nav className="flex gap-1 -mb-px overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-text-muted hover:text-text hover:border-border'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Logo Upload */}
              <div className="card">
                <div className="flex items-center gap-2 mb-1">
                  <Image size={18} className="text-primary-600" />
                  <h3 className="text-sm font-medium text-text">Company Logo</h3>
                </div>
                <p className="text-xs text-text-muted mb-4">Upload your company logo (max 2MB, PNG/JPG)</p>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center border border-border overflow-hidden">
                    {logoUrl ? (
                      <img src={getLogoDisplayUrl(logoUrl)} alt="Company Logo" className="w-full h-full object-contain" />
                    ) : (
                      <Image size={32} className="text-text-muted opacity-40" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input type="file" ref={logoInputRef} accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    <button className="btn btn-outline btn-sm" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}>
                      {uploadingLogo ? <><Loader2 size={14} className="animate-spin" /> Uploading...</> : <><Upload size={14} /> Upload Logo</>}
                    </button>
                    {logoUrl && (
                      <button className="btn btn-outline btn-sm text-red-600 hover:bg-red-50" onClick={handleDeleteLogo}>
                        <Trash2 size={14} /> Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Currency Settings */}
              <div className="card">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign size={18} className="text-primary-600" />
                  <h3 className="text-sm font-medium text-text">Currency Settings</h3>
                </div>
                <p className="text-xs text-text-muted mb-4">Select the active currency for your platform</p>
                <div className="space-y-2">
                  {currencies.map((c) => (
                    <label key={c.code} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${c.active ? 'border-primary-500 bg-primary-50' : 'border-border hover:border-primary-300'}`}>
                      <input type="radio" name="currency" checked={c.active} onChange={() => handleCurrencyChange(c.code)} className="hidden" />
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold ${c.active ? 'bg-primary-600 text-white' : 'bg-muted text-text-muted'}`}>{c.symbol}</div>
                      <div>
                        <strong className="text-text text-sm">{c.code}</strong>
                        <p className="text-xs text-text-muted">{c.name}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Loan Configuration Tab */}
          {activeTab === 'loan' && (
            <div className="space-y-6">
              <div className="card">
                <div className="flex items-center gap-2 mb-1">
                  <Percent size={18} className="text-primary-600" />
                  <h3 className="text-sm font-medium text-text">Loan Limits</h3>
                </div>
                <p className="text-xs text-text-muted mb-4">Set minimum and maximum loan amounts</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Minimum Amount</label>
                    <input type="number" name="min_amount" className="form-input" value={loanSettings.min_amount} onChange={handleLoanSettingChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Maximum Amount</label>
                    <input type="number" name="max_amount" className="form-input" value={loanSettings.max_amount} onChange={handleLoanSettingChange} />
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center gap-2 mb-1">
                  <FileText size={18} className="text-primary-600" />
                  <h3 className="text-sm font-medium text-text">Loan Tenure</h3>
                </div>
                <p className="text-xs text-text-muted mb-4">Configure loan duration limits</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Minimum Tenure (months)</label>
                    <input type="number" name="min_tenure" className="form-input" value={loanSettings.min_tenure} onChange={handleLoanSettingChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Maximum Tenure (months)</label>
                    <input type="number" name="max_tenure" className="form-input" value={loanSettings.max_tenure} onChange={handleLoanSettingChange} />
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center gap-2 mb-1">
                  <Percent size={18} className="text-primary-600" />
                  <h3 className="text-sm font-medium text-text">Interest & Fees</h3>
                </div>
                <p className="text-xs text-text-muted mb-4">Set default interest rate and admin fees</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Default Interest Rate (% p.a.)</label>
                    <input type="number" name="default_interest_rate" className="form-input" step="0.5" value={loanSettings.default_interest_rate} onChange={handleLoanSettingChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Admin Fee (%)</label>
                    <input type="number" name="admin_fee" className="form-input" step="0.5" min="0" max="100" value={loanSettings.admin_fee || 0} onChange={handleLoanSettingChange} />
                    <p className="text-xs text-text-muted mt-1">Fee charged on loan disbursement</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Settings Tab */}
          {activeTab === 'payment' && (
            <div className="space-y-6">
              <div className="card">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard size={18} className="text-primary-600" />
                  <h3 className="text-sm font-medium text-text">Active Payment Gateway</h3>
                </div>
                <p className="text-xs text-text-muted mb-4">Select which payment gateway to use for transactions</p>
                <div className="flex gap-2">
                  {['paystack', 'flutterwave'].map(gw => (
                    <button
                      key={gw}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${paymentGateways.active_gateway === gw ? 'bg-primary-600 text-white' : 'bg-muted text-text-muted hover:text-text'}`}
                      onClick={() => handleActiveGatewayChange(gw)}
                    >
                      {gw.charAt(0).toUpperCase() + gw.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Paystack Config */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-sm">PS</div>
                    <div>
                      <strong className="text-text text-sm">Paystack</strong>
                      <p className="text-xs text-text-muted">Nigerian payment gateway</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${paymentGateways.active_gateway === 'paystack' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {paymentGateways.active_gateway === 'paystack' ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="form-group">
                    <label className="form-label">Public Key</label>
                    <input type="text" className="form-input" placeholder="pk_test_..." value={paymentGateways.paystack?.public_key || ''} onChange={(e) => handlePaymentGatewayChange('paystack', 'public_key', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Secret Key</label>
                    <div className="relative">
                      <input type={showSecrets.paystack ? 'text' : 'password'} className="form-input pr-10" placeholder="sk_test_..." value={paymentGateways.paystack?.secret_key || ''} onChange={(e) => handlePaymentGatewayChange('paystack', 'secret_key', e.target.value)} />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text" onClick={() => setShowSecrets(prev => ({ ...prev, paystack: !prev.paystack }))}>
                        {showSecrets.paystack ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Flutterwave Config */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 font-bold text-sm">FW</div>
                    <div>
                      <strong className="text-text text-sm">Flutterwave</strong>
                      <p className="text-xs text-text-muted">African payment gateway</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${paymentGateways.active_gateway === 'flutterwave' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {paymentGateways.active_gateway === 'flutterwave' ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="form-group">
                    <label className="form-label">Public Key</label>
                    <input type="text" className="form-input" placeholder="FLWPUBK_TEST-..." value={paymentGateways.flutterwave?.public_key || ''} onChange={(e) => handlePaymentGatewayChange('flutterwave', 'public_key', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Secret Key</label>
                    <div className="relative">
                      <input type={showSecrets.flutterwave ? 'text' : 'password'} className="form-input pr-10" placeholder="FLWSECK_TEST-..." value={paymentGateways.flutterwave?.secret_key || ''} onChange={(e) => handlePaymentGatewayChange('flutterwave', 'secret_key', e.target.value)} />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text" onClick={() => setShowSecrets(prev => ({ ...prev, flutterwave: !prev.flutterwave }))}>
                        {showSecrets.flutterwave ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Email Templates Tab */}
          {activeTab === 'email' && (
            <div className="space-y-6">
              {/* Notification Settings */}
              <div className="card">
                <div className="flex items-center gap-2 mb-1">
                  <Mail size={18} className="text-primary-600" />
                  <h3 className="text-sm font-medium text-text">Notification Preferences</h3>
                </div>
                <p className="text-xs text-text-muted mb-4">Configure when to send email notifications</p>
                <div className="form-group">
                  <label className="form-label">Payment Reminder (days before due date)</label>
                  <input type="number" name="reminder_days_before" className="form-input max-w-32" value={notificationSettings.reminder_days_before} onChange={handleNotificationChange} />
                </div>
                <div className="space-y-3 mt-4">
                  {[['approval_notification', 'Send email when loan is approved'], ['disbursement_notification', 'Send email when loan is disbursed'], ['overdue_notification', 'Send email for overdue payments']].map(([name, title]) => (
                    <label key={name} className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" name={name} checked={notificationSettings[name]} onChange={handleNotificationChange} className="w-4 h-4 accent-primary-600 rounded" />
                      <span className="text-sm text-text">{title}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Email Templates List */}
              <div className="card">
                <div className="flex items-center gap-2 mb-1">
                  <FileText size={18} className="text-primary-600" />
                  <h3 className="text-sm font-medium text-text">Email Templates</h3>
                </div>
                <p className="text-xs text-text-muted mb-4">Enable or disable specific email templates</p>
                <div className="space-y-2">
                  {emailTemplates.map((template) => (
                    <div key={template.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:border-primary-300 transition-all">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${template.enabled ? 'bg-primary-100 text-primary-600' : 'bg-muted text-text-muted'}`}>
                          <Mail size={18} />
                        </div>
                        <div>
                          <strong className="text-text text-sm">{template.name}</strong>
                          <p className="text-xs text-text-muted">{template.subject}</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={template.enabled}
                          onChange={() => handleEmailTemplateToggle(template.id)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
