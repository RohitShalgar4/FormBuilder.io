import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Download, FileText, Calendar, Clock, User } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const ResponseDetails = () => {
  const { responseId } = useParams()
  const [response, setResponse] = useState(null)
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchResponseDetails()
  }, [responseId])

  const fetchResponseDetails = async () => {
    try {
      const responseData = await axios.get(`/api/responses/${responseId}`)
      setResponse(responseData.data)
      
      // formId should be populated from the backend
      if (responseData.data.formId) {
        setForm(responseData.data.formId)
      }
    } catch (error) {
      console.error('Error fetching response details:', error)
      toast.error('Failed to fetch response details')
    } finally {
      setLoading(false)
    }
  }

  const exportResponse = async () => {
    try {
      console.log('📊 Starting response export:', responseId)
      
      const response = await axios.get(`/api/responses/export-single/${responseId}`, {
        responseType: 'blob'
      })
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      // Ensure responseId is a string and get last 8 characters
      const responseIdStr = responseId.toString()
      link.setAttribute('download', `response-${responseIdStr.slice(-8)}-${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      
      // Clean up the URL object
      window.URL.revokeObjectURL(url)
      
      console.log('✅ Response export completed successfully')
      toast.success('Response exported successfully!')
    } catch (error) {
      console.error('❌ Response export error:', error)
      if (error.response?.status === 404) {
        toast.error('Response not found')
      } else if (error.response?.status === 403) {
        toast.error('Access denied')
      } else {
        toast.error('Failed to export response')
      }
    }
  }

  const renderAnswer = (answer, question) => {
    if (!answer) return <span className="text-gray-500">No answer provided</span>

    switch (answer.questionType) {
      case 'categorize':
        const categories = answer.answer || {}
        return (
          <div className="space-y-2">
            {Object.entries(categories).map(([category, items]) => (
              <div key={category} className="bg-gray-50 p-3 rounded-lg">
                <span className="font-medium text-gray-900">{category}:</span>
                <span className="ml-2 text-gray-700">{Array.isArray(items) ? items.join(', ') : items}</span>
              </div>
            ))}
          </div>
        )
      
      case 'cloze':
        const blanks = answer.answer || {}
        return (
          <div className="space-y-2">
            {Object.entries(blanks).map(([blankIndex, value]) => (
              <div key={blankIndex} className="inline-block bg-blue-100 px-3 py-1 rounded mr-2 mb-2">
                <span className="font-medium">Blank {parseInt(blankIndex) + 1}:</span>
                <span className="ml-1">{value}</span>
              </div>
            ))}
          </div>
        )
      
      case 'comprehension':
        const answers = answer.answer || {}
        return (
          <div className="space-y-2">
            {Object.entries(answers).map(([qIndex, optionIndex]) => {
              const q = question.settings?.questions?.[parseInt(qIndex)]
              return (
                <div key={qIndex} className="bg-gray-50 p-3 rounded-lg">
                  <span className="font-medium text-gray-900">Q{parseInt(qIndex) + 1}:</span>
                  <span className="ml-2 text-gray-700">
                    {q?.options?.[optionIndex] || 'No answer'}
                  </span>
                </div>
              )
            })}
          </div>
        )
      
      default:
        return <span className="text-gray-700">{String(answer.answer || 'No answer')}</span>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!response) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Response not found</h2>
          <p className="text-gray-600 mb-4">The response you're looking for doesn't exist.</p>
          <Link to="/admin" className="btn-primary">
            Back to Forms
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to={`/form-responses/${response.formId?._id || response.formId}`}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Response Details</h1>
                <p className="text-gray-600 mt-1">
                  {form?.title || 'Untitled Form'} - {response._id.slice(-8)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={exportResponse}
                className="btn-primary flex items-center gap-2"
              >
                <Download size={20} />
                Export Response
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Response Info */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Response Information</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="flex items-center">
                <FileText className="h-6 w-6 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Response ID</p>
                  <p className="text-lg font-semibold text-gray-900">#{response._id.slice(-8)}</p>
                </div>
              </div>
              <div className="flex items-center">
                <User className="h-6 w-6 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Submitted By</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {response.userId?.name || 'Anonymous'}
                  </p>
                  {response.userId?.email && (
                    <p className="text-sm text-gray-500">{response.userId.email}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center">
                <Calendar className="h-6 w-6 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Submitted</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(response.submittedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <Clock className="h-6 w-6 text-orange-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Score</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {response.score !== undefined && response.maxScore !== undefined 
                      ? `${response.score}/${response.maxScore} (${Math.round((response.score / response.maxScore) * 100)}%)`
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Answers */}
        {form && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Answers</h2>
              <p className="text-sm text-gray-600 mt-1">
                {response.answers?.length || 0} questions answered
              </p>
            </div>
            <div className="p-6">
              {form.questions && form.questions.length > 0 ? (
                <div className="space-y-6">
                  {form.questions.map((question, index) => {
                    const answer = response.answers?.find(a => a.questionId === question.id)
                    return (
                      <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-lg font-medium text-gray-900">
                            {index + 1}. {question.title}
                          </h3>
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                            {question.type}
                          </span>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          {renderAnswer(answer, question)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No questions found in this form</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ResponseDetails
