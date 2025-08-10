import React, { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

import CategorizeForm from '../components/forms/CategorizeForm'
import ClozeForm from '../components/forms/ClozeForm'
import ComprehensionForm from '../components/forms/ComprehensionForm'
import NotFound from '../components/NotFound'

const FormFill = () => {
  const { shareId, formId, '*': catchAll } = useParams()
  const { user } = useAuth()
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [answers, setAnswers] = useState({})
  const [errors, setErrors] = useState({})

  // Get the actual formId from various possible sources
  const actualFormId = formId || (catchAll && catchAll.match(/^[0-9a-fA-F]{24}$/) ? catchAll : null)

  useEffect(() => {
    fetchForm()
  }, [shareId, actualFormId])

  const fetchForm = async () => {
    try {
      console.log('🔍 Fetching form with params:', { shareId, formId, actualFormId, catchAll })
      console.log('🌐 Current URL:', window.location.href)
      console.log('🔗 API Base URL:', axios.defaults.baseURL || 'Not set (using relative URLs)')
      
      let response
      if (actualFormId) {
        // Fetch by MongoDB ObjectId using public endpoint
        console.log('📡 Fetching by formId:', actualFormId)
        response = await axios.get(`/api/forms/public/${actualFormId}`)
      } else if (shareId) {
        // Fetch by shareId
        console.log('📡 Fetching by shareId:', shareId)
        response = await axios.get(`/api/forms/share/${shareId}`)
      } else {
        console.error('❌ No valid form identifier found')
        setLoading(false)
        return
      }
      
      console.log('✅ Form fetched successfully:', response.data)
      setForm(response.data)
    } catch (error) {
      console.error('❌ Error fetching form:', error)
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      })
      setForm(null) // Set form to null to trigger NotFound display
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = useCallback((questionId, answer) => {
    console.log('📝 Answer changed for question:', questionId, 'Answer:', answer)
    setAnswers(prev => {
      if (JSON.stringify(prev[questionId]) === JSON.stringify(answer)) {
        return prev // No change, prevent update
      }
      
      const newAnswers = {
        ...prev,
        [questionId]: answer
      }
      console.log('📋 Updated answers state:', newAnswers)
      return newAnswers
    })
    
    // Clear error for this question
    setErrors(prev => {
      if (prev[questionId]) {
        return {
          ...prev,
          [questionId]: null
        }
      }
      return prev
    })
  }, [])

  const validateAnswers = () => {
    const newErrors = {}
    
    // Safety check for form and questions
    if (!form || !form.questions) {
      return false
    }
    
    form.questions.forEach(question => {
      // Skip validation for questions without proper data
      if (!question || !question.id) {
        return
      }
      
      const answer = answers[question.id]
      let isEmpty = false
      
      // Check different answer types
      if (!answer) {
        isEmpty = true
      } else if (Array.isArray(answer)) {
        isEmpty = answer.length === 0
      } else if (typeof answer === 'object') {
        // For categorize questions, check if any categories have items
        if (question.type === 'categorize') {
          isEmpty = Object.keys(answer).length === 0 || 
                   Object.values(answer).every(items => !items || items.length === 0)
        } else if (question.type === 'cloze') {
          // For cloze questions, check if all blanks are filled
          const textContent = question.settings?.text || ''
          const blankCount = (textContent.match(/\[(.*?)\]/g) || []).length
          const filledBlanks = Object.values(answer).filter(val => val && val.trim()).length
          isEmpty = filledBlanks < blankCount
        } else {
          isEmpty = Object.keys(answer).length === 0
        }
      }
      
      if (question.required && isEmpty) {
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

  const renderQuestion = useCallback((question, index) => {
    const hasError = errors[question.id]
    
    // Safety check for question data
    if (!question || !question.settings) {
      return (
        <div key={question?.id || index} className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-gray-500">Question data is loading...</div>
        </div>
      )
    }
    
    const commonProps = {
      question,
      answer: answers[question.id] || (question.type === 'categorize' || question.type === 'cloze' ? {} : ''),
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
        questionComponent = <div className="text-gray-500">Unknown question type: {question.type}</div>
    }

    return (
      <div key={question.id} className={`bg-white rounded-lg shadow-sm border p-6 ${hasError ? 'border-red-300' : ''}`}>
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {index + 1}. {question.title || 'Untitled Question'}
            {question.required && <span className="text-red-500 ml-1">*</span>}
          </h3>
          {question.description && (
            <p className="text-gray-600 mb-4">{question.description}</p>
          )}
          {question.image && (
            <img
              src={`https://formbuilder-io.onrender.com${question.image}`}
              alt="Question"
              className="w-full h-32 object-cover rounded-lg mb-4"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
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
  }, [answers, errors, handleAnswerChange])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!form) {
    return <NotFound message="Form not found or not published. Please check the URL and try again." />
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
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            {/* Header Image */}
            {form.headerImage && (
              <div className="mb-6">
                <img
                  src={`https://formbuilder-io.onrender.com${form.headerImage}`}
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
              {form.questions && form.questions.length > 0 ? (
                form.questions.map((question, index) => renderQuestion(question, index))
              ) : (
                <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
                  <p className="text-gray-500">No questions found in this form.</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
                <button
                  type="submit"
                  disabled={submitting || !form.questions || form.questions.length === 0}
                  className="btn-primary w-full sm:w-auto px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Form'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DndProvider>
  )
}

export default FormFill