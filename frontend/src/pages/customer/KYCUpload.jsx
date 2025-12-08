import { useState, useCallback, useEffect } from 'react'
import CustomerLayout from '../../components/layouts/CustomerLayout'
import { useToast } from '../../context/ToastContext'
import { kycAPI } from '../../services/api'
import { Upload, FileText, X, CheckCircle2, Clock, XCircle, AlertCircle, Loader2 } from 'lucide-react'

const documentTypes = [
  { id: 'id_card', name: 'National ID Card', description: 'Valid Nigerian National ID' },
  { id: 'passport', name: 'International Passport', description: 'Valid passport with bio data page' },
  { id: 'utility_bill', name: 'Utility Bill', description: 'Recent electricity or water bill (max 3 months old)' },
  { id: 'bank_statement', name: 'Bank Statement', description: 'Last 6 months bank statement' },
]

export default function KYCUpload() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedType, setSelectedType] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const toast = useToast()

  // Fetch existing documents on mount
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const res = await kycAPI.getDocuments()
        setDocuments(res.data || [])
      } catch (err) {
        console.error('Failed to load documents:', err)
      } finally {
        setLoading(false)
      }
    }
    loadDocuments()
  }, [])

  const handleDragOver = useCallback((e) => { e.preventDefault(); setDragOver(true) }, [])
  const handleDragLeave = useCallback((e) => { e.preventDefault(); setDragOver(false) }, [])
  const handleDrop = useCallback((e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFileUpload(e.dataTransfer.files[0]) }, [selectedType])

  const handleFileUpload = async (file) => {
    if (!selectedType) { toast.error('Please select a document type first'); return }
    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) { toast.error('Only JPG, PNG, and PDF allowed'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('File size must be less than 5MB'); return }
    
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('document_type', selectedType)
      formData.append('file', file)
      
      const res = await kycAPI.uploadDocument(formData)
      setDocuments(prev => [...prev, res.data.document])
      setSelectedType('')
      toast.success('Document uploaded successfully!')
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to upload document'
      toast.error(message)
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (docId) => {
    try {
      await kycAPI.deleteDocument(docId)
      setDocuments(prev => prev.filter(d => d.id !== docId))
      toast.success('Document deleted')
    } catch (err) {
      toast.error('Failed to delete document')
      console.error(err)
    }
  }

  const getStatus = (s) => ({ pending: { icon: Clock, color: 'text-amber-600', badge: 'badge-warning' }, approved: { icon: CheckCircle2, color: 'text-primary-600', badge: 'badge-success' }, rejected: { icon: XCircle, color: 'text-red-600', badge: 'badge-error' } }[s] || { icon: Clock, color: 'text-amber-600', badge: 'badge-warning' })
  const kycProgress = Math.round((documents.filter(d => d.status === 'approved').length / documentTypes.length) * 100)

  if (loading) {
    return <CustomerLayout><div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary-600" size={32} /></div></CustomerLayout>
  }

  return (
    <CustomerLayout>
      <div className="max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-2xl font-semibold text-text">KYC Documents</h1><p className="text-text-muted">Upload your documents for verification</p></div>
          <div className="card px-4 py-3">
            <div className="flex justify-between text-xs mb-1.5"><span className="text-text-muted">Verification Progress</span><span className="text-primary-600 font-medium">{kycProgress}%</span></div>
            <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary-600 rounded-full" style={{ width: `${kycProgress}%` }} /></div>
          </div>
        </div>

        {/* Required Documents */}
        <div className="card">
          <h3 className="text-sm font-medium text-text mb-4">Required Documents</h3>
          <div className="space-y-3">
            {documentTypes.map((dt) => {
              const uploaded = documents.find(d => d.document_type === dt.id)
              const status = uploaded && getStatus(uploaded.status)
              const Icon = status?.icon || Clock
              return (
                <div key={dt.id} className={`flex items-center gap-4 p-4 rounded-lg border ${uploaded ? 'border-primary-200 bg-primary-50/50' : 'border-border bg-muted/30'}`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${uploaded ? 'bg-primary-100' : 'bg-muted'}`}>
                    {uploaded ? <Icon size={20} className={status.color} /> : <FileText size={20} className="text-text-muted" />}
                  </div>
                  <div className="flex-1"><p className="font-medium text-text text-sm">{dt.name}</p><p className="text-xs text-text-muted">{dt.description}</p></div>
                  <span className={`badge ${uploaded ? status.badge : 'bg-muted text-text-muted'}`}>{uploaded ? uploaded.status : 'Required'}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Upload Section */}
        <div className="card">
          <h3 className="text-sm font-medium text-text mb-4">Upload Document</h3>
          <div className="form-group">
            <label className="form-label">Document Type</label>
            <select className="form-input form-select" value={selectedType} onChange={e => setSelectedType(e.target.value)}>
              <option value="">Select document type</option>
              {documentTypes.map(t => <option key={t.id} value={t.id} disabled={documents.some(d => d.document_type === t.id && d.status !== 'rejected')}>{t.name} {documents.some(d => d.document_type === t.id && d.status !== 'rejected') ? '(Already uploaded)' : ''}</option>)}
            </select>
          </div>
          <div className={`border-2 border-dashed rounded-lg p-10 text-center transition-all ${dragOver ? 'border-primary-500 bg-primary-50' : selectedType ? 'border-border hover:border-primary-400' : 'border-border opacity-50'} ${!selectedType && 'cursor-not-allowed'}`}
            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            <input type="file" id="file-input" accept=".jpg,.jpeg,.png,.pdf" onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} disabled={!selectedType || uploading} className="hidden" />
            <label htmlFor="file-input" className={selectedType ? 'cursor-pointer' : 'cursor-not-allowed'}>
              {uploading ? <Loader2 size={32} className="animate-spin text-primary-600 mx-auto mb-3" /> : <Upload size={32} className="text-text-muted mx-auto mb-3" />}
              <p className="font-medium text-text text-sm">{uploading ? 'Uploading...' : 'Drag & drop or click to upload'}</p>
              <p className="text-xs text-text-muted mt-1">JPG, PNG, PDF (max 5MB)</p>
              {!selectedType && <p className="text-xs text-amber-600 mt-2">Please select a document type first</p>}
            </label>
          </div>
        </div>

        {/* Uploaded Documents */}
        <div className="card">
          <h3 className="text-sm font-medium text-text mb-4">Uploaded Documents</h3>
          {documents.length === 0 ? (
            <div className="text-center py-10 text-text-muted"><FileText size={32} className="mx-auto mb-2 opacity-40" /><p className="text-sm">No documents uploaded yet</p></div>
          ) : (
            <div className="space-y-2">
              {documents.map(doc => {
                const dt = documentTypes.find(t => t.id === doc.document_type)
                const status = getStatus(doc.status)
                return (
                  <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border text-sm">
                    <FileText size={18} className="text-text-muted" />
                    <div className="flex-1 min-w-0"><p className="font-medium text-text">{dt?.name || doc.document_type}</p><p className="text-xs text-text-muted truncate">{doc.file_name}</p></div>
                    <span className={`badge ${status.badge}`}>{doc.status}</span>
                    {doc.status !== 'approved' && <button className="text-text-muted hover:text-red-600" onClick={() => handleDelete(doc.id)}><X size={16} /></button>}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex gap-3 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm">
          <AlertCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div><p className="font-medium text-blue-800">Document Verification</p><p className="text-blue-600 text-xs mt-0.5">Documents are typically reviewed within 24 hours. You'll receive an email notification once verified.</p></div>
        </div>
      </div>
    </CustomerLayout>
  )
}
