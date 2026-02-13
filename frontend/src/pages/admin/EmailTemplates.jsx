import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layouts/AdminLayout'
import { useToast } from '../../context/ToastContext'
import api from '../../services/api'
import { Mail, Edit2, RotateCcw, Eye, Loader2, Save, X, Code, CheckCircle, XCircle } from 'lucide-react'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'

export default function EmailTemplates() {
  const toast = useToast()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [templateForm, setTemplateForm] = useState({ subject: '', body: '', description: '', is_active: true })
  const [saving, setSaving] = useState(false)
  const [previewing, setPreviewing] = useState(null)
  const [previewData, setPreviewData] = useState(null)
  const [loadingPreview, setLoadingPreview] = useState(false)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/email-templates')
      setTemplates(res.data.templates || [])
    } catch (err) {
      toast.error('Failed to load email templates')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (id) => {
    try {
      await api.post(`/admin/email-templates/${id}/toggle`)
      setTemplates(prev => prev.map(t => t.id === id ? { ...t, is_active: !t.is_active } : t))
      toast.success('Status updated')
    } catch (err) {
      toast.error('Failed to update status')
    }
  }

  const handleEdit = (template) => {
    setEditingTemplate(template)
    setTemplateForm({
      subject: template.subject,
      body: template.body,
      description: template.description || '',
      is_active: template.is_active
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await api.put(`/admin/email-templates/${editingTemplate.id}`, templateForm)
      setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? res.data.template : t))
      toast.success('Template updated successfully')
      setEditingTemplate(null)
    } catch (err) {
      toast.error('Failed to update template')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async (id) => {
    if (!confirm('Are you sure you want to reset this template to its default content? This cannot be undone.')) return
    try {
      const res = await api.post(`/admin/email-templates/${id}/reset`)
      setTemplates(prev => prev.map(t => t.id === id ? res.data.template : t))
      toast.success('Template reset to default')
    } catch (err) {
      toast.error('Failed to reset template')
    }
  }

  const handlePreview = async (template) => {
    setPreviewing(template)
    setLoadingPreview(true)
    try {
      const res = await api.get(`/admin/email-templates/${template.id}/preview`)
      setPreviewData(res.data)
    } catch (err) {
      toast.error('Failed to generate preview')
    } finally {
      setLoadingPreview(false)
    }
  }

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
      <div className="max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-text">Email Templates</h1>
          <p className="text-text-muted">Manage system-wide email notifications and their content</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template.id} className="card hover:border-primary-300 transition-all flex flex-col h-full">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${template.is_active ? 'bg-primary-50 text-primary-600' : 'bg-muted text-text-muted'}`}>
                  <Mail size={24} />
                </div>
                <button
                  onClick={() => handleToggle(template.id)}
                  className={`relative inline-flex items-center cursor-pointer transition-opacity hover:opacity-80`}
                >
                  <div className={`w-10 h-5 rounded-full transition-colors ${template.is_active ? 'bg-primary-600' : 'bg-gray-300'}`}>
                    <div className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform ${template.is_active ? 'translate-x-5' : ''}`}></div>
                  </div>
                </button>
              </div>

              <div className="flex-grow">
                <h3 className="font-semibold text-lg text-text mb-1">{template.name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</h3>
                <p className="text-sm text-text-muted line-clamp-2 mb-4">{template.description || 'No description provided.'}</p>
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-xs font-medium text-text-muted uppercase tracking-wider">
                    <Code size={12} /> Placeholders
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(template.placeholders || []).map(p => (
                      <span key={p} className="text-[10px] bg-muted px-1.5 py-0.5 rounded border border-border text-text-muted font-mono">
                        {`{{${p}}}`}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-auto pt-4 border-t border-border">
                <button onClick={() => handleEdit(template)} className="btn btn-outline btn-sm flex-1">
                  <Edit2 size={14} /> Edit
                </button>
                <button onClick={() => handlePreview(template)} className="btn btn-outline btn-sm">
                  <Eye size={14} />
                </button>
                <button onClick={() => handleReset(template.id)} className="btn btn-outline btn-sm text-orange-600 hover:bg-orange-50" title="Reset to default">
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Edit Modal */}
        {editingTemplate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-2xl w-full max-w-4xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-text">Edit Template: {editingTemplate.name}</h2>
                  <p className="text-sm text-text-muted">{editingTemplate.description}</p>
                </div>
                <button onClick={() => setEditingTemplate(null)} className="text-text-muted hover:text-text p-2 hover:bg-muted rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 space-y-4">
                  <div className="form-group">
                    <label className="form-label font-semibold">Email Subject</label>
                    <input
                      type="text"
                      className="form-input"
                      value={templateForm.subject}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Enter email subject"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label font-semibold">Email Body (HTML supported)</label>
                    <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
                      <ReactQuill
                        theme="snow"
                        value={templateForm.body}
                        onChange={(content) => setTemplateForm(prev => ({ ...prev, body: content }))}
                        modules={{
                          toolbar: [
                            [{ 'header': [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ 'color': [] }, { 'background': [] }],
                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                            [{ 'align': [] }],
                            ['link', 'image'],
                            ['clean']
                          ]
                        }}
                        style={{ height: '350px' }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-4 bg-muted/30 rounded-xl border border-border">
                    <h4 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
                      <Code size={16} className="text-primary-600" />
                      Available Placeholders
                    </h4>
                    <div className="space-y-2">
                      {(editingTemplate.placeholders || []).map(p => (
                        <div key={p} className="flex flex-col gap-0.5">
                          <code 
                            className="bg-white px-2 py-1 rounded border text-primary-600 text-xs font-mono cursor-pointer hover:bg-primary-50 transition-colors"
                            onClick={() => {
                              // Optional: Copy to clipboard
                              navigator.clipboard.writeText(`{{${p}}}`)
                              toast.info(`Copied {{${p}}}`)
                            }}
                          >
                            {`{{${p}}}`}
                          </code>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-text-muted mt-4">Click a placeholder to copy it.</p>
                  </div>

                  <div className="flex flex-col gap-3 pt-6">
                    <button onClick={handleSave} disabled={saving} className="btn btn-primary w-full py-3">
                      {saving ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> Save Changes</>}
                    </button>
                    <button onClick={() => setEditingTemplate(null)} className="btn btn-outline w-full py-3">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {previewing && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-2xl w-full max-w-2xl p-6 shadow-xl max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-text">Template Preview</h2>
                <button onClick={() => setPreviewing(null)} className="text-text-muted hover:text-text">
                  <X size={20} />
                </button>
              </div>

              {loadingPreview ? (
                <div className="flex-grow flex items-center justify-center py-12">
                  <Loader2 className="animate-spin text-primary-600" size={32} />
                </div>
              ) : previewData ? (
                <div className="flex-grow overflow-y-auto space-y-4">
                  <div className="p-4 bg-muted/50 rounded-xl border border-border">
                    <div className="text-xs font-medium text-text-muted uppercase mb-1">Subject</div>
                    <div className="text-lg font-semibold text-text">{previewData.subject}</div>
                  </div>
                  <div className="p-1 border border-border rounded-xl bg-white min-h-[400px]">
                    <iframe 
                      srcDoc={previewData.body} 
                      className="w-full h-full min-h-[400px] border-none"
                      title="Email Preview"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex-grow flex items-center justify-center py-12 text-text-muted">
                  Failed to load preview.
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-border flex justify-end">
                <button onClick={() => setPreviewing(null)} className="btn btn-primary px-8">
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
