import { useState, useEffect, useRef } from 'react'
import AdminLayout from '../../components/layouts/AdminLayout'
import { useToast } from '../../context/ToastContext'
import api, { adminAPI } from '../../services/api'
import { Save, DollarSign, Percent, Mail, Loader2, CreditCard, Eye, EyeOff, Upload, Trash2, Image } from 'lucide-react'

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

export default function AdminSettings() {
  const toast = useToast()
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

  const handleSave = async () => {
    setSaving(true)
    try {
      await adminAPI.updateSettings({
        currencies,
        loan_settings: loanSettings,
        notification_settings: notificationSettings,
        payment_gateways: paymentGateways,
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
    // If URL starts with http, it's already absolute
    if (url.startsWith('http')) return url
    // Otherwise prepend the backend URL
    return `http://localhost:8000${url}`
  }

  if (loading) {
    return <AdminLayout><div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary-600" size={32} /></div></AdminLayout>
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-2xl font-semibold text-text">System Settings</h1><p className="text-text-muted">Configure your loan management system</p></div>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}><Save size={16} />{saving ? 'Saving...' : 'Save Changes'}</button>
        </div>

        {/* Logo Upload */}
        <div className="card">
          <div className="flex items-center gap-2 mb-1"><Image size={18} className="text-primary-600" /><h3 className="text-sm font-medium text-text">Company Logo</h3></div>
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
                <button className="btn btn-outline btn-sm text-red-600 hover:bg-red-50" onClick={handleDeleteLogo}><Trash2 size={14} /> Remove</button>
              )}
            </div>
          </div>
        </div>

        {/* Currency Settings */}
        <div className="card">
          <div className="flex items-center gap-2 mb-1"><DollarSign size={18} className="text-primary-600" /><h3 className="text-sm font-medium text-text">Currency Settings</h3></div>
          <p className="text-xs text-text-muted mb-4">Select the active currency for your platform</p>
          <div className="space-y-2">
            {currencies.map((c) => (
              <label key={c.code} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${c.active ? 'border-primary-500 bg-primary-50' : 'border-border hover:border-primary-300'}`}>
                <input type="radio" name="currency" checked={c.active} onChange={() => handleCurrencyChange(c.code)} className="hidden" />
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold ${c.active ? 'bg-primary-600 text-white' : 'bg-muted text-text-muted'}`}>{c.symbol}</div>
                <div><strong className="text-text text-sm">{c.code}</strong><p className="text-xs text-text-muted">{c.name}</p></div>
              </label>
            ))}
          </div>
        </div>

        {/* Loan Settings */}
        <div className="card">
          <div className="flex items-center gap-2 mb-1"><Percent size={18} className="text-primary-600" /><h3 className="text-sm font-medium text-text">Loan Configuration</h3></div>
          <p className="text-xs text-text-muted mb-4">Set loan limits and default interest rate</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[['min_amount', 'Min Amount'], ['max_amount', 'Max Amount'], ['min_tenure', 'Min Tenure (months)'], ['max_tenure', 'Max Tenure (months)']].map(([name, label]) => (
              <div key={name} className="form-group"><label className="form-label">{label}</label><input type="number" name={name} className="form-input" value={loanSettings[name]} onChange={handleLoanSettingChange} /></div>
            ))}
            <div className="form-group"><label className="form-label">Default Interest Rate (% p.a.)</label><input type="number" name="default_interest_rate" className="form-input" step="0.5" value={loanSettings.default_interest_rate} onChange={handleLoanSettingChange} /></div>
            <div className="form-group"><label className="form-label">Admin Fee (%)</label><input type="number" name="admin_fee" className="form-input" step="0.5" min="0" max="100" value={loanSettings.admin_fee || 0} onChange={handleLoanSettingChange} /><p className="text-xs text-text-muted mt-1">Fee charged on loan disbursement</p></div>
          </div>
        </div>

        {/* Payment Gateway Settings */}
        <div className="card">
          <div className="flex items-center gap-2 mb-1"><CreditCard size={18} className="text-primary-600" /><h3 className="text-sm font-medium text-text">Payment Gateways</h3></div>
          <p className="text-xs text-text-muted mb-4">Configure Paystack and Flutterwave for loan repayments</p>

          {/* Active Gateway Selection */}
          <div className="mb-6">
            <label className="form-label">Active Payment Gateway</label>
            <div className="flex gap-2 mt-2">
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
          <div className="p-4 border border-border rounded-lg mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xs">PS</div>
                <strong className="text-text text-sm">Paystack</strong>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${paymentGateways.active_gateway === 'paystack' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {paymentGateways.active_gateway === 'paystack' ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="form-group">
                <label className="form-label text-xs">Public Key</label>
                <input type="text" className="form-input text-sm" placeholder="pk_test_..." value={paymentGateways.paystack?.public_key || ''} onChange={(e) => handlePaymentGatewayChange('paystack', 'public_key', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label text-xs">Secret Key</label>
                <div className="relative">
                  <input type={showSecrets.paystack ? 'text' : 'password'} className="form-input text-sm pr-10" placeholder="sk_test_..." value={paymentGateways.paystack?.secret_key || ''} onChange={(e) => handlePaymentGatewayChange('paystack', 'secret_key', e.target.value)} />
                  <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text" onClick={() => setShowSecrets(prev => ({ ...prev, paystack: !prev.paystack }))}>
                    {showSecrets.paystack ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Flutterwave Config */}
          <div className="p-4 border border-border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 font-bold text-xs">FW</div>
                <strong className="text-text text-sm">Flutterwave</strong>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${paymentGateways.active_gateway === 'flutterwave' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {paymentGateways.active_gateway === 'flutterwave' ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="form-group">
                <label className="form-label text-xs">Public Key</label>
                <input type="text" className="form-input text-sm" placeholder="FLWPUBK_TEST-..." value={paymentGateways.flutterwave?.public_key || ''} onChange={(e) => handlePaymentGatewayChange('flutterwave', 'public_key', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label text-xs">Secret Key</label>
                <div className="relative">
                  <input type={showSecrets.flutterwave ? 'text' : 'password'} className="form-input text-sm pr-10" placeholder="FLWSECK_TEST-..." value={paymentGateways.flutterwave?.secret_key || ''} onChange={(e) => handlePaymentGatewayChange('flutterwave', 'secret_key', e.target.value)} />
                  <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text" onClick={() => setShowSecrets(prev => ({ ...prev, flutterwave: !prev.flutterwave }))}>
                    {showSecrets.flutterwave ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="card">
          <div className="flex items-center gap-2 mb-1"><Mail size={18} className="text-primary-600" /><h3 className="text-sm font-medium text-text">Notification Settings</h3></div>
          <p className="text-xs text-text-muted mb-4">Configure email notifications</p>
          <div className="form-group"><label className="form-label">Payment Reminder (days before)</label><input type="number" name="reminder_days_before" className="form-input max-w-24" value={notificationSettings.reminder_days_before} onChange={handleNotificationChange} /></div>
          <div className="space-y-3 mt-4">
            {[['approval_notification', 'Loan Approval Notifications'], ['disbursement_notification', 'Disbursement Notifications'], ['overdue_notification', 'Overdue Payment Alerts']].map(([name, title]) => (
              <label key={name} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name={name} checked={notificationSettings[name]} onChange={handleNotificationChange} className="w-4 h-4 accent-primary-600 rounded" />
                <span className="text-sm text-text">{title}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
