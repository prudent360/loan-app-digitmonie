import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Wallet, LayoutDashboard, Users, FileText, Upload, Settings, LogOut, Menu, X, Shield, CreditCard, PiggyBank } from 'lucide-react'
import { useState } from 'react'

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => { await logout(); navigate('/login') }

  const navLinks = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/loans', icon: FileText, label: 'Loan Applications' },
    { to: '/admin/savings', icon: PiggyBank, label: 'Savings Plans' },
    { to: '/admin/payments', icon: CreditCard, label: 'Payments' },
    { to: '/admin/wallets', icon: Wallet, label: 'Wallets' },
    { to: '/admin/transfers', icon: FileText, label: 'Transfers' },
    { to: '/admin/kyc', icon: Upload, label: 'KYC Review' },
    { to: '/admin/roles', icon: Shield, label: 'Roles & Access' },
    { to: '/admin/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Mobile Header - Fixed at top */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-slate-900 z-50 flex items-center justify-between px-4">
        {/* Hamburger Menu */}
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
        >
          {sidebarOpen ? <X size={22} className="text-white" /> : <Menu size={22} className="text-white" />}
        </button>
        
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <Wallet size={16} className="text-white" />
          </div>
          <div>
            <span className="text-base font-semibold text-white">DigitMonie</span>
            <span className="block text-[10px] text-primary-400 -mt-0.5">Admin</span>
          </div>
        </div>
        
        {/* User Avatar */}
        <NavLink to="/admin/settings" className="w-9 h-9 rounded-full bg-primary-500/30 text-primary-300 flex items-center justify-center text-sm font-semibold">
          {user?.name?.charAt(0)?.toUpperCase() || 'A'}
        </NavLink>
      </header>

      {/* Overlay */}
      {sidebarOpen && <div className="lg:hidden fixed inset-0 bg-black/30 z-40" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-primary-900 flex flex-col z-40 transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/10">
          <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center">
            <Wallet size={20} className="text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-white">DigitMonie</span>
            <span className="block text-xs text-primary-400">Admin</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navLinks.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/admin'} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-white/15 text-white shadow-lg' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}>
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User & Logout */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary-500/30 text-primary-300 flex items-center justify-center text-sm font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-primary-400">Administrator</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 overflow-x-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  )
}
