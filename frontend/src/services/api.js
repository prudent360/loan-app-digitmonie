import axios from 'axios'

const API_URL = import.meta.env.PROD 
  ? 'https://app.digitmonie.com/api/public/api' 
  : '/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth APIs - routes are at /api/register, /api/login, etc.
export const authAPI = {
  register: (data) => api.post('/register', data),
  login: (data) => api.post('/login', data),
  logout: () => api.post('/logout'),
  getUser: () => api.get('/user'),
  forgotPassword: (email) => api.post('/forgot-password', { email }),
}

// Profile APIs - routes at /api/customer/profile
export const profileAPI = {
  get: () => api.get('/customer/profile'),
  update: (data) => api.put('/customer/profile', data),
  updatePassword: (data) => api.put('/customer/profile/password', data),
}

// KYC APIs - routes at /api/customer/kyc
export const kycAPI = {
  getDocuments: () => api.get('/customer/kyc'),
  uploadDocument: (formData) => api.post('/customer/kyc', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteDocument: (id) => api.delete(`/customer/kyc/${id}`),
}

// Loan APIs - routes at /api/customer/loans
export const loanAPI = {
  getAll: () => api.get('/customer/loans'),
  getOne: (id) => api.get(`/customer/loans/${id}`),
  apply: (data) => api.post('/customer/loans', data),
  getRepayments: (loanId) => api.get(`/customer/loans/${loanId}/repayments`),
  recordPayment: (loanId, data) => api.post(`/customer/loans/${loanId}/pay`, data),
}

// Dashboard APIs - routes at /api/customer/dashboard
export const dashboardAPI = {
  getStats: () => api.get('/customer/dashboard/stats'),
  getChartData: () => api.get('/customer/dashboard/chart'),
}

// Admin APIs
export const adminAPI = {
  // Dashboard
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  getDashboardChart: () => api.get('/admin/dashboard/chart'),
  
  // Users
  getUsers: (params) => api.get('/admin/users', { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  updateUserStatus: (id, status) => api.patch(`/admin/users/${id}/status`, { status }),
  
  // Loans
  getLoans: (params) => api.get('/admin/loans', { params }),
  getLoan: (id) => api.get(`/admin/loans/${id}`),
  approveLoan: (id) => api.post(`/admin/loans/${id}/approve`),
  rejectLoan: (id, reason) => api.post(`/admin/loans/${id}/reject`, { reason }),
  disburseLoan: (id) => api.post(`/admin/loans/${id}/disburse`),
  
  // KYC
  getKYCDocuments: (params) => api.get('/admin/kyc', { params }),
  approveKYC: (id) => api.post(`/admin/kyc/${id}/approve`),
  rejectKYC: (id, reason) => api.post(`/admin/kyc/${id}/reject`, { reason }),
  
  // Settings
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data) => api.put('/admin/settings', data),
}

// Currency API (public)
export const currencyAPI = {
  getActive: () => api.get('/currency'),
}

// Loan Settings API (public)
export const loanSettingsAPI = {
  get: () => api.get('/loan-settings'),
}

// Payment APIs
export const paymentAPI = {
  getConfig: () => api.get('/customer/payments/config'),
  initialize: (data) => api.post('/customer/payments/initialize', data),
  verify: (data) => api.post('/customer/payments/verify', data),
  getHistory: () => api.get('/customer/payments/history'),
}

// Virtual Cards APIs
export const virtualCardAPI = {
  getAll: () => api.get('/customer/cards'),
  getOne: (id) => api.get(`/customer/cards/${id}`),
  create: (data) => api.post('/customer/cards', data),
  fund: (id, amount) => api.post(`/customer/cards/${id}/fund`, { amount }),
  withdraw: (id, amount) => api.post(`/customer/cards/${id}/withdraw`, { amount }),
  toggleBlock: (id, action) => api.post(`/customer/cards/${id}/block`, { action }),
  terminate: (id) => api.delete(`/customer/cards/${id}`),
}

// Bill Payments APIs
export const billPaymentAPI = {
  getCategories: () => api.get('/customer/bills/categories'),
  getBillers: (category, country = 'NG') => api.get('/customer/bills/billers', { params: { category, country } }),
  getItems: (billerCode) => api.get('/customer/bills/items', { params: { biller_code: billerCode } }),
  validateCustomer: (data) => api.post('/customer/bills/validate', data),
  pay: (data) => api.post('/customer/bills/pay', data),
  getHistory: (params) => api.get('/customer/bills/history', { params }),
  getTransaction: (id) => api.get(`/customer/bills/${id}`),
}

// Wallet APIs
export const walletAPI = {
  getBalance: () => api.get('/customer/wallet'),
  getTransactions: (params) => api.get('/customer/wallet/transactions', { params }),
  initializeFunding: (amount) => api.post('/customer/wallet/fund', { amount }),
  verifyFunding: (reference, transactionId) => api.post('/customer/wallet/fund/verify', { reference, transaction_id: transactionId }),
}

// Receipt APIs
export const receiptAPI = {
  getBillReceiptUrl: (id) => `${API_URL}/customer/receipts/bill/${id}`,
  getWalletReceiptUrl: (id) => `${API_URL}/customer/receipts/wallet/${id}`,
  downloadBillReceipt: async (id) => {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_URL}/customer/receipts/bill/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `receipt-${id}.pdf`
    a.click()
    window.URL.revokeObjectURL(url)
  },
  downloadWalletReceipt: async (id) => {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_URL}/customer/receipts/wallet/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wallet-receipt-${id}.pdf`
    a.click()
    window.URL.revokeObjectURL(url)
  },
}

export default api

