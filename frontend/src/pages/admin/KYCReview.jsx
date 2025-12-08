import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layouts/AdminLayout'
import { useToast } from '../../context/ToastContext'
import { adminAPI } from '../../services/api'
import { FileText, Eye, CheckCircle, XCircle, X, Loader2 } from 'lucide-react'

export default function AdminKYCReview() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const toast = useToast()

  // Fetch KYC documents from API
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const res = await adminAPI.getKYCDocuments()
        const docs = res.data.data || res.data.documents || res.data || []
        setDocuments(docs)
      } catch (err) {
        console.error('Failed to load KYC documents:', err)
        toast.error('Failed to load KYC documents')
      } finally {
        setLoading(false)
      }
    }
    loadDocuments()
  }, [])

  const filtered = documents.filter(d => statusFilter === 'all' || d.status === statusFilter)
  const getStatusBadge = (s) => ({ pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-error' }[s] || 'badge-warning')
  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '-'

  const handleApprove = async (id) => {
    setActionLoading(true)
    try {
      await adminAPI.approveKYC(id)
      setDocuments(prev => prev.map(d => d.id === id ? { ...d, status: 'approved' } : d))
      toast.success('Document approved')
      setSelectedDoc(null)
    } catch (err) {
      toast.error('Failed to approve document')
      console.error(err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async (id) => {
    if (!rejectReason.trim()) { toast.error('Provide reason'); return }
    setActionLoading(true)
    try {
      await adminAPI.rejectKYC(id, rejectReason)
      setDocuments(prev => prev.map(d => d.id === id ? { ...d, status: 'rejected' } : d))
      toast.success('Document rejected')
      setSelectedDoc(null)
      setRejectReason('')
    } catch (err) {
      toast.error('Failed to reject document')
      console.error(err)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return <AdminLayout><div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary-600" size={32} /></div></AdminLayout>
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-2xl font-semibold text-text">KYC Review</h1><p className="text-text-muted">Verify customer identity documents</p></div>
          <div className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium">{documents.filter(d => d.status === 'pending').length} Pending</div>
        </div>

        {/* Filters */}
        <div className="card flex flex-wrap gap-2">
          {['all', 'pending', 'approved', 'rejected'].map(s => (
            <button key={s} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${statusFilter === s ? 'bg-primary-600 text-white' : 'bg-muted text-text-muted hover:text-text'}`} onClick={() => setStatusFilter(s)}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
          ))}
        </div>

        {/* Documents Table */}
        <div className="card p-0">
          <table className="table">
            <thead><tr><th>User</th><th>Document Type</th><th>File</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="6" className="text-center text-text-muted py-8">No KYC documents found</td></tr>
              ) : (
                filtered.map((doc) => (
                  <tr key={doc.id}>
                    <td><p className="font-medium text-text text-sm">{doc.user?.name || 'Unknown'}</p><p className="text-xs text-text-muted">{doc.user?.email || '-'}</p></td>
                    <td className="text-text">{doc.document_type || doc.type || '-'}</td>
                    <td className="text-text-muted text-sm">{doc.file_name || doc.file_path?.split('/').pop() || '-'}</td>
                    <td className="text-text-muted">{formatDate(doc.created_at)}</td>
                    <td><span className={`badge ${getStatusBadge(doc.status)}`}>{doc.status || 'pending'}</span></td>
                    <td>
                      <div className="flex gap-1">
                        <button className="p-1.5 rounded text-text-muted hover:text-text hover:bg-muted" onClick={() => setSelectedDoc(doc)}><Eye size={16} /></button>
                        {(doc.status === 'pending' || !doc.status) && (
                          <>
                            <button className="p-1.5 rounded text-text-muted hover:text-primary-600 hover:bg-primary-50" onClick={() => handleApprove(doc.id)}><CheckCircle size={16} /></button>
                            <button className="p-1.5 rounded text-text-muted hover:text-red-600 hover:bg-red-50" onClick={() => setSelectedDoc({ ...doc, showReject: true })}><XCircle size={16} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Document Modal */}
        {selectedDoc && (
          <div className="modal-overlay" onClick={() => { setSelectedDoc(null); setRejectReason('') }}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header"><h3 className="font-semibold text-text">{selectedDoc.showReject ? 'Reject Document' : 'Document Details'}</h3><button onClick={() => { setSelectedDoc(null); setRejectReason('') }}><X size={20} /></button></div>
              <div className="modal-body">
                {selectedDoc.showReject ? (
                  <div className="form-group"><label className="form-label">Rejection Reason</label><textarea className="form-input" rows={4} placeholder="Explain why..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} /></div>
                ) : (
                  <>
                    <div className="text-center py-8 bg-muted rounded-lg mb-4"><FileText size={48} className="text-text-muted mx-auto" /><p className="mt-2 text-text-muted text-sm">{selectedDoc.file_name || selectedDoc.file_path?.split('/').pop() || 'Document'}</p></div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {[['Type', selectedDoc.document_type || selectedDoc.type], ['User', selectedDoc.user?.name || 'Unknown'], ['Status', <span className={`badge ${getStatusBadge(selectedDoc.status)}`}>{selectedDoc.status || 'pending'}</span>], ['Submitted', formatDate(selectedDoc.created_at)]].map(([l, v]) => (
                        <div key={l}><span className="text-text-muted">{l}</span><p className="font-medium text-text">{v}</p></div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                {selectedDoc.showReject ? (
                  <><button className="btn btn-outline" onClick={() => setSelectedDoc(null)} disabled={actionLoading}>Cancel</button><button className="btn btn-danger" onClick={() => handleReject(selectedDoc.id)} disabled={actionLoading}>{actionLoading ? 'Rejecting...' : 'Reject'}</button></>
                ) : (selectedDoc.status === 'pending' || !selectedDoc.status) && (
                  <><button className="btn btn-danger" onClick={() => setSelectedDoc({ ...selectedDoc, showReject: true })}>Reject</button><button className="btn btn-primary" onClick={() => handleApprove(selectedDoc.id)} disabled={actionLoading}>{actionLoading ? 'Approving...' : 'Approve'}</button></>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
