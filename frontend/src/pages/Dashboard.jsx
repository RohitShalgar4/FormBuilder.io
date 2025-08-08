import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, FileText, Users, Calendar, Share2, Eye, Trash2, LogOut, User, Settings, Shield } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

const Dashboard = () => {
  const [forms, setForms] = useState([])
  const [loading, setLoading] = useState(true)
  const { user, logout, isAdmin } = useAuth()

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

  const deleteForm = async (id) => {
    if (!window.confirm('Are you sure you want to delete this form?')) return
    
    try {
      await axios.delete(`/api/forms/${id}`)
      toast.success('Form deleted successfully')
      fetchForms()
    } catch (error) {
      toast.error('Failed to delete form')
    }
  }

  const togglePublish = async (id, isPublished) => {
    try {
      await axios.patch(`/api/forms/${id}/publish`, { isPublished: !isPublished })
      toast.success(isPublished ? 'Form unpublished' : 'Form published')
      fetchForms()
    } catch (error) {
      toast.error('Failed to update form')
    }
  }

  const copyShareLink = (shareId) => {
    const shareUrl = `${window.location.origin}/form/${shareId}`
    navigator.clipboard.writeText(shareUrl)
    toast.success('Form link copied to clipboard! Share this link with users to allow them to respond.')
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
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
              <h1 className="text-3xl font-bold text-gray-900">Form Builder</h1>
              <p className="text-gray-600 mt-1">Welcome back, {user?.name}!</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Create New Form Button - Admin Only */}
              {isAdmin() && (
                <Link
                  to="/builder"
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus size={20} />
                  Create New Form
                </Link>
              )}

              {/* User Menu */}
              <div className="relative group">
                <button className="flex items-center gap-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-800">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden md:block">{user?.name}</span>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <div className="py-1">
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      <User size={16} />
                      Profile Settings
                    </Link>
                    {isAdmin() && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100"
                      >
                        <Shield size={16} />
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
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
            <p className="text-sm text-gray-600 mt-1">Share the form links with users to allow them to respond</p>
          </div>
          
          {forms.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No forms yet</h3>
              <p className="text-gray-600 mb-6">Get started by creating your first form</p>
              <Link to="/builder" className="btn-primary flex items-center gap-2 mx-auto w-fit">
                <Plus size={20} />
                Create Your First Form
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {forms.map((form) => (
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
                        to={`/builder/${form._id}`}
                        className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <FileText size={18} />
                      </Link>
                      
                      <Link
                        to={`/preview/${form._id}`}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Preview"
                      >
                        <Eye size={18} />
                      </Link>
                      
                      {form.isPublished && (
                        <button
                          onClick={() => copyShareLink(form.shareId)}
                          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Share"
                        >
                          <Share2 size={18} />
                        </button>
                      )}
                      
                      <Link
                        to={`/form-responses/${form._id}`}
                        className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="View Responses"
                      >
                        <Users size={18} />
                      </Link>
                      
                      <button
                        onClick={() => togglePublish(form._id, form.isPublished)}
                        className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                          form.isPublished
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {form.isPublished ? 'Unpublish' : 'Publish'}
                      </button>
                      
                      <button
                        onClick={() => deleteForm(form._id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
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

export default Dashboard