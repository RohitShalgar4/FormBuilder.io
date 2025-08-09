import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle, AlertCircle } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

import CategorizeForm from '../components/forms/CategorizeForm'
import ClozeForm from '../components/forms/ClozeForm'
import ComprehensionForm from '../components/forms/ComprehensionForm'

const FormFill = () => {
  const { shareId } = useParams()
  const { user } = useAuth()
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [answers, setAnswers] = useState({})
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchForm()
  }, [shareId])

  const fetchForm = async () => {
    try {
      const response = await axios.get(`/api/forms/share/${shareId}`)
      setForm(response.data)
    } catch (error) {
      toast.error('Form not found or not published')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
    
    // Clear error for this question
    if (errors[questionId]) {
      setErrors(prev => ({
        ...prev,
        [questionId]: null
      }))
    }
  }

  const validateAnswers = () => {
    const newErrors = {}
    
    form.questions.forEach(question => {
      if (question.required && (!answers[question.id] || 
          (Array.isArray(answers[question.id]) && answers[question.id].length === 0) ||
          (typeof answers[question.id] === 'object' && Object.keys(answers[question.id]).length === 0))) {
        newErrors[question.id] = 'This question is required'
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateAnswers()) {
      toast.error('Please answer all required questions')
      return
    }
    
    setSubmitting(true)
    try {
      const responseData = {
        formId: form._id,
        answers: Object.entries(answers).map(([questionId, answer]) => {
          const question = form.questions.find(q => q.id === questionId)
          return {
            questionId,
            questionType: question.type,
            answer
          }
        })
      }
      
      console.log('📤 Submitting form data:', JSON.stringify(responseData, null, 2));
      
      // Use authenticated route if user is logged in, otherwise use public route
      const endpoint = user ? '/api/responses/authenticated' : '/api/responses'
      const response = await axios.post(endpoint, responseData)
      console.log('📥 Response received:', response.data);
      setSubmitted(true)
      toast.success('Form submitted successfully!')
    } catch (error) {
      console.error('Form submission error:', error)
      toast.error('Failed to submit form')
    } finally {
      setSubmitting(false)
    }
  }

  const renderQuestion = (question, index) => {
    const hasError = errors[question.id]
    
    const commonProps = {
      question,
      answer: answers[question.id],
      onChange: (answer) => handleAnswerChange(question.id, answer),
      error: hasError
    }

    let questionComponent
    switch (question.type) {
      case 'categorize':
        questionComponent = <CategorizeForm {...commonProps} />
        break
      case 'cloze':
        questionComponent = <ClozeForm {...commonProps} />
        break
      case 'comprehension':
        questionComponent = <ComprehensionForm {...commonProps} />
        break
      default:
        questionComponent = <div className="text-gray-500">Unknown question type</div>
    }

    return (
      <div key={question.id} className={`bg-white rounded-lg shadow-sm border p-6 ${hasError ? 'border-red-300' : ''}`}>
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
        
        {questionComponent}
        
        {hasError && (
          <div className="flex items-center gap-2 text-red-600 text-sm mt-2">
            <AlertCircle size={16} />
            {hasError}
          </div>
        )}
      </div>
    )
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
          <p className="text-gray-600">This form may have been unpublished or deleted.</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center bg-white rounded-lg shadow-sm p-8">
          <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank you!</h2>
          <p className="text-gray-600">Your response has been submitted successfully.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {form.questions.map((question, index) => renderQuestion(question, index))}

            {/* Submit Button */}
            <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full sm:w-auto px-8 py-3 text-lg"
              >
                {submitting ? 'Submitting...' : 'Submit Form'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default FormFill