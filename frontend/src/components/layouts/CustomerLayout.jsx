import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Wallet, LayoutDashboard, FileText, Upload, User, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function CustomerLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => { await logout(); navigate('/login') }

  const navLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/loans', icon: FileText, label: 'My Loans' },
    { to: '/kyc', icon: Upload, label: 'KYC Documents' },
    { to: '/profile', icon: User, label: 'Profile' },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile Menu Button */}
      <button className="lg:hidden fixed top-4 left-4 z-50 bg-surface border border-border rounded-lg p-2 text-text" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {sidebarOpen && <div className="lg:hidden fixed inset-0 bg-black/20 z-40" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-56 bg-surface border-r border-border flex flex-col z-40 transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <Wallet size={18} className="text-white" />
          </div>
          <span className="text-lg font-semibold text-text">DigitMonie</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navLinks.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User & Logout */}
        <div className="px-3 py-4 border-t border-border">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-medium">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text truncate">{user?.name}</p>
              <p className="text-xs text-text-muted truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="nav-link w-full text-red-600 hover:text-red-700 hover:bg-red-50">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-56">
        <div className="max-w-5xl mx-auto px-6 py-8 pt-16 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  )
}
