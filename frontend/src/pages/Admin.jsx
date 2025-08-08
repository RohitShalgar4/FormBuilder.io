import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, UserCheck, UserX, Edit, Trash2, Shield, Mail, Calendar, Plus, FileText, Search, Eye, Download } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

const Admin = () => {
  const [forms, setForms] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    fetchForms()
  }, [])

  const fetchForms = async () => {
    try {
      const response = await axios.get('/api/forms')
      setForms(response.data)
    } catch (error) {
      toast.error('Failed to fetch forms')
    } finally {
      setLoading(false)
    }
  }

  const filteredForms = forms.filter(form =>
    form.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const copyShareLink = (shareId) => {
    const shareUrl = `${window.location.origin}/form/${shareId}`
    navigator.clipboard.writeText(shareUrl)
    toast.success('Form link copied to clipboard!')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Form Management</h1>
              <p className="text-gray-600 mt-1">Manage your forms and view responses</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Create New Form Button */}
              <Link
                to="/builder"
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={20} />
                Create New Form
              </Link>

              {/* Back to Dashboard */}
              <Link
                to="/"
                className="btn-secondary flex items-center gap-2"
              >
                <FileText size={20} />
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search forms by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-primary-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Forms</p>
                <p className="text-2xl font-bold text-gray-900">{forms.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Published</p>
                <p className="text-2xl font-bold text-gray-900">
                  {forms.filter(form => form.isPublished).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {forms.filter(form => {
                    const formDate = new Date(form.createdAt)
                    const now = new Date()
                    return formDate.getMonth() === now.getMonth() && 
                           formDate.getFullYear() === now.getFullYear()
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Forms List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Your Forms</h2>
            <p className="text-sm text-gray-600 mt-1">Manage and view responses for your forms</p>
          </div>
          
          {filteredForms.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No forms found' : 'No forms yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm ? 'Try adjusting your search terms' : 'Get started by creating your first form'}
              </p>
              {!searchTerm && (
                <Link to="/builder" className="btn-primary flex items-center gap-2 mx-auto w-fit">
                  <Plus size={20} />
                  Create Your First Form
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filteredForms.map((form) => (
                <div key={form._id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-medium text-gray-900">
                          {form.title || 'Untitled Form'}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          form.isPublished 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {form.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-1">
                        {form.description || 'No description'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Created {new Date(form.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/form-responses/${form._id}`}
                        className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="View Responses"
                      >
                        <Eye size={18} />
                      </Link>
                      
                      {form.isPublished && (
                        <button
                          onClick={() => copyShareLink(form.shareId)}
                          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Share"
                        >
                          <FileText size={18} />
                        </button>
                      )}
                      
                      <Link
                        to={`/form-export/${form._id}`}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Export Data"
                      >
                        <Download size={18} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>


      </div>
    </div>
  )
}

export default Admin 