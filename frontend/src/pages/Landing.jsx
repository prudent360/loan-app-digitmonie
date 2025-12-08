import { Link } from 'react-router-dom'
import { Wallet, Shield, Clock, TrendingUp, ArrowRight, CheckCircle2, Sparkles, BarChart3 } from 'lucide-react'
import { useState } from 'react'

export default function Landing() {
  const [loanAmount, setLoanAmount] = useState(500000)
  const [tenure, setTenure] = useState(12)
  const interestRate = 15

  const monthlyRate = interestRate / 12 / 100
  const emi = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1)
  const totalPayment = emi * tenure
  const totalInterest = totalPayment - loanAmount

  const formatCurrency = (amount) => `₦${Math.round(amount).toLocaleString()}`

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Wallet size={18} className="text-white" />
            </div>
            <span className="text-lg font-semibold text-text">DigitMonie</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
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
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 border border-primary-200 rounded-full text-primary-600 text-sm font-medium mb-6">
            <Sparkles size={14} /> Quick & Easy Approval
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-text mb-6 leading-tight">
            Smart Loans for Your <span className="text-primary-600">Financial Goals</span>
          </h1>
          <p className="text-lg text-text-muted mb-8 max-w-lg mx-auto">
            Get instant access to flexible loans with competitive rates. Apply online in minutes, get approved in hours.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <Link to="/register" className="btn btn-primary btn-lg">Apply Now <ArrowRight size={18} /></Link>
            <a href="#calculator" className="btn btn-outline btn-lg">Calculate EMI</a>
          </div>
          <div className="flex items-center justify-center gap-8 text-center">
            <div><p className="text-2xl font-bold text-text">₦5B+</p><p className="text-sm text-text-muted">Loans Disbursed</p></div>
            <div className="w-px h-10 bg-border"></div>
            <div><p className="text-2xl font-bold text-text">50K+</p><p className="text-sm text-text-muted">Happy Customers</p></div>
            <div className="w-px h-10 bg-border"></div>
            <div><p className="text-2xl font-bold text-text">24hrs</p><p className="text-sm text-text-muted">Avg. Approval</p></div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 bg-muted/50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-text mb-2">Why Choose DigitMonie?</h2>
            <p className="text-text-muted">Experience the future of lending with our modern platform</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: Clock, title: 'Quick Approval', desc: 'Get approved within 24 hours. No endless paperwork.' },
              { icon: Shield, title: 'Secure Process', desc: 'Bank-grade security to protect your data.' },
              { icon: TrendingUp, title: 'Competitive Rates', desc: 'Best interest rates in the market.' },
              { icon: BarChart3, title: 'Track Progress', desc: 'Real-time dashboard to track repayments.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
                  <Icon size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-text mb-1">{title}</h3>
                  <p className="text-sm text-text-muted">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section id="calculator" className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-text mb-2">Loan Calculator</h2>
            <p className="text-text-muted">Plan your loan with our easy-to-use calculator</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Inputs */}
            <div className="card">
              <div className="mb-6">
                <label className="form-label">Loan Amount</label>
                <div className="text-2xl font-bold text-primary-600 mb-3">{formatCurrency(loanAmount)}</div>
                <input type="range" min="50000" max="5000000" step="50000" value={loanAmount} onChange={(e) => setLoanAmount(Number(e.target.value))} className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary-600" />
                <div className="flex justify-between text-xs text-text-muted mt-1"><span>₦50K</span><span>₦5M</span></div>
              </div>
              <div className="mb-6">
                <label className="form-label">Loan Tenure</label>
                <div className="text-2xl font-bold text-primary-600 mb-3">{tenure} months</div>
                <input type="range" min="3" max="36" value={tenure} onChange={(e) => setTenure(Number(e.target.value))} className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary-600" />
                <div className="flex justify-between text-xs text-text-muted mt-1"><span>3 months</span><span>36 months</span></div>
              </div>
              <div className="flex justify-between p-3 bg-muted rounded-lg text-sm">
                <span className="text-text-muted">Interest Rate</span>
                <span className="font-medium text-primary-600">{interestRate}% p.a.</span>
              </div>
            </div>

            {/* Results */}
            <div className="space-y-4">
              <div className="summary-card text-center">
                <p className="text-sm text-primary-100 mb-1">Monthly EMI</p>
                <p className="text-3xl font-bold">{formatCurrency(emi)}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="card text-center"><p className="text-xs text-text-muted mb-1">Principal</p><p className="font-semibold text-text">{formatCurrency(loanAmount)}</p></div>
                <div className="card text-center"><p className="text-xs text-text-muted mb-1">Total Interest</p><p className="font-semibold text-text">{formatCurrency(totalInterest)}</p></div>
              </div>
              <div className="card flex justify-between items-center">
                <span className="text-text-muted text-sm">Total Payment</span>
                <span className="text-xl font-bold text-primary-600">{formatCurrency(totalPayment)}</span>
              </div>
              <Link to="/register" className="btn btn-primary w-full">Apply for This Loan</Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6 bg-muted/50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-text mb-2">How It Works</h2>
            <p className="text-text-muted">Get your loan in 4 simple steps</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { step: 1, title: 'Create Account', desc: 'Sign up in just 2 minutes' },
              { step: 2, title: 'Submit KYC', desc: 'Upload your ID documents' },
              { step: 3, title: 'Apply for Loan', desc: 'Choose amount & tenure' },
              { step: 4, title: 'Get Funded', desc: 'Receive funds to your account' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">{step}</div>
                <h3 className="font-semibold text-text mb-1">{title}</h3>
                <p className="text-sm text-text-muted">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="summary-card text-center py-12 px-8 rounded-2xl">
            <h2 className="text-2xl font-bold mb-3">Ready to Get Started?</h2>
            <p className="text-primary-100 mb-6 max-w-md mx-auto">Join thousands of satisfied customers who have achieved their financial goals.</p>
            <Link to="/register" className="inline-flex items-center gap-2 bg-white text-primary-600 font-medium px-6 py-3 rounded-lg hover:bg-primary-50 transition-colors">
              Start Your Application <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-8">
            <div>
              <Link to="/" className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Wallet size={18} className="text-white" />
                </div>
                <span className="text-lg font-semibold text-text">DigitMonie</span>
              </Link>
              <p className="text-sm text-text-muted max-w-xs">Smart loans for smart people. Fast, secure, and transparent lending.</p>
            </div>
            <div className="flex gap-12">
              <div>
                <h4 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-3">Product</h4>
                <div className="space-y-2">
                  <a href="#features" className="block text-sm text-text hover:text-primary-600">Features</a>
                  <a href="#calculator" className="block text-sm text-text hover:text-primary-600">Calculator</a>
                  <a href="#how-it-works" className="block text-sm text-text hover:text-primary-600">How it Works</a>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-3">Legal</h4>
                <div className="space-y-2">
                  <a href="#" className="block text-sm text-text hover:text-primary-600">Privacy</a>
                  <a href="#" className="block text-sm text-text hover:text-primary-600">Terms</a>
                  <a href="#" className="block text-sm text-text hover:text-primary-600">FAQ</a>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-border text-center">
            <p className="text-sm text-text-muted">© 2024 DigitMonie. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
