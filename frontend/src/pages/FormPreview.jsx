import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Share2, Eye } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

import CategorizePreview from '../components/previews/CategorizePreview'
import ClozePreview from '../components/previews/ClozePreview'
import ComprehensionPreview from '../components/previews/ComprehensionPreview'

const FormPreview = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchForm()
  }, [id])

  const fetchForm = async () => {
    try {
      const response = await axios.get(`/api/forms/${id}`)
      setForm(response.data)
    } catch (error) {
      toast.error('Form not found')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}/form/${form.shareId}`
    navigator.clipboard.writeText(shareUrl)
    toast.success('Share link copied to clipboard!')
  }

  const renderQuestion = (question) => {
    switch (question.type) {
      case 'categorize':
        return <CategorizePreview key={question.id} question={question} preview={true} />
      case 'cloze':
        return <ClozePreview key={question.id} question={question} preview={true} />
      case 'comprehension':
        return <ComprehensionPreview key={question.id} question={question} preview={true} />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Form not found</h2>
          <Link to="/" className="btn-primary">
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/builder/${id}`)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Preview: {form.title}</h1>
                <p className="text-sm text-gray-600">How your form will look to users</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={copyShareLink}
                className="flex items-center gap-2 btn-secondary"
              >
                <Share2 size={16} />
                Share Link
              </button>
              
              <Link
                to={`/form/${form.shareId}`}
                target="_blank"
                className="flex items-center gap-2 btn-primary"
              >
                <Eye size={16} />
                View Live Form
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Form Preview */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header Image */}
          {form.headerImage && (
            <div className="mb-6">
              <img
                src={`http://localhost:8080${form.headerImage}`}
                alt="Form Header"
                className="w-full h-48 object-cover rounded-lg shadow-sm"
              />
            </div>
          )}

          {/* Form Header */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{form.title}</h1>
            {form.description && (
              <p className="text-gray-600">{form.description}</p>
            )}
          </div>

          {/* Questions */}
          {form.questions.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <p className="text-gray-600">No questions added yet</p>
            </div>
          ) : (
            <div className="space-y-6">
              {form.questions.map((question, index) => (
                <div key={question.id} className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {index + 1}. {question.title}
                      {question.required && <span className="text-red-500 ml-1">*</span>}
                    </h3>
                    {question.description && (
                      <p className="text-gray-600 mb-4">{question.description}</p>
                    )}
                    {question.image && (
                      <img
                        src={`http://localhost:8080${question.image}`}
                        alt="Question"
                        className="w-full h-32 object-cover rounded-lg mb-4"
                      />
                    )}
                  </div>
                  {renderQuestion(question)}
                </div>
              ))}
            </div>
          )}

          {/* Preview Notice */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-center">
              <Eye size={16} className="inline mr-2" />
              This is a preview. Responses won't be saved.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FormPreview