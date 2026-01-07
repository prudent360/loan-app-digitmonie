import { Link } from 'react-router-dom'
import { Wallet, Shield, Clock, TrendingUp, ArrowRight, CheckCircle2, Sparkles, BarChart3, CreditCard, Receipt, PiggyBank, Zap, Globe, Smartphone, Building, Wifi, Tv, Phone, Droplets, Lightbulb } from 'lucide-react'
import { useState, useEffect } from 'react'
import api from '../services/api'

export default function Landing() {
  const [investmentAmount, setInvestmentAmount] = useState(500000)
  const [investmentPeriod, setInvestmentPeriod] = useState(12)
  const [logoUrl, setLogoUrl] = useState(null)
  const [activeService, setActiveService] = useState('loans')
  const returnRate = 30

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const res = await api.get('/logo')
        if (res.data.logo_url) {
          setLogoUrl(`${import.meta.env.PROD ? 'https://app.digitmonie.com/api' : 'http://localhost:8001'}${res.data.logo_url}`)
        }
      } catch (err) {
        console.error('Failed to fetch logo:', err)
      }
    }
    fetchLogo()
  }, [])

  // Investment calculator - 30% annual return
  const annualRate = returnRate / 100
  const monthlyRate = annualRate / 12
  const totalReturns = investmentAmount * (Math.pow(1 + monthlyRate, investmentPeriod) - 1)
  const maturityAmount = investmentAmount + totalReturns
  const monthlyReturns = totalReturns / investmentPeriod

  const formatCurrency = (amount) => `₦${Math.round(amount).toLocaleString()}`

  const services = [
    { id: 'loans', label: 'Loans', icon: Wallet },
    { id: 'cards', label: 'Virtual Cards', icon: CreditCard },
    { id: 'bills', label: 'Bill Payments', icon: Receipt },
    { id: 'savings', label: 'Savings', icon: PiggyBank },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
            ) : (
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Wallet size={18} className="text-white" />
              </div>
            )}
            <span className="font-bold text-lg text-text">DigitMonie</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#services" className="text-sm text-text-muted hover:text-text">Services</a>
            <a href="#features" className="text-sm text-text-muted hover:text-text">Features</a>
            <a href="#calculator" className="text-sm text-text-muted hover:text-text">Calculator</a>
            <a href="#how-it-works" className="text-sm text-text-muted hover:text-text">How it Works</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900">
        {/* Dark Animated Background Gradient Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-primary-500/20 to-primary-700/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-purple-500/20 to-primary-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary-500/10 via-transparent to-purple-500/10 rounded-full blur-3xl"></div>
        </div>

        {/* Floating Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-32 left-[10%] w-2 h-2 bg-primary-400/60 rounded-full animate-bounce" style={{ animationDuration: '3s' }}></div>
          <div className="absolute top-48 right-[15%] w-3 h-3 bg-purple-400/60 rounded-full animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}></div>
          <div className="absolute bottom-32 left-[20%] w-2 h-2 bg-primary-500/60 rounded-full animate-bounce" style={{ animationDuration: '2s', animationDelay: '1s' }}></div>
          <div className="absolute bottom-48 right-[25%] w-1.5 h-1.5 bg-purple-500/60 rounded-full animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.3s' }}></div>
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Premium Badge with Glassmorphism - Dark Theme */}
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-primary-300 text-sm font-medium mb-8 shadow-lg shadow-black/20 hover:bg-white/15 transition-all duration-300 cursor-default opacity-0 animate-[slideInUp_0.6s_ease-out_0.1s_forwards]"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-400"></span>
            </span>
            <Sparkles size={14} className="animate-pulse" /> 
            Your All-in-One Financial Partner
          </div>

          {/* Main Headline with Gradient Text */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-[1.1] tracking-tight opacity-0 animate-[slideInUp_0.8s_ease-out_0.2s_forwards]">
            Smart Money for a{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-primary-400 via-primary-300 to-purple-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient_3s_linear_infinite]">Smarter Life</span>
              <svg className="absolute -bottom-2 left-0 w-full opacity-0 animate-[fadeIn_0.5s_ease-out_1s_forwards]" viewBox="0 0 200 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 8C50 2 150 2 198 8" stroke="url(#gradient)" strokeWidth="3" strokeLinecap="round" className="animate-[dash_1.5s_ease-out_1s_forwards]" strokeDasharray="200" strokeDashoffset="200" style={{ animation: 'dash 1.5s ease-out 1s forwards' }}/>
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="200" y2="0">
                    <stop stopColor="#60a5fa"/>
                    <stop offset="1" stopColor="#a78bfa"/>
                  </linearGradient>
                </defs>
              </svg>
            </span>
          </h1>

          {/* Subtitle with Better Typography */}
          <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed opacity-0 animate-[slideInUp_0.8s_ease-out_0.4s_forwards]">
            Loans, virtual cards, bill payments, and automated savings — all in one place. 
            <span className="text-white font-medium"> Take control of your finances</span> with DigitMonie.
          </p>

          {/* CTA Buttons with Enhanced Styling */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 opacity-0 animate-[slideInUp_0.8s_ease-out_0.6s_forwards]">
            <Link 
              to="/register" 
              className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold px-8 py-4 rounded-xl shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:scale-[1.02] transition-all duration-300 animate-[glow_2s_ease-in-out_infinite_1.5s]"
            >
              Get Started Free 
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-400 to-purple-500 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300 -z-10"></div>
            </Link>
            <a 
              href="#services" 
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/20 hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
            >
              Explore Services
            </a>
          </div>

          {/* Stats Section with Glass Cards - Dark Theme */}
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            <div className="group bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-4 shadow-lg hover:shadow-xl hover:bg-white/15 transition-all duration-300 opacity-0 animate-[scaleIn_0.6s_ease-out_0.8s_forwards] hover:-translate-y-1">
              <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-400 to-primary-300 bg-clip-text text-transparent">₦5B+</p>
              <p className="text-sm text-gray-400 font-medium">Transactions Processed</p>
            </div>
            <div className="hidden md:block w-px h-16 bg-gradient-to-b from-transparent via-white/20 to-transparent opacity-0 animate-[fadeIn_0.5s_ease-out_1s_forwards]"></div>
            <div className="group bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-4 shadow-lg hover:shadow-xl hover:bg-white/15 transition-all duration-300 opacity-0 animate-[scaleIn_0.6s_ease-out_0.9s_forwards] hover:-translate-y-1">
              <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">100K+</p>
              <p className="text-sm text-gray-400 font-medium">Happy Users</p>
            </div>
            <div className="hidden md:block w-px h-16 bg-gradient-to-b from-transparent via-white/20 to-transparent opacity-0 animate-[fadeIn_0.5s_ease-out_1.1s_forwards]"></div>
            <div className="group bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-4 shadow-lg hover:shadow-xl hover:bg-white/15 transition-all duration-300 opacity-0 animate-[scaleIn_0.6s_ease-out_1s_forwards] hover:-translate-y-1">
              <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-primary-400 bg-clip-text text-transparent">99.9%</p>
              <p className="text-sm text-gray-400 font-medium">Uptime Guarantee</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section id="services" className="py-20 px-6 bg-muted/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-text mb-3">Everything You Need, One Platform</h2>
            <p className="text-text-muted max-w-lg mx-auto">From instant loans to virtual cards, we've got all your financial needs covered.</p>
          </div>

          {/* Service Tabs */}
          <div className="flex justify-center gap-2 mb-10 flex-wrap">
            {services.map((service) => {
              const Icon = service.icon
              return (
                <button
                  key={service.id}
                  onClick={() => setActiveService(service.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                    activeService === service.id
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                      : 'bg-surface text-text-muted hover:text-text border border-border'
                  }`}
                >
                  <Icon size={16} />
                  {service.label}
                </button>
              )
            })}
          </div>

          {/* Loans Content */}
          {activeService === 'loans' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-fade-in">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium mb-4">
                  <Wallet size={12} /> Quick Loans
                </div>
                <h3 className="text-2xl font-bold text-text mb-4">Get Instant Loans Up to ₦5M</h3>
                <p className="text-text-muted mb-6">Apply online in minutes, get approved within 24 hours, and receive funds directly to your bank account. No collateral required.</p>
                <ul className="space-y-3 mb-6">
                  {['Competitive interest rates from 15% p.a.', 'Flexible tenure: 3-36 months', 'No hidden fees or charges', 'Quick online application'].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-text">
                      <CheckCircle2 size={16} className="text-primary-600 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="btn btn-primary">Apply for a Loan <ArrowRight size={16} /></Link>
              </div>
              <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-8 text-white">
                <div className="text-center">
                  <p className="text-primary-100 text-sm mb-2">Borrow up to</p>
                  <p className="text-4xl font-bold mb-4">₦5,000,000</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-white/10 rounded-lg p-3"><p className="text-primary-100">Min Rate</p><p className="font-semibold">15% p.a.</p></div>
                    <div className="bg-white/10 rounded-lg p-3"><p className="text-primary-100">Max Tenure</p><p className="font-semibold">36 months</p></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Virtual Cards Content */}
          {activeService === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-fade-in">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium mb-4">
                  <CreditCard size={12} /> Virtual Cards
                </div>
                <h3 className="text-2xl font-bold text-text mb-4">Shop Globally with Virtual Cards</h3>
                <p className="text-text-muted mb-6">Create instant virtual Visa/Mastercard for online shopping, subscriptions, and international payments. No bank account needed.</p>
                <ul className="space-y-3 mb-6">
                  {['Instant card creation in seconds', 'Works on Netflix, Amazon, Spotify & more', 'USD, GBP, EUR denominated cards', 'Secure 3D authentication'].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-text">
                      <CheckCircle2 size={16} className="text-purple-600 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>Create Virtual Card <ArrowRight size={16} /></Link>
              </div>
              <div className="relative">
                <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 rounded-2xl p-6 text-white shadow-2xl transform rotate-3 hover:rotate-0 transition-transform">
                  <div className="flex justify-between items-start mb-12">
                    <div className="w-12 h-8 bg-gradient-to-br from-yellow-200 to-yellow-400 rounded"></div>
                    <Globe size={24} className="text-white/60" />
                  </div>
                  <p className="font-mono text-lg tracking-widest mb-6">•••• •••• •••• 4532</p>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-white/60">Card Holder</p>
                      <p className="font-medium">JOHN DOE</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-white/60">Expires</p>
                      <p className="font-medium">12/28</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 bg-white rounded-xl p-4 shadow-lg border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 size={20} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">Transaction</p>
                      <p className="font-semibold text-text">$49.99 - Netflix</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bill Payments Content */}
          {activeService === 'bills' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-fade-in">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium mb-4">
                  <Receipt size={12} /> Bill Payments
                </div>
                <h3 className="text-2xl font-bold text-text mb-4">Pay Bills in Seconds</h3>
                <p className="text-text-muted mb-6">Buy airtime, pay electricity bills, cable TV subscriptions, and more — all from one dashboard. Set up recurring payments and never miss a due date.</p>
                <ul className="space-y-3 mb-6">
                  {['Airtime & data for all networks', 'Electricity: PHCN, EKEDC, IBEDC, etc.', 'Cable TV: DSTV, GOtv, Startimes', 'Instant confirmation & receipts'].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-text">
                      <CheckCircle2 size={16} className="text-orange-600 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>Pay Bills Now <ArrowRight size={16} /></Link>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Phone, label: 'Airtime', color: 'bg-green-100 text-green-600' },
                  { icon: Wifi, label: 'Data', color: 'bg-blue-100 text-blue-600' },
                  { icon: Lightbulb, label: 'Electricity', color: 'bg-yellow-100 text-yellow-600' },
                  { icon: Tv, label: 'Cable TV', color: 'bg-purple-100 text-purple-600' },
                  { icon: Droplets, label: 'Water', color: 'bg-cyan-100 text-cyan-600' },
                  { icon: Building, label: 'Education', color: 'bg-pink-100 text-pink-600' },
                ].map(({ icon: Icon, label, color }) => (
                  <div key={label} className="card text-center hover:shadow-lg transition-shadow cursor-pointer">
                    <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mx-auto mb-3`}>
                      <Icon size={24} />
                    </div>
                    <p className="text-sm font-medium text-text">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Automated Savings Content */}
          {activeService === 'savings' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-fade-in">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium mb-4">
                  <PiggyBank size={12} /> Automated Savings
                </div>
                <h3 className="text-2xl font-bold text-text mb-4">Save Smartly, Grow Wealth</h3>
                <p className="text-text-muted mb-6">Set savings goals and automate your savings with flexible lock periods. Earn up to 15% interest per annum on your savings.</p>
                <ul className="space-y-3 mb-6">
                  {['Automatic daily, weekly, or monthly savings', 'Earn up to 15% interest p.a.', 'Flexible or fixed savings plans', 'Track progress with visual goals'].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-text">
                      <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>Start Saving <ArrowRight size={16} /></Link>
              </div>
              <div className="space-y-4">
                {[
                  { title: 'Emergency Fund', target: 500000, saved: 325000, color: 'bg-emerald-500' },
                  { title: 'New Laptop', target: 350000, saved: 287000, color: 'bg-blue-500' },
                  { title: 'Vacation', target: 1000000, saved: 420000, color: 'bg-purple-500' },
                ].map((goal) => (
                  <div key={goal.title} className="card">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-medium text-text">{goal.title}</p>
                      <p className="text-sm text-text-muted">{Math.round((goal.saved / goal.target) * 100)}%</p>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                      <div className={`h-full ${goal.color} rounded-full transition-all`} style={{ width: `${(goal.saved / goal.target) * 100}%` }}></div>
                    </div>
                    <div className="flex justify-between text-xs text-text-muted">
                      <span>₦{goal.saved.toLocaleString()} saved</span>
                      <span>₦{goal.target.toLocaleString()} goal</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-text mb-3">Why Choose DigitMonie?</h2>
            <p className="text-text-muted">Experience the future of finance with our modern platform</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Zap, title: 'Lightning Fast', desc: 'Instant transactions and real-time updates', color: 'bg-yellow-100 text-yellow-600' },
              { icon: Shield, title: 'Bank-Grade Security', desc: 'Advanced encryption protects your data', color: 'bg-green-100 text-green-600' },
              { icon: Smartphone, title: 'Mobile First', desc: 'Manage everything from your phone', color: 'bg-blue-100 text-blue-600' },
              { icon: BarChart3, title: 'Smart Analytics', desc: 'Track spending and savings insights', color: 'bg-purple-100 text-purple-600' },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="card text-center hover:shadow-lg transition-shadow">
                <div className={`w-14 h-14 rounded-xl ${color} flex items-center justify-center mx-auto mb-4`}>
                  <Icon size={24} />
                </div>
                <h3 className="font-semibold text-text mb-2">{title}</h3>
                <p className="text-sm text-text-muted">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Investment Calculator */}
      <section id="calculator" className="py-20 px-6 bg-muted/50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-text mb-3">Investment Calculator</h2>
            <p className="text-text-muted">See how your money grows with our 30% annual returns</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Inputs */}
            <div className="card">
              <div className="mb-6">
                <label className="form-label">Investment Amount</label>
                <div className="text-2xl font-bold text-primary-600 mb-3">{formatCurrency(investmentAmount)}</div>
                <input type="range" min="50000" max="100000000" step="50000" value={investmentAmount} onChange={(e) => setInvestmentAmount(Number(e.target.value))} className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary-600" />
                <div className="flex justify-between text-xs text-text-muted mt-1"><span>₦50K</span><span>₦100M</span></div>
              </div>
              <div className="mb-6">
                <label className="form-label">Investment Period</label>
                <div className="text-2xl font-bold text-primary-600 mb-3">{investmentPeriod} months</div>
                <input type="range" min="3" max="36" value={investmentPeriod} onChange={(e) => setInvestmentPeriod(Number(e.target.value))} className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary-600" />
                <div className="flex justify-between text-xs text-text-muted mt-1"><span>3 months</span><span>36 months</span></div>
              </div>
              <div className="flex justify-between p-3 bg-muted rounded-lg text-sm">
                <span className="text-text-muted">Annual Returns</span>
                <span className="font-medium text-primary-600">{returnRate}% p.a.</span>
              </div>
            </div>

            {/* Results */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-primary-500 to-primary-700 text-white text-center rounded-xl p-6">
                <p className="text-sm text-primary-100 mb-1">Maturity Amount</p>
                <p className="text-3xl font-bold">{formatCurrency(maturityAmount)}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="card text-center"><p className="text-xs text-text-muted mb-1">Your Investment</p><p className="font-semibold text-text">{formatCurrency(investmentAmount)}</p></div>
                <div className="card text-center"><p className="text-xs text-text-muted mb-1">Total Returns</p><p className="font-semibold text-primary-600">{formatCurrency(totalReturns)}</p></div>
              </div>
              <div className="card flex justify-between items-center">
                <span className="text-text-muted text-sm">Avg. Monthly Returns</span>
                <span className="text-xl font-bold text-primary-600">{formatCurrency(monthlyReturns)}</span>
              </div>
              <Link to="/register" className="btn btn-primary w-full">Start Investing Now</Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-text mb-3">How It Works</h2>
            <p className="text-text-muted">Get started in 4 simple steps</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { step: 1, title: 'Create Account', desc: 'Sign up in just 2 minutes', icon: Smartphone },
              { step: 2, title: 'Verify Identity', desc: 'Quick KYC verification', icon: Shield },
              { step: 3, title: 'Choose Service', desc: 'Loans, cards, bills, savings', icon: Wallet },
              { step: 4, title: 'Start Using', desc: 'Instant access to all features', icon: Zap },
            ].map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="text-center relative">
                <div className="w-16 h-16 bg-primary-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-600/25">
                  <Icon size={28} />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold">{step}</div>
                <h3 className="font-semibold text-text mb-1">{title}</h3>
                <p className="text-sm text-text-muted">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-muted/50">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-primary-500 to-primary-700 text-center py-16 px-8 rounded-3xl text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Finances?</h2>
            <p className="text-primary-100 mb-8 max-w-lg mx-auto">Join over 100,000 users who trust DigitMonie for their loans, cards, bills, and savings.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="inline-flex items-center gap-2 bg-white text-primary-600 font-medium px-8 py-3 rounded-lg hover:bg-primary-50 transition-colors">
                Get Started Free <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="text-white/90 hover:text-white font-medium">
                Already have an account? Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-8">
            <div className="max-w-xs">
              <Link to="/" className="flex items-center gap-2 mb-3">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
                ) : (
                  <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                    <Wallet size={18} className="text-white" />
                  </div>
                )}
                <span className="font-bold text-lg text-white">DigitMonie</span>
              </Link>
              <p className="text-sm text-gray-400">Your all-in-one financial platform. Loans and automated savings.</p>
            </div>
            <div className="flex gap-16">
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Services</h4>
                <div className="space-y-2">
                  <a href="#services" className="block text-sm text-gray-300 hover:text-primary-400">Loans</a>
                  <a href="#services" className="block text-sm text-gray-300 hover:text-primary-400">Savings</a>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Company</h4>
                <div className="space-y-2">
                  <a href="#" className="block text-sm text-gray-300 hover:text-primary-400">About Us</a>
                  <a href="#" className="block text-sm text-gray-300 hover:text-primary-400">Contact</a>
                  <a href="#" className="block text-sm text-gray-300 hover:text-primary-400">Careers</a>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Legal</h4>
                <div className="space-y-2">
                  <a href="#" className="block text-sm text-gray-300 hover:text-primary-400">Privacy Policy</a>
                  <a href="#" className="block text-sm text-gray-300 hover:text-primary-400">Terms of Service</a>
                  <a href="#" className="block text-sm text-gray-300 hover:text-primary-400">FAQ</a>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-white/10 text-center">
            <p className="text-sm text-gray-400">© {new Date().getFullYear()} DigitMonie. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
