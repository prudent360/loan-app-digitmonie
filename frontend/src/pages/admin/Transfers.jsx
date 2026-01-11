import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layouts/AdminLayout'
import api from '../../services/api'
import { Search, CheckCircle, XCircle, Clock, Eye, X, Loader2 } from 'lucide-react'

export default function TransferRequests() {
  const [requests, setRequests] = useState([])
  const [stats, setStats] = useState({ pending: 0, approved: 0, total_approved: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [notes, setNotes] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchRequests()
  }, [filter])

  const fetchRequests = async () => {
    try {
      const res = await api.get('/admin/transfers', { params: { status: filter } })
      setRequests(res.data.requests.data || [])
      setStats(res.data.stats)
    } catch (err) {
      console.error('Failed to fetch transfers:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id) => {
    if (!confirm('Approve this transfer and credit the user\'s wallet?')) return
    await processRequest(id, 'approve')
  }

  const handleReject = async (id) => {
    const reason = prompt('Enter rejection reason:')
    if (!reason) return
    await processRequest(id, 'reject', reason)
  }

  const processRequest = async (id, action, notes = '') => {
    setProcessing(true)
    try {
      await api.post(`/admin/transfers/${id}/${action}`, { notes })
      fetchRequests()
      setSelectedRequest(null)
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed')
    } finally {
      setProcessing(false)
    }
  }

  const formatDate = (d) => new Date(d).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    }
    return `px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-text">Transfer Requests</h1>
            <p className="text-text-muted">Manage bank transfer funding requests</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-text-muted">Pending</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                <CheckCircle size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.approved}</p>
                <p className="text-sm text-text-muted">Approved</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-lg font-bold">₦</span>
              </div>
              <div>
                <p className="text-2xl font-bold">₦{Number(stats.total_approved).toLocaleString()}</p>
                <p className="text-sm text-text-muted">Total Approved</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {['', 'pending', 'approved', 'rejected'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === s ? 'bg-primary-600 text-white' : 'bg-muted text-text-muted hover:text-text'}`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={32} /></div>
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">User</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">Amount</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">Reference</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">Date</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(req => (
                  <tr key={req.id} className="border-t hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{req.user?.name}</p>
                      <p className="text-xs text-text-muted">{req.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold">₦{Number(req.amount).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm">{req.reference}</td>
                    <td className="px-4 py-3 text-sm text-text-muted">{formatDate(req.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={getStatusBadge(req.status)}>{req.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {req.proof_url && (
                          <a href={req.proof_url} target="_blank" className="p-2 hover:bg-muted rounded-lg" title="View Proof">
                            <Eye size={16} />
                          </a>
                        )}
                        {req.status === 'pending' && (
                          <>
                            <button onClick={() => handleApprove(req.id)} className="p-2 hover:bg-green-100 text-green-600 rounded-lg" disabled={processing}>
                              <CheckCircle size={16} />
                            </button>
                            <button onClick={() => handleReject(req.id)} className="p-2 hover:bg-red-100 text-red-600 rounded-lg" disabled={processing}>
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-text-muted">No transfer requests found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
