import { useState } from 'react'
import AdminLayout from '../../components/layouts/AdminLayout'
import { useToast } from '../../context/ToastContext'
import { FileText, Eye, CheckCircle, XCircle, X } from 'lucide-react'

const mockDocuments = [
  { id: 1, user: 'John Doe', email: 'john@example.com', type: 'National ID Card', file: 'national_id.jpg', status: 'pending', date: '2024-12-08' },
  { id: 2, user: 'Jane Smith', email: 'jane@example.com', type: 'Utility Bill', file: 'electricity_bill.pdf', status: 'pending', date: '2024-12-07' },
  { id: 3, user: 'Mike Johnson', email: 'mike@example.com', type: 'Bank Statement', file: 'bank_statement.pdf', status: 'approved', date: '2024-12-06' },
]

export default function AdminKYCReview() {
  const [documents, setDocuments] = useState(mockDocuments)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const toast = useToast()

  const filtered = documents.filter(d => statusFilter === 'all' || d.status === statusFilter)
  const getStatusBadge = (s) => ({ pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-error' }[s] || '')

  const handleApprove = (id) => { setDocuments(prev => prev.map(d => d.id === id ? { ...d, status: 'approved' } : d)); toast.success('Document approved'); setSelectedDoc(null) }
  const handleReject = (id) => { if (!rejectReason.trim()) { toast.error('Provide reason'); return }; setDocuments(prev => prev.map(d => d.id === id ? { ...d, status: 'rejected' } : d)); toast.success('Document rejected'); setSelectedDoc(null); setRejectReason('') }

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
              {filtered.map((doc) => (
                <tr key={doc.id}>
                  <td><p className="font-medium text-text text-sm">{doc.user}</p><p className="text-xs text-text-muted">{doc.email}</p></td>
                  <td className="text-text">{doc.type}</td>
                  <td className="text-text-muted text-sm">{doc.file}</td>
                  <td className="text-text-muted">{doc.date}</td>
                  <td><span className={`badge ${getStatusBadge(doc.status)}`}>{doc.status}</span></td>
                  <td>
                    <div className="flex gap-1">
                      <button className="p-1.5 rounded text-text-muted hover:text-text hover:bg-muted" onClick={() => setSelectedDoc(doc)}><Eye size={16} /></button>
                      {doc.status === 'pending' && (
                        <>
                          <button className="p-1.5 rounded text-text-muted hover:text-primary-600 hover:bg-primary-50" onClick={() => handleApprove(doc.id)}><CheckCircle size={16} /></button>
                          <button className="p-1.5 rounded text-text-muted hover:text-red-600 hover:bg-red-50" onClick={() => setSelectedDoc({ ...doc, showReject: true })}><XCircle size={16} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
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
                    <div className="text-center py-8 bg-muted rounded-lg mb-4"><FileText size={48} className="text-text-muted mx-auto" /><p className="mt-2 text-text-muted text-sm">{selectedDoc.file}</p></div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {[['Type', selectedDoc.type], ['User', selectedDoc.user], ['Status', <span className={`badge ${getStatusBadge(selectedDoc.status)}`}>{selectedDoc.status}</span>], ['Submitted', selectedDoc.date]].map(([l, v]) => (
                        <div key={l}><span className="text-text-muted">{l}</span><p className="font-medium text-text">{v}</p></div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                {selectedDoc.showReject ? (
                  <><button className="btn btn-outline" onClick={() => setSelectedDoc(null)}>Cancel</button><button className="btn btn-danger" onClick={() => handleReject(selectedDoc.id)}>Reject</button></>
                ) : selectedDoc.status === 'pending' && (
                  <><button className="btn btn-danger" onClick={() => setSelectedDoc({ ...selectedDoc, showReject: true })}>Reject</button><button className="btn btn-primary" onClick={() => handleApprove(selectedDoc.id)}>Approve</button></>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
