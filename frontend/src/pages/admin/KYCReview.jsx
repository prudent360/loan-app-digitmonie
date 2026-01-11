import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layouts/AdminLayout'
import { useToast } from '../../context/ToastContext'
import { adminAPI } from '../../services/api'
import { FileText, Eye, CheckCircle, XCircle, X, Loader2, User, ChevronRight, ArrowLeft, Download, ExternalLink } from 'lucide-react'

export default function AdminKYCReview() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
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

  // Group documents by user
  const userGroups = documents.reduce((acc, doc) => {
    const userId = doc.user?.id || doc.user_id || 'unknown'
    if (!acc[userId]) {
      acc[userId] = {
        user: doc.user || { id: userId, name: 'Unknown', email: '-' },
        documents: [],
        pendingCount: 0,
        approvedCount: 0,
        rejectedCount: 0
      }
    }
    acc[userId].documents.push(doc)
    if (doc.status === 'pending' || !doc.status) acc[userId].pendingCount++
    else if (doc.status === 'approved') acc[userId].approvedCount++
    else if (doc.status === 'rejected') acc[userId].rejectedCount++
    return acc
  }, {})

  const users = Object.values(userGroups)
  
  // Filter users based on status filter
  const filteredUsers = users.filter(u => {
    if (statusFilter === 'all') return true
    if (statusFilter === 'pending') return u.pendingCount > 0
    if (statusFilter === 'approved') return u.approvedCount > 0 && u.pendingCount === 0
    if (statusFilter === 'rejected') return u.rejectedCount > 0
    return true
  })

  const totalPending = documents.filter(d => d.status === 'pending' || !d.status).length
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
    if (!rejectReason.trim()) { toast.error('Provide rejection reason'); return }
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

  const handleApproveAll = async (userDocs) => {
    const pendingDocs = userDocs.filter(d => d.status === 'pending' || !d.status)
    if (pendingDocs.length === 0) return
    
    setActionLoading(true)
    try {
      for (const doc of pendingDocs) {
        await adminAPI.approveKYC(doc.id)
      }
      setDocuments(prev => prev.map(d => 
        pendingDocs.some(pd => pd.id === d.id) ? { ...d, status: 'approved' } : d
      ))
      toast.success(`${pendingDocs.length} document(s) approved`)
    } catch (err) {
      toast.error('Failed to approve some documents')
      console.error(err)
    } finally {
      setActionLoading(false)
    }
  }

  // Get user's documents (updated after state changes)
  const selectedUserDocs = selectedUser 
    ? documents.filter(d => (d.user?.id || d.user_id) === selectedUser.user.id)
    : []

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-text">KYC Review</h1>
            <p className="text-text-muted">Verify customer identity documents</p>
          </div>
          <div className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium">
            {totalPending} Pending Documents
          </div>
        </div>

        {/* Filters */}
        <div className="card flex flex-wrap gap-2">
          {['all', 'pending', 'approved', 'rejected'].map(s => (
            <button 
              key={s} 
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                statusFilter === s 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-muted text-text-muted hover:text-text'
              }`} 
              onClick={() => setStatusFilter(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Users List */}
        <div className="card p-0">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-medium text-text">Users with KYC Documents</h2>
            <p className="text-sm text-text-muted">{filteredUsers.length} users found</p>
          </div>
          
          {filteredUsers.length === 0 ? (
            <div className="text-center text-text-muted py-12">
              <User size={40} className="mx-auto mb-3 text-gray-300" />
              <p>No users found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredUsers.map((userGroup) => (
                <div 
                  key={userGroup.user.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedUser(userGroup)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-medium text-lg">
                      {(userGroup.user.name || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-text">{userGroup.user.name || 'Unknown'}</p>
                      <p className="text-sm text-text-muted">{userGroup.user.email || '-'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                      {userGroup.pendingCount > 0 && (
                        <span className="badge badge-warning">{userGroup.pendingCount} pending</span>
                      )}
                      {userGroup.approvedCount > 0 && (
                        <span className="badge badge-success">{userGroup.approvedCount} approved</span>
                      )}
                      {userGroup.rejectedCount > 0 && (
                        <span className="badge badge-error">{userGroup.rejectedCount} rejected</span>
                      )}
                    </div>
                    <ChevronRight size={20} className="text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Documents Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-xl" onClick={e => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setSelectedUser(null)}
                    className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-medium">
                      {(selectedUser.user.name || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-text">{selectedUser.user.name || 'Unknown'}</h3>
                      <p className="text-sm text-text-muted">{selectedUser.user.email || '-'}</p>
                    </div>
                  </div>
                </div>
                
                {selectedUserDocs.some(d => d.status === 'pending' || !d.status) && (
                  <button 
                    className="btn btn-primary text-sm"
                    onClick={() => handleApproveAll(selectedUserDocs)}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Processing...' : 'Approve All Pending'}
                  </button>
                )}
              </div>
              
              {/* Documents List */}
              <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
                <h4 className="font-medium text-text mb-4">Uploaded Documents ({selectedUserDocs.length})</h4>
                
                <div className="space-y-3">
                  {selectedUserDocs.map((doc) => (
                    <div 
                      key={doc.id}
                      className="border border-gray-200 rounded-xl p-4 hover:border-purple-200 hover:bg-purple-50/30 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <FileText size={24} className="text-gray-500" />
                          </div>
                          <div>
                            <p className="font-medium text-text">{doc.document_type || doc.type || 'Document'}</p>
                            <p className="text-sm text-text-muted">{doc.file_name || doc.file_path?.split('/').pop() || 'No filename'}</p>
                            <p className="text-xs text-text-muted mt-1">Uploaded: {formatDate(doc.created_at)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className={`badge ${getStatusBadge(doc.status)}`}>
                            {doc.status || 'pending'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Document Actions */}
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                        <div className="flex gap-2">
                          {doc.file_url && (
                            <>
                              <a 
                                href={doc.file_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="btn btn-sm btn-outline flex items-center gap-1"
                              >
                                <ExternalLink size={14} /> View
                              </a>
                              <a 
                                href={doc.file_url} 
                                download
                                className="btn btn-sm btn-outline flex items-center gap-1"
                              >
                                <Download size={14} /> Download
                              </a>
                            </>
                          )}
                          <button 
                            className="btn btn-sm btn-outline flex items-center gap-1"
                            onClick={() => setSelectedDoc(doc)}
                          >
                            <Eye size={14} /> Details
                          </button>
                        </div>
                        
                        {(doc.status === 'pending' || !doc.status) && (
                          <div className="flex gap-2">
                            <button 
                              className="btn btn-sm btn-outline text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => setSelectedDoc({ ...doc, showReject: true })}
                            >
                              <XCircle size={14} /> Reject
                            </button>
                            <button 
                              className="btn btn-sm btn-primary"
                              onClick={() => handleApprove(doc.id)}
                              disabled={actionLoading}
                            >
                              <CheckCircle size={14} /> Approve
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Document Detail / Reject Modal */}
        {selectedDoc && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => { setSelectedDoc(null); setRejectReason('') }}>
            <div className="bg-white rounded-xl w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h3 className="font-semibold text-text">
                  {selectedDoc.showReject ? 'Reject Document' : 'Document Details'}
                </h3>
                <button 
                  onClick={() => { setSelectedDoc(null); setRejectReason('') }}
                  className="p-1 rounded hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-4">
                {selectedDoc.showReject ? (
                  <div className="form-group">
                    <label className="form-label">Rejection Reason</label>
                    <textarea 
                      className="form-input" 
                      rows={4} 
                      placeholder="Explain why this document is being rejected..."
                      value={rejectReason} 
                      onChange={(e) => setRejectReason(e.target.value)} 
                    />
                  </div>
                ) : (
                  <>
                    <div className="text-center py-6 bg-gray-50 rounded-lg mb-4">
                      <FileText size={48} className="text-gray-400 mx-auto" />
                      <p className="mt-2 text-text-muted text-sm">
                        {selectedDoc.file_name || selectedDoc.file_path?.split('/').pop() || 'Document'}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-text-muted">Type</span>
                        <p className="font-medium text-text">{selectedDoc.document_type || selectedDoc.type || '-'}</p>
                      </div>
                      <div>
                        <span className="text-text-muted">Status</span>
                        <p><span className={`badge ${getStatusBadge(selectedDoc.status)}`}>{selectedDoc.status || 'pending'}</span></p>
                      </div>
                      <div>
                        <span className="text-text-muted">Submitted</span>
                        <p className="font-medium text-text">{formatDate(selectedDoc.created_at)}</p>
                      </div>
                      <div>
                        <span className="text-text-muted">User</span>
                        <p className="font-medium text-text">{selectedDoc.user?.name || 'Unknown'}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              <div className="flex justify-end gap-2 p-4 border-t border-gray-100">
                {selectedDoc.showReject ? (
                  <>
                    <button 
                      className="btn btn-outline" 
                      onClick={() => setSelectedDoc(null)} 
                      disabled={actionLoading}
                    >
                      Cancel
                    </button>
                    <button 
                      className="btn btn-danger" 
                      onClick={() => handleReject(selectedDoc.id)} 
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Rejecting...' : 'Reject Document'}
                    </button>
                  </>
                ) : (selectedDoc.status === 'pending' || !selectedDoc.status) && (
                  <>
                    <button 
                      className="btn btn-outline text-red-600 border-red-200 hover:bg-red-50" 
                      onClick={() => setSelectedDoc({ ...selectedDoc, showReject: true })}
                    >
                      Reject
                    </button>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => handleApprove(selectedDoc.id)} 
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Approving...' : 'Approve'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
