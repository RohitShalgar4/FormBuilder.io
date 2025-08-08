import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save, Eye, ArrowLeft, Image, Plus } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

import FormEditor from '../components/FormEditor'
import QuestionLibrary from '../components/QuestionLibrary'
import ImageUpload from '../components/ImageUpload'

const FormBuilder = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = !!id

  const [form, setForm] = useState({
    title: 'Untitled Form',
    description: '',
    headerImage: '',
    questions: [],
    isPublished: false
  })
  
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [showImageUpload, setShowImageUpload] = useState(false)

  useEffect(() => {
    if (isEditing) {
      fetchForm()
    }
  }, [id])

  const fetchForm = async () => {
    try {
      const response = await axios.get(`/api/forms/${id}`)
      setForm(response.data)
    } catch (error) {
      toast.error('Failed to fetch form')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const saveForm = async () => {
    if (!form.title.trim()) {
      toast.error('Please enter a form title')
      return
    }

    setSaving(true)
    try {
      if (isEditing) {
        await axios.put(`/api/forms/${id}`, form)
        toast.success('Form updated successfully')
      } else {
        const response = await axios.post('/api/forms', form)
        navigate(`/builder/${response.data._id}`, { replace: true })
        toast.success('Form created successfully')
      }
    } catch (error) {
      toast.error('Failed to save form')
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = (imageUrl) => {
    setForm(prev => ({ ...prev, headerImage: imageUrl }))
    setShowImageUpload(false)
    toast.success('Header image updated')
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
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  className="text-xl font-semibold bg-transparent border-none outline-none focus:bg-white focus:border focus:border-gray-300 focus:rounded px-2 py-1"
                  placeholder="Form Title"
                />
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  className="block text-sm text-gray-600 bg-transparent border-none outline-none focus:bg-white focus:border focus:border-gray-300 focus:rounded px-2 py-1 mt-1"
                  placeholder="Form Description"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowImageUpload(true)}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Image size={16} />
                Header Image
              </button>
              
              {isEditing && (
                <button
                  onClick={() => navigate(`/preview/${id}`)}
                  className="flex items-center gap-2 btn-secondary"
                >
                  <Eye size={16} />
                  Preview
                </button>
              )}
              
              <button
                onClick={saveForm}
                disabled={saving}
                className="btn-primary flex items-center gap-2"
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Form'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Library */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <QuestionLibrary />
            </div>
          </div>

          {/* Form Editor */}
          <div className="lg:col-span-3">
            <FormEditor
              form={form}
              setForm={setForm}
            />
          </div>
        </div>
      </div>

      {/* Image Upload Modal */}
      {showImageUpload && (
        <ImageUpload
          onUpload={handleImageUpload}
          onClose={() => setShowImageUpload(false)}
          title="Upload Header Image"
        />
      )}
    </div>
  )
}

export default FormBuilder