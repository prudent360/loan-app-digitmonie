import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layouts/AdminLayout'
import { useToast } from '../../context/ToastContext'
import { adminAPI } from '../../services/api'
import { Save, DollarSign, Percent, Mail, Loader2 } from 'lucide-react'

const defaultCurrencies = [
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', active: true },
  { code: 'USD', symbol: '$', name: 'US Dollar', active: false },
  { code: 'GBP', symbol: '£', name: 'British Pound', active: false },
]

export default function AdminSettings() {
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [currencies, setCurrencies] = useState(defaultCurrencies)
  const [loanSettings, setLoanSettings] = useState({ min_amount: 50000, max_amount: 5000000, min_tenure: 3, max_tenure: 36, default_interest_rate: 15 })
  const [notificationSettings, setNotificationSettings] = useState({ reminder_days_before: 3, overdue_notification: true, approval_notification: true, disbursement_notification: true })

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true)
      try {
        const res = await adminAPI.getSettings()
        if (res.data.currencies?.length) setCurrencies(res.data.currencies)
        if (res.data.loan_settings) setLoanSettings(res.data.loan_settings)
        if (res.data.notification_settings) setNotificationSettings(res.data.notification_settings)
      } catch (err) {
        console.error('Failed to load settings:', err)
        // Use defaults on error
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  const handleCurrencyChange = (code) => setCurrencies(prev => prev.map(c => ({ ...c, active: c.code === code })))
  const handleLoanSettingChange = (e) => setLoanSettings(prev => ({ ...prev, [e.target.name]: Number(e.target.value) }))
  const handleNotificationChange = (e) => setNotificationSettings(prev => ({ ...prev, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : Number(e.target.value) }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await adminAPI.updateSettings({
        currencies,
        loan_settings: loanSettings,
        notification_settings: notificationSettings,
      })
      toast.success('Settings saved successfully!')
    } catch (err) {
      toast.error('Failed to save settings')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-primary-600" size={32} />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-2xl font-semibold text-text">System Settings</h1><p className="text-text-muted">Configure your loan management system</p></div>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}><Save size={16} />{saving ? 'Saving...' : 'Save Changes'}</button>
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
            <div className="form-group sm:col-span-2"><label className="form-label">Default Interest Rate (% p.a.)</label><input type="number" name="default_interest_rate" className="form-input" step="0.5" value={loanSettings.default_interest_rate} onChange={handleLoanSettingChange} /></div>
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
