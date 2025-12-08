import { createContext, useContext, useState } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = (type, message) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => removeToast(id), 5000)
  }

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id))

  const toast = {
    success: (msg) => addToast('success', msg),
    error: (msg) => addToast('error', msg),
    warning: (msg) => addToast('warning', msg),
    info: (msg) => addToast('info', msg),
  }

  const config = {
    success: { icon: CheckCircle, bg: 'bg-primary-50', border: 'border-primary-200', iconColor: 'text-primary-600', textColor: 'text-primary-800' },
    error: { icon: XCircle, bg: 'bg-red-50', border: 'border-red-200', iconColor: 'text-red-600', textColor: 'text-red-800' },
    warning: { icon: AlertTriangle, bg: 'bg-amber-50', border: 'border-amber-200', iconColor: 'text-amber-600', textColor: 'text-amber-800' },
    info: { icon: Info, bg: 'bg-blue-50', border: 'border-blue-200', iconColor: 'text-blue-600', textColor: 'text-blue-800' },
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 max-w-sm w-full">
        {toasts.map((t) => {
          const { icon: Icon, bg, border, iconColor, textColor } = config[t.type]
          return (
            <div key={t.id} className={`flex items-start gap-3 p-4 rounded-lg border ${bg} ${border} shadow-lg animate-slide-up`}>
              <Icon size={18} className={iconColor} />
              <p className={`flex-1 text-sm ${textColor}`}>{t.message}</p>
              <button className={`${iconColor} hover:opacity-70`} onClick={() => removeToast(t.id)}><X size={16} /></button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within a ToastProvider')
  return context
}
